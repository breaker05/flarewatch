// @vitest-environment jsdom

import { fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vite-plus/test';
import type { IncidentEvent } from '@/components/history/types';
import { renderWithProviders } from '../helpers/render';

import { IncidentCard } from '@/components/history/incident-card';
import { DeleteIncidentDialog } from '@/components/history/delete-incident-dialog';

const START = Date.parse('2026-01-15T12:00:00Z') / 1000;
const closed: IncidentEvent = {
  type: 'incident',
  monitorId: 'api',
  monitorName: 'API',
  start: START,
  end: START + 60,
  errors: ['Unavailable'],
};
const ongoing: IncidentEvent = { ...closed, end: undefined };

const deleteButton = () => screen.queryByRole('button', { name: 'Delete API incident' });

describe('IncidentCard', () => {
  it('offers delete on a closed incident only when the operator can act', () => {
    const onDelete = vi.fn();
    const { unmount } = renderWithProviders(<IncidentCard event={closed} />);
    expect(deleteButton()).toBeNull();
    unmount();

    renderWithProviders(<IncidentCard event={closed} onDelete={onDelete} />);
    fireEvent.click(deleteButton()!);
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('never offers delete on an ongoing incident', () => {
    renderWithProviders(<IncidentCard event={ongoing} onDelete={() => {}} />);
    expect(deleteButton()).toBeNull();
    expect(screen.getAllByText('Ongoing').length).toBeGreaterThan(0);
  });
});

describe('DeleteIncidentDialog', () => {
  it('sends the incident identity, then closes', async () => {
    const fetch = vi.fn(
      async (_input: string, _init?: RequestInit) => new Response(null, { status: 204 }),
    );
    vi.stubGlobal('fetch', fetch);
    const onClose = vi.fn();
    renderWithProviders(<DeleteIncidentDialog open incident={closed} onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'Delete incident' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(fetch).toHaveBeenCalledWith('/api/admin/incidents', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ monitor: 'api', start: START }),
    });
  });

  it('shows the server error and stays open', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ error: 'Incident not found' }, { status: 404 })),
    );
    const onClose = vi.fn();
    renderWithProviders(<DeleteIncidentDialog open incident={closed} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(await screen.findByText('Incident not found')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});
