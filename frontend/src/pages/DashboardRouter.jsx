//After log in -> navigate to dashboard 
//This route decide wether to go patient or doctor dashboard
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../api";

export default function DashboardRouter() {
  const nav = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const me = await apiGet("/auth/me"); //call this to get WHO logged in
        if (me.role === "patient") nav("/patient", { replace: true }); //redirect
        else if (me.role === "doctor") nav("/doctor", { replace: true }); //redirect
        else nav("/login", { replace: true });
      } catch {
        nav("/login", { replace: true });
      }
    })();
  }, [nav]);

  return (
  <h1> Redirecting.. </h1>
); // or a small spinner while redirecting
}
