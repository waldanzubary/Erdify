'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-[var(--bg-primary)]">
                <main className="w-full">
                    {children}
                </main>
            </div>
        </ProtectedRoute>
    );
}
