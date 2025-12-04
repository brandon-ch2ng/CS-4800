import { useState } from "react";

export default function AiPredictionPanel({ classPrefix = "pd" }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [overrides, setOverrides] = useState({});

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

      if (res.status === 401) {
        if (token) localStorage.removeItem("token");
        throw new Error(
          data.error ||
          "Unauthorized (401). Please sign in again or refresh your session."
        );
      }
      
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setResult(data);
    } catch (e) {
      setError(String(e.message || e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const c = classPrefix;

  return (
    <section className={`${c}-predict`}>
      <div className={`${c}-row`} style={{ justifyContent: "space-between", flexWrap: "wrap" }}>
        <h3 className={`${c}-h3`} style={{ margin: 0 }}>AI Health Assistant</h3>
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
        <ChatBot classPrefix={c} prediction={result} />
      )}
    </section>
  );
}

function ChatBot({ classPrefix: c, prediction }) {
  const predictionResult = prediction.result?.label === 1 ? "POSITIVE" : "NEGATIVE";
  const probability = Math.round((prediction.result?.probability ?? 0) * 100);

  const initialMessage = predictionResult === "POSITIVE"
    ? `We are ${probability}% confident that you may be sick. I'm here to help you understand your results and next steps.`
    : `We are ${100 - probability}% confident that you do not have an illness. Here are some resources and recommendations.`;

  const [messages, setMessages] = useState([
    { role: "bot", text: initialMessage }
  ]);
  const [showFollowUp, setShowFollowUp] = useState(false);

  const qaOptions = [
    {
      question: "What do my results mean?",
      answer: `Your prediction result is: ${predictionResult} (${probability}% confidence). This is based on your symptoms and health profile. Please consult a healthcare professional for medical advice.`
    },
    {
      question: "What should I do next?",
      answer: predictionResult === "POSITIVE"
        ? "We recommend scheduling an appointment with your doctor to discuss these results. In the meantime, maintain healthy habits like rest and hydration. You can attempt home or over-the-counter remedies to relieve mild symptoms."
        : "Regular check-ups and preventive care are important. If symptoms develop, or you feel unwell, seek medical attention promptly."
    },
    {
      question: "How reliable is this prediction?",
      answer: "This AI tool is designed as a preliminary screening aid. It should not replace professional medical diagnosis. Always consult with a qualified healthcare provider."
    },
    {
      question: "Can I run another prediction?",
      answer: "Yes! You can modify your symptoms or profile and run another prediction. Each result is saved for your records."
    }
  ];

  function handleQuestion(qa) {
    const newMessages = [
      ...messages,
      { role: "user", text: qa.question },
      { role: "bot", text: qa.answer }
    ];
    setMessages(newMessages);
    
    if (predictionResult === "POSITIVE" && qa.question === "What should I do next?") {
      setShowFollowUp(true);
    } else {
      setShowFollowUp(false);
    }
  }

  function handleFollowUp(choice) {
    if (choice === "remedies") {
      const remedyAnswer = "Common home and OTC remedies include: rest, staying hydrated, gargling with salt water, using saline nasal drops, throat lozenges, and over-the-counter pain relievers like acetaminophen or ibuprofen. Always follow package directions and consult your doctor if symptoms worsen.";
      
      setMessages(prev => [
        ...prev,
        { role: "user", text: "I'd like to discuss home and OTC remedies" },
        { role: "bot", text: remedyAnswer }
      ]);
    }
    setShowFollowUp(false);
  }

  return (
    <div className={`${c}-chatbot`} style={{ marginTop: 12, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
      <div className={`${c}-messages`} style={{ maxHeight: 300, overflowY: "auto", marginBottom: 12 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ marginBottom: 8, textAlign: msg.role === "bot" ? "left" : "right" }}>
            <div style={{
              display: "inline-block",
              maxWidth: "80%",
              padding: "8px 12px",
              borderRadius: 6,
              backgroundColor: msg.role === "bot" ? "#f0f0f0" : "#007bff",
              color: msg.role === "bot" ? "#000" : "#fff",
              fontSize: "13px"
            }}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {showFollowUp ? (
        <div style={{ display: "grid", gap: 6 }}>
          <button
            className={`${c}-btn`}
            onClick={() => handleFollowUp("remedies")}
            style={{
              textAlign: "center",
              padding: "8px 12px",
              fontSize: "13px",
              backgroundColor: "#28a745",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            I'd like to discuss home and OTC remedies
          </button>
          <button
            className={`${c}-btn`}
            onClick={() => handleFollowUp("ok")}
            style={{
              textAlign: "center",
              padding: "8px 12px",
              fontSize: "13px",
              backgroundColor: "#6c757d",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer"
            }}
          >
            OK
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {qaOptions.map((qa, idx) => (
            <button
              key={idx}
              className={`${c}-btn`}
              onClick={() => handleQuestion(qa)}
              style={{
                textAlign: "left",
                padding: "8px 12px",
                fontSize: "13px",
                backgroundColor: "#f9f9f9",
                border: "1px solid #ddd",
                borderRadius: 4,
                cursor: "pointer"
              }}
            >
              {qa.question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function cleanOverrides(o) {
  const out = {};
  Object.entries(o).forEach(([k, v]) => {
    if (v !== "" && v != null) out[k] = v;
  });
  return out;
}

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
