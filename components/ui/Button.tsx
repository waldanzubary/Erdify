'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'subtle' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
    children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
        const variants = {
            primary: 'bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] shadow-glow',
            secondary: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] border border-[var(--border)]',
            outline: 'bg-transparent text-[var(--text-primary)] border border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface)]',
            subtle: 'bg-[var(--accent-muted)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white',
            ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
            danger: 'bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20',
        };

        const sizes = {
            sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
            md: 'text-sm px-4 py-2.5 h-10 gap-2',
            lg: 'text-base px-6 py-3 h-12 gap-2.5',
        };

        return (
            <motion.button
                ref={ref}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className={`
                    inline-flex items-center justify-center font-medium transition-colors rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] 
                    disabled:opacity-50 disabled:pointer-events-none select-none
                    ${variants[variant]} ${sizes[size]} ${className}
                `}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && (
                    <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                )}
                {children}
            </motion.button>
        );
    }
);

Button.displayName = 'Button';
export default Button;
