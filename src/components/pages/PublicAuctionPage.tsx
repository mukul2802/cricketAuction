import React from 'react';
import { PublicAuctionDisplay } from '../PublicAuctionDisplay';

/**
 * Public Auction Page - No authentication required
 * This page provides a public view of the live auction that can be accessed by anyone
 * without requiring login credentials. It syncs with the same auction data as the
 * authenticated live auction page.
 */
export function PublicAuctionPage() {
  return (
    <div className="min-h-screen">
      <PublicAuctionDisplay />
    </div>
  );
}

export default PublicAuctionPage;