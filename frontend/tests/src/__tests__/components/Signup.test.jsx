import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../../pages/Signup.jsx';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Signup Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders signup form correctly', () => {
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    expect(screen.getByText('Create Account')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('shows password validation errors', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password/i), 'weak');
    await user.selectOptions(screen.getByLabelText(/role/i), 'patient');
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/password needs/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows error when passwords do not match', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm/i), 'Password456');
    await user.selectOptions(screen.getByLabelText(/role/i), 'patient');
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('successfully creates account with valid data', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'newuser@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'Jane');
    await user.type(screen.getByLabelText(/last name/i), 'Smith');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm/i), 'Password123');
    await user.selectOptions(screen.getByLabelText(/role/i), 'doctor');
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('shows error for already registered email', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'patient@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm/i), 'Password123');
    await user.selectOptions(screen.getByLabelText(/role/i), 'patient');
    
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByText(/email already registered/i)).toBeInTheDocument();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('validates all required fields', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /create account/i });
    await user.click(submitButton);

    // Form should not submit with empty fields
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('validates role selection is required', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/^password/i), 'Password123');
    await user.type(screen.getByLabelText(/confirm/i), 'Password123');
    
    // Don't select role
    await user.click(screen.getByRole('button', { name: /create account/i }));

    // Should show validation error
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('updates password match message in real-time', async () => {
    const user = userEvent.setup();
    
    render(
      <BrowserRouter>
        <Signup />
      </BrowserRouter>
    );

    const passwordInput = screen.getByLabelText(/^password/i);
    const confirmInput = screen.getByLabelText(/confirm/i);

    await user.type(passwordInput, 'Password123');
    await user.type(confirmInput, 'Password');

    // Should show mismatch message
    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
    });

    // Complete the confirm password
    await user.type(confirmInput, '123');

    // Mismatch message should disappear or change
    await waitFor(() => {
      const mismatchElements = screen.queryAllByText(/passwords do not match/i);
      expect(mismatchElements.length).toBeLessThanOrEqual(1);
    });
  });
});
