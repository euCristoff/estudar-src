import React, { useState } from "react";
import { UserStats, StudyNote } from "../types";
import { 
  BookOpen, 
  Flame, 
  Clock, 
  CheckCircle, 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Calendar, 
  ArrowRight,
  Sparkles,
  BookMarked,
  ChevronDown,
  ChevronUp,
  Check,
  Plus,
  MessageSquare,
  HelpCircle
} from "lucide-react";
import { motion } from "motion/react";

interface DashboardProps {
  stats: UserStats;
  notes: StudyNote[];
  onOpenNote: (id: string) => void;
  onNavigateTo: (view: "library" | "planner") => void;
  onboarding: {
    createNote: boolean;
    reviewFlashcards: boolean;
    takeQuiz: boolean;
    chatProfessor: boolean;
  };
  onCompleteOnboardingTask: (task: 'createNote' | 'reviewFlashcards' | 'takeQuiz' | 'chatProfessor') => void;
}

export default function Dashboard({ stats, notes, onOpenNote, onNavigateTo, onboarding, onCompleteOnboardingTask }: DashboardProps) {
  // Find pending spaced repetition reviews
  const pendingReviews = notes.filter(note => {
    if (!note.flashcards || note.flashcards.length === 0) return false;
    // Check if any flashcard is due
    return note.flashcards.some(fc => {
      return new Date(fc.nextReviewDate) <= new Date();
    });
  });

  // Calculate overall quiz accuracy
  const accuracy = stats.totalQuizzesTaken > 0 
    ? Math.round((stats.totalCorrectAnswers / (stats.totalQuizzesTaken * 4)) * 100) 
    : stats.quizAccuracy;

  // Study sequence of the day (e.g. review a pending note, read a favorite note, try a new quiz)
  const dailySequence = [
    {
      id: "seq-1",
      title: "Revisão Espaçada Pendente",
      description: pendingReviews.length > 0 
        ? `Você tem ${pendingReviews.length} nota(s) aguardando revisão.` 
        : "Nenhuma nota vencida! Parabéns por manter em dia.",
      completed: pendingReviews.length === 0,
      actionLabel: pendingReviews.length > 0 ? "Revisar Agora" : "Ver Biblioteca",
      action: () => pendingReviews.length > 0 ? onOpenNote(pendingReviews[0].id) : onNavigateTo("library")
    },
    {
      id: "seq-2",
      title: "Praticar Flashcards",
      description: "Pratique pelo menos 5 flashcards hoje para fixar a memória de longo prazo.",
      completed: stats.totalTimeStudied > 200,
      actionLabel: "Praticar",
      action: () => onNavigateTo("library")
    },
    {
      id: "seq-3",
      title: "Simulado de Prova",
      description: "Tente resolver um quiz ou questão do ENEM em suas notas favoritas.",
      completed: stats.totalQuizzesTaken > 15,
      actionLabel: "Fazer Quiz",
      action: () => onNavigateTo("library")
    }
  ];

  const [expandedTask, setExpandedTask] = useState<string | null>("createNote");
  
  const [hideCelebration, setHideCelebration] = useState(() => {
    return localStorage.getItem("estudaia_hide_celebration") === "true";
  });

  const onboardingTasks = [
    {
      id: "createNote" as const,
      title: "Importar ou Criar sua primeira matéria",
      shortDesc: "Envie um caderno, foto ou digite um assunto livre para a IA organizar.",
      instructions: "Vá para a aba 'Biblioteca' na barra lateral, clique no botão 'Importar Caderno / PDF' no topo direito, escolha um dos assuntos sugeridos (como Matemática ou História) e envie uma foto ou digite um assunto livre (ex: 'Fórmula de Bhaskara'). A IA gerará um caderno completo de estudos em segundos!",
      actionLabel: "Ir para a Biblioteca",
      action: () => onNavigateTo("library"),
      completed: onboarding.createNote,
    },
    {
      id: "reviewFlashcards" as const,
      title: "Praticar Flashcards Ativos",
      shortDesc: "Fixe a memória de longo prazo respondendo se lembrou do cartão.",
      instructions: "Entre em qualquer matéria da sua Biblioteca (como o nosso guia interativo 'Como Usar o EstudaIA'), selecione a aba 'Flashcards', tente responder mentalmente à pergunta e clique na carta para virá-la. Em seguida, selecione se você se lembrou ou errou para treinar seu aprendizado ativo!",
      actionLabel: "Acessar Biblioteca",
      action: () => onNavigateTo("library"),
      completed: onboarding.reviewFlashcards,
    },
    {
      id: "takeQuiz" as const,
      title: "Fazer um Simulado ou Quiz",
      shortDesc: "Verifique seu conhecimento com testes interativos explicados pela IA.",
      instructions: "Entre em uma matéria de sua Biblioteca, vá até a aba 'Praticar Quizzes', selecione uma das alternativas na questão e clique em 'Verificar Resposta'. Você verá uma explicação didática do erro/acerto instantaneamente!",
      actionLabel: "Responder Questões",
      action: () => onNavigateTo("library"),
      completed: onboarding.takeQuiz,
    },
    {
      id: "chatProfessor" as const,
      title: "Interagir com o Professor Virtual",
      shortDesc: "Tire dúvidas no chat ou peça uma simulação de Prova Oral.",
      instructions: "Entre em uma matéria, selecione a aba 'Professor Virtual' no topo, e digite qualquer pergunta ou selecione o modo 'Prova Oral' para que o professor faça perguntas orais interativas simuladas!",
      actionLabel: "Falar com Professor",
      action: () => onNavigateTo("library"),
      completed: onboarding.chatProfessor,
    }
  ];

  const allOnboardingCompleted = onboardingTasks.every(t => t.completed);

  // Subjects available
  const subjectsList = [
    { name: "Matemática", color: "bg-blue-500", textColor: "text-blue-500", bgLight: "bg-blue-50" },
    { name: "História", color: "bg-amber-500", textColor: "text-amber-500", bgLight: "bg-amber-50" },
    { name: "Biologia", color: "bg-emerald-500", textColor: "text-emerald-500", bgLight: "bg-emerald-50" },
    { name: "Geografia", color: "bg-indigo-500", textColor: "text-indigo-500", bgLight: "bg-indigo-50" },
    { name: "Português", color: "bg-rose-500", textColor: "text-rose-500", bgLight: "bg-rose-50" },
    { name: "Física", color: "bg-cyan-500", textColor: "text-cyan-500", bgLight: "bg-cyan-50" },
    { name: "Química", color: "bg-purple-500", textColor: "text-purple-500", bgLight: "bg-purple-50" },
    { name: "Inglês", color: "bg-orange-500", textColor: "text-orange-500", bgLight: "bg-orange-50" }
  ];

  return (
    <div id="dashboard-view" className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div id="welcome-banner" className="relative overflow-hidden rounded-3xl bg-linear-to-r from-blue-700 via-sky-600 to-indigo-600 p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 h-7 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            Tecnologia de Aprendizado Ativo
          </div>
          <h1 className="font-sans text-3xl md:text-4xl font-extrabold tracking-tight">
            Olá, Estudante do Futuro!
          </h1>
          <p className="text-indigo-100 font-sans text-sm md:text-base">
            Seu assistente de Inteligência Artificial está pronto para transformar qualquer caderno, foto de livro ou PDF em uma jornada interativa de aprendizado de alta performance.
          </p>
        </div>
        <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 opacity-10">
          <BookOpen className="w-80 h-80" />
        </div>
      </div>

      {/* Main Stats Grid */}
      <div id="stats-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Streak / Ofensiva */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4"
        >
          <div className="p-3 bg-orange-50 text-orange-500 rounded-xl">
            <Flame className="w-6 h-6 fill-current" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium font-sans">Ofensiva Diária</p>
            <p className="text-2xl font-bold text-slate-800 font-sans">{stats.streak} dias</p>
          </div>
        </motion.div>

        {/* Studied Time */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium font-sans">Tempo de Estudo</p>
            <p className="text-2xl font-bold text-slate-800 font-sans">{stats.totalTimeStudied} min</p>
          </div>
        </motion.div>

        {/* Contents Learned */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4"
        >
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-xl">
            <BookMarked className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium font-sans">Notas na Biblioteca</p>
            <p className="text-2xl font-bold text-slate-800 font-sans">{notes.length} matérias</p>
          </div>
        </motion.div>

        {/* Quiz Accuracy */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white border border-slate-100 p-5 rounded-2xl shadow-xs flex items-center gap-4"
        >
          <div className="p-3 bg-blue-50 text-blue-500 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium font-sans">Acertos nos Quizzes</p>
            <p className="text-2xl font-bold text-slate-800 font-sans">{accuracy}%</p>
          </div>
        </motion.div>
      </div>

      {/* Main Content Layout: Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Columns - Study Sequence & Reviews */}
        <div className="lg:col-span-2 space-y-8">
          {/* Onboarding Checklist / Daily Study Sequence */}
          {!allOnboardingCompleted ? (
            <div className="bg-white border border-blue-100 rounded-3xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500 fill-blue-50" />
                  Primeiros Passos ({onboardingTasks.filter(t => t.completed).length}/4)
                </h2>
                <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full font-bold">Guia Inicial</span>
              </div>
              
              <div className="space-y-3">
                {onboardingTasks.map((task, i) => (
                  <div 
                    key={task.id}
                    className={`border rounded-xl transition-all overflow-hidden ${
                      task.completed 
                        ? "bg-slate-50/70 border-slate-100 opacity-75" 
                        : expandedTask === task.id
                          ? "bg-white border-blue-300 shadow-2xs" 
                          : "bg-white border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <button
                      onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
                      className="w-full p-4 flex items-center justify-between text-left gap-3 cursor-pointer"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {task.completed ? (
                            <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border border-slate-300 flex items-center justify-center text-[10px] font-bold text-slate-400">
                              {i + 1}
                            </div>
                          )}
                        </div>
                        <div className="truncate">
                          <h3 className={`font-bold text-sm ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                            {task.title}
                          </h3>
                          <p className="text-xs text-slate-400 font-medium truncate">{task.shortDesc}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-slate-400">
                        {expandedTask === task.id ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {expandedTask === task.id && (
                      <div className="px-4 pb-4 pt-1 border-t border-slate-50 bg-blue-50/5">
                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {task.instructions}
                        </p>
                        <div className="mt-3 flex">
                          <button
                            onClick={task.action}
                            className="px-3.5 h-7.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer"
                          >
                            {task.actionLabel}
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : !hideCelebration ? (
            <div className="bg-linear-to-r from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h2 className="text-lg font-extrabold flex items-center justify-center md:justify-start gap-1.5">
                  🎉 Parabéns, Você Concluiu os Passos Básicos!
                </h2>
                <p className="text-xs text-emerald-50 leading-relaxed">
                  Você aprendeu as mecânicas fundamentais do EstudaIA e está totalmente pronto para estudar em alto rendimento!
                </p>
              </div>
              <button
                onClick={() => {
                  setHideCelebration(true);
                  localStorage.setItem("estudaia_hide_celebration", "true");
                }}
                className="px-5 h-9 bg-white hover:bg-emerald-50 text-emerald-700 font-extrabold text-xs rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
              >
                Entendido, Ocultar Guia
              </button>
            </div>
          ) : (
            /* Daily study sequence is rendered once onboarding is completed and dismissed */
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Sequência de Estudos do Dia
                </h2>
                <span className="text-xs text-slate-400 font-sans">Atualizado hoje</span>
              </div>
              
              <div className="space-y-3">
                {dailySequence.map((item, i) => (
                  <div 
                    key={item.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all ${
                      item.completed 
                        ? "bg-slate-50 border-slate-100 opacity-75" 
                        : "bg-white border-slate-100 hover:border-slate-200 shadow-2xs"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {item.completed ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center text-xs font-bold text-blue-500">
                            {i + 1}
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold text-sm ${item.completed ? "text-slate-500 line-through" : "text-slate-800"}`}>
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                    {!item.completed && (
                      <button 
                        onClick={item.action}
                        className="mt-3 sm:mt-0 px-4 h-8 text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {item.actionLabel}
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending Reviews Space */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
              Revisões Pendentes (Método de Repetição Espaçada)
            </h2>
            {pendingReviews.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 rounded-xl space-y-2 border border-dashed border-slate-200">
                <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700">Tudo em dia!</p>
                <p className="text-xs text-slate-500">A IA calculará automaticamente o momento certo de revisar seus flashcards para fixar na memória.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pendingReviews.map(note => (
                  <div 
                    key={note.id} 
                    className="p-4 border border-slate-100 rounded-xl hover:border-blue-100 bg-white shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 h-4 rounded-full bg-blue-50 text-blue-600 inline-flex items-center">
                          {note.subject}
                        </span>
                        <span className="text-xs text-red-500 font-semibold font-sans">Vencida</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-800 leading-tight mb-1">{note.title}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2">{note.summary}</p>
                    </div>
                    <button 
                      onClick={() => onOpenNote(note.id)}
                      className="mt-3 w-full h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all cursor-pointer"
                    >
                      Revisar {note.flashcards.length} Flashcards
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Subject Progress & Mistakes Analysis */}
        <div className="space-y-8">
          {/* Subject Progress Panel */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500" />
              Progresso por Matéria
            </h2>
            <div className="space-y-3.5">
              {subjectsList.map(subj => {
                const prog = stats.subjectProgress[subj.name] || 0;
                return (
                  <div key={subj.name} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700">{subj.name}</span>
                      <span className="font-bold text-slate-500">{prog}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${subj.color} rounded-full transition-all duration-500`}
                        style={{ width: `${prog}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mistakes Analysis & Autoplan Trigger */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <h2 className="text-lg font-bold text-slate-800 font-sans flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Análise de Erros por Matéria
            </h2>
            <p className="text-xs text-slate-500">
              Abaixo estão listadas as matérias nas quais você teve mais dificuldades em quizzes recentes.
            </p>
            
            <div className="space-y-3">
              {Object.entries(stats.mistakesBySubject).some(([_, val]) => val > 0) ? (
                Object.entries(stats.mistakesBySubject)
                  .sort((a, b) => b[1] - a[1])
                  .map(([subjName, count]) => {
                    const matchedSubj = subjectsList.find(s => s.name === subjName) || { bgLight: "bg-slate-50", textColor: "text-slate-600" };
                    return (
                      <div key={subjName} className={`flex items-center justify-between p-3 rounded-xl ${matchedSubj.bgLight}`}>
                        <span className={`text-xs font-bold ${matchedSubj.textColor}`}>{subjName}</span>
                        <span className="text-xs font-semibold bg-white/80 px-2.5 h-6 rounded-md border border-slate-100 inline-flex items-center gap-1 font-mono text-rose-600">
                          {count} erros
                        </span>
                      </div>
                    );
                  })
              ) : (
                <div className="text-center py-4 bg-slate-50 rounded-xl text-xs text-slate-500 border border-dashed border-slate-200">
                  Nenhum erro registrado ainda! Complete quizzes para treinar.
                </div>
              )}
            </div>

            <button 
              onClick={() => onNavigateTo("planner")}
              className="w-full py-2.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Ver Plano de Estudos Inteligente
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
