'use client';
import React, { useCallback, useEffect, useRef, useState } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { io, Socket } from "socket.io-client";

interface CollaborativeEditorProps {
    value: string;
    onChange: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = React.memo(({ value, onChange }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [quill, setQuill] = useState<Quill | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);
    const isInitialMount = useRef(true);

    // Memoized socket connection
    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
        const s = io(socketUrl, { 
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000 
        });

        s.on("connect_error", (err) => {
            console.error("Socket connection error:", err);
        });

        setSocket(s);
        
        return () => {
            s.disconnect();
        }
    }, []);

    // Consolidated change handling
    useEffect(() => {
        if (!quill || !socket) return;

        const sendChangesHandler = (delta: any, oldDelta: any, source: string) => {
            if (source !== 'user') return;
            socket.emit('send-changes', delta);
        };

        const receiveChangesHandler = (delta: any) => {
            quill.updateContents(delta);
        };

        quill.on('text-change', sendChangesHandler);
        socket.on('receive-changes', receiveChangesHandler);

        return () => {
            quill.off('text-change', sendChangesHandler);
            socket.off('receive-changes', receiveChangesHandler);
        }
    }, [quill, socket]);

    // Initialization and value tracking
    const initializeEditor = useCallback(() => {
        if (!wrapperRef.current) return;

        wrapperRef.current.innerHTML = '';
        const editorDiv = document.createElement('div');
        wrapperRef.current.appendChild(editorDiv);

        const q = new Quill(editorDiv, {
            theme: 'snow',
            modules: {
                toolbar: [
                    [{ header: [1, 2, 3, false] }],
                    ["bold", "italic", "underline", "strike"],
                    [{ list: "ordered" }, { list: "bullet" }],
                    ["link", "image"],
                    ["clean"],
                ],
            },
        });

        // Only set initial value on first mount
        if (isInitialMount.current && value) {
            q.setText(value);
            isInitialMount.current = false;
        }

        // Track changes
        q.on('text-change', () => {
            onChange(q.getText());
        });

        setQuill(q);
    }, [value, onChange]);

    // Initialize Editor on Mount
    useEffect(() => {
        initializeEditor();

        return () => {
            if (wrapperRef.current) {
                wrapperRef.current.innerHTML = '';
            }
        };
    }, [initializeEditor]);

    return (
        <div ref={wrapperRef} className="h-64 border rounded-md"></div>
    );
});

export default CollaborativeEditor;