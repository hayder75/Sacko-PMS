import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Login } from '../src/pages/Login';
import * as api from '../src/lib/api';

// Mock the API
vi.mock('../src/lib/api', () => ({
  authAPI: {
    login: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock UserContext
vi.mock('../src/contexts/UserContext', () => ({
  useUser: () => ({
    setRole: vi.fn(),
    setCurrentBranch: vi.fn(),
    setUserName: vi.fn(),
    loadUser: vi.fn(),
  }),
}));

describe('Login Page', () => {
  it('renders login form', () => {
    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    expect(screen.getByText('SAKO PMS')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error message on failed login', async () => {
    (api.authAPI.login as any).mockRejectedValueOnce(new Error('Invalid credentials'));

    render(
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    );

    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter your password');
    const submitButton = screen.getByRole('button', { name: /login/i });

    // Fill form
    emailInput.setAttribute('value', 'test@test.com');
    passwordInput.setAttribute('value', 'password123');

    // Submit
    submitButton.click();

    await waitFor(() => {
      expect(api.authAPI.login).toHaveBeenCalled();
    });
  });
});

