# CI/CD Integration

## GitHub Actions

### Basic E2E Workflow

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
        
      - name: Start app
        run: npm run dev &
        env:
          CI: true
          
      - name: Wait for app
        run: npx wait-on http://localhost:3000 -t 60000
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: e2e-artifacts
          path: |
            test-results/
            playwright-report/
```

### Matrix Testing (Multiple Browsers)

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
```

### With Docker Compose

```yaml
jobs:
  e2e:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - run: docker-compose up -d app
      - run: npx wait-on http://localhost:3000
      - run: npm run test:e2e
      - run: docker-compose down
```

## GitLab CI

```yaml
# .gitlab-ci.yml
e2e:
  image: mcr.microsoft.com/playwright:v1.40.0-jammy
  stage: test
  services:
    - name: postgres:15
      alias: db
  variables:
    DATABASE_URL: postgres://postgres:test@db:5432/test
  script:
    - npm ci
    - npm run build
    - npm run start &
    - npx wait-on http://localhost:3000
    - npm run test:e2e
  artifacts:
    when: always
    paths:
      - test-results/
    expire_in: 1 week
```

## Docker Setup

### Playwright Dockerfile

```dockerfile
# Dockerfile.e2e
FROM mcr.microsoft.com/playwright:v1.40.0-jammy

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

CMD ["npm", "run", "test:e2e"]
```

### Docker Compose for Local Testing

```yaml
# docker-compose.e2e.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgres://postgres:test@db:5432/test
    depends_on:
      - db

  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: test
    ports:
      - "5432:5432"

  e2e:
    build:
      context: .
      dockerfile: Dockerfile.e2e
    depends_on:
      - app
    environment:
      - BASE_URL=http://app:3000
    volumes:
      - ./test-results:/app/test-results
```

Run: `docker-compose -f docker-compose.e2e.yml up --abort-on-container-exit`

## Test Configuration

### playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/junit.xml' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } }
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI
  }
});
```

## Flakiness Prevention

### Retry Configuration

```typescript
// Per-test retry
test('flaky test', async ({ page }) => {
  test.info().annotations.push({ type: 'retry', description: 'Network dependent' });
  // test code
});

// Global retry for specific tests
test.describe('API tests', () => {
  test.describe.configure({ retries: 3 });
  // tests
});
```

### Sharding for Large Test Suites

```yaml
# GitHub Actions with sharding
jobs:
  e2e:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - run: npx playwright test --shard=${{ matrix.shard }}/4
```

### Test Isolation

```typescript
// Reset state before each test
test.beforeEach(async ({ page }) => {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.context().clearCookies();
});
```

## Reporting

### JUnit for CI Integration

```typescript
// playwright.config.ts
reporter: [
  ['junit', { outputFile: 'results.xml' }]
]
```

### HTML Report with Traces

```typescript
reporter: [['html', { open: 'never' }]]
use: {
  trace: 'retain-on-failure',
  video: 'retain-on-failure'
}
```

### Custom Reporter

```typescript
// reporters/slack.ts
import type { Reporter, TestCase, TestResult } from '@playwright/test/reporter';

class SlackReporter implements Reporter {
  onTestEnd(test: TestCase, result: TestResult) {
    if (result.status === 'failed') {
      // Send to Slack
      fetch(process.env.SLACK_WEBHOOK!, {
        method: 'POST',
        body: JSON.stringify({
          text: `❌ Test failed: ${test.title}\n${result.error?.message}`
        })
      });
    }
  }
}
export default SlackReporter;
```

## Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:3000
TEST_USER_EMAIL=e2e@test.com
TEST_USER_PASSWORD=testpass123

# For CI, set these as secrets
STRIPE_TEST_KEY=sk_test_xxx
SENDGRID_API_KEY=xxx
```

Access in tests:

```typescript
const email = process.env.TEST_USER_EMAIL!;
await page.locator('input[name="email"]').fill(email);
```

## Parallelization Strategy

```typescript
// Group tests that can't run in parallel
test.describe.serial('checkout flow', () => {
  test('add to cart', async ({ page }) => {});
  test('checkout', async ({ page }) => {});
  test('payment', async ({ page }) => {});
});

// Independent tests run in parallel by default
test('login', async ({ page }) => {});
test('signup', async ({ page }) => {});
```
