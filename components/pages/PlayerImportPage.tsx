import React, { useMemo, useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { PageType } from '../Router';
import { playerService } from '../../lib/firebaseServices';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';

interface PlayerImportPageProps {
  onNavigate: (page: PageType) => void;
}

export function PlayerImportPage({ onNavigate }: PlayerImportPageProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'preview' | 'imported'>('idle');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileName(file.name);
      setUploadStatus('uploading');

      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const parsed = parseCsv(text);
          const validated = validateRows(parsed);
          setRows(validated);
          setUploadStatus('preview');
        } catch (e: any) {
          setErrors([`Failed to read file: ${e?.message || e}`]);
          setUploadStatus('idle');
        }
      };
      reader.onerror = () => {
        setErrors([`Failed to read file`]);
        setUploadStatus('idle');
      };
      reader.readAsText(file);
    }
  };

  const counts = useMemo(() => {
    const valid = rows.filter(r => r.status === 'valid').length;
    const invalid = rows.filter(r => r.status !== 'valid').length;
    return { valid, invalid };
  }, [rows]);

  const handleImport = async () => {
    setErrors([]);
    setImporting(true);
    try {
      const validRows = rows.filter(r => r.status === 'valid');
      if (validRows.length === 0) {
        setErrors(['No valid rows to import']);
        return;
      }
      await playerService.bulkImportPlayers(validRows.map(toPlayerPayload));
      setUploadStatus('imported');
    } catch (e) {
      setErrors([`Import failed: ${e instanceof Error ? e.message : String(e)}`]);
    } finally {
      setImporting(false);
    }
  };

  function toPlayerPayload(row: any) {
    const payload = {
      name: String(row.name || '').trim(),
      role: String(row.skill || '').trim(),
      basePrice: Number(row.basePrice) || 2000000,
      status: 'active' as const,
      image: (row.imageUrl && String(row.imageUrl).trim()) || undefined,
      matches: toNumber(row.matches),
      runs: toNumber(row.runs),
      wickets: toNumber(row.wickets),
      battingAvg: toNumber(row.avg),
      economy: toNumber(row.economyRate),
      strikeRate: toNumber(row.strikeRate),
    } as Record<string, any>;
    return pruneUndefined(payload);
  }

  function toNumber(v: any) {
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : undefined;
  }

  function pruneUndefined<T extends Record<string, any>>(obj: T): T {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      if (v !== undefined) out[k] = v;
    }
    return out as T;
  }

  function parseCsv(text: string) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length === 0) return [];
    const header = lines[0].split(',').map(h => h.trim());
    const rows = lines.slice(1).map(line => {
      const cols = splitCsvLine(line);
      const obj: Record<string, string> = {};
      header.forEach((h, i) => { obj[h] = (cols[i] ?? '').trim(); });
      return obj;
    });
    return rows;
  }

  // Handles quoted CSV fields and commas inside quotes
  function splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { // escaped quote
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  function validateRows(rows: any[]) {
    const required = new Set([
      'Name','Skill','Batting Hand','Bowling Hand','Match','Run','Avg','Strike Rate','Overs','Wickets','Economy Rate','Base Price','Image URL'
    ]);
    // Normalize keys to canonical names used in UI/state
    return rows.map((r, index) => {
      const norm = {
        name: r['Name'] || r['name'] || '',
        skill: r['Skill'] || r['skill'] || '',
        battingHand: r['Batting Hand'] || r['battingHand'] || '',
        bowlingHand: r['Bowling Hand'] || r['bowlingHand'] || '',
        matches: r['Match'] ?? r['Matches'] ?? r['matches'] ?? '',
        runs: r['Run'] ?? r['Runs'] ?? r['runs'] ?? '',
        avg: r['Avg'] ?? r['Batting Avg'] ?? r['battingAvg'] ?? '',
        strikeRate: r['Strike Rate'] ?? r['strikeRate'] ?? '',
        overs: r['Overs'] ?? r['overs'] ?? '',
        wickets: r['Wickets'] ?? r['wickets'] ?? '',
        economyRate: r['Economy Rate'] ?? r['economyRate'] ?? '',
        basePrice: r['Base Price'] ?? r['basePrice'] ?? '',
        imageUrl: r['Image URL'] ?? r['imageUrl'] ?? ''
      } as any;

      const problems: string[] = [];
      if (!norm.name) problems.push('Missing Name');
      if (!norm.skill) problems.push('Missing Skill');
      if (norm.basePrice && isNaN(Number(norm.basePrice))) problems.push('Invalid Base Price');

      const status = problems.length ? 'error' : 'valid';
      return { ...norm, status, problems };
    });
  }

  return (
    <MainLayout currentPage="import" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Player Import</h1>
          <p className="text-muted-foreground">Upload player data from CSV or XLSX files</p>
        </div>

        {uploadStatus === 'idle' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Player Data
              </CardTitle>
              <CardDescription>
                Select a CSV or XLSX file containing player information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Choose a file to upload</h3>
                <p className="text-muted-foreground mb-4">
                  Support for CSV and XLSX files up to 10MB
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="max-w-xs mx-auto"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-primary" />
                      <div>
                        <h4 className="font-medium">Sample CSV Template</h4>
                        <p className="text-sm text-muted-foreground">
                          Download template with required columns
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full mt-3">
                      Download Template
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-dashed">
                  <CardContent className="pt-6">
                    <h4 className="font-medium mb-2">Required Columns</h4>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>• Name</div>
                      <div>• Skill (All Rounder, Batsman, etc.)</div>
                      <div>• Batting Hand (Left/Right)</div>
                      <div>• Bowling Hand (Left/Right)</div>
                      <div>• Match (Number of matches)</div>
                      <div>• Run (Total runs scored)</div>
                      <div>• Avg (Batting average)</div>
                      <div>• Strike Rate</div>
                      <div>• Overs (Overs bowled)</div>
                      <div>• Wickets (Total wickets)</div>
                      <div>• Economy Rate</div>
                      <div>• Base Price (defaults to 20L if empty)</div>
                      <div>• Image URL</div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadStatus === 'uploading' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <h3 className="text-lg font-medium">Processing {fileName}</h3>
                <p className="text-muted-foreground">
                  Validating data and checking for errors...
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {uploadStatus === 'preview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview Import Data
                </CardTitle>
                <CardDescription>
                  Review the data before importing. Fix any errors shown below.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {errors.length > 0 && (
                  <div className="mb-4 text-sm text-red-400">
                    {errors.map((e, i) => (
                      <div key={i}>{e}</div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="text-sm">
                      <span className="font-medium text-green-400">{counts.valid} valid</span>
                      <span className="text-muted-foreground mx-2">•</span>
                      <span className="font-medium text-red-400">{counts.invalid} error</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={(e) => {
                      e.preventDefault();
                      setUploadStatus('idle');
                    }}>
                      Cancel
                    </Button>
                    <Button onClick={(e) => {
                      e.preventDefault();
                      handleImport();
                    }} disabled={counts.valid === 0 || importing}>
                      {importing ? 'Importing...' : 'Import Valid Records'}
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Skill</TableHead>
                        <TableHead>Batting/Bowling</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Base Price</TableHead>
                        <TableHead>Image</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((player, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            {player.status === 'valid' ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Valid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Error
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{player.name}</TableCell>
                          <TableCell>{player.skill}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>Bat: {player.battingHand}</div>
                              <div>Bowl: {player.bowlingHand}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-xs space-y-1">
                              <div>Matches: {player.matches}</div>
                              <div>Runs: {player.runs}, Avg: {player.avg}</div>
                              <div>SR: {player.strikeRate}%</div>
                              {player.overs > 0 && <div>Overs: {player.overs}</div>}
                              {player.wickets > 0 && <div>Wickets: {player.wickets}</div>}
                              {player.economyRate > 0 && <div>Economy: {player.economyRate}</div>}
                            </div>
                          </TableCell>
                          <TableCell>
                            {player.basePrice ? (
                              `₹${(Number(player.basePrice) / 100000).toFixed(0)}L`
                            ) : (
                              <div>
                                <span className="text-red-400">Missing</span>
                                <div className="text-xs text-muted-foreground">(Will default to ₹20L)</div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {player.imageUrl ? (
                              <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                                ✓ Valid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20">
                                Missing
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {uploadStatus === 'imported' && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
                <h3 className="text-lg font-medium">Import Successful!</h3>
                <p className="text-muted-foreground">
                  {counts.valid} players have been successfully imported to the database.
                </p>
                <div className="flex gap-2 justify-center">
                  <Button onClick={(e) => {
                    e.preventDefault();
                    onNavigate('players');
                  }}>
                    View Players
                  </Button>
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    setUploadStatus('idle');
                  }}>
                    Import More
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}