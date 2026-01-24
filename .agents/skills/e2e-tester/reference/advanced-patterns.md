# Advanced E2E Patterns

> **Note:** Examples marked **(MCP)** use playwriter MCP functions for exploration.
> Convert to CI-safe Playwright waits before committing tests.

## Page Object Pattern

Organize test logic by page/component using classes or factory functions:

```ts
// Page object as a class (CI-ready)
class LoginPage {
  constructor(private page: Page) {
    this.url = 'http://localhost:3000/login';
  }
  private url: string;

  async goto() {
    await this.page.goto(this.url);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async login(email: string, pass: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(pass);
    await this.page.getByRole('button', { name: /sign in/i }).click();
    await this.page.waitForURL(/\/dashboard/);
  }

  async getError() {
    return this.page.getByRole('alert').textContent();
  }
}

class DashboardPage {
  constructor(private page: Page) {}

  async getWelcomeMessage() {
    return this.page.getByRole('heading', { level: 1 }).textContent();
  }

  async logout() {
    await this.page.getByTestId('user-menu').click();
    await this.page.getByRole('menuitem', { name: /logout/i }).click();
  }
}

// Usage in test
const loginPage = new LoginPage(page);
await loginPage.goto();
await loginPage.login('test@example.com', 'password123');
```

## Multi-Page Flows

Complex user journeys using flow classes:

```ts
// E-commerce checkout flow (CI-ready)
class CheckoutFlow {
  constructor(private page: Page) {}

  async addToCart(productId: string) {
    await this.page.goto(`http://localhost:3000/products/${productId}`);
    await this.page.getByRole('button', { name: /add to cart/i }).click();
    await this.page.getByText('Added to cart').waitFor();
  }
  
  async goToCart() {
    await this.page.getByTestId('cart-icon').click();
    await this.page.waitForLoadState('domcontentloaded');
  }
  
  async fillShipping(data: { address: string; city: string; zip: string }) {
    await this.page.getByLabel('Address').fill(data.address);
    await this.page.getByLabel('City').fill(data.city);
    await this.page.getByLabel('ZIP').fill(data.zip);
    await this.page.getByRole('button', { name: /continue/i }).click();
  }
  
  async fillPayment(card: { number: string; expiry: string; cvc: string }) {
    const frame = this.page.frameLocator('#payment-frame');
    await frame.getByLabel('Card number').fill(card.number);
    await frame.getByLabel('Expiry').fill(card.expiry);
    await frame.getByLabel('CVC').fill(card.cvc);
  }
  
  async placeOrder() {
    await this.page.getByRole('button', { name: /place order/i }).click();
    await this.page.waitForURL(/\/order-confirmation/);
    return await this.page.getByTestId('order-id').textContent();
  }
}

// Usage
const checkout = new CheckoutFlow(page);
await checkout.addToCart('prod-123');
await checkout.goToCart();
await checkout.fillShipping({ address: '123 Main', city: 'NYC', zip: '10001' });
await checkout.fillPayment({ number: '4242424242424242', expiry: '12/25', cvc: '123' });
const orderId = await checkout.placeOrder();
console.log('Order placed:', orderId);
```

## Handling Dynamic Content

### Wait for Specific Conditions

```js
// Wait for element with text
await page.locator('text=Loading complete').waitFor({ state: 'visible', timeout: 10000 });

// Wait for element count
await page.waitForFunction(() => document.querySelectorAll('.item').length >= 10);

// Wait for network idle after action
await page.locator('button.load-more').click();
await page.waitForLoadState('networkidle', { timeout: 5000 });
```

### Polling Pattern

```ts
// Prefer Playwright's built-in waits when possible:
await expect(page.locator('.notification')).toBeVisible();

// Custom polling only if built-ins don't fit:
async function waitUntil(page, condition, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) return true;
    await page.waitForTimeout(200); // Last resort
  }
  throw new Error('Condition timeout');
}

await waitUntil(page, async () => {
  const count = await page.locator('.notification').count();
  return count > 0;
});
```

## Handling Popups & Modals

```js
// Capture popup window
const [popup] = await Promise.all([
  page.waitForEvent('popup'),
  page.locator('a.open-popup').click()
]);
await popup.waitForLoadState();
console.log('Popup URL:', popup.url());
await popup.close();

// Modal dialog
await page.locator('button.open-modal').click();
await page.locator('.modal').waitFor({ state: 'visible' });
await page.locator('.modal button.confirm').click();
await page.locator('.modal').waitFor({ state: 'hidden' });
```

## File Upload Testing

```js
// Single file
await page.locator('input[type="file"]').setInputFiles('/path/to/file.pdf');

// Multiple files
await page.locator('input[type="file"]').setInputFiles([
  '/path/to/file1.pdf',
  '/path/to/file2.pdf'
]);

// Clear file input
await page.locator('input[type="file"]').setInputFiles([]);
```

## Drag and Drop

```js
// Drag element to target
await page.locator('.draggable').dragTo(page.locator('.drop-zone'));

// Or with coordinates
const source = await page.locator('.draggable').boundingBox();
const target = await page.locator('.drop-zone').boundingBox();
await page.mouse.move(source.x + source.width/2, source.y + source.height/2);
await page.mouse.down();
await page.mouse.move(target.x + target.width/2, target.y + target.height/2);
await page.mouse.up();
```

## Keyboard Navigation

```js
// Tab through form
await page.keyboard.press('Tab');
await page.keyboard.press('Tab');
await page.keyboard.type('Hello World');
await page.keyboard.press('Enter');

// Shortcuts
await page.keyboard.press('Control+a'); // Select all
await page.keyboard.press('Control+c'); // Copy
```

## Responsive Testing

### Exploration **(MCP)**
```js
// Visual inspection with MCP
await page.setViewportSize({ width: 375, height: 667 });
await page.goto('http://localhost:3000');
await screenshotWithAccessibilityLabels({ page }); // MCP-only
```

### CI-ready
```ts
// Viewport testing in committed tests
test.describe('responsive', () => {
  test('mobile layout', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByTestId('mobile-menu')).toBeVisible();
  });

  test('desktop layout', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page.getByTestId('desktop-nav')).toBeVisible();
  });
});
```

## Test Data Management

Use local variables and Playwright fixtures for test data:

```js
// Generate unique test data per test
function createTestUser() {
  return {
    email: `test-${Date.now()}@example.com`,
    password: 'Test123!'
  };
}

// Track resources for cleanup (local variable)
const createdIds = [];

// Create and track
const user = createTestUser();
// ... create user via API or UI ...
createdIds.push(userId);

// Cleanup at test end
for (const id of createdIds) {
  await page.evaluate(async (id) => {
    await fetch(`/api/users/${id}`, { method: 'DELETE' });
  }, id);
}
```

### Playwright Fixtures (CI-ready)

```typescript
// fixtures.ts - for real test suites
import { test as base } from '@playwright/test';

export const test = base.extend<{ testUser: { email: string; id: string } }>({
  testUser: async ({ page }, use) => {
    // Setup: create user
    const email = `test-${Date.now()}@example.com`;
    const res = await page.request.post('/api/users', { data: { email } });
    const { id } = await res.json();
    
    await use({ email, id });
    
    // Teardown: delete user
    await page.request.delete(`/api/users/${id}`);
  },
});
```

## Security Testing Patterns

> ⚠️ **Note:** These are heuristic smoke checks, not a security audit.
> Use dedicated security tools (OWASP ZAP, Burp Suite) for thorough testing.

### XSS Testing (Smoke Check)

```ts
const xssPayloads = [
  '<script>alert("xss")</script>',
  '"><img src=x onerror=alert(1)>',
  "'-alert(1)-'"
];

for (const payload of xssPayloads) {
  await page.getByLabel('Search').fill(payload);
  await page.getByRole('button', { name: /search/i }).click();
  await page.waitForLoadState('networkidle');
  
  // Heuristic: check if payload appears unescaped
  const html = await page.content();
  if (html.includes(payload) && !html.includes(payload.replace(/</g, '&lt;'))) {
    console.warn('Potential XSS vulnerability with:', payload);
  }
}
```

### CSRF Token Validation

```js
// Verify CSRF token present
const csrfInput = await page.locator('input[name="_csrf"]').count();
if (csrfInput === 0) {
  console.warn('No CSRF token found in form');
}

// Verify token changes per session
const token1 = await page.locator('input[name="_csrf"]').inputValue();
await page.reload();
const token2 = await page.locator('input[name="_csrf"]').inputValue();
console.log('CSRF tokens unique:', token1 !== token2);
```

### Auth Boundary Testing

```js
// Test protected route without auth
await page.goto('http://localhost:3000/admin');
if (!page.url().includes('/login')) {
  throw new Error('Protected route accessible without auth');
}

// Test with invalid token
await page.evaluate(() => {
  localStorage.setItem('token', 'invalid-token');
});
await page.goto('http://localhost:3000/admin');
if (!page.url().includes('/login')) {
  throw new Error('Invalid token accepted');
}
```
