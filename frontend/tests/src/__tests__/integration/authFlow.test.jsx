import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from '../../pages/Login';
import Signup from '../../pages/Signup';
import DashboardRouter from '../../pages/DashboardRouter';
import PatientDashboard from '../../pages/patient/PatientDashboard';
import DoctorDashboard from '../../pages/doctor/DoctorDashboard';
import ProtectedRoute from '../../auth/ProtectedRoute';

describe('Authentication Flow Integration Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('completes full signup and login flow', async () => {
    const user = userEvent.setup();
    
    const { rerender } = render(
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    );

    // Fill signup form
    await user.type(screen.getByLabelText(/email/i), 'newuser@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'New');
    await user.type(screen.getByLabelText(/last name/i), 'User');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm/i), 'Password123');
    await user.selectOptions(screen.getByLabelText(/role/i), 'patient');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Should redirect to login - rerender with login page
    await waitFor(() => {
      rerender(
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
          </Routes>
        </BrowserRouter>
      );
    });

    // Now login
    await user.type(screen.getByLabelText(/email/i), 'patient@test.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeTruthy();
    });
  });

  it('redirects unauthenticated users to login', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('allows authenticated users to access protected routes', () => {
    localStorage.setItem('token', 'mock-token');

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Protected Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('dashboard router redirects based on role', async () => {
    localStorage.setItem('token', 'mock-token');

    render(
      <BrowserRouter>
        <Routes>
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/patient" element={<div>Patient Dashboard</div>} />
          <Route path="/doctor" element={<div>Doctor Dashboard</div>} />
        </Routes>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/patient dashboard/i)).toBeInTheDocument();
    });
  });
});
