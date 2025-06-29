
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Share, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PostCardProps {
  post: {
    id: string;
    content: string;
    media_url: string;
    media_type: 'image' | 'video' | 'reel';
    hashtags: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
    user_id: string;
    profiles: {
      username: string;
      full_name: string;
      avatar_url: string;
    };
  };
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleLike = async () => {
    if (!user) return;

    try {
      if (liked) {
        // Unlike
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', user.id)
          .eq('post_id', post.id);
        
        setLiked(false);
        setLikeCount(prev => prev - 1);
      } else {
        // Like
        await supabase
          .from('likes')
          .insert({
            user_id: user.id,
            post_id: post.id,
          });
        
        setLiked(true);
        setLikeCount(prev => prev + 1);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update like',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-purple-500/20 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center space-x-3">
        <Avatar>
          <AvatarImage src={post.profiles.avatar_url} />
          <AvatarFallback className="bg-purple-600 text-white">
            {post.profiles.username?.[0]?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-semibold text-white">{post.profiles.username}</p>
          <p className="text-sm text-slate-300">{post.profiles.full_name}</p>
        </div>
        <span className="text-sm text-slate-400">
          {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
        </span>
      </div>

      {/* Content */}
      {post.content && (
        <div className="px-4 pb-3">
          <p className="text-white">{post.content}</p>
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.hashtags.map((tag, index) => (
                <span key={index} className="text-purple-400 text-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Media */}
      {post.media_url && (
        <div className="relative">
          {post.media_type === 'video' || post.media_type === 'reel' ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-96 object-cover"
            />
          ) : (
            <img
              src={post.media_url}
              alt="Post media"
              className="w-full max-h-96 object-cover"
            />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            className={`flex items-center space-x-2 ${
              liked ? 'text-red-500' : 'text-slate-300 hover:text-red-500'
            }`}
          >
            <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} />
            <span>{likeCount}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="flex items-center space-x-2 text-slate-300 hover:text-blue-500"
          >
            <MessageCircle className="h-5 w-5" />
            <span>{post.comment_count}</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-300 hover:text-green-500"
          >
            <Share className="h-5 w-5" />
          </Button>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-300 hover:text-yellow-500"
        >
          <DollarSign className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default PostCard;
