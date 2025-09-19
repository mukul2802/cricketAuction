import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface PlayerFormProps {
  formData: {
    name: string;
    role: string;
    basePrice: string;
    imageUrl: string;
    team?: string;
    soldPrice?: string;
    status?: string;
    matches?: string;
    runs?: string;
    wickets?: string;
    average?: string;
    strikeRate?: string;
    economyRate?: string;
    overs?: string;
    battingHand?: string;
    bowlingHand?: string;
  };
  setFormData: (data: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  isEditing?: boolean;
  showStats?: boolean;
  showTeamFields?: boolean;
  teams?: Array<{id: string; name: string}>;
}

export function PlayerForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  showStats = false,
  showTeamFields = false,
  teams = []
}: PlayerFormProps) {
  // Validation logic
  const isBasePriceValid = formData.basePrice && !isNaN(Number(formData.basePrice)) && Number(formData.basePrice) >= 2000000;
  const isSoldPriceValid = formData.status !== 'sold' || (formData.soldPrice && !isNaN(Number(formData.soldPrice)) && Number(formData.soldPrice) >= 2000000);
  const isTeamValid = formData.status !== 'sold' || (formData.team && formData.team !== 'none' && formData.team !== '');
  const isFormValid = isBasePriceValid && isSoldPriceValid && isTeamValid;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Player Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            placeholder="Enter player name"
          />
        </div>
        <div>
          <Label htmlFor="role">Role</Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Batsman">Batsman</SelectItem>
              <SelectItem value="Bowler">Bowler</SelectItem>
              <SelectItem value="Wicket-Keeper">Wicket-Keeper</SelectItem>
              <SelectItem value="All-Rounder">All-Rounder</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="basePrice">Base Price (₹) - Min: 20 Lakhs</Label>
          <Input
            id="basePrice"
            type="text"
            value={formData.basePrice}
            onChange={(e) => setFormData({...formData, basePrice: e.target.value})}
            placeholder="2000000 (20 Lakhs)"
            className={!isBasePriceValid && formData.basePrice ? 'border-red-500' : ''}
          />
          {!isBasePriceValid && formData.basePrice && (
            <p className="text-sm text-red-500 mt-1">Base price must be a valid number and at least 20 Lakhs (2000000)</p>
          )}
        </div>
        <div>
          <Label htmlFor="imageUrl">Image URL</Label>
          <Input
            id="imageUrl"
            value={formData.imageUrl}
            onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
            placeholder="https://..."
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="battingHand">Batting Hand</Label>
          <Select value={formData.battingHand || ''} onValueChange={(value) => setFormData({...formData, battingHand: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select batting hand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Right">Right</SelectItem>
              <SelectItem value="Left">Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="bowlingHand">Bowling Hand</Label>
          <Select value={formData.bowlingHand || ''} onValueChange={(value) => setFormData({...formData, bowlingHand: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select bowling hand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Right">Right</SelectItem>
              <SelectItem value="Left">Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {showTeamFields && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="team">Team {formData.status === 'sold' && <span className="text-red-500">*</span>}</Label>
            <Select value={formData.team || 'none'} onValueChange={(value) => setFormData({...formData, team: value === 'none' ? '' : value})}>
              <SelectTrigger className={!isTeamValid ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select team" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Team</SelectItem>
                {teams.map((team) => (
                  <SelectItem key={team.id} value={team.name}>
                    {team.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isTeamValid && (
              <p className="text-sm text-red-500 mt-1">Team is required when status is 'sold'</p>
            )}
          </div>
          <div>
            <Label htmlFor="soldPrice">Sold Price (₹) - Min: 20 Lakhs {formData.status === 'sold' && <span className="text-red-500">*</span>}</Label>
            <Input
              id="soldPrice"
              type="text"
              value={formData.soldPrice || ''}
              onChange={(e) => setFormData({...formData, soldPrice: e.target.value})}
              placeholder="2000000 (20 Lakhs)"
              className={!isSoldPriceValid ? 'border-red-500' : ''}
            />
            {!isSoldPriceValid && (
              <p className="text-sm text-red-500 mt-1">
                {formData.status === 'sold' ? 'Sold price is required and must be at least 20 Lakhs (2000000)' : ''}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status || ''} onValueChange={(value) => setFormData({...formData, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="sold">Sold</SelectItem>
                <SelectItem value="unsold">Unsold</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {showStats && (
        <>
          <div className="border-t pt-4">
            <h3 className="font-medium mb-3">Player Statistics</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="matches">Matches</Label>
                <Input
                  id="matches"
                  type="number"
                  value={formData.matches || ''}
                  onChange={(e) => setFormData({...formData, matches: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="runs">Runs</Label>
                <Input
                  id="runs"
                  type="number"
                  value={formData.runs || ''}
                  onChange={(e) => setFormData({...formData, runs: e.target.value})}
                  placeholder="0"
                />
              </div>
              <div>
                <Label htmlFor="wickets">Wickets</Label>
                <Input
                  id="wickets"
                  type="number"
                  value={formData.wickets || ''}
                  onChange={(e) => setFormData({...formData, wickets: e.target.value})}
                  placeholder="0"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="average">Batting Average</Label>
                <Input
                  id="average"
                  type="number"
                  step="0.01"
                  value={formData.average || ''}
                  onChange={(e) => setFormData({...formData, average: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="strikeRate">Strike Rate</Label>
                <Input
                  id="strikeRate"
                  type="number"
                  step="0.01"
                  value={formData.strikeRate || ''}
                  onChange={(e) => setFormData({...formData, strikeRate: e.target.value})}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="economyRate">Economy Rate</Label>
                <Input
                  id="economyRate"
                  type="number"
                  step="0.01"
                  value={formData.economyRate || ''}
                  onChange={(e) => setFormData({...formData, economyRate: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-4">
              <div>
                <Label htmlFor="overs">Overs Bowled</Label>
                <Input
                  id="overs"
                  type="number"
                  step="0.1"
                  value={formData.overs || ''}
                  onChange={(e) => setFormData({...formData, overs: e.target.value})}
                  placeholder="0.0"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit} disabled={!isFormValid}>
          {isEditing ? 'Update Player' : 'Add Player'}
        </Button>
      </div>
    </div>
  );
}