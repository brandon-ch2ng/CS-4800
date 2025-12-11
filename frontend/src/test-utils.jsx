import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

// Custom render function that wraps components with necessary providers
export function renderWithRouter(ui, { route = '/' } = {}) {
  window.history.pushState({}, 'Test page', route);
  
  return {
    ...render(ui, { wrapper: BrowserRouter }),
  };
}

// Mock localStorage
export const createMockStorage = () => {
  let store = {};
  
  return {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
};

// Setup authenticated user
export const setupAuthUser = (role = 'patient') => {
  const token = 'mock-jwt-token';
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  return token;
};

// Wait for async operations
export const waitFor = (callback, options = {}) => {
  return new Promise((resolve) => {
    const timeout = options.timeout || 1000;
    const interval = options.interval || 50;
    const startTime = Date.now();
    
    const check = () => {
      try {
        callback();
        resolve();
      } catch (error) {
        if (Date.now() - startTime > timeout) {
          throw error;
        }
        setTimeout(check, interval);
      }
    };
    
    check();
  });
};

// Mock API response
export const mockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  headers: new Headers({ 'content-type': 'application/json' }),
});

// Mock fetch
export const setupFetchMock = () => {
  global.fetch = vi.fn();
  return global.fetch;
};

// Common test data
export const mockPatientProfile = {
  age: 30,
  gender: 'female',
  blood_pressure: 'normal',
  cholesterol_level: 'normal',
  fever: false,
  cough: false,
  fatigue: false,
  difficulty_breathing: false,
  survey_completed: true,
};

export const mockDoctorNote = {
  _id: 'note123',
  note: 'Patient shows improvement',
  doctor_email: 'doctor@test.com',
  patient_email: 'patient@test.com',
  created_at: new Date().toISOString(),
  visible_to_patient: true,
};

export const mockAppointment = {
  _id: 'appt123',
  doctor_email: 'doctor@test.com',
  patient_email: 'patient@test.com',
  requested_time: new Date(Date.now() + 86400000).toISOString(),
  status: 'pending',
  reason: 'Regular checkup',
};

export const mockPrediction = {
  _id: 'pred123',
  result: {
    label: 0,
    probability: 0.85,
  },
  input_data: mockPatientProfile,
  created_at: new Date().toISOString(),
};
