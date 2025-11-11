import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Trophy, Shield } from 'lucide-react';
import { authApi } from '../../api';
import { DEMO_ACCOUNTS, ERROR_MESSAGES } from '../../constants';
import { ImageWithFallback } from '../../../components/figma/ImageWithFallback';

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
        setError(ERROR_MESSAGES.INVALID_CREDENTIALS);
      }
    } catch (err) {
      setError(ERROR_MESSAGES.LOGIN_FAILED);
    } finally {
      setLoading(false);
    }
  };

  const createAdmin = async () => {
    try {
      // Create initial admin user using the auth API
      await authApi.createUser(
        DEMO_ACCOUNTS.ADMIN.email,
        DEMO_ACCOUNTS.ADMIN.password,
        {
          name: 'Admin User',
          role: 'admin',
          email: DEMO_ACCOUNTS.ADMIN.email
        }
      );
    } catch (error) {
      console.error('Error creating admin:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-slate-900 to-emerald-900/20 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo and Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-4">
            <ImageWithFallback src="https://res.cloudinary.com/dsvzjigqx/image/upload/v1762244816/Asset_2_4x_wyrtd5.png" alt="Thoughtwin Premier League (TPL) Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Thoughtwin Premier League Auction - 2025</h1>
          <p className="text-foreground text-lg font-medium drop-shadow-sm">Player Bidding System</p>
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
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  window.open('?display=auction', '_blank');
                }}
              >
                <ImageWithFallback src="https://res.cloudinary.com/dsvzjigqx/image/upload/v1762244816/Asset_2_4x_wyrtd5.png" alt="TPL" className="w-6 h-6 mr-2 object-contain" />
                Open Auction Display
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Demo Accounts */}
        {/* <Card>
          <CardHeader>
            <CardTitle>Demo Account</CardTitle>
            <CardDescription>
              Use this account to access the system (password: "admin123")
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                setEmail(DEMO_ACCOUNTS.ADMIN.email);
                setPassword(DEMO_ACCOUNTS.ADMIN.password);
              }}
            >
              <Shield className="w-4 h-4" />
              <span>Admin</span>
              <span className="ml-auto text-xs text-muted-foreground">
                {DEMO_ACCOUNTS.ADMIN.email}
              </span>
            </Button>
          </CardContent>
          <CardFooter>
            <Button 
              variant="link" 
              className="w-full justify-center"
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                createAdmin();
              }}
            >
              Create Admin in DB
            </Button>
          </CardFooter>
        </Card> */}
      </div>
    </div>
  );
}