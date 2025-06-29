
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import PostCard from '@/components/PostCard';
import { useToast } from '@/hooks/use-toast';

const Explore = () => {
  const [posts, setPosts] = useState([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchExplorePosts();
    fetchTrendingHashtags();
  }, []);

  const fetchExplorePosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .order('like_count', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load explore posts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrendingHashtags = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('hashtags')
        .not('hashtags', 'is', null)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const hashtagCounts: { [key: string]: number } = {};
      data?.forEach(post => {
        post.hashtags?.forEach((tag: string) => {
          hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1;
        });
      });

      const trending = Object.entries(hashtagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      setTrendingHashtags(trending);
    } catch (error: any) {
      console.error('Failed to fetch trending hashtags:', error);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      fetchExplorePosts();
      return;
    }

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id (username, full_name, avatar_url)
        `)
        .or(`content.ilike.%${query}%,hashtags.cs.{${query}}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Search failed',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-4">Explore</h1>
        
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
          <Input
            placeholder="Search posts, hashtags..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            className="pl-10 bg-slate-800/50 border-slate-600 text-white"
          />
        </div>

        {/* Trending Hashtags */}
        {trendingHashtags.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-3">Trending Hashtags</h2>
            <div className="flex flex-wrap gap-2">
              {trendingHashtags.map((tag, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSearchQuery(tag);
                    handleSearch(tag);
                  }}
                  className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full text-sm hover:bg-purple-600/30 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-white">Loading explore posts...</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Explore;
