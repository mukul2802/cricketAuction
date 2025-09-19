import React from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { Router } from './components/Router';
import { Toaster } from '../components/ui/sonner';
import { useAuth } from '../contexts/AuthContext';
import { PublicAuctionPage } from './components/pages/PublicAuctionPage';

function AppContent() {
  const { loading } = useAuth();
  
  // Check if this is the public auction route
  const isPublicAuction = window.location.pathname === '/public-auction' || 
                          window.location.hash === '#/public-auction' ||
                          window.location.search.includes('display=auction');
  
  // For public auction, don't show loading and don't require auth
  if (isPublicAuction) {
    return (
      <>
        <PublicAuctionPage />
        <Toaster />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading Cricket Auction System...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}