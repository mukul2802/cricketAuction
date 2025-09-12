import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { OwnerDashboard } from './pages/OwnerDashboard';
import { ManagerDashboard } from './pages/ManagerDashboard';
import { PlayersPage } from './pages/PlayersPage';
import { TeamsPage } from './pages/TeamsPage';
import { UsersPage } from './pages/UsersPage';
import { PlayerImportPage } from './pages/PlayerImportPage';
import { LiveAuctionPage } from './pages/LiveAuctionPage';

import { PublicAuctionDisplay } from './pages/PublicAuctionDisplay';
import { OpenAuctionDisplay } from './pages/OpenAuctionDisplay';
import { OtherTeamsPage } from './pages/OtherTeamsPage';

export type PageType = 
  | 'dashboard' 
  | 'players' 
  | 'teams' 
  | 'users' 
  | 'import' 
  | 'auction' 
  | 'my-team'
  | 'other-teams'
  | 'public-auction'
  | 'open-auction';

export function Router() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  // Check if URL has public auction parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isPublicAuction = urlParams.get('display') === 'auction';
  const isOpenAuction = urlParams.get('display') === 'open';

  if (isPublicAuction) {
    return <PublicAuctionDisplay />;
  }

  if (isOpenAuction) {
    return <OpenAuctionDisplay />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard onNavigate={setCurrentPage} />;
        if (user?.role === 'owner') return <OwnerDashboard onNavigate={setCurrentPage} />;
        if (user?.role === 'manager') return <ManagerDashboard onNavigate={setCurrentPage} />;
        return <AdminDashboard onNavigate={setCurrentPage} />;
      case 'players':
        return <PlayersPage onNavigate={setCurrentPage} />;
      case 'teams':
        if (user?.role === 'owner') {
          return <OtherTeamsPage onNavigate={setCurrentPage} />;
        }
        return <TeamsPage onNavigate={setCurrentPage} />;
      case 'users':
        return <UsersPage onNavigate={setCurrentPage} />;
      case 'import':
        return <PlayerImportPage onNavigate={setCurrentPage} />;
      case 'auction':
        return <LiveAuctionPage onNavigate={setCurrentPage} />;
      case 'public-auction':
        return <PublicAuctionDisplay />;
      case 'open-auction':
        return <OpenAuctionDisplay />;
      default:
        return <AdminDashboard onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
    </div>
  );
}