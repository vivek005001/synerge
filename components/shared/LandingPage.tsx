'use client';
import { useEffect, useState } from "react";
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { v4 as uuidv4 } from 'uuid';



export default function LandingPage() {
    const [showEditor, setShowEditor] = useState(false);
    

    const router = useRouter(); // Next.js router

    const handleNewProject = () => {
        const newProjectId = uuidv4();
        router.push(`/documents/${newProjectId}`);
        
        
        setTimeout(() => 
        setShowEditor(true),0
            
        )    
        
        
    };


    return (
        <div className="p-6">
            <button
                onClick={handleNewProject}
                className="bg-[rgba(123,129,254,1)] rounded-3xl py-2 px-6 text-white hover:bg-opacity-90 transition-colors">
                New Project
            </button>

        </div>
    );
}
