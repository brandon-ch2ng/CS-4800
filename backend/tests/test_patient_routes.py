import pytest
import json
from app.database import db
from bson import ObjectId
from datetime import datetime


class TestPatientDashboard:
    """Test patient dashboard endpoint."""

    def test_dashboard_success(self, client, auth_headers_patient):
        """Test successful access to patient dashboard."""
        response = client.get("/patients/", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Welcome" in data["message"]
        assert "patient@test.com" in data["message"]

    def test_dashboard_doctor_denied(self, client, auth_headers_doctor):
        """Test that doctors cannot access patient dashboard."""
        response = client.get("/patients/", headers=auth_headers_doctor)
        assert response.status_code == 403
        data = json.loads(response.data)
        assert "Access denied" in data["error"]

    def test_dashboard_no_auth(self, client):
        """Test dashboard access without authentication."""
        response = client.get("/patients/")
        assert response.status_code == 401


class TestPatientProfile:
    """Test patient profile CRUD operations."""

    def test_get_profile_success(self, client, auth_headers_patient, sample_profile):
        """Test retrieving existing patient profile."""
        # Create profile in database
        db.patients.insert_one({
            "email": "patient@test.com",
            **sample_profile
        })
        
        response = client.get("/patients/profile", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["email"] == "patient@test.com"
        assert data["gender"] == sample_profile["gender"]
        assert data["age"] == sample_profile["age"]

    def test_get_profile_not_found(self, client, auth_headers_patient):
        """Test retrieving profile when none exists."""
        response = client.get("/patients/profile", headers=auth_headers_patient)
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "No profile found" in data["message"]

    def test_update_profile_create(self, client, auth_headers_patient, sample_profile):
        """Test creating a new profile via PUT."""
        response = client.put(
            "/patients/profile",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Profile saved successfully" in data["message"]
        
        # Verify in database
        profile = db.patients.find_one({"email": "patient@test.com"})
        assert profile is not None
        assert profile["age"] == sample_profile["age"]
        assert profile["gender"] == sample_profile["gender"]

    def test_update_profile_existing(self, client, auth_headers_patient, sample_profile):
        """Test updating an existing profile."""
        # Create initial profile
        db.patients.insert_one({
            "email": "patient@test.com",
            "age": 25,
            "gender": "female"
        })
        
        # Update with new data
        response = client.put(
            "/patients/profile",
            headers=auth_headers_patient,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 200
        
        # Verify updated data
        profile = db.patients.find_one({"email": "patient@test.com"})
        assert profile["age"] == sample_profile["age"]
        assert profile["gender"] == sample_profile["gender"]

    def test_update_profile_no_valid_fields(self, client, auth_headers_patient):
        """Test update with no valid fields."""
        response = client.put(
            "/patients/profile",
            headers=auth_headers_patient,
            data=json.dumps({"invalid_field": "value"}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "No valid fields provided" in data["error"]

    def test_update_profile_doctor_denied(self, client, auth_headers_doctor, sample_profile):
        """Test that doctors cannot update patient profiles."""
        response = client.put(
            "/patients/profile",
            headers=auth_headers_doctor,
            data=json.dumps(sample_profile),
            content_type="application/json"
        )
        assert response.status_code == 403


class TestPatientNotes:
    """Test patient notes endpoints."""

    def test_get_notes_empty(self, client, auth_headers_patient):
        """Test retrieving notes when none exist."""
        response = client.get("/patients/notes", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["notes"] == []

    def test_get_notes_success(self, client, auth_headers_patient):
        """Test retrieving visible notes."""
        # Create test notes
        note1 = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "Test note 1",
            "visible_to_patient": True,
            "created_at": datetime.utcnow()
        }
        note2 = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "Test note 2 - hidden",
            "visible_to_patient": False,
            "created_at": datetime.utcnow()
        }
        db.notes.insert_many([note1, note2])
        
        response = client.get("/patients/notes", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["notes"]) == 1
        assert data["notes"][0]["note"] == "Test note 1"

    def test_get_notes_with_prediction_id(self, client, auth_headers_patient):
        """Test filtering notes by prediction_id."""
        pred_id = ObjectId()
        note1 = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "Note for prediction",
            "visible_to_patient": True,
            "prediction_id": pred_id,
            "created_at": datetime.utcnow()
        }
        note2 = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "General note",
            "visible_to_patient": True,
            "created_at": datetime.utcnow()
        }
        db.notes.insert_many([note1, note2])
        
        response = client.get(
            f"/patients/notes?prediction_id={str(pred_id)}",
            headers=auth_headers_patient
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["notes"]) == 1
        assert data["notes"][0]["note"] == "Note for prediction"

    def test_get_single_note_success(self, client, auth_headers_patient):
        """Test retrieving a single note by ID."""
        note = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "Test note",
            "visible_to_patient": True,
            "created_at": datetime.utcnow()
        }
        result = db.notes.insert_one(note)
        note_id = str(result.inserted_id)
        
        response = client.get(
            f"/patients/notes/{note_id}",
            headers=auth_headers_patient
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["note"]["note"] == "Test note"

    def test_get_single_note_not_found(self, client, auth_headers_patient):
        """Test retrieving a non-existent note."""
        fake_id = str(ObjectId())
        response = client.get(
            f"/patients/notes/{fake_id}",
            headers=auth_headers_patient
        )
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "Note not found" in data["error"]

    def test_get_single_note_invalid_id(self, client, auth_headers_patient):
        """Test retrieving a note with invalid ID format."""
        response = client.get(
            "/patients/notes/invalid-id",
            headers=auth_headers_patient
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Invalid note_id" in data["error"]

    def test_get_notes_doctor_denied(self, client, auth_headers_doctor):
        """Test that doctors cannot access patient notes endpoint."""
        response = client.get("/patients/notes", headers=auth_headers_doctor)
        assert response.status_code == 403
