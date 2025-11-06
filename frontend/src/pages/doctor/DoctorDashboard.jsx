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

  // 1) greet doctor
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError("");
        const token = localStorage.getItem("token");
        const res = await fetch("/doctors", {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
        setHello(data.message || "");
      } catch (e) {
        setError(String(e.message || e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      const res = await fetch(url, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
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

  // 3) add a note (optionally tie to a prediction)
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

  return (
    <div className="pd-page">
      {loading && <div className="pd-loading">Loading…</div>}
      {error && <div className="pd-error">{error}</div>}

      {/* Doctor Dashboard */}
      <section className="pd-search-note" style={{ gridArea: "profile" }}>
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
      <section className="pd-note" style={{ gridArea: "predict" }}>
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
              <span className="pd-text-muted-sm">{n.doctor_email}</span>
            </div>
            <div className="pd-note-text" style={{ color: "white", marginTop: 6 }}>
              {n.note}
            </div>
          </div>
        ))}
      </section>
      
      {/* NEED BACKEND ADD THESE ROUTES */}
      {/* Informational card because backend lacks these routes */}
      <section className="pd-appointment">
        <h3 className="pd-h3">Appointment</h3>
        
      </section>
    </div>
  );
}