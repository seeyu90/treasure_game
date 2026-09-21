import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { fetchHistory, type GameHistoryEntry } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';

interface HistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const RESULT_LABEL: Record<GameHistoryEntry['result'], string> = {
  win: '贏',
  lose: '輸',
  tie: '平手',
};

export function HistoryDialog({ open, onOpenChange }: HistoryDialogProps) {
  const { token } = useAuth();
  const [games, setGames] = useState<GameHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !token) return;
    setIsLoading(true);
    setError(null);
    fetchHistory(token)
      .then(({ games }) => setGames(games))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
      .finally(() => setIsLoading(false));
  }, [open, token]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Score History</DialogTitle>
        </DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {error && <p className="text-sm text-red-600">{error}</p>}
        {!isLoading && !error && games.length === 0 && (
          <p className="text-sm text-muted-foreground">No games recorded yet.</p>
        )}
        {!isLoading && !error && games.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Time</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {games.map((game) => (
                <TableRow key={game.id}>
                  <TableCell>{new Date(game.created_at + 'Z').toLocaleString()}</TableCell>
                  <TableCell className={game.score >= 0 ? 'text-green-600' : 'text-red-600'}>
                    ${game.score}
                  </TableCell>
                  <TableCell>{RESULT_LABEL[game.result]}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  );
}
