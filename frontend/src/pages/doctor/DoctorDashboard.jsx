import { useEffect, useState } from "react";

export default function DoctorDashboard() {
  const [welcome, setWelcome] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/doctors/", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => setWelcome(data.message || ""))
      .catch(e => setError(String(e)));
  }, []);

  return (
    <div>
      <h1>Doctor Dashboard</h1>
      {welcome && <p>{welcome}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

