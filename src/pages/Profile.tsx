
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Settings, Star, Crown, Award } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  bio: string;
  avatar_url: string;
  follower_count: number;
  following_count: number;
  coins: number;
  theme: 'default' | 'neon' | 'gold';
  is_vip: boolean;
}

interface UserBadge {
  badge_type: 'bronze' | 'silver' | 'gold' | 'vip';
  earned_at: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchUserBadges();
      fetchUserPosts();
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

  const fetchUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select('*')
        .eq('user_id', user?.id);

      if (error) throw error;
      setBadges(data || []);
    } catch (error: any) {
      console.error('Failed to fetch badges:', error);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'bronze':
        return <Award className="h-4 w-4 text-orange-600" />;
      case 'silver':
        return <Award className="h-4 w-4 text-gray-400" />;
      case 'gold':
        return <Award className="h-4 w-4 text-yellow-500" />;
      case 'vip':
        return <Crown className="h-4 w-4 text-purple-500" />;
      default:
        return <Star className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Profile Header */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20 p-6 mb-6">
        <div className="flex items-start space-x-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback className="bg-purple-600 text-white text-2xl">
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-2xl font-bold text-white">{profile.username}</h1>
              {profile.is_vip && (
                <Badge className="bg-purple-600 text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  VIP
                </Badge>
              )}
            </div>
            
            <p className="text-slate-300 mb-2">{profile.full_name}</p>
            
            {profile.bio && (
              <p className="text-white mb-4">{profile.bio}</p>
            )}

            <div className="flex items-center space-x-6 mb-4">
              <div className="text-center">
                <div className="text-xl font-bold text-white">{posts.length}</div>
                <div className="text-slate-400 text-sm">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile.follower_count}</div>
                <div className="text-slate-400 text-sm">Followers</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-white">{profile.following_count}</div>
                <div className="text-slate-400 text-sm">Following</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-yellow-500">{profile.coins}</div>
                <div className="text-slate-400 text-sm">Coins</div>
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-slate-400 text-sm">Badges:</span>
                {badges.map((badge, index) => (
                  <Badge key={index} variant="outline" className="flex items-center space-x-1">
                    {getBadgeIcon(badge.badge_type)}
                    <span className="capitalize">{badge.badge_type}</span>
                  </Badge>
                ))}
              </div>
            )}

            <Button className="bg-purple-600 hover:bg-purple-700">
              <Settings className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {posts.map((post: any) => (
          <div key={post.id} className="aspect-square bg-slate-800/50 rounded-lg overflow-hidden">
            {post.media_url ? (
              post.media_type === 'video' || post.media_type === 'reel' ? (
                <video
                  src={post.media_url}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={post.media_url}
                  alt="Post"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <p className="text-center p-4">{post.content}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="text-center text-slate-300 py-12">
          <p>No posts yet. Create your first post!</p>
        </div>
      )}
    </div>
  );
};

export default Profile;
