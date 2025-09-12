import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Trophy, Shield, Users } from 'lucide-react';
import { createInitialAdminUser, setupFirebaseData } from '@/lib/setupFirebaseData';

export function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const success = await login(email, password);
      if (!success) {
        setError('Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Admin', email: 'admin@cricket.com', icon: Shield },
  ];

  const createAdmin = async () => {
await createInitialAdminUser();

// Setup sample teams and players (run once)
// await setupFirebaseData();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-900 to-emerald-900/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Cricket Auction</h1>
          <p className="text-muted-foreground">Player Bidding System</p>
        </div>

        {/* Login Form */}
        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access the auction system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              {error && (
                <div className="text-destructive text-sm">{error}</div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Public Auction Display Link */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-3">
                Want to view the live auction display?
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={(e) => {
                  e.preventDefault();
                  window.open('?display=auction', '_blank');
                }}
              >
                <Trophy className="w-4 h-4 mr-2" />
                Open Auction Display
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        <Card>
          <CardHeader>
            <CardTitle>Demo Account</CardTitle>
            <CardDescription>
              Use this account to access the system (password: "admin123")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {demoAccounts.map((account) => (
              <Button
                key={account.role}
                variant="outline"
                className="w-full justify-start gap-3"
                onClick={(e) => {
                  e.preventDefault();
                  setEmail(account.email);
                  setPassword('admin123');
                }}
              >
                <account.icon className="w-4 h-4" />
                <span>{account.role}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {account.email}
                </span>
              </Button>
            ))}
          </CardContent>
          <CardFooter>
            <Button 
              variant="link" 
              className="w-full justify-center"
              onClick={(e) => {
                e.preventDefault();
                createAdmin();
              }}
            >
              Create Admin in DB
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}