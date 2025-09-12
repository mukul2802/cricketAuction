import React, { useEffect, useState } from 'react';
import { MainLayout } from '../layout/MainLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { PageType } from '../Router';
import { useAuth } from '../../contexts/AuthContext';
import { userService, authService, User as AppUser } from '../../lib/firebaseServices';
import { toast } from 'sonner';
import {
  Shield,
  Users,
  Trophy,
  Plus,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';

interface UsersPageProps {
  onNavigate: (page: PageType) => void;
}

export function UsersPage({ onNavigate }: UsersPageProps) {
  const { teams, user } = useAuth();
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    password: ''
  });
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  // Set up real-time listener for users
  useEffect(() => {
    const unsubscribe = authService.subscribeToUsers((usersData: AppUser[]) => {
      setUsers(usersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const list = await userService.getAllUsers();
      setUsers(list);
    } catch (e) {
      // ignore list error
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    (async () => {
      try {
        setErrorMsg('');
        if (!newUser.name || !newUser.email || !newUser.role) return;
        
        await authService.createUser(newUser.email, newUser.password, {
          name: newUser.name,
          role: newUser.role as any,
        } as any);
        
        toast.success('User added successfully');
        
        setShowAddUser(false);
        setNewUser({ name: '', email: '', role: '', password: '' });
        await loadUsers();
      } catch (e: any) {
        if (e?.code === 'auth/email-already-in-use') {
          setErrorMsg('Email already in use. Enter a new password to update this user.');
        } else {
          setErrorMsg('Failed to add user');
        }
      }
    })();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'owner': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'manager': return 'bg-green-500/10 text-green-400 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return Shield;
      case 'owner': return Trophy;
      case 'manager': return Users;
      default: return Users;
    }
  };

  return (
    <MainLayout currentPage="users" onNavigate={onNavigate}>
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Users Management</h1>
            <p className="text-muted-foreground">Manage system users and their roles</p>
          </div>
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New User</DialogTitle>
                <DialogDescription>
                  Create a new user account. Note: Owners cannot be managers or admins, and admins cannot be players.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {errorMsg && (
                  <div className="text-sm text-red-400">{errorMsg}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    placeholder="Enter full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="Enter email address"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Initial Password (set by admin)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Enter a secure password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="owner">Team Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={(e) => {
                    e.preventDefault();
                    setShowAddUser(false);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddUser();
                    }}
                    disabled={!newUser.name || !newUser.email || !newUser.role || newUser.password.length < 6}
                  >
                    Add User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Users</CardTitle>
            <CardDescription>
              Manage user accounts and roles. Note: Team owners cannot have manager or admin roles, and admins cannot be players.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading users...</div>
            ) : users.length === 0 ? (
              <div className="text-sm text-muted-foreground">No users found. Add a user to get started.</div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const RoleIcon = getRoleIcon(user.role);
                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                            <RoleIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.teamId ? (
                          teams.find(t => t.id === user.teamId)?.name || 'Unknown Team'
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
                          Active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={false}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>Coming soon.</DialogDescription>
            </DialogHeader>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}