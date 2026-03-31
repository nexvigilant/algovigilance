'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard } from './section-card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { updateUserProfile } from '@/lib/actions/users';
import { Briefcase, FileText, Building2, Calendar, Linkedin, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface ProfessionalTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

const ProfessionalInfoSchema = z.object({
  professionalTitle: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  currentEmployer: z.string().max(100).optional(),
  yearsOfExperience: z.number().int().min(0).max(70).optional(),
  linkedInProfile: z.union([z.string().url('Must be a valid URL'), z.literal(''), z.undefined()]).optional(),
});

type ProfessionalInfoFormData = z.infer<typeof ProfessionalInfoSchema>;

export function ProfessionalTab({ profile, userId, onProfileUpdate }: ProfessionalTabProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ProfessionalInfoFormData>({
    resolver: zodResolver(ProfessionalInfoSchema),
    defaultValues: {
      professionalTitle: profile?.professionalTitle || '',
      bio: profile?.bio || '',
      currentEmployer: profile?.currentEmployer || '',
      yearsOfExperience: profile?.yearsOfExperience || undefined,
      linkedInProfile: profile?.linkedInProfile || '',
    },
  });

  const handleSave = async () => {
    setError(null);
    const data = form.getValues();

    try {
      const result = await updateUserProfile(userId, {
        professionalTitle: data.professionalTitle,
        bio: data.bio,
        currentEmployer: data.currentEmployer,
        yearsOfExperience: data.yearsOfExperience,
        linkedInProfile: data.linkedInProfile || undefined,
      });

      if (result.success) {
        toast({
          title: 'Saved',
          description: 'Professional profile updated successfully',
        });
        onProfileUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to update professional profile');
    }
  };

  const handleCancel = () => {
    form.reset({
      professionalTitle: profile?.professionalTitle || '',
      bio: profile?.bio || '',
      currentEmployer: profile?.currentEmployer || '',
      yearsOfExperience: profile?.yearsOfExperience || undefined,
      linkedInProfile: profile?.linkedInProfile || '',
    });
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Professional Title */}
      <SectionCard
        title="Professional Title"
        description="Your current job title or professional designation"
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
                name="professionalTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="e.g., Clinical Pharmacist"
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
            <Briefcase className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Title</p>
            <p className="text-lg font-medium text-white">
              {profile?.professionalTitle || <span className="text-muted-foreground italic">Not set</span>}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Professional Bio */}
      <SectionCard
        title="Professional Bio"
        description="A brief summary of your professional background (max 500 characters)"
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
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Tell us about your professional experience and expertise..."
                        className="min-h-[120px] bg-nex-surface border-cyan/30 text-white"
                        maxLength={500}
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground text-right">
                      {form.watch('bio')?.length ?? 0} / 500 characters
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Form>
        }
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-cyan/10 flex-shrink-0">
            <FileText className="h-5 w-5 text-cyan-glow" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Bio</p>
            {profile?.bio ? (
              <p className="text-sm text-white whitespace-pre-wrap">{profile.bio}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not set</p>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Current Employer */}
      <SectionCard
        title="Current Employer"
        description="The organization you currently work for"
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
                name="currentEmployer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employer</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="e.g., UCSF Medical Center"
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
            <Building2 className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Employer</p>
            <p className="text-lg font-medium text-white">
              {profile?.currentEmployer || <span className="text-muted-foreground italic">Not set</span>}
            </p>
          </div>
        </div>
      </SectionCard>

      {/* Years of Experience */}
      <SectionCard
        title="Years of Experience"
        description="Total years of professional experience"
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
                name="yearsOfExperience"
                render={() => (
                  <FormItem>
                    <FormLabel>Years</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="yearsOfExperience"
                          type="number"
                          min="0"
                          max="70"
                          {...form.register('yearsOfExperience', {
                            setValueAs: (v) => {
                              if (v === '' || v === null || v === undefined) return undefined;
                              const num = Number(v);
                              return isNaN(num) ? undefined : num;
                            },
                          })}
                          placeholder="e.g., 5"
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
            <Calendar className="h-5 w-5 text-cyan-glow" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Experience</p>
            <p className="text-lg font-medium text-white">
              {profile?.yearsOfExperience !== undefined && profile?.yearsOfExperience !== null
                ? `${profile.yearsOfExperience} ${profile.yearsOfExperience === 1 ? 'year' : 'years'}`
                : <span className="text-muted-foreground italic">Not set</span>
              }
            </p>
          </div>
        </div>
      </SectionCard>

      {/* LinkedIn Profile */}
      <SectionCard
        title="LinkedIn Profile"
        description="Link to your LinkedIn profile"
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
                name="linkedInProfile"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://linkedin.com/in/yourprofile"
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
            <Linkedin className="h-5 w-5 text-cyan-glow" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground mb-1">LinkedIn</p>
            {profile?.linkedInProfile ? (
              <a
                href={profile.linkedInProfile}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-cyan-glow hover:text-cyan-soft underline truncate block"
              >
                {profile.linkedInProfile}
              </a>
            ) : (
              <p className="text-sm text-muted-foreground italic">Not set</p>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
