// public/js/signup.js
const API_BASE = import.meta.env?.VITE_API_BASE ||'http://localhost:5000'; // '' if the HTML is served by Flask itself

function setText(el, text) {
  if (!el) return;
  el.textContent = text || '';
  el.style.display = text ? 'block' : '';
}

function validatePassword(pw) {
  const errs = [];
  if (pw.length < 8) errs.push('At least 8 characters');
  if (!/[a-z]/.test(pw)) errs.push('One lowercase letter');
  if (!/[A-Z]/.test(pw)) errs.push('One uppercase letter');
  if (!/\d/.test(pw))   errs.push('One number');
  if (!/[^A-Za-z0-9]/.test(pw)) errs.push('One symbol');
  if (/\s/.test(pw)) errs.push('No spaces');
  return errs;
}

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('signup');
  if (!form) return;

  const errBox = document.getElementById('error');          // top error line
  const pw     = document.getElementById('password');
  const confirm= document.getElementById('confirm');        // optional confirm field
  const roleEl = document.getElementById('role');
  const confirmErr = document.getElementById('confirm-error'); // small line under confirm
  const btn = form.querySelector('button[type="submit"]');

  // inline confirm mismatch feedback (optional)
  function updateConfirm() {
    const mismatch = confirm && confirm.value && pw.value !== confirm.value;
    setText(confirmErr, mismatch ? 'Passwords do not match.' : '');
    confirm?.classList.toggle('invalid', mismatch);
  }
  pw?.addEventListener('input', updateConfirm);
  confirm?.addEventListener('input', updateConfirm);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setText(errBox, '');
    updateConfirm();

    const username = document.getElementById('username').value.trim();
    const password = pw.value;
    const role = roleEl.value;

    if (!username) return setText(errBox, 'Username is required.');
    if (!password) return setText(errBox, 'Password is required.');
    const pwErrs = validatePassword(password);
    if (pwErrs.length) return setText(errBox, `Password needs: ${pwErrs.join(', ')}`);
    if (confirm && password !== confirm.value) return; // inline message already shown
    if (!['patient','doctor'].includes(role)) return setText(errBox, 'Select a role.');

    // IMPORTANT: Flask expects ONLY these three fields
    const payload = { username, password, role };

    btn.disabled = true;
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      // Flask returns 201 on success, 400 on errors like "User already exists"
      if (res.status === 201) {
        // go back to login
        window.location.href = '/index.html';
      } else {
        setText(errBox, data.error || `Error ${res.status}`);
      }
    } catch (err) {
      console.error(err);
      setText(errBox, 'Network error. Try again.');
    } finally {
      btn.disabled = false;
    }
  });
});
