'use client';
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

interface CollaborativeEditorProps {
    value: string;
    onChange: (content: string) => void;
}

const CollaborativeEditor: React.FC<CollaborativeEditorProps> = ({ value, onChange }) => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [quill, setQuill] = useState<Quill | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    // Socket Connection
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

    // Receive Remote Changes
    useEffect(() => {
      if(!quill || !socket) return;
      const handler = (delta: any) => {
        quill.updateContents(delta);
      }

      socket.on('receive-changes', handler); 

      return () => {
          socket.off('receive-changes', handler);
      }
    },[ quill, socket]);

    // Send Local Changes
    useEffect(() => {
        if(!quill || !socket) return;
        const handler = (delta: any, oldDelta: any, source: string) => {
          if (source !== 'user') return;
          socket.emit('send-changes', delta);
        }

        quill.on('text-change', handler); 

        return () => {
            quill.off('text-change', handler);
        }
    },[ quill, socket]);

    // Initialize Editor
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

        // Set initial value if provided
        if (value) {
            q.setText(value);
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
};

export default CollaborativeEditor;