'use client';

import Image from 'next/image';
import {
  RefreshCw,
  Image as ImageIcon,
  Check,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export interface MediaCardProps {
  id: string;
  title: string;
  type: string;
  image: string | null;
  imageAlt?: string | null;
  isRegenerating: boolean;
  onRegenerate: () => void;
}

export function MediaCard({ id: _id, title, type, image, imageAlt, isRegenerating, onRegenerate }: MediaCardProps) {
  return (
    <Card className={`bg-nex-surface border-nex-light ${!image ? 'border-amber-500/30' : ''}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize text-xs">
            {type}
          </Badge>
          {image ? (
            <Check className="h-4 w-4 text-green-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-amber-400" />
          )}
        </div>
        <CardTitle className="text-sm text-white line-clamp-2">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative aspect-video bg-nex-dark rounded-lg overflow-hidden mb-3">
          {image ? (
            <Image src={image} alt={imageAlt || title} fill className="object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full">
              <ImageIcon className="h-10 w-10 text-slate-dim/50" />
            </div>
          )}
        </div>
        <Button
          onClick={onRegenerate}
          disabled={isRegenerating}
          variant={image ? 'outline' : 'default'}
          size="sm"
          className="w-full"
        >
          {isRegenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              {image ? <RefreshCw className="h-4 w-4 mr-2" /> : <ImageIcon className="h-4 w-4 mr-2" />}
              {image ? 'Regenerate' : 'Generate'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
