import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import AuthLogin from './AuthLogin';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ token: 'fake-token' }),
  })
) as any;

describe('AuthLogin', () => {
  it('renders login form and submits', async () => {
    render(<AuthLogin />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Login' }));
    expect(await screen.findByText('Login successful!')).toBeInTheDocument();
  });
});
