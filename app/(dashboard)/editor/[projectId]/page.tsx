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
import '@xyflow/react/dist/style.css';

import { useProject } from '@/hooks/useProject';
import { useERSchema } from '@/hooks/useERSchema';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeCollaboration } from '@/hooks/useRealtimeCollaboration';
import { schemaToFlow } from '@/utils/erToFlow';
import { getAutoLayout } from '@/utils/autoLayout';
import { parseSQL } from '@/utils/sqlParser';
import { exportToPng } from '@/utils/exportPng';
import { exportToJson } from '@/utils/exportJson';
import { exportToSQL } from '@/utils/exportSql';

import TableNode from '@/components/editor/TableNode';
import NoteNode from '@/components/editor/NoteNode';
import RelationshipEdge from '@/components/editor/RelationshipEdge';
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
    };

    const nodeTypes = useMemo(
        () => ({ tableNode: TableNode, noteNode: NoteNode }),
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
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === nodeId) {
                    return { ...node, position: { x, y } };
                }
                return node;
            })
        );
    }, [setNodes]);

    const handleRemoteNameChange = useCallback((name: string) => {
        setProject((prev: any) => prev ? { ...prev, name } : prev);
    }, [setProject]);

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
    });
    // Initialize from project
    useEffect(() => {
        if (project && !initialized) {
            replaceSchema(project.schema);
            setInitialized(true);
        }
    }, [project, initialized, replaceSchema]);



    // Auto-save on schema change + broadcast to collaborators
    useEffect(() => {
        if (initialized && schema.tables.length >= 0) {
            autoSave(schema);
            // Only broadcast if this is a local change
            if (!isRemoteUpdateRef.current) {
                broadcastSchemaChange(schema);
            }
        }
    }, [schema, initialized, autoSave, broadcastSchemaChange]);

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


    const handleUpload = useCallback(
        (content: string, _filename: string) => {
            try {
                const parsed = parseSQL(content);
                replaceSchema(parsed);
                setShowUpload(false);

                // Auto-layout after parse
                setTimeout(() => {
                    const { nodes: n, edges: e } = schemaToFlow(parsed);
                    const { nodes: layouted } = getAutoLayout(n, e);
                    setNodes(layouted);
                }, 100);
            } catch (err: any) {
                alert(err.message || 'Failed to parse SQL');
            }
        },
        [replaceSchema, setNodes]
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
            }
        },
        [updateTablePosition]
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
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={canEdit ? onNodesChange : undefined}
                        onEdgesChange={canEdit ? onEdgesChange : undefined}
                        onConnect={canEdit ? onConnect : undefined}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onNodeDragStop={canEdit ? onNodeDragStop : undefined}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        fitView
                        id="er-canvas"
                        nodesDraggable={canEdit}
                        nodesConnectable={canEdit}
                        elementsSelectable={true}
                        connectionMode={ConnectionMode.Loose}
                    >
                        <LiveCursors cursors={cursors} lastMessages={lastMessages} />

                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={24}
                            size={1}
                            color="#27272a"
                        />
                        <Controls className="!bg-[#18181b] !border-white/10 !fill-white" />
                        <MiniMap
                            className="!bg-[#18181b] !border-white/10"
                            nodeStrokeColor="#3b82f6"
                            nodeColor="#1d4ed8"
                            maskColor="rgba(0, 0, 0, 0.4)"
                        />
                    </ReactFlow>
                </div>

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
