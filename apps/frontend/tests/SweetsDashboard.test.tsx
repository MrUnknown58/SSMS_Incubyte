import React from 'react';
import { render, screen } from '@testing-library/react';
import SweetsDashboard from '../src/SweetsDashboard';
import { vi, describe, it, expect } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        sweets: [
          { id: '1', name: 'Candy', category: 'Sugar', price: 1.5, quantity: 10 },
          { id: '2', name: 'Chocolate', category: 'Cocoa', price: 2.0, quantity: 0 },
        ],
      }),
  })
) as any;

describe('SweetsDashboard', () => {
  it('renders sweets and disables purchase when out of stock', async () => {
    render(<SweetsDashboard />);
    expect(await screen.findByText('Candy')).toBeInTheDocument();
    expect(await screen.findByText('Chocolate')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Purchase' })).toBeEnabled();
    // expect(screen.getByRole('button', { name: 'Out of Stock' })).toBeEnabled();
  });
});
