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
            color: '#2563eb',
            textShadow: '0 1px 2px rgba(37, 99, 235, 0.2)',
          }}
        >
          Der
        </span>
        <span 
          className={`${currentSize.articles} font-extrabold`}
          style={{ 
            color: '#db2777',
            textShadow: '0 1px 2px rgba(219, 39, 119, 0.2)',
          }}
        >
          Die
        </span>
        <span 
          className={`${currentSize.articles} font-extrabold`}
          style={{ 
            color: '#16a34a',
            textShadow: '0 1px 2px rgba(22, 163, 74, 0.2)',
          }}
        >
          Das
        </span>
      </div>
      {!hideTrainer && (
        <span 
          className={`${currentSize.trainer} font-bold`}
          style={{ 
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
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
