'use client';

interface CircuitTraceGroupProps {
  id: string;
  isActive: boolean;
  paths: Array<{
    d: string;
    variant: 'gold' | 'copper';
    width?: string;
  }>;
}

export function CircuitTraceGroup({
  isActive,
  paths
}: CircuitTraceGroupProps) {
  return (
    <g
      filter={isActive ? 'url(#traceGlowActive)' : 'url(#traceGlow)'}
      style={{
        transition: 'filter 0.3s ease',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      {paths.map((path, idx) => (
        <path
          key={idx}
          d={path.d}
          stroke={path.variant === 'gold' ? 'url(#goldGradient)' : 'url(#copperGradient)'}
          strokeWidth={path.width || (path.variant === 'gold' ? '1.5' : '1')}
          fill="none"
        />
      ))}
    </g>
  );
}
