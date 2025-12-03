# Frontend Test Suite - File Structure

## 📁 Complete Directory Layout

```
frontend/
├── src/
│   ├── __tests__/
│   │   ├── components/
│   │   │   ├── Login.test.jsx                    (8 tests)
│   │   │   ├── Signup.test.jsx                   (8 tests)
│   │   │   └── ProtectedRoute.test.jsx           (4 tests)
│   │   │
│   │   ├── pages/
│   │   │   ├── patient/
│   │   │   │   ├── PatientDashboard.test.jsx     (10 tests)
│   │   │   │   ├── PatientSurvey.test.jsx        (7 tests)
│   │   │   │   ├── AiPredictionPanel.test.jsx    (8 tests)
│   │   │   │   └── AppointmentBooking.test.jsx   (8 tests)
│   │   │   │
│   │   │   └── doctor/
│   │   │       └── DoctorDashboard.test.jsx      (7 tests)
│   │   │
│   │   └── integration/
│   │       └── authFlow.test.jsx                 (4 tests)
│   │
│   ├── __mocks__/
│   │   ├── handlers.js                          # MSW request handlers
│   │   └── server.js                            # MSW server setup
│   │
│   ├── test-utils.jsx                           # Custom test utilities
│   └── setupTests.js                            # Global test configuration
│
├── coverage/                                    # Generated coverage reports
│   ├── index.html                              # HTML coverage report
│   └── lcov.info                               # LCOV format
│
├── vitest.config.js                            # Vitest configuration
├── package.json                                # Dependencies & scripts
├── run-tests.sh                                # Test runner (Linux/Mac)
├── run-tests.bat                               # Test runner (Windows)
├── README.md                                   # Complete documentation
├── QUICKSTART.md                               # Quick start guide
└── FILE_STRUCTURE.md                           # This file
```

## 📊 Test Statistics

### Test Files by Category

| Category | Files | Tests | Description |
|----------|-------|-------|-------------|
| **Components** | 3 | 20 | Core UI components |
| **Patient Pages** | 4 | 33 | Patient dashboard, survey, AI, appointments |
| **Doctor Pages** | 1 | 7 | Doctor dashboard functionality |
| **Integration** | 1 | 4 | End-to-end user flows |
| **Total** | **9** | **64+** | Complete test coverage |

### Configuration Files

| File | Purpose |
|------|---------|
| `vitest.config.js` | Test framework configuration |
| `setupTests.js` | Global test setup, MSW integration |
| `test-utils.jsx` | Custom render functions, helpers |
| `package.json` | Dependencies and test scripts |

### Mock Files

| File | Lines | Purpose |
|------|-------|---------|
| `handlers.js` | ~450 | MSW request handlers for all endpoints |
| `server.js` | ~5 | MSW server setup |

## 🎯 Test Coverage by Feature

### Authentication (20 tests)
- ✅ Login form validation
- ✅ Signup flow with password validation
- ✅ Protected route access control
- ✅ JWT token handling
- ✅ Role-based redirection

### Patient Features (33 tests)
- ✅ Dashboard data loading
- ✅ Profile survey (initial & edit)
- ✅ AI health prediction
- ✅ Appointment booking
- ✅ Doctor notes viewing
- ✅ Real-time form validation

### Doctor Features (7 tests)
- ✅ Patient lookup
- ✅ Note management
- ✅ Appointment handling
- ✅ Patient profile viewing
- ✅ Status filtering

### Integration (4 tests)
- ✅ Complete signup-to-login flow
- ✅ Auth state management
- ✅ Route protection
- ✅ Role-based navigation

## 📝 File Descriptions

### Core Test Files

#### `Login.test.jsx`
Tests for login form:
- Form rendering
- Field validation
- Successful login
- Error handling
- Navigation

#### `Signup.test.jsx`
Tests for registration:
- Form validation
- Password strength
- Password matching
- Email uniqueness
- Role selection

#### `ProtectedRoute.test.jsx`
Tests for route protection:
- Unauthorized access blocking
- Token validation
- Redirect behavior

#### `PatientDashboard.test.jsx`
Tests for patient dashboard:
- Data loading
- Profile display
- Survey triggering
- Feature sections
- Edit mode

#### `PatientSurvey.test.jsx`
Tests for health survey:
- Form rendering
- Field validation
- Data submission
- Edit mode
- Error handling

#### `AiPredictionPanel.test.jsx`
Tests for AI prediction:
- Prediction execution
- Override inputs
- Chatbot interaction
- Result display
- Error states

#### `AppointmentBooking.test.jsx`
Tests for appointments:
- Form validation
- Time slot selection
- Date validation
- Submission
- Error handling

#### `DoctorDashboard.test.jsx`
Tests for doctor dashboard:
- Patient search
- Note creation
- Appointment management
- Profile viewing

#### `authFlow.test.jsx`
Integration tests:
- Complete user flows
- Multi-page navigation
- Auth state persistence

### Configuration Files

#### `vitest.config.js`
- Test environment (jsdom)
- Coverage settings
- Setup files
- File patterns

#### `setupTests.js`
- Jest-DOM matchers
- MSW server lifecycle
- Global mocks
- Cleanup functions

#### `test-utils.jsx`
- Custom render with router
- Auth setup helpers
- Mock data generators
- Test utilities

### Mock Files

#### `handlers.js`
MSW handlers for:
- Auth endpoints
- Patient endpoints
- Doctor endpoints
- Appointment endpoints
- Prediction endpoint

#### `server.js`
- MSW server configuration
- Handler registration

## 🚀 Quick Access

### Run Specific Test Files

```bash
# Component tests
npm test -- Login.test.jsx
npm test -- Signup.test.jsx
npm test -- ProtectedRoute.test.jsx

# Patient page tests
npm test -- PatientDashboard.test.jsx
npm test -- PatientSurvey.test.jsx
npm test -- AiPredictionPanel.test.jsx
npm test -- AppointmentBooking.test.jsx

# Doctor page tests
npm test -- DoctorDashboard.test.jsx

# Integration tests
npm test -- authFlow.test.jsx
```

### Run by Category

```bash
./run-tests.sh components
./run-tests.sh pages
./run-tests.sh integration
./run-tests.sh patient
./run-tests.sh doctor
```

## 📈 Coverage Breakdown

Expected coverage by directory:

| Directory | Target | Description |
|-----------|--------|-------------|
| `components/` | 90%+ | Core reusable components |
| `pages/` | 85%+ | Page-level components |
| `auth/` | 95%+ | Authentication logic |
| `Overall` | 80%+ | Total code coverage |

## 🔄 Test Workflow

1. **Write Component** → `src/pages/MyComponent.jsx`
2. **Create Test** → `src/__tests__/pages/MyComponent.test.jsx`
3. **Add Mock Data** → `src/__mocks__/handlers.js` (if API calls)
4. **Run Tests** → `npm test`
5. **Check Coverage** → `npm run test:coverage`

## 📚 Additional Resources

- [Main README](./README.md) - Complete documentation
- [Quick Start](./QUICKSTART.md) - Get started quickly
- [Test Utilities](./src/test-utils.jsx) - Helper functions
- [MSW Handlers](./src/__mocks__/handlers.js) - API mocks

---

**Last Updated**: December 2024  
**Total Test Files**: 9  
**Total Tests**: 64+  
**Coverage Goal**: 80%+
