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
import { Award, Building2, Calendar, Hash, Trash2, Plus, AlertCircle } from 'lucide-react';
import type { UserProfile } from '@/lib/schemas/firestore';

interface CredentialsTabProps {
  profile: UserProfile | null;
  userId: string;
  onProfileUpdate: () => void;
}

const CredentialEntrySchema = z.object({
  name: z.string().min(1, 'Credential name is required'),
  issuingOrganization: z.string().optional(),
  issueDate: z.string().optional(),
  credentialId: z.string().optional(),
});

type CredentialEntryFormData = z.infer<typeof CredentialEntrySchema>;

interface CredentialEntry {
  name: string;
  issuingOrganization?: string;
  issueDate?: string;
  credentialId?: string;
}

export function CredentialsTab({ profile, userId, onProfileUpdate }: CredentialsTabProps) {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const form = useForm<CredentialEntryFormData>({
    resolver: zodResolver(CredentialEntrySchema),
    defaultValues: {
      name: '',
      issuingOrganization: '',
      issueDate: '',
      credentialId: '',
    },
  });

  const credentialsList: CredentialEntry[] = profile?.credentials || [];

  const handleStartEdit = (index: number) => {
    const entry = credentialsList[index];
    form.reset({
      name: entry.name,
      issuingOrganization: entry.issuingOrganization || '',
      issueDate: entry.issueDate || '',
      credentialId: entry.credentialId || '',
    });
    setEditingIndex(index);
    setIsAddingNew(false);
  };

  const handleStartAdd = () => {
    form.reset({
      name: '',
      issuingOrganization: '',
      issueDate: '',
      credentialId: '',
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
      const validation = CredentialEntrySchema.safeParse(data);
      if (!validation.success) {
        setError(validation.error.errors[0].message);
        return;
      }

      let updatedCredentials = [...credentialsList];

      if (isAddingNew) {
        // Add new entry
        updatedCredentials.push({
          name: data.name,
          issuingOrganization: data.issuingOrganization || undefined,
          issueDate: data.issueDate || undefined,
          credentialId: data.credentialId || undefined,
        });
      } else if (editingIndex !== null) {
        // Update existing entry
        updatedCredentials[editingIndex] = {
          name: data.name,
          issuingOrganization: data.issuingOrganization || undefined,
          issueDate: data.issueDate || undefined,
          credentialId: data.credentialId || undefined,
        };
      }

      const result = await updateUserProfile(userId, { credentials: updatedCredentials });

      if (result.success) {
        toast({
          title: 'Saved',
          description: isAddingNew ? 'Credential added successfully' : 'Credential updated successfully',
        });
        onProfileUpdate();
        handleCancel();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to save credential');
    }
  };

  const handleDelete = async (index: number) => {
    setError(null);

    try {
      const updatedCredentials = credentialsList.filter((_, i) => i !== index);
      const result = await updateUserProfile(userId, { credentials: updatedCredentials });

      if (result.success) {
        toast({
          title: 'Deleted',
          description: 'Credential removed successfully',
        });
        onProfileUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to delete credential');
    }
  };

  /** Shared form fields used in both the "add new" and "edit existing" panels. */
  const CredentialFormFields = ({ idSuffix }: { idSuffix: string }) => (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Credential Name *</FormLabel>
              <FormControl>
                <div className="relative">
                  <Award className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`name-${idSuffix}`}
                    placeholder="e.g., Board Certified Pharmacotherapy Specialist (BCPS)"
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
          name="issuingOrganization"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Issuing Organization</FormLabel>
              <FormControl>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...field}
                    id={`issuingOrganization-${idSuffix}`}
                    placeholder="e.g., Board of Pharmacy Specialties"
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
            name="issueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Issue Date</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id={`issueDate-${idSuffix}`}
                      type="month"
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
            name="credentialId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Credential ID</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      {...field}
                      id={`credentialId-${idSuffix}`}
                      placeholder="e.g., BCPS-123456"
                      className="pl-10 bg-nex-surface border-cyan/30 text-white"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </Form>
  );

  return (
    <div className="space-y-6">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-headline font-bold text-cyan-soft">Credentials & Certifications</h3>
          <p className="text-sm text-muted-foreground mt-1">Manage your professional credentials and certifications</p>
        </div>
        {!isAddingNew && editingIndex === null && (
          <Button
            type="button"
            onClick={handleStartAdd}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
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
          title="Add Credential"
          description="Add a new professional credential or certification"
        >
          <div className="space-y-4">
            <CredentialFormFields idSuffix="new" />

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
                Add Credential
              </Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* Existing Credential Entries */}
      {credentialsList.map((entry, index) => (
        <SectionCard
          key={index}
          title={entry.name}
          description={entry.issuingOrganization}
        >
          {editingIndex === index ? (
            <div className="space-y-4">
              <CredentialFormFields idSuffix={String(index)} />

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
                {entry.issueDate && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-cyan/10">
                      <Calendar className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Issue Date</p>
                      <p className="text-sm text-white">{entry.issueDate}</p>
                    </div>
                  </div>
                )}

                {entry.credentialId && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-cyan/10">
                      <Hash className="h-5 w-5 text-cyan-glow" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Credential ID</p>
                      <p className="text-sm text-white font-mono">{entry.credentialId}</p>
                    </div>
                  </div>
                )}
              </div>

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
      {credentialsList.length === 0 && !isAddingNew && (
        <div className="text-center py-12 border border-cyan/30 rounded-lg bg-nex-dark">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Credentials</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add your professional credentials and certifications to showcase your expertise
          </p>
          <Button
            type="button"
            onClick={handleStartAdd}
            className="bg-cyan hover:bg-cyan-dark/80"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Credential
          </Button>
        </div>
      )}
    </div>
  );
}
