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
  Cloud,
  User,
  Shield,
  Edit3,
  Check,
  Copy,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [notes, setNotes] = useState<StudyNote[]>([]);
  const [stats, setStats] = useState<UserStats>(INITIAL_STATS);
  const [activeView, setActiveView] = useState<"dashboard" | "library" | "graph" | "planner">("dashboard");
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  
  // Mobile navigation drawer toggle
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Student Local Profile states
  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem("estudaia_student_name") || "Estudante";
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(studentName);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [modalTab, setModalTab] = useState<"info" | "sync">("info");

  // Global non-blocking Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [pasteInputCode, setPasteInputCode] = useState("");

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  // Toast auto-clear effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (trimmed) {
      setStudentName(trimmed);
      localStorage.setItem("estudaia_student_name", trimmed);
      showToast("Nome de estudante atualizado!", "success");
    }
    setIsEditingName(false);
  };

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
    let savedNotes = localStorage.getItem("estudaia_notes_v4");
    let savedStats = localStorage.getItem("estudaia_stats_v4");

    // Migration / backward compatibility check for previous version keys
    if (!savedNotes) {
      savedNotes = localStorage.getItem("estudaia_notes_v3") || 
                   localStorage.getItem("estudaia_notes_v2") || 
                   localStorage.getItem("estudaia_notes_v1") || 
                   localStorage.getItem("estudaia_notes") ||
                   localStorage.getItem("study_notes") ||
                   localStorage.getItem("notes");
    }
    if (!savedStats) {
      savedStats = localStorage.getItem("estudaia_stats_v3") || 
                   localStorage.getItem("estudaia_stats_v2") || 
                   localStorage.getItem("estudaia_stats_v1") || 
                   localStorage.getItem("estudaia_stats") ||
                   localStorage.getItem("stats");
    }

    if (savedNotes) {
      try {
        const parsedNotes = JSON.parse(savedNotes);
        setNotes(parsedNotes);
        // Guarantee synchronization with the current storage key v4
        localStorage.setItem("estudaia_notes_v4", JSON.stringify(parsedNotes));
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
        const parsedStats = JSON.parse(savedStats);
        setStats(parsedStats);
        // Guarantee synchronization with the current storage key v4
        localStorage.setItem("estudaia_stats_v4", JSON.stringify(parsedStats));
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
    try {
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
      showToast("Arquivo de backup .json baixado com sucesso!", "success");
    } catch (e) {
      console.error(e);
      showToast("Erro ao exportar arquivo de backup.", "error");
    }
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
          showToast("Progresso importado do arquivo .json com sucesso!", "success");
        } else {
          showToast("O arquivo não parece um backup do EstudaIA válido.", "error");
        }
      } catch (err) {
        console.error("Erro ao ler arquivo de backup", err);
        showToast("Erro ao ler arquivo JSON de backup.", "error");
      }
    };
    fileReader.readAsText(file);
  };

  // Copy backup as Base64 code string (excellent for mobile or crossing preview bounds)
  const handleCopyBackupCode = () => {
    try {
      const backupData = {
        notes,
        stats,
        onboarding,
        version: "1.0",
        exportedAt: new Date().toISOString()
      };
      const jsonStr = JSON.stringify(backupData);
      // Safe unicode base64 encoding
      const b64 = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode(parseInt(p1, 16));
      }));
      navigator.clipboard.writeText(b64);
      showToast("Código de backup copiado! Guarde-o em segurança para restaurar depois.", "success");
    } catch (e) {
      console.error(e);
      showToast("Não foi possível gerar o código de backup.", "error");
    }
  };

  // Import backup from Base64 code string
  const handleImportBackupCode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) {
      showToast("Cole o código de backup antes de clicar em Importar.", "error");
      return;
    }
    try {
      // Safe unicode base64 decoding
      const jsonStr = decodeURIComponent(atob(trimmed).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const parsed = JSON.parse(jsonStr);
      if (parsed && Array.isArray(parsed.notes)) {
        syncNotes(parsed.notes);
        if (parsed.stats) {
          syncStats(parsed.stats);
        }
        if (parsed.onboarding) {
          setOnboarding(parsed.onboarding);
          localStorage.setItem("estudaia_onboarding_v4", JSON.stringify(parsed.onboarding));
        }
        showToast("Progresso restaurado com sucesso através do código!", "success");
        setPasteInputCode("");
      } else {
        showToast("O código fornecido é inválido ou está incompleto.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Código corrompido ou mal formatado. Certifique-se de colar o código completo.", "error");
    }
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
    showToast("Todo o progresso local foi limpo e apagado.", "info");
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
    showToast("Cadernos e estatísticas padrão recarregados com sucesso!", "success");
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
      
      {/* Toast Alert Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4.5 py-3 rounded-2xl shadow-xl border text-xs font-bold ${
              toast.type === "success" 
                ? "bg-slate-900 border-emerald-500/30 text-emerald-400" 
                : toast.type === "error" 
                ? "bg-rose-950 border-rose-500/30 text-rose-400" 
                : "bg-slate-900 border-slate-700 text-slate-300"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-current shrink-0 animate-pulse"></span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

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

          {/* Local User Account Profile Widget */}
          <div className="bg-slate-50 border border-slate-100/70 rounded-2xl p-3.5 flex flex-col gap-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-1.5">
              <div className="flex items-center gap-2 truncate">
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-extrabold text-sm border border-blue-200 shrink-0">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-left truncate">
                  {isEditingName ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                        className="w-24 text-[11px] font-bold border border-blue-300 rounded px-1.5 py-0.5 bg-white focus:outline-none"
                        autoFocus
                      />
                      <button
                        onClick={handleSaveName}
                        className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 group">
                      <span className="text-xs font-extrabold text-slate-800 truncate max-w-[100px]">{studentName}</span>
                      <button
                        onClick={() => {
                          setNameInput(studentName);
                          setIsEditingName(true);
                        }}
                        className="p-0.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-all opacity-0 group-hover:opacity-100 md:opacity-100 shrink-0 cursor-pointer"
                        title="Editar Nome"
                      >
                        <Edit3 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                    <span className="text-[9px] text-slate-500 font-semibold font-sans">Acesso Ativo</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="text-[9px] bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold px-2 py-1 rounded-lg transition-all shrink-0 cursor-pointer"
              >
                Gerenciar
              </button>
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
                <Cloud className="w-3.5 h-3.5 text-blue-600 fill-blue-50" />
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide">Backup & Progresso</span>
              </div>
              <span className="text-[9px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm">SEGURO</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              Como o preview e o site público têm domínios diferentes, o navegador separa seus dados. Use as opções abaixo para mover seu progresso!
            </p>
            
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={handleExportBackup}
                  className="h-7 bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-extrabold rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  title="Baixar arquivo de backup com todas as suas notas"
                >
                  <Download className="w-3 h-3 text-blue-600" />
                  Arq. JSON
                </button>
                
                <label
                  className="h-7 bg-white hover:bg-slate-100 text-slate-700 text-[9px] font-extrabold rounded-lg transition-all border border-slate-200 flex items-center justify-center gap-1 shadow-2xs cursor-pointer"
                  title="Restaurar backup de arquivo JSON anterior"
                >
                  <Upload className="w-3 h-3 text-blue-600" />
                  Importar
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handleCopyBackupCode}
                className="w-full h-7 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[9px] font-extrabold rounded-lg transition-all border border-blue-100 flex items-center justify-center gap-1 cursor-pointer"
                title="Copiar todo o progresso como código de texto. Excelente para colar no site de produção!"
              >
                <Copy className="w-3 h-3" />
                Copiar Código de Backup
              </button>
            </div>

            <div className="pt-2 border-t border-slate-200/55 flex justify-between items-center">
              <button
                onClick={() => setShowAccountModal(true)}
                className="text-[9px] text-blue-600 hover:text-blue-800 font-extrabold uppercase tracking-wide cursor-pointer"
              >
                Restaurar via Código →
              </button>
            </div>

            <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/55">
              <button
                onClick={handleResetToClean}
                className="w-full h-6 hover:bg-red-50 text-red-600 hover:text-red-700 text-[8px] font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                title="Apagar todas as notas para começar limpo"
              >
                <Trash2 className="w-2.5 h-2.5" />
                Limpar Tudo
              </button>
              <button
                onClick={handleResetToSamples}
                className="w-full h-5 text-slate-400 hover:text-slate-600 text-[8px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
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

      {/* Informative Local Account Modal */}
      <AnimatePresence>
        {showAccountModal && (
          <motion.div 
            id="account-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn"
            onClick={() => setShowAccountModal(false)}
          >
            <motion.div 
              id="account-modal-content"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-xl border border-slate-100 relative text-left"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                  <Shield className="w-5.5 h-5.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Gerenciar Conta & Progresso</h3>
                  <p className="text-[10px] text-slate-400 font-bold">100% SEGURO & PRIVADO</p>
                </div>
              </div>

              {/* Tabs Selector */}
              <div className="flex border-b border-slate-100 mt-3">
                <button
                  type="button"
                  onClick={() => setModalTab("info")}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === "info" 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Sobre a Conta
                </button>
                <button
                  type="button"
                  onClick={() => setModalTab("sync")}
                  className={`flex-1 pb-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    modalTab === "sync" 
                      ? "border-blue-600 text-blue-600" 
                      : "border-transparent text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Salvar / Transferir Progresso
                </button>
              </div>

              {/* Body Content */}
              <div className="py-4 space-y-4">
                {modalTab === "info" ? (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      Olá, <strong className="text-slate-800">{studentName}</strong>! No <strong>EstudaIA</strong>, nós valorizamos o seu tempo e a sua privacidade. Por isso, <strong>não é necessário realizar nenhum cadastro ou login</strong> para usar a plataforma!
                    </p>

                    <div className="p-3.5 bg-blue-50/50 border border-blue-100/40 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <h4 className="text-xs font-bold text-blue-900">Como seus dados são salvos?</h4>
                      </div>
                      <p className="text-[11px] text-blue-800 leading-relaxed">
                        Todas as suas notas, metas de estudo, flashcards e estatísticas são salvos automaticamente no <strong>LocalStorage</strong> (banco de dados interno do seu próprio navegador).
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">Dicas importantes:</h4>
                      <div className="flex items-start gap-2 text-[11px] text-slate-500">
                        <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[9px] mt-0.5 shrink-0">1</div>
                        <p className="leading-relaxed">
                          <strong>Não limpe o cache do seu navegador</strong> se quiser manter suas notas sem backups, pois o LocalStorage está associado ao site.
                        </p>
                      </div>
                      <div className="flex items-start gap-2 text-[11px] text-slate-500">
                        <div className="w-4 h-4 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-[9px] mt-0.5 shrink-0">2</div>
                        <p className="leading-relaxed">
                          <strong>Várias URLs:</strong> O navegador protege seus dados separando-os por link. Se você criou notas no link de Visualização (Preview), elas não vão aparecer no site Deployed automaticamente! Mova-as usando a aba ao lado.
                        </p>
                      </div>
                    </div>

                    {/* Edit student name section in modal */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase">Personalizar seu Nome de Estudante</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Ex: Cauã Cristoff"
                          className="flex-1 px-3.5 py-2 border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 rounded-xl text-xs bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none transition-all"
                        />
                        <button
                          type="button"
                          onClick={handleSaveName}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Salvar
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Como a URL de visualização (preview) e a URL pública/compartilhada são consideradas sites diferentes pelo navegador, o seu progresso não sincroniza automaticamente. Use as ferramentas abaixo para mover tudo de forma simples:
                    </p>

                    {/* Export Section */}
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800">1. Salvar ou Exportar Meu Progresso</h4>
                      <p className="text-[10px] text-slate-400">Gere um backup completo contendo todos os seus cadernos de estudos, flashcards e estatísticas:</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleExportBackup}
                          className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5 text-blue-600" />
                          Baixar Arq. JSON
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyBackupCode}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copiar Código de Texto
                        </button>
                      </div>
                    </div>

                    {/* Import Section */}
                    <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl space-y-2.5">
                      <h4 className="text-xs font-bold text-slate-800">2. Restaurar Progresso no Deployed/Link Público</h4>
                      <p className="text-[10px] text-slate-400">Cole o código copiado do outro site ou faça upload do seu arquivo JSON para continuar de onde parou:</p>
                      
                      <div className="space-y-2">
                        <textarea
                          rows={3}
                          value={pasteInputCode}
                          onChange={(e) => setPasteInputCode(e.target.value)}
                          placeholder="Cole aqui o seu Código de Backup gerado..."
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:border-blue-500 focus:outline-none font-mono"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleImportBackupCode(pasteInputCode)}
                            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            Importar via Código
                          </button>
                          
                          <label className="flex-1 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            Subir .json
                            <input
                              type="file"
                              accept=".json"
                              onChange={(e) => {
                                handleImportBackup(e);
                                setShowAccountModal(false);
                              }}
                              className="hidden"
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAccountModal(false)}
                  className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
