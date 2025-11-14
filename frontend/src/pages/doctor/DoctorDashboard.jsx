// DoctorDashboard.jsx
import { useEffect, useState } from "react";
import "./dashboard_doc.css";

export default function DoctorDashboard() {

  const [hello, setHello] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  // patient focus
  const [patientEmail, setPatientEmail] = useState(""); //the email the doctor type
  const [notes, setNotes] = useState([]); //array of notes fetched for that patient or for a specific prediction
  const [notesLoading, setNotesLoading] = useState(false);

  // new note
  const [noteText, setNoteText] = useState(""); 
  const [predictionId, setPredictionId] = useState(""); // optional ObjectId to attach the note to a specific prediction.
  const [adding, setAdding] = useState(false); //adding flag

  // appointment
  const [appointments, setAppointments] = useState([]);
  const [apptLoading, setApptLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("pending"); // active button changed color

  // show Patient's profile
  const [patientProfile, setPatientProfile] = useState(null);
const [profileLoading, setProfileLoading] = useState(false);

  // helper funct to fetch api from backend
  async function apiGet(path) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, { 
      headers: { Authorization: `Bearer ${token}` } 
    });
    if (res.status === 401) {
      localStorage.clear();
      window.location.assign("/");
      throw new Error("Unauthorized");
    }
    return res;
  }

  // PATCH - Partially update a resource
  // helper funct to update appt status
  async function apiPatch(path, body) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (res.status === 401) {
      localStorage.clear();
      window.location.assign("/");
      throw new Error("Unauthorized");
    }
    return res;
  }

  // helper funct to change color to active button
  async function onFilterClick(next) {
    setStatusFilter(next);
    await loadAppointments(next);
  }

  // 2) load notes for a patient
  async function loadPatientNotes() {
    if (!patientEmail.trim()) {
      setNotes([]);
      return;
    }
    try {
      setNotesLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      //if predictionId provided, hit the prediction notes endpoint; otherwise hit the patient notes endpoint

      // -> /doctors/patients/<patient_email>/notes → all notes for that patient.
      // -> /doctors/predictions/<prediction_id>/notes → notes for a specific prediction (if doctor enter id)
      const url = predictionId.trim()
        ? `/doctors/predictions/${encodeURIComponent(predictionId.trim())}/notes`
        : `/doctors/patients/${encodeURIComponent(patientEmail.trim())}/notes`;
      const res = await apiGet(url);
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setNotes(data.notes || []); // puts the array of notes into the React state notes.
    } catch (e) {
      setNotes([]);
      setError(String(e.message || e));
    } finally {
      setNotesLoading(false);
    }
  }

  // 3) add a note 
  async function addNote() {
    if (!patientEmail.trim() || !noteText.trim()) return;

    // Build request body
    const body = {
      patient_email: patientEmail.trim(),
      note: noteText.trim(),
      visible_to_patient: true,
      ...(predictionId.trim() ? { prediction_id: predictionId.trim() } : {}),
    };

    // Get token (defensively parse if it was stored as JSON)
    let token = localStorage.getItem("token");
    try { if (token?.startsWith('"')) token = JSON.parse(token); } catch {}

    setAdding(true);
    setError("");

    try {
      const res = await fetch("/doctors/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
        // keep it same-origin via dev proxy; do NOT put an absolute URL here
      }).catch((err) => {
        // This catch indicates a **network-level** failure (CORS, mixed content, DNS, server down)
        console.error("Network error POST /doctors/notes:", err);
        throw new Error("Network error: Failed to reach /doctors/notes (CORS/proxy/redirect?)");
      });

      const ct = res.headers.get("content-type") || "";
      const payload = ct.includes("application/json") ? await res.json() : { html: await res.text() };

      // Helpful debugging in console like "Token has expired"
      console.log("POST /doctors/notes →", res.status, payload);

      if (!res.ok) {
        const msg = payload?.error
          || (payload?.html ? "Auth redirect / non-JSON response from server" : `HTTP ${res.status}`);
        throw new Error(msg);
      }

      setNoteText(""); //On success, clear the input and refresh notes so the new one appears
      await loadPatientNotes();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setAdding(false);
    }
  }


  // 4) display appointment
  async function loadAppointments(status = "pending") {
    try {
      setApptLoading(true);
      setError("");
      // status = "pending" → /api/appointments/incoming?status=pending
      const url = `/appointments/incoming${status ? `?status=${encodeURIComponent(status)}` : ""}`;

      const res = await apiGet(url);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setAppointments(Array.isArray(data.items) ? data.items : []);

    } catch (e) {
      setAppointments([]);
      setError(String(e.message || e));

    } finally {
      setApptLoading(false);
    }
  }
  // update status: from 'pending' to 'accepted' or 'rejected'
  async function updateAppointmentStatus(id, status) {
    try {
      setError("");
      const res = await apiPatch(`/appointments/${encodeURIComponent(id)}/status`, 
      { status }); // ← { "status": "accepted" }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      // refresh the list (still showing pending by default)
      await loadAppointments("pending");
    } catch (e) {
      setError(String(e.message || e));
    }
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const res = await apiGet(`/doctors/`); // greet endpoint already proxied
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setHello(data.message || "");
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();

    // also fetch pending appointments initially
    loadAppointments("pending");
  }, []); // eslint-disable-line

  // 5) Display patient profile when search by email
  async function loadPatientProfile() {
    const email = patientEmail.trim();
    if(!email) {
      setPatientProfile(null);
      return;
    }
    try {
      setProfileLoading(true);
      setError("");

      // hits: /doctors/patient-profile?email=<...>
      const url = `/doctors/patient-profile?email=${encodeURIComponent(email)}`;
      const res = await apiGet(url);
      const data =  await res.json().catch(() => ({}));
      if(!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // shape: { user: {...}, profile: {...} }
      setPatientProfile({
        user: data.user || {},
        profile: data.profile || {},
      });
    } catch (e) {
      setPatientProfile(null);
      setError(String(e.message || e));
    } finally {
      setProfileLoading(false);
    }
}d

  return (
    <div>
      <h2 className="welcome">Welcome Doctor</h2>
      <div className="pd-page">
        {loading && <div className="pd-loading">Loading…</div>}
        {error && <div className="pd-error">{error}</div>}

        {/* Doctor Dashboard */}
        <section className="pd-search-note">
          <h3 className="pd-h3">Doctor Dashboard</h3>
          <div className="pd-text-muted-sm">{hello || "Welcome"}</div>

          <div style={{ marginTop: 12 }} className="pd-grid-2">
            <label style={{ display: "grid", gap: 6 }}>
              <span className="pd-text-muted-sm">Patient Email</span>
              <input
                className="pd-input"
                placeholder="patient@example.com"
                value={patientEmail}
                onChange={e => setPatientEmail(e.target.value)}
              />
            </label>

            <label style={{ display: "grid", gap: 6 }}>
              <span className="pd-text-muted-sm">Filter by Prediction ID (optional)</span>
              <input
                className="pd-input"
                placeholder="Mongo ObjectId"
                value={predictionId}
                onChange={e => setPredictionId(e.target.value)}
              />
            </label>
          </div>

          {/* Button Load Notes */}
          <div className="pd-row" style={{ marginTop: 10 }}>
            <button className="pd-btn" onClick={loadPatientNotes} disabled={notesLoading}>
              {notesLoading ? "Loading Notes…" : "Load Notes"}
            </button>
          </div>
        </section>

        {/* Add Note section */}
        <section className="pd-note">
          <h3 className="pd-h3">Add Note</h3>
          <div className="pd-text-muted-sm" style={{ marginBottom: 8 }}>
            {/* from setPatientEmail from load notes */}
            {patientEmail ? `Patient: ${patientEmail}` : "Enter a patient email first."}
          </div>
          <div className="pd-row">
            <input
              className="pd-input pd-flex-1"
              placeholder="Write a note…"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <button
              className="pd-btn"
              onClick={addNote}
              disabled={!patientEmail.trim() || !noteText.trim() || adding}
            >
              {adding ? "Saving…" : "Save Note"}
            </button>
          </div>
        </section>

        {/* Patient Profile */}
        <section className="pd-profile">
        <div className="pd-row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h3 className="pd-h3" style={{ marginBottom: 0 }}>Patient Profile</h3>
          <button
            className="pd-btn-secondary"
            onClick={loadPatientProfile}
            disabled={!patientEmail.trim() || profileLoading}
          >
            {profileLoading ? "Loading…" : "Load Profile"}
          </button>
        </div>

        {!patientEmail.trim() && (
          <div className="pd-text-muted">Enter a patient email and click “Load Profile”.</div>
        )}

        {patientEmail.trim() && profileLoading && (
          <div className="pd-loading" style={{ marginTop: 8 }}>Loading profile…</div>
        )}

        {patientEmail.trim() && !profileLoading && !patientProfile && (
          <div className="pd-text-muted" style={{ marginTop: 8 }}>
            No profile found for <strong>{patientEmail}</strong>.
          </div>
        )}

        {patientProfile && !profileLoading && (
          <div className="pd-card" style={{ marginTop: 8 }}>
            {/* Name + email from user */}
            <div className="pd-row" style={{ alignItems: "baseline", gap: 8 }}>
              <div className="pd-h4" style={{ margin: 0 }}>
                {patientProfile.user.first_name || patientProfile.user.last_name
                  ? `${patientProfile.user.first_name || ""} ${patientProfile.user.last_name || ""}`.trim()
                  : "Unnamed Patient"}
              </div>
              <div className="pd-text-muted-sm">
                {patientProfile.user.email || patientEmail}
              </div>
            </div>

            {/* Quick facts from profile */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0,1fr))", gap: 8, marginTop: 10 }}>
              {/* Check multiple possible field names */}
              {(patientProfile.profile.gender || patientProfile.profile.Gender) && (
                <span className="pd-pill">
                  Gender: {patientProfile.profile.gender || patientProfile.profile.Gender}
                </span>
              )}
              
              {(patientProfile.profile.age !== undefined || patientProfile.profile.Age !== undefined) && (
                <span className="pd-pill">
                  Age: {patientProfile.profile.age ?? patientProfile.profile.Age}
                </span>
              )}
              
              {(patientProfile.profile.height || patientProfile.profile.Height) && (
                <span className="pd-pill">
                  Height: {patientProfile.profile.height || patientProfile.profile.Height}
                </span>
              )}
              
              {(patientProfile.profile.weight || patientProfile.profile.Weight) && (
                <span className="pd-pill">
                  Weight: {patientProfile.profile.weight || patientProfile.profile.Weight}
                </span>
              )}
              
              {(patientProfile.profile.blood_pressure || patientProfile.profile.bloodPressure) && (
                <span className="pd-pill">
                  Blood Pressure: {patientProfile.profile.blood_pressure || patientProfile.profile.bloodPressure}
                </span>
              )}
              
              {(patientProfile.profile.cholesterol_level || patientProfile.profile.cholesterolLevel) && (
                <span className="pd-pill">
                  Cholesterol: {patientProfile.profile.cholesterol_level || patientProfile.profile.cholesterolLevel}
                </span>
              )}
              
              {(patientProfile.profile.fever !== undefined) && (
                <span className="pd-pill">
                  Fever: {patientProfile.profile.fever ? "Yes" : "No"}
                </span>
              )}
              
              {(patientProfile.profile.cough !== undefined) && (
                <span className="pd-pill">
                  Cough: {patientProfile.profile.cough ? "Yes" : "No"}
                </span>
              )}
              
              {(patientProfile.profile.fatigue !== undefined) && (
                <span className="pd-pill">
                  Fatigue: {patientProfile.profile.fatigue ? "Yes" : "No"}
                </span>
              )}
              
              {(patientProfile.profile.difficulty_breathing !== undefined || patientProfile.profile.difficultyBreathing !== undefined) && (
                <span className="pd-pill">
                  Difficulty Breathing: {(patientProfile.profile.difficulty_breathing || patientProfile.profile.difficultyBreathing) ? "Yes" : "No"}
                </span>
              )}
            </div>
          </div>
        )}
    </section>

        {/* Display the added note */}
        <section className="pd-note-display">
          <h3 className="pd-h3">Notes</h3>
          {/* notes = setNote(array.note) from above func */}
          {notes.length === 0 && <div className="pd-text-muted">No notes to show.</div>}
          {/* "n" = 1 individual note */}
          {notes.map(n => ( 
            <div key={n._id} className="pd-note-box">
              <div className="pd-row">
                <span className="pd-pill">{new Date(n.created_at).toLocaleString()}</span>
                {n.prediction_id && <span className="pd-pill">pred: {n.prediction_id.slice(0, 8)}…</span>}
                <div className="pd-flex-spacer" />
                <span className="pd-text-muted-sm" style={{color: "white"}}>{n.doctor_email}</span>
              </div>
              <div className="pd-note-text" style={{ color: "white", marginTop: 6 }}>
                {n.note}
              </div>
            </div>
          ))}
        </section>
        
        {/* Appointments */}
        <section className="pd-appointment">
          <h3 className="pd-h3">Appointments</h3>

          <div className="pd-row" style={{ gap: 8, marginBottom: 12 }}>
          <button
            className={`pd-pending ${statusFilter === "pending" ? "is-active" : ""}`}
            onClick={() => onFilterClick("pending")}
            disabled={apptLoading}
            aria-pressed={statusFilter === "pending"}
          >
            {apptLoading && statusFilter === "pending" ? "Loading…" : "Pending"}
          </button>

          <button
            className={`pd-status ${statusFilter === "accepted" ? "is-active" : ""}`}
            onClick={() => onFilterClick("accepted")}
            disabled={apptLoading}
            aria-pressed={statusFilter === "accepted"}
          >
            Accepted
          </button>

          <button
            className={`pd-status ${statusFilter === "rejected" ? "is-active" : ""}`}
            onClick={() => onFilterClick("rejected")}
            disabled={apptLoading}
            aria-pressed={statusFilter === "rejected"}
          >
            Rejected
          </button>

          <div className="pd-flex-spacer" />

          <button
            className={`pd-status ${statusFilter === "" ? "is-active" : ""}`}
            onClick={() => onFilterClick("")}
            disabled={apptLoading}
            aria-pressed={statusFilter === ""}
          >
            All
          </button>
        </div>

          {appointments.length === 0 && !apptLoading && (
            <div className="pd-text-muted">No appointments to show.</div>
          )}

          {appointments.map(a => (
            <div key={a._id} className="pd-appt-box" style={{ marginBottom: 10 }}>
              <div className="pd-row">
                <span className="pd-pill">{new Date(a.requested_time).toLocaleString()}</span>
                <span className="pd-pill">{a.status}</span>
                <div className="pd-flex-spacer" />
                <span className="pd-text-muted-sm">{a.patient_email}</span>
              </div>
              {a.reason && (
                <div className="pd-appt-text" style={{ color: "white", margin: 6}}>
                  Patient's note:  <span style={{color: "yellow"}}>{a.reason}</span>
                </div>
              )}
              {a.status === "pending" && (
                <div className="pd-row" style={{ marginTop: 10, gap: 8 }}>
                  <button className="pd-decision" onClick={() => updateAppointmentStatus(a._id, "accepted")} disabled={apptLoading}>
                    Accept
                  </button>
                  <button className="pd-decision" onClick={() => updateAppointmentStatus(a._id, "rejected")} disabled={apptLoading}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </section>
      </div>
    </div>
    );
  }