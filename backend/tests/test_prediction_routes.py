import pytest
import json
from app.database import db


class TestPredict:
    """Test ML prediction endpoint."""

    def test_predict_success_with_stored_profile(self, client, auth_headers_patient, sample_profile):
        """Test prediction using stored patient profile."""
        # Create patient profile
        db.patients.insert_one({
            "email": "patient@test.com",
            **sample_profile
        })
        
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps({}),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "result" in data
        assert "label" in data["result"]
        assert "probability" in data["result"]
        assert "prediction_id" in data
        
        # Verify prediction was saved
        pred = db.predictions.find_one({"patient_email": "patient@test.com"})
        assert pred is not None
        assert "result" in pred

    def test_predict_with_request_overrides(self, client, auth_headers_patient, sample_profile):
        """Test prediction with request body overriding stored profile."""
        # Create partial profile
        db.patients.insert_one({
            "email": "patient@test.com",
            "age": 25,
            "gender": "female"
        })
        
        # Override with complete data in request
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["input_used"]["age"] == sample_profile["age"]
        assert data["input_used"]["gender"] == 0  # male encoded as 0

    def test_predict_missing_required_fields(self, client, auth_headers_patient):
        """Test prediction with incomplete data."""
        incomplete_data = {
            "age": 30,
            "gender": "male"
            # missing fever, cough, blood_pressure, etc.
        }
        
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(incomplete_data),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "error" in data
        assert "required" in data["error"].lower()

    def test_predict_invalid_age(self, client, auth_headers_patient, sample_profile):
        """Test prediction with invalid age format."""
        sample_profile["age"] = "not-a-number"
        
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "age must be an integer" in data["error"]

    def test_predict_invalid_blood_pressure(self, client, auth_headers_patient, sample_profile):
        """Test prediction with invalid blood pressure value."""
        sample_profile["blood_pressure"] = "medium"  # invalid, should be low/normal/high
        
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "blood_pressure" in data["error"]

    def test_predict_invalid_cholesterol(self, client, auth_headers_patient, sample_profile):
        """Test prediction with invalid cholesterol value."""
        sample_profile["cholesterol_level"] = "invalid"
        
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "cholesterol_level" in data["error"]

    def test_predict_boolean_variations(self, client, auth_headers_patient):
        """Test prediction with various boolean input formats."""
        # Test with "yes"/"no"
        data1 = {
            "fever": "yes",
            "cough": "no",
            "fatigue": "yes",
            "difficulty_breathing": "no",
            "blood_pressure": "normal",
            "cholesterol_level": "low",
            "age": 30,
            "gender": "male"
        }
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(data1),
            content_type="application/json"
        )
        assert response.status_code == 200
        
        # Test with "true"/"false"
        data2 = {
            "fever": "true",
            "cough": "false",
            "fatigue": "true",
            "difficulty_breathing": "false",
            "blood_pressure": "high",
            "cholesterol_level": "high",
            "age": 45,
            "gender": "female"
        }
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(data2),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["input_used"]["fever"] == 1
        assert data["input_used"]["cough"] == 0
        assert data["input_used"]["gender"] == 1  # female

    def test_predict_case_insensitive(self, client, auth_headers_patient):
        """Test that inputs are case-insensitive."""
        data = {
            "fever": "YES",
            "cough": "No",
            "fatigue": "True",
            "difficulty_breathing": "FALSE",
            "blood_pressure": "NORMAL",
            "cholesterol_level": "High",
            "age": 30,
            "gender": "MALE"
        }
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(data),
            content_type="application/json"
        )
        assert response.status_code == 200

    def test_predict_doctor_denied(self, client, auth_headers_doctor, sample_profile):
        """Test that doctors cannot make predictions."""
        response = client.post(
            "/api/predict",
            headers=auth_headers_doctor,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 403
        data = json.loads(response.data)
        assert "Access denied" in data["error"]

    def test_predict_no_auth(self, client, sample_profile):
        """Test prediction without authentication."""
        response = client.post(
            "/api/predict",
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 401

    def test_predict_result_format(self, client, auth_headers_patient, sample_profile):
        """Test that prediction result has expected format."""
        response = client.post(
            "/api/predict",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        
        # Check result structure
        assert "result" in data
        assert "label" in data["result"]
        assert "probability" in data["result"]
        assert isinstance(data["result"]["label"], int)
        assert isinstance(data["result"]["probability"], float)
        assert 0 <= data["result"]["probability"] <= 1
        
        # Check input_used contains all features
        assert "input_used" in data
        assert all(key in data["input_used"] for key in [
            "fever", "cough", "fatigue", "difficulty_breathing",
            "blood_pressure", "cholesterol_level", "age", "gender"
        ])
        
        # Check vector order is specified
        assert "vector_order" in data
        assert len(data["vector_order"]) == 8
