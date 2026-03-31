'use client';

import { useState, useEffect, useTransition } from 'react';
import { Plus, Edit, Trash2, Tag, Award, Target, Loader2, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { Skill } from '@/types/academy';
import {
  getSkills,
  createSkill,
  updateSkill,
  deleteSkill,
  seedSkills,
} from './actions';

import { logger } from '@/lib/logger';
const log = logger.scope('skills/page');

export default function SkillsManagementPage() {
  const { toast } = useToast();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'technical' as Skill['category'],
    industryStandard: false,
    associatedRoles: '',
  });

  // Fetch skills on mount
  useEffect(() => {
    fetchSkills();
  }, []);

  async function fetchSkills() {
    setIsLoading(true);
    try {
      const result = await getSkills();
      if (result.success && result.skills) {
        setSkills(result.skills);
      } else {
        toast({ title: result.error || 'Failed to load skills', variant: 'destructive' });
      }
    } catch (error) {
      log.error('Error fetching skills:', error);
      toast({ title: 'Failed to load skills', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreateSkill() {
    startTransition(async () => {
      try {
        const result = await createSkill({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          industryStandard: formData.industryStandard,
          associatedRoles: formData.associatedRoles
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        });

        if (result.success) {
          toast({ title: 'Skill created successfully', variant: 'success' });
          setIsCreateDialogOpen(false);
          resetForm();
          fetchSkills();
        } else {
          toast({ title: result.error || 'Failed to create skill', variant: 'destructive' });
        }
      } catch (error) {
        log.error('Error creating skill:', error);
        toast({ title: 'Failed to create skill', variant: 'destructive' });
      }
    });
  }

  function handleEditSkill() {
    if (!editingSkill) return;

    startTransition(async () => {
      try {
        const result = await updateSkill(editingSkill.id, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          industryStandard: formData.industryStandard,
          associatedRoles: formData.associatedRoles
            .split(',')
            .map((r) => r.trim())
            .filter(Boolean),
        });

        if (result.success) {
          toast({ title: 'Skill updated successfully', variant: 'success' });
          setEditingSkill(null);
          resetForm();
          fetchSkills();
        } else {
          toast({ title: result.error || 'Failed to update skill', variant: 'destructive' });
        }
      } catch (error) {
        log.error('Error updating skill:', error);
        toast({ title: 'Failed to update skill', variant: 'destructive' });
      }
    });
  }

  function handleDeleteSkill() {
    if (!deletingSkillId) return;

    startTransition(async () => {
      try {
        const result = await deleteSkill(deletingSkillId);

        if (result.success) {
          toast({ title: 'Skill deleted successfully', variant: 'success' });
          setDeletingSkillId(null);
          fetchSkills();
        } else {
          toast({ title: result.error || 'Failed to delete skill', variant: 'destructive' });
        }
      } catch (error) {
        log.error('Error deleting skill:', error);
        toast({ title: 'Failed to delete skill', variant: 'destructive' });
      }
    });
  }

  function handleSeedSkills() {
    startTransition(async () => {
      try {
        const result = await seedSkills();

        if (result.success) {
          toast({ title: `Loaded ${result.count} pharmaceutical skills`, variant: 'success' });
          fetchSkills();
        } else {
          toast({ title: result.error || 'Failed to load skills', variant: 'destructive' });
        }
      } catch (error) {
        log.error('Error seeding skills:', error);
        toast({ title: 'Failed to load skills', variant: 'destructive' });
      }
    });
  }

  function openEditDialog(skill: Skill) {
    setFormData({
      name: skill.name,
      description: skill.description,
      category: skill.category,
      industryStandard: skill.industryStandard || false,
      associatedRoles: skill.associatedRoles?.join(', ') || '',
    });
    setEditingSkill(skill);
  }

  function resetForm() {
    setFormData({
      name: '',
      description: '',
      category: 'technical',
      industryStandard: false,
      associatedRoles: '',
    });
  }

  const filteredSkills = skills.filter(
    (skill) => categoryFilter === 'all' || skill.category === categoryFilter
  );

  function getCategoryBadge(category: Skill['category']) {
    const colors = {
      technical: 'bg-blue-500/20 text-blue-500',
      regulatory: 'bg-purple-500/20 text-purple-500',
      clinical: 'bg-green-500/20 text-green-500',
      business: 'bg-yellow-500/20 text-yellow-500',
      'soft-skill': 'bg-pink-500/20 text-pink-500',
    };
    return colors[category];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold font-headline mb-2 text-gold">Skills Management</h1>
          <p className="text-slate-dim">
            Manage pharmaceutical industry skills taxonomy and capability tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => fetchSkills()} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleSeedSkills} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Award className="h-4 w-4 mr-2" />
            )}
            Load Industry Skills
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Skill
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Skill</DialogTitle>
                <DialogDescription>Add a new skill to the taxonomy</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Skill Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Pharmacovigilance"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe this skill..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value as Skill['category'] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="regulatory">Regulatory</SelectItem>
                      <SelectItem value="clinical">Clinical</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="soft-skill">Soft Skill</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roles">Associated Roles (comma-separated)</Label>
                  <Input
                    id="roles"
                    value={formData.associatedRoles}
                    onChange={(e) => setFormData({ ...formData, associatedRoles: e.target.value })}
                    placeholder="e.g., Drug Safety Specialist, PV Associate"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="industryStandard"
                    checked={formData.industryStandard}
                    onChange={(e) =>
                      setFormData({ ...formData, industryStandard: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="industryStandard" className="font-normal">
                    Industry Standard Skill
                  </Label>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSkill} disabled={isPending || !formData.name}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Skill
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4 text-slate-dim" />
              <div className="text-2xl font-bold">{skills.length}</div>
            </div>
            <p className="text-sm text-slate-dim">Total Skills</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Award className="h-4 w-4 text-slate-dim" />
              <div className="text-2xl font-bold">
                {skills.filter((s) => s.industryStandard).length}
              </div>
            </div>
            <p className="text-sm text-slate-dim">Industry Standard</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="h-4 w-4 text-slate-dim" />
              <div className="text-2xl font-bold">5</div>
            </div>
            <p className="text-sm text-slate-dim">Categories</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="regulatory">Regulatory</SelectItem>
                <SelectItem value="clinical">Clinical</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="soft-skill">Soft Skills</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-cyan" />
          <span className="ml-2 text-slate-dim">Loading skills...</span>
        </div>
      ) : filteredSkills.length === 0 ? (
        <Card className="py-12">
          <CardContent className="text-center">
            <Tag className="h-12 w-12 mx-auto mb-4 text-slate-dim" />
            <h3 className="text-lg font-medium mb-2">No skills found</h3>
            <p className="text-slate-dim mb-4">
              {categoryFilter !== 'all'
                ? 'No skills in this category. Try a different filter.'
                : 'Get started by loading pharmaceutical skills or creating your own.'}
            </p>
            {categoryFilter === 'all' && (
              <Button onClick={handleSeedSkills} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Award className="h-4 w-4 mr-2" />
                )}
                Load Industry Skills
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        /* Skills List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSkills.map((skill) => (
            <Card
              key={skill.id}
              className="bg-nex-surface border border-nex-light hover:border-cyan/50 hover:shadow-card-hover transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-slate-light">{skill.name}</CardTitle>
                    <CardDescription className="mt-1 text-slate-dim">
                      {skill.description}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(skill)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeletingSkillId(skill.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Badge className={getCategoryBadge(skill.category)}>{skill.category}</Badge>
                    {skill.industryStandard && (
                      <Badge variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Industry Standard
                      </Badge>
                    )}
                  </div>

                  {skill.associatedRoles && skill.associatedRoles.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-slate-dim mb-1">Associated Roles:</p>
                      <div className="flex flex-wrap gap-1">
                        {skill.associatedRoles.slice(0, 2).map((role, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {role}
                          </Badge>
                        ))}
                        {skill.associatedRoles.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{skill.associatedRoles.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingSkill} onOpenChange={(open) => !open && setEditingSkill(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Skill</DialogTitle>
            <DialogDescription>Update the skill details</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Skill Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value as Skill['category'] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="regulatory">Regulatory</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                  <SelectItem value="soft-skill">Soft Skill</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-roles">Associated Roles (comma-separated)</Label>
              <Input
                id="edit-roles"
                value={formData.associatedRoles}
                onChange={(e) => setFormData({ ...formData, associatedRoles: e.target.value })}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-industryStandard"
                checked={formData.industryStandard}
                onChange={(e) => setFormData({ ...formData, industryStandard: e.target.checked })}
                className="rounded border-gray-300"
              />
              <Label htmlFor="edit-industryStandard" className="font-normal">
                Industry Standard Skill
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSkill(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditSkill} disabled={isPending || !formData.name}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingSkillId} onOpenChange={(open) => !open && setDeletingSkillId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Skill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this skill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSkill}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
