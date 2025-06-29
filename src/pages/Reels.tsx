
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, Share, Play, Pause } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Reel {
  id: string;
  content: string;
  media_url: string;
  like_count: number;
  comment_count: number;
  view_count: number;
  created_at: string;
  user_id: string;
  profiles: {
    username: string;
    full_name: string;
    avatar_url: string;
  };
}

const Reels = () => {
  const [reels, setReels] = useState<Reel[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .eq('media_type', 'reel')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setReels(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load reels',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (reelId: string) => {
    try {
      const { error } = await supabase
        .from('likes')
        .insert({
          post_id: reelId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
    } catch (error: any) {
      console.error('Error liking reel:', error);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading reels...</div>
      </div>
    );
  }

  if (reels.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-slate-300">
          <p className="text-xl mb-4">No reels yet!</p>
          <p>Be the first to create a reel</p>
        </div>
      </div>
    );
  }

  const currentReel = reels[currentReelIndex];

  return (
    <div className="max-w-md mx-auto h-screen bg-black relative overflow-hidden">
      {currentReel && (
        <div className="relative h-full w-full">
          <video
            src={currentReel.media_url}
            className="w-full h-full object-cover"
            autoPlay={isPlaying}
            loop
            muted
            playsInline
          />

          {/* Overlay Controls */}
          <div className="absolute inset-0 flex">
            {/* Left side - tap to pause/play */}
            <div className="flex-1" onClick={togglePlayPause}>
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-16 h-16 text-white opacity-80" />
                </div>
              )}
            </div>

            {/* Right side - interactions */}
            <div className="w-16 flex flex-col items-center justify-end pb-20 space-y-6">
              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full p-3"
                  onClick={() => handleLike(currentReel.id)}
                >
                  <Heart className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm font-medium">
                  {currentReel.like_count}
                </span>
              </div>

              <div className="flex flex-col items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20 rounded-full p-3"
                >
                  <MessageCircle className="w-6 h-6" />
                </Button>
                <span className="text-white text-sm font-medium">
                  {currentReel.comment_count}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 rounded-full p-3"
              >
                <Share className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex items-center space-x-3 mb-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentReel.profiles.avatar_url} />
                <AvatarFallback className="bg-purple-600 text-white">
                  {currentReel.profiles.username?.[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-white font-semibold">
                  {currentReel.profiles.username}
                </p>
                <p className="text-slate-300 text-sm">
                  {currentReel.profiles.full_name}
                </p>
              </div>
            </div>
            {currentReel.content && (
              <p className="text-white text-sm">{currentReel.content}</p>
            )}
          </div>

          {/* Navigation indicators */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 space-y-2">
            {reels.map((_, index) => (
              <div
                key={index}
                className={`w-1 h-8 rounded-full cursor-pointer ${
                  index === currentReelIndex ? 'bg-white' : 'bg-white/30'
                }`}
                onClick={() => setCurrentReelIndex(index)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;
