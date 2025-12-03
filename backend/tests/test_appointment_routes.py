import pytest
import json
from app.database import db
from datetime import datetime, timezone


class TestCreateAppointment:
    """Test creating appointment requests."""

    def test_create_appointment_success(self, client, auth_headers_patient):
        """Test successfully creating an appointment request."""
        appointment_data = {
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "reason": "Annual checkup"
        }
        
        response = client.post(
            "/appointments/",
            headers=auth_headers_patient,
            data=json.dumps(appointment_data),
            content_type="application/json"
        )
        assert response.status_code == 201
        data = json.loads(response.data)
        assert "Appointment requested" in data["message"]
        assert "appointment_id" in data
        
        # Verify in database
        appt = db.appointments.find_one({"patient_email": "patient@test.com"})
        assert appt is not None
        assert appt["doctor_email"] == "doctor@test.com"
        assert appt["status"] == "pending"
        assert appt["reason"] == "Annual checkup"

    def test_create_appointment_without_reason(self, client, auth_headers_patient):
        """Test creating appointment without optional reason."""
        appointment_data = {
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00"
        }
        
        response = client.post(
            "/appointments/",
            headers=auth_headers_patient,
            data=json.dumps(appointment_data),
            content_type="application/json"
        )
        assert response.status_code == 201
        
        # Verify reason is None
        appt = db.appointments.find_one({"patient_email": "patient@test.com"})
        assert appt["reason"] is None

    def test_create_appointment_missing_doctor_email(self, client, auth_headers_patient):
        """Test creating appointment without doctor email."""
        appointment_data = {
            "requested_time": "2024-12-15T10:00:00",
            "reason": "Checkup"
        }
        
        response = client.post(
            "/appointments/",
            headers=auth_headers_patient,
            data=json.dumps(appointment_data),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "doctor_email and requested_time are required" in data["error"]

    def test_create_appointment_missing_time(self, client, auth_headers_patient):
        """Test creating appointment without requested time."""
        appointment_data = {
            "doctor_email": "doctor@test.com",
            "reason": "Checkup"
        }
        
        response = client.post(
            "/appointments/",
            headers=auth_headers_patient,
            data=json.dumps(appointment_data),
            content_type="application/json"
        )
        assert response.status_code == 400

    def test_create_appointment_doctor_denied(self, client, auth_headers_doctor):
        """Test that doctors cannot create appointment requests."""
        appointment_data = {
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00"
        }
        
        response = client.post(
            "/appointments/",
            headers=auth_headers_doctor,
            data=json.dumps(appointment_data),
            content_type="application/json"
        )
        assert response.status_code == 403


class TestMyAppointments:
    """Test patient viewing their appointments."""

    def test_my_appointments_success(self, client, auth_headers_patient):
        """Test patient viewing their appointment requests."""
        # Create test appointments
        appointments = [
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "requested_time": "2024-12-15T10:00:00",
                "reason": "Checkup",
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor2@test.com",
                "requested_time": "2024-12-20T14:00:00",
                "reason": "Follow-up",
                "status": "accepted",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        db.appointments.insert_many(appointments)
        
        response = client.get("/appointments/mine", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) == 2
        assert data["items"][0]["patient_email"] == "patient@test.com"

    def test_my_appointments_empty(self, client, auth_headers_patient):
        """Test when patient has no appointments."""
        response = client.get("/appointments/mine", headers=auth_headers_patient)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["items"] == []

    def test_my_appointments_doctor_denied(self, client, auth_headers_doctor):
        """Test that doctors cannot access patient appointments endpoint."""
        response = client.get("/appointments/mine", headers=auth_headers_doctor)
        assert response.status_code == 403


class TestIncomingAppointments:
    """Test doctor viewing incoming appointment requests."""

    def test_incoming_appointments_success(self, client, auth_headers_doctor):
        """Test doctor viewing their incoming appointments."""
        # Create test appointments
        appointments = [
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "requested_time": "2024-12-15T10:00:00",
                "reason": "Checkup",
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "patient_email": "patient2@test.com",
                "doctor_email": "doctor@test.com",
                "requested_time": "2024-12-20T14:00:00",
                "reason": "Consultation",
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        db.appointments.insert_many(appointments)
        
        response = client.get("/appointments/incoming", headers=auth_headers_doctor)
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) == 2
        assert all(item["doctor_email"] == "doctor@test.com" for item in data["items"])

    def test_incoming_appointments_filter_by_status(self, client, auth_headers_doctor):
        """Test filtering incoming appointments by status."""
        # Create appointments with different statuses
        appointments = [
            {
                "patient_email": "patient@test.com",
                "doctor_email": "doctor@test.com",
                "requested_time": "2024-12-15T10:00:00",
                "status": "pending",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            {
                "patient_email": "patient2@test.com",
                "doctor_email": "doctor@test.com",
                "requested_time": "2024-12-20T14:00:00",
                "status": "accepted",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
        ]
        db.appointments.insert_many(appointments)
        
        # Filter for pending only
        response = client.get(
            "/appointments/incoming?status=pending",
            headers=auth_headers_doctor
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert len(data["items"]) == 1
        assert data["items"][0]["status"] == "pending"

    def test_incoming_appointments_patient_denied(self, client, auth_headers_patient):
        """Test that patients cannot access doctor appointments endpoint."""
        response = client.get("/appointments/incoming", headers=auth_headers_patient)
        assert response.status_code == 403


class TestUpdateAppointmentStatus:
    """Test doctor updating appointment status."""

    def test_update_status_accept(self, client, auth_headers_doctor):
        """Test doctor accepting an appointment."""
        # Create appointment
        result = db.appointments.insert_one({
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        appt_id = str(result.inserted_id)
        
        response = client.patch(
            f"/appointments/{appt_id}/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "accepted"}),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Appointment accepted" in data["message"]
        
        # Verify in database
        appt = db.appointments.find_one({"_id": result.inserted_id})
        assert appt["status"] == "accepted"

    def test_update_status_reject(self, client, auth_headers_doctor):
        """Test doctor rejecting an appointment."""
        # Create appointment
        result = db.appointments.insert_one({
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        appt_id = str(result.inserted_id)
        
        response = client.patch(
            f"/appointments/{appt_id}/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "rejected"}),
            content_type="application/json"
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert "Appointment rejected" in data["message"]

    def test_update_status_invalid_status(self, client, auth_headers_doctor):
        """Test updating with invalid status."""
        result = db.appointments.insert_one({
            "patient_email": "patient@test.com",
            "doctor_email": "doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        appt_id = str(result.inserted_id)
        
        response = client.patch(
            f"/appointments/{appt_id}/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "invalid"}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "must be 'accepted' or 'rejected'" in data["error"]

    def test_update_status_invalid_id(self, client, auth_headers_doctor):
        """Test updating with invalid appointment ID."""
        response = client.patch(
            "/appointments/invalid-id/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "accepted"}),
            content_type="application/json"
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert "invalid appointment id" in data["error"]

    def test_update_status_not_found(self, client, auth_headers_doctor):
        """Test updating non-existent appointment."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = client.patch(
            f"/appointments/{fake_id}/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "accepted"}),
            content_type="application/json"
        )
        assert response.status_code == 404
        data = json.loads(response.data)
        assert "Not found" in data["error"]

    def test_update_status_wrong_doctor(self, client, auth_headers_doctor):
        """Test doctor cannot update another doctor's appointments."""
        # Create appointment for different doctor
        result = db.appointments.insert_one({
            "patient_email": "patient@test.com",
            "doctor_email": "other-doctor@test.com",
            "requested_time": "2024-12-15T10:00:00",
            "status": "pending",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
        appt_id = str(result.inserted_id)
        
        response = client.patch(
            f"/appointments/{appt_id}/status",
            headers=auth_headers_doctor,
            data=json.dumps({"status": "accepted"}),
            content_type="application/json"
        )
        assert response.status_code == 404  # Not found because query filters by doctor_email

    def test_update_status_patient_denied(self, client, auth_headers_patient):
        """Test that patients cannot update appointment status."""
        from bson import ObjectId
        fake_id = str(ObjectId())
        
        response = client.patch(
            f"/appointments/{fake_id}/status",
            headers=auth_headers_patient,
            data=json.dumps({"status": "accepted"}),
            content_type="application/json"
        )
        assert response.status_code == 403
