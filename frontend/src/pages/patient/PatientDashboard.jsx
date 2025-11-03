import { useEffect, useState } from "react";
import PatientSurvey from "./PatientSurvey";

export default function PatientDashboard() {
  const [welcome, setWelcome] = useState("");
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [showSurvey, setShowSurvey] = useState(true);

  async function fetchProfile() {
    const token = localStorage.getItem("token");
    try {
      // welcome
      const r1 = await fetch("/patients/", { headers: { Authorization: `Bearer ${token}` } });
      const d1 = await r1.json().catch(() => ({}));
      if (r1.ok) setWelcome(d1.message || "");

      // profile
      const r2 = await fetch("/patients/profile", { headers: { Authorization: `Bearer ${token}` } });
      if (r2.status === 404) {
        setProfile(null);
        setShowSurvey(true);   // first-time: show survey
        return;
      }
      const d2 = await r2.json().catch(() => ({}));
      if (r2.ok) {
        setProfile(d2);
        setShowSurvey(!(d2 && d2.survey_completed === true));
      } else {
        setError(d2.error || "Failed to load profile");
      }
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => { fetchProfile(); }, []);

  async function handleSurveyDone() {
    // After PUT in PatientSurvey succeeds, refresh from server
    await fetchProfile();
  }

  return (
    <div style={{ margin: "4rem", color: "#fff" }}>
      {showSurvey && <PatientSurvey onDone={handleSurveyDone} />}

      {profile && (
        <>
          <h2>Current Profile</h2>
          <pre>{JSON.stringify(profile, null, 2)}</pre>
        </>
      )}
    </div>
  );
}
