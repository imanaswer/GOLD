import React, { useState, useEffect } from 'react';
import { API, useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { Settings as SettingsIcon, UserPlus, Edit, Trash2, Key, Wrench, Plus, Database, Download, Upload, RefreshCw, CheckCircle, Clock } from 'lucide-react';
import { Textarea } from '../components/ui/textarea';

export default function SettingsPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showDialog, setShowDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'staff'
  });
  const [passwordData, setPasswordData] = useState({ new_password: '' });

  // Work Types Management State
  const [workTypes, setWorkTypes] = useState([]);
  const [showWorkTypeDialog, setShowWorkTypeDialog] = useState(false);
  const [showWorkTypeDeleteDialog, setShowWorkTypeDeleteDialog] = useState(false);
  const [editingWorkType, setEditingWorkType] = useState(null);
  const [deletingWorkType, setDeletingWorkType] = useState(null);
  const [workTypeLoading, setWorkTypeLoading] = useState(false);
  const [workTypeFormData, setWorkTypeFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  // Shop Settings State
  const [shopSettings, setShopSettings] = useState(null);
  const [shopSettingsLoading, setShopSettingsLoading] = useState(false);
  const [shopSettingsData, setShopSettingsData] = useState({
    purchase_conversion_factor: 0.920
  });

  // Backup Management State
  const [backups, setBackups] = useState([]);
  const [backupsLoading, setBackupsLoading] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);
  const [restoreInProgress, setRestoreInProgress] = useState(false);

  useEffect(() => {
    loadUsers();
    loadWorkTypes();
    loadShopSettings();
    loadBackups();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await API.get(`/api/users`);
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username || !formData.email || !formData.full_name) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      if (editingUser) {
        const { password, ...updateData } = formData;
        await API.patch(`/api/users/${editingUser.id}`, updateData);
        toast.success('User updated successfully');
      } else {
        await API.post(`/api/auth/register`, formData);
        toast.success('User created successfully');
      }
      
      setShowDialog(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'staff'
      });
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/api/users/${deletingUser.id}`);
      toast.success('User deleted successfully');
      setShowDeleteDialog(false);
      setDeletingUser(null);
      loadUsers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete user');
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.new_password || passwordData.new_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      await API.post(`/api/users/${passwordUser.id}/change-password`, passwordData);
      toast.success('Password changed successfully');
      setShowPasswordDialog(false);
      setPasswordUser(null);
      setPasswordData({ new_password: '' });
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to change password');
    }
  };

  // Work Types Management Functions
  const loadWorkTypes = async () => {
    try {
      setWorkTypeLoading(true);
      const response = await API.get(`/api/work-types`);
      setWorkTypes(response.data.items || []);
    } catch (error) {
      toast.error('Failed to load work types');
    } finally {
      setWorkTypeLoading(false);
    }
  };

  const handleWorkTypeSave = async () => {
    if (!workTypeFormData.name.trim()) {
      toast.error('Work type name is required');
      return;
    }

    try {
      if (editingWorkType) {
        await API.patch(`/api/work-types/${editingWorkType.id}`, workTypeFormData);
        toast.success('Work type updated successfully');
      } else {
        await API.post(`/api/work-types`, workTypeFormData);
        toast.success('Work type created successfully');
      }
      
      setShowWorkTypeDialog(false);
      setEditingWorkType(null);
      setWorkTypeFormData({
        name: '',
        description: '',
        is_active: true
      });
      loadWorkTypes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Operation failed');
    }
  };

  const handleWorkTypeEdit = (workType) => {
    setEditingWorkType(workType);
    setWorkTypeFormData({
      name: workType.name,
      description: workType.description || '',
      is_active: workType.is_active
    });
    setShowWorkTypeDialog(true);
  };

  const handleWorkTypeDelete = async () => {
    try {
      await API.delete(`/api/work-types/${deletingWorkType.id}`);
      toast.success('Work type deleted successfully');
      setShowWorkTypeDeleteDialog(false);
      setDeletingWorkType(null);
      loadWorkTypes();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to delete work type');
    }
  };

  // Shop Settings Functions
  const loadShopSettings = async () => {
    try {
      setShopSettingsLoading(true);
      const response = await API.get('/api/settings/shop');
      if (response.data) {
        setShopSettings(response.data);
        setShopSettingsData({
          purchase_conversion_factor: response.data.purchase_conversion_factor || 0.920
        });
      }
    } catch (error) {
      console.error('Failed to load shop settings:', error);
      toast.error('Failed to load shop settings');
    } finally {
      setShopSettingsLoading(false);
    }
  };

  const handleShopSettingsSave = async () => {
    const factor = parseFloat(shopSettingsData.purchase_conversion_factor);
    
    if (!factor || factor <= 0) {
      toast.error('Conversion factor must be a positive number');
      return;
    }
    
    if (factor < 0.900 || factor > 0.930) {
      toast.error('Conversion factor should typically be between 0.900 and 0.930');
      return;
    }

    try {
      await API.put('/api/settings/shop', shopSettingsData);
      toast.success('Shop settings updated successfully');
      loadShopSettings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to update shop settings');
    }
  };

  // ============================================================================
  // BACKUP MANAGEMENT FUNCTIONS
  // ============================================================================

  const loadBackups = async () => {
    try {
      setBackupsLoading(true);
      const response = await API.get('/api/backups/list');
      setBackups(response.data.backups || []);
    } catch (error) {
      console.error('Failed to load backups:', error);
      // Don't show error toast if user doesn't have permission
      if (error.response?.status !== 403) {
        toast.error('Failed to load backups');
      }
    } finally {
      setBackupsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setCreatingBackup(true);
      toast.info('Creating backup... This may take a few moments.');
      const response = await API.post('/api/backups/create');
      
      if (response.data.success) {
        toast.success(`Backup created successfully: ${response.data.backup_name} (${response.data.size_mb} MB)`);
        loadBackups(); // Reload backup list
      } else {
        toast.error(response.data.error || 'Failed to create backup');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async () => {
    if (!restoringBackup) return;

    try {
      setRestoreInProgress(true);
      toast.info('Restoring backup... This will take a few moments. Please do not refresh the page.');
      
      const response = await API.post('/api/backups/restore', null, {
        params: {
          backup_filename: restoringBackup.filename,
          drop_existing: true  // Drop existing collections for clean restore
        }
      });
      
      if (response.data.success) {
        toast.success('Database restored successfully! Please refresh the page.');
        setShowRestoreDialog(false);
        setRestoringBackup(null);
      } else {
        toast.error(response.data.error || 'Failed to restore backup');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to restore backup');
    } finally {
      setRestoreInProgress(false);
    }
  };

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const canManageUsers = user?.role === 'admin' || user?.role === 'manager';
  const isAdmin = user?.role === 'admin';

  return (
    <div data-testid="settings-page">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-serif font-semibold text-gray-900 mb-2">Settings</h1>
          <p className="text-muted-foreground">System configuration and user management</p>
        </div>
        {canManageUsers && (
          <Button onClick={() => {
            setEditingUser(null);
            setFormData({
              username: '',
              email: '',
              password: '',
              full_name: '',
              role: 'staff'
            });
            setShowDialog(true);
          }}>
            <UserPlus className="w-4 h-4 mr-2" /> Add User
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-serif flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            User Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Username</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Full Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Role</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Status</th>
                    {canManageUsers && (
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((usr) => (
                    <tr key={usr.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium font-mono">{usr.username}</td>
                      <td className="px-4 py-3">{usr.full_name}</td>
                      <td className="px-4 py-3 text-sm">{usr.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                          usr.role === 'admin' ? 'bg-red-100 text-red-800' : 
                          usr.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          usr.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {usr.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {canManageUsers && (
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPasswordUser(usr);
                                setShowPasswordDialog(true);
                              }}
                              title="Change Password"
                            >
                              <Key className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(usr)}
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {user?.role === 'admin' && usr.id !== user.id && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setDeletingUser(usr);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-destructive hover:text-destructive"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shop Settings Card */}
      {user?.role === 'admin' && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Shop Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {shopSettingsLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold text-blue-900">
                        Purchase Conversion Factor
                      </Label>
                      <p className="text-sm text-blue-700 mt-1 mb-3">
                        Used in 22K gold valuation formula: Amount = (Weight × Rate) ÷ Conversion Factor
                      </p>
                      <div className="flex items-center gap-4">
                        <Input
                          type="number"
                          step="0.001"
                          min="0.900"
                          max="0.930"
                          value={shopSettingsData.purchase_conversion_factor}
                          onChange={(e) => setShopSettingsData({
                            ...shopSettingsData,
                            purchase_conversion_factor: e.target.value
                          })}
                          className="max-w-xs font-mono text-lg"
                          placeholder="0.920"
                        />
                        <Button onClick={handleShopSettingsSave}>
                          Save Settings
                        </Button>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Common values: <strong>0.920</strong> (standard) or <strong>0.917</strong> (alternate)
                      </p>
                    </div>
                    
                    <div className="p-3 bg-amber-50 border border-amber-300 rounded">
                      <p className="text-sm text-amber-900">
                        <strong>⚠️ Important:</strong> Changes to this factor will affect all future purchase valuations. 
                        Existing purchases retain their original conversion factor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Backup Management Card - Admin Only */}
      {isAdmin && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-serif flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Backup & Restore
              </CardTitle>
              <Button
                onClick={handleCreateBackup}
                disabled={creatingBackup}
                size="sm"
                className="flex items-center gap-2"
              >
                {creatingBackup ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Create Backup Now
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Info Banner */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
              <div className="flex items-start gap-3">
                <Database className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Automated Backup Protection</h4>
                  <p className="text-sm text-blue-800">
                    • <strong>Daily backups</strong> run automatically at 12:00 PM GMT<br />
                    • <strong>Retention:</strong> Last 7 days of backups are kept<br />
                    • <strong>Location:</strong> Stored locally on server<br />
                    • Use "Create Backup Now" button for immediate backups
                  </p>
                </div>
              </div>
            </div>

            {/* Backups List */}
            {backupsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                Loading backups...
              </div>
            ) : backups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Database className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-medium mb-1">No backups available</p>
                <p className="text-sm">Create your first backup to protect your data</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Backup File</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Created</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Age</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Size</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((backup) => (
                      <tr key={backup.filename} className="border-t hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-sm">{backup.filename}</td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            {formatDate(backup.timestamp)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            backup.age_days === 0 ? 'bg-green-100 text-green-800' :
                            backup.age_days < 3 ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {backup.age_days === 0 ? 'Today' : `${backup.age_days}d ago`}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-sm">
                          {formatBytes(backup.size_bytes)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setRestoringBackup(backup);
                                setShowRestoreDialog(true);
                              }}
                              title="Restore this backup"
                              className="flex items-center gap-1"
                            >
                              <Upload className="w-4 h-4" />
                              Restore
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Warning Banner */}
            <div className="mt-4 p-3 bg-amber-50 border border-amber-300 rounded">
              <p className="text-sm text-amber-900">
                <strong>⚠️ Important:</strong> Restoring a backup will replace all current data with the backup data. 
                This action cannot be undone. Always create a fresh backup before restoring.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Work Types Management Card */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-serif flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              Work Types Management
            </CardTitle>
            <Button
              onClick={() => {
                setEditingWorkType(null);
                setWorkTypeFormData({ name: '', description: '', is_active: true });
                setShowWorkTypeDialog(true);
              }}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Work Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {workTypeLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : workTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No work types found. Add your first work type to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Description</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Status</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workTypes.map((wt) => (
                    <tr key={wt.id} className="border-t hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{wt.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{wt.description || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          wt.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {wt.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleWorkTypeEdit(wt)}
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setDeletingWorkType(wt);
                              setShowWorkTypeDeleteDialog(true);
                            }}
                            className="text-destructive hover:text-destructive"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Username *</Label>
              <Input
                value={formData.username}
                onChange={(e) => setFormData({...formData, username: e.target.value})}
                disabled={!!editingUser}
              />
            </div>
            <div>
              <Label>Full Name *</Label>
              <Input
                value={formData.full_name}
                onChange={(e) => setFormData({...formData, full_name: e.target.value})}
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            {!editingUser && (
              <div>
                <Label>Password *</Label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Min 6 characters"
                />
              </div>
            )}
            <div>
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({...formData, role: val})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  {user?.role === 'admin' && <SelectItem value="admin">Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSave} className="w-full">
              {editingUser ? 'Update User' : 'Create User'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password - {passwordUser?.username}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>New Password *</Label>
              <Input
                type="password"
                value={passwordData.new_password}
                onChange={(e) => setPasswordData({new_password: e.target.value})}
                placeholder="Min 6 characters"
              />
            </div>
            <Button onClick={handlePasswordChange} className="w-full">
              Change Password
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deletingUser?.username}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Work Type Dialog */}
      <Dialog open={showWorkTypeDialog} onOpenChange={setShowWorkTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingWorkType ? 'Edit Work Type' : 'Add New Work Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={workTypeFormData.name}
                onChange={(e) => setWorkTypeFormData({...workTypeFormData, name: e.target.value})}
                placeholder="e.g., Polish, Resize, Repair"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={workTypeFormData.description}
                onChange={(e) => setWorkTypeFormData({...workTypeFormData, description: e.target.value})}
                placeholder="Optional description"
                rows={3}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={workTypeFormData.is_active}
                onChange={(e) => setWorkTypeFormData({...workTypeFormData, is_active: e.target.checked})}
                className="w-4 h-4"
              />
              <Label htmlFor="is_active" className="cursor-pointer">Active</Label>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setShowWorkTypeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleWorkTypeSave}>
              {editingWorkType ? 'Update' : 'Create'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Type Delete Dialog */}
      <AlertDialog open={showWorkTypeDeleteDialog} onOpenChange={setShowWorkTypeDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the work type <strong>{deletingWorkType?.name}</strong>. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleWorkTypeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Backup Restore Confirmation Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <Database className="w-5 h-5" />
              Restore Database Backup?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to restore the database from:
              </p>
              <div className="p-3 bg-muted rounded font-mono text-sm">
                <strong>File:</strong> {restoringBackup?.filename}<br />
                <strong>Created:</strong> {restoringBackup && formatDate(restoringBackup.timestamp)}<br />
                <strong>Size:</strong> {restoringBackup && formatBytes(restoringBackup.size_bytes)}
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-900 font-semibold mb-2">⚠️ WARNING - Critical Action:</p>
                <ul className="text-red-800 text-sm space-y-1 list-disc list-inside">
                  <li>All current data will be <strong>REPLACED</strong> with backup data</li>
                  <li>Any changes made after the backup date will be <strong>LOST</strong></li>
                  <li>This action <strong>CANNOT BE UNDONE</strong></li>
                  <li>All users will need to refresh their browsers</li>
                </ul>
              </div>
              <p className="text-sm font-medium">
                Are you absolutely sure you want to proceed?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoreInProgress}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestoreBackup}
              disabled={restoreInProgress}
              className="bg-amber-600 text-white hover:bg-amber-700"
            >
              {restoreInProgress ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Restoring...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Yes, Restore Backup
                </span>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
