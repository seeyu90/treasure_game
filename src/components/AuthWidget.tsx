import { useState } from 'react';
import { Button } from './ui/button';
import { AuthDialog } from './AuthDialog';
import { HistoryDialog } from './HistoryDialog';
import { useAuth } from '../contexts/AuthContext';

export function AuthWidget() {
  const { user, isLoading, logout } = useAuth();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  if (isLoading) return null;

  return (
    <div className="absolute top-4 right-4 flex items-center gap-2 text-sm">
      {user ? (
        <>
          <span className="text-amber-800">Hi, {user.username}</span>
          <Button variant="outline" size="sm" onClick={() => setHistoryDialogOpen(true)}>
            History
          </Button>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </>
      ) : (
        <>
          <span className="text-amber-700">Guest</span>
          <Button variant="outline" size="sm" onClick={() => setAuthDialogOpen(true)}>
            Login / Sign Up
          </Button>
        </>
      )}
      <AuthDialog open={authDialogOpen} onOpenChange={setAuthDialogOpen} />
      <HistoryDialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen} />
    </div>
  );
}
