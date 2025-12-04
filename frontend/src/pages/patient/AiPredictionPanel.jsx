import { useState } from "react";

export default function AiPredictionPanel({ classPrefix = "pd" }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // Optional override fields for quick "what-if" runs
  const [overrides, setOverrides] = useState({
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

      //may get http401 error if user login too long 
      if (res.status === 401) {
        // Helpful message + cleanup
        if (token) localStorage.removeItem("token");
        throw new Error(
          data.error ||
          "Unauthorized (401). Please sign in again or refresh your session."
        );
      }
      
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

  const c = classPrefix; // shorthand

  return (
    <section className={`${c}-predict`}>
      <div className={`${c}-row`} style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h3 className={`${c}-h3`} style={{ margin: 0 }}>AI Health Assistant</h3>
        {/* run prediction when user click button */}
        <button className={`${c}-btn`} onClick={runPrediction} disabled={loading}>
          {loading ? "Running…" : "Run Prediction"}
        </button>
      </div>

      {error && <div className={`${c}-error`} style={{ marginTop: 8 }}>{error}</div>}

      {!result && !error && (
        <div className={`${c}-text-muted`} style={{ marginTop: 8 }}>
          Run a prediction using your saved profile (or optional overrides below).
        </div>
      )}
      
      {/* (Optional) quick override inputs */}
      <div className={`${c}-grid-2`} style={{ marginTop: 12 }}>
        <LabeledInput 
          classPrefix={c}
          label="Gender" 
          placeholder="Female / Male"
          value={overrides.gender || ""} 
          onChange={v => setOverrides(s => ({...s, gender: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Age" 
          placeholder="e.g., 42"
          value={overrides.age || ""} 
          onChange={v => setOverrides(s => ({...s, age: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Blood Pressure" 
          placeholder="Low / Normal / High"
          value={overrides.blood_pressure || ""} 
          onChange={v => setOverrides(s => ({...s, blood_pressure: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Cholesterol" 
          placeholder="Low / Normal / High"
          value={overrides.cholesterol_level || ""} 
          onChange={v => setOverrides(s => ({...s, cholesterol_level: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Fever" 
          placeholder="Yes / No"
          value={overrides.fever || ""} 
          onChange={v => setOverrides(s => ({...s, fever: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Cough" 
          placeholder="Yes / No"
          value={overrides.cough || ""} 
          onChange={v => setOverrides(s => ({...s, cough: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Fatigue" 
          placeholder="Yes / No"
          value={overrides.fatigue || ""} 
          onChange={v => setOverrides(s => ({...s, fatigue: v}))} 
        />
        <LabeledInput 
          classPrefix={c}
          label="Difficulty Breathing" 
          placeholder="Yes / No"
          value={overrides.difficulty_breathing || ""} 
          onChange={v => setOverrides(s => ({...s, difficulty_breathing: v}))} 
        />
      </div>

      {result && (
        <div className={`${c}-note-box`} style={{ marginTop: 12 }}>
          <div className={`${c}-row`} style={{ flexWrap: "wrap" }}>
            <span className={`${c}-pill ${c}-pill-muted`}>PREDICTION</span>
            {/* result: 1 = positive, 0 = negative */}
            <span className={`${c}-pill ${result.result?.label ? `${c}-pill-pos` : `${c}-pill-neg`}`}>
              {result.result?.label ? "POSITIVE" : "NEGATIVE"}
            </span>
            <div className={`${c}-flex-spacer`} />
            <span className={`${c}-strong`}>{Math.round((result.result?.probability ?? 0) * 100)}%</span>
          </div>
          <div className={`${c}-text-muted-sm`} style={{ marginTop: 6 }}>
            Saved as prediction_id: {result.prediction_id}
          </div>
        </div>
      )}
    </section>
  );
}

//removes any empty or null fields so only filled overrides are sent to the API (not null or undefined..)
function cleanOverrides(o) {
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
      <span style={{ color: "#000", fontSize: "13px", fontWeight: 600 }}>{label}</span>
      <input
        className="pd-input"
        value={value}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
      />
    </label>
  );
}
