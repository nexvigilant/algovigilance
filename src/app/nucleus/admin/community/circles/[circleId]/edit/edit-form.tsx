'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { customToast } from '@/components/voice';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { SmartForum } from '@/types/community';
import { updateCircleAdmin } from '@/app/nucleus/admin/community/actions';
import { useActivityOrchestration } from '@/app/nucleus/community/hooks';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.string().min(1, 'Category is required'),
  tags: z.string().min(1, 'Tags are required'),
  type: z.enum(['public', 'semi-private', 'private']),
  status: z.enum(['active', 'archived', 'draft']),
  joinType: z.enum(['open', 'request', 'invite-only']),
  requiredPathway: z.string().optional(),
  minProgress: z.number().min(0).max(100).default(0),
});

interface EditCircleFormProps {
  circle: SmartForum;
}

export function EditCircleForm({ circle }: EditCircleFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { trackActivity } = useActivityOrchestration();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: circle.name,
      description: circle.description,
      category: circle.category,
      tags: circle.tags?.join(', ') || '',
      type: circle.type || 'public',
      status: circle.status || 'active',
      joinType: circle.membership?.joinType || 'open',
      requiredPathway: circle.metadata?.requiredPathway || '',
      minProgress: circle.metadata?.minProgress || 0,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    try {
      // 1. Log Admin Action (Activity Orchestrator)
      await trackActivity({
        type: 'profile_updated', // Using as proxy for config update
        metadata: {
          action: 'circle_config_update',
          circleId: circle.id,
          changes: values
        }
      });

      const result = await updateCircleAdmin(circle.id, {
        name: values.name,
        description: values.description,
        category: values.category,
        tags: values.tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        type: values.type,
        status: values.status,
        membership: {
          ...circle.membership,
          joinType: values.joinType,
        },
        metadata: {
          ...circle.metadata,
          requiredPathway: values.requiredPathway,
          minProgress: values.minProgress,
        }
      });

      if (result.success) {
        customToast.success('Circle updated successfully');
        router.push('/nucleus/admin/community/circles');
        router.refresh();
      } else {
        customToast.error(result.error || 'Failed to update circle');
      }
    } catch (error) {
      customToast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/nucleus/admin/community/circles">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit Circle</h1>
          <p className="text-muted-foreground">
            Update details for {circle.name}
          </p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Circle name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Regulatory Affairs" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the purpose of this circle"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem className="col-span-2">
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Comma separated tags (e.g. pharma, safety, regulations)"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Separate tags with commas</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Visibility</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select visibility" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="semi-private">Members Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="joinType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Join Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select join type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="request">Request to Join</SelectItem>
                      <SelectItem value="invite-only">Invite Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-lg border-2 border-gold/20 bg-gold/5 p-6 space-y-6">
            <h2 className="text-lg font-bold text-gold flex items-center gap-2">
              🛡️ Capability Gating
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="requiredPathway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Required Capability Pathway</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. regulatory-foundation" {...field} />
                    </FormControl>
                    <FormDescription>Slug of the pathway required for access</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="minProgress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Progress %</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>Required completion percentage (0-100)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
