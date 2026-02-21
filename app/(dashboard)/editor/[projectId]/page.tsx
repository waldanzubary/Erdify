'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    useNodesState,
    useEdgesState,
    addEdge,
    Connection,
    Edge,
    Node,
    ReactFlow,
    Background,
    Controls,
    Panel,
    useReactFlow,
    ReactFlowProvider,
    BackgroundVariant,
    MiniMap,
    ConnectionMode
} from '@xyflow/react';
import { supabase } from '@/lib/supabase';
import { loadProject, saveProject, listNotes, createNote, deleteNote, updateNote, getProjectAccess, updatePublicRole, recordAccess } from '@/lib/db/actions';
import CreateNoteModal from '@/components/editor/CreateNoteModal';
import DummyDataPanel from '@/components/editor/DummyDataPanel';
import '@xyflow/react/dist/style.css';

import { useProject } from '@/hooks/useProject';
import { useERSchema } from '@/hooks/useERSchema';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { usePlan, fetchWithAuth } from '@/hooks/usePlan';
import { schemaToFlow } from '@/utils/erToFlow';
import { getAutoLayout } from '@/utils/autoLayout';
import { parseSQL } from '@/utils/sqlParser';
import { exportToPng } from '@/utils/exportPng';
import { exportToJson } from '@/utils/exportJson';
import { exportToSQL, generateSQL } from '@/utils/exportSql';
import { exportToSQLWithData } from '@/utils/exportSqlWithData';

import TableNode from '@/components/editor/TableNode';
import NoteNode from '@/components/editor/NoteNode';
import RelationshipEdge from '@/components/editor/RelationshipEdge';
import FlowchartNode from '@/components/editor/FlowchartNode';
import Sidebar from '@/components/editor/Sidebar';
import Toolbar from '@/components/editor/Toolbar';
import { motion, AnimatePresence } from 'framer-motion';
import UploadZone from '@/components/editor/UploadZone';
import Modal from '@/components/ui/Modal';
import LiveCursors from '@/components/editor/LiveCursors';
import NotesPanel from '@/components/editor/NotesPanel';
import InviteModal from '@/components/editor/InviteModal';

function EditorContent() {
    const params = useParams();
    const projectId = params.projectId as string;
    const { user } = useAuth();
    const { project, setProject, loading, saving, lastSaved, autoSave, updateProjectName } =
        useProject(projectId);
    const {
        schema,
        replaceSchema,
        addTable,
        removeTable,
        renameTable,
        addColumn,
        removeColumn,
        updateColumn,
        addRelationship,
        removeRelationship,
        updateTablePosition,
    } = useERSchema();

    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [dbNotes, setDbNotes] = useState<any[]>([]);
    const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [isCreateNoteModalOpen, setIsCreateNoteModalOpen] = useState(false);
    const [showNotes, setShowNotes] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [noteCount, setNoteCount] = useState(0);
    const [initialized, setInitialized] = useState(false);
    const [canEdit, setCanEdit] = useState(false);

    // Flowchart State
    const [viewMode, setViewMode] = useState<'erd' | 'flowchart'>('erd');
    const [flowNodes, setFlowNodes, onFlowNodesChange] = useNodesState<Node>([]);
    const [flowEdges, setFlowEdges, onFlowEdgesChange] = useEdgesState<Edge>([]);
    const [isGeneratingFlowchart, setIsGeneratingFlowchart] = useState(false);

    // Dummy Data State
    const [showDummyPanel, setShowDummyPanel] = useState(false);
    const [dummyData, setDummyData] = useState<Record<string, Record<string, any>[]> | null>(null);
    const [isGeneratingDummy, setIsGeneratingDummy] = useState(false);
    const planState = usePlan();
    const dummySaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const flowRef = useRef<HTMLDivElement>(null);
    const isRemoteUpdateRef = useRef(false);
    const { screenToFlowPosition, getViewport } = useReactFlow();

    // Calculate Permissions
    useEffect(() => {
        const checkAccess = async () => {
            if (!project) return;
            const access = await getProjectAccess(
                projectId,
                user?.email || undefined,
                project.userId,
                user?.id
            );
            setCanEdit(access === 'edit');

            // Record access for dashboard listing
            if (user?.id && user?.email) {
                await recordAccess(projectId, user.id, user.email);
            }
        };
        checkAccess();
    }, [project, user, projectId]);

    const handlePublicRoleChange = async (role: 'view' | 'edit') => {
        await updatePublicRole(projectId, role);
        const updatedProject = { ...project, publicRole: role };
        setProject(updatedProject);
        broadcastProjectUpdate(updatedProject);
    };

    const nodeTypes = useMemo(
        () => ({ tableNode: TableNode, noteNode: NoteNode, flowchartNode: FlowchartNode }),
        []
    );
    const edgeTypes = useMemo(
        () => ({ relationshipEdge: RelationshipEdge }),
        []
    );

    // Handle remote schema changes
    const handleRemoteSchemaChange = useCallback(
        (remoteSchema: any) => {
            isRemoteUpdateRef.current = true;
            replaceSchema(remoteSchema);
            setTimeout(() => {
                isRemoteUpdateRef.current = false;
            }, 100);
        },
        [replaceSchema]
    );

    // Load notes
    const loadNotes = useCallback(async () => {
        try {
            const data = await listNotes(projectId);
            setDbNotes(data);
            setNoteCount(data.length);
        } catch (err) {
            console.error('Failed to load notes', err);
        }
    }, [projectId]);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    // Handle remote note additions (Broadcast fallback)
    const handleRemoteNoteAdd = useCallback((note: any) => {
        setDbNotes((prev) => {
            if (prev.some(n => n.id === note.id)) return prev;
            return [...prev, note];
        });
    }, []);

    // Handle remote note movement (Instant feedback)
    const handleRemoteNoteUpdate = useCallback((noteId: string, updates: any) => {
        setDbNotes((prev) => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));
    }, []);

    const handleRemoteNodeMove = useCallback(({ nodeId, x, y }: { nodeId: string; x: number; y: number }) => {
        setNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, position: { x, y } } : node));
        setFlowNodes((nds) => nds.map((node) => node.id === nodeId ? { ...node, position: { x, y } } : node));
    }, [setNodes, setFlowNodes]);

    const handleRemoteNameChange = useCallback((name: string) => {
        setProject((prev: any) => prev ? { ...prev, name } : prev);
    }, [setProject]);

    const handleRemoteFlowchartChange = useCallback((flowchart: any) => {
        isRemoteUpdateRef.current = true;
        if (flowchart.nodes) setFlowNodes(flowchart.nodes);
        if (flowchart.edges) setFlowEdges(flowchart.edges);
        setTimeout(() => {
            isRemoteUpdateRef.current = false;
        }, 100);
    }, [setFlowNodes, setFlowEdges]);

    const handleRemoteViewModeChange = useCallback((mode: 'erd' | 'flowchart') => {
        setViewMode(mode);
    }, []);

    const handleRemoteProjectUpdate = useCallback((updatedProject: any) => {
        setProject(updatedProject);
    }, [setProject]);

    const handleRemoteDummyDataChange = useCallback((incoming: Record<string, Record<string, any>[]>) => {
        setDummyData(incoming);
    }, []);

    // Realtime collaboration
    const {
        onlineUsers,
        cursors,
        lastMessages,
        status,
        myColor,
        broadcastCursorMove,
        broadcastSchemaChange,
        broadcastChatMessage,
        broadcastNoteAdd,
        broadcastNoteUpdate,
        broadcastNodeMove,
        broadcastProjectName,
        broadcastFlowchartChange,
        broadcastViewModeChange,
        broadcastProjectUpdate,
        broadcastDummyDataChange,
    } = useRealtimeCollaboration({
        projectId,
        userId: user?.id || '',
        userName: user?.user_metadata?.full_name || user?.email || 'Anonymous',
        onRemoteSchemaChange: handleRemoteSchemaChange,
        onRemoteNoteAdd: handleRemoteNoteAdd,
        onRemoteNoteUpdate: handleRemoteNoteUpdate,
        onRemoteNoteChange: loadNotes,
        onRemoteNodeMove: handleRemoteNodeMove,
        onRemoteNameChange: handleRemoteNameChange,
        onRemoteFlowchartChange: handleRemoteFlowchartChange,
        onRemoteViewModeChange: handleRemoteViewModeChange,
        onRemoteProjectUpdate: handleRemoteProjectUpdate,
        onRemoteDummyDataChange: handleRemoteDummyDataChange,
    });
    // Initialize from project (schema, flowchart, and dummyData)
    useEffect(() => {
        if (project && !initialized) {
            replaceSchema(project.schema);
            if (project.flowchart) {
                setFlowNodes(project.flowchart.nodes || []);
                setFlowEdges(project.flowchart.edges || []);
            }
            if ((project as any).dummyData) {
                setDummyData((project as any).dummyData);
            }
            setInitialized(true);
        }
    }, [project, initialized, replaceSchema]);



    // Auto-save on schema change + broadcast to collaborators
    useEffect(() => {
        if (initialized && schema.tables.length >= 0) {
            autoSave(schema, { nodes: flowNodes, edges: flowEdges });
            // Only broadcast if this is a local change
            if (!isRemoteUpdateRef.current) {
                broadcastSchemaChange(schema);
            }
        }
    }, [schema, initialized, autoSave, broadcastSchemaChange]);

    // Separate broadcast for flowchart structure (less frequent)
    useEffect(() => {
        if (initialized && !isRemoteUpdateRef.current) {
            broadcastFlowchartChange({ nodes: flowNodes, edges: flowEdges });
        }
    }, [flowEdges, initialized, broadcastFlowchartChange]); // Only edges or initial load trigger structural broadcast


    // Track cursor movement on the canvas
    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!flowRef.current) return;
            const pos = screenToFlowPosition({
                x: e.clientX,
                y: e.clientY,
            });
            broadcastCursorMove(pos.x, pos.y);
        },
        [broadcastCursorMove, screenToFlowPosition]
    );


    const handleGenerateFlowchart = useCallback(async (arg?: string | any) => {
        const isManual = typeof arg === 'string';
        const sqlContent = isManual ? arg : generateSQL(schema);

        if (!sqlContent || (schema.tables.length === 0 && !isManual)) {
            console.log('No content to generate flowchart from');
            return;
        }

        setIsGeneratingFlowchart(true);
        setViewMode('flowchart');

        try {
            console.log('Requesting flowchart generation with content length:', sqlContent.length);
            console.log('SQL Content Snippet:', sqlContent.substring(0, 50) + '...');

            const res = await fetch('/api/generate-flowchart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql: sqlContent }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ details: 'Could not parse error JSON' }));
                console.error('API Error Response:', res.status, errData);
                throw new Error(errData.details || errData.error || res.statusText);
            }

            const data = await res.json();
            console.log('Flowchart Data Received:', data);

            if (data.nodes && data.edges) {
                const newFlowNodes = data.nodes.map((n: any) => ({
                    id: n.id,
                    type: 'flowchartNode',
                    position: { x: 0, y: 0 },
                    data: { label: n.label, type: n.type }
                }));

                const newFlowEdges = data.edges
                    .filter((e: any) => newFlowNodes.some((n: any) => n.id === e.source) && newFlowNodes.some((n: any) => n.id === e.target))
                    .map((e: any) => ({
                        id: e.id,
                        source: e.source,
                        target: e.target,
                        label: e.label,
                        animated: true,
                        style: { stroke: '#818cf8' },
                    }));

                const { nodes: layoutedFlowNodes } = getAutoLayout(newFlowNodes, newFlowEdges);
                setFlowNodes(layoutedFlowNodes);
                setFlowEdges(newFlowEdges);
            }
        } catch (error: any) {
            console.error('Failed to generate flowchart:', error);
            alert(`Failed to generate flowchart: ${error.message}`);
        } finally {
            setIsGeneratingFlowchart(false);
        }
    }, [schema, setFlowNodes, setFlowEdges]);

    const handleUpload = useCallback(
        async (content: string, _filename: string) => {
            try {
                const parsed = parseSQL(content);
                replaceSchema(parsed);
                setShowUpload(false);

                // Auto-layout ERD
                setTimeout(() => {
                    const { nodes: n, edges: e } = schemaToFlow(parsed);
                    const { nodes: layouted } = getAutoLayout(n, e);
                    setNodes(layouted);
                }, 100);

                // Generate Flowchart automatically after upload
                handleGenerateFlowchart(content);

            } catch (err: any) {
                alert(err.message || 'Failed to parse SQL');
            }
        },
        [replaceSchema, setNodes, handleGenerateFlowchart]
    );

    const handleExportPng = useCallback(() => {
        const el = document.getElementById('er-canvas');
        if (el) exportToPng(el, project?.name || 'erdify-diagram');
    }, [project?.name]);

    const handleExportJson = useCallback(() => {
        exportToJson(schema, project?.name || 'erdify-schema');
    }, [schema, project?.name]);

    const handleExportSQL = useCallback(() => {
        exportToSQL(schema, project?.name || 'erdify-database');
    }, [schema, project?.name]);

    // ── Dummy Data ──
    const handleGenerateDummy = useCallback(async (rowCount: number, isAppend: boolean = false) => {
        if (schema.tables.length === 0) return;
        setIsGeneratingDummy(true);

        // Calculate last IDs and gather existing data samples for uniqueness
        const lastIds: Record<string, number> = {};
        const existingData: Record<string, any[]> = {};

        if (isAppend && dummyData) {
            Object.entries(dummyData).forEach(([tbl, rows]) => {
                // Get sample of existing data (max 3 rows) for uniqueness context
                existingData[tbl] = rows.slice(0, 3);

                const tableSchema = schema.tables.find(t => t.name === tbl);
                const pkCol = tableSchema?.columns.find(c => c.isPrimaryKey && c.type.toLowerCase().includes('int'));
                if (pkCol && rows.length > 0) {
                    const ids = rows.map(r => Number(r[pkCol.name])).filter(id => !isNaN(id));
                    if (ids.length > 0) {
                        const maxId = Math.max(...ids);
                        lastIds[tbl] = maxId + 1;
                    }
                }
            });
        }

        try {
            const res = await fetchWithAuth('/api/generate-dummy', {
                method: 'POST',
                body: JSON.stringify({ schema, rowCount, lastIds, existingData }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                if (res.status === 429) {
                    alert(errData.error || 'Weekly limit reached.');
                    return;
                }
                throw new Error(errData.message || errData.error || res.statusText);
            }

            const data = await res.json();
            const newGenerated = data.data;

            let finalData = newGenerated;
            if (isAppend && dummyData) {
                // Merge with existing
                finalData = { ...dummyData };
                Object.keys(newGenerated).forEach(tbl => {
                    finalData[tbl] = [...(finalData[tbl] || []), ...newGenerated[tbl]];
                });
            }

            setDummyData(finalData);
            saveProject(projectId, { dummyData: finalData });
            broadcastDummyDataChange(finalData);
            planState.refresh();
        } catch (error: any) {
            console.error('Failed to generate dummy data:', error);
            alert(`Failed to generate: ${error.message}`);
        } finally {
            setIsGeneratingDummy(false);
        }
    }, [schema, planState, projectId, broadcastDummyDataChange, dummyData]);

    // Handle cell edits — debounced save (500ms) + immediate broadcast
    const handleDummyDataChange = useCallback((updated: Record<string, Record<string, any>[]>) => {
        setDummyData(updated);
        broadcastDummyDataChange(updated);
        // Debounced save to DB
        if (dummySaveTimerRef.current) clearTimeout(dummySaveTimerRef.current);
        dummySaveTimerRef.current = setTimeout(() => {
            saveProject(projectId, { dummyData: updated });
        }, 500);
    }, [projectId, broadcastDummyDataChange]);

    const handleExportSQLWithData = useCallback(() => {
        if (!dummyData) return;
        exportToSQLWithData(schema, dummyData, project?.name || 'erdify-database');
    }, [schema, dummyData, project?.name]);

    const handleAddNote = useCallback(async () => {
        setIsCreateNoteModalOpen(true);
    }, []);

    const handleCreateNoteOnCanvas = useCallback(async (content: string) => {
        if (!user) return;

        const { x, y } = getViewport();
        const canvasCenter = screenToFlowPosition({
            x: window.innerWidth / 2,
            y: window.innerHeight / 2,
        });

        // Optimistic UI: Create note object immediately
        const tempId = crypto.randomUUID();
        const newNote = {
            id: tempId,
            projectId,
            userId: user.id,
            userName: user.user_metadata?.full_name || user.email || 'Anonymous',
            content,
            status: 'todo',
            positionX: canvasCenter.x,
            positionY: canvasCenter.y,
            createdAt: new Date(),
        };

        // 1. Broadcast immediately
        broadcastNoteAdd(newNote);

        // 2. Update local state immediately
        setDbNotes(prev => [...prev, newNote]);

        // 3. Persist to DB in background
        try {
            await createNote(
                projectId,
                user.id,
                newNote.userName,
                content,
                'todo',
                canvasCenter.x,
                canvasCenter.y
            );
        } catch (err) {
            console.error('Failed to persist note to canvas', err);
            // Optionally: handle failure (e.g. remove from state)
        }
    }, [projectId, user, getViewport, screenToFlowPosition, broadcastNoteAdd]);

    const handleCreateNote = useCallback(async (content: string) => {
        if (!user) return;

        const tempId = crypto.randomUUID();
        const newNote = {
            id: tempId,
            projectId,
            userId: user.id,
            userName: user.user_metadata?.full_name || user.email || 'Anonymous',
            content,
            status: 'todo',
            createdAt: new Date(),
            positionX: null,
            positionY: null,
        };

        // 1. Broadcast immediately
        broadcastNoteAdd(newNote);

        // 2. Update local state immediately
        setDbNotes(prev => [...prev, newNote]);

        // 3. Persist to DB
        try {
            await createNote(
                projectId,
                user.id,
                newNote.userName,
                content
            );
        } catch (err) {
            console.error('Failed to persist sidebar note', err);
        }
    }, [projectId, user, broadcastNoteAdd]);

    const handleUpdateNote = useCallback(async (noteId: string, updates: any) => {
        // 1. Optimistic local update
        setDbNotes(prev => prev.map(n => n.id === noteId ? { ...n, ...updates } : n));

        // 2. Broadcast to collaborators immediately
        broadcastNoteUpdate(noteId, updates);

        // 3. Persist to DB
        try {
            await updateNote(noteId, updates);
        } catch (err) {
            console.error('Failed to update note', err);
            // Optionally reload from DB on failure to sync back
            loadNotes();
        }
    }, [broadcastNoteUpdate, loadNotes]);

    const handleToggleNoteStatus = useCallback((noteId: string, currentStatus: string) => {
        const statuses: string[] = ['todo', 'working', 'done'];
        const currentIdx = statuses.indexOf(currentStatus);
        const nextStatus = statuses[(currentIdx + 1) % statuses.length];
        handleUpdateNote(noteId, { status: nextStatus });
    }, [handleUpdateNote]);

    // Sync schema + notes → flow nodes/edges
    useEffect(() => {
        const { nodes: tableNodes, edges: newEdges } = schemaToFlow(schema);

        // Convert DB notes with positions to Flow nodes
        const noteNodes: Node[] = dbNotes
            .filter(n => n.positionX !== null && n.positionY !== null)
            .map(n => ({
                id: `note-${n.id}`,
                type: 'noteNode',
                position: { x: n.positionX, y: n.positionY },
                data: {
                    id: n.id,
                    content: n.content,
                    userName: n.userName,
                    createdAt: n.createdAt,
                    status: n.status,
                    canEdit: canEdit,
                    onStatusToggle: handleToggleNoteStatus
                },
                draggable: true
            }));

        setNodes([...tableNodes, ...noteNodes]);
        setEdges(newEdges);
    }, [schema, dbNotes, setNodes, setEdges, canEdit, handleToggleNoteStatus]);

    const handleDeleteNote = useCallback(async (noteId: string) => {
        try {
            await deleteNote(noteId);
            setDbNotes(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error('Failed to delete note', err);
        }
    }, []);

    const handleAutoLayout = useCallback(() => {
        const { nodes: layouted } = getAutoLayout(nodes, edges);

        // 1. Update Schema Tables positions to trigger broadcast + persistence
        const updatedTables = schema.tables.map(table => {
            const layoutedNode = layouted.find(n => n.id === table.id);
            if (layoutedNode) {
                return {
                    ...table,
                    position: { x: layoutedNode.position.x, y: layoutedNode.position.y }
                };
            }
            return table;
        });

        // 2. Update Note positions for canvas notes
        layouted.filter(n => n.type === 'noteNode').forEach((node) => {
            const noteId = node.id.replace('note-', '');
            handleUpdateNote(noteId, {
                positionX: node.position.x,
                positionY: node.position.y
            });
        });

        replaceSchema({
            ...schema,
            tables: updatedTables
        });
    }, [nodes, edges, schema, replaceSchema, handleUpdateNote]);

    const handleProjectNameChange = useCallback((name: string) => {
        // 1. Update locally for immediate feedback
        setProject((prev: any) => prev ? { ...prev, name } : prev);
        // 2. Broadcast to collaborators
        broadcastProjectName(name);
        // 3. Persist to DB
        updateProjectName(name);
    }, [setProject, broadcastProjectName, updateProjectName]);

    const onConnect = useCallback(
        (params: Connection) => {
            if (!params.sourceHandle || !params.targetHandle) return;

            // Handle IDs are in format: Table::Column::source/target
            const sourceParts = params.sourceHandle.split('::');
            const targetParts = params.targetHandle.split('::');

            if (sourceParts.length >= 2 && targetParts.length >= 2) {
                const sourceTable = sourceParts[0];
                const sourceColumn = sourceParts[1];
                const targetTable = targetParts[0];
                const targetColumn = targetParts[1];

                addRelationship({
                    sourceTable,
                    sourceColumn,
                    targetTable,
                    targetColumn,
                    type: 'one-to-many', // Default to one-to-many
                });
            }
        },
        [addRelationship]
    );

    const onNodeDrag = useCallback(
        (_: any, node: Node) => {
            broadcastNodeMove(node.id, node.position.x, node.position.y);
        },
        [broadcastNodeMove]
    );

    const onNodeDragStop = useCallback(
        async (_: any, node: Node) => {
            if (node.type === 'noteNode') {
                const noteId = node.id.replace('note-', '');
                try {
                    await updateNote(noteId, {
                        positionX: node.position.x,
                        positionY: node.position.y,
                    });
                    // Also update local dbNotes state to keep it in sync
                    setDbNotes(prev => prev.map(n =>
                        n.id === noteId ? { ...n, positionX: node.position.x, positionY: node.position.y } : n
                    ));
                } catch (err) {
                    console.error('Failed to save note position', err);
                }
            } else if (node.type === 'tableNode') {
                updateTablePosition(node.id, node.position.x, node.position.y);
                // Schema auto-save is triggered by the schema useEffect
            } else if (node.type === 'flowchartNode') {
                // For flowchart nodes, the movement broadcast is handled by onNodeDrag (real-time)
                // Here we just ensure the final state is broadcasted and saved
                if (!isRemoteUpdateRef.current) {
                    broadcastFlowchartChange({ nodes: flowNodes, edges: flowEdges });
                }
            }
        },
        [updateTablePosition, flowNodes, flowEdges, broadcastFlowchartChange]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
        setSelectedTableId(node.id);
    }, []);

    const onPaneClick = useCallback(() => {
        setSelectedTableId(null);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-[var(--text-muted)]">Loading project...</p>
                </div>
            </div>
        );
    }

    if (!project) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
                <p className="text-[var(--text-muted)]">Project not found</p>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[var(--bg-primary)]">
            <Toolbar
                onAutoLayout={handleAutoLayout}
                onUpload={() => setShowUpload(true)}
                onExportPng={handleExportPng}
                onExportJson={handleExportJson}
                onExportSql={handleExportSQL}
                onExportSqlWithData={handleExportSQLWithData}
                onToggleNotes={() => setShowNotes(!showNotes)}
                onAddNote={handleAddNote}
                onInvite={() => setShowInvite(true)}
                noteCount={noteCount}
                saving={saving}
                lastSaved={lastSaved}
                projectId={projectId}
                projectName={project?.name || ''}
                onProjectNameChange={handleProjectNameChange}
                onlineUsers={onlineUsers}
                currentUserColor={myColor}
                canEdit={canEdit}
                status={status}
                viewMode={viewMode}
                onViewModeChange={(mode) => {
                    setViewMode(mode);
                    broadcastViewModeChange(mode);
                }}
                onGenerateFlowchart={handleGenerateFlowchart}
                isGeneratingFlowchart={isGeneratingFlowchart}
                showDummyPanel={showDummyPanel}
                onToggleDummyPanel={() => setShowDummyPanel(prev => !prev)}
                remainingDummy={planState.remaining.dummy}
                remainingFlowcharts={planState.remaining.flowcharts}
                planRole={planState.plan?.role || 'free'}
                hasDummyData={!!dummyData && Object.keys(dummyData).length > 0}
            />

            <div className="flex-1 flex overflow-hidden relative">
                <Sidebar
                    schema={schema}
                    selectedTableId={selectedTableId}
                    onSelectTable={setSelectedTableId}
                    onAddTable={addTable}
                    onRemoveTable={removeTable}
                    onRenameTable={renameTable}
                    onAddColumn={addColumn}
                    onRemoveColumn={removeColumn}
                    onUpdateColumn={updateColumn}
                    onAddRelationship={addRelationship}
                    onRemoveRelationship={removeRelationship}
                    canEdit={canEdit}
                />

                <div
                    ref={flowRef}
                    className="flex-1 relative"
                    onMouseMove={handleMouseMove}
                >
                    {isGeneratingFlowchart && (
                        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <div className="flex flex-col items-center gap-4 p-6 bg-[#18181b] border border-white/10 rounded-2xl shadow-2xl">
                                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                                <div className="text-center">
                                    <p className="text-white font-semibold">Generating AI Flowchart...</p>
                                    <p className="text-xs text-white/50 mt-1">Analyzing SQL structure with Gemini</p>
                                </div>
                            </div>
                        </div>
                    )}
                    <ReactFlow
                        nodes={viewMode === 'erd' ? nodes : flowNodes}
                        edges={viewMode === 'erd' ? edges : flowEdges}
                        onNodesChange={canEdit ? (viewMode === 'erd' ? onNodesChange : onFlowNodesChange) : undefined}
                        onEdgesChange={canEdit ? (viewMode === 'erd' ? onEdgesChange : onFlowEdgesChange) : undefined}
                        onConnect={canEdit ? onConnect : undefined}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onNodeDrag={canEdit ? onNodeDrag : undefined}
                        onNodeDragStop={canEdit ? onNodeDragStop : undefined}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        id="er-canvas"
                        nodesDraggable={canEdit}
                        nodesConnectable={canEdit && viewMode === 'erd'}
                        elementsSelectable={true}
                        connectionMode={ConnectionMode.Loose}
                    >
                        <Background color="#27272a" variant={BackgroundVariant.Dots} />
                        <Controls />
                        <MiniMap
                            nodeStrokeColor={(n) => {
                                if (n.type === 'tableNode') return '#818cf8';
                                if (n.type === 'noteNode') return '#fbbf24';
                                return '#3f3f46';
                            }}
                            nodeColor={(n) => {
                                if (n.type === 'tableNode') return 'rgba(129, 140, 248, 0.1)';
                                if (n.type === 'noteNode') return 'rgba(251, 191, 36, 0.1)';
                                return 'rgba(63, 63, 70, 0.1)';
                            }}
                            maskColor="rgba(0, 0, 0, 0.3)"
                            className="!bg-[#18181b] !border-white/5 !rounded-xl overflow-hidden"
                        />
                        <LiveCursors cursors={cursors} lastMessages={lastMessages} />
                        <Panel position="top-right" className="flex flex-col gap-2">
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Dummy Data Panel */}
                <AnimatePresence>
                    {showDummyPanel && (
                        <DummyDataPanel
                            schema={schema}
                            dummyData={dummyData}
                            isGenerating={isGeneratingDummy}
                            planRole={planState.plan?.role || 'free'}
                            remainingDummy={planState.remaining.dummy}
                            maxRows={50}
                            onGenerate={(count: number) => handleGenerateDummy(count, false)}
                            onAppend={(count: number) => handleGenerateDummy(count, true)}
                            onExportSQLWithData={handleExportSQLWithData}
                            onClose={() => setShowDummyPanel(false)}
                            onDataChange={handleDummyDataChange}
                        />
                    )}
                </AnimatePresence>

                {/* Notes Panel */}
                {user && (
                    <AnimatePresence>
                        {showNotes && (
                            <NotesPanel
                                notes={dbNotes}
                                onCreateNote={handleCreateNote}
                                onUpdateNote={handleUpdateNote}
                                onDeleteNote={handleDeleteNote}
                                onClose={() => setShowNotes(false)}
                                projectId={projectId}
                                userId={user?.id || ''}
                                userName={user?.user_metadata?.full_name || user?.email || 'Anonymous'}
                                isOpen={showNotes}
                                canEdit={canEdit}
                            />
                        )}
                    </AnimatePresence>
                )}
            </div>

            <InviteModal
                isOpen={showInvite}
                onClose={() => setShowInvite(false)}
                projectId={projectId}
                publicRole={project?.publicRole || 'view'}
                onPublicRoleChange={handlePublicRoleChange}
            />

            <Modal
                isOpen={showUpload}
                onClose={() => setShowUpload(false)}
                title="Upload SQL File"
            >
                <UploadZone onFileContent={handleUpload} />
            </Modal>
            <CreateNoteModal
                isOpen={isCreateNoteModalOpen}
                onClose={() => setIsCreateNoteModalOpen(false)}
                onCreate={handleCreateNoteOnCanvas}
            />
        </div>
    );
}

export default function EditorPage() {
    return (
        <ReactFlowProvider>
            <EditorContent />
        </ReactFlowProvider>
    );
}
