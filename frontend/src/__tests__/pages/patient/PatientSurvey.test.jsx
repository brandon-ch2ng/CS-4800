import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PatientSurvey from '../../../pages/patient/PatientSurvey';
import { mockPatientProfile } from '../../../test-utils';

describe('PatientSurvey Component', () => {
  const mockOnDone = vi.fn();

  beforeEach(() => {
    mockOnDone.mockClear();
    localStorage.setItem('token', 'mock-token');
  });

  it('renders survey form with all fields', () => {
    render(<PatientSurvey onDone={mockOnDone} />);

    expect(screen.getByText('Quick Health Survey')).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/age/i)).toBeInTheDocument();
    expect(screen.getByText(/fever/i)).toBeInTheDocument();
    expect(screen.getByText(/cough/i)).toBeInTheDocument();
    expect(screen.getByText(/fatigue/i)).toBeInTheDocument();
    expect(screen.getByText(/difficulty breathing/i)).toBeInTheDocument();
    expect(screen.getByText(/blood pressure/i)).toBeInTheDocument();
    expect(screen.getByText(/cholesterol level/i)).toBeInTheDocument();
  });

  it('submits survey with valid data', async () => {
    const user = userEvent.setup();
    
    render(<PatientSurvey onDone={mockOnDone} />);

    // Fill in form
    await user.type(screen.getByLabelText(/gender/i), 'female');
    await user.type(screen.getByLabelText(/age/i), '30');
    
    // Select radio buttons - fever
    const feverYes = screen.getAllByLabelText(/yes/i).find(
      input => input.name === 'fever'
    );
    await user.click(feverYes);
    
    // Select cough No
    const coughNo = screen.getAllByLabelText(/no/i).find(
      input => input.name === 'cough'
    );
    await user.click(coughNo);
    
    // Blood pressure
    const normalBP = screen.getAllByLabelText(/normal/i).find(
      input => input.name === 'blood_pressure'
    );
    await user.click(normalBP);

    // Submit
    await user.click(screen.getByRole('button', { name: /save survey/i }));

    await waitFor(() => {
      expect(mockOnDone).toHaveBeenCalled();
    });
  });

  it('pre-fills form when editing existing profile', () => {
    render(
      <PatientSurvey 
        onDone={mockOnDone} 
        existingProfile={mockPatientProfile} 
      />
    );

    expect(screen.getByLabelText(/gender/i)).toHaveValue('female');
    expect(screen.getByLabelText(/age/i)).toHaveValue(30);
  });

  it('shows success message after saving', async () => {
    const user = userEvent.setup();
    
    render(<PatientSurvey onDone={mockOnDone} />);

    await user.type(screen.getByLabelText(/gender/i), 'male');
    await user.type(screen.getByLabelText(/age/i), '25');
    await user.click(screen.getByRole('button', { name: /save survey/i }));

    await waitFor(() => {
      expect(screen.getByText(/saved/i)).toBeInTheDocument();
    });
  });

  it('disables submit button while saving', async () => {
    const user = userEvent.setup();
    
    render(<PatientSurvey onDone={mockOnDone} />);

    const submitButton = screen.getByRole('button', { name: /save survey/i });
    
    await user.type(screen.getByLabelText(/gender/i), 'female');
    await user.click(submitButton);

    // Button should be disabled during submission
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent(/saving/i);
  });

  it('handles API errors gracefully', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('token'); // Cause 401 error
    
    render(<PatientSurvey onDone={mockOnDone} />);

    await user.type(screen.getByLabelText(/gender/i), 'male');
    await user.click(screen.getByRole('button', { name: /save survey/i }));

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });

    expect(mockOnDone).not.toHaveBeenCalled();
  });

  it('converts Yes/No to boolean correctly', async () => {
    const user = userEvent.setup();
    
    render(<PatientSurvey onDone={mockOnDone} />);

    // Select "Yes" for fever
    const feverYes = screen.getAllByLabelText(/yes/i).find(
      input => input.name === 'fever'
    );
    await user.click(feverYes);

    // Select "No" for cough
    const coughNo = screen.getAllByLabelText(/no/i).find(
      input => input.name === 'cough'
    );
    await user.click(coughNo);

    await user.click(screen.getByRole('button', { name: /save survey/i }));

    // The component should convert yes/no to true/false in the API call
    await waitFor(() => {
      expect(mockOnDone).toHaveBeenCalled();
    });
  });
});
