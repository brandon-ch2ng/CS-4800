import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiPredictionPanel from '../../../pages/patient/AiPredictionPanel.jsx';

describe('AiPredictionPanel Component', () => {
  beforeEach(() => {
    localStorage.setItem('token', 'mock-token');
  });

  it('renders AI prediction panel', () => {
    render(<AiPredictionPanel classPrefix="pd" />);

    expect(screen.getByText('AI Health Assistant')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /run prediction/i })).toBeInTheDocument();
  });

  it('displays override input fields', () => {
    render(<AiPredictionPanel classPrefix="pd" />);

    expect(screen.getByPlaceholderText(/female \/ male/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/e\.g\., 42/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/low \/ normal \/ high/i)).toBeInTheDocument();
  });

  it('runs prediction successfully', async () => {
    const user = userEvent.setup();
    
    render(<AiPredictionPanel classPrefix="pd" />);

    const runButton = screen.getByRole('button', { name: /run prediction/i });
    await user.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/confident/i)).toBeInTheDocument();
    });
  });

  it('allows override inputs', async () => {
    const user = userEvent.setup();
    
    render(<AiPredictionPanel classPrefix="pd" />);

    const genderInput = screen.getByPlaceholderText(/female \/ male/i);
    await user.type(genderInput, 'Male');

    const ageInput = screen.getByPlaceholderText(/e\.g\., 42/i);
    await user.type(ageInput, '35');

    expect(genderInput).toHaveValue('Male');
    expect(ageInput).toHaveValue('35');
  });

  it('displays chatbot after prediction', async () => {
    const user = userEvent.setup();
    
    render(<AiPredictionPanel classPrefix="pd" />);

    await user.click(screen.getByRole('button', { name: /run prediction/i }));

    await waitFor(() => {
      expect(screen.getByText(/what do my results mean/i)).toBeInTheDocument();
      expect(screen.getByText(/what should i do next/i)).toBeInTheDocument();
    });
  });

  it('handles prediction errors', async () => {
    const user = userEvent.setup();
    localStorage.removeItem('token'); // Cause 401 error
    
    render(<AiPredictionPanel classPrefix="pd" />);

    await user.click(screen.getByRole('button', { name: /run prediction/i }));

    await waitFor(() => {
      expect(screen.getByText(/unauthorized/i)).toBeInTheDocument();
    });
  });

  it('disables button during prediction', async () => {
    const user = userEvent.setup();
    
    render(<AiPredictionPanel classPrefix="pd" />);

    const runButton = screen.getByRole('button', { name: /run prediction/i });
    await user.click(runButton);

    expect(runButton).toBeDisabled();
    expect(runButton).toHaveTextContent(/running/i);
  });

  it('interacts with chatbot questions', async () => {
    const user = userEvent.setup();
    
    render(<AiPredictionPanel classPrefix="pd" />);

    // Run prediction first
    await user.click(screen.getByRole('button', { name: /run prediction/i }));

    await waitFor(() => {
      expect(screen.getByText(/what do my results mean/i)).toBeInTheDocument();
    });

    // Click a chatbot question
    const questionButton = screen.getByRole('button', { name: /what do my results mean/i });
    await user.click(questionButton);

    await waitFor(() => {
      expect(screen.getAllByText(/prediction result/i).length).toBeGreaterThan(1);
    });
  });
});
