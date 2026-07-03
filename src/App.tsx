import React, { useState, useEffect } from "react";
import { StudyNote, UserStats } from "./types";
import { INITIAL_NOTES, INITIAL_STATS } from "./initialData";
import Dashboard from "./components/Dashboard";
import Library from "./components/Library";
import KnowledgeGraph from "./components/KnowledgeGraph";
import StudyPlanner from "./components/StudyPlanner";
import StudyNoteView from "./components/StudyNoteView";
import { 
  Compass, 
  BookOpen, 
  Network, 
  LayoutDashboard, 
  Flame, 
  Clock, 
  Sparkles, 
  Menu, 
  X,
  Bookmark,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Cloud
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [activeView, setActiveView] = useState<"dashboard" | "library" | "graph" | "planner">("dashboard");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Onboarding state
  const [onboarding, setOnboarding] = useState<{
    createNote: boolean;
    reviewFlashcards: boolean;
    takeQuiz: boolean;
    chatProfessor: boolean;
  }>(() => {
    const saved = localStorage.getItem("estudaia_onboarding_v4");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      createNote: false,
      reviewFlashcards: false,
      takeQuiz: false,
      chatProfessor: false,
    };
  });

  const completeOnboardingTask = (taskKey: "createNote" | "reviewFlashcards" | "takeQuiz" | "chatProfessor") => {
    setOnboarding(prev => {
      if (prev[taskKey]) return prev;
      const updated = { ...prev, [taskKey]: true };
      localStorage.setItem("estudaia_onboarding_v4", JSON.stringify(updated));
      return updated;
    });
  };

  // Load from LocalStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem("estudaia_notes_v4");
    const savedStats = localStorage.getItem("estudaia_stats_v4");

    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error("Erro ao carregar notas do localStorage", e);
        setNotes(INITIAL_NOTES);
      }
    } else {
      setNotes(INITIAL_NOTES);
      localStorage.setItem("estudaia_notes_v4", JSON.stringify(INITIAL_NOTES));
    }

    if (savedStats) {
      try {
        setStats(JSON.parse(savedStats));
      } catch (e) {
        console.error("Erro ao carregar estatísticas do localStorage", e);
        setStats(INITIAL_STATS);
      }
    } else {
      setStats(INITIAL_STATS);
      localStorage.setItem("estudaia_stats_v4", JSON.stringify(INITIAL_STATS));
    }
  }, []);

  // Sync back to local storage
  const syncNotes = (updatedNotes: StudyNote[]) => {
    setNotes(updatedNotes);
    localStorage.setItem("estudaia_notes_v4", JSON.stringify(updatedNotes));
  };

  const syncStats = (updatedStats: UserStats) => {
    setStats(updatedStats);
    localStorage.setItem("estudaia_stats_v4", JSON.stringify(updatedStats));
  };

  // Export backup JSON
  const handleExportBackup = () => {
    const backupData = {
      notes,
      stats,
      onboarding,
      version: "1.0",
      exportedAt: new Date().toISOString()
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `estudaia_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import backup JSON
  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = event.target.files?.[0];
    if (!file) return;

    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        if (parsed && Array.isArray(parsed.notes)) {
          syncNotes(parsed.notes);
          if (parsed.stats) {
            syncStats(parsed.stats);
          }
          if (parsed.onboarding) {
            setOnboarding(parsed.onboarding);
            localStorage.setItem("estudaia_onboarding_v4", JSON.stringify(parsed.onboarding));
          }
        }
      } catch (err) {
        console.error("Erro ao ler arquivo de backup", err);
      }
    };
    fileReader.readAsText(file);
  };

  // Reset to empty/clean slate
  const handleResetToClean = () => {
    syncNotes([]);
    const cleanStats = {
      ...INITIAL_STATS,
      subjectProgress: {},
      mistakesBySubject: {},
      totalQuizzesTaken: 0,
      totalCorrectAnswers: 0,
      quizAccuracy: 0,
      contentsLearned: 0,
      totalTimeStudied: 0
    };
    syncStats(cleanStats);
    
    const cleanOnboarding = {
      createNote: false,
      reviewFlashcards: false,
      takeQuiz: false,
      chatProfessor: false,
    };
    setOnboarding(cleanOnboarding);
    localStorage.setItem("estudaia_onboarding_v4", JSON.stringify(cleanOnboarding));
    
    setSelectedNoteId(null);
  };

  // Reset to original samples
  const handleResetToSamples = () => {
    syncNotes(INITIAL_NOTES);
    syncStats(INITIAL_STATS);
    
    const cleanOnboarding = {
      createNote: false,
      reviewFlashcards: false,
      takeQuiz: false,
      chatProfessor: false,
    };
    setOnboarding(cleanOnboarding);
    localStorage.setItem("estudaia_onboarding_v4", JSON.stringify(cleanOnboarding));

    setSelectedNoteId(null);
  };

  // State callbacks
  const handleAddNote = (newNote: StudyNote) => {
    const nextNotes = [newNote, ...notes];
    syncNotes(nextNotes);
    completeOnboardingTask("createNote");

    // Increment learned contents statistics and set streak
    const today = new Date().toISOString().split("T")[0];
    const updatedStats = { ...stats };
    updatedStats.contentsLearned += 1;
    updatedStats.totalTimeStudied += 25; // simulate 25 mins studied for uploading/generating!

    if (!updatedStats.lastStudyDate) {
      updatedStats.streak = 1;
      updatedStats.lastStudyDate = today;
    } else if (updatedStats.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (updatedStats.lastStudyDate === yesterdayStr) {
        updatedStats.streak += 1;
      } else {
        updatedStats.streak = 1;
      }
      updatedStats.lastStudyDate = today;
    } else {
      if (updatedStats.streak === 0) {
        updatedStats.streak = 1;
      }
    }
    syncStats(updatedStats);
  };

  const handleDeleteNote = (id: string) => {
    const nextNotes = notes.filter(n => n.id !== id);
    syncNotes(nextNotes);
    if (selectedNoteId === id) {
      setSelectedNoteId(null);
    }
  };

  const handleUpdateNote = (updatedNote: StudyNote) => {
    const nextNotes = notes.map(n => n.id === updatedNote.id ? updatedNote : n);
    syncNotes(nextNotes);

    // Increment streak & study statistics on active reviews (like rating a flashcard)
    const today = new Date().toISOString().split("T")[0];
    const updatedStats = { ...stats };
    updatedStats.totalTimeStudied += 1; // 1 min per card active review

    if (!updatedStats.lastStudyDate) {
      updatedStats.streak = 1;
      updatedStats.lastStudyDate = today;
    } else if (updatedStats.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (updatedStats.lastStudyDate === yesterdayStr) {
        updatedStats.streak += 1;
      } else {
        updatedStats.streak = 1;
      }
      updatedStats.lastStudyDate = today;
    } else {
      if (updatedStats.streak === 0) {
        updatedStats.streak = 1;
      }
    }
    syncStats(updatedStats);
  };

  // Record quiz attempts and update adaptive study parameters
  const handleRecordQuizAttempt = (subject: string, correct: boolean) => {
    const today = new Date().toISOString().split("T")[0];
    const updatedStats = { ...stats };
    
    // Increment stats counters
    updatedStats.totalQuizzesTaken += 1;
    if (correct) {
      updatedStats.totalCorrectAnswers += 1;
    } else {
      // Increment mistakes counter for the subject
      updatedStats.mistakesBySubject[subject] = (updatedStats.mistakesBySubject[subject] || 0) + 1;
    }

    // Re-calculate accuracy
    updatedStats.quizAccuracy = Math.round((updatedStats.totalCorrectAnswers / (updatedStats.totalQuizzesTaken * 4)) * 100);

    // Dynamic progress increase for correct answers
    if (correct) {
      const currentProg = updatedStats.subjectProgress[subject] || 0;
      updatedStats.subjectProgress[subject] = Math.min(100, currentProg + 10);
    }

    // Update streak and lastStudyDate
    if (!updatedStats.lastStudyDate) {
      updatedStats.streak = 1;
      updatedStats.lastStudyDate = today;
    } else if (updatedStats.lastStudyDate !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      if (updatedStats.lastStudyDate === yesterdayStr) {
        updatedStats.streak += 1;
      } else {
        updatedStats.streak = 1;
      }
      updatedStats.lastStudyDate = today;
    } else {
      if (updatedStats.streak === 0) {
        updatedStats.streak = 1;
      }
    }

    syncStats(updatedStats);
  };

  // Get active selected note object
  const activeNote = notes.find(n => n.id === selectedNoteId);

  // Navigation array
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "library", label: "Biblioteca (Notion)", icon: BookOpen },
    { id: "graph", label: "Grafo Conexões", icon: Network },
    { id: "planner", label: "Plano de Estudos", icon: Compass }
  ];

  const handleNavigate = (view: "dashboard" | "library" | "graph" | "planner") => {
    setSelectedNoteId(null);
    setActiveView(view);
    setIsMobileMenuOpen(false);
  };

  const handleOpenNoteDirectly = (id: string) => {
    setSelectedNoteId(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div id="app-root" className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-800 antialiased">
      
      {/* Mobile Sticky Header */}
      <header className="md:hidden h-14 bg-white border-b border-slate-200/80 px-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-1.5">
          <div className="p-1.5 bg-blue-600 text-white rounded-lg">
            <Sparkles className="w-4 h-4 fill-white" />
          </div>
          <span className="font-sans font-extrabold text-sm tracking-tight bg-linear-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
            EstudaIA
          </span>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Sidebar Navigation - Desktop / Drawer Mobile */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0
        ${isMobileMenuOpen ? "translate-x-0 top-14 md:top-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <div className="space-y-6">
          {/* Brand Logo - Only Desktop */}
          <div className="hidden md:flex items-center gap-2 px-1">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-5 h-5 fill-white animate-pulse" />
            </div>
            <div>
              <span className="font-sans font-extrabold text-lg tracking-tight bg-linear-to-r from-blue-600 to-sky-600 bg-clip-text text-transparent">
                EstudaIA
              </span>
              <p className="text-[10px] text-slate-400 font-semibold font-sans tracking-wide">NOTION + OBSIDIAN + AI</p>
            </div>
          </div>

          {/* Quick Streak Widget */}
          <div className="bg-orange-50/50 border border-orange-100/50 p-4 rounded-2xl flex items-center gap-3">
            <div className="p-2 bg-orange-100/40 text-orange-600 rounded-xl">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold text-orange-800 uppercase tracking-wide">Minha Ofensiva</p>
              <p className="text-sm font-extrabold text-slate-800 leading-none mt-0.5">{stats.streak} Dias Seguidos</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navigationItems.map(item => {
              const IconComp = item.icon;
              const isActive = activeView === item.id && !selectedNoteId;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id as any)}
                  className={`w-full text-left px-3.5 h-11 rounded-xl text-xs font-bold flex items-center gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? "bg-blue-600 text-white shadow-xs" 
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <IconComp className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Backup & Save Management Card */}
          <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Cloud className="w-3.5 h-3.5 text-emerald-500 fill-emerald-50" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Auto-Salvamento</span>
              </div>
              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-sm">ATIVO</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Suas notas e progresso são salvos automaticamente no navegador.
            </p>
            
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              <button
                onClick={handleExportBackup}
                className="h-7 bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-extrabold rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1 shadow-2xs"
                title="Baixar arquivo de backup com todas as suas notas"
              >
                <Download className="w-3 h-3" />
                Exportar
              </button>
              
              <label
                className="h-7 bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-extrabold rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                title="Restaurar backup de arquivo JSON anterior"
              >
                <Upload className="w-3 h-3" />
                Importar
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5 pt-1.5 border-t border-slate-200/55">
              <button
                onClick={handleResetToClean}
                className="w-full h-7 hover:bg-red-50 text-red-600 hover:text-red-700 text-[9px] font-extrabold rounded-lg transition-all flex items-center justify-center gap-1"
                title="Apagar todas as notas para começar limpo"
              >
                <Trash2 className="w-3 h-3" />
                Começar do Zero (Limpar Tudo)
              </button>
              <button
                onClick={handleResetToSamples}
                className="w-full h-5 text-slate-400 hover:text-slate-600 text-[8px] font-bold transition-all flex items-center justify-center gap-1"
                title="Restaurar as notas padrão da plataforma"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Recarregar Notas Padrão
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer details */}
        <div className="pt-4 border-t border-slate-100 space-y-3">
          <div className="flex items-center gap-2 px-1 text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <div className="text-left leading-none">
              <span className="text-[10px] font-bold text-slate-400 block uppercase">Estudado Hoje</span>
              <span className="text-xs font-extrabold text-slate-800">35 minutos</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 px-1 font-sans leading-relaxed">
            Plataforma ativa de estudos do ENEM alimentada pelo modelo Google Gemini.
          </div>
        </div>
      </aside>

      {/* Main Study Arena View Container */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-[calc(100vh-56px)] md:max-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedNoteId ? `note-${selectedNoteId}` : activeView}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="max-w-6xl mx-auto"
          >
            {selectedNoteId && activeNote ? (
              /* Deep Study View of selected study note */
              <StudyNoteView 
                note={activeNote}
                onBack={() => setSelectedNoteId(null)}
                onUpdateNote={handleUpdateNote}
                onRecordQuizAttempt={handleRecordQuizAttempt}
                onCompleteOnboardingTask={completeOnboardingTask}
              />
            ) : (
              /* Render standard page views */
              <>
                {activeView === "dashboard" && (
                  <Dashboard 
                    stats={stats}
                    notes={notes}
                    onOpenNote={handleOpenNoteDirectly}
                    onNavigateTo={(view) => handleNavigate(view)}
                    onboarding={onboarding}
                    onCompleteOnboardingTask={completeOnboardingTask}
                  />
                )}
                
                {activeView === "library" && (
                  <Library 
                    notes={notes}
                    onOpenNote={handleOpenNoteDirectly}
                    onDeleteNote={handleDeleteNote}
                    onUpdateNote={handleUpdateNote}
                    onAddNote={handleAddNote}
                  />
                )}

                {activeView === "graph" && (
                  <KnowledgeGraph 
                    notes={notes}
                    onOpenNote={handleOpenNoteDirectly}
                  />
                )}

                {activeView === "planner" && (
                  <StudyPlanner 
                    stats={stats}
                    notes={notes}
                    onNavigateTo={(view) => handleNavigate(view)}
                    onOpenNote={handleOpenNoteDirectly}
                  />
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}
