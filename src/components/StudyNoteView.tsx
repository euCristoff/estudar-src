import React, { useState, useRef, useEffect } from "react";
import { StudyNote, Flashcard, QuizQuestion, ChatMessage } from "../types";
import { 
  ArrowLeft, 
  BookOpen, 
  HelpCircle, 
  Zap, 
  Map, 
  MessageSquare, 
  Star, 
  Folder, 
  Tag, 
  Sparkles, 
  GraduationCap, 
  AlertCircle, 
  Play, 
  RotateCw, 
  Check, 
  X, 
  Volume2, 
  Bookmark,
  ChevronRight,
  Send,
  Loader2,
  ListRestart
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudyNoteViewProps {
  note: StudyNote;
  onBack: () => void;
  onUpdateNote: (note: StudyNote) => void;
  onRecordQuizAttempt: (subject: string, correct: boolean) => void;
  onCompleteOnboardingTask?: (task: 'createNote' | 'reviewFlashcards' | 'takeQuiz' | 'chatProfessor') => void;
}

type TabType = "content" | "mindmap" | "flashcards" | "practice" | "professor";
type LevelType = "basic" | "intermediate" | "advanced";

export default function StudyNoteView({ note, onBack, onUpdateNote, onRecordQuizAttempt, onCompleteOnboardingTask }: StudyNoteViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>("content");
  const [activeLevel, setActiveLevel] = useState<LevelType>("basic");

  // Highlight word interaction state
  const [activeGlossaryWord, setActiveGlossaryWord] = useState<string | null>(null);

  // Flashcards state
  const [currentFcIndex, setCurrentFcIndex] = useState(0);
  const [isFcFlipped, setIsFcFlipped] = useState(false);
  const [flashcardsList, setFlashcardsList] = useState<Flashcard[]>(note.flashcards || []);

  // Quiz States (Standard, ENEM, and Challenges)
  const [practiceSubTab, setPracticeSubTab] = useState<"quiz" | "enem" | "challenges" | "discursive">("quiz");
  const [selectedQuizIndex, setSelectedQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizChecked, setQuizChecked] = useState(false);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  // Discursive responses state
  const [discursiveAnswers, setDiscursiveAnswers] = useState<Record<number, string>>({});
  const [discursiveRevealed, setDiscursiveRevealed] = useState<Record<number, boolean>>({});

  // Chat/Professor Mode states
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatMode, setChatMode] = useState<"standard" | "professor" | "explain-better">("standard");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Sync internal lists if note updates
  useEffect(() => {
    setFlashcardsList(note.flashcards || []);
  }, [note]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Flashcard response handler (Leitner Leitão box manager)
  const handleFlashcardRating = (remembered: boolean) => {
    const list = [...flashcardsList];
    const currentFc = { ...list[currentFcIndex] };

    // Update box (Leitner 1 to 5)
    if (remembered) {
      currentFc.box = Math.min(5, currentFc.box + 1);
    } else {
      currentFc.box = 1; // back to start
    }

    // Set next review interval in days based on box
    const intervals: Record<number, number> = { 1: 1, 2: 3, 3: 7, 4: 15, 5: 30 };
    const daysToAdd = intervals[currentFc.box] || 1;
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() + daysToAdd);
    currentFc.nextReviewDate = reviewDate.toISOString();

    list[currentFcIndex] = currentFc;
    setFlashcardsList(list);

    // Save back to parent state
    onUpdateNote({
      ...note,
      flashcards: list
    });

    onCompleteOnboardingTask?.("reviewFlashcards");

    // Flip back and go to next
    setIsFcFlipped(false);
    setTimeout(() => {
      if (currentFcIndex < list.length - 1) {
        setCurrentFcIndex(prev => prev + 1);
      } else {
        // Wrap around/end of deck
        setCurrentFcIndex(0);
      }
    }, 200);
  };

  // Check quiz option
  const checkQuizAnswer = (quizItem: QuizQuestion, index: number) => {
    if (selectedOption === null || quizChecked) return;
    setQuizChecked(true);

    const isCorrect = selectedOption === quizItem.correctOptionIndex;
    if (isCorrect) {
      setQuizScore(prev => ({ correct: prev.correct + 1, total: prev.total + 1 }));
    } else {
      setQuizScore(prev => ({ ...prev, total: prev.total + 1 }));
    }

    onRecordQuizAttempt(note.subject, isCorrect);
    onCompleteOnboardingTask?.("takeQuiz");
  };

  const nextQuizQuestion = (quizLength: number) => {
    setSelectedOption(null);
    setQuizChecked(false);
    setSelectedQuizIndex(prev => (prev + 1) % quizLength);
  };

  // Chat API call handler
  const sendChatMessage = async (customText?: string) => {
    const textToSend = customText || chatInput;
    if (!textToSend.trim() || isChatLoading) return;

    if (!customText) {
      setChatInput("");
    }

    const newUserMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    };

    const nextMessages = [...chatMessages, newUserMessage];
    setChatMessages(nextMessages);
    setIsChatLoading(true);
    onCompleteOnboardingTask?.("chatProfessor");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          context: note,
          mode: chatMode
        })
      });

      if (!response.ok) {
        throw new Error("Erro de conexão com o servidor de conversas.");
      }

      const resData = await response.json();
      
      const newAIMessage: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "ai",
        text: resData.text || "Desculpe, não consegui processar a resposta.",
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };

      setChatMessages(prev => [...prev, newAIMessage]);
    } catch (err: any) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: "system",
        text: `Erro de rede: ${err.message || "Por favor, verifique se sua chave GEMINI_API_KEY está ativa e tente novamente."}`,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Initialize chat mode introduction
  const initializeChatMode = (mode: "standard" | "professor" | "explain-better") => {
    setChatMode(mode);
    let introText = "";
    
    if (mode === "professor") {
      introText = "Olá! Eu sou o seu Professor de Avaliação Oral. Vou fazer algumas perguntas desafiadoras baseadas neste conteúdo para testar o seu conhecimento. Está pronto? Vamos começar!";
    } else if (mode === "explain-better") {
      introText = "Claro! Qual ponto exato você gostaria que eu explicasse melhor? Posso criar novas metáforas, detalhar fórmulas, ou desenhar novos diagramas de texto sobre qualquer assunto do caderno.";
    } else {
      introText = `Olá! Sou o assistente de estudos da nota "${note.title}". Sinta-se livre para me perguntar qualquer dúvida sobre a matéria ou pedir novos exemplos.`;
    }

    setChatMessages([
      {
        id: "msg-intro",
        sender: "ai",
        text: introText,
        timestamp: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
      }
    ]);
  };

  // Auto trigger standard chat introduction on select tab
  useEffect(() => {
    if (activeTab === "professor" && chatMessages.length === 0) {
      initializeChatMode("standard");
    }
  }, [activeTab]);

  return (
    <div className="space-y-6 pb-16">
      
      {/* Upper Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 transition-colors border border-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-600 px-2 h-4 rounded-full inline-flex items-center">
                {note.subject}
              </span>
              {note.folder && (
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Folder className="w-3 h-3" />
                  {note.folder}
                </span>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight leading-tight">{note.title}</h1>
          </div>
        </div>

        {/* Favorite marker */}
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onUpdateNote({ ...note, isFavorite: !note.isFavorite })}
            className={`px-3 py-1.5 h-8 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              note.isFavorite 
                ? "bg-amber-50 border-amber-200 text-amber-700" 
                : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
            }`}
          >
            <Star className={`w-3.5 h-3.5 ${note.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
            {note.isFavorite ? "Favoritado" : "Favoritar"}
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex overflow-x-auto gap-2.5 bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/50 w-fit max-w-full">
        <button
          onClick={() => setActiveTab("content")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "content" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Caderno de Estudos
        </button>
        <button
          onClick={() => setActiveTab("mindmap")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "mindmap" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Map className="w-4 h-4" />
          Mapa Mental
        </button>
        <button
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "flashcards" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <Zap className="w-4 h-4" />
          Flashcards ({flashcardsList.length})
        </button>
        <button
          onClick={() => setActiveTab("practice")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "practice" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Praticar Quizzes
        </button>
        <button
          onClick={() => setActiveTab("professor")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
            activeTab === "professor" ? "bg-white text-blue-600 shadow-sm" : "text-slate-600 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Professor Virtual
        </button>
      </div>

      {/* Active Tab rendering */}
      <div id="active-tab-content" className="space-y-6">
        
        {/* TAB 1: CONTENT DEEP DIVE */}
        {activeTab === "content" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle core material */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Summary Notion Card */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 font-sans">Resumo Simples da IA</h3>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-sans">{note.summary}</p>
              </div>

              {/* Subject Explanation in levels (Básico, Intermediário, Avançado) */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-500" />
                    Explicação por Níveis de Domínio
                  </h3>

                  {/* Level picker */}
                  <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
                    {(["basic", "intermediate", "advanced"] as LevelType[]).map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setActiveLevel(lvl)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer ${
                          activeLevel === lvl 
                            ? "bg-white text-blue-600 shadow-2xs" 
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        {lvl === "basic" ? "Básico" : lvl === "intermediate" ? "Intermediário" : "Avançado"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explanation text body */}
                <div className="prose max-w-none text-slate-700 text-sm leading-relaxed font-sans">
                  {activeLevel === "basic" && (
                    <div className="space-y-3 bg-amber-50/30 p-4 rounded-2xl border border-amber-100/40">
                      <p className="font-semibold text-xs text-amber-700 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        Ideal para introdução de conceitos e analogias do cotidiano:
                      </p>
                      <p>{note.explanationBasic}</p>
                    </div>
                  )}
                  {activeLevel === "intermediate" && (
                    <div className="space-y-3 bg-blue-50/20 p-4 rounded-2xl border border-blue-100/40">
                      <p className="font-semibold text-xs text-blue-700 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        Ideal para provas regulares, mecanismos detalhados e causas:
                      </p>
                      <p>{note.explanationIntermediate}</p>
                    </div>
                  )}
                  {activeLevel === "advanced" && (
                    <div className="space-y-3 bg-sky-50/20 p-4 rounded-2xl border border-sky-100/40">
                      <p className="font-semibold text-xs text-sky-700 flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5" />
                        Ideal para vestibulares difíceis, teorias complexas e exceções:
                      </p>
                      <p>{note.explanationAdvanced}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Diagrams/ASCII visualization */}
              {note.diagrams && note.diagrams.map((diag, index) => (
                <div key={index} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <Map className="w-4 h-4 text-emerald-500" />
                    Diagrama Didático: {diag.title}
                  </h4>
                  <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto rounded-2xl shadow-inner border border-slate-800 leading-relaxed whitespace-pre-wrap">
                    <code>{diag.diagramAscii}</code>
                  </pre>
                  <p className="text-xs text-slate-500 font-sans leading-relaxed">{diag.description}</p>
                </div>
              ))}

              {/* Practical Examples */}
              {note.practicalExamples && note.practicalExamples.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                    Exemplos Práticos do Cotidiano
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {note.practicalExamples.map((ex, i) => (
                      <div key={i} className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/20">
                        <p className="text-xs font-bold text-blue-700 mb-1">Aplicações Reais #{i + 1}</p>
                        <p className="text-xs text-slate-600 font-sans leading-relaxed">{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right sidebar of content: Keywords glossary & curiosities */}
            <div className="space-y-6">
              {/* Important Words Glossary with hover selection */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                <h3 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-500 fill-amber-50" />
                  Termos e Palavras-Chave
                </h3>
                <p className="text-xs text-slate-500">
                  Clique nas palavras importantes para revelar sua definição detalhada rapidamente.
                </p>

                <div className="space-y-2">
                  {note.importantWords && note.importantWords.map((item, i) => (
                    <div 
                      key={i}
                      onClick={() => setActiveGlossaryWord(activeGlossaryWord === item.word ? null : item.word)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        activeGlossaryWord === item.word 
                          ? "bg-blue-50 border-blue-200" 
                          : "bg-slate-50/50 border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{item.word}</span>
                        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${activeGlossaryWord === item.word ? "rotate-90 text-blue-500" : ""}`} />
                      </div>
                      
                      {activeGlossaryWord === item.word && (
                        <p className="mt-2 text-xs text-blue-700 font-sans leading-relaxed animate-fadeIn">
                          {item.definition}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Curiosities block */}
              {note.curiosities && note.curiosities.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4">
                  <h3 className="text-sm font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-500 fill-blue-50" />
                    Você Sabia? (Curiosidades)
                  </h3>
                  <div className="space-y-3">
                    {note.curiosities.map((cur, i) => (
                      <div key={i} className="p-3 bg-blue-50/40 rounded-xl text-xs text-slate-600 font-sans leading-relaxed border-l-3 border-blue-500">
                        {cur}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Simple tags footer block */}
              {note.tags && note.tags.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-wrap gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400 mt-0.5" />
                  {note.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-2 h-5 rounded-md inline-flex items-center">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MIND MAP SVG */}
        {activeTab === "mindmap" && (
          <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
            <div className="space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 font-sans flex items-center gap-2">
                <Map className="w-5 h-5 text-blue-500 animate-pulse" />
                Mapa Mental Interativo
              </h3>
              <p className="text-xs text-slate-500">
                Uma representação visual hierárquica automática gerada pela IA para fixação rápida do assunto.
              </p>
            </div>

            {/* Mind Map Canvas wrapper */}
            <div className="relative border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden h-[450px] flex items-center justify-center shadow-inner">
              {note.mindMap ? (
                /* Let's render a clean, beautifully styled SVG representing the mindmap */
                <svg width="100%" height="100%" viewBox="0 0 800 450" className="max-w-full">
                  {/* Drawing lines first so they sit behind nodes */}
                  {note.mindMap.edges.map((edge, i) => {
                    const fromNode = note.mindMap.nodes.find(n => n.id === edge.from);
                    const toNode = note.mindMap.nodes.find(n => n.id === edge.to);

                    // Pre-calculating layouts cleanly for nice trees
                    const nodePositions: Record<string, {x: number, y: number}> = {
                      "1": { x: 400, y: 225 }, // core
                      "2": { x: 220, y: 130 }, // mains
                      "3": { x: 580, y: 130 },
                      "4": { x: 120, y: 90 }, // subs
                      "5": { x: 180, y: 320 },
                      "6": { x: 300, y: 340 },
                      "7": { x: 680, y: 90 },
                      "8": { x: 500, y: 325 },
                      "9": { x: 620, y: 340 }
                    };

                    // Default coordinates if id not pre-mapped
                    const x1 = nodePositions[edge.from]?.x || (200 + i * 50);
                    const y1 = nodePositions[edge.from]?.y || (150 + i * 30);
                    const x2 = nodePositions[edge.to]?.x || (200 + i * 100);
                    const y2 = nodePositions[edge.to]?.y || (200 + i * 40);

                    return (
                      <line 
                        key={`edge-${i}`}
                        x1={x1} 
                        y1={y1} 
                        x2={x2} 
                        y2={y2} 
                        stroke="#93c5fd" 
                        strokeWidth="2.5" 
                        strokeDasharray="4 2"
                      />
                    );
                  })}

                  {/* Rendering nodes */}
                  {note.mindMap.nodes.map((node, i) => {
                    const nodePositions: Record<string, {x: number, y: number}> = {
                      "1": { x: 400, y: 225 }, // core
                      "2": { x: 220, y: 130 }, // mains
                      "3": { x: 580, y: 130 },
                      "4": { x: 120, y: 90 }, // subs
                      "5": { x: 180, y: 320 },
                      "6": { x: 300, y: 340 },
                      "7": { x: 680, y: 90 },
                      "8": { x: 500, y: 325 },
                      "9": { x: 620, y: 340 }
                    };

                    const x = nodePositions[node.id]?.x || (200 + i * 60);
                    const y = nodePositions[node.id]?.y || (180 + i * 45);

                    const isCore = node.type === "core";
                    const isMain = node.type === "main";

                    let fillColor = "white";
                    let strokeColor = "#93c5fd";
                    let textColor = "#1e293b";
                    let radiusX = 65;
                    let radiusY = 22;

                    if (isCore) {
                      fillColor = "#2563eb";
                      strokeColor = "#1d4ed8";
                      textColor = "white";
                      radiusX = 85;
                      radiusY = 28;
                    } else if (isMain) {
                      fillColor = "#dbeafe";
                      strokeColor = "#60a5fa";
                      textColor = "#1e3a8a";
                      radiusX = 75;
                      radiusY = 24;
                    }

                    return (
                      <g key={`node-${node.id}`} className="cursor-default">
                        {/* Glow effect on core */}
                        {isCore && (
                          <rect 
                            x={x - radiusX - 4} 
                            y={y - radiusY - 4} 
                            width={(radiusX + 4) * 2} 
                            height={(radiusY + 4) * 2} 
                            rx="14" 
                            fill="rgba(37, 99, 219, 0.1)"
                          />
                        )}
                        <rect 
                          x={x - radiusX} 
                          y={y - radiusY} 
                          width={radiusX * 2} 
                          height={radiusY * 2} 
                          rx={isCore ? "12" : "10"} 
                          fill={fillColor} 
                          stroke={strokeColor} 
                          strokeWidth="2" 
                          className="transition-all hover:stroke-blue-600"
                        />
                        <text 
                          x={x} 
                          y={y + 4} 
                          textAnchor="middle" 
                          fill={textColor} 
                          fontSize={isCore ? "11px" : "10px"} 
                          fontWeight="bold"
                          fontFamily="Plus Jakarta Sans"
                        >
                          {node.label.length > 22 ? node.label.substring(0, 20) + "..." : node.label}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              ) : (
                <p className="text-slate-400 italic text-xs">Nenhum mapa mental disponível para esta nota.</p>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: FLASHCARDS PLAYER */}
        {activeTab === "flashcards" && (
          <div className="max-w-xl mx-auto space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-800 font-sans">Baralho de Flashcards</h3>
              <p className="text-xs text-slate-500">
                Lembrete ativo por repetição espaçada. Cartas fáceis são enviadas para revisões futuras distantes.
              </p>
            </div>

            {flashcardsList.length === 0 ? (
              <div className="text-center py-12 bg-white border rounded-3xl">
                <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                <p className="text-sm font-semibold text-slate-700 mt-2">Sem flashcards gerados.</p>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Score tracker */}
                <div className="flex items-center justify-between text-xs px-2">
                  <span className="font-semibold text-slate-600">Flashcard {currentFcIndex + 1} de {flashcardsList.length}</span>
                  <span className="font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded-sm font-bold">
                    Box {flashcardsList[currentFcIndex]?.box || 1}
                  </span>
                </div>

                {/* Card Container with Flip animation */}
                <div 
                  onClick={() => setIsFcFlipped(!isFcFlipped)}
                  className="h-64 cursor-pointer relative"
                  style={{ perspective: "1000px" }}
                >
                  <motion.div
                    animate={{ rotateY: isFcFlipped ? 180 : 0 }}
                    transition={{ duration: 0.4 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className="w-full h-full absolute rounded-3xl shadow-md border border-slate-200 bg-white"
                  >
                    {/* Front side */}
                    <div 
                      style={{ backfaceVisibility: "hidden" }}
                      className="absolute inset-0 p-8 flex flex-col justify-between"
                    >
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                        <Bookmark className="w-3.5 h-3.5" />
                        Pergunta Ativa
                      </div>
                      
                      <p className="text-base font-extrabold text-slate-800 text-center font-sans">
                        {flashcardsList[currentFcIndex]?.front}
                      </p>

                      <p className="text-[10px] text-slate-400 text-center font-semibold">
                        Clique para virar e ver a resposta
                      </p>
                    </div>

                    {/* Back side */}
                    <div 
                      style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                      className="absolute inset-0 p-8 flex flex-col justify-between bg-blue-50/50"
                    >
                      <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 uppercase tracking-widest">
                        <Check className="w-3.5 h-3.5" />
                        Resposta Sugerida
                      </div>
                      
                      <p className="text-sm font-semibold text-slate-700 text-center font-sans">
                        {flashcardsList[currentFcIndex]?.back}
                      </p>

                      <p className="text-[10px] text-slate-400 text-center font-semibold">
                        Clique para virar de volta
                      </p>
                    </div>
                  </motion.div>
                </div>

                {/* Rating buttons */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => handleFlashcardRating(false)}
                    className="flex-1 h-11 bg-red-50 hover:bg-red-100 border border-red-100 text-red-700 text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Errei / Esqueci
                  </button>
                  <button
                    onClick={() => handleFlashcardRating(true)}
                    className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    Acertei / Lembrei
                  </button>
                </div>

                {/* Spaced repetition description text */}
                <p className="text-[10px] text-slate-400 text-center font-sans">
                  *Acertar empurra esta carta para uma caixa de repetição mais alta, espaçando mais as revisões. Errar volta a carta para a Caixa 1.
                </p>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRACTICE (QUIZ, ENEM, DISCURSIVE) */}
        {activeTab === "practice" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Practice selection sidebar */}
            <div className="lg:col-span-1 space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 px-1">Tipos de Exercício</h4>
              
              <button
                onClick={() => { setPracticeSubTab("quiz"); setSelectedQuizIndex(0); setSelectedOption(null); setQuizChecked(false); }}
                className={`w-full text-left px-3.5 py-2.5 h-11 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  practiceSubTab === "quiz" ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Zap className="w-4 h-4" />
                Quiz de Alternativas
              </button>

              <button
                onClick={() => { setPracticeSubTab("enem"); setSelectedQuizIndex(0); setSelectedOption(null); setQuizChecked(false); }}
                className={`w-full text-left px-3.5 py-2.5 h-11 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  practiceSubTab === "enem" ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Bookmark className="w-4 h-4" />
                Simulado ENEM/Vestibular
              </button>

              <button
                onClick={() => { setPracticeSubTab("challenges"); setSelectedQuizIndex(0); setSelectedOption(null); setQuizChecked(false); }}
                className={`w-full text-left px-3.5 py-2.5 h-11 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  practiceSubTab === "challenges" ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                Desafios Complexos
              </button>

              <button
                onClick={() => { setPracticeSubTab("discursive"); }}
                className={`w-full text-left px-3.5 py-2.5 h-11 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  practiceSubTab === "discursive" ? "bg-blue-600 text-white shadow-xs" : "bg-white border border-slate-100 text-slate-700 hover:bg-slate-50"
                }`}
              >
                <BookOpen className="w-4 h-4" />
                Questões Discursivas
              </button>

              {/* Progress Panel */}
              <div className="p-4 bg-slate-100/50 rounded-2xl border border-slate-200/40 text-center space-y-1 mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Resolução Geral</p>
                <p className="text-lg font-extrabold text-slate-800">{quizScore.correct} / {quizScore.total}</p>
                <p className="text-[10px] text-slate-500">acertos nesta sessão</p>
              </div>
            </div>

            {/* Practice core board */}
            <div className="lg:col-span-3">
              
              {/* Option A: QUIZ DE ALTERNATIVAS */}
              {practiceSubTab === "quiz" && note.quiz && note.quiz.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <span className="font-bold text-blue-600">Questão {selectedQuizIndex + 1} de {note.quiz.length}</span>
                    <span className="font-semibold text-slate-400">Objetiva</span>
                  </div>

                  <p className="font-bold text-sm text-slate-800 leading-relaxed font-sans">
                    {note.quiz[selectedQuizIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {note.quiz[selectedQuizIndex].options.map((opt, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === note.quiz[selectedQuizIndex].correctOptionIndex;
                      
                      let optionStyle = "border-slate-200 bg-white hover:bg-slate-50";
                      
                      if (quizChecked) {
                        if (isCorrect) {
                          optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                        } else if (isSelected) {
                          optionStyle = "border-red-500 bg-red-50 text-red-800";
                        } else {
                          optionStyle = "border-slate-100 bg-white opacity-50";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-blue-500 bg-blue-50/50 text-blue-800 font-bold";
                      }

                      return (
                        <div 
                          key={i}
                          onClick={() => !quizChecked && setSelectedOption(i)}
                          className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                        >
                          <span>{opt}</span>
                          {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                          {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Verification action area */}
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    {!quizChecked ? (
                      <button
                        onClick={() => checkQuizAnswer(note.quiz[selectedQuizIndex], selectedQuizIndex)}
                        disabled={selectedOption === null}
                        className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer"
                      >
                        Verificar Resposta
                      </button>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600">
                          <p className="font-bold text-slate-800 mb-1">Explicação do Professor:</p>
                          <p>{note.quiz[selectedQuizIndex].explanation}</p>
                        </div>
                        <button
                          onClick={() => nextQuizQuestion(note.quiz.length)}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer"
                        >
                          Próxima Questão
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option B: ENEM QUESTIONS */}
              {practiceSubTab === "enem" && note.enemQuestions && note.enemQuestions.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <span className="font-extrabold text-blue-600 font-sans tracking-wide">Padrão ENEM / Vestibular</span>
                    <span className="font-semibold text-slate-400">Questão {selectedQuizIndex + 1} de {note.enemQuestions.length}</span>
                  </div>

                  <p className="text-xs text-slate-500 bg-slate-100 p-4 rounded-xl border border-slate-200/50 leading-relaxed italic font-serif">
                    Texto de Apoio ENEM: {note.summary}
                  </p>

                  <p className="font-semibold text-sm text-slate-800 leading-relaxed font-sans">
                    {note.enemQuestions[selectedQuizIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {note.enemQuestions[selectedQuizIndex].options.map((opt, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === note.enemQuestions[selectedQuizIndex].correctOptionIndex;
                      
                      let optionStyle = "border-slate-200 bg-white hover:bg-slate-50";
                      
                      if (quizChecked) {
                        if (isCorrect) {
                          optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                        } else if (isSelected) {
                          optionStyle = "border-red-500 bg-red-50 text-red-800";
                        } else {
                          optionStyle = "border-slate-100 bg-white opacity-50";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-blue-500 bg-blue-50/50 text-blue-800 font-bold";
                      }

                      return (
                        <div 
                          key={i}
                          onClick={() => !quizChecked && setSelectedOption(i)}
                          className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                        >
                          <span>{opt}</span>
                          {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                          {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Verification action area */}
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    {!quizChecked ? (
                      <button
                        onClick={() => checkQuizAnswer(note.enemQuestions[selectedQuizIndex], selectedQuizIndex)}
                        disabled={selectedOption === null}
                        className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer"
                      >
                        Verificar Resposta
                      </button>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600">
                          <p className="font-bold text-slate-800 mb-1 font-sans">Gabarito Comentado (ENEM):</p>
                          <p>{note.enemQuestions[selectedQuizIndex].explanation}</p>
                        </div>
                        <button
                          onClick={() => nextQuizQuestion(note.enemQuestions.length)}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer"
                        >
                          Próxima Questão
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option C: CHALLENGES */}
              {practiceSubTab === "challenges" && note.challenges && note.challenges.length > 0 && (
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                    <span className="font-extrabold text-amber-600 font-sans tracking-wide flex items-center gap-1">
                      <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                      Desafio Extremo
                    </span>
                    <span className="font-semibold text-slate-400">Questão {selectedQuizIndex + 1} de {note.challenges.length}</span>
                  </div>

                  <p className="font-bold text-sm text-slate-800 leading-relaxed font-sans">
                    {note.challenges[selectedQuizIndex].question}
                  </p>

                  <div className="space-y-2.5">
                    {note.challenges[selectedQuizIndex].options.map((opt, i) => {
                      const isSelected = selectedOption === i;
                      const isCorrect = i === note.challenges[selectedQuizIndex].correctOptionIndex;
                      
                      let optionStyle = "border-slate-200 bg-white hover:bg-slate-50";
                      
                      if (quizChecked) {
                        if (isCorrect) {
                          optionStyle = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold";
                        } else if (isSelected) {
                          optionStyle = "border-red-500 bg-red-50 text-red-800";
                        } else {
                          optionStyle = "border-slate-100 bg-white opacity-50";
                        }
                      } else if (isSelected) {
                        optionStyle = "border-blue-500 bg-blue-50/50 text-blue-800 font-bold";
                      }

                      return (
                        <div 
                          key={i}
                          onClick={() => !quizChecked && setSelectedOption(i)}
                          className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between ${optionStyle}`}
                        >
                          <span>{opt}</span>
                          {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                          {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Verification action area */}
                  <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                    {!quizChecked ? (
                      <button
                        onClick={() => checkQuizAnswer(note.challenges[selectedQuizIndex], selectedQuizIndex)}
                        disabled={selectedOption === null}
                        className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer"
                      >
                        Verificar Resposta
                      </button>
                    ) : (
                      <div className="w-full space-y-4">
                        <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600">
                          <p className="font-bold text-slate-800 mb-1 font-sans">Gabarito e Raciocínio de Alto Nível:</p>
                          <p>{note.challenges[selectedQuizIndex].explanation}</p>
                        </div>
                        <button
                          onClick={() => nextQuizQuestion(note.challenges.length)}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer"
                        >
                          Próxima Questão
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Option D: Questões Discursivas */}
              {practiceSubTab === "discursive" && note.discursiveQuestions && note.discursiveQuestions.map((q, i) => (
                <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4 mb-4">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-50">
                    <span className="font-bold text-slate-500">Questão Discursiva #{i + 1}</span>
                  </div>
                  
                  <p className="font-semibold text-sm text-slate-800 leading-relaxed font-sans">{q.question}</p>
                  
                  <textarea
                    rows={3}
                    placeholder="Escreva sua resposta discursiva aqui para treinar..."
                    value={discursiveAnswers[i] || ""}
                    onChange={(e) => setDiscursiveAnswers({ ...discursiveAnswers, [i]: e.target.value })}
                    className="w-full p-3 bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-2xl text-xs font-sans transition-all"
                  />

                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setDiscursiveRevealed({ ...discursiveRevealed, [i]: !discursiveRevealed[i] })}
                      className="px-4 h-9 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                    >
                      {discursiveRevealed[i] ? "Ocultar Gabarito" : "Comparar com Resposta Esperada"}
                    </button>
                  </div>

                  {discursiveRevealed[i] && (
                    <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs leading-relaxed font-sans border border-emerald-100/40 animate-fadeIn">
                      <p className="font-bold mb-1">Gabarito sugerido pelo Professor:</p>
                      <p>{q.suggestedAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: PROFESSOR CHAT (ORAL TEST / EXPLAIN BETTER) */}
        {activeTab === "professor" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left sidebar: oral settings / explain topics */}
            <div className="lg:col-span-1 space-y-4">
              <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-4 shadow-2xs">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Modos de Conversa</h4>
                
                <div className="space-y-2">
                  <button
                    onClick={() => initializeChatMode("standard")}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      chatMode === "standard" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat Livre Contextual
                  </button>

                  <button
                    onClick={() => initializeChatMode("professor")}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      chatMode === "professor" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Modo Prova Oral 🎤
                  </button>

                  <button
                    onClick={() => initializeChatMode("explain-better")}
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      chatMode === "explain-better" ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Modo "Explique Melhor"
                  </button>
                </div>
              </div>

              {/* Explain Better Quick Prompts */}
              {chatMode === "explain-better" && (
                <div className="p-5 bg-white border border-slate-100 rounded-3xl space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Sugestões de Aprofundamento</h4>
                  <div className="space-y-2 text-left">
                    {note.importantWords && note.importantWords.slice(0, 3).map((item, i) => (
                      <button
                        key={i}
                        onClick={() => sendChatMessage(`Explique melhor e traga exemplos práticos avançados sobre "${item.word}"`)}
                        className="w-full p-2.5 text-left bg-slate-50 hover:bg-blue-50/50 hover:text-blue-600 text-[11px] text-slate-600 font-semibold rounded-lg leading-snug transition-all cursor-pointer"
                      >
                        Aprofundar #{item.word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel: Chat dialogue interface */}
            <div className="lg:col-span-3 bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[500px] flex flex-col justify-between">
              
              {/* Active mode header indicator */}
              <div className="bg-slate-50 px-5 h-12 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Professor Virtual: 
                  <span className="text-blue-600 capitalize">
                    {chatMode === "professor" ? "Prova Oral Ativa" : chatMode === "explain-better" ? "Modo Aprofundamento" : "Chat Contextual"}
                  </span>
                </div>
                <button 
                  onClick={() => initializeChatMode(chatMode)}
                  className="p-1.5 hover:bg-slate-200 text-slate-500 rounded-lg text-xs font-bold flex items-center gap-1 transition-all"
                  title="Reiniciar chat"
                >
                  <ListRestart className="w-4 h-4" />
                  Reiniciar
                </button>
              </div>

              {/* Message scroll container */}
              <div className="p-5 overflow-y-auto space-y-4 flex-1">
                {chatMessages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const isSys = msg.sender === "system";

                  if (isSys) {
                    return (
                      <div key={msg.id} className="p-3 bg-red-50 border border-red-100 text-red-700 text-xs rounded-xl flex items-start gap-2 max-w-lg mx-auto">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{msg.text}</p>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={msg.id} 
                      className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold ${
                        isUser ? "bg-blue-600 text-white" : "bg-slate-100 border text-slate-700"
                      }`}>
                        {isUser ? "Eu" : "P"}
                      </div>

                      {/* Message Box */}
                      <div className={`p-4 rounded-2xl text-xs max-w-[80%] font-sans leading-relaxed ${
                        isUser 
                          ? "bg-blue-600 text-white rounded-tr-none" 
                          : "bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <span className={`block mt-1.5 text-[9px] font-mono text-right ${isUser ? "text-blue-200" : "text-slate-400"}`}>
                          {msg.timestamp}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {isChatLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border text-slate-700 flex items-center justify-center text-xs font-extrabold">
                      P
                    </div>
                    <div className="p-4 bg-slate-50 border border-slate-100 text-xs rounded-2xl rounded-tl-none text-slate-400 flex items-center gap-1.5">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      Digitando resposta...
                    </div>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t border-slate-100 bg-slate-50">
                <form 
                  onSubmit={(e) => { e.preventDefault(); sendChatMessage(); }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isChatLoading}
                    placeholder={chatMode === "professor" ? "Responda à prova oral aqui..." : "Pergunte algo sobre este conteúdo..."}
                    className="flex-1 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl px-4 h-11 text-xs font-sans transition-all shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isChatLoading}
                    className="w-11 h-11 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl shadow-xs transition-all flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
