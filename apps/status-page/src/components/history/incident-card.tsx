import { IconAlertTriangle, IconTrash } from '@tabler/icons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertAction, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DateRange } from './date-range';
import type { IncidentEvent } from './types';

interface IncidentCardProps {
  event: IncidentEvent;
  /** Operator only. Offered once the incident has ended: the next check run owns an open one. */
  onDelete?: () => void;
}

export function IncidentCard({ event, onDelete }: IncidentCardProps) {
  const startDate = new Date(event.start * 1000);
  const endDate = event.end ? new Date(event.end * 1000) : null;
  const isOngoing = !event.end;
  const latestError = event.errors.at(-1) ?? 'Unknown error';

  return (
    <Alert variant="down">
      <AlertTitle>
        <IconAlertTriangle className="h-4 w-4 text-status-down-text" />
        {event.monitorName}
        <Badge variant="outline">Incident</Badge>
        {isOngoing && <Badge variant="destructive">Ongoing</Badge>}
      </AlertTitle>

      <AlertDescription className="mt-1.5">
        <p className="text-foreground">{latestError}</p>
        <DateRange
          start={startDate}
          end={endDate}
          noEndLabel="Ongoing"
          noEndClassName="text-status-down-text"
        />
      </AlertDescription>

      {onDelete && !isOngoing && (
        <AlertAction>
          <Button
            variant="ghost-destructive"
            size="icon-sm"
            onClick={onDelete}
            aria-label={`Delete ${event.monitorName} incident`}
          >
            <IconTrash className="size-4" />
          </Button>
        </AlertAction>
      )}
    </Alert>
  );
}
