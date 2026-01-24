# Performance & Accessibility Testing

> **Note:** Examples marked **(MCP)** use playwriter MCP functions.
> For CI tests, use standard Playwright patterns with explicit types.

## Performance Metrics

### Core Web Vitals **(MCP)**

```ts
// Capture performance metrics
const metrics = await page.evaluate(() => {
  const navigation = performance.getEntriesByType('navigation')[0];
  const paint = performance.getEntriesByType('paint');
  
  return {
    // Navigation timing
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
    loadComplete: navigation.loadEventEnd - navigation.startTime,
    ttfb: navigation.responseStart - navigation.requestStart,
    
    // Paint timing
    fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime,
    fp: paint.find(p => p.name === 'first-paint')?.startTime
  };
});

console.log('Performance Metrics:', metrics);

// Assertions
if (metrics.domContentLoaded > 3000) {
  console.warn('DOM load slow:', metrics.domContentLoaded, 'ms');
}
if (metrics.fcp > 2500) {
  console.warn('FCP slow:', metrics.fcp, 'ms');
}
```

### Largest Contentful Paint (LCP) **(MCP)**

```ts
// Observe LCP
const lcp = await page.evaluate(() => {
  return new Promise(resolve => {
    new PerformanceObserver(list => {
      const entries = list.getEntries();
      resolve(entries[entries.length - 1].startTime);
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    
    // Fallback timeout
    setTimeout(() => resolve(null), 5000);
  });
});

console.log('LCP:', lcp, 'ms');
if (lcp && lcp > 2500) {
  console.warn('LCP exceeds good threshold (2.5s)');
}
```

### Cumulative Layout Shift (CLS) **(MCP)**

```ts
const cls = await page.evaluate(() => {
  return new Promise(resolve => {
    let clsValue = 0;
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      }
    }).observe({ type: 'layout-shift', buffered: true });
    
    setTimeout(() => resolve(clsValue), 3000);
  });
});

console.log('CLS:', cls);
if (cls > 0.1) {
  console.warn('CLS exceeds good threshold (0.1)');
}
```

## Resource Loading

### Monitor Network Requests

```ts
// Use local variable, not global state
const resources: Array<{ url: string; status: number; size: string | null; type: string | null }> = [];

page.on('response', res => {
  resources.push({
    url: res.url(),
    status: res.status(),
    size: res.headers()['content-length'],
    type: res.headers()['content-type']
  });
});

await page.goto('http://localhost:3000');
await page.waitForLoadState('networkidle');

// Analyze resources
const totalSize = resources.reduce((sum, r) => sum + (parseInt(r.size ?? '0') || 0), 0);
console.log('Total resources:', resources.length);
console.log('Total size:', (totalSize / 1024).toFixed(2), 'KB');

// Find large resources
const large = resources.filter(r => parseInt(r.size ?? '0') > 100000);
console.log('Large resources (>100KB):', large.map(r => r.url));

// Clean up listener
page.removeAllListeners('response');
```

### Check for Blocking Resources **(MCP)**

```ts
const blocking = await page.evaluate(() => {
  const scripts = Array.from(document.querySelectorAll('script:not([async]):not([defer])'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
  
  return {
    blockingScripts: scripts.map(s => s.src).filter(Boolean),
    blockingStyles: styles.map(s => s.href)
  };
});

if (blocking.blockingScripts.length > 2) {
  console.warn('Too many render-blocking scripts:', blocking.blockingScripts);
}
```

## Memory & CPU

### Memory Usage **(MCP)**

```ts
const cdp = await getCDPSession({ page });
const { usedSize, totalSize } = await cdp.send('Runtime.getHeapUsage');

console.log('Heap used:', (usedSize / 1024 / 1024).toFixed(2), 'MB');
console.log('Heap total:', (totalSize / 1024 / 1024).toFixed(2), 'MB');

if (usedSize > 50 * 1024 * 1024) {
  console.warn('High memory usage detected');
}
```

### Memory Leak Detection **(MCP)**

```ts
// Take heap snapshot before action
const cdp = await getCDPSession({ page });
await cdp.send('HeapProfiler.enable');

const heapBefore = await cdp.send('Runtime.getHeapUsage');

// Perform actions that might leak
for (let i = 0; i < 10; i++) {
  await page.locator('button.open-modal').click();
  await page.locator('button.close-modal').click();
}

// Force GC and measure again
await cdp.send('HeapProfiler.collectGarbage');
const heapAfter = await cdp.send('Runtime.getHeapUsage');

const growth = heapAfter.usedSize - heapBefore.usedSize;
console.log('Memory growth:', (growth / 1024).toFixed(2), 'KB');

if (growth > 1024 * 1024) { // 1MB threshold
  console.warn('Possible memory leak detected');
}
```

## Accessibility Testing

### Full Accessibility Audit **(MCP)**

```ts
// Get accessibility tree
const a11y = await accessibilitySnapshot({ page });
console.log(a11y);

// Check for missing alt text
const images = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('img')).map(img => ({
    src: img.src,
    alt: img.alt,
    hasAlt: img.hasAttribute('alt')
  }));
});

const missingAlt = images.filter(img => !img.hasAlt || !img.alt);
if (missingAlt.length) {
  console.warn('Images missing alt text:', missingAlt.map(i => i.src));
}
```

### Form Accessibility **(MCP)**

```ts
// Check form labels
const formIssues = await page.evaluate(() => {
  const issues = [];
  const inputs = document.querySelectorAll('input, select, textarea');
  
  inputs.forEach(input => {
    const id = input.id;
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      issues.push({
        type: input.type,
        name: input.name,
        issue: 'No accessible label'
      });
    }
  });
  
  return issues;
});

if (formIssues.length) {
  console.warn('Form accessibility issues:', formIssues);
}
```

### Color Contrast **(MCP)**

```ts
// Basic contrast check (requires visual inspection or external tool)
const contrast = await page.evaluate(() => {
  const body = window.getComputedStyle(document.body);
  return {
    backgroundColor: body.backgroundColor,
    color: body.color
  };
});

console.log('Body colors:', contrast);
```

### Keyboard Navigation **(MCP)**

```ts
// Test keyboard navigation
await page.keyboard.press('Tab');
let focused = await page.evaluate(() => document.activeElement?.tagName);
console.log('First tab stop:', focused);

const tabOrder = [];
for (let i = 0; i < 10; i++) {
  await page.keyboard.press('Tab');
  const el = await page.evaluate(() => ({
    tag: document.activeElement?.tagName,
    text: document.activeElement?.textContent?.slice(0, 30)
  }));
  tabOrder.push(el);
}

console.log('Tab order:', tabOrder);
```

### ARIA Validation **(MCP)**

```ts
const ariaIssues = await page.evaluate(() => {
  const issues = [];
  
  // Check for invalid ARIA roles
  const validRoles = ['button', 'link', 'checkbox', 'radio', 'tab', 'tablist', 'tabpanel', 'menu', 'menuitem', 'dialog', 'alert', 'navigation', 'main', 'banner', 'contentinfo'];
  document.querySelectorAll('[role]').forEach(el => {
    const role = el.getAttribute('role');
    if (!validRoles.includes(role)) {
      issues.push({ element: el.tagName, role, issue: 'Unknown role' });
    }
  });
  
  // Check buttons without accessible names
  document.querySelectorAll('button').forEach(btn => {
    if (!btn.textContent?.trim() && !btn.getAttribute('aria-label')) {
      issues.push({ element: 'button', issue: 'No accessible name' });
    }
  });
  
  return issues;
});

if (ariaIssues.length) {
  console.warn('ARIA issues:', ariaIssues);
}
```

## Load Testing Pattern

> ⚠️ **Note:** This is a client-side concurrency smoke test, not real load testing.
> For actual load testing, use dedicated tools like k6, Artillery, or Locust.

```ts
// Client-side concurrency smoke test (browser limits apply)
async function smokeLoadTest(page, url: string, concurrency = 10, iterations = 5) {
  const results: number[] = [];
  
  for (let iter = 0; iter < iterations; iter++) {
    const batch = await Promise.all(
      Array(concurrency).fill(0).map(async () => {
        const start = Date.now();
        await page.evaluate(async (u) => {
          await fetch(u);
        }, url);
        return Date.now() - start;
      })
    );
    results.push(...batch);
  }
  
  const avg = results.reduce((a, b) => a + b, 0) / results.length;
  const max = Math.max(...results);
  const min = Math.min(...results);
  
  return { avg, max, min, total: results.length };
}

const apiResults = await smokeLoadTest(page, '/api/users', 10, 5);
console.log('Smoke load test results:', apiResults);
```

## Throttling Simulation **(MCP)**

```ts
// Simulate slow network
const cdp = await getCDPSession({ page });
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 200, // 200ms latency
  downloadThroughput: 500 * 1024, // 500kb/s
  uploadThroughput: 500 * 1024
});

// Run tests under slow conditions
await page.goto('http://localhost:3000');
await waitForPageLoad({ page });

// Reset
await cdp.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 0,
  downloadThroughput: -1,
  uploadThroughput: -1
});
```

## CPU Throttling **(MCP)**

```ts
const cdp = await getCDPSession({ page });

// 4x slowdown
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

// Test performance under throttling
const start = Date.now();
await page.locator('button.heavy-computation').click();
await page.waitForSelector('.result');
const duration = Date.now() - start;

console.log('Operation duration (throttled):', duration, 'ms');

// Reset
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
```
