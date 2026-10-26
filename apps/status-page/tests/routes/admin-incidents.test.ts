import { describe, expect, it, vi } from 'vite-plus/test';
import { Route } from '@/routes/api/admin/incidents';
import { readVisitorSnapshot } from '@/lib/snapshots';
import { stubMonitorWorker } from '../helpers/bindings';
import { forgetViewAroundEachTest } from '../helpers/snapshots';

forgetViewAroundEachTest();

type Handler = (ctx: { request: Request }) => Promise<Response>;
function send(method: string, body?: unknown) {
  const options = Route.options as { server?: { handlers?: Record<string, Handler> } };
  const handler = options.server?.handlers?.[method];
  if (!handler) throw new Error(`Missing incident ${method}`);
  return handler({
    request: new Request('https://status.test/api/admin/incidents', {
      method,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    }),
  });
}

const START = Date.parse('2026-01-15T12:00:00Z') / 1000;

/** A hub with one closed and one open incident on `api`, answering the view and the delete. */
function stubHub() {
  let incidents = [
    { start: [START], error: ['Unavailable'], end: START + 60 },
    { start: [START + 3600], error: ['Unavailable'] },
  ];
  const fetch = vi.fn(async (url: string, init?: RequestInit) => {
    if (init?.method === 'DELETE') {
      const [monitor, start] = new URL(url).pathname.slice('/incidents/'.length).split('/');
      const found = incidents.find((i) => i.start[0] === Number(start));
      if (monitor !== 'api' || !found) return new Response(null, { status: 404 });
      if (found.end === undefined) {
        return Response.json({ error: 'Incident is still open' }, { status: 409 });
      }
      incidents = incidents.filter((i) => i !== found);
      return new Response(null, { status: 204 });
    }
    return Response.json({
      lastUpdate: START + 7200,
      monitors: { api: { status: 'down', incidents } },
      maintenances: [],
      announcements: [],
    });
  });
  stubMonitorWorker(fetch);
  return fetch;
}

describe('DELETE /api/admin/incidents', () => {
  it('deletes a closed incident through the hub and forgets the cached view', async () => {
    const fetch = stubHub();
    const viewReads = () => fetch.mock.calls.filter(([url]) => url.endsWith('/view')).length;
    await readVisitorSnapshot();
    await readVisitorSnapshot();
    expect(viewReads()).toBe(1);

    const response = await send('DELETE', { monitor: 'api', start: START });
    expect(response.status).toBe(204);
    expect(fetch).toHaveBeenCalledWith(`https://internal/incidents/api/${START}`, {
      method: 'DELETE',
    });
    await readVisitorSnapshot();
    expect(viewReads()).toBe(2);
  });

  it('answers 404 for an unknown incident and 409 for an open one', async () => {
    stubHub();
    const missing = await send('DELETE', { monitor: 'api', start: START + 1 });
    expect(missing.status).toBe(404);
    expect(await missing.json()).toEqual({ error: 'Incident not found' });

    const open = await send('DELETE', { monitor: 'api', start: START + 3600 });
    expect(open.status).toBe(409);
    expect(await open.json()).toEqual({ error: 'Incident is still open' });
  });

  it('rejects a body without a monitor id and a whole start timestamp', async () => {
    const fetch = stubHub();
    for (const body of [
      undefined,
      {},
      { monitor: 'api' },
      { start: START },
      { monitor: '', start: START },
      { monitor: 'api', start: String(START) },
      { monitor: 'api', start: 1.5 },
      { monitor: 'api', start: -1 },
    ]) {
      const response = await send('DELETE', body);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'monitor and start are required' });
    }
    expect(fetch).not.toHaveBeenCalled();
  });

  it('answers 500 when the hub call fails', async () => {
    stubMonitorWorker(async () => {
      throw new Error('boom');
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const response = await send('DELETE', { monitor: 'api', start: START });
    expect(response.status).toBe(500);
  });
});
