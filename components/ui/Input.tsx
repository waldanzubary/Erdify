'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    helper?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, helper, id, ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5 w-full">
                {label && (
                    <label
                        htmlFor={id}
                        className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider ml-1"
                    >
                        {label}
                    </label>
                )}
                <div className="relative group">
                    <input
                        ref={ref}
                        id={id}
                        className={`
                            w-full px-4 py-2.5 rounded-lg bg-[var(--bg-secondary)] border text-[var(--text-primary)] 
                            placeholder:text-[var(--text-muted)] transition-all duration-200 
                            outline-none focus:ring-2 focus:ring-[var(--accent)]/20 focus:border-[var(--accent)]
                            ${error ? 'border-red-500/50' : 'border-[var(--border)] group-hover:border-[var(--border-hover)]'} 
                            ${className}
                        `}
                        {...props}
                    />
                </div>
                {error ? (
                    <p className="text-[10px] text-red-400 font-medium ml-1">{error}</p>
                ) : helper ? (
                    <p className="text-[10px] text-[var(--text-muted)] ml-1">{helper}</p>
                ) : null}
            </div>
        );
    }
);

Input.displayName = 'Input';
export default Input;
