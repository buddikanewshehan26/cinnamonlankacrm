'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Building2, 
  Globe, 
  Lock, 
  User, 
  Key, 
  Camera, 
  Upload, 
  Save, 
  Mail, 
  Phone, 
  MapPin, 
  Palette, 
  Coins,
  ShieldCheck,
  Loader2
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore, CurrencyType } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { cn } from '@/lib/utils';

const COLOR_PRESETS = [
  { name: 'Sienna (Default)', value: '20 50% 47%', hex: '#B4673D' },
  { name: 'Ocean Blue', value: '221.2 83.2% 53.3%', hex: '#3B82F6' },
  { name: 'Emerald', value: '142.1 76.2% 36.3%', hex: '#10B981' },
  { name: 'Royal Purple', value: '262.1 83.3% 57.8%', hex: '#8B5CF6' },
  { name: 'Deep Slate', value: '215 25% 27%', hex: '#334155' },
  { name: 'Rich Red', value: '0 72% 51%', hex: '#DC2626' },
];

export default function SettingsPage() {
  const { 
    currentUser, 
    updateMyPassword, 
    updateProfile, 
    companySettings, 
    updateCompanySettings,
    hasPermission,
    fetchSettings
  } = useAppStore();
  
  // Password State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Profile State
  const [profileName, setProfileName] = useState(currentUser?.name || '');
  const [profilePhone, setProfilePhone] = useState(currentUser?.phone || '');
  const [profileAvatar, setProfileAvatar] = useState(currentUser?.avatar || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Business Profile Form State
  const [compName, setCompName] = useState(companySettings.name);
  const [compAddress, setCompAddress] = useState(companySettings.address);
  const [compHotline, setCompHotline] = useState(companySettings.hotline);
  const [compEmail, setCompEmail] = useState(companySettings.email);
  const [compWebsite, setCompWebsite] = useState(companySettings.website || 'https://cinnamonlanka.com');
  const [compLogo, setCompLogo] = useState(companySettings.logo);
  const [compColor, setCompColor] = useState(companySettings.primaryColor);
  const [compCurrency, setCompCurrency] = useState<CurrencyType>(companySettings.currency || 'USD');
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [isSavingBiz, setIsSavingBiz] = useState(false);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN' || currentUser?.isSuperAdmin;
  const canEditBusiness = isSuperAdmin || hasPermission('business_profile.edit');

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    setCompName(companySettings.name);
    setCompAddress(companySettings.address);
    setCompHotline(companySettings.hotline);
    setCompEmail(companySettings.email);
    setCompWebsite(companySettings.website || 'https://cinnamonlanka.com');
    setCompLogo(companySettings.logo);
    setCompColor(companySettings.primaryColor);
    setCompCurrency(companySettings.currency || 'USD');
  }, [companySettings]);

  const handleUpdatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({ title: "Error", description: "Passwords do not match or are empty.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Weak Password", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }
    const success = await updateMyPassword(newPassword);
    if (success) {
      toast({ title: "Success", description: "Your login password has been updated." });
      setNewPassword('');
      setConfirmPassword('');
    } else {
      toast({ title: "Error", description: "Failed to update password.", variant: "destructive" });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Please upload an image smaller than 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileAvatar(reader.result as string);
        toast({ title: "Image Selected", description: "Click 'Save Profile' to finalize." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEditBusiness) return;
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Logo should be under 2MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompLogo(reader.result as string);
        toast({ title: "Logo Ready", description: "Click 'Save Business Profile' to apply." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      toast({ title: "Error", description: "Display name cannot be empty.", variant: "destructive" });
      return;
    }
    const success = await updateProfile({
      name: profileName,
      phone: profilePhone,
      avatar: profileAvatar,
    });
    if (success) {
      toast({ title: "Profile Updated", description: "Your details have been saved." });
    } else {
      toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    }
  };

  const handleSaveCompanySettings = async () => {
    if (!canEditBusiness) {
      toast({ title: "Access Denied", description: "Only Super Admin or authorized staff can modify the business profile.", variant: "destructive" });
      return;
    }

    setIsSavingBiz(true);
    const success = await updateCompanySettings({
      name: compName,
      address: compAddress,
      hotline: compHotline,
      email: compEmail,
      website: compWebsite,
      logo: compLogo,
      primaryColor: compColor,
      currency: compCurrency,
    });
    setIsSavingBiz(false);

    if (success) {
      toast({ title: "Business Profile Saved", description: "Company identity and branding have been updated." });
    } else {
      toast({ title: "Error", description: "Failed to update business profile.", variant: "destructive" });
    }
  };

  const defaultLogo = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl || '';

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-primary">Business Profile & Settings</h1>
        <p className="text-muted-foreground">Configure global branding, corporate details, and personal account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* BUSINESS IDENTITY SECTION */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">Corporate Business Identity</CardTitle>
                </div>
                {!canEditBusiness && (
                  <Badge variant="outline" className="text-xs">
                    Read-Only (Super Admin Access Required to Edit)
                  </Badge>
                )}
              </div>
              <CardDescription>Official business profile displayed on invoices, portal headers, and export documents.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6 pb-6 border-b">
                <div className="flex flex-col items-center gap-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Official Logo</Label>
                  <div 
                    className={cn(
                      "relative group w-28 h-28 bg-white rounded-xl shadow-inner border border-dashed border-primary/20 flex items-center justify-center overflow-hidden",
                      canEditBusiness ? "cursor-pointer" : "cursor-default"
                    )}
                    onClick={() => canEditBusiness && logoInputRef.current?.click()}
                  >
                    <Image 
                      src={compLogo || defaultLogo} 
                      alt="Company Logo" 
                      fill 
                      className="object-contain p-2" 
                    />
                    {canEditBusiness && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-5 h-5 text-white mb-1" />
                        <span className="text-white text-[9px] font-bold">CHANGE</span>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <Building2 className="w-3.5 h-3.5 text-primary" /> Company Name
                    </Label>
                    <Input 
                      value={compName} 
                      onChange={(e) => setCompName(e.target.value)} 
                      disabled={!canEditBusiness}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <Mail className="w-3.5 h-3.5 text-primary" /> Official Email
                    </Label>
                    <Input 
                      value={compEmail} 
                      onChange={(e) => setCompEmail(e.target.value)} 
                      disabled={!canEditBusiness}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <Phone className="w-3.5 h-3.5 text-primary" /> Hotline / Phone
                    </Label>
                    <Input 
                      value={compHotline} 
                      onChange={(e) => setCompHotline(e.target.value)} 
                      disabled={!canEditBusiness}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <Globe className="w-3.5 h-3.5 text-primary" /> Website
                    </Label>
                    <Input 
                      value={compWebsite} 
                      onChange={(e) => setCompWebsite(e.target.value)} 
                      disabled={!canEditBusiness}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label className="flex items-center gap-1.5 text-xs font-bold uppercase">
                      <MapPin className="w-3.5 h-3.5 text-primary" /> Physical Address
                    </Label>
                    <Input 
                      value={compAddress} 
                      onChange={(e) => setCompAddress(e.target.value)} 
                      disabled={!canEditBusiness}
                    />
                  </div>
                </div>
              </div>

              {/* Theme & Currency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Palette className="w-4 h-4 text-primary" />
                    Theme Brand Accent
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {COLOR_PRESETS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        disabled={!canEditBusiness}
                        onClick={() => setCompColor(color.value)}
                        className={cn(
                          "group flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all",
                          compColor === color.value 
                            ? "border-primary bg-primary/5 shadow-sm scale-105" 
                            : "border-transparent hover:border-muted-foreground/20"
                        )}
                      >
                        <div 
                          className="w-6 h-6 rounded-full shadow-inner border border-black/5" 
                          style={{ backgroundColor: color.hex }}
                        />
                        <span className="text-[9px] font-bold uppercase tracking-tighter truncate w-full text-center">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <Coins className="w-4 h-4 text-primary" />
                    Operating Currency
                  </Label>
                  <Select 
                    value={compCurrency} 
                    onValueChange={(v: CurrencyType) => setCompCurrency(v)}
                    disabled={!canEditBusiness}
                  >
                    <SelectTrigger className="w-full h-11">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD (United States Dollar - $)</SelectItem>
                      <SelectItem value="LKR">LKR (Sri Lankan Rupee - Rs.)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground italic">
                    Affects invoice generation and financial displays across the CRM.
                  </p>
                </div>
              </div>

              {canEditBusiness && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSaveCompanySettings} disabled={isSavingBiz} className="gap-2 px-6">
                    {isSavingBiz ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Business Profile
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* EDIT PERSONAL PROFILE */}
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Personal Profile Details
              </CardTitle>
              <CardDescription>Update your personal display name and contact phone.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div 
                  className="relative group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Avatar className="w-20 h-20 border-2 border-primary/20 shadow-md">
                    <AvatarImage src={profileAvatar} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                      {profileName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Upload className="w-4 h-4 text-white mb-1" />
                    <span className="text-white text-[9px] font-bold">CHANGE</span>
                  </div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleAvatarUpload} 
                />
                
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div className="space-y-2">
                    <Label htmlFor="profile-name">Display Name</Label>
                    <Input 
                      id="profile-name" 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="profile-phone">Contact Phone</Label>
                    <Input 
                      id="profile-phone" 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
              <Button onClick={handleSaveProfile} className="w-full md:w-auto">
                Save Personal Details
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ACCOUNT SECURITY SECTION */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-white">
            <CardHeader>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                Change Password
              </CardTitle>
              <CardDescription>Update your personal login password.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="user-id">Username / ID</Label>
                <Input id="user-id" value={currentUser?.username} disabled className="bg-muted font-mono" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-pass">New Password</Label>
                <Input 
                  id="new-pass" 
                  type="password" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  placeholder="At least 6 characters" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-pass">Confirm Password</Label>
                <Input 
                  id="confirm-pass" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                  placeholder="Re-enter password" 
                />
              </div>
              <Button onClick={handleUpdatePassword} className="w-full gap-2">
                <Key className="w-4 h-4" />
                Update Password
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 border border-primary/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Your Active Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-primary/20">
                  <AvatarImage src={currentUser?.avatar} className="object-cover" />
                  <AvatarFallback className="bg-primary text-white font-bold text-sm">
                    {currentUser?.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm">{currentUser?.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="default" className="text-[10px]">
                      {currentUser?.position || currentUser?.role}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {currentUser?.username}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
