const API_BASE = import.meta.env?.VITE_API_BASE ||'http://localhost:5000'; // Flask dev server
 
//send HTTP request in Flask
document.getElementById('login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  // handle { token, role } or { error }
});