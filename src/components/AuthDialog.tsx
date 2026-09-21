import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CredentialsForm({
  mode,
  onSubmit,
}: {
  mode: 'login' | 'signup';
  onSubmit: (username: string, password: string) => Promise<void>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${mode}-username`}>Username</Label>
        <Input
          id={`${mode}-username`}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={`${mode}-password`}>Password</Label>
        <Input
          id={`${mode}-password`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700 text-white">
        {mode === 'login' ? 'Log In' : 'Sign Up'}
      </Button>
    </form>
  );
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
  const { login, signup } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    await login(username, password);
    onOpenChange(false);
  };

  const handleSignup = async (username: string, password: string) => {
    await signup(username, password);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login / Sign Up</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="login">
          <TabsList className="w-full">
            <TabsTrigger value="login">Log In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <CredentialsForm mode="login" onSubmit={handleLogin} />
          </TabsContent>
          <TabsContent value="signup">
            <CredentialsForm mode="signup" onSubmit={handleSignup} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
