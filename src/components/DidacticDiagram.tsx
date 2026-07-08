import React, { useState } from "react";
import { ArrowDown, Layers, Grid, Info } from "lucide-react";
import { motion } from "motion/react";
import { Diagram } from "../types";

interface DidacticDiagramProps {
  diagram: Diagram;
  key?: any;
}

export default function DidacticDiagram({ diagram }: DidacticDiagramProps) {
  const [viewMode, setViewMode] = useState<"visual" | "blueprint">("visual");

  const lines = diagram.diagramAscii.split("\n");

  const tokenizeLine = (line: string) => {
    const tokens: Array<{ type: "block" | "milestone" | "text" | "bullet"; content: string }> = [];
    let currentIndex = 0;

    const matches: Array<{ start: number; end: number; type: "block" | "milestone"; content: string }> = [];
    
    // Find blocks [...]
    const blockRegex = /\[([^\]]+)\]/g;
    let match;
    while ((match = blockRegex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: blockRegex.lastIndex,
        type: "block",
        content: match[1]
      });
    }

    // Find milestones (...)
    const mileRegex = /\(([^)]+)\)/g;
    while ((match = mileRegex.exec(line)) !== null) {
      matches.push({
        start: match.index,
        end: mileRegex.lastIndex,
        type: "milestone",
        content: match[1]
      });
    }

    // Sort matches
    matches.sort((a, b) => a.start - b.start);

    matches.forEach(m => {
      if (m.start > currentIndex) {
        const textBetween = line.substring(currentIndex, m.start);
        if (textBetween.trim()) {
          tokens.push({ type: "text", content: textBetween });
        }
      }
      tokens.push({ type: m.type, content: m.content });
      currentIndex = m.end;
    });

    if (currentIndex < line.length) {
      const textEnd = line.substring(currentIndex);
      if (textEnd.trim()) {
        tokens.push({ type: "text", content: textEnd });
      }
    }

    // Bullet list detection
    if (tokens.length === 0 && line.trim()) {
      const bulletMatch = line.trim().match(/^[-*•]\s+(.+)$/);
      if (bulletMatch) {
        tokens.push({ type: "bullet", content: bulletMatch[1] });
      } else {
        tokens.push({ type: "text", content: line });
      }
    }

    return tokens;
  };

  const isPureConnector = (trimmedLine: string) => {
    if (!trimmedLine) return false;
    // Pure lines/arrows: e.g. |, v, V, ▼, +, -, >, <, ^, /, \ and whitespace
    return /^[|vV▼+\-\s><\\/]+$/.test(trimmedLine) && !trimmedLine.includes("[") && !trimmedLine.includes("(");
  };

  return (
    <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500 animate-pulse" />
            Diagrama Didático: {diagram.title}
          </h4>
          <p className="text-xs text-slate-500">
            Representação visual dinâmica dos processos e estruturas do assunto.
          </p>
        </div>

        {/* View toggle switch */}
        <div className="flex bg-slate-100 border border-slate-200/50 p-1 rounded-xl self-start sm:self-auto shadow-3xs">
          <button
            type="button"
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "visual"
                ? "bg-white text-emerald-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span>Fluxo Visual</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("blueprint")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              viewMode === "blueprint"
                ? "bg-white text-blue-600 shadow-3xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Croqui Blueprint</span>
          </button>
        </div>
      </div>

      {viewMode === "visual" ? (
        <div className="border border-slate-200/70 bg-[#FAF9F5] rounded-2xl p-6 shadow-inner select-none space-y-4 relative min-h-[250px] overflow-x-auto">
          {/* Subtle notebook pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px] opacity-40 rounded-2xl pointer-events-none" />

          <div className="relative space-y-2.5 flex flex-col items-center justify-center py-2 min-w-max md:min-w-0">
            {lines.map((line, idx) => {
              const trimmed = line.trim();
              if (!trimmed) {
                return <div key={idx} className="h-2" />;
              }

              if (isPureConnector(trimmed)) {
                return (
                  <div key={idx} className="flex items-center justify-center py-1">
                    <div className="flex flex-col items-center text-slate-300">
                      <div className="w-0.5 h-6 bg-slate-300/85 rounded-full" />
                      <ArrowDown className="w-3.5 h-3.5 text-slate-400 mt-[-2px]" />
                    </div>
                  </div>
                );
              }

              const tokens = tokenizeLine(line);

              return (
                <div key={idx} className="flex flex-wrap items-center justify-center gap-3 w-full py-1">
                  {tokens.map((token, tokenIdx) => {
                    if (token.type === "block") {
                      // Alternate gorgeous colors based on hash of content
                      const colors = [
                        { bg: "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-3xs", badge: "bg-emerald-500 text-white" },
                        { bg: "bg-blue-50 border-blue-200 text-blue-800 shadow-3xs", badge: "bg-blue-500 text-white" },
                        { bg: "bg-violet-50 border-violet-200 text-violet-800 shadow-3xs", badge: "bg-violet-500 text-white" },
                        { bg: "bg-amber-50 border-amber-200 text-amber-800 shadow-3xs", badge: "bg-amber-500 text-white" },
                        { bg: "bg-rose-50 border-rose-200 text-rose-800 shadow-3xs", badge: "bg-rose-500 text-white" },
                      ];
                      const hash = token.content.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
                      const style = colors[hash % colors.length];

                      return (
                        <motion.div
                          key={tokenIdx}
                          whileHover={{ scale: 1.02 }}
                          className={`px-4 py-2.5 border-1.5 rounded-2xl font-bold text-xs max-w-sm text-center leading-relaxed font-sans ${style.bg}`}
                        >
                          {token.content}
                        </motion.div>
                      );
                    }

                    if (token.type === "milestone") {
                      return (
                        <span 
                          key={tokenIdx}
                          className="px-2.5 py-1 bg-amber-100 border border-amber-200/60 rounded-full font-mono text-[10px] font-bold text-amber-800 uppercase tracking-wider"
                        >
                          {token.content}
                        </span>
                      );
                    }

                    if (token.type === "bullet") {
                      return (
                        <div 
                          key={tokenIdx}
                          className="px-3.5 py-1.5 bg-white border border-slate-200/80 rounded-xl text-[11px] font-semibold text-slate-700 flex items-center gap-2 font-sans shadow-3xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                          <span>{token.content}</span>
                        </div>
                      );
                    }

                    const contentTrimmed = token.content.trim();
                    if (contentTrimmed === "+" || contentTrimmed === "e" || contentTrimmed === "ou") {
                      return (
                        <span key={tokenIdx} className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center border border-slate-200 shrink-0">
                          {contentTrimmed}
                        </span>
                      );
                    }

                    if (contentTrimmed === "-->" || contentTrimmed === "->" || contentTrimmed === "—>") {
                      return (
                        <span key={tokenIdx} className="text-slate-300 font-bold shrink-0">➔</span>
                      );
                    }

                    return (
                      <span key={tokenIdx} className="text-xs font-semibold text-slate-500 leading-normal font-sans py-0.5">
                        {token.content}
                      </span>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Blueprint View */
        <div className="relative border border-blue-900 bg-[#0c1821] rounded-2xl p-6 shadow-inner overflow-hidden">
          {/* Grid lines pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(30,144,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(30,144,255,0.08)_1px,transparent_1px)] bg-[size:16px_16px] rounded-2xl pointer-events-none" />
          
          <div className="relative">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-900/50">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <p className="text-[10px] font-mono text-blue-400 font-bold tracking-widest uppercase">
                PROJETO DE FLUXO CONCEITUAL // COORD_Z_01
              </p>
            </div>
            <pre className="font-mono text-xs text-blue-300 overflow-x-auto leading-relaxed whitespace-pre select-all">
              <code>{diagram.diagramAscii}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Description */}
      <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl flex gap-3">
        <Info className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 font-sans leading-relaxed">{diagram.description}</p>
      </div>
    </div>
  );
}
