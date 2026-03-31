'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, FileText, Video, Wrench, BookOpen } from 'lucide-react';
import type { KSBResource } from '@/types/pv-curriculum';

interface ResourceEditorProps {
  resources: KSBResource[];
  onChange: (resources: KSBResource[]) => void;
}

const resourceTypes = [
  { value: 'article', label: 'Article', icon: FileText },
  { value: 'video', label: 'Video', icon: Video },
  { value: 'document', label: 'Document', icon: FileText },
  { value: 'tool', label: 'Tool', icon: Wrench },
  { value: 'reference', label: 'Reference', icon: BookOpen },
];

export function ResourceEditor({ resources, onChange }: ResourceEditorProps) {
  const addResource = () => {
    onChange([
      ...resources,
      {
        title: '',
        url: '',
        type: 'article',
      },
    ]);
  };

  const updateResource = (index: number, updates: Partial<KSBResource>) => {
    const newResources = [...resources];
    newResources[index] = { ...newResources[index], ...updates };
    onChange(newResources);
  };

  const removeResource = (index: number) => {
    onChange(resources.filter((_, i) => i !== index));
  };

  const isValidUrl = (url: string) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getResourceIcon = (type: string) => {
    const resourceType = resourceTypes.find((r) => r.value === type);
    if (resourceType) {
      const Icon = resourceType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">Resources ({resources.length})</CardTitle>
        <Button onClick={addResource} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Resource
        </Button>
      </CardHeader>
      <CardContent>
        {resources.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No resources added. Click &quot;Add Resource&quot; to include helpful materials.
          </p>
        ) : (
          <div className="space-y-4">
            {resources.map((resource, index) => (
              <div key={index} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getResourceIcon(resource.type)}
                    <Badge variant="outline" className="capitalize">
                      {resource.type}
                    </Badge>
                  </div>
                  <Button
                    onClick={() => removeResource(index)}
                    size="sm"
                    variant="ghost"
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Title</Label>
                    <Input
                      value={resource.title}
                      onChange={(e) => updateResource(index, { title: e.target.value })}
                      placeholder="Resource title"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Type</Label>
                    <Select
                      value={resource.type}
                      onValueChange={(value) =>
                        updateResource(index, { type: value as KSBResource['type'] })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {resourceTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={resource.url}
                      onChange={(e) => updateResource(index, { url: e.target.value })}
                      placeholder="https://..."
                      className={!isValidUrl(resource.url) ? 'border-red-500' : ''}
                    />
                    {resource.url && isValidUrl(resource.url) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(resource.url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {!isValidUrl(resource.url) && (
                    <p className="text-xs text-red-500">Please enter a valid URL</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ResourceEditor;
