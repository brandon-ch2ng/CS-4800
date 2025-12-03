import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import PatientDashboard from '../../../pages/patient/PatientDashboard.jsx';

describe('PatientDashboard Component', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', 'patient');
  });

  it('renders welcome message', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
  });

  it('displays patient profile when survey completed', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
      expect(screen.getByText(/age:/i)).toBeInTheDocument();
      expect(screen.getByText(/gender:/i)).toBeInTheDocument();
    });
  });

  it('shows survey when profile not completed', async () => {
    // Mock 404 response for profile
    global.fetch = vi.fn((url) => {
      if (url.includes('/patients/profile')) {
        return Promise.resolve({
          ok: false,
          status: 404,
          json: async () => ({ error: 'Profile not found' }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({ message: 'Welcome' }),
      });
    });

    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quick Health Survey')).toBeInTheDocument();
    });
  });

  it('displays doctor notes section', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/doctor notes/i)).toBeInTheDocument();
    });
  });

  it('displays AI Health Assistant section', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/ai health assistant/i)).toBeInTheDocument();
    });
  });

  it('displays appointments section', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/appointments/i)).toBeInTheDocument();
    });
  });

  it('allows editing profile', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/my profile/i)).toBeInTheDocument();
    });

    const editButton = screen.getByRole('button', { name: /edit profile/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Quick Health Survey')).toBeInTheDocument();
    });
  });

  it('allows making new appointment', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/appointments/i)).toBeInTheDocument();
    });

    const newApptButton = screen.getByRole('button', { name: /make new appointment/i });
    await user.click(newApptButton);

    await waitFor(() => {
      expect(screen.getByText('Book New Appointment')).toBeInTheDocument();
    });
  });

  it('handles 401 unauthorized errors', async () => {
    localStorage.removeItem('token');

    // Mock window.location.assign
    delete window.location;
    window.location = { assign: vi.fn() };

    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(window.location.assign).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading state initially', () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('displays appointment with correct status pill', async () => {
    render(
      <BrowserRouter>
        <PatientDashboard />
      </BrowserRouter>
    );

    await waitFor(() => {
      const statusPill = screen.getByText(/pending/i);
      expect(statusPill).toHaveClass('pat-pill');
    });
  });
});
