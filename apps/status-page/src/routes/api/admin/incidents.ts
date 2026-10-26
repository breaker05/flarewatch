import { createFileRoute } from '@tanstack/react-router';
import { isJsonObject, isNonEmptyString } from '@flarewatch/shared';
import { deleteIncident } from '@/lib/monitor-worker';
import { forgetCachedView } from '@/lib/snapshots';
import { jsonError, readBody } from '@/lib/admin-http';

/** An incident is the monitor's id and the Unix second its first segment began, as the feed keys it. */
function parseIncidentPayload(body: unknown): { monitor: string; start: number } | null {
  if (!isJsonObject(body) || !isNonEmptyString(body.monitor)) return null;
  const { start } = body;
  if (typeof start !== 'number' || !Number.isInteger(start) || start < 0) return null;
  return { monitor: body.monitor, start };
}

export const Route = createFileRoute('/api/admin/incidents')({
  server: {
    handlers: {
      DELETE: async ({ request }: { request: Request }) => {
        try {
          const payload = parseIncidentPayload(await readBody(request));
          if (!payload) {
            return jsonError('monitor and start are required', 400);
          }

          const outcome = await deleteIncident(payload.monitor, payload.start);
          if (outcome === 'missing') return jsonError('Incident not found', 404);
          if (outcome === 'open') return jsonError('Incident is still open', 409);
          forgetCachedView();
          return new Response(null, { status: 204 });
        } catch (error) {
          console.error('Error deleting incident:', error);
          return jsonError('Internal server error', 500);
        }
      },
    },
  },
});
