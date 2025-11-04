// src/api.js
export async function apiGet(path) {
  //Get the stored JWT token from backend 
  //every time make an API call, need to attach that token in request headers.
  const token = localStorage.getItem("token");
  //Call the backend API with that token in the Authorization header
  const res = await fetch(path, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);

  //Parse and return the JSON response body
  return data;
}
