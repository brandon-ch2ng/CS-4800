import pytest
import json
from app.database import db
from werkzeug.security import generate_password_hash
from bson import ObjectId
from datetime import datetime


class TestDoctorDashboard:
    """Test doctor dashboard endpoint."""

    def test_dashboard_success(self, client, auth_headers_doctor):
        """Test successful access to doctor dashboard."""
        response = client.get("/doctors/", headers=auth_headers_doctor)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Welcome doctor" in data["message"]
        assert "doctor@test.com" in data["message"]

    def test_dashboard_patient_denied(self, client, auth_headers_patient):
        """Test that patients cannot access doctor dashboard."""
        response = client.get("/doctors/", headers=auth_headers_patient)
        assert response.status_code == 403
        data = json.loads(response.data)
        assert "Access denied" in data["error"]


class TestDoctorAddNote:
    """Test doctor adding notes for patients."""

    def test_add_note_success(self, client, auth_headers_doctor):
        """Test successfully adding a note."""
        # Create patient in database
        db.users.insert_one({
            "first_name": "John",
            "last_name": "Doe",
            "email": "patient@test.com",
            "password": generate_password_hash("test123"),
            "role": "patient"
        })
        
        note_data = {
            "patient_email": "patient@test.com",
            "note": "Patient shows improvement",
            "visible_to_patient": True
        }
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_doctor,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert "Note added" in data["message"]
        assert "note_id" in data
        
        # Verify in database
        note = db.notes.find_one({"patient_email": "patient@test.com"})
        assert note is not None
        assert note["note"] == "Patient shows improvement"
        assert note["doctor_email"] == "doctor@test.com"

    def test_add_note_with_prediction(self, client, auth_headers_doctor):
        """Test adding a note linked to a prediction."""
        # Create patient
        db.users.insert_one({
            "first_name": "John",
            "last_name": "Doe",
            "email": "patient@test.com",
            "password": generate_password_hash("test123"),
            "role": "patient"
        })
        
        # Create prediction
        pred_result = db.predictions.insert_one({
            "patient_email": "patient@test.com",
            "result": {"label": 1, "probability": 0.75},
            "created_at": datetime.utcnow()
        })
        pred_id = str(pred_result.inserted_id)
        
        note_data = {
            "patient_email": "patient@test.com",
            "note": "Regarding recent prediction",
            "prediction_id": pred_id,
            "visible_to_patient": True
        }
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_doctor,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 201
        
        # Verify prediction_id is stored
        note = db.notes.find_one({"note": "Regarding recent prediction"})
        assert note["prediction_id"] == pred_result.inserted_id

    def test_add_note_missing_fields(self, client, auth_headers_doctor):
        """Test adding note with missing required fields."""
        note_data = {"patient_email": "patient@test.com"}
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_doctor,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "patient_email and note are required" in data["error"]

    def test_add_note_patient_not_found(self, client, auth_headers_doctor):
        """Test adding note for non-existent patient."""
        note_data = {
            "patient_email": "nonexistent@test.com",
            "note": "Test note"
        }
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_doctor,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "Patient not found" in data["error"]

    def test_add_note_invalid_prediction_id(self, client, auth_headers_doctor):
        """Test adding note with invalid prediction ID."""
        # Create patient
        db.users.insert_one({
            "first_name": "John",
            "last_name": "Doe",
            "email": "patient@test.com",
            "password": generate_password_hash("test123"),
            "role": "patient"
        })
        
        note_data = {
            "patient_email": "patient@test.com",
            "note": "Test note",
            "prediction_id": "invalid-id"
        }
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_doctor,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "Invalid prediction_id" in data["error"]

    def test_add_note_patient_denied(self, client, auth_headers_patient):
        """Test that patients cannot add notes."""
        note_data = {
            "patient_email": "patient@test.com",
            "note": "Test note"
        }
        
        response = client.post(
            "/doctors/notes",
            headers=auth_headers_patient,
            data=json.dumps(note_data),
            content_type="application/json"
        )
        assert response.status_code == 403


class TestDoctorListNotes:
    """Test doctor listing notes for patients."""

    def test_list_notes_for_patient(self, client, auth_headers_doctor):
        """Test listing all notes for a patient."""
        # Create notes
        notes = [
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "note": "Note 1",
                "visible_to_patient": True,
                "created_at": datetime.utcnow()
            },
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "note": "Note 2",
                "visible_to_patient": False,
                "created_at": datetime.utcnow()
            }
        ]
        db.notes.insert_many(notes)
        
        response = client.get(
            "/doctors/patients/patient@test.com/notes",
            headers=auth_headers_doctor
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["notes"]) == 2

    def test_list_notes_with_prediction_filter(self, client, auth_headers_doctor):
        """Test filtering notes by prediction ID."""
        pred_id = ObjectId()
        notes = [
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "note": "Note for prediction",
                "prediction_id": pred_id,
                "visible_to_patient": True,
                "created_at": datetime.utcnow()
            },
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "note": "General note",
                "visible_to_patient": True,
                "created_at": datetime.utcnow()
            }
        ]
        db.notes.insert_many(notes)
        
        response = client.get(
            f"/doctors/patients/patient@test.com/notes?prediction_id={str(pred_id)}",
            headers=auth_headers_doctor
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["notes"]) == 1
        assert data["notes"][0]["note"] == "Note for prediction"

    def test_list_notes_for_prediction(self, client, auth_headers_doctor):
        """Test listing notes for a specific prediction."""
        pred_id = ObjectId()
        note = {
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "note": "Prediction note",
            "prediction_id": pred_id,
            "visible_to_patient": True,
            "created_at": datetime.utcnow()
        }
        db.notes.insert_one(note)
        
        response = client.get(
            f"/doctors/predictions/{str(pred_id)}/notes",
            headers=auth_headers_doctor
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["notes"]) == 1


class TestDoctorPatientList:
    """Test doctor listing their patients."""

    def test_my_patients_success(self, client, auth_headers_doctor):
        """Test getting list of patients who requested appointments."""
        # Create patient user
        db.users.insert_one({
            "first_name": "John",
            "last_name": "Doe",
            "email": "patient@test.com",
            "password": generate_password_hash("test123"),
            "role": "patient"
        })
        
        # Create patient profile
        db.patients.insert_one({
            "email": "patient@test.com",
            "gender": "male",
            "age": 30
        })
        
        # Create appointment
        db.appointments.insert_one({
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "status": "pending"
        })
        
        response = client.get("/doctors/patients", headers=auth_headers_doctor)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) == 1
        assert data["items"][0]["email"] == "patient@test.com"
        assert data["items"][0]["first_name"] == "John"
        assert data["items"][0]["age"] == 30

    def test_my_patients_empty(self, client, auth_headers_doctor):
        """Test when doctor has no patients."""
        response = client.get("/doctors/patients", headers=auth_headers_doctor)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["items"] == []


class TestDoctorPatientProfile:
    """Test doctor viewing patient profiles."""

    def test_get_patient_profile_success(self, client, auth_headers_doctor):
        """Test viewing a patient's full profile."""
        # Create patient user
        db.users.insert_one({
            "first_name": "John",
            "last_name": "Doe",
            "email": "patient@test.com",
            "password": generate_password_hash("test123"),
            "role": "patient"
        })
        
        # Create patient profile
        db.patients.insert_one({
            "email": "patient@test.com",
            "gender": "male",
            "age": 30,
            "blood_pressure": "normal"
        })
        
        response = client.get(
            "/doctors/patient-profile?email=patient@test.com",
            headers=auth_headers_doctor
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["user"]["email"] == "patient@test.com"
        assert data["user"]["first_name"] == "John"
        assert data["profile"]["age"] == 30

    def test_get_patient_profile_missing_email(self, client, auth_headers_doctor):
        """Test viewing profile without email parameter."""
        response = client.get("/doctors/patient-profile", headers=auth_headers_doctor)
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "email query param required" in data["error"]

    def test_get_patient_profile_not_found(self, client, auth_headers_doctor):
        """Test viewing non-existent patient profile."""
        response = client.get(
            "/doctors/patient-profile?email=nonexistent@test.com",
            headers=auth_headers_doctor
        )
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "User not found" in data["error"]
