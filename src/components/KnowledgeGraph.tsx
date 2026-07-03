import React, { useEffect, useRef, useState } from "react";
import { StudyNote } from "../types";
import { Network, ZoomIn, ZoomOut, RotateCcw, HelpCircle } from "lucide-react";

interface KnowledgeGraphProps {
  notes: StudyNote[];
  onOpenNote: (id: string) => void;
}

interface GraphNode {
  id: string;
  label: string;
  subject: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isNote: boolean;
  color: string;
}

interface GraphEdge {
  from: string;
  to: string;
}

export default function KnowledgeGraph({ notes, onOpenNote }: KnowledgeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [edges, setEdges] = useState<GraphEdge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [draggedNode, setDraggedNode] = useState<GraphNode | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const subjectColors: Record<string, string> = {
    "Biologia": "#10b981", // Emerald
    "História": "#f59e0b", // Amber
    "Matemática": "#3b82f6", // Blue
    "Geografia": "#6366f1", // Indigo
    "Português": "#f43f5e", // Rose
    "Física": "#06b6d4", // Cyan
    "Química": "#a855f7", // Purple
    "Inglês": "#f97316", // Orange
    "default": "#64748b" // Slate
  };

  // Build the graph structure
  useEffect(() => {
    if (notes.length === 0) return;

    const width = 800;
    const height = 500;

    // Create central Subject hub nodes + Note nodes
    const uniqueSubjects = Array.from(new Set(notes.map(n => n.subject)));
    
    const tempNodes: GraphNode[] = [];
    const tempEdges: GraphEdge[] = [];

    // 1. Create Subject hubs
    uniqueSubjects.forEach((subj, i) => {
      const angle = (i / uniqueSubjects.length) * Math.PI * 2;
      const radius = 150;
      tempNodes.push({
        id: `hub-${subj}`,
        label: subj.toUpperCase(),
        subject: subj,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 20,
        isNote: false,
        color: subjectColors[subj] || subjectColors.default
      });
    });

    // 2. Create Note nodes clustering around hubs
    notes.forEach((note, idx) => {
      const hub = tempNodes.find(n => n.id === `hub-${note.subject}`);
      let noteX = width / 2;
      let noteY = height / 2;

      if (hub) {
        // Place note randomly close to its subject hub
        const angle = Math.random() * Math.PI * 2;
        const dist = 50 + Math.random() * 60;
        noteX = hub.x + Math.cos(angle) * dist;
        noteY = hub.y + Math.sin(angle) * dist;
      }

      tempNodes.push({
        id: note.id,
        label: note.title,
        subject: note.subject,
        x: noteX,
        y: noteY,
        vx: 0,
        vy: 0,
        radius: 12,
        isNote: true,
        color: subjectColors[note.subject] || subjectColors.default
      });

      // Connect note to its Subject hub
      if (hub) {
        tempEdges.push({ from: note.id, to: hub.id });
      }
    });

    // 3. Connect notes that share tags
    for (let i = 0; i < notes.length; i++) {
      for (let j = i + 1; j < notes.length; j++) {
        const noteA = notes[i];
        const noteB = notes[j];
        if (noteA.tags && noteB.tags) {
          const hasSharedTag = noteA.tags.some(t => noteB.tags.includes(t));
          if (hasSharedTag) {
            tempEdges.push({ from: noteA.id, to: noteB.id });
          }
        }
      }
    }

    setNodes(tempNodes);
    setEdges(tempEdges);
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, [notes]);

  // Basic Physics force simulation (repulsion & edge attraction)
  useEffect(() => {
    if (nodes.length === 0) return;

    let animationId: number;

    const tick = () => {
      // Create new copy for updating position
      setNodes(prevNodes => {
        const kRepulsion = 1500;
        const kAttraction = 0.05;
        const damping = 0.85;

        // Clone nodes to update physics
        const nextNodes = prevNodes.map(n => ({ ...n }));

        // 1. Node repulsion
        for (let i = 0; i < nextNodes.length; i++) {
          for (let j = i + 1; j < nextNodes.length; j++) {
            const n1 = nextNodes[i];
            const n2 = nextNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            // Repel if close
            if (dist < 200) {
              const force = kRepulsion / distSq;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              // Don't accelerate anchored hubs too fast
              const weight1 = n1.isNote ? 1 : 0.2;
              const weight2 = n2.isNote ? 1 : 0.2;

              n1.vx -= fx * weight1;
              n1.vy -= fy * weight1;
              n2.vx += fx * weight2;
              n2.vy += fy * weight2;
            }
          }
        }

        // 2. Edge attraction
        edges.forEach(edge => {
          const n1 = nextNodes.find(n => n.id === edge.from);
          const n2 = nextNodes.find(n => n.id === edge.to);

          if (n1 && n2) {
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            // Optimal edge length
            const restLength = n1.isNote && n2.isNote ? 120 : 60;
            const force = (dist - restLength) * kAttraction;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            n1.vx += fx;
            n1.vy += fy;
            n2.vx -= fx;
            n2.vy -= fy;
          }
        });

        // 3. Keep hubs somewhat closer to center
        nextNodes.forEach(n => {
          if (!n.isNote) {
            const dx = 400 - n.x;
            const dy = 250 - n.y;
            n.vx += dx * 0.005;
            n.vy += dy * 0.005;
          }
        });

        // 4. Apply velocity and update positions
        nextNodes.forEach(n => {
          if (draggedNode && n.id === draggedNode.id) {
            // Keep dragged node at cursor
            return;
          }
          n.x += n.vx;
          n.y += n.vy;
          n.vx *= damping;
          n.vy *= damping;

          // Boundaries
          n.x = Math.max(50, Math.min(750, n.x));
          n.y = Math.max(50, Math.min(450, n.y));
        });

        return nextNodes;
      });

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [edges, draggedNode]);

  // Canvas rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply zoom & pan transformations
    ctx.translate(pan.x + canvas.width / 2, pan.y + canvas.height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);

    // 1. Draw Edges (connections)
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        ctx.beginPath();
        ctx.moveTo(fromNode.x, fromNode.y);
        ctx.lineTo(toNode.x, toNode.y);
        
        // Solid or glowing lines for hovered elements
        const isRelatedToHover = hoveredNode && (hoveredNode.id === fromNode.id || hoveredNode.id === toNode.id);
        ctx.strokeStyle = isRelatedToHover ? "#818cf8" : "#e2e8f0";
        ctx.lineWidth = isRelatedToHover ? 2 : 1;
        ctx.stroke();
      }
    });

    // 2. Draw Nodes
    nodes.forEach(node => {
      const isHovered = hoveredNode && hoveredNode.id === node.id;
      
      // Node Glow under-glow
      if (isHovered) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = node.color;
      ctx.fill();

      // Border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Labels
      ctx.fillStyle = node.isNote ? "#1e293b" : "#475569";
      ctx.font = node.isNote 
        ? `${isHovered ? "bold " : ""}10px "Plus Jakarta Sans"` 
        : `bold 11px "Plus Jakarta Sans"`;
      ctx.textAlign = "center";
      
      // Draw text with shadow background for readability
      const labelText = node.label.length > 20 ? node.label.substring(0, 18) + "..." : node.label;
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 4;
      ctx.fillText(labelText, node.x, node.y + node.radius + 14);
      ctx.shadowColor = "transparent"; // Reset shadow
    });

    ctx.restore();
  }, [nodes, edges, hoveredNode, pan, zoom]);

  // Utility to map screen coordinates to graph coordinates
  const getGraphCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Revert translate(pan.x + width/2, pan.y + height/2) and scale(zoom)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const graphX = (x - pan.x - centerX) / zoom + centerX;
    const graphY = (y - pan.y - centerY) / zoom + centerY;

    return { x: graphX, y: graphY };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = getGraphCoords(e.clientX, e.clientY);
    
    // Check if clicked a node
    const clickedNode = nodes.find(node => {
      const dx = node.x - coords.x;
      const dy = node.y - coords.y;
      return Math.sqrt(dx * dx + dy * dy) < node.radius + 5;
    });

    if (clickedNode) {
      setDraggedNode(clickedNode);
    } else {
      // Start panning background
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const coords = getGraphCoords(e.clientX, e.clientY);

    if (draggedNode) {
      // Move node directly
      setNodes(prev => prev.map(n => {
        if (n.id === draggedNode.id) {
          return { ...n, x: coords.x, y: coords.y, vx: 0, vy: 0 };
        }
        return n;
      }));
    } else if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    } else {
      // Check for hover
      const node = nodes.find(n => {
        const dx = n.x - coords.x;
        const dy = n.y - coords.y;
        return Math.sqrt(dx * dx + dy * dy) < n.radius + 5;
      });
      setHoveredNode(node || null);
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (draggedNode) {
      // If it's a note node, and we barely dragged it, open it!
      const coords = getGraphCoords(e.clientX, e.clientY);
      const dx = draggedNode.x - coords.x;
      const dy = draggedNode.y - coords.y;
      const dragDist = Math.sqrt(dx * dx + dy * dy);

      if (dragDist < 5 && draggedNode.isNote) {
        onOpenNote(draggedNode.id);
      }
      setDraggedNode(null);
    }
    setIsPanning(false);
  };

  return (
    <div id="knowledge-graph-view" className="space-y-6 pb-12">
      {/* Intro info bar */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-500 animate-pulse" />
            Rede de Conhecimento (Grafo Obsidian)
          </h2>
          <p className="text-xs text-slate-500">
            Abaixo, a IA conecta automaticamente seus cadernos de estudo. Assuntos com as mesmas tags e categorias se atraem, criando conexões neurais. Clique em qualquer nota para ir direto ao assunto!
          </p>
        </div>

        {/* Toolbar controls */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setZoom(z => Math.min(2, z + 0.15))}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100"
            title="Aumentar Zoom"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button 
            onClick={() => setZoom(z => Math.max(0.5, z - 0.15))}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100"
            title="Diminuir Zoom"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button 
            onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); }}
            className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl transition-all border border-slate-100"
            title="Centralizar Câmera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div 
        ref={containerRef}
        className="relative bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-inner h-[500px]"
      >
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { setDraggedNode(null); setIsPanning(false); setHoveredNode(null); }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* Floating instruction tooltip */}
        <div className="absolute bottom-4 left-4 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] text-slate-500 font-sans flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5" />
          Arraste os círculos para organizar. Dê clique simples nas notas coloridas menores para abrir os estudos.
        </div>
      </div>

    </div>
  );
}
