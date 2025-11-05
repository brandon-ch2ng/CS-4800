import { useState } from "react";
import "./survey.css";

export default function PatientSurvey({ onDone }) {
  const [form, setForm] = useState({
    gender: "", age: "", fever: "", cough: "", 
    fatigue: "", difficulty_breathing: "",
    blood_pressure: "", cholesterol_level: ""
  });

  const levels = [
  { label: "High", value: "high" },
  { label: "Normal", value: "normal" },
  { label: "Low", value: "low" },
  ];

  const [msg, setMsg] = useState(""); const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const yn = [{label:"Yes", value:"yes"}, {label:"No", value:"no"}];
  const toBool = v => v === "yes" ? true : v === "no" ? false : undefined;

  async function submit(e) {
    e.preventDefault(); 
    setSaving(true); 
    setErr(""); 
    setMsg("");
    const token = localStorage.getItem("token");

    const payload = {};
    // only send provided values
    if (form.gender) payload.gender = form.gender;
    if (form.age !== "") payload.age = Number(form.age);
    if (form.blood_pressure) payload.blood_pressure = form.blood_pressure;
    if (form.cholesterol_level) payload.cholesterol_level = form.cholesterol_level;
    ["fever","cough","fatigue","difficulty_breathing"].forEach(k => {
      const b = toBool(form[k]); if (b !== undefined) payload[k] = b;
    });
    payload.survey_completed = true;

    try {
      const res = await fetch("/patients/profile", {
        method: "PUT", //put patient info into db 
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || data.message || `Failed (${res.status})`);
      setMsg(data.message || "Saved!");
      onDone?.();  // let the parent hide the survey
    } catch (e) { setErr(String(e.message || e)); }
    finally { setSaving(false); }
  }

  function setField(k, v){ setForm(p => ({...p, [k]: v})); }

  return (
    <form onSubmit={submit} className="surveyForm">
      <h2>Quick Health Survey</h2>
    <div className="survey">
      <div className="gage">
        <label>Gender
          <input value={form.gender} onChange={e=>setField("gender", e.target.value)} placeholder="male/female/other" />
        </label>

        <label>Age
          <input type="number" min="0" value={form.age} onChange={e=>setField("age", e.target.value)} />
        </label>
      </div>
      
      <div className="yn">
        {["Fever","Cough","Fatigue","Difficulty_Breathing"].map(key => (
          <fieldset key={key}>
            <legend>{key.replace("_"," ")}</legend>
            {yn.map(opt => (
              <label key={opt.value}>
                <input type="radio" name={key} value={opt.value}
                      checked={form[key]===opt.value}
                      onChange={e=>setField(key, e.target.value)} /> {opt.label}
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <div className="hl">
        <fieldset>
            <legend>Blood Pressure</legend>
            {levels.map(opt => (
                <label key={opt.value}>
                <input
                    type="radio"
                    name="blood_pressure"
                    value={opt.value}
                    checked={form.blood_pressure === opt.value}
                    onChange={e => setForm(p => ({ ...p, blood_pressure: e.target.value }))}
                /> {opt.label}
                </label>
            ))}
        </fieldset>
        
        <fieldset>
            <legend>Cholesterol Level</legend>
            {levels.map(opt => (
                <label key={opt.value} style={{ marginRight: "1rem" }}>
                <input
                    type="radio"
                    name="cholesterol_level"
                    value={opt.value}
                    checked={form.cholesterol_level === opt.value}
                    onChange={e => setForm(p => ({ ...p, cholesterol_level: e.target.value }))}
                /> {opt.label}
                </label>
            ))}
        </fieldset>
      </div>

      <button className="save" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Survey"}</button>
      {msg && <p style={{color:"lightgreen"}}>{msg}</p>}
      {err && <p className="error">{err}</p>}
    </div>
    </form>
  );
}
