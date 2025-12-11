import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../auth/ProtectedRoute';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => {
      mockNavigate(to);
      return <div>Redirecting to {to}</div>;
    },
  };
});

describe('ProtectedRoute Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    localStorage.clear();
  });

  it('redirects to login when no token is present', () => {
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

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when token is present', () => {
    localStorage.setItem('token', 'mock-token-123');

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
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('redirects even with empty string token', () => {
    localStorage.setItem('token', '');

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

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('allows access with valid JWT-like token', () => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature');

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div>Secure Dashboard</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Secure Dashboard')).toBeInTheDocument();
  });
});
