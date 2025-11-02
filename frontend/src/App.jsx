import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";                 // you already have this
import ProtectedRoute from "./auth/ProtectedRoute";
import PatientDashboard from "./pages/patient/PatientDashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Patient area (uses your patient_routes.py endpoints) */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <PatientDashboard />
            </ProtectedRoute>
          }
        />

        {/* After login you can navigate to /patient directly */}
        <Route path="*" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}
