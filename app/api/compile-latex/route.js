import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { code } = await req.json();

        // Create a Blob from the LaTeX content
        const latexBlob = new Blob([code], { type: 'text/plain' });

        // Create FormData with comprehensive compilation options
        const formData = new FormData();
        formData.append('filecontents[]', latexBlob, 'document.tex');
        formData.append('filename[]', 'document.tex');
        formData.append('engine', 'xelatex'); // Changed to xelatex for better font support

        // Expanded compilation options
        formData.append('options', JSON.stringify({
            "compiler": "xelatex",
            // "resources": [
            //     "latexsym",
            //     "fullpage",
            //     "titlesec",
            //     "marvosym",
            //     "color",
            //     "verbatim",
            //     "enumitem",
            //     "hyperref",
            //     "fancyhdr",
            //     "ulem",
            //     "fontawesome5",
            //     "bookmark",
            //     "multicol",
            //     "xcolor",
            //     "geometry",
            //     "inputenc",
            //     "fontspec"
            // ],
            "timeout": 240, // Increased timeout
            "passes": 3,    // Increased passes for better reference resolution
            "flags": [
                "-shell-escape",
                "-interaction=nonstopmode",
                "-halt-on-error"
            ]
        }));

        // Make request with extended timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout

        console.log('Sending request to LaTeX service...');
        
        const response = await fetch("https://latex.ytotech.com/builds/sync", {
            method: "POST",
            body: formData,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            let errorMessage = 'PDF compilation failed';
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
                console.error('LaTeX compilation error:', {
                    status: response.status,
                    errorData,
                    latexSource: code.substring(0, 500) + '...' // Log first 500 chars of source
                });
            } catch (e) {
                console.error('Raw LaTeX compilation error:', {
                    status: response.status,
                    errorText,
                    error: e
                });
            }
            throw new Error(errorMessage);
        }

        const pdfBuffer = await response.arrayBuffer();

        // Verify PDF validity
        const pdfHeader = new Uint8Array(pdfBuffer.slice(0, 4));
        if (!(pdfHeader[0] === 0x25 && // %
              pdfHeader[1] === 0x50 && // P
              pdfHeader[2] === 0x44 && // D
              pdfHeader[3] === 0x46)) { // F
            console.error('Invalid PDF generated', {
                header: Array.from(pdfHeader).map(b => b.toString(16)),
                size: pdfBuffer.byteLength
            });
            throw new Error('Invalid PDF generated');
        }

        console.log('PDF generated successfully', {
            size: pdfBuffer.byteLength
        });

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": 'attachment; filename="resume.pdf"',
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Cache-Control": "public, max-age=3600",
            },
        });

    } catch (err) {
        console.error("Error in API route:", err);
        return NextResponse.json(
            { 
                error: err.message || "Internal Server Error",
                details: process.env.NODE_ENV === 'development' ? err.stack : undefined,
                timestamp: new Date().toISOString()
            },
            { 
                status: 500,
                headers: {
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type",
                }
            }
        );
    }
}

export async function OPTIONS() {
    return new NextResponse(null, {
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
        },
    });
}