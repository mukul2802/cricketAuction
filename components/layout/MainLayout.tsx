// React hooks for component state and performance optimization
import React, { useMemo, useCallback } from 'react';
import { useState } from 'react';

// Authentication context and UI components
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageType } from '@/components/Router';

// Icons for navigation and UI elements
import {
  Trophy,
  Users,
  UserCheck,
  Upload,
  Gavel,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  Star,
  Menu,
  X
} from 'lucide-react';

// Props interface for the MainLayout component
interface MainLayoutProps {
  children: React.ReactNode; // Page content to be rendered inside the layout
  currentPage: PageType; // Currently active page for navigation highlighting
  onNavigate: (page: PageType) => void; // Function to handle navigation between pages
}

/**
 * MainLayout Component
 * 
 * This is the primary layout wrapper for the entire application that provides:
 * - Responsive sidebar navigation with role-based menu items
 * - User authentication status and profile display
 * - Mobile-friendly hamburger menu for smaller screens
 * - Consistent header and navigation across all pages
 * - Role-based access control for different user types
 * 
 * The layout adapts based on user roles (admin, owner, manager) to show
 * appropriate navigation options and features.
 */
export function MainLayout({ children, currentPage, onNavigate }: MainLayoutProps) {
  // Authentication state and user information
  const { user, logout } = useAuth(); // Get current user and logout function
  
  // Mobile sidebar state for responsive design
  const [sidebarOpen, setSidebarOpen] = useState(false); // Controls mobile sidebar visibility

  /**
   * Memoized navigation items based on user role
   * 
   * This function dynamically generates navigation menu items based on the user's role:
   * - Admin: Full access to all features (teams, users, import, etc.)
   * - Owner: Team-focused features (dashboard, players, auction, other teams)
   * - Default: Basic features (dashboard, players, auction)
   * 
   * Uses useMemo for performance optimization to prevent recalculation on every render.
   */
  const navigationItems = useMemo(() => {
    // Base navigation items available to all users
    const baseItems = [
      { id: 'dashboard' as PageType, label: 'Dashboard', icon: BarChart3 },
      { id: 'players' as PageType, label: 'Players', icon: Users },
      { id: 'auction' as PageType, label: 'Live Auction', icon: Gavel },
    ];

    // Admin users get full access to management features
    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { id: 'teams' as PageType, label: 'Teams', icon: Trophy },
        { id: 'users' as PageType, label: 'Users', icon: UserCheck },
        { id: 'import' as PageType, label: 'Import Players', icon: Upload },
      ];
    }

    // Team owners get personalized dashboard and team-focused features
    if (user?.role === 'owner') {
      return [
        { id: 'dashboard' as PageType, label: 'My Dashboard', icon: Star },
        { id: 'players' as PageType, label: 'All Players', icon: Users },
        { id: 'auction' as PageType, label: 'Live Auction', icon: Gavel },
        { id: 'teams' as PageType, label: 'Other Teams', icon: Trophy },
      ];
    }

    // Default navigation for other user types
    return baseItems;
  }, [user?.role]); // Recalculate when user role changes

  /**
   * Memoized function to get role-specific color classes
   * 
   * Returns appropriate Tailwind CSS classes for styling user role badges:
   * - Admin: Red color scheme (highest authority)
   * - Owner: Blue color scheme (team ownership)
   * - Manager: Green color scheme (team management)
   * - Default: Gray color scheme (fallback for other roles)
   * 
   * Uses useCallback to prevent function recreation on every render.
   */
  const getRoleColor = useCallback((role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20'; // Red for admin authority
      case 'owner': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'; // Blue for team ownership
      case 'manager': return 'bg-green-500/10 text-green-400 border-green-500/20'; // Green for management
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20'; // Gray for unknown roles
    }
  }, []); // No dependencies - function logic is static

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden bg-background/80 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Logo and close button */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-semibold text-foreground">Cricket Auction</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                {user?.role === 'admin' && <Shield className="w-5 h-5 text-primary" />}
                {user?.role === 'owner' && <Trophy className="w-5 h-5 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{user?.name}</p>
                <Badge variant="outline" className={`text-xs capitalize ${getRoleColor(user?.role || '')}`}>
                  {user?.role}
                </Badge>
              </div>
            </div>
            {user?.teamId && (
              <div className="mt-2 text-sm text-muted-foreground">
                Team ID: {user.teamId}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navigationItems.map((item) => (
              <Button
                key={item.id}
                variant={currentPage === item.id ? "secondary" : "ghost"}
                className={`w-full justify-start gap-3 ${
                  currentPage === item.id 
                    ? "bg-secondary text-secondary-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
                onClick={() => {
                  onNavigate(item.id);
                  setSidebarOpen(false);
                }}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={logout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-card border-b border-border p-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground capitalize">
              {currentPage.replace('-', ' ')}
            </h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}