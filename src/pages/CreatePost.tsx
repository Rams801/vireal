
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Camera, Video, Film, Upload, X, Hash, MapPin, Users, Smile } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'reel'>('image');
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isBoostPost, setIsBoostPost] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    
    if (!isImage && !isVideo) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image or video file',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file smaller than 100MB',
        variant: 'destructive',
      });
      return;
    }

    setMediaFile(file);
    setMediaType(isVideo ? (mediaType === 'reel' ? 'reel' : 'video') : 'image');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addHashtag = () => {
    if (hashtagInput.trim() && !hashtags.includes(hashtagInput.trim())) {
      setHashtags([...hashtags, hashtagInput.trim()]);
      setHashtagInput('');
    }
  };

  const removeHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter(tag => tag !== tagToRemove));
  };

  const uploadMedia = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('social-media')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('social-media')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      toast({
        title: 'Content required',
        description: 'Please add some content or media to your post',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      let mediaUrl = null;
      
      if (mediaFile) {
        mediaUrl = await uploadMedia(mediaFile);
      }

      const postData = {
        user_id: user?.id,
        content: content.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
        hashtags: hashtags.length > 0 ? hashtags : null,
        is_boosted: isBoostPost,
        boost_expires_at: isBoostPost ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() : null,
      };

      const { error } = await supabase
        .from('posts')
        .insert(postData);

      if (error) throw error;

      // Deduct coins if boosting
      if (isBoostPost) {
        const { error: coinError } = await supabase
          .from('profiles')
          .update({ coins: supabase.raw('coins - 50') })
          .eq('id', user?.id);

        if (coinError) throw coinError;
      }

      toast({
        title: 'Success',
        description: `${mediaType === 'reel' ? 'Reel' : 'Post'} created successfully!`,
      });

      navigate('/');
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

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-slate-800/50 backdrop-blur-sm border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Camera className="h-6 w-6" />
            <span>Create New Post</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Post Type Selection */}
            <Tabs value={mediaType} onValueChange={(value) => setMediaType(value as any)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="image" className="flex items-center space-x-2">
                  <Camera className="h-4 w-4" />
                  <span>Photo</span>
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center space-x-2">
                  <Video className="h-4 w-4" />
                  <span>Video</span>
                </TabsTrigger>
                <TabsTrigger value="reel" className="flex items-center space-x-2">
                  <Film className="h-4 w-4" />
                  <span>Reel</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <p className="text-slate-300 text-sm">Share a photo with your followers</p>
              </TabsContent>
              <TabsContent value="video" className="space-y-4">
                <p className="text-slate-300 text-sm">Upload a video (up to 100MB)</p>
              </TabsContent>
              <TabsContent value="reel" className="space-y-4">
                <p className="text-slate-300 text-sm">Create a short vertical video (30-60 seconds recommended)</p>
              </TabsContent>
            </Tabs>

            {/* Media Upload */}
            <div className="space-y-4">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-purple-500/30 border-dashed rounded-lg cursor-pointer bg-slate-700/30 hover:bg-slate-700/50">
                  {mediaPreview ? (
                    <div className="relative w-full h-full">
                      {mediaType === 'image' ? (
                        <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <video src={mediaPreview} className="w-full h-full object-cover rounded-lg" controls />
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={removeMedia}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-10 h-10 mb-3 text-slate-400" />
                      <p className="mb-2 text-sm text-slate-300">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-slate-400">
                        {mediaType === 'image' ? 'PNG, JPG, GIF' : 'MP4, MOV, AVI'} (MAX. 100MB)
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            </div>

            {/* Caption */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">Caption</label>
              <div className="relative">
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write a caption..."
                  className="bg-slate-700 border-slate-600 text-white min-h-24 pr-10"
                  maxLength={2200}
                />
                <Smile className="absolute top-3 right-3 h-5 w-5 text-slate-400 cursor-pointer hover:text-white" />
              </div>
              <p className="text-xs text-slate-400">{content.length}/2200</p>
            </div>

            {/* Hashtags */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white flex items-center space-x-2">
                <Hash className="h-4 w-4" />
                <span>Hashtags</span>
              </label>
              <div className="flex space-x-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  placeholder="Add hashtag"
                  className="bg-slate-700 border-slate-600 text-white"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addHashtag())}
                />
                <Button type="button" onClick={addHashtag} variant="outline">
                  Add
                </Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="bg-purple-600 text-white">
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeHashtag(tag)}
                        className="ml-2 hover:text-red-300"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Boost Post Option */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="boost"
                  checked={isBoostPost}
                  onChange={(e) => setIsBoostPost(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="boost" className="text-sm text-white">
                  Boost this post (50 coins) - Appear in Explore for 7 days
                </label>
              </div>
            </div>

            {/* Additional Options */}
            <div className="space-y-4 pt-4 border-t border-purple-500/20">
              <div className="flex items-center justify-between text-sm text-slate-300">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>Add location</span>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  Add
                </Button>
              </div>
              
              <div className="flex items-center justify-between text-sm text-slate-300">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Tag people</span>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  Tag
                </Button>
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {loading ? 'Posting...' : `Share ${mediaType === 'reel' ? 'Reel' : 'Post'}`}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;
