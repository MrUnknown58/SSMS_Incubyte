import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminPanel from '../src/AdminPanel';
import { vi, describe, it, expect } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        sweets: [{ id: '1', name: 'Candy', category: 'Sugar', price: 1.5, quantity: 10 }],
      }),
  })
) as any;

describe('AdminPanel', () => {
  it('renders sweets and allows edit', async () => {
    render(<AdminPanel />);
    expect(await screen.findByText('Candy')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByDisplayValue('Candy')).toBeInTheDocument();
  });
});
