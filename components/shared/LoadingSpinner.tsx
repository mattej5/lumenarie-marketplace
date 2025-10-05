'use client';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'planet' | 'galaxy' | 'simple';
}

export default function LoadingSpinner({ size = 'md', variant = 'planet' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  if (variant === 'simple') {
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full border-4 border-cosmic-200 border-t-cosmic-500 animate-spin"></div>
      </div>
    );
  }

  if (variant === 'galaxy') {
    return (
      <div className={`${sizeClasses[size]} relative`}>
        <div className="absolute inset-0 rounded-full bg-gradient-cosmic opacity-20 animate-pulse-slow"></div>
        <div className="absolute inset-2 rounded-full border-4 border-cosmic-500 border-t-transparent animate-spin"></div>
        <div className="absolute inset-4 rounded-full border-4 border-aurora-500 border-t-transparent animate-spin-slow"></div>
      </div>
    );
  }

  // Planet variant
  return (
    <div className={`${sizeClasses[size]} relative`}>
      {/* Planet */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cosmic-400 to-space-600 animate-spin-slow shadow-cosmic">
        {/* Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[40%] border-2 border-aurora-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160%] h-[50%] border-2 border-starlight-400 rounded-full opacity-40 animate-pulse-slow"></div>
      </div>
      {/* Orbiting moon */}
      <div className="absolute top-0 left-1/2 w-2 h-2 rounded-full bg-starlight-400 shadow-starlight animate-[orbit_3s_linear_infinite]"></div>
    </div>
  );
}
