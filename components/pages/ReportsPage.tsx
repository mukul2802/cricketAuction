import React, { useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageType } from '@/components/Router';
import {
  BarChart3,
  Download,
  IndianRupee,
  TrendingUp,
  Users,
  Trophy,
  Calendar,
  FileText
} from 'lucide-react';

interface ReportsPageProps {
  onNavigate: (page: PageType) => void;
}

export function ReportsPage({ onNavigate }: ReportsPageProps) {
  const [reportType, setReportType] = useState('transactions');

  const transactionData = [
    {
      id: '1',
      player: 'Virat Kohli',
      team: 'Royal Challengers Bangalore',
      amount: 15000000,
      date: '2024-01-15',
      type: 'Purchase'
    },
    {
      id: '2',
      player: 'MS Dhoni',
      team: 'Chennai Super Kings',
      amount: 12000000,
      date: '2024-01-15',
      type: 'Purchase'
    },
    {
      id: '3',
      player: 'Jasprit Bumrah',
      team: 'Mumbai Indians',
      amount: 12000000,
      date: '2024-01-14',
      type: 'Purchase'
    }
  ];

  const reportOptions = [
    { value: 'transactions', label: 'Transaction History' },
    { value: 'team-spending', label: 'Team Spending Analysis' },
    { value: 'player-values', label: 'Player Valuation Report' },
    { value: 'auction-summary', label: 'Auction Summary' }
  ];

  const summaryStats = {
    totalTransactions: 156,
    totalValue: 458000000,
    averagePrice: 2935897,
    highestBid: 15000000
  };

  return (
    <MainLayout currentPage="reports" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reports & Analytics</h1>
            <p className="text-muted-foreground">Comprehensive auction insights and data analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={reportType} onValueChange={setReportType}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summaryStats.totalTransactions}</div>
              <p className="text-xs text-muted-foreground">This auction</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(summaryStats.totalValue / 10000000).toFixed(0)}Cr
              </div>
              <p className="text-xs text-muted-foreground">Money spent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(summaryStats.averagePrice / 100000).toFixed(1)}L
              </div>
              <p className="text-xs text-muted-foreground">Per player</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Highest Bid</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{(summaryStats.highestBid / 10000000).toFixed(1)}Cr
              </div>
              <p className="text-xs text-muted-foreground">Single purchase</p>
            </CardContent>
          </Card>
        </div>

        {/* Report Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              {reportOptions.find(opt => opt.value === reportType)?.label}
            </CardTitle>
            <CardDescription>
              Detailed breakdown of auction transactions and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reportType === 'transactions' && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Player</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactionData.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-medium">{transaction.player}</TableCell>
                      <TableCell>{transaction.team}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-primary">
                          <IndianRupee className="w-3 h-3" />
                          {(transaction.amount / 10000000).toFixed(1)}Cr
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                          {transaction.type}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {reportType !== 'transactions' && (
              <div className="text-center py-12">
                <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Report Coming Soon</h3>
                <p className="text-muted-foreground">
                  This report type is being prepared. Please check back later.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Export Options */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
            <CardDescription>Download reports in various formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">CSV Export</div>
                  <div className="text-sm text-muted-foreground">Raw data format</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">Excel Export</div>
                  <div className="text-sm text-muted-foreground">Formatted spreadsheet</div>
                </div>
              </Button>
              <Button variant="outline" className="h-auto p-4">
                <div className="text-center">
                  <FileText className="w-6 h-6 mx-auto mb-2" />
                  <div className="font-medium">PDF Report</div>
                  <div className="text-sm text-muted-foreground">Presentation ready</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}