import pytest
import json
from app.database import db
from werkzeug.security import generate_password_hash


class TestRegister:
    """Test user registration endpoint."""

    def test_register_patient_success(self, client, sample_patient):
        """Test successful patient registration."""
        response = client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["message"] == "Patient registered successfully"
        
        # Verify user was created in database
        user = db.users.find_one({"email": sample_patient["email"]})
        assert user is not None
        assert user["first_name"] == sample_patient["first_name"]
        assert user["role"] == "patient"

    def test_register_doctor_success(self, client, sample_doctor):
        """Test successful doctor registration."""
        response = client.post(
            "/auth/register",
            data=json.dumps(sample_doctor),
            content_type="application/json"
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert data["message"] == "Doctor registered successfully"

    def test_register_missing_fields(self, client):
        """Test registration with missing required fields."""
        incomplete_data = {
            "first_name": "John",
            "email": "test@test.com"
            # missing last_name, password, role
        }
        response = client.post(
            "/auth/register",
            data=json.dumps(incomplete_data),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Missing required fields" in data["error"]

    def test_register_invalid_role(self, client, sample_patient):
        """Test registration with invalid role."""
        sample_patient["role"] = "admin"
        response = client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Invalid role" in data["error"]

    def test_register_duplicate_email(self, client, sample_patient):
        """Test registration with existing email."""
        # Register first time
        client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        # Try to register again
        response = client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Email already exists" in data["error"]


class TestLogin:
    """Test user login endpoint."""

    def test_login_success(self, client, sample_patient):
        """Test successful login."""
        # First register
        client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        
        # Then login
        login_data = {
            "email": sample_patient["email"],
            "password": sample_patient["password"]
        }
        response = client.post(
            "/auth/login",
            data=json.dumps(login_data),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "token" in data
        assert data["role"] == "patient"
        assert data["first_name"] == sample_patient["first_name"]
        assert data["last_name"] == sample_patient["last_name"]

    def test_login_missing_credentials(self, client):
        """Test login with missing credentials."""
        response = client.post(
            "/auth/login",
            data=json.dumps({"email": "test@test.com"}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Missing email or password" in data["error"]

    def test_login_invalid_email(self, client):
        """Test login with non-existent email."""
        response = client.post(
            "/auth/login",
            data=json.dumps({
                "email": "nonexistent@test.com",
                "password": "password123"
            }),
            content_type="application/json"
        )
        assert response.status_code == 401
        data = json.loads(response.data)
        assert "Invalid credentials" in data["error"]

    def test_login_wrong_password(self, client, sample_patient):
        """Test login with incorrect password."""
        # Register user
        client.post(
            "/auth/register",
            data=json.dumps(sample_patient),
            content_type="application/json"
        )
        
        # Try login with wrong password
        response = client.post(
            "/auth/login",
            data=json.dumps({
                "email": sample_patient["email"],
                "password": "wrongpassword"
            }),
            content_type="application/json"
        )
        assert response.status_code == 401
        data = json.loads(response.data)
        assert "Invalid credentials" in data["error"]


class TestMe:
    """Test /auth/me endpoint."""

    def test_me_success_patient(self, client, auth_headers_patient, sample_patient):
        """Test /me endpoint for patient."""
        # Create user in database
        db.users.insert_one({
            "first_name": sample_patient["first_name"],
            "last_name": sample_patient["last_name"],
            "email": sample_patient["email"],
            "password": generate_password_hash(sample_patient["password"]),
            "role": "patient"
        })
        
        response = client.get("/auth/me", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["email"] == sample_patient["email"]
        assert data["role"] == "patient"
        assert data["first_name"] == sample_patient["first_name"]

    def test_me_success_doctor(self, client, auth_headers_doctor, sample_doctor):
        """Test /me endpoint for doctor."""
        # Create user in database
        db.users.insert_one({
            "first_name": sample_doctor["first_name"],
            "last_name": sample_doctor["last_name"],
            "email": sample_doctor["email"],
            "password": generate_password_hash(sample_doctor["password"]),
            "role": "doctor"
        })
        
        response = client.get("/auth/me", headers=auth_headers_doctor)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["email"] == sample_doctor["email"]
        assert data["role"] == "doctor"

    def test_me_without_auth(self, client):
        """Test /me endpoint without authentication."""
        response = client.get("/auth/me")
        assert response.status_code == 401

    def test_me_user_not_found(self, client, auth_headers_patient):
        """Test /me endpoint when user doesn't exist in database."""
        response = client.get("/auth/me", headers=auth_headers_patient)
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "User not found" in data["error"]
