
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Image, Video, Film, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'reel'>('image');
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadMedia = async (file: File) => {
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
    if (!user) return;

    setUploading(true);
    try {
      let mediaUrl = null;
      
      if (selectedFile) {
        mediaUrl = await uploadMedia(selectedFile);
      }

      const hashtagArray = hashtags
        .split('#')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const { error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_url: mediaUrl,
          media_type: mediaType,
          hashtags: hashtagArray.length > 0 ? hashtagArray : null,
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Post created successfully!',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create post',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const removeMedia = () => {
    setSelectedFile(null);
    setPreview(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card className="bg-slate-800/50 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Create New Post</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs value={mediaType} onValueChange={(value) => setMediaType(value as 'image' | 'video' | 'reel')}>
              <TabsList className="grid w-full grid-cols-3 bg-slate-700">
                <TabsTrigger value="image" className="data-[state=active]:bg-purple-600">
                  <Image className="w-4 h-4 mr-2" />
                  Image
                </TabsTrigger>
                <TabsTrigger value="video" className="data-[state=active]:bg-purple-600">
                  <Video className="w-4 h-4 mr-2" />
                  Video
                </TabsTrigger>
                <TabsTrigger value="reel" className="data-[state=active]:bg-purple-600">
                  <Film className="w-4 h-4 mr-2" />
                  Reel
                </TabsTrigger>
              </TabsList>

              <TabsContent value="image" className="space-y-4">
                <div>
                  <Label htmlFor="image-upload" className="text-white">Upload Image</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </TabsContent>

              <TabsContent value="video" className="space-y-4">
                <div>
                  <Label htmlFor="video-upload" className="text-white">Upload Video</Label>
                  <Input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </TabsContent>

              <TabsContent value="reel" className="space-y-4">
                <div>
                  <Label htmlFor="reel-upload" className="text-white">Upload Reel (30-60s)</Label>
                  <Input
                    id="reel-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleFileSelect}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-sm text-slate-400 mt-1">
                    Reels should be 30-60 seconds long for best engagement
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            {preview && (
              <div className="relative">
                {mediaType === 'image' ? (
                  <img src={preview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
                ) : (
                  <video src={preview} className="w-full h-64 object-cover rounded-lg" controls />
                )}
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={removeMedia}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            <div>
              <Label htmlFor="content" className="text-white">Caption</Label>
              <Textarea
                id="content"
                placeholder="What's on your mind?"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="hashtags" className="text-white">Hashtags</Label>
              <Input
                id="hashtags"
                placeholder="#hashtag1 #hashtag2 #hashtag3"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <Button
              type="submit"
              disabled={uploading}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {uploading ? (
                <>
                  <Upload className="w-4 h-4 mr-2 animate-spin" />
                  Creating Post...
                </>
              ) : (
                'Create Post'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreatePost;
