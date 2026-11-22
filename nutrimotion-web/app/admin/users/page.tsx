'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useAppSelector } from '@/store';
import { getAllMenuItemsForUser } from '@/lib/permissions/menu-config';
import { UserRole } from '@/types/auth';
import axios from 'axios';

interface UserDoc {
  _id: string;
  name: string;
  email: string;
  roles: UserRole[];
  createdAt: string;
}

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: UserRole.CLIENT, label: 'Client' },
  { value: UserRole.DRIVER, label: 'Driver' },
  { value: UserRole.ADMINISTRATOR, label: 'Admin' },
];

function errorText(error: unknown, fallback: string): string {
  return axios.isAxiosError(error) && error.response?.data?.error
    ? String(error.response.data.error)
    : fallback;
}

export default function AdminUsersPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [users, setUsers] = useState<UserDoc[]>([]);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserDoc | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<UserRole[]>([]);
  const [saving, setSaving] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRoles, setInviteRoles] = useState<UserRole[]>([UserRole.CLIENT]);
  const [inviting, setInviting] = useState(false);
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const auth = useAppSelector((state) => state.auth);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get<UserDoc[]>('/api/admin/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setFeedback({ ok: false, text: 'Could not load users.' });
    }
  };

  const handleUpdateRoles = async () => {
    if (!selectedUser) return;
    setSaving(true);
    setFeedback(null);
    try {
      await axios.put(`/api/admin/users/${selectedUser._id}/roles`, {
        roles: selectedRoles,
      });
      setRoleDialogOpen(false);
      setSelectedUser(null);
      setSelectedRoles([]);
      fetchUsers();
    } catch (error) {
      setFeedback({ ok: false, text: errorText(error, 'Could not update roles.') });
    } finally {
      setSaving(false);
    }
  };

  const toggleInviteRole = (role: UserRole) => {
    setInviteRoles((prev) => {
      if (prev.includes(role)) {
        const next = prev.filter((r) => r !== role);
        return next.length === 0 ? prev : next;
      }
      return [...prev, role];
    });
  };

  const handleInvite = async () => {
    setInviting(true);
    setFeedback(null);
    try {
      const res = await axios.post<{
        email: string;
        emailSent?: boolean;
        warning?: string;
      }>('/api/admin/users/invite', {
        email: inviteEmail.trim(),
        name: inviteName.trim() || undefined,
        roles: inviteRoles,
      });
      setInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      setInviteRoles([UserRole.CLIENT]);
      setFeedback({
        ok: true,
        text:
          res.data.warning ||
          (res.data.emailSent === false
            ? `Account created for ${res.data.email}, but the invite email could not be sent.`
            : `Invite sent to ${res.data.email}. They’ll get an email to set their password.`),
      });
      fetchUsers();
    } catch (error) {
      setFeedback({ ok: false, text: errorText(error, 'Could not invite that user.') });
    } finally {
      setInviting(false);
    }
  };

  const menuItems = getAllMenuItemsForUser(auth.permissions);

  return (
    <>
      <AppBar onMenuClick={() => setSidebarOpen(true)} />
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} menuItems={menuItems} />

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <PeopleIcon fontSize="large" color="primary" />
            <Typography variant="h4">User Management</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<PersonAddIcon />}
            onClick={() => {
              setFeedback(null);
              setInviteOpen(true);
            }}
          >
            Invite user
          </Button>
        </Box>

        {feedback && (
          <Alert severity={feedback.ok ? 'success' : 'error'} sx={{ mb: 2 }} onClose={() => setFeedback(null)}>
            {feedback.text}
          </Alert>
        )}

        <Card>
          <CardContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Roles</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                          No users found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user._id}>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {user.roles.map((role) => (
                              <Chip key={role} label={role} size="small" />
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          {user.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            startIcon={<EditIcon />}
                            onClick={() => {
                              setSelectedUser(user);
                              setSelectedRoles(user.roles);
                              setRoleDialogOpen(true);
                            }}
                          >
                            Edit Roles
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Container>

      <Dialog open={inviteOpen} onClose={() => !inviting && setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invite user by email</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, mt: 1 }}>
            We’ll create their account and Auth0 will email them a link to set a password.
          </Typography>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            autoFocus
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Name (optional)"
            value={inviteName}
            onChange={(e) => setInviteName(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            Roles
          </Typography>
          <FormGroup row>
            {ROLE_OPTIONS.map(({ value, label }) => (
              <FormControlLabel
                key={value}
                control={
                  <Checkbox
                    checked={inviteRoles.includes(value)}
                    onChange={() => toggleInviteRole(value)}
                  />
                }
                label={label}
              />
            ))}
          </FormGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteOpen(false)} disabled={inviting}>
            Cancel
          </Button>
          <Button
            onClick={handleInvite}
            variant="contained"
            disabled={inviting || !inviteEmail.trim() || inviteRoles.length === 0}
          >
            {inviting ? 'Sending…' : 'Send invite'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={roleDialogOpen} onClose={() => setRoleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User Roles</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              User: {selectedUser?.name} ({selectedUser?.email})
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Roles</InputLabel>
              <Select
                multiple
                value={selectedRoles}
                onChange={(e) => setSelectedRoles(e.target.value as UserRole[])}
                label="Roles"
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {Object.values(UserRole).map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateRoles} variant="contained" disabled={saving || selectedRoles.length === 0}>
            {saving ? 'Updating…' : 'Update Roles'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
