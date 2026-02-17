'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from './useAuth';
import { loadProject, saveProject } from '../lib/db/actions';
import type { ERSchema, Project } from '../lib/types';
import { supabase } from '@/lib/supabase';

export function useProject(projectId: string) {
    const { user } = useAuth();
    const [project, setProject] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Load project
    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            const data = await loadProject(projectId);
            setProject(data);
        } catch (err) {
            console.error('Failed to load project', err);
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        load();
    }, [load]);

    // Realtime subscription using Supabase
    useEffect(() => {
        if (!projectId) return;

        const channel = supabase
            .channel(`project:${projectId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'projects',
                    filter: `id=eq.${projectId}`,
                },
                (payload: any) => {
                    setProject(payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [projectId]);

    // Auto-save with debounce
    const autoSave = useCallback(
        (schema: ERSchema, flowchart?: { nodes: any[]; edges: any[] }) => {
            if (!projectId) return;

            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }

            saveTimeoutRef.current = setTimeout(async () => {
                setSaving(true);
                try {
                    await saveProject(projectId, { schema, flowchart });
                    setLastSaved(new Date());
                } catch (err) {
                    console.error('Auto-save failed', err);
                } finally {
                    setSaving(false);
                }
            }, 1000);
        },
        [projectId]
    );

    const updateProjectName = useCallback(
        async (name: string) => {
            if (!projectId) return;
            try {
                await saveProject(projectId, { name });
            } catch (err) {
                console.error('Failed to update project name', err);
            }
        },
        [projectId]
    );

    // Cleanup
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    return {
        project,
        setProject,
        loading,
        saving,
        lastSaved,
        autoSave,
        updateProjectName,
    };
}
