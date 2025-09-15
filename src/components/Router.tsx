import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { AdminDashboard } from '../../components/pages/AdminDashboard';
import { OwnerDashboard } from '../../components/pages/OwnerDashboard';
import { ManagerDashboard } from '../../components/pages/ManagerDashboard';
import { PlayersPage } from '../../components/pages/PlayersPage';
import { TeamsPage } from '../../components/pages/TeamsPage';
import { UsersPage } from '../../components/pages/UsersPage';
import { LiveAuctionPage } from '../../components/pages/LiveAuctionPage';
import { PlayerImportPage } from '../../components/pages/PlayerImportPage';
import { OtherTeamsPage } from '../../components/pages/OtherTeamsPage';
import { LoginPage } from '../pages/Auth/Login';

export type PageType = 
  | 'dashboard' 
  | 'players' 
  | 'teams' 
  | 'users'
  | 'auction'
  | 'live-auction'
  | 'import'
  | 'other-teams';

export function Router() {
  const { isAuthenticated, user } = useAuth();
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard');

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        if (user?.role === 'admin') return <AdminDashboard onNavigate={handleNavigate} />;
        if (user?.role === 'owner') return <OwnerDashboard onNavigate={handleNavigate} />;
        if (user?.role === 'manager') return <ManagerDashboard onNavigate={handleNavigate} />;
        return <AdminDashboard onNavigate={handleNavigate} />;
      case 'players':
        return <PlayersPage onNavigate={handleNavigate} />;
      case 'teams':
        return <TeamsPage onNavigate={handleNavigate} />;
      case 'users':
        return <UsersPage onNavigate={handleNavigate} />;
      case 'auction':
        return <LiveAuctionPage onNavigate={handleNavigate} />;
      case 'live-auction':
        return <LiveAuctionPage onNavigate={handleNavigate} />;
      default:
        return <AdminDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {renderPage()}
    </div>
  );
}