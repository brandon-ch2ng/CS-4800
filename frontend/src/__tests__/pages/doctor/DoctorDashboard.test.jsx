import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DoctorDashboard from '../../../pages/doctor/DoctorDashboard';

describe('DoctorDashboard Component', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
    localStorage.setItem('role', 'doctor');
  });

  it('renders doctor dashboard', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/welcome doctor/i)).toBeInTheDocument();
      expect(screen.getByText(/doctor dashboard/i)).toBeInTheDocument();
    });
  });

  it('displays patient email input', () => {
    render(<DoctorDashboard />);

    expect(screen.getByPlaceholderText(/patient@example.com/i)).toBeInTheDocument();
  });

  it('loads patient notes', async () => {
    const user = userEvent.setup();
    
    render(<DoctorDashboard />);

    const emailInput = screen.getByPlaceholderText(/patient@example.com/i);
    await user.type(emailInput, 'patient@test.com');

    const loadButton = screen.getByRole('button', { name: /load notes/i });
    await user.click(loadButton);

    await waitFor(() => {
      expect(screen.getByText(/follow-up needed/i)).toBeInTheDocument();
    });
  });

  it('adds new note', async () => {
    const user = userEvent.setup();
    
    render(<DoctorDashboard />);

    const emailInput = screen.getByPlaceholderText(/patient@example.com/i);
    await user.type(emailInput, 'patient@test.com');

    const noteInput = screen.getByPlaceholderText(/write a note/i);
    await user.type(noteInput, 'Patient is improving');

    const saveButton = screen.getByRole('button', { name: /save note/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(noteInput).toHaveValue('');
    });
  });

  it('displays appointments section', async () => {
    render(<DoctorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/appointments/i)).toBeInTheDocument();
    });
  });

  it('loads patient profile', async () => {
    const user = userEvent.setup();
    
    render(<DoctorDashboard />);

    const emailInput = screen.getByPlaceholderText(/patient@example.com/i);
    await user.type(emailInput, 'patient@test.com');

    const loadProfileButton = screen.getByRole('button', { name: /load profile/i });
    await user.click(loadProfileButton);

    await waitFor(() => {
      expect(screen.getByText(/age:/i)).toBeInTheDocument();
    });
  });
});
