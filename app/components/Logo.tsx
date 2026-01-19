'use client';

import Link from 'next/link';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
  hideTrainer?: boolean;
}

export default function Logo({ size = 'medium', className = '', hideTrainer = false }: LogoProps) {
  const sizeClasses = {
    small: { articles: 'text-lg', trainer: 'text-xl', gap: 'gap-1.5' },
    medium: { articles: 'text-2xl', trainer: 'text-3xl', gap: 'gap-2' },
    large: { articles: 'text-3xl', trainer: 'text-4xl', gap: 'gap-2.5' },
  };

  const currentSize = sizeClasses[size];

  return (
    <Link 
      href="/" 
      className={`flex items-center ${currentSize.gap} ${className} cursor-pointer hover:opacity-80 transition-opacity`}
    >
      <div className={`flex items-baseline font-bold`}>
        <span 
          className={`${currentSize.articles} font-extrabold`}
          style={{ 
            color: '#3b82f6',
            textShadow: '0 1px 2px rgba(59, 130, 246, 0.3)',
          }}
        >
          Der
        </span>
        <span 
          className={`${currentSize.articles} font-extrabold`}
          style={{ 
            color: '#ec4899',
            textShadow: '0 1px 2px rgba(236, 72, 153, 0.3)',
          }}
        >
          Die
        </span>
        <span 
          className={`${currentSize.articles} font-extrabold`}
          style={{ 
            color: '#22c55e',
            textShadow: '0 1px 2px rgba(34, 197, 94, 0.3)',
          }}
        >
          Das
        </span>
      </div>
      {!hideTrainer && (
        <span 
          className={`${currentSize.trainer} font-bold`}
          style={{ 
            background: 'linear-gradient(135deg, #a78bfa 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            letterSpacing: '-0.02em',
          }}
        >
          Trainer
        </span>
      )}
    </Link>
  );
}
