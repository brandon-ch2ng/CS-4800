import { useEffect, useState } from "react";
import PatientSurvey from "./PatientSurvey";
import AiPredictionPanel from "./AiPredictionPanel";
import AppointmentBooking from "./AppointmentBooking";
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
  const [editMode, setEditMode] = useState(false); // NEW: edit mode state
  const [showBooking, setShowBooking] = useState(false); // booking mode

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

  //helper function to POST to backend
  async function apiPost(path, body) {
    const token = localStorage.getItem("token");
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    if (res.status === 401) {
      localStorage.clear();
      window.location.assign("/"); // force re-login
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
      const r1 = await apiGet("/patients/"); //from backend
      const d1 = await r1.json().catch(() => ({}));
      if (r1.ok){
        const msg = d1.message ?? "";
        //So only display "Welcome hannah0201" without the @gmail.com
        const pretty = msg.replace(
          /([Ww]elcome\s+)([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/,
          (_, prefix, user) => `${prefix}${user}`
        );
        setWelcome(pretty);
      }

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

      /// appointments - use /appointments/mine endpoint
      try {
        const r4 = await apiGet("/appointments/mine"); // /mine: PATIENT: My Request
        const d4 = await r4.json().catch(() => ({}));
        setAppts(Array.isArray(d4.items) ? d4.items : []);
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

  // Run fetchProfile() once when component first mounts, [] -> run only once
  useEffect(() => { fetchProfile(); }, []);

  async function handleSurveyDone() {
    // Callback function for when user completes the survey
    // Re-fetches all profile data to get updated information
    await fetchProfile();
    setEditMode(false); // exit edit mode after saving 
    setShowBooking(false); // exit booking mode
  }

  function editProfile() {
    setEditMode(true); // editing profile
    setShowBooking(false); // close booking if open
  }

  function cancelEdit() {
    setEditMode(false);
  }

  // make new appointment
  function makeNewApp(){
    setShowBooking(true);
  }

  function cancelBooking() {
    setShowBooking(false);
  }

  async function onBookingSuccess() {
    await fetchProfile(); // refresh appointments
    setShowBooking(false); // exit
  }


return (
    <div> 
      {loading && <div className="pat-loading">Loading…</div>}
      {error && <div className="pat-error">{error}</div>}
      {welcome && <h2 className="pat-welcome">{welcome}</h2>}

      {showBooking ? (
        <AppointmentBooking 
          onCancel={cancelBooking}
          onSuccess={onBookingSuccess}
        />
      ) : (showSurvey || editMode) ? (
        <div className="pat-page-survey-only">
          <div style={{width: '100%', maxWidth: '1100px'}}>
            <PatientSurvey
              onDone={handleSurveyDone} 
              existingProfile={editMode ? profile : null}
            /> 
          </div>
        </div>
      ) : (
        <div className="pat-page">
          {profile && (
            <>
              <section className="pat-profile">
                <div className="pat-row">
                  <h3 className="pat-h3">My Profile</h3>
                  <button className="pat-edit-profile" onClick={editProfile} disabled={loading}>
                    {loading ? "Running…" : "Edit Profile"}
                  </button>
                </div>
                <div className="pat-info">Age: <b>{profile.age ?? "—"}</b></div>
                <div className="pat-info">Gender: <b>{capFirst(profile.gender) ?? "—"}</b></div>
                <div className="pat-info">Blood Pressure: <b>{capFirst(profile.blood_pressure) ?? "—"}</b></div>
                <div className="pat-info">Cholesterol: <b>{capFirst(profile.cholesterol_level) ?? "—"}</b></div>
                <div className="pat-info">Cough: <b>{fmtBool(profile.cough)}</b></div>
                <div className="pat-info">Fatigue: <b>{fmtBool(profile.fatigue)}</b></div>
                <div className="pat-info">Difficulty Breathing: <b>{fmtBool(profile.difficulty_breathing)}</b></div>
              </section>

              <section className="pat-note">
                <h3 className="pat-h3">Doctor Notes</h3>
                {doctorNotes.length === 0 && <div className="pat-text-muted">No notes.</div>}
                {doctorNotes.map(n => (
                  <div key={n._id} className="pat-note-box">
                    <div className="pat-note-title">{n.title || n.subject || "Doctor note"}</div>
                    <div className="pat-note-text">{n.note || n.summary || "—"}</div>
                    <div className="pat-text-muted-sm">
                      {fmtDateTime(n.created_at)}{n.doctor_name ? ` • ${n.doctor_name}` : ""}
                    </div>
                  </div>
                ))}
              </section>

              {/* ex: pat-grid-2 */}
              <AiPredictionPanel classPrefix="pat" /> 

              <section className="pat-appointment">
                <div className="pat-row">
                  <h3 className="pat-h3">Appointments</h3>
                  <button className="pat-edit-profile" onClick={makeNewApp} disabled={loading}>
                    {loading ? "Running…" : "Make New Appointment"}
                  </button>
                </div>
                {appts.length === 0 && <div className="pat-text-muted">No appointment requests.</div>}
                {appts.map(a => {
                  const d = new Date(a.requested_time);
                  return (
                    <div key={a._id} className="pat-appt-item">
                      <div>
                        <div className="pat-strong">
                          {d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                        <div className="pat-text-muted-sm">
                          {d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                        </div>
                      </div>
                      <div className="pat-flex-1">
                        <div className="pat-strong">{a.doctor_email}</div>
                        {a.reason && <div className="pat-text-muted-sm">{a.reason}</div>}
                      </div>
                      <span
                        className={`pat-pill ${
                          a.status === "accepted" ? "pat-pill-pos" :
                          a.status === "pending"   ? "pat-pill-warn" : "pat-pill-muted"
                        }`}
                      >
                        {a.status}
                      </span>
                    </div>
                  );
                })}
              </section>
            </>
          )}
        </div>
      )}
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
function fmtDateTime(iso){ return iso ? new Date(iso).toLocaleTimeString(undefined,{hour:"numeric",minute:"2-digit"}) : ""; }

