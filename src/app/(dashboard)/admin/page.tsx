'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ShieldCheck, 
  Users, 
  UserPlus, 
  Trash2, 
  Edit, 
  UserCheck, 
  UserX, 
  CheckCircle2, 
  XCircle,
  KeyRound,
  History,
  ShieldAlert,
  Search,
  Check,
  Shield,
  Loader2
} from 'lucide-react';
import { useAppStore, User } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, StaffPosition, AccountStatus } from '@/lib/permissions';
import { cn } from '@/lib/utils';

export default function StaffManagementPage() {
  const { 
    staffList, 
    fetchStaff, 
    createStaff, 
    updateStaff, 
    deleteStaff, 
    currentUser,
    auditLogs,
    fetchAuditLogs,
    hasPermission
  } = useAppStore();

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.isSuperAdmin;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'staff' | 'audit'>('staff');

  // Create Staff Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formPosition, setFormPosition] = useState<StaffPosition>('Manager');
  const [formStatus, setFormStatus] = useState<AccountStatus>('active');
  const [formPermissions, setFormPermissions] = useState<string[]>([
    'dashboard.view', 'inventory.view', 'products.view', 'customers.view', 'invoices.view'
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Edit Staff Modal State
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);

  useEffect(() => {
    fetchStaff();
    if (currentUser?.role === 'SUPER_ADMIN') {
      fetchAuditLogs();
    }
  }, [fetchStaff, fetchAuditLogs, currentUser]);

  const resetForm = () => {
    setFormName('');
    setFormUsername('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
    setFormPosition('Manager');
    setFormStatus('active');
    setFormPermissions([
      'dashboard.view', 'inventory.view', 'products.view', 'customers.view', 'invoices.view'
    ]);
    setEditingStaffId(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsAddOpen(true);
  };

  const handleOpenEdit = (staff: User) => {
    setEditingStaffId(staff.id);
    setFormName(staff.name);
    setFormUsername(staff.username);
    setFormEmail(staff.email);
    setFormPhone(staff.phone || '');
    setFormPassword('');
    setFormPosition(staff.position || 'Supervisor');
    setFormStatus(staff.status);
    setFormPermissions(staff.permissions || []);
    setIsEditOpen(true);
  };

  const togglePermission = (key: string) => {
    if (formPermissions.includes(key)) {
      setFormPermissions(formPermissions.filter(p => p !== key));
    } else {
      setFormPermissions([...formPermissions, key]);
    }
  };

  const toggleCategoryAll = (category: string) => {
    const catPermKeys = ALL_PERMISSIONS.filter(p => p.category === category).map(p => p.key);
    const allSelected = catPermKeys.every(k => formPermissions.includes(k));

    if (allSelected) {
      setFormPermissions(formPermissions.filter(k => !catPermKeys.includes(k)));
    } else {
      const merged = Array.from(new Set([...formPermissions, ...catPermKeys]));
      setFormPermissions(merged);
    }
  };

  const handleCreate = async () => {
    if (!formName || !formUsername || !formEmail || !formPassword) {
      toast({ title: "Missing Fields", description: "Please fill in all required fields.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await createStaff({
      name: formName,
      username: formUsername,
      email: formEmail,
      phone: formPhone,
      password: formPassword,
      position: formPosition,
      status: formStatus,
      permissions: formPermissions,
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Staff Created", description: `Account created for ${formName} (${formPosition}).` });
      setIsAddOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to create staff account.", variant: "destructive" });
    }
  };

  const handleUpdate = async () => {
    if (!editingStaffId) return;
    if (!formName || !formEmail) {
      toast({ title: "Missing Fields", description: "Name and Email are required.", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    const res = await updateStaff(editingStaffId, {
      name: formName,
      email: formEmail,
      phone: formPhone,
      position: formPosition,
      status: formStatus,
      permissions: formPermissions,
      ...(formPassword.trim().length > 0 ? { password: formPassword } : {}),
    });
    setIsSaving(false);

    if (res.success) {
      toast({ title: "Staff Updated", description: `Permissions and details saved for ${formName}.` });
      setIsEditOpen(false);
      resetForm();
    } else {
      toast({ title: "Error", description: res.error || "Failed to update staff account.", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (staff: User) => {
    if (staff.isSuperAdmin || staff.username === 'supadmin26') {
      toast({ title: "Denied", description: "Super Admin cannot be disabled.", variant: "destructive" });
      return;
    }
    const next = staff.status === 'active' ? 'disabled' : 'active';
    const res = await updateStaff(staff.id, { status: next });
    if (res.success) {
      toast({ 
        title: next === 'active' ? "Account Activated" : "Account Deactivated", 
        description: `${staff.name} is now ${next}. Access ${next === 'active' ? 'restored' : 'revoked immediately'}.` 
      });
    } else {
      toast({ title: "Error", description: res.error || "Failed to update status", variant: "destructive" });
    }
  };

  const handleDelete = async (staff: User) => {
    if (staff.isSuperAdmin || staff.username === 'supadmin26') {
      toast({ title: "Action Denied", description: "Super Admin account cannot be deleted.", variant: "destructive" });
      return;
    }
    if (confirm(`Are you sure you want to permanently delete the staff account for ${staff.name}?`)) {
      const res = await deleteStaff(staff.id);
      if (res.success) {
        toast({ title: "Staff Deleted", description: "The staff account has been permanently removed." });
      } else {
        toast({ title: "Error", description: res.error || "Failed to delete staff account.", variant: "destructive" });
      }
    }
  };

  const filteredStaff = staffList.filter(s => {
    // If not super admin, strictly hide super admin account
    if (!isSuperAdmin && (s.role === 'SUPER_ADMIN' || s.isSuperAdmin || s.username === 'supadmin26')) {
      return false;
    }
    return (
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.position && s.position.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight text-primary">Staff Management</h1>
            <Badge className="bg-primary/10 text-primary border-primary/20 text-xs uppercase font-bold">
              RBAC Control
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Create, configure positions, and manage granular ON/OFF permissions for team members.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {(isSuperAdmin || hasPermission('staff.create')) && (
            <Button onClick={handleOpenAdd} className="gap-2 shadow-md">
              <UserPlus className="w-4 h-4" />
              Add Staff Member
            </Button>
          )}
        </div>
      </div>

      <div className={cn("grid grid-cols-1 gap-4", isSuperAdmin ? "md:grid-cols-4" : "md:grid-cols-3")}>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Staff</p>
              <h3 className="text-2xl font-black mt-1">
                {isSuperAdmin ? staffList.length : staffList.filter(s => s.role !== 'SUPER_ADMIN' && !s.isSuperAdmin).length}
              </h3>
            </div>
            <Users className="w-7 h-7 text-primary/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Accounts</p>
              <h3 className="text-2xl font-black text-green-600 mt-1">
                {staffList.filter(s => s.status === 'active' && (isSuperAdmin || (!s.isSuperAdmin && s.role !== 'SUPER_ADMIN'))).length}
              </h3>
            </div>
            <UserCheck className="w-7 h-7 text-green-500/40" />
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Disabled Accounts</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">
                {staffList.filter(s => s.status === 'disabled').length}
              </h3>
            </div>
            <UserX className="w-7 h-7 text-amber-500/40" />
          </CardContent>
        </Card>
        {isSuperAdmin && (
          <Card className="border-none shadow-sm bg-white">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Super Admins</p>
                <h3 className="text-2xl font-black text-primary mt-1">
                  {staffList.filter(s => s.role === 'SUPER_ADMIN' || s.isSuperAdmin).length}
                </h3>
              </div>
              <ShieldCheck className="w-7 h-7 text-primary/40" />
            </CardContent>
          </Card>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="staff" className="gap-2">
              <Users className="w-4 h-4" />
              Staff Accounts ({staffList.length})
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="audit" className="gap-2">
                <ShieldAlert className="w-4 h-4" />
                Administrative Audit Log ({auditLogs.length})
              </TabsTrigger>
            )}
          </TabsList>

          {activeTab === 'staff' && (
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
          )}
        </div>

        <TabsContent value="staff" className="space-y-4">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-4">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                Staff Directory & Permission Matrix
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Username / Email</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStaff.map((staff) => {
                    const isStaffSuperAdmin = staff.role === 'SUPER_ADMIN' || staff.isSuperAdmin;
                    const permCount = isStaffSuperAdmin ? ALL_PERMISSIONS.length : (staff.permissions?.length || 0);

                    return (
                      <TableRow key={staff.id} className={cn(
                        "hover:bg-muted/10 transition-colors",
                        staff.status === 'disabled' && "opacity-60 bg-muted/20"
                      )}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {staff.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-sm flex items-center gap-1.5">
                                {staff.name}
                                {isStaffSuperAdmin && (
                                  <Badge className="bg-amber-500 hover:bg-amber-600 text-[9px] py-0 px-1.5">
                                    SUPER ADMIN
                                  </Badge>
                                )}
                              </div>
                              <div className="text-[11px] text-muted-foreground">{staff.phone || 'No phone'}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-bold text-primary">{staff.username}</span>
                            <span className="text-xs text-muted-foreground">{staff.email}</span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="font-bold text-xs">
                            {staff.position || 'Supervisor'}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <button
                            onClick={() => !isStaffSuperAdmin && handleToggleStatus(staff)}
                            disabled={isStaffSuperAdmin}
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold cursor-pointer transition-all",
                              staff.status === 'active' 
                                ? "bg-green-100 text-green-700 hover:bg-green-200" 
                                : "bg-red-100 text-red-700 hover:bg-red-200"
                            )}
                          >
                            {staff.status === 'active' ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Active
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3 h-3" />
                                Disabled
                              </>
                            )}
                          </button>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <Badge variant={isStaffSuperAdmin ? 'default' : 'secondary'} className="text-[10px]">
                              {isStaffSuperAdmin ? 'Full Access (All)' : `${permCount} granted`}
                            </Badge>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never logged in'}
                        </TableCell>

                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 gap-1 text-primary hover:bg-primary/10"
                              onClick={() => handleOpenEdit(staff)}
                              disabled={isStaffSuperAdmin && !isSuperAdmin}
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span className="text-xs font-bold">Edit</span>
                            </Button>

                            {!isStaffSuperAdmin && (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className={cn(
                                    "h-8 gap-1",
                                    staff.status === 'active' ? "text-amber-600 hover:bg-amber-50" : "text-green-600 hover:bg-green-50"
                                  )}
                                  onClick={() => handleToggleStatus(staff)}
                                >
                                  {staff.status === 'active' ? (
                                    <>
                                      <UserX className="w-3.5 h-3.5" />
                                      <span className="text-xs font-bold">Disable</span>
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-3.5 h-3.5" />
                                      <span className="text-xs font-bold">Enable</span>
                                    </>
                                  )}
                                </Button>

                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                  onClick={() => handleDelete(staff)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="audit" className="space-y-4">
            <Card className="border-none shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/10 border-b py-4">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  System Audit Trail
                </CardTitle>
                <CardDescription>Track administrative actions, user logins, and configuration changes.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Actor</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLogs.map((log) => (
                      <TableRow key={log.id} className="text-xs">
                        <TableCell className="font-mono text-muted-foreground whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold">{log.userName}</div>
                          <span className="text-[10px] text-muted-foreground uppercase">{log.userRole}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-[10px]">
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{log.target}</TableCell>
                        <TableCell className="text-muted-foreground max-w-md">{log.details}</TableCell>
                      </TableRow>
                    ))}
                    {auditLogs.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                          No audit log entries recorded yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* CREATE STAFF MODAL */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Create New Staff Account
            </DialogTitle>
            <DialogDescription>
              Assign login credentials, position, and individual ON/OFF permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="create-name">Full Name *</Label>
                <Input 
                  id="create-name" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                  placeholder="e.g. Ruwan Silva" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-username">Username *</Label>
                <Input 
                  id="create-username" 
                  value={formUsername} 
                  onChange={(e) => setFormUsername(e.target.value)} 
                  placeholder="e.g. ruwans" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-email">Work Email *</Label>
                <Input 
                  id="create-email" 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                  placeholder="ruwan@cinnamonlanka.com" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-phone">Phone Number</Label>
                <Input 
                  id="create-phone" 
                  value={formPhone} 
                  onChange={(e) => setFormPhone(e.target.value)} 
                  placeholder="+94 77 123 4567" 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-password">Initial Password *</Label>
                <Input 
                  id="create-password" 
                  type="password" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
              </div>

              <div className="space-y-2">
                <Label>Position *</Label>
                <Select value={formPosition} onValueChange={(v: StaffPosition) => setFormPosition(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Employer">Employer</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-primary">Assign Individual Permissions</h4>
                  <p className="text-xs text-muted-foreground">Select individual capabilities granted to this staff member.</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setFormPermissions(ALL_PERMISSIONS.map(p => p.key))}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setFormPermissions([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map(category => {
                  const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category);
                  const isAllCatSelected = categoryPerms.every(p => formPermissions.includes(p.key));

                  return (
                    <div key={category} className="p-3 bg-muted/20 rounded-xl border space-y-2">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{category}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                          onClick={() => toggleCategoryAll(category)}
                        >
                          {isAllCatSelected ? 'Deselect Category' : 'Select Category'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {categoryPerms.map(perm => {
                          const checked = formPermissions.includes(perm.key);
                          return (
                            <label 
                              key={perm.key} 
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs border",
                                checked ? "bg-primary/5 border-primary/30" : "bg-white border-transparent hover:bg-muted/40"
                              )}
                            >
                              <Checkbox 
                                checked={checked} 
                                onCheckedChange={() => togglePermission(perm.key)}
                                className="mt-0.5"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{perm.label}</span>
                                <span className="text-[10px] text-muted-foreground">{perm.description}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Create Staff Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EDIT STAFF MODAL */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Edit Staff Member & Permissions
            </DialogTitle>
            <DialogDescription>
              Update staff details, position, reset password, or modify assigned permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name *</Label>
                <Input 
                  id="edit-name" 
                  value={formName} 
                  onChange={(e) => setFormName(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-username">Username</Label>
                <Input 
                  id="edit-username" 
                  value={formUsername} 
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-email">Work Email *</Label>
                <Input 
                  id="edit-email" 
                  type="email" 
                  value={formEmail} 
                  onChange={(e) => setFormEmail(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input 
                  id="edit-phone" 
                  value={formPhone} 
                  onChange={(e) => setFormPhone(e.target.value)} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-password">New Password (leave blank to keep current)</Label>
                <Input 
                  id="edit-password" 
                  type="password" 
                  value={formPassword} 
                  onChange={(e) => setFormPassword(e.target.value)} 
                  placeholder="••••••••" 
                />
              </div>

              <div className="space-y-2">
                <Label>Position *</Label>
                <Select value={formPosition} onValueChange={(v: StaffPosition) => setFormPosition(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Director">Director</SelectItem>
                    <SelectItem value="Employer">Employer</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                    <SelectItem value="Supervisor">Supervisor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Permissions Matrix */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-primary">Modify Individual Permissions</h4>
                  <p className="text-xs text-muted-foreground">Changes take effect immediately on backend and UI.</p>
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setFormPermissions(ALL_PERMISSIONS.map(p => p.key))}
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="text-xs h-7"
                    onClick={() => setFormPermissions([])}
                  >
                    Clear All
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {PERMISSION_CATEGORIES.map(category => {
                  const categoryPerms = ALL_PERMISSIONS.filter(p => p.category === category);
                  const isAllCatSelected = categoryPerms.every(p => formPermissions.includes(p.key));

                  return (
                    <div key={category} className="p-3 bg-muted/20 rounded-xl border space-y-2">
                      <div className="flex items-center justify-between border-b pb-1.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-primary">{category}</span>
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-[10px] text-muted-foreground hover:text-primary"
                          onClick={() => toggleCategoryAll(category)}
                        >
                          {isAllCatSelected ? 'Deselect Category' : 'Select Category'}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {categoryPerms.map(perm => {
                          const checked = formPermissions.includes(perm.key);
                          return (
                            <label 
                              key={perm.key} 
                              className={cn(
                                "flex items-start gap-2 p-2 rounded-lg cursor-pointer transition-colors text-xs border",
                                checked ? "bg-primary/5 border-primary/30" : "bg-white border-transparent hover:bg-muted/40"
                              )}
                            >
                              <Checkbox 
                                checked={checked} 
                                onCheckedChange={() => togglePermission(perm.key)}
                                className="mt-0.5"
                              />
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground">{perm.label}</span>
                                <span className="text-[10px] text-muted-foreground">{perm.description}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdate} disabled={isSaving} className="gap-2">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Edit className="w-4 h-4" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
