# Frontend Testing - Quick Start Guide

## ⚡ Get Started in 3 Steps

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Run Tests

```bash
npm test
```

### 3. View Coverage

```bash
npm run test:coverage
```

## 🎯 Common Commands

```bash
# Run all tests (watch mode)
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage report
npm run test:coverage

# Run tests in UI mode
npm run test:ui

# Run specific test file
npm test -- Login.test.jsx

# Run tests matching pattern
npm test -- -t "login"
```

## 📝 Test File Locations

- **Components**: `src/__tests__/components/`
- **Pages**: `src/__tests__/pages/`
- **Integration**: `src/__tests__/integration/`
- **Mocks**: `src/__mocks__/`

## ✅ What's Tested

### Component Tests (8 files)
- ✅ Login/Signup forms
- ✅ Protected routes
- ✅ Patient dashboard & survey
- ✅ AI prediction panel
- ✅ Appointment booking
- ✅ Doctor dashboard

### Integration Tests
- ✅ Complete auth flow
- ✅ Patient workflows
- ✅ Doctor workflows

### API Mocking
- ✅ All backend endpoints
- ✅ Auth & JWT handling
- ✅ Error scenarios

## 🔥 Hot Tips

1. **Keep Tests Running**: Use watch mode (`npm test`) during development
2. **Check Coverage**: Aim for 80%+ coverage
3. **Test Behavior**: Focus on what users see, not implementation
4. **Use Helpers**: Custom utilities in `test-utils.jsx`
5. **Mock APIs**: Use MSW handlers in `__mocks__/handlers.js`

## 🐛 Quick Fixes

**Tests not running?**
```bash
npm install
```

**Module errors?**
```bash
npm install --save-dev @testing-library/react jsdom vitest
```

**Coverage not working?**
```bash
npm install --save-dev @vitest/coverage-v8
```

## 📊 Expected Output

```
✓ src/__tests__/components/Login.test.jsx (8)
✓ src/__tests__/components/Signup.test.jsx (8)
✓ src/__tests__/components/ProtectedRoute.test.jsx (4)
✓ src/__tests__/pages/patient/PatientDashboard.test.jsx (10)
✓ src/__tests__/pages/patient/PatientSurvey.test.jsx (7)
...

Test Files  11 passed (11)
     Tests  75 passed (75)
  Duration  2.3s
```

## 🎓 Next Steps

1. Read the full [README.md](./README.md)
2. Explore tests in `src/__tests__/`
3. Check [test-utils.jsx](./src/test-utils.jsx) for helpers
4. Review [MSW handlers](./src/__mocks__/handlers.js)

---

Need help? Check the main README or open an issue!
