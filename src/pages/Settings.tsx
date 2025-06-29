
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  Settings as SettingsIcon, 
  User, 
  Palette, 
  Shield, 
  Bell, 
  Camera, 
  Crown,
  Star,
  Moon,
  Sun,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  theme: 'default' | 'neon' | 'gold';
  is_vip: boolean;
  coins: number;
}

const Settings = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image smaller than 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/avatar.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('social-media')
      .upload(fileName, file, { upsert: true });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('social-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleProfileUpdate = async (updates: Partial<Profile>) => {
    setLoading(true);
    try {
      let avatarUrl = profile?.avatar_url;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates, avatar_url: avatarUrl } : null);
      setAvatarFile(null);
      setAvatarPreview(null);

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (theme: 'default' | 'neon' | 'gold') => {
    handleProfileUpdate({ theme });
    
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
  };

  const upgradeToVIP = async () => {
    if (!profile || profile.coins < 500) {
      toast({
        title: 'Insufficient coins',
        description: 'You need 500 coins to upgrade to VIP',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_vip: true,
          coins: profile.coins - 500,
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Add VIP badge
      await supabase
        .from('user_badges')
        .insert({
          user_id: user?.id,
          badge_type: 'vip',
        });

      setProfile(prev => prev ? { ...prev, is_vip: true, coins: prev.coins - 500 } : null);

      toast({
        title: 'Congratulations!',
        description: 'You are now a VIP member!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <SettingsIcon className="h-8 w-8 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="theme" className="flex items-center space-x-2">
            <Palette className="h-4 w-4" />
            <span>Theme</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Privacy</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Profile Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarPreview || profile.avatar_url} />
                    <AvatarFallback className="bg-purple-600 text-white text-2xl">
                      {profile.username?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="sm"
                    className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-purple-600 hover:bg-purple-700"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold text-white">{profile.username}</h3>
                    {profile.is_vip && (
                      <Badge className="bg-purple-600 text-white">
                        <Crown className="h-3 w-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-300 mb-2">{profile.full_name}</p>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span className="text-yellow-500 font-medium">{profile.coins}</span>
                      <span className="text-slate-400 text-sm">coins</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Form */}
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleProfileUpdate({
                  username: formData.get('username') as string,
                  full_name: formData.get('full_name') as string,
                  bio: formData.get('bio') as string,
                });
              }} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="text-white">Username</Label>
                    <Input
                      id="username"
                      name="username"
                      defaultValue={profile.username}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="full_name" className="text-white">Full Name</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      defaultValue={profile.full_name}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    defaultValue={profile.bio}
                    placeholder="Tell us about yourself..."
                    className="bg-slate-700 border-slate-600 text-white"
                    maxLength={150}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </form>

              {/* VIP Upgrade */}
              {!profile.is_vip && (
                <Card className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/40">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Crown className="h-8 w-8 text-purple-400" />
                        <div>
                          <h3 className="text-white font-bold">Upgrade to VIP</h3>
                          <p className="text-slate-300 text-sm">Unlock premium features and exclusive content</p>
                        </div>
                      </div>
                      <Button
                        onClick={upgradeToVIP}
                        className="bg-purple-600 hover:bg-purple-700"
                        disabled={profile.coins < 500}
                      >
                        500 Coins
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Theme Settings */}
        <TabsContent value="theme">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Theme Selection</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={profile.theme}
                onValueChange={handleThemeChange}
                className="space-y-4"
              >
                <div className="flex items-center space-x-4 p-4 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <RadioGroupItem value="default" id="default" />
                  <Label htmlFor="default" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900"></div>
                      <Moon className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Midnight Blue</div>
                      <div className="text-slate-300 text-sm">Default theme with purple accents</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <RadioGroupItem value="neon" id="neon" />
                  <Label htmlFor="neon" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-black via-red-500 to-black"></div>
                      <Zap className="h-5 w-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Neon Red</div>
                      <div className="text-slate-300 text-sm">Dark theme with red neon accents</div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-4 p-4 rounded-lg border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                  <RadioGroupItem value="gold" id="gold" />
                  <Label htmlFor="gold" className="flex items-center space-x-3 cursor-pointer flex-1">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-r from-white via-yellow-400 to-white"></div>
                      <Sun className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-white font-medium">Gold & White</div>
                      <div className="text-slate-300 text-sm">Light theme with gold accents</div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Settings */}
        <TabsContent value="privacy">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Privacy & Security</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Private Account</h3>
                    <p className="text-slate-300 text-sm">Only approved followers can see your posts</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Hide Activity Status</h3>
                    <p className="text-slate-300 text-sm">Don't show when you're online</p>
                  </div>
                  <input type="checkbox" className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Allow Comments</h3>
                    <p className="text-slate-300 text-sm">Let people comment on your posts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Notification Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Likes</h3>
                    <p className="text-slate-300 text-sm">When someone likes your posts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Comments</h3>
                    <p className="text-slate-300 text-sm">When someone comments on your posts</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">New Followers</h3>
                    <p className="text-slate-300 text-sm">When someone follows you</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-white font-medium">Messages</h3>
                    <p className="text-slate-300 text-sm">When you receive new messages</p>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
