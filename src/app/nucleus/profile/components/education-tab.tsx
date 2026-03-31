'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { SectionCard } from './section-card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
import { GraduationCap, Building2, BookOpen, Calendar, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface EducationTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

const EducationEntrySchema = z.object({
  institution: z.string().min(1, 'Institution name is required'),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  graduationYear: z.number().int().min(1900).max(2100).optional(),
});

type EducationEntryFormData = z.infer<typeof EducationEntrySchema>;

interface EducationEntry {
  institution: string;
  degree?: string;
  fieldOfStudy?: string;
  graduationYear?: number;
}

export function EducationTab({ profile, userId, onProfileUpdate }: EducationTabProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const form = useForm<EducationEntryFormData>({
    resolver: zodResolver(EducationEntrySchema),
    defaultValues: {
      institution: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: undefined,
    },
  });

  const educationList: EducationEntry[] = profile?.education || [];

  const handleStartEdit = (index: number) => {
    const entry = educationList[index];
    form.reset({
      institution: entry.institution,
      degree: entry.degree || '',
      fieldOfStudy: entry.fieldOfStudy || '',
      graduationYear: entry.graduationYear,
    });
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    form.reset({
      institution: '',
      degree: '',
      fieldOfStudy: '',
      graduationYear: undefined,
    });
    setIsAddingNew(true);
    setEditingIndex(null);
  };

  const handleCancel = () => {
    form.reset();
    setEditingIndex(null);
    setIsAddingNew(false);
    setError(null);
  };

  const handleSave = async () => {
    setError(null);
    const data = form.getValues();

    try {
      const validation = EducationEntrySchema.safeParse(data);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      let updatedEducation = [...educationList];

      if (isAddingNew) {
        // Add new entry
        updatedEducation.push({
          institution: data.institution,
          degree: data.degree || undefined,
          fieldOfStudy: data.fieldOfStudy || undefined,
          graduationYear: data.graduationYear,
        });
      } else if (editingIndex !== null) {
        // Update existing entry
        updatedEducation[editingIndex] = {
          institution: data.institution,
          degree: data.degree || undefined,
          fieldOfStudy: data.fieldOfStudy || undefined,
          graduationYear: data.graduationYear,
        };
      }

      const result = await updateUserProfile(userId, { education: updatedEducation });

      if (result.success) {
        toast({
          title: 'Saved',
          description: isAddingNew ? 'Education entry added successfully' : 'Education entry updated successfully',
        });
        onProfileUpdate();
        handleCancel();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to save education entry');
    }
  };

  const handleDelete = async (index: number) => {
    setError(null);

    try {
      const updatedEducation = educationList.filter((_, i) => i !== index);
      const result = await updateUserProfile(userId, { education: updatedEducation });

      if (result.success) {
        toast({
          title: 'Deleted',
          description: 'Education entry removed successfully',
        });
        onProfileUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to delete education entry');
    }
  };

  /** Shared form fields used in both the "add new" and "edit existing" panels. */
  const EducationFormFields = ({ idSuffix }: { idSuffix: string }) => (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="institution"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Institution *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`institution-${idSuffix}`}
                    placeholder="e.g., University of California, San Francisco"
                    className="pl-10 bg-nex-surface border-cyan/30 text-white"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="degree"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Degree</FormLabel>
                <FormControl>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id={`degree-${idSuffix}`}
                      placeholder="e.g., PharmD"
                      className="pl-10 bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="graduationYear"
            render={() => (
              <FormItem>
                <FormLabel>Graduation Year</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id={`graduationYear-${idSuffix}`}
                      type="number"
                      min="1900"
                      max="2100"
                      {...form.register('graduationYear', {
                        setValueAs: (v) => {
                          if (v === '' || v === null || v === undefined) return undefined;
                          const num = Number(v);
                          return isNaN(num) ? undefined : num;
                        },
                      })}
                      placeholder="e.g., 2020"
                      className="pl-10 bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="fieldOfStudy"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Field of Study</FormLabel>
              <FormControl>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`fieldOfStudy-${idSuffix}`}
                    placeholder="e.g., Pharmacy, Clinical Pharmacy"
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
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-headline font-bold text-cyan-soft">Education</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your educational background</p>
        </div>
        {!isAddingNew && editingIndex === null && (
          <Button
            type="button"
            onClick={handleStartAdd}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Education
          </Button>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Add New Form */}
      {isAddingNew && (
        <SectionCard
          title="Add Education"
          description="Add a new educational institution or degree"
        >
          <div className="space-y-4">
            <EducationFormFields idSuffix="new" />

            <div className="flex gap-2 pt-4 border-t border-cyan/20">
              <Button
                type="button"
                onClick={handleCancel}
                variant="outline"
                className="border-cyan/30"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleSave}
                className="bg-cyan hover:bg-cyan-dark/80"
              >
                Add Education
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Existing Education Entries */}
      {educationList.map((entry, index) => (
        <SectionCard
          key={index}
          title={entry.institution}
          description={[entry.degree, entry.fieldOfStudy].filter(Boolean).join(' • ')}
        >
          {editingIndex === index ? (
            <div className="space-y-4">
              <EducationFormFields idSuffix={String(index)} />

              <div className="flex gap-2 pt-4 border-t border-cyan/20">
                <Button
                  type="button"
                  onClick={handleCancel}
                  variant="outline"
                  className="border-cyan/30"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSave}
                  className="bg-cyan hover:bg-cyan-dark/80"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-cyan/10">
                    <GraduationCap className="h-5 w-5 text-cyan-glow" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Degree</p>
                    <p className="text-sm text-white">
                      {entry.degree || <span className="text-muted-foreground italic">Not specified</span>}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-cyan/10">
                    <Calendar className="h-5 w-5 text-cyan-glow" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Graduation Year</p>
                    <p className="text-sm text-white">
                      {entry.graduationYear || <span className="text-muted-foreground italic">Not specified</span>}
                    </p>
                  </div>
                </div>
              </div>

              {entry.fieldOfStudy && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-cyan/10">
                    <BookOpen className="h-5 w-5 text-cyan-glow" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Field of Study</p>
                    <p className="text-sm text-white">{entry.fieldOfStudy}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 pt-4 border-t border-cyan/20">
                <Button
                  type="button"
                  onClick={() => handleStartEdit(index)}
                  variant="outline"
                  size="sm"
                  className="border-cyan/30 text-cyan-glow"
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  onClick={() => handleDelete(index)}
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </SectionCard>
      ))}

      {/* Empty State */}
      {educationList.length === 0 && !isAddingNew && (
        <div className="text-center py-12 border border-cyan/30 rounded-lg bg-nex-dark">
          <GraduationCap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Education Entries</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your educational background to showcase your qualifications
          </p>
          <Button
            type="button"
            onClick={handleStartAdd}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Education Entry
          </Button>
        </div>
      )}
    </div>
  );
}
