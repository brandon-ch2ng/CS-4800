import { useEffect, useState } from "react";
import PatientSurvey from "./PatientSurvey";
import AiPredictionPanel from "./AiPredictionPanel";
import "./dashboard.css";

export default function PatientDashboard() {
  const [welcome, setWelcome] = useState(""); //create by useState
  const [profile, setProfile] = useState(null);
  const [doctorNotes, setDoctorNotes] = useState([]);// NEW: doctor note 
  const [predictions, setPredictions] = useState([]);// NEW: prediction 
  const [appts, setAppts] = useState([]);        // NEW: appointments 
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);  // NEW: simple spinner
  const [showSurvey, setShowSurvey] = useState(true);

  //helper function to call API to backend
  async function apiGet(path) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      localStorage.clear();
      window.location.assign("/");  // force re-login
      throw new Error("Unauthorized");
    }
    return res;
  }

  //load all dashboard data
  async function fetchProfile() {
    setLoading(true);
    setError("");
    try {
      // welcome
      const r1 = await apiGet("/patients/");
      const d1 = await r1.json().catch(() => ({}));
      if (r1.ok) setWelcome(d1.message || "");

      // profile
      const r2 = await apiGet("/patients/profile"); //Request the current patient profile
      if (r2.status === 404) {
        setProfile(null);
        setShowSurvey(true); // first-time: show survey
      } else {
        const d2 = await r2.json().catch(() => ({}));
        if (r2.ok) {
          setProfile(d2);
          setShowSurvey(!(d2 && d2.survey_completed === true));
        } else {
          setError(d2.error || "Failed to load profile");
        }
      }

      //Doctor's notes
      try {
        const rNotes = await apiGet("/patients/notes");        // doctor notes only
        const dNotes = await rNotes.json().catch(() => ({}));
        setDoctorNotes(Array.isArray(dNotes.notes) ? dNotes.notes : []);
      } catch { setDoctorNotes([]); }
      
      //Chatbot-like prediction
      try {
        const rPred = await apiGet("/patients/predictions");   // ML predictions
        const dPred = await rPred.json().catch(() => ({}));
        setPredictions(Array.isArray(dPred.predictions) ? dPred.predictions : []);
      } catch { setPredictions([]); }

      // appointments (optional: add backend /patients/appointments)
      try {
        const r4 = await apiGet("/patients/appointments");
        const d4 = await r4.json().catch(() => ({}));
        setAppts(Array.isArray(d4.appointments) ? d4.appointments : []);
      } catch {
        setAppts([]);
      }
    }
    catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchProfile(); }, []);

  async function handleSurveyDone() {
    // After PUT in PatientSurvey succeeds, refresh from server
    await fetchProfile();
  }

  return (
  <div className="pd-page">
    {/* If loading is true, show a semi-transparent “Loading…” message. */}
    {loading && <div className="pd-loading">Loading…</div>}
    {error && <div className="pd-error">{error}</div>}

    {/* Welcome */}
    {welcome && <h2 className="pd-welcome">{welcome}</h2>}

    {/* Survey */}
    {showSurvey && <PatientSurvey onDone={handleSurveyDone} />}

    {/* Profile */}
    {profile && (
      <section className="pd-card">
        <h3 className="pd-h3">My Profile</h3>
        <div>Age: <b>{profile.age ?? "—"}</b></div>
        <div>Gender: <b>{capFirst(profile.gender) ?? "—"}</b></div>
        <div>Blood Pressure: <b>{capFirst(profile.blood_pressure) ?? "—"}</b></div>
        <div>Cholesterol: <b>{capFirst(profile.cholesterol_level) ?? "—"}</b></div>
        {/* converts true/false/undefined to Yes/No/— */}
        <div>Cough: <b>{fmtBool(profile.cough)}</b></div>
        <div>Fatigue: <b>{fmtBool(profile.fatigue)}</b></div>
        <div>Difficulty Breathing: <b>{fmtBool(profile.difficulty_breathing)}</b></div>
      </section>
    )}

    {/* Doctor Notes */}
  <section className="pd-card">
    <h3 className="pd-h3">Doctor Notes</h3>
    {doctorNotes.length === 0 && <div className="pd-text-muted">No notes.</div>}
    {doctorNotes.map(n => (
      <div key={n._id} className="pd-note-box">
        <div className="pd-note-title">{n.title || n.subject || "Doctor note"}</div>
        <div className="pd-note-text">{n.text || n.summary || "—"}</div>
        <div className="pd-text-muted-sm">
          {fmtDateTime(n.created_at)}{n.doctor_name ? ` • ${n.doctor_name}` : ""}
        </div>
      </div>
    ))}
  </section>

  {/* AI Health Assistant (predictions) */}
  <AiPredictionPanel />

    {/* Appointments*/}
    <section className="pd-card">
      <h3 className="pd-h3">Appointments</h3>
      {appts.length === 0 && <div className="pd-text-muted">No upcoming appointments.</div>}
      {appts.map(a => {
        const d = new Date(a.when);
        return (
          <div key={a.id} className="pd-appt-item">
            <div>
              <div className="pd-strong">
                {d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
              <div className="pd-text-muted-sm">
                {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </div>
            </div>
            <div className="pd-flex-1">
              <div className="pd-strong">{a.doctor_name}</div>
              <div className="pd-text-muted-sm">{a.specialty}</div>
            </div>
            <span
              className={`pd-pill ${
                a.status === "Confirmed" ? "pd-pill-pos" :
                a.status === "Pending"   ? "pd-pill-warn" : "pd-pill-muted"
              }`}
            >
              {a.status}
            </span>
          </div>
        );
      })}
    </section>
  </div>
);
}

/* -------Helpers--------*/
//make the first letter uppercase such as Gender
function capFirst(v) {
  if (v == null) return "—";
  const s = String(v).trim();
  if (!s) return "—";
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
}

function fmtBool(v){ return v === true ? "Yes" : v === false ? "No" : "—"; }
// formats an ISO timestamp into a local time like “10:31 AM”.
function fmtTime(iso){ return iso ? new Date(iso).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}) : ""; }

