import React, { useState } from "react";
import { UserStats, StudyNote } from "../types";
import { 
  AlertTriangle, 
  BookOpen, 
  Compass, 
  Calendar, 
  ArrowRight, 
  Sparkles, 
  Zap, 
  CheckCircle,
  HelpCircle,
  Clock
} from "lucide-react";
import { motion } from "motion/react";

interface StudyPlannerProps {
  stats: UserStats;
  notes: StudyNote[];
  onNavigateTo: (view: "library") => void;
  onOpenNote: (id: string) => void;
}

export default function StudyPlanner({ stats, notes, onNavigateTo, onOpenNote }: StudyPlannerProps) {
  // Pomodoro interactive state
  const [pomodoroSeconds, setPomodoroSeconds] = useState(1500); // 25 * 60
  const [pomodoroActive, setPomodoroActive] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"study" | "break">("study");
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const togglePomodoro = () => {
    if (pomodoroActive) {
      setPomodoroActive(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } else {
      setPomodoroActive(true);
      timerRef.current = setInterval(() => {
        setPomodoroSeconds(prev => {
          if (prev <= 1) {
            setPomodoroActive(false);
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            if (pomodoroMode === "study") {
              setPomodoroMode("break");
              return 300; // 5 minute break
            } else {
              setPomodoroMode("study");
              return 1500; // 25 minute study
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const resetPomodoro = () => {
    setPomodoroActive(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPomodoroMode("study");
    setPomodoroSeconds(1500);
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Sort mistakes to find weakest subjects
  const weakestSubjects = Object.entries(stats.mistakesBySubject)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);

  // Find a note to recommend based on weakest subject
  const getWeakestSubjectNote = (subjectName: string): StudyNote | undefined => {
    return notes.find(n => n.subject === subjectName);
  };

  // Generate automated study suggestions
  const dynamicStudyPlan = weakestSubjects.map(([subjectName, mistakesCount], idx) => {
    const matchingNote = getWeakestSubjectNote(subjectName);
    
    let recommendation = "";
    let reason = `Você registrou ${mistakesCount} erro(s) em quizzes recentes de ${subjectName}.`;

    if (subjectName === "Matemática") {
      recommendation = "Revisar álgebra fundamental e praticar Quizzes e Desafios de Prova adicionais hoje.";
    } else if (subjectName === "Biologia") {
      recommendation = "Utilizar o mapa mental para fixar o fluxo celular e fazer revisões com flashcards.";
    } else if (subjectName === "História") {
      recommendation = "Ativar o Professor Virtual em Modo Prova Oral para responder perguntas dissertativas guiadas.";
    } else {
      recommendation = `Criar ou revisar materiais de ${subjectName} focando nos conceitos-chave identificados pelo glossário.`;
    }

    return {
      id: `plan-${idx}`,
      subject: subjectName,
      mistakes: mistakesCount,
      reason: reason,
      recommendation: recommendation,
      noteId: matchingNote?.id,
      noteTitle: matchingNote?.title
    };
  });

  return (
    <div id="study-planner-view" className="space-y-8 pb-12">
      
      {/* Planner Header Banner */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
            <Compass className="w-5 h-5 text-blue-500" />
            Plano de Estudos Inteligente Automático
          </h2>
          <p className="text-xs text-slate-500">
            A IA analisa constantemente suas respostas nos quizzes e cria planos adaptativos personalizados. Priorizamos o que você mais erra para garantir o melhor desempenho.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left pane: Weakest areas and daily suggestions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              Prioridades de Foco Recomendas
            </h3>

            {dynamicStudyPlan.length === 0 ? (
              <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">Tudo equilibrado!</p>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto">Você ainda não acumulou erros suficientes em nenhuma matéria para exigir prioridade. Continue praticando!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {dynamicStudyPlan.map((item, i) => (
                  <div 
                    key={item.id}
                    className="p-5 bg-rose-50/20 border border-rose-100/30 rounded-2xl space-y-4 hover:border-rose-100 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-rose-100/20">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-600 px-2 h-5 rounded-full inline-flex items-center">
                          {item.subject}
                        </span>
                        <span className="text-xs font-extrabold text-slate-700">Prioridade de Foco #{i + 1}</span>
                      </div>
                      <span className="text-xs font-semibold text-rose-600 bg-white px-2.5 h-6 rounded-md border border-rose-100/50 inline-flex items-center gap-1">
                        {item.mistakes} erros recentes
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <p className="text-slate-500"><strong className="text-slate-600">Análise de Desempenho:</strong> {item.reason}</p>
                      <p className="text-slate-700 leading-relaxed"><strong className="text-slate-800">Diretriz da IA:</strong> {item.recommendation}</p>
                    </div>

                    {item.noteId ? (
                      <div className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-blue-500" />
                          <div className="text-left">
                            <p className="text-[10px] font-bold text-slate-400">MATERIAL DISPONÍVEL</p>
                            <p className="text-xs font-bold text-slate-700 truncate max-w-[200px] sm:max-w-xs">{item.noteTitle}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => onOpenNote(item.noteId!)}
                          className="px-3 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          Revisar
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="text-left space-y-0.5">
                          <p className="text-[10px] font-bold text-slate-400">NENHUM MATERIAL NA BIBLIOTECA</p>
                          <p className="text-xs text-slate-600 leading-relaxed">Você ainda não tem cadernos salvos sobre esta matéria.</p>
                        </div>
                        <button
                          onClick={() => onNavigateTo("library")}
                          className="px-3 h-8 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold transition-all cursor-pointer"
                        >
                          Importar Caderno
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right pane: Educational tips for memory consolidation */}
        <div className="space-y-6">
          {/* Active recall & Pomodoro recommendations */}
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-blue-500 fill-blue-50" />
              Técnicas de Memorização Ativa
            </h3>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">1. Leitner Box System (Flashcards)</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Pratique seus flashcards diariamente. Ao classificar um flashcard como correto, o sistema espaçará a próxima revisão. O cérebro consolida memórias na fase de quase-esquecimento!
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">2. Técnica de Auto-Explicação (Feynman)</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Utilize o <span className="font-semibold">Professor Virtual</span> em chat livre e tente explicar o assunto com suas próprias palavras. Deixe a IA avaliar e preencher suas lacunas conceituais.
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-700">3. Treino sob Estresse do ENEM</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Questões contextualizadas exigem habilidades de interpretação. Tente fazer um simulado ENEM semanalmente para aprender a gerenciar o tempo de leitura de forma ótima.
                </p>
              </div>
            </div>
          </div>

          {/* Pomodoro Timer Widget */}
          <div className="bg-linear-to-r from-blue-500 to-blue-600 text-white rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
            <div className="space-y-1 relative z-10">
              <div className="inline-flex items-center gap-1 bg-white/20 px-2.5 h-6 rounded-full text-[10px] font-bold">
                <Clock className="w-3.5 h-3.5" />
                Ciclo Pomodoro ({pomodoroMode === "study" ? "Foco" : "Descanso"})
              </div>
              <h4 className="text-sm font-extrabold font-sans">Bloquear Foco de Estudos</h4>
              <p className="text-xs text-blue-100">
                {pomodoroMode === "study" 
                  ? "Estude focado por 25 minutos seguidos e descanse por 5 minutos. Isso maximiza sua plasticidade sináptica!" 
                  : "Parabéns! Faça uma pausa saudável de 5 minutos antes do próximo ciclo."}
              </p>
            </div>
            
            <div className="flex items-center justify-between pt-2 relative z-10">
              <span className="text-2xl font-mono font-extrabold text-white/90">{formatTime(pomodoroSeconds)}</span>
              <div className="flex gap-2">
                <button 
                  onClick={togglePomodoro}
                  className="px-3.5 h-8 bg-white text-blue-600 hover:bg-blue-50 text-xs font-bold rounded-lg transition-all cursor-pointer shadow-xs"
                >
                  {pomodoroActive ? "Pausar" : "Iniciar"}
                </button>
                <button 
                  onClick={resetPomodoro}
                  className="px-2.5 h-8 bg-blue-700/60 hover:bg-blue-700/80 text-white text-xs font-bold rounded-lg transition-all cursor-pointer border border-blue-400/20"
                  title="Reiniciar timer"
                >
                  Zerar
                </button>
              </div>
            </div>

            <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 opacity-10">
              <Clock className="w-32 h-32" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
