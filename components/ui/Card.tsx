import { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    variant?: 'default' | 'feature';
    glass?: boolean;
    hover?: boolean;
}

export default function Card({
    children,
    className = '',
    variant = 'default',
    glass = false,
    hover = false
}: CardProps) {
    const baseClass = variant === 'feature' ? 'feature-card' : 'bg-[var(--bg-secondary)] border border-[var(--border)] rounded-xl';
    const glassClass = glass ? 'glass' : '';
    const hoverClass = hover && variant !== 'feature'
        ? 'transition-all duration-300 hover:border-[var(--border-hover)] hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5'
        : '';

    return (
        <div className={`${baseClass} ${glassClass} ${hoverClass} ${className}`}>
            {children}
        </div>
    );
}
