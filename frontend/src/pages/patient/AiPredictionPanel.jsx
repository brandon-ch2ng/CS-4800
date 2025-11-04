import { useState } from "react";

export default function AiPredictionPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Optional override fields for quick "what-if" runs
  const [overrides, setOverrides] = useState({
    // leave blank to use stored profile; fill to override ad-hoc
    // gender: "Female",
    // age: 42,
    // blood_pressure: "High", // Low | Normal | High
    // cholesterol_level: "Normal",
    // fever: "No",            // Yes | No
    // cough: "Yes",           // Yes | No
    // fatigue: "No",
    // difficulty_breathing: "No",
  });

  async function runPrediction() {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanOverrides(overrides)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      // { result: { label, probability }, prediction_id, input_used, vector_order }
      setResult(data);
    } catch (e) {
      setError(String(e.message || e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="pd-card">
      <div className="pd-row" style={{ justifyContent: "space-between" }}>
        <h3 className="pd-h3">AI Health Assistant</h3>
        <button className="pd-btn" onClick={runPrediction} disabled={loading}>
          {loading ? "Running…" : "Run Prediction"}
        </button>
      </div>

      {/* (Optional) quick override inputs – uncomment if want inline “what-if” */}
      {/* <div className="pd-grid-2">
        <LabeledInput label="Gender" placeholder="Female / Male"
          value={overrides.gender || ""} onChange={v => setOverrides(s => ({...s, gender: v}))} />
        <LabeledInput label="Age" placeholder="e.g., 42"
          value={overrides.age || ""} onChange={v => setOverrides(s => ({...s, age: v}))} />
        <LabeledInput label="Blood Pressure" placeholder="Low / Normal / High"
          value={overrides.blood_pressure || ""} onChange={v => setOverrides(s => ({...s, blood_pressure: v}))} />
        <LabeledInput label="Cholesterol" placeholder="Low / Normal / High"
          value={overrides.cholesterol_level || ""} onChange={v => setOverrides(s => ({...s, cholesterol_level: v}))} />
        <LabeledInput label="Fever" placeholder="Yes / No"
          value={overrides.fever || ""} onChange={v => setOverrides(s => ({...s, fever: v}))} />
        <LabeledInput label="Cough" placeholder="Yes / No"
          value={overrides.cough || ""} onChange={v => setOverrides(s => ({...s, cough: v}))} />
        <LabeledInput label="Fatigue" placeholder="Yes / No"
          value={overrides.fatigue || ""} onChange={v => setOverrides(s => ({...s, fatigue: v}))} />
        <LabeledInput label="Difficulty Breathing" placeholder="Yes / No"
          value={overrides.difficulty_breathing || ""} onChange={v => setOverrides(s => ({...s, difficulty_breathing: v}))} />
      </div> */}

      {error && <div className="pd-error" style={{ marginTop: 8 }}>{error}</div>}

      {!result && !error && (
        <div className="pd-text-muted">Run a prediction using your saved profile (or optional overrides).</div>
      )}

      {result && (
        <div className="pd-note-box" style={{ marginTop: 10 }}>
          <div className="pd-row">
            <span className="pd-pill pd-pill-muted">PREDICTION</span>
            {/* result: 1 = positive, 0 = negative */}
            <span className={`pd-pill ${result.result?.label ? "pd-pill-pos" : "pd-pill-neg"}`}>
              {result.result?.label ? "POSITIVE" : "NEGATIVE"}
            </span>
            <div className="pd-flex-spacer" />
            <span className="pd-strong">{Math.round((result.result?.probability ?? 0) * 100)}%</span>
          </div>
          <div className="pd-text-muted-sm" style={{ marginTop: 6 }}>
            Saved as prediction_id: {result.prediction_id}
          </div>
        </div>
      )}
    </section>
  );
}

function cleanOverrides(o) {
  // Remove empty keys so the backend uses stored profile for those
  const out = {};
  Object.entries(o).forEach(([k, v]) => {
    if (v !== "" && v != null) out[k] = v;
  });
  return out;
}

// Optional tiny input component (if enable overrides above)
function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span className="pd-text-muted-sm">{label}</span>
      <input
        className="pd-input"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
