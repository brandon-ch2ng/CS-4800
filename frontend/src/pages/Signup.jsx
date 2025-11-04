import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Helper
function validatePassword(pw) {
  const errs = [];
  if (pw.length < 8) errs.push("≥8 chars");
  if (!/[a-z]/.test(pw)) errs.push("lowercase");
  if (!/[A-Z]/.test(pw)) errs.push("uppercase");
  if (!/\d/.test(pw)) errs.push("number");
  return errs;
}

export default function Signup() {
  const [error, setError] = useState("");
  const [confirmMsg, setConfirmMsg] = useState("");
  const nav = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const f = e.currentTarget;
    console.log("Form submitted"); // Debug: Check if this logs
    if (!f.reportValidity()) {
      console.log("Form invalid"); // Debug: Check validation
      setError("Please fill all required fields correctly.");
      return;
    }

    const payload = {
      email: f.email.value.trim(),
      first_name: f.first_name.value,
      last_name: f.last_name.value,
      password: f.password.value,
      role: f.role.value,
      //gender
    };
    console.log("Payload:", payload); // Debug: Check data

    const pwErrs = validatePassword(payload.password);
    if (pwErrs.length) {
      setError(`Password needs: ${pwErrs.join(", ")}`);
      return;
    }
    if (payload.password !== f.confirm.value) {
      setConfirmMsg("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch("/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      console.log("Response:", data); // Debug: Check API response
      if (!response.ok) {
        setError(data.error || `Signup failed (${response.status})`);
        return;
      }
      nav("/"); // back to login
    } catch (error) {
      console.error("Network error:", error); // Debug: Check for fetch issues
      setError("Network error: " + error.message);
    }
  }

  function onConfirmChange(e) {
    const f = e.currentTarget.form;
    setConfirmMsg(
      f.password.value && e.target.value !== f.password.value
        ? "Passwords do not match."
        : ""
    );
  }

  return (
    <div className="formSignup">
      <h1>Create Account</h1>

      <form id="signup" onSubmit={onSubmit}>
        <div className="email">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
          />{" "}
          {/* Changed to type="email" for better validation */}
        </div>

        <div className="name-pair">
          <div>
            <label htmlFor="first_name">First name:</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              autoComplete="given-name"
              required
            />
          </div>
          <div>
            <label htmlFor="last_name">Last name:</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              autoComplete="family-name"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="new-password"
            minLength="8"
            required
          />
        </div>

        <div>
          <label htmlFor="confirm">Confirm:</label>
          <input
            type="password"
            id="confirm"
            name="confirm"
            autoComplete="new-password"
            minLength="8"
            required
            onChange={onConfirmChange}
          />
          
        </div>

        <fieldset className="additionalInfo">
          <legend>Additional info</legend>

          {/* <div className="field">
            <label htmlFor="gender">Gender</label>
            <select id="gender" name="gender" required defaultValue="">
              <option value="" disabled>Choose…</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="age">Age</label>
            <input type="number" id="age" name="age" min="0" max="120" step="1" inputMode="numeric" required />
          </div> */}

          <div className="field">
            <label htmlFor="role">Role</label>
            <select id="role" name="role" required defaultValue="">
              <option value="" disabled>
                Select role…
              </option>
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </div>
        </fieldset>

        <div>
          <button className="create_button" type="submit">
            Create account
          </button>
        </div>

        <div className="existingUser">
          <p>
            Already have an account? <a href="index.html">Sign in</a>
          </p>
        </div>
      </form>
    </div>
  );
}
