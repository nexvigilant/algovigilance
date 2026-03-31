import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';

interface ServiceCardProps {
  service: {
    image?: {
      imageUrl: string;
      description: string;
      imageHint: string;
    };
    title: string;
    description: string;
    href: string;
    status: string;
  };
}

export function ServiceCard({ service }: ServiceCardProps) {
  if (!service.image) return null;

  const isActive = service.status === 'active';

  const cardContent = (
    <Card className="holographic-card overflow-hidden bg-nex-surface border-nex-light shadow-lg h-full">
      <CardContent className="p-0 relative z-10">
        <div className="relative aspect-video">
          <Image
            src={service.image.imageUrl}
            alt={service.image.description}
            fill
            className="object-cover"
            data-ai-hint={service.image.imageHint}
          />
          {!isActive && (
            <div className="absolute inset-0 bg-nex-deep/80 backdrop-blur-sm flex items-center justify-center">
              <div className="bg-gold text-nex-deep px-4 py-2 rounded-full font-semibold text-sm">
                {service.status}
              </div>
            </div>
          )}
        </div>
        <div className="p-6">
          <h3 className="font-semibold text-lg text-slate-light">{service.title}</h3>
          <p className="mt-2 text-sm text-slate-dim">{service.description}</p>
        </div>
      </CardContent>
    </Card>
  );

  if (isActive) {
    return <Link href={service.href}>{cardContent}</Link>;
  }

  return (
    <div
      role="article"
      aria-label={`${service.title} - ${service.status}`}
      className="cursor-not-allowed"
    >
      {cardContent}
    </div>
  );
}
