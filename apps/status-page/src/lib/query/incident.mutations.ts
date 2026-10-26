import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Snapshot } from '../public-view';
import { qk } from './keys';
import { requestOk, reportError, type MutationCallbacks } from './request';

const API_PATH = '/api/admin/incidents';

/** The monitor's id and the Unix second the incident began: how the feed and History name one. */
export type IncidentKey = { monitor: string; start: number };

export function useDeleteIncident(callbacks?: MutationCallbacks<IncidentKey>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (key: IncidentKey) => {
      await requestOk(API_PATH, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key),
      });
      return key;
    },
    onSuccess: (key) => {
      queryClient.setQueryData<Snapshot>(qk.operatorSnapshot, (current) => {
        const monitor = current?.state?.monitors[key.monitor];
        if (!current?.state || !monitor) return current;
        const incidents = monitor.incidents.filter((incident) => incident.start[0] !== key.start);
        return {
          ...current,
          state: {
            ...current.state,
            monitors: { ...current.state.monitors, [key.monitor]: { ...monitor, incidents } },
          },
        };
      });
      void queryClient.invalidateQueries({ queryKey: qk.snapshot });
      callbacks?.onSuccess?.(key);
    },
    onError: (error) => reportError(queryClient, error, callbacks?.onError),
  });
}
