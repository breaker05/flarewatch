import { describe, expect, it } from 'vite-plus/test';
import type { MonitorTarget } from '@flarewatch/shared';
import { handleHubRequest } from '../src/hub/routes';
import { createHub, hubNamespace } from './helpers/hub';

const T = Date.parse('2026-01-15T12:00:00Z') / 1000;
const api: MonitorTarget = { id: 'api', name: 'API', method: 'GET', target: 'https://api.test' };
const failing = { ok: false as const, error: 'Unavailable' };
const working = { ok: true as const, latency: 10 };

function fixture() {
  const { hub, db } = createHub();
  const env = { MONITOR_HUB: hubNamespace(hub) };
  const record = (at: number, result: typeof failing | typeof working) =>
    hub.record(at, [{ monitor: api, check: { location: 'HEL', result } }]);
  const rows = () => (db.prepare('SELECT COUNT(*) AS n FROM incidents').get() as { n: number }).n;
  return {
    hub,
    db,
    record,
    rows,
    send: (path: string, method = 'DELETE') =>
      handleHubRequest(new Request(`https://internal${path}`, { method }), env),
  };
}

describe('deleting an incident', () => {
  it('removes a closed incident from storage and the view, then answers 404', async () => {
    const { hub, record, rows, send } = fixture();
    record(T, failing);
    record(T + 60, working);
    record(T + 3600, failing);
    record(T + 3660, working);
    expect(hub.view().monitors.api?.incidents).toHaveLength(2);
    expect(rows()).toBe(2);

    expect((await send(`/incidents/api/${T}`))?.status).toBe(204);
    expect(hub.view().monitors.api?.incidents).toEqual([
      { start: [T + 3600], error: ['Unavailable'], end: T + 3660 },
    ]);
    expect(rows()).toBe(1);
    expect((await send(`/incidents/api/${T}`))?.status).toBe(404);
    expect((await send(`/incidents/other/${T + 3600}`))?.status).toBe(404);
  });

  it('keeps an open incident and answers 409', async () => {
    const { hub, record, rows, send } = fixture();
    record(T, failing);

    const response = await send(`/incidents/api/${T}`);
    expect(response?.status).toBe(409);
    expect(await response?.json()).toEqual({ error: 'Incident is still open' });
    expect(hub.view().monitors.api?.incidents).toHaveLength(1);
    expect(rows()).toBe(1);
  });

  it('rejects a malformed monitor id or start', async () => {
    const { send } = fixture();
    expect((await send('/incidents/%ZZ/1'))?.status).toBe(400);
    expect((await send('/incidents/api/soon'))?.status).toBe(400);
    expect((await send('/incidents/api/1.5'))?.status).toBe(400);
    expect((await send('/incidents/api'))?.status).toBe(400);
    expect(await send('/incidents/api/1', 'GET')).toBeNull();
  });

  it('survives a restart without the deleted incident', async () => {
    const { db, record, send } = fixture();
    record(T, failing);
    record(T + 60, working);
    expect((await send(`/incidents/api/${T}`))?.status).toBe(204);
    expect(createHub(db).hub.view().monitors.api?.incidents).toEqual([]);
  });
});
