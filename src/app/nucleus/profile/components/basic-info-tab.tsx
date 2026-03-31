'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard } from './section-card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { updateUserProfile } from '@/lib/actions/users';
import { User, Mail, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface BasicInfoTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

const BasicInfoSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  location: z.string().max(100).optional(),
});

type BasicInfoFormData = z.infer<typeof BasicInfoSchema>;

export function BasicInfoTab({ profile, userId, onProfileUpdate }: BasicInfoTabProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BasicInfoFormData>({
    resolver: zodResolver(BasicInfoSchema),
    defaultValues: {
      name: profile?.name || '',
      location: profile?.location || '',
    },
  });

  const handleSave = async () => {
    setError(null);
    const data = form.getValues();

    try {
      const result = await updateUserProfile(userId, {
        name: data.name,
        location: data.location,
      });

      if (result.success) {
        toast({
          title: 'Saved',
          description: 'Basic information updated successfully',
        });
        onProfileUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update basic information');
    }
  };

  const handleCancel = () => {
    form.reset({
      name: profile?.name || '',
      location: profile?.location || '',
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Display Name */}
      <SectionCard
        title="Display Name"
        description="Your name as it appears across the platform"
        onSave={handleSave}
        onCancel={handleCancel}
        editContent={
          <Form {...form}>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="Your full name"
                          className="pl-10 bg-nex-surface border-cyan/30 text-white"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan/10">
            <User className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Full Name</p>
            <p className="text-lg font-medium text-white">{profile?.name || 'Not set'}</p>
          </div>
        </div>
      </SectionCard>

      {/* Email Address */}
      <SectionCard
        title="Email Address"
        description="Your account email address"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-cyan/10">
              <Mail className="h-5 w-5 text-cyan-glow" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-medium text-white">{profile?.email}</p>
            </div>
            {user?.emailVerified ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm">Verified</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-nex-gold-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Unverified</span>
              </div>
            )}
          </div>
          <Alert className="bg-nex-surface border-cyan/20">
            <AlertDescription className="text-xs text-muted-foreground">
              To change your email address, visit the <strong>Account & Security</strong> tab
            </AlertDescription>
          </Alert>
        </div>
      </SectionCard>

      {/* Location */}
      <SectionCard
        title="Location"
        description="Your city, state, or country"
        onSave={handleSave}
        onCancel={handleCancel}
        editContent={
          <Form {...form}>
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="e.g., San Francisco, CA"
                          className="pl-10 bg-nex-surface border-cyan/30 text-white"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        }
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-cyan/10">
            <MapPin className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Location</p>
            <p className="text-lg font-medium text-white">
              {profile?.location || <span className="text-muted-foreground italic">Not set</span>}
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
