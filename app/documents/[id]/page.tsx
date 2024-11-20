'use client';
// import CollaborativeEditor from '@/components/shared/CollaborativeEditor';
import dynamic from 'next/dist/shared/lib/dynamic';
import { useRouter, useParams, redirect } from 'next/navigation'; // Import useRouter and useSearchParams
import { Suspense, useCallback, useEffect, useState } from 'react';
import katex from "katex";
import "katex/dist/katex.min.css";
import CollaborativeEditor from '@/components/shared/CollaborativeEditor';



const DocumentPage = () => {
    const router = useRouter(); // Use useRouter
    const { id } = useParams();
    const [documentId, setDocumentId] = useState<string | null>(null);
    const [latexCode, setLatexCode] = useState(`\\documentclass{article}
        \\usepackage{amsmath}
        \\usepackage{graphicx}
        
        \\begin{document}
        \\title{Sample Document}
        \\author{Your Name}
        \\date{\\today}
        
        \\maketitle
        
        \\section{Introduction}
        This is a sample LaTeX document.
        
        \\section{Math Example}
        Here's some math:
        \\[E = mc^2\\]
        
        \\section{More Content}
        You can add more content here.
        
        \\end{document}`);

    const [compiledOutput, setCompiledOutput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [pdfSrc, setPdfSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    

    useEffect(() => {
        // If id is present in the query, set it to the state
        if (id) {
            setDocumentId(id as string);
        } else {
            // If no id, generate a default one
            const defaultId = generateDefaultId();
            setDocumentId(defaultId);
            console.error("Document ID was not provided, generated ID: " + defaultId);
        }
    }, [id]); // Run effect when `id` changes

    // Function to generate a default ID
    const generateDefaultId = () => {
        return 'default-id-' + Math.random().toString(36).substr(2, 9);
    };

    const handleEditorChange = useCallback((content: string) => {
        setLatexCode(content);
    }, []);


    const handleCompile = async () => {
        try {
            const renderedOutput = katex.renderToString(latexCode, {
                throwOnError: false,
                displayMode: true,
            });
            setCompiledOutput(renderedOutput);
            setError(null);
        } catch (error) {
            setCompiledOutput("<p>Error in LaTeX syntax</p>");
            setError("Error compiling LaTeX");
        }
    };


    const handleCloseEditor = () => {
        
        if (pdfSrc) {
            URL.revokeObjectURL(pdfSrc);
            setPdfSrc(null);
        }
        setError(null);
        router.push('/');
    };




    const handleGeneratePDF = async () => {
        setLoading(true);
        setError(null);
        
        // Clean up previous PDF URL if it exists
        if (pdfSrc) {
            URL.revokeObjectURL(pdfSrc);
            setPdfSrc(null);
        }

        try {
            const response = await fetch('/api/compile-latex', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: latexCode }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate PDF');
            }

            // Verify that we received a PDF
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/pdf')) {
                throw new Error('Received invalid response format');
            }

            const blob = await response.blob();
            const pdfUrl = URL.createObjectURL(blob);
            setPdfSrc(pdfUrl);
            setError(null);
        } catch (error) {
            console.error("Error generating PDF:", error);
            setError(error instanceof Error ? error.message : 'Failed to generate PDF');
            setPdfSrc(null);
        } finally {
            setLoading(false);
        }
    };

    const CollaborativeEditor = dynamic(
        () => import('@/components/shared/CollaborativeEditor'),
        { 
            ssr: false,
            loading: () => (
                <div className="h-[500px] flex items-center justify-center bg-gray-50">
                    <div className="text-gray-500">Loading editor...</div>
                </div>
            )
        }
    );

    return (
        <div>
            {documentId ? (
                <>
                  <div className="flex flex-col lg:flex-row gap-8 mt-4">
                    <div className="w-full lg:w-1/2">
                    <Suspense fallback = {<div>loading editor...</div>} >
                    <CollaborativeEditor 
                            value={latexCode}
                            onChange={handleEditorChange}
                        />
                    </Suspense>
                        
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={handleCompile}
                                className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                Compile to HTML
                            </button>
                            <button
                                onClick={handleGeneratePDF}
                                className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 transition-colors disabled:opacity-50"
                                disabled={loading}
                            >
                                {loading ? 'Generating PDF...' : 'Generate PDF'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full lg:w-1/2">
                        {error && (
                            <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                                {error}
                            </div>
                        )}

                        <div className="h-[500px] border-2 p-4 rounded-md bg-gray-100">
                            <h3 className="text-lg font-semibold mb-2">
                                Output Preview
                            </h3>
                            {pdfSrc ? (
                                <iframe
                                    src={pdfSrc}
                                    className="w-full h-full border rounded-md bg-white"
                                    title="PDF Preview"
                                />
                            ) : (
                                <div 
                                    className="h-full bg-white p-4 overflow-y-auto rounded-md shadow-inner"
                                    dangerouslySetInnerHTML={{ __html: compiledOutput }} 
                                />
                            )}
                        </div>

                        <div className="mt-4 flex justify-between">
                            <button
                                onClick={handleCloseEditor}
                                className="bg-gray-500 text-white py-2 px-4 rounded-md hover:bg-gray-600 transition-colors">
                                Close Editor
                            </button>
                            {pdfSrc && (
                                <a
                                    href={pdfSrc}
                                    download="document.pdf"
                                    className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition-colors"
                                >
                                    Download PDF
                                </a>
                            )}
                        </div>
                    </div>
                </div>
                </>
            ) : (
                <h1>Document ID is not available</h1>
            )}
        </div>
    );
};

export default DocumentPage;
