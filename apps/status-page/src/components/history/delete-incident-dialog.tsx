import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDeleteIncident } from '@/lib/query/incident.mutations';
import { mutationErrorMessage } from '@/lib/query/auth.mutations';
import type { IncidentEvent } from './types';

interface DeleteIncidentDialogProps {
  open: boolean;
  incident?: IncidentEvent;
  onClose: () => void;
}

export function DeleteIncidentDialog({ open, incident, onClose }: DeleteIncidentDialogProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteMutation = useDeleteIncident({
    onSuccess: onClose,
    onError: (error) => setErrorMessage(mutationErrorMessage(error)),
  });

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete incident</DialogTitle>
        </DialogHeader>
        {errorMessage && (
          <Alert variant="destructive">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <p className="py-4 text-muted-foreground">
          Delete this {incident?.monitorName ?? 'monitor'} incident from History, the uptime figures
          and the feed? This cannot be undone.
        </p>
        <div className="flex justify-end gap-2">
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button
            variant="destructive"
            onClick={() =>
              incident &&
              deleteMutation.mutate({ monitor: incident.monitorId, start: incident.start })
            }
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
