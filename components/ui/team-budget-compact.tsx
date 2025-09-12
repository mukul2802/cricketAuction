import React from 'react';
import { Card, CardContent } from './card';

interface TeamBudgetCompactProps {
  teams: Array<{
    id: string;
    name: string;
    remainingBudget: number;
  }>;
}

export function TeamBudgetCompact({ teams }: TeamBudgetCompactProps) {
  const getTeamInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 3);
  };

  return (
    <div className="space-y-1">
      {teams.slice(0, 6).map((team) => (
        <Card key={team.id} className="bg-background/80 backdrop-blur-sm border border-border/20">
          <CardContent className="p-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-primary">
                  {getTeamInitials(team.name)}
                </span>
              </div>
              <div className="text-xs font-bold text-primary">
                ₹{(team.remainingBudget / 10000000).toFixed(1)}Cr
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}