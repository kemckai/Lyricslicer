import { Music2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Music2 className="h-6 w-6 text-primary" />
      <h1 className="font-headline text-2xl font-bold text-primary">
        LyricSlice
      </h1>
    </div>
  );
}
