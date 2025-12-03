# Backend Testing Guide

This directory contains comprehensive test suites for the Patient Disease Prediction backend API.

## Test Structure

```
tests/
├── conftest.py                    # Pytest fixtures and configuration
├── test_auth_routes.py            # Authentication tests (register, login, me)
├── test_patient_routes.py         # Patient endpoints tests
├── test_doctor_routes.py          # Doctor endpoints tests
├── test_prediction_routes.py      # ML prediction tests
├── test_appointment_routes.py     # Appointment management tests
└── test_disease_routes.py         # Disease catalog tests
```

## Setup

### 1. Install Testing Dependencies

```bash
# Install development dependencies
pip install -r requirements-dev.txt
```

### 2. Configure Test Environment

Make sure your `.env` file is configured with a test MongoDB instance:

```bash
MONGO_URI=<your-test-mongodb-uri>
DB_NAME=<your-test-database-name>
JWT_SECRET=<your-jwt-secret>
```

> **Note:** It's recommended to use a separate test database to avoid conflicts with production data.

## Running Tests

### Run All Tests

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run with detailed output
pytest -vv
```

### Run Specific Test Files

```bash
# Test authentication only
pytest tests/test_auth_routes.py

# Test patient routes only
pytest tests/test_patient_routes.py

# Test doctor routes only
pytest tests/test_doctor_routes.py

# Test predictions only
pytest tests/test_prediction_routes.py
```

### Run Specific Test Classes

```bash
# Test only registration
pytest tests/test_auth_routes.py::TestRegister

# Test only patient profile operations
pytest tests/test_patient_routes.py::TestPatientProfile
```

### Run Specific Test Functions

```bash
# Test a single test case
pytest tests/test_auth_routes.py::TestRegister::test_register_patient_success
```

### Run Tests by Markers

```bash
# Run auth tests (if you add markers)
pytest -m auth

# Run patient tests
pytest -m patient
```

## Test Coverage

### Generate Coverage Report

```bash
# Run tests with coverage
pytest --cov=app --cov-report=html

# View coverage report
# Open htmlcov/index.html in your browser
```

### Coverage in Terminal

```bash
# Show coverage summary in terminal
pytest --cov=app --cov-report=term-missing
```

## Test Features

### Fixtures Available

- `app` - Flask application instance
- `client` - Test client for making requests
- `auth_headers_patient` - JWT headers for patient authentication
- `auth_headers_doctor` - JWT headers for doctor authentication
- `sample_patient` - Sample patient data
- `sample_doctor` - Sample doctor data
- `sample_profile` - Sample patient profile data
- `clean_test_data` - Automatic cleanup of test data

### Auto-Cleanup

All tests automatically clean up their data before and after execution using the `clean_test_data` fixture.

## Test Coverage Summary

### Authentication Routes
- ✅ User registration (patient & doctor)
- ✅ User login
- ✅ Get current user info
- ✅ Error handling for invalid inputs

### Patient Routes
- ✅ Patient dashboard access
- ✅ Profile CRUD operations
- ✅ View doctor notes
- ✅ Access control

### Doctor Routes
- ✅ Doctor dashboard access
- ✅ Add notes for patients
- ✅ View patient lists
- ✅ View patient profiles
- ✅ Access control

### Prediction Routes
- ✅ ML prediction with stored profile
- ✅ ML prediction with overrides
- ✅ Input validation
- ✅ Feature encoding
- ✅ Prediction storage

### Appointment Routes
- ✅ Create appointment requests
- ✅ View patient appointments
- ✅ View doctor appointments
- ✅ Accept/reject appointments
- ✅ Status filtering

### Disease Routes
- ✅ List all diseases
- ✅ Search by name/code/tag
- ✅ Pagination
- ✅ Get disease details
- ✅ No authentication required

## Writing New Tests

### Test Template

```python
import pytest
import json
from app.database import db

class TestYourFeature:
    """Test your feature description."""

    def test_success_case(self, client, auth_headers_patient):
        """Test successful operation."""
        response = client.post(
            "/your/endpoint",
            headers=auth_headers_patient,
            data=json.dumps({"key": "value"}),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "expected_key" in data

    def test_error_case(self, client, auth_headers_patient):
        """Test error handling."""
        response = client.post(
            "/your/endpoint",
            headers=auth_headers_patient,
            data=json.dumps({}),
            content_type="application/json"
        )
        assert response.status_code == 400
```

### Best Practices

1. **Use descriptive test names** - Names should describe what is being tested
2. **Test both success and failure cases** - Cover happy path and error scenarios
3. **Use fixtures** - Leverage existing fixtures for common setup
4. **Clean up data** - The `clean_test_data` fixture handles this automatically
5. **Test access control** - Verify role-based access restrictions
6. **Assert responses** - Check both status codes and response data

## Continuous Integration

To run tests in CI/CD:

```bash
# Install dependencies
pip install -r requirements-dev.txt

# Run tests with coverage
pytest --cov=app --cov-report=xml

# Upload coverage to your CI platform
```

## Troubleshooting

### Database Connection Issues

If tests fail due to MongoDB connection:
1. Verify your `MONGO_URI` in `.env`
2. Ensure MongoDB is running
3. Check network connectivity

### JWT Token Issues

If authentication tests fail:
1. Verify `JWT_SECRET` is set in `.env`
2. Check token expiration settings

### Import Errors

If you get import errors:
```bash
# Make sure you're in the backend directory
cd backend

# Install the package in development mode
pip install -e .
```

## Test Statistics

Run this to see test statistics:

```bash
pytest --tb=no -q
```

## Need Help?

- Check the test files for examples
- Review the conftest.py for available fixtures
- Ensure all dependencies are installed
