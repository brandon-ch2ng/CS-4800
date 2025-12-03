import pytest
from app.main import create_app
from app.database import db
from werkzeug.security import generate_password_hash
from flask_jwt_extended import create_access_token


@pytest.fixture
def app():
    """Create and configure a test app instance."""
    app = create_app()
    app.config["TESTING"] = True
    app.config["JWT_SECRET_KEY"] = "test-secret-key"
    yield app


@pytest.fixture
def client(app):
    """Create a test client for the app."""
    return app.test_client()


@pytest.fixture
def runner(app):
    """Create a test CLI runner."""
    return app.test_cli_runner()


@pytest.fixture
def auth_headers_patient(app):
    """Generate JWT token for a test patient."""
    with app.app_context():
        token = create_access_token(
            identity="patient@test.com",
            additional_claims={"role": "patient"}
        )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_doctor(app):
    """Generate JWT token for a test doctor."""
    with app.app_context():
        token = create_access_token(
            identity="doctor@test.com",
            additional_claims={"role": "doctor"}
        )
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_patient():
    """Sample patient data for testing."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "patient@test.com",
        "password": "testpass123",
        "role": "patient"
    }


@pytest.fixture
def sample_doctor():
    """Sample doctor data for testing."""
    return {
        "first_name": "Dr. Jane",
        "last_name": "Smith",
        "email": "doctor@test.com",
        "password": "doctorpass123",
        "role": "doctor"
    }


@pytest.fixture
def sample_profile():
    """Sample patient profile data."""
    return {
        "gender": "male",
        "age": 30,
        "fever": "yes",
        "cough": "no",
        "fatigue": "yes",
        "difficulty_breathing": "no",
        "blood_pressure": "normal",
        "cholesterol_level": "normal"
    }


@pytest.fixture(autouse=True)
def clean_test_data():
    """Clean up test data before and after each test."""
    # Clean before test
    test_emails = ["patient@test.com", "doctor@test.com", "patient2@test.com"]
    db.users.delete_many({"email": {"$in": test_emails}})
    db.patients.delete_many({"email": {"$in": test_emails}})
    db.predictions.delete_many({"patient_email": {"$in": test_emails}})
    db.notes.delete_many({"patient_email": {"$in": test_emails}})
    db.appointments.delete_many({"patient_email": {"$in": test_emails}})
    
    yield
    
    # Clean after test
    db.users.delete_many({"email": {"$in": test_emails}})
    db.patients.delete_many({"email": {"$in": test_emails}})
    db.predictions.delete_many({"patient_email": {"$in": test_emails}})
    db.notes.delete_many({"patient_email": {"$in": test_emails}})
    db.appointments.delete_many({"patient_email": {"$in": test_emails}})
