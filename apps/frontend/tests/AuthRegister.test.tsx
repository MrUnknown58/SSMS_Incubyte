import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AuthRegister from '../src/AuthRegister';
import { vi, describe, it, expect } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as any;

describe('AuthRegister', () => {
  it('renders registration form and submits', async () => {
    render(<AuthRegister />);
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Register' }));
    expect(await screen.findByText('Registration successful!')).toBeInTheDocument();
  });
});
