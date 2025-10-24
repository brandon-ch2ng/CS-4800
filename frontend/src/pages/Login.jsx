import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
//import './login.css'

export default function Login() {
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function onSubmit(e) {
    e.preventDefault()
    const form = e.currentTarget
    if (!form.reportValidity()) return

    const email = form.email.value.trim()  // ← match your input name
    const password = form.password.value

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }) // ← backend expects "email"
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) {
      setError(data.error || `Login failed (${res.status})`)
      return
    }
    localStorage.setItem('token', data.token)
    localStorage.setItem('role', data.role)
    nav('/dashboard')
  }

  return (
    <div className="form">
        <h1 className="login">Login</h1>
        <form id="login" onSubmit={onSubmit} noValidate>
          <div className="field_one">
            <label htmlFor="email">Email</label>
            <div className="input-with-icon">
              <input type="email" id="email" name="email" required />
              <i className="bx bxs-user" />
            </div>
          </div>

          <div className="field_one">
            <label htmlFor="password">Password</label>
            <div className="input-with-icon">
              <input type="password" id="password" name="password" required />
              <i className="bx bxs-lock-alt" />
            </div>
          </div>

          {error && <div id="login-error" className="error">{error}</div>}

          <button className="login_button" type="submit">Login</button>

          <div className="helper">
             New user? <Link to="/signup">Create account</Link>
          </div>
        </form>
      </div>
  )
}
