
import { useState, useEffect } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { profileAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader, User, Save } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Please enter a valid email address' }).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url({ message: 'Please enter a valid URL' }).optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const ProfilePage = () => {
  const { user, updateUserData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileAPI.getProfile();
        
        form.reset({
          name: data.name || '',
          email: data.email || '',
          bio: data.bio || '',
          avatarUrl: data.avatarUrl || '',
        });
        
        updateUserData(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [form, updateUserData]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const updatedProfile = await profileAPI.updateProfile(values);
      updateUserData(updatedProfile);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6 flex items-center justify-center min-h-[80vh]">
          <div className="text-center">
            <Loader className="h-8 w-8 animate-spin text-paws-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your profile details and avatar
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {/* Avatar */}
                <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
                  <div className="flex flex-col items-center">
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={form.watch('avatarUrl')} alt={form.watch('name')} />
                      <AvatarFallback className="text-2xl bg-paws-primary/20 text-paws-primary">
                        {form.watch('name')?.charAt(0)?.toUpperCase() || <User />}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  
                  <div className="flex-1 space-y-4">
                    <FormField
                      control={form.control}
                      name="avatarUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avatar URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/avatar.jpg" {...field} />
                          </FormControl>
                          <FormDescription>
                            Enter the URL of your profile picture
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Personal Info */}
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input disabled {...field} />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Bio */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us a bit about yourself..." 
                          className="min-h-24" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Write a short bio that will be displayed on your public profile
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              
              <CardFooter>
                <Button 
                  type="submit" 
                  className="bg-paws-primary hover:bg-paws-accent"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
      </div>
    </AppLayout>
  );
};

export default ProfilePage;
