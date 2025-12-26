"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, Pen, Eraser, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfEditorProps {
  url: string;
  onClose: () => void;
  title?: string;
}

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  width: number;
}

export default function PdfEditor({ url, onClose, title }: PdfEditorProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser' | null>('pen');
  const [penColor, setPenColor] = useState('#ef4444'); // Default red
  const [isDrawing, setIsDrawing] = useState(false);
  
  // Store paths for each page: pageIndex -> Path[]
  const [annotations, setAnnotations] = useState<Record<number, Path[]>>({});
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);

  // Load document success
  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  // Handle Page Load to set canvas dimensions
  function onPageLoadSuccess(page: any) {
    const { width, height } = page.getViewport({ scale });
    setPageDimensions({ width, height });
    // Redraw annotations for this page
    requestAnimationFrame(() => drawAnnotations(pageNumber));
  }

  // Draw all existing paths for the current page
  const drawAnnotations = (page: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Set actual canvas size (resolution support could be added here)
    if (pageDimensions) {
       // Canvas is already sized by the component's style/width attrs, 
       // but we should ensure internal resolution matches if we want crisp lines
       // For now, we rely on the width/height props matching the PDF page.
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const pagePaths = annotations[page] || [];
    pagePaths.forEach(path => {
      if (path.points.length < 2) return;
      ctx.beginPath();
      ctx.lineWidth = path.width;
      ctx.strokeStyle = path.color;
      ctx.moveTo(path.points[0].x, path.points[0].y);
      for (let i = 1; i < path.points.length; i++) {
        ctx.lineTo(path.points[i].x, path.points[i].y);
      }
      ctx.stroke();
    });
  };

  // Re-draw when page or dimensions or annotations change
  useEffect(() => {
    drawAnnotations(pageNumber);
  }, [pageNumber, pageDimensions, annotations, scale]);

  // Mouse/Touch Handlers
  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeTool) return;
    setIsDrawing(true);
    const point = getPoint(e);
    if (!point) return;

    if (activeTool === 'pen') {
      const newPath: Path = {
        color: penColor,
        width: 3,
        points: [point]
      };
      setAnnotations(prev => {
        const pagePaths = prev[pageNumber] || [];
        return { ...prev, [pageNumber]: [...pagePaths, newPath] };
      });
    } else if (activeTool === 'eraser') {
      // Simple eraser: clears everything nearby? Or just don't draw?
      // For now, eraser triggers "clear all" logic or we can implement collision detection.
      // Let's make 'eraser' just a mode where you click/drag to remove paths?
      // A simpler mvp eraser: click to clear page or a "Clear Page" button.
      // Let's stick to Pen for now, and maybe "Eraser" just paints transparent or white? 
      // No, white pen over text is bad.
      // Let's implement Eraser as "Delete nearby strokes" later.
      // For MVP, Eraser will act as a 'White Pen' (not great but works on white paper) or we skip it.
      // User asked for "Editor", let's assume adding notes is key.
      
      // Let's implement a 'Clear Page' button instead of complex eraser for now,
      // OR implement Eraser as a white brush (assuming white paper).
      // Let's try white brush.
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !activeTool) return;
    const point = getPoint(e);
    if (!point) return;

    if (activeTool === 'pen') {
      setAnnotations(prev => {
        const pagePaths = prev[pageNumber] || [];
        if (pagePaths.length === 0) return prev;
        
        const lastPath = { ...pagePaths[pagePaths.length - 1] };
        lastPath.points = [...lastPath.points, point];
        
        const newPaths = [...pagePaths];
        newPaths[newPaths.length - 1] = lastPath;
        
        return { ...prev, [pageNumber]: newPaths };
      });
    }
    // Real-time drawing visual feedback handled by useEffect re-render is slow.
    // Better to draw directly to canvas context here for performance, then save to state.
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
       ctx.lineWidth = 3;
       ctx.lineCap = 'round';
       ctx.lineJoin = 'round';
       ctx.strokeStyle = activeTool === 'pen' ? penColor : '#ffffff';
       
       // Draw line from last point to current point
       // We need the last point from state or ref
       // For simplicity in this react model, I'm relying on state invalidation.
       // Optimisation: use ref for currentPath and draw immediately.
    }
  };

  const endDrawing = () => {
    setIsDrawing(false);
  };
  
  // Optimised drawing approach:
  // We'll trust the React state update for now. If it's slow, we optimize.

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col animate-fade-in">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 bg-gray-900">
        <div className="flex items-center gap-4">
           <h2 className="text-white font-bold hidden md:block">{title || "PDF Editor"}</h2>
           
           <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/10">
             <button 
               onClick={() => setPageNumber(p => Math.max(1, p - 1))}
               disabled={pageNumber <= 1}
               className="p-2 text-white hover:bg-white/10 rounded disabled:opacity-50"
             >
               <ChevronLeft className="w-5 h-5"/>
             </button>
             <span className="px-3 text-sm font-mono text-white">
               {pageNumber} / {numPages || '--'}
             </span>
             <button 
               onClick={() => setPageNumber(p => Math.min(numPages || 1, p + 1))}
               disabled={pageNumber >= (numPages || 1)}
               className="p-2 text-white hover:bg-white/10 rounded disabled:opacity-50"
             >
               <ChevronRight className="w-5 h-5"/>
             </button>
           </div>
        </div>

        <div className="flex items-center gap-2">
           {/* Tools */}
           <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/10 mr-4">
             <button 
               onClick={() => { setActiveTool('pen'); setPenColor('#ef4444'); }}
               className={`p-2 rounded transition-colors ${activeTool === 'pen' && penColor === '#ef4444' ? 'bg-red-500/20 text-red-500' : 'text-gray-400 hover:text-white'}`}
             >
               <Pen className="w-4 h-4" />
             </button>
             <button 
               onClick={() => { setActiveTool('pen'); setPenColor('#3b82f6'); }}
               className={`p-2 rounded transition-colors ${activeTool === 'pen' && penColor === '#3b82f6' ? 'bg-blue-500/20 text-blue-500' : 'text-gray-400 hover:text-white'}`}
             >
               <Pen className="w-4 h-4" />
             </button>
             <button 
               onClick={() => { setActiveTool('pen'); setPenColor('#22c55e'); }}
               className={`p-2 rounded transition-colors ${activeTool === 'pen' && penColor === '#22c55e' ? 'bg-green-500/20 text-green-500' : 'text-gray-400 hover:text-white'}`}
             >
               <Pen className="w-4 h-4" />
             </button>
             <div className="w-px h-4 bg-white/10 mx-1" />
             <button 
                onClick={() => setAnnotations(prev => ({ ...prev, [pageNumber]: [] }))}
                className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/5 rounded"
                title="Clear Page"
             >
               <Eraser className="w-4 h-4" />
             </button>
           </div>

           <div className="flex items-center bg-black/50 rounded-lg p-1 border border-white/10">
             <button onClick={() => setScale(s => Math.max(0.5, s - 0.1))} className="p-2 text-white hover:bg-white/10 rounded"><ZoomOut className="w-4 h-4"/></button>
             <span className="text-xs text-gray-400 w-12 text-center">{Math.round(scale * 100)}%</span>
             <button onClick={() => setScale(s => Math.min(3, s + 0.1))} className="p-2 text-white hover:bg-white/10 rounded"><ZoomIn className="w-4 h-4"/></button>
           </div>
           
           <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg text-white/70 hover:text-white ml-2">
             <X className="w-6 h-6" />
           </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto bg-gray-800 flex justify-center p-8 relative" ref={containerRef}>
         <div className="relative shadow-2xl">
            <Document
              file={`/api/proxy_pdf/${url.replace(/^https?:\/\//, '')}`}
              onLoadSuccess={onDocumentLoadSuccess}
              loading={
                <div className="flex items-center gap-2 text-white">
                  <Loader2 className="w-6 h-6 animate-spin"/> Loading PDF...
                </div>
              }
              error={
                <div className="text-red-400 bg-red-900/20 p-4 rounded-xl border border-red-500/20">
                  Failed to load PDF. Might be a CORS issue or invalid URL.
                </div>
              }
            >
              <Page 
                pageNumber={pageNumber} 
                scale={scale} 
                onLoadSuccess={onPageLoadSuccess}
                className="bg-white"
                renderAnnotationLayer={false}
                renderTextLayer={false}
              />
            </Document>
            
            {/* Canvas Overlay */}
            {pageDimensions && (
              <canvas
                ref={canvasRef}
                width={pageDimensions.width}
                height={pageDimensions.height}
                className="absolute inset-0 cursor-crosshair touch-none"
                style={{ width: pageDimensions.width, height: pageDimensions.height }}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={endDrawing}
                onMouseLeave={endDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={endDrawing}
              />
            )}
         </div>
      </div>
    </div>
  );
}
