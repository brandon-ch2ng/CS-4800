# Frontend Test Suite - Patient Disease Prediction App

Comprehensive test suite for the React frontend application using Vitest, React Testing Library, and Mock Service Worker (MSW).

## 📋 Table of Contents

- [Overview](#overview)
- [Installation](#installation)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Coverage](#coverage)
- [Writing Tests](#writing-tests)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This test suite provides comprehensive coverage for:
- **Component Tests**: Individual component rendering and functionality
- **Integration Tests**: Multi-component user flows
- **API Mocking**: MSW for realistic backend simulation
- **Authentication**: Protected routes and role-based access
- **User Interactions**: Form submissions, navigation, data fetching

### Test Statistics

- **Total Test Files**: 11+
- **Component Tests**: 8 files
- **Integration Tests**: 3 files
- **Mock Handlers**: Complete API coverage
- **Test Utilities**: Custom renders and helpers

## 📦 Installation

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install all required dependencies including:
- `vitest` - Fast unit test framework
- `@testing-library/react` - React component testing utilities
- `@testing-library/user-event` - User interaction simulation
- `@testing-library/jest-dom` - Custom matchers for DOM
- `msw` - API mocking
- `jsdom` - DOM implementation for Node.js

### 2. Verify Installation

```bash
npm run test -- --version
```

## 🚀 Running Tests

### All Tests

```bash
npm test
```

### Watch Mode (Recommended for Development)

```bash
npm test
```

Tests will re-run automatically when files change.

### Single Run (CI/CD)

```bash
npm run test:run
```

### With Coverage

```bash
npm run test:coverage
```

Opens HTML coverage report in browser.

### UI Mode (Interactive)

```bash
npm run test:ui
```

Opens Vitest UI for interactive test exploration.

### Specific Test Files

```bash
# Run specific test file
npm test -- Login.test.jsx

# Run tests matching pattern
npm test -- patient

# Run only tests in specific directory
npm test -- __tests__/components/
```

### Filter by Test Name

```bash
# Run tests with "login" in the name
npm test -- -t "login"

# Run tests matching pattern
npm test -- -t "successfully logs in"
```

## 📁 Test Structure

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Login.test.jsx
│   │   │   ├── Signup.test.jsx
│   │   │   └── ProtectedRoute.test.jsx
│   │   ├── pages/
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.test.jsx
│   │   │   │   ├── PatientSurvey.test.jsx
│   │   │   │   ├── AiPredictionPanel.test.jsx
│   │   │   │   └── AppointmentBooking.test.jsx
│   │   │   └── doctor/
│   │   │       └── DoctorDashboard.test.jsx
│   │   └── integration/
│   │       └── authFlow.test.jsx
│   ├── __mocks__/
│   │   ├── handlers.js          # MSW request handlers
│   │   └── server.js            # MSW server setup
│   ├── test-utils.jsx           # Custom test utilities
│   └── setupTests.js            # Test configuration
├── vitest.config.js             # Vitest configuration
└── package.json                 # Dependencies and scripts
```

## 📊 Coverage

### View Coverage Report

```bash
npm run test:coverage
```

The coverage report will be generated in `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools

### Coverage Goals

- **Overall**: 80%+
- **Components**: 85%+
- **Pages**: 80%+
- **Utils**: 90%+

### Check Coverage in CI

```bash
npm run test:coverage -- --reporter=json --reporter=json-summary
```

## ✍️ Writing Tests

### Basic Component Test

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Test with User Interaction

```jsx
import userEvent from '@testing-library/user-event';

it('handles button click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);
  
  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked!')).toBeInTheDocument();
});
```

### Test with Router

```jsx
import { BrowserRouter } from 'react-router-dom';

it('navigates correctly', () => {
  render(
    <BrowserRouter>
      <MyComponent />
    </BrowserRouter>
  );
});
```

### Test with Authentication

```jsx
import { setupAuthUser } from '../test-utils';

it('shows authenticated content', () => {
  setupAuthUser('patient');
  render(<ProtectedComponent />);
  expect(screen.getByText('Welcome')).toBeInTheDocument();
});
```

### Async Data Testing

```jsx
import { waitFor } from '@testing-library/react';

it('loads data', async () => {
  render(<DataComponent />);
  
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument();
  });
});
```

### Mock API Responses

```jsx
import { server } from '../__mocks__/server';
import { http, HttpResponse } from 'msw';

it('handles API error', async () => {
  server.use(
    http.get('/api/data', () => {
      return HttpResponse.json(
        { error: 'Server error' },
        { status: 500 }
      );
    })
  );
  
  render(<DataComponent />);
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
});
```

## 🔧 Troubleshooting

### Tests Not Running

**Problem**: `npm test` command not found

**Solution**:
```bash
npm install
```

### Module Not Found Errors

**Problem**: Cannot find module '@testing-library/react'

**Solution**:
```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom
```

### Mock Service Worker Not Working

**Problem**: API calls not being intercepted

**Solution**: Check that `setupTests.js` imports and starts the MSW server:
```javascript
import { server } from './__mocks__/server';
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### Tests Timing Out

**Problem**: Tests hang or timeout

**Solution**: Increase timeout in `vitest.config.js`:
```javascript
test: {
  testTimeout: 10000, // 10 seconds
}
```

### Coverage Not Generating

**Problem**: No coverage report created

**Solution**: Install coverage provider:
```bash
npm install --save-dev @vitest/coverage-v8
```

### Component Not Updating

**Problem**: State changes not reflected in tests

**Solution**: Use `waitFor` for async updates:
```javascript
await waitFor(() => {
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### LocalStorage Issues

**Problem**: LocalStorage not persisting between tests

**Solution**: Clear storage in `beforeEach`:
```javascript
beforeEach(() => {
  localStorage.clear();
});
```

## 🎓 Best Practices

1. **Test User Behavior**: Focus on what users see and do, not implementation
2. **Use Accessibility Queries**: Prefer `getByRole`, `getByLabelText`
3. **Wait for Async**: Always use `waitFor` for async operations
4. **Clean Up**: Clear localStorage and mocks in `beforeEach`
5. **Descriptive Names**: Use clear test descriptions
6. **Arrange-Act-Assert**: Structure tests clearly
7. **Mock External Deps**: Use MSW for API calls
8. **Test Edge Cases**: Don't just test happy paths

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://testing-library.com/docs/guiding-principles)

## 🤝 Contributing

When adding new tests:

1. Place component tests in `__tests__/components/` or `__tests__/pages/`
2. Place integration tests in `__tests__/integration/`
3. Add MSW handlers in `__mocks__/handlers.js`
4. Update test utilities in `test-utils.jsx` if needed
5. Maintain 80%+ coverage
6. Follow existing patterns and naming conventions

## 📝 CI/CD Integration

### GitHub Actions Example

```yaml
name: Frontend Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

---

**Happy Testing! 🎉**

For questions or issues, please open a GitHub issue or contact the development team.
