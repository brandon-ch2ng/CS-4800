import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AppointmentBooking from '../../../pages/patient/AppointmentBooking.jsx';

describe('AppointmentBooking Component', () => {
  const mockOnCancel = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    mockOnCancel.mockClear();
    mockOnSuccess.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders booking form', () => {
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByText('Book New Appointment')).toBeInTheDocument();
    expect(screen.getByLabelText(/doctor's email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/appointment date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/preferred time slot/i)).toBeInTheDocument();
  });

  it('displays time slots from 9AM to 5PM', () => {
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    expect(screen.getByText(/9 AM - 10 AM/i)).toBeInTheDocument();
    expect(screen.getByText(/4 PM - 5 PM/i)).toBeInTheDocument();
  });

  it('submits appointment successfully', async () => {
    const user = userEvent.setup();
    
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    // Fill form
    await user.type(screen.getByLabelText(/doctor's email/i), 'doctor@test.com');
    
    const dateInput = screen.getByLabelText(/appointment date/i);
    await user.type(dateInput, '2025-12-25');

    // Select time slot
    const timeSlot = screen.getByText(/10 AM - 11 AM/i);
    await user.click(timeSlot);

    // Add reason
    await user.type(screen.getByLabelText(/reason for visit/i), 'Regular checkup');

    // Submit
    await user.click(screen.getByRole('button', { name: /request appointment/i }));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    // Try to submit without filling
    await user.click(screen.getByRole('button', { name: /request appointment/i }));

    await waitFor(() => {
      expect(screen.getByText(/please enter doctor's email/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('calls onCancel when cancel button clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('selects only one time slot at a time', async () => {
    const user = userEvent.setup();
    
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    const slot1 = screen.getByText(/9 AM - 10 AM/i);
    const slot2 = screen.getByText(/10 AM - 11 AM/i);

    await user.click(slot1);
    expect(slot1).toHaveClass('selected');

    await user.click(slot2);
    expect(slot2).toHaveClass('selected');
    expect(slot1).not.toHaveClass('selected');
  });

  it('disables past dates', () => {
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    const dateInput = screen.getByLabelText(/appointment date/i);
    const today = new Date().toISOString().split('T')[0];
    
    expect(dateInput).toHaveAttribute('min', today);
  });

  it('handles submission errors', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('token'); // Cause 401 error
    
    render(
      <AppointmentBooking 
        onCancel={mockOnCancel} 
        onSuccess={mockOnSuccess} 
      />
    );

    await user.type(screen.getByLabelText(/doctor's email/i), 'doctor@test.com');
    await user.type(screen.getByLabelText(/appointment date/i), '2025-12-25');
    await user.click(screen.getByText(/10 AM - 11 AM/i));
    await user.click(screen.getByRole('button', { name: /request appointment/i }));

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });
});
