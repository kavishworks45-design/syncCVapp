import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import { FaFilePdf, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set worker source
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

function PdfPreview({ file, height = "600px" }) {
    const [numPages, setNumPages] = useState(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [width, setWidth] = useState(400); // Default width

    // Adjust width based on container (simple responsive check)
    useEffect(() => {
        const updateWidth = () => {
            const container = document.getElementById('pdf-container');
            if (container) setWidth(container.clientWidth - 40);
        };
        window.addEventListener('resize', updateWidth);
        updateWidth();
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    function onDocumentLoadSuccess({ numPages }) {
        setNumPages(numPages);
    }

    if (!file) {
        return (
            <div style={{
                height: height,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                border: "2px dashed rgba(255,255,255,0.2)",
                borderRadius: "16px",
                background: "rgba(0,0,0,0.1)"
            }}>
                <FaFilePdf size={48} color="rgba(255,255,255,0.3)" />
                <p style={{ color: "rgba(255,255,255,0.5)", marginTop: "1rem" }}>PDF Preview will appear here</p>
            </div>
        );
    }

    return (
        <div id="pdf-container" style={{
            height: height,
            borderRadius: "16px",
            overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "#525659", // Standard PDF viewer background
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            position: "relative"
        }}>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", width: "100%", display: "flex", justifyContent: "center", paddingTop: "20px" }}>
                <Document
                    file={file}
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={<div style={{ color: "white", marginTop: "2rem" }}>Loading PDF...</div>}
                >
                    <Page
                        pageNumber={pageNumber}
                        width={width}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        className="pdf-page-shadow"
                    />
                </Document>
            </div>

            {/* Pagination Controls */}
            {numPages > 1 && (
                <div style={{
                    position: "absolute",
                    bottom: "20px",
                    background: "rgba(0,0,0,0.6)",
                    backdropFilter: "blur(4px)",
                    padding: "8px 16px",
                    borderRadius: "50px",
                    display: "flex",
                    gap: "1rem",
                    alignItems: "center",
                    color: "white"
                }}>
                    <button
                        onClick={() => setPageNumber(p => Math.max(1, p - 1))}
                        disabled={pageNumber <= 1}
                        style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex" }}
                    >
                        <FaChevronLeft />
                    </button>
                    <span style={{ fontSize: "0.9rem" }}>{pageNumber} of {numPages}</span>
                    <button
                        onClick={() => setPageNumber(p => Math.min(numPages, p + 1))}
                        disabled={pageNumber >= numPages}
                        style={{ background: "transparent", border: "none", color: "white", cursor: "pointer", display: "flex" }}
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}

            <style>{`
        .pdf-page-shadow canvas {
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            border-radius: 4px;
        }
      `}</style>
        </div>
    );
}

export default PdfPreview;
