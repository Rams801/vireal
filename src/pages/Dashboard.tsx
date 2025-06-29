
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Heart, 
  MessageCircle, 
  DollarSign, 
  Eye,
  Star,
  Calendar,
  Award,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Analytics {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalEarnings: number;
  followerGrowth: number;
  engagementRate: number;
  topPost: any;
}

const Dashboard = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      // Fetch user posts
      const { data: posts, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user?.id);

      if (postsError) throw postsError;

      // Fetch tips received
      const { data: tips, error: tipsError } = await supabase
        .from('tips')
        .select('amount')
        .eq('receiver_id', user?.id);

      if (tipsError) throw tipsError;

      // Fetch follower count
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('follower_count')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;

      // Calculate analytics
      const totalPosts = posts?.length || 0;
      const totalLikes = posts?.reduce((sum, post) => sum + post.like_count, 0) || 0;
      const totalComments = posts?.reduce((sum, post) => sum + post.comment_count, 0) || 0;
      const totalViews = posts?.reduce((sum, post) => sum + post.view_count, 0) || 0;
      const totalEarnings = tips?.reduce((sum, tip) => sum + tip.amount, 0) || 0;
      const engagementRate = totalPosts > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

      const topPost = posts?.sort((a, b) => b.like_count - a.like_count)[0];

      setAnalytics({
        totalPosts,
        totalLikes,
        totalComments,
        totalViews,
        totalEarnings,
        followerGrowth: profile?.follower_count || 0,
        engagementRate,
        topPost,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = [
    { name: 'Jan', posts: 12, likes: 240, comments: 45 },
    { name: 'Feb', posts: 19, likes: 380, comments: 67 },
    { name: 'Mar', posts: 15, likes: 300, comments: 89 },
    { name: 'Apr', posts: 25, likes: 500, comments: 120 },
    { name: 'May', posts: 22, likes: 440, comments: 95 },
    { name: 'Jun', posts: 30, likes: 600, comments: 150 },
  ];

  const pieData = [
    { name: 'Likes', value: analytics?.totalLikes || 0, color: '#ef4444' },
    { name: 'Comments', value: analytics?.totalComments || 0, color: '#3b82f6' },
    { name: 'Views', value: analytics?.totalViews || 0, color: '#10b981' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <TrendingUp className="h-8 w-8 text-purple-400" />
          <h1 className="text-3xl font-bold text-white">Creator Dashboard</h1>
        </div>
        <Badge className="bg-purple-600 text-white">
          <Crown className="h-4 w-4 mr-2" />
          Professional
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Total Posts</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalPosts || 0}</p>
              </div>
              <div className="bg-purple-600/20 p-3 rounded-full">
                <Calendar className="h-6 w-6 text-purple-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+12% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Total Likes</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalLikes || 0}</p>
              </div>
              <div className="bg-red-600/20 p-3 rounded-full">
                <Heart className="h-6 w-6 text-red-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+8% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Total Views</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalViews || 0}</p>
              </div>
              <div className="bg-green-600/20 p-3 rounded-full">
                <Eye className="h-6 w-6 text-green-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+15% this month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-300 text-sm">Earnings</p>
                <p className="text-2xl font-bold text-white">{analytics?.totalEarnings || 0} coins</p>
              </div>
              <div className="bg-yellow-600/20 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
            <div className="flex items-center mt-4 text-sm">
              <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
              <span className="text-green-400">+25% this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="audience">Audience</TabsTrigger>
          <TabsTrigger value="monetization">Monetization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Chart */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Engagement Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: '1px solid #374151',
                        borderRadius: '8px'
                      }} 
                    />
                    <Line type="monotone" dataKey="likes" stroke="#ef4444" strokeWidth={2} />
                    <Line type="monotone" dataKey="comments" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Engagement Distribution */}
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Engagement Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Performing Post */}
          {analytics?.topPost && (
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Top Performing Post</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start space-x-4">
                  {analytics.topPost.media_url && (
                    <img
                      src={analytics.topPost.media_url}
                      alt="Top post"
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="text-white mb-2">{analytics.topPost.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-slate-300">
                      <div className="flex items-center space-x-1">
                        <Heart className="h-4 w-4 text-red-400" />
                        <span>{analytics.topPost.like_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-4 w-4 text-blue-400" />
                        <span>{analytics.topPost.comment_count}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Eye className="h-4 w-4 text-green-400" />
                        <span>{analytics.topPost.view_count}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="content">
          <Card className="bg-slate-800/50 border-purple-500/20">
            <CardHeader>
              <CardTitle className="text-white">Content Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px'
                    }} 
                  />
                  <Bar dataKey="posts" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audience">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Audience Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total Followers</span>
                  <span className="text-white font-bold">{analytics?.followerGrowth || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Engagement Rate</span>
                  <span className="text-white font-bold">{analytics?.engagementRate.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Avg. Likes per Post</span>
                  <span className="text-white font-bold">
                    {analytics?.totalPosts ? Math.round(analytics.totalLikes / analytics.totalPosts) : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Growth Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">This Week</span>
                    <span className="text-green-400">+15%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">This Month</span>
                    <span className="text-green-400">+32%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="monetization">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Total Earnings</h3>
                  <p className="text-3xl font-bold text-yellow-400">{analytics?.totalEarnings || 0}</p>
                  <p className="text-slate-300 text-sm mt-2">coins earned</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <Star className="h-12 w-12 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Boosted Posts</h3>
                  <p className="text-3xl font-bold text-purple-400">3</p>
                  <p className="text-slate-300 text-sm mt-2">active boosts</p>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-purple-500/20">
                <CardContent className="p-6 text-center">
                  <Award className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">Tips Received</h3>
                  <p className="text-3xl font-bold text-green-400">12</p>
                  <p className="text-slate-300 text-sm mt-2">this month</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-slate-800/50 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Monetization Tools</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-purple-400" />
                    <div>
                      <h3 className="text-white font-medium">Boost Posts</h3>
                      <p className="text-slate-300 text-sm">Increase visibility in Explore feed</p>
                    </div>
                  </div>
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    50 coins
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Crown className="h-6 w-6 text-yellow-400" />
                    <div>
                      <h3 className="text-white font-medium">VIP Status</h3>
                      <p className="text-slate-300 text-sm">Unlock premium features and exclusive content</p>
                    </div>
                  </div>
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    500 coins
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
