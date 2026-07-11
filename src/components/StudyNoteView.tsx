import React, { useState, useRef, useEffect } from "react";
import { StudyNote, Flashcard, QuizQuestion, ChatMessage } from "../types";
import DidacticDiagram from "./DidacticDiagram";
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
  ListRestart,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  RefreshCw,
  Grab,
  Upload,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface StudyNoteViewProps {
  note: StudyNote;
  onBack: () => void;
  onUpdateNote: (note: StudyNote) => void;
  onRecordQuizAttempt: (subject: string, correct: boolean) => void;
  onCompleteOnboardingTask?: (task: 'createNote' | 'reviewFlashcards' | 'takeQuiz' | 'chatProfessor') => void;
  initialTab?: TabType;
}

type TabType = "content" | "flashcards" | "practice" | "professor";
type LevelType = "basic" | "intermediate" | "advanced";

export default function StudyNoteView({ note, onBack, onUpdateNote, onRecordQuizAttempt, onCompleteOnboardingTask, initialTab = "flashcards" }: StudyNoteViewProps) {
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
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

  // Mind Map Zoom and Pan State
  const [mmZoom, setMmZoom] = useState(1);
  const [mmPan, setMmPan] = useState({ x: 0, y: 0 });
  const [mmDragging, setMmDragging] = useState(false);
  const mmDragStart = useRef({ x: 0, y: 0 });

  const handleMmMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setMmDragging(true);
    mmDragStart.current = { x: e.clientX - mmPan.x, y: e.clientY - mmPan.y };
  };

  const handleMmMouseMove = (e: React.MouseEvent) => {
    if (!mmDragging) return;
    setMmPan({
      x: e.clientX - mmDragStart.current.x,
      y: e.clientY - mmDragStart.current.y
    });
  };

  const handleMmMouseUp = () => {
    setMmDragging(false);
  };

  const handleMmTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    setMmDragging(true);
    const touch = e.touches[0];
    mmDragStart.current = { x: touch.clientX - mmPan.x, y: touch.clientY - mmPan.y };
  };

  const handleMmTouchMove = (e: React.TouchEvent) => {
    if (!mmDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setMmPan({
      x: touch.clientX - mmDragStart.current.x,
      y: touch.clientY - mmDragStart.current.y
    });
  };

  // Sync internal lists if note updates
  useEffect(() => {
    setFlashcardsList(note.flashcards || []);
  }, [note]);

  // Sync activeTab if initialTab or note changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
    setCurrentFcIndex(0);
    setIsFcFlipped(false);
  }, [initialTab, note.id]);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Spaced Repetition Custom Intervals State (in minutes)
  const [intervalAgain, setIntervalAgain] = useState<number>(2);
  const [intervalHard, setIntervalHard] = useState<number>(30);
  const [intervalGood, setIntervalGood] = useState<number>(180);
  const [intervalEasy, setIntervalEasy] = useState<number>(600);
  const [showIntervalSettings, setShowIntervalSettings] = useState<boolean>(false);

  // Custom Flashcards Creation States
  const [newFcFront, setNewFcFront] = useState("");
  const [newFcBack, setNewFcBack] = useState("");
  const [newFcCanQuiz, setNewFcCanQuiz] = useState(true);
  const [showCreateFcForm, setShowCreateFcForm] = useState(false);

  // Flashcards Editing States
  const [editingFc, setEditingFc] = useState<Flashcard | null>(null);
  const [editingFcFront, setEditingFcFront] = useState("");
  const [editingFcBack, setEditingFcBack] = useState("");

  // AI generation states
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Custom Question Form States
  const [showCreateQuestionForm, setShowCreateQuestionForm] = useState(false);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [newQuestionOptions, setNewQuestionOptions] = useState<string[]>(["", "", "", ""]);
  const [newQuestionCorrectIndex, setNewQuestionCorrectIndex] = useState(0);
  const [newQuestionExplanation, setNewQuestionExplanation] = useState("");
  const [newQuestionSuggestedAnswer, setNewQuestionSuggestedAnswer] = useState("");

  // Append content states for teacher topics
  const [isAppendModalOpen, setIsAppendModalOpen] = useState(false);
  const [appendTopic, setAppendTopic] = useState("");
  const [appendUploadedFiles, setAppendUploadedFiles] = useState<{ id: string; name: string; base64: string; mimeType: string; }[]>([]);
  const [isAppending, setIsAppending] = useState(false);
  const [appendError, setAppendError] = useState<string | null>(null);
  const [appendLoaderPhraseIndex, setAppendLoaderPhraseIndex] = useState(0);
  const appendFileInputRef = useRef<HTMLInputElement>(null);
  const appendLoaderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const APPEND_LOADER_PHRASES = [
    "Professor Virtual está analisando os novos tópicos fornecidos...",
    "Lendo suas anotações e fotos anexadas...",
    "Fusão de conteúdos iniciada com sucesso...",
    "Atualizando o caderno de estudos com os novos tópicos...",
    "Expandindo os resumos e explicações por nível de complexidade...",
    "Integrando novos ramos ao seu mapa mental...",
    "Criando novos flashcards ativos de memorização...",
    "Gerando novas perguntas de quiz e simulados baseadas na prova...",
    "Organizando tudo com carinho para o seu alto rendimento!"
  ];

  const startAppendLoaderPhrases = () => {
    setAppendLoaderPhraseIndex(0);
    appendLoaderIntervalRef.current = setInterval(() => {
      setAppendLoaderPhraseIndex(prev => (prev + 1) % APPEND_LOADER_PHRASES.length);
    }, 3000);
  };

  const stopAppendLoaderPhrases = () => {
    if (appendLoaderIntervalRef.current) {
      clearInterval(appendLoaderIntervalRef.current);
    }
  };

  const handleAppendFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.split(",")[1];
        
        setAppendUploadedFiles(prev => [
          ...prev,
          {
            id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name,
            base64: base64Data,
            mimeType: file.type
          }
        ]);
      };
      reader.onerror = (error) => {
        console.error("Erro ao ler o arquivo:", error);
      };
      reader.readAsDataURL(file);
    });

    if (appendFileInputRef.current) {
      appendFileInputRef.current.value = "";
    }
  };

  const removeAppendUploadedFile = (id: string) => {
    setAppendUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const triggerAppendContent = async () => {
    if (appendUploadedFiles.length === 0 && !appendTopic.trim()) {
      setAppendError("Por favor, envie pelo menos uma imagem/documento ou digite um tópico/texto com o novo conteúdo.");
      return;
    }

    setIsAppending(true);
    setAppendError(null);
    startAppendLoaderPhrases();

    try {
      const response = await fetch("/api/append-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          images: appendUploadedFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType })),
          topic: appendTopic
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro ao mesclar conteúdos com o servidor.");
      }

      const updatedNoteData = await response.json();

      // Merge keeping progress
      const existingFlashcardsMap = new Map<string, Flashcard>();
      note.flashcards.forEach(fc => {
        existingFlashcardsMap.set(fc.front.trim().toLowerCase(), fc);
      });

      const mergedFlashcards: Flashcard[] = (updatedNoteData.flashcards || []).map((fc: any, index: number) => {
        const key = fc.front.trim().toLowerCase();
        const existing = existingFlashcardsMap.get(key);
        if (existing) {
          return {
            ...existing,
            back: fc.back
          };
        } else {
          return {
            ...fc,
            id: `fc-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`,
            box: 1,
            nextReviewDate: new Date().toISOString()
          };
        }
      });

      const updatedFullNote: StudyNote = {
        ...note,
        title: updatedNoteData.title || note.title,
        summary: updatedNoteData.summary || note.summary,
        explanationBasic: updatedNoteData.explanationBasic || note.explanationBasic,
        explanationIntermediate: updatedNoteData.explanationIntermediate || note.explanationIntermediate,
        explanationAdvanced: updatedNoteData.explanationAdvanced || note.explanationAdvanced,
        importantWords: updatedNoteData.importantWords || note.importantWords,
        mindMap: updatedNoteData.mindMap || note.mindMap,
        flashcards: mergedFlashcards,
        quiz: updatedNoteData.quiz || note.quiz,
        discursiveQuestions: updatedNoteData.discursiveQuestions || note.discursiveQuestions,
        challenges: updatedNoteData.challenges || note.challenges,
        enemQuestions: updatedNoteData.enemQuestions || note.enemQuestions,
        diagrams: updatedNoteData.diagrams || note.diagrams,
        curiosities: updatedNoteData.curiosities || note.curiosities,
        practicalExamples: updatedNoteData.practicalExamples || note.practicalExamples,
        tags: updatedNoteData.tags || note.tags,
        date: new Date().toISOString()
      };

      onUpdateNote(updatedFullNote);
      setIsAppendModalOpen(false);
      
      // Reset state
      setAppendTopic("");
      setAppendUploadedFiles([]);
    } catch (err: any) {
      console.error("Erro ao adicionar conteúdo:", err);
      setAppendError(err.message || "Não foi possível conectar com o servidor para atualizar o caderno de estudos.");
    } finally {
      setIsAppending(false);
      stopAppendLoaderPhrases();
    }
  };

  const handleGenerateMoreMaterials = async (type: "flashcards" | "quiz" | "enem" | "challenges" | "discursive") => {
    setIsAiGenerating(true);
    setGenerationError(null);
    try {
      const response = await fetch("/api/generate-more-materials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          type,
          count: 3
        })
      });
      if (!response.ok) {
        throw new Error("Erro ao conectar com o servidor.");
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }

      if (data.items && Array.isArray(data.items)) {
        if (type === "flashcards") {
          const newFcs: Flashcard[] = data.items.map((item: any, i: number) => ({
            id: `fc-ai-${Date.now()}-${i}`,
            front: item.front,
            back: item.back,
            box: 1,
            nextReviewDate: new Date().toISOString(),
            canAppearInQuiz: true
          }));
          const updated = [...flashcardsList, ...newFcs];
          setFlashcardsList(updated);
          onUpdateNote({
            ...note,
            flashcards: updated
          });
        } else if (type === "quiz") {
          const updatedQuiz = [...(note.quiz || []), ...data.items];
          onUpdateNote({
            ...note,
            quiz: updatedQuiz
          });
        } else if (type === "enem") {
          const updatedEnem = [...(note.enemQuestions || []), ...data.items];
          onUpdateNote({
            ...note,
            enemQuestions: updatedEnem
          });
        } else if (type === "challenges") {
          const updatedChallenges = [...(note.challenges || []), ...data.items];
          onUpdateNote({
            ...note,
            challenges: updatedChallenges
          });
        } else if (type === "discursive") {
          const updatedDiscursive = [...(note.discursiveQuestions || []), ...data.items];
          onUpdateNote({
            ...note,
            discursiveQuestions: updatedDiscursive
          });
        }
      }
    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || "Não foi possível gerar novos itens automaticamente.");
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleAddCustomQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestionText.trim()) return;

    if (practiceSubTab === "discursive") {
      if (!newQuestionSuggestedAnswer.trim()) return;
      const newDiscursive = {
        question: newQuestionText.trim(),
        suggestedAnswer: newQuestionSuggestedAnswer.trim()
      };
      const updatedList = [...(note.discursiveQuestions || []), newDiscursive];
      onUpdateNote({
        ...note,
        discursiveQuestions: updatedList
      });
    } else {
      // Multiple choice (quiz, enem, challenges)
      const limit = practiceSubTab === "enem" ? 5 : 4;
      const slicedOptions = newQuestionOptions.slice(0, limit);
      const filledOptions = slicedOptions.map(o => o.trim()).filter(Boolean);
      
      // Ensure we fill up to standard length with placeholders if empty
      while (filledOptions.length < limit) {
        filledOptions.push(`Opção complementar ${filledOptions.length + 1}`);
      }
      
      const newQuizQuestion: QuizQuestion = {
        question: newQuestionText.trim(),
        options: filledOptions,
        correctOptionIndex: Math.min(newQuestionCorrectIndex, filledOptions.length - 1),
        explanation: newQuestionExplanation.trim() || "Questão personalizada criada pelo aluno."
      };

      if (practiceSubTab === "quiz") {
        const updatedQuiz = [...(note.quiz || []), newQuizQuestion];
        onUpdateNote({
          ...note,
          quiz: updatedQuiz
        });
      } else if (practiceSubTab === "enem") {
        const updatedEnem = [...(note.enemQuestions || []), newQuizQuestion];
        onUpdateNote({
          ...note,
          enemQuestions: updatedEnem
        });
      } else if (practiceSubTab === "challenges") {
        const updatedChallenges = [...(note.challenges || []), newQuizQuestion];
        onUpdateNote({
          ...note,
          challenges: updatedChallenges
        });
      }
    }

    // Reset Form
    setNewQuestionText("");
    setNewQuestionOptions(["", "", "", ""]);
    setNewQuestionCorrectIndex(0);
    setNewQuestionExplanation("");
    setNewQuestionSuggestedAnswer("");
    setShowCreateQuestionForm(false);
  };

  // Add custom flashcard function
  const handleAddCustomFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFcFront.trim() || !newFcBack.trim()) return;

    const newFc: Flashcard = {
      id: `fc-custom-${Date.now()}`,
      front: newFcFront.trim(),
      back: newFcBack.trim(),
      box: 1,
      nextReviewDate: new Date().toISOString(),
      canAppearInQuiz: newFcCanQuiz
    };

    const updatedList = [...flashcardsList, newFc];
    setFlashcardsList(updatedList);

    onUpdateNote({
      ...note,
      flashcards: updatedList
    });

    setNewFcFront("");
    setNewFcBack("");
    setNewFcCanQuiz(true);
    setShowCreateFcForm(false);
  };

  // Delete flashcard function
  const handleDeleteFlashcard = (fcId: string) => {
    const updatedList = flashcardsList.filter(fc => fc.id !== fcId);
    setFlashcardsList(updatedList);
    onUpdateNote({
      ...note,
      flashcards: updatedList
    });
    if (currentFcIndex >= updatedList.length) {
      setCurrentFcIndex(Math.max(0, updatedList.length - 1));
    }
    setIsFcFlipped(false);
  };

  // Edit flashcard function
  const handleSaveEditedFlashcard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFc || !editingFcFront.trim() || !editingFcBack.trim()) return;

    const updatedList = flashcardsList.map(fc => {
      if (fc.id === editingFc.id) {
        return {
          ...fc,
          front: editingFcFront.trim(),
          back: editingFcBack.trim()
        };
      }
      return fc;
    });

    setFlashcardsList(updatedList);
    onUpdateNote({
      ...note,
      flashcards: updatedList
    });

    setEditingFc(null);
    setEditingFcFront("");
    setEditingFcBack("");
  };

  // Memoized Quiz combination: appends custom flashcards that have canAppearInQuiz enabled
  const combinedQuiz = React.useMemo(() => {
    const baseQuiz = [...(note.quiz || [])];
    const quizEnabledCustomFcs = flashcardsList.filter(fc => fc.canAppearInQuiz);

    if (quizEnabledCustomFcs.length === 0) return baseQuiz;

    const customQuestions: QuizQuestion[] = quizEnabledCustomFcs.map((fc) => {
      // Find other card backs as distractors
      const otherBacks = flashcardsList
        .filter(other => other.id !== fc.id)
        .map(other => other.back);

      const uniqueOtherBacks = Array.from(new Set(otherBacks))
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);

      while (uniqueOtherBacks.length < 3) {
        const fallbacks = [
          "Definição incorreta elaborada a partir de conceitos adjacentes.",
          "Explicação inapropriada para o termo em questão.",
          "Opção incorreta gerada para fins de fixação de conteúdo.",
          "Nenhuma das opções anteriores está correta para este tema."
        ];
        const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        if (!uniqueOtherBacks.includes(randomFallback)) {
          uniqueOtherBacks.push(randomFallback);
        }
      }

      const options = [fc.back, ...uniqueOtherBacks];
      // Shuffle options and find the correct index
      const shuffled = options
        .map((opt, i) => ({ opt, isCorrect: i === 0 }))
        .sort(() => 0.5 - Math.random());

      const correctOptionIndex = shuffled.findIndex(item => item.isCorrect);
      const finalOptions = shuffled.map(item => item.opt);

      return {
        question: `[Flashcard do Aluno] ${fc.front}`,
        options: finalOptions,
        correctOptionIndex: correctOptionIndex,
        explanation: `Pergunta extraída do seu flashcard personalizado. A resposta correta é: ${fc.back}.`
      };
    });

    return [...baseQuiz, ...customQuestions];
  }, [note.quiz, flashcardsList]);

  // Format interval minutes into a friendly string (e.g., 2m, 30m, 3h, 10h, 2d)
  const formatInterval = (mins: number): string => {
    if (mins < 60) return `${mins}m`;
    const hours = Math.round((mins / 60) * 10) / 10;
    if (hours < 24) return `${hours}h`;
    const days = Math.round((hours / 24) * 10) / 10;
    return `${days}d`;
  };

  // Flashcard response handler (Anki spaced repetition manager)
  const handleFlashcardRating = (rating: "again" | "hard" | "good" | "easy") => {
    const list = [...flashcardsList];
    const currentFc = { ...list[currentFcIndex] };
    const oldBox = currentFc.box || 1;
    let newBox = oldBox;
    let minsToAdd = 2;

    switch (rating) {
      case "again":
        newBox = 1;
        minsToAdd = intervalAgain;
        break;
      case "hard":
        newBox = Math.max(1, oldBox - 1);
        minsToAdd = intervalHard;
        break;
      case "good":
        newBox = Math.min(5, oldBox + 1);
        minsToAdd = intervalGood;
        break;
      case "easy":
        newBox = Math.min(5, oldBox + 2);
        minsToAdd = intervalEasy;
        break;
    }

    currentFc.box = newBox;
    const reviewDate = new Date();
    reviewDate.setMinutes(reviewDate.getMinutes() + minsToAdd);
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

          <button
            onClick={() => setIsAppendModalOpen(true)}
            className="px-3.5 py-1.5 h-8 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-blue-700"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-200 fill-blue-300/30 animate-pulse" />
            Adicionar Novos Assuntos (Prova)
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
          onClick={() => setActiveTab("flashcards")}
          className={`px-4 h-9 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer relative overflow-hidden ${
            activeTab === "flashcards" 
              ? "bg-blue-600 text-white shadow-sm font-extrabold" 
              : "bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/30"
          }`}
        >
          <Zap className={`w-4 h-4 ${activeTab === "flashcards" ? "fill-amber-300 text-amber-300" : "fill-amber-500 text-amber-500 animate-pulse"}`} />
          Flashcards ({flashcardsList.length})
          {activeTab !== "flashcards" && (
            <span className="absolute top-0 right-0 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
          )}
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
                <DidacticDiagram key={index} diagram={diag} />
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
        {false && (() => {
          const nodes = note.mindMap?.nodes || [];
          const edges = note.mindMap?.edges || [];

          if (nodes.length === 0) {
            return (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5 text-center py-12">
                <Map className="w-12 h-12 text-slate-300 mx-auto animate-bounce" />
                <p className="text-slate-400 italic text-sm">Nenhum mapa mental disponível para esta nota.</p>
              </div>
            );
          }

          // 1. Core node
          const coreNode = nodes.find(n => n.type === 'core') || nodes[0];
          const otherNodes = nodes.filter(n => n.id !== coreNode?.id);

          // 2. Main and sub nodes
          const mainNodes = otherNodes.filter(n => n.type === 'main' || (n.id !== coreNode?.id && n.type !== 'sub'));
          const subNodes = otherNodes.filter(n => n.type === 'sub');

          // SVG canvas dimension
          const viewWidth = 1000;
          const viewHeight = 600;
          const centerX = viewWidth / 2;
          const centerY = viewHeight / 2;

          // Calculate positions
          const positions: Record<string, { x: number; y: number }> = {};
          if (coreNode) {
            positions[coreNode.id] = { x: centerX, y: centerY };
          }

          const mainRadiusX = 290;
          const mainRadiusY = 170;
          const mainCount = mainNodes.length;

          mainNodes.forEach((node, idx) => {
            const angle = (idx * 2 * Math.PI) / (mainCount || 1) - Math.PI / 2;
            positions[node.id] = {
              x: centerX + mainRadiusX * Math.cos(angle),
              y: centerY + mainRadiusY * Math.sin(angle)
            };
          });

          subNodes.forEach((node) => {
            const edge = edges.find(e => e.to === node.id);
            const parentId = edge ? edge.from : null;
            const parentPos = parentId ? positions[parentId] : null;

            if (parentPos) {
              const dx = parentPos.x - centerX;
              const dy = parentPos.y - centerY;
              const distance = Math.sqrt(dx * dx + dy * dy);

              const baseAngle = Math.atan2(dy, dx);
              const siblings = subNodes.filter(sn => {
                const e = edges.find(edgeItem => edgeItem.to === sn.id);
                return e && e.from === parentId;
              });

              const siblingIndex = siblings.findIndex(sn => sn.id === node.id);
              const siblingCount = siblings.length;

              const spread = Math.PI / 2.2;
              const angleOffset = siblingCount > 1
                ? (siblingIndex - (siblingCount - 1) / 2) * (spread / (siblingCount - 1))
                : 0;

              const subAngle = baseAngle + angleOffset;
              const subRadius = 130;

              positions[node.id] = {
                x: parentPos.x + subRadius * Math.cos(subAngle),
                y: parentPos.y + subRadius * Math.sin(subAngle)
              };
            } else {
              const idx = subNodes.indexOf(node);
              const angle = (idx * 2 * Math.PI) / (subNodes.length || 1);
              positions[node.id] = {
                x: centerX + 340 * Math.cos(angle),
                y: centerY + 240 * Math.sin(angle)
              };
            }
          });

          // Text wrap helper
          const wrapText = (text: string, maxCharsPerLine = 15) => {
            const words = text.split(/\s+/);
            const lines: string[] = [];
            let currentLine = "";

            words.forEach(word => {
              if ((currentLine + " " + word).trim().length <= maxCharsPerLine) {
                currentLine = (currentLine + " " + word).trim();
              } else {
                if (currentLine) lines.push(currentLine);
                currentLine = word;
              }
            });
            if (currentLine) lines.push(currentLine);

            if (lines.length > 3) {
              return [...lines.slice(0, 2), "..."];
            }
            return lines;
          };

          // Render wrapped text inside SVG
          const renderWrappedText = (text: string, x: number, y: number, textColor: string, fontSize: string, fontWeight: string, maxChars = 15) => {
            const lines = wrapText(text, maxChars);
            const lineHeight = parseInt(fontSize) * 1.1 || 16;
            const totalHeight = (lines.length - 1) * lineHeight;
            const startY = y - totalHeight / 2;

            return lines.map((line, idx) => (
              <tspan
                key={idx}
                x={x}
                y={startY + idx * lineHeight + 4}
                textAnchor="middle"
                fill={textColor}
                fontSize={fontSize}
                fontWeight={fontWeight}
                fontFamily="Caveat"
              >
                {line}
              </tspan>
            ));
          };

          // Theme colors
          const pastelStyles = [
            { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a", accent: "#3b82f6" }, // Blue
            { bg: "#f0fdf4", border: "#16a34a", text: "#14532d", accent: "#22c55e" }, // Green
            { bg: "#fff7ed", border: "#ea580c", text: "#7c2d12", accent: "#f97316" }, // Orange
            { bg: "#faf5ff", border: "#9333ea", text: "#581c87", accent: "#a855f7" }, // Purple
            { bg: "#fff1f2", border: "#e11d48", text: "#881337", accent: "#f43f5e" }, // Pink
            { bg: "#f0fdfa", border: "#0d9488", text: "#115e59", accent: "#14b8a6" }, // Teal
          ];

          const getNodeStyle = (node: any) => {
            if (node.id === coreNode?.id) {
              return { bg: "#eff6ff", border: "#2563eb", text: "#1e3a8a", accent: "#3b82f6" };
            }
            if (node.type === "main") {
              const mainIdx = mainNodes.findIndex(m => m.id === node.id);
              return pastelStyles[Math.max(0, mainIdx) % pastelStyles.length];
            }
            // Sub node style inherits parent's color
            const edge = edges.find(e => e.to === node.id);
            const parentId = edge ? edge.from : null;
            const parentIdx = parentId ? mainNodes.findIndex(m => m.id === parentId) : 0;
            return pastelStyles[Math.max(0, parentIdx) % pastelStyles.length];
          };

          const renderNodeIcon = (index: number, color: string) => {
            const iconIndex = index % 7;
            switch (iconIndex) {
              case 0: // Brain
                return (
                  <path d="M-6 -2 C-10 -2, -10 -8, -6 -8 C-8 -11, -2 -11, 0 -7 C2 -11, 8 -11, 6 -8 C10 -8, 10 -2, 6 -2 C8 2, 4 6, 0 6 C-4 6, -8 2, -6 -2 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                );
              case 1: // Star
                return (
                  <path d="M0 -8 L2.5 -3 L8 -2.5 L4 1.5 L5 7 L0 4.5 L-5 7 L-4 1.5 L-8 -2.5 L-2.5 -3 Z" fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
                );
              case 2: // Target
                return (
                  <g>
                    <circle cx="0" cy="0" r="7" fill="none" stroke={color} strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="3" fill="none" stroke={color} strokeWidth="1.5" />
                    <circle cx="0" cy="0" r="0.8" fill={color} />
                  </g>
                );
              case 3: // Book
                return (
                  <rect x="-6" y="-7" width="12" height="14" rx="1.5" fill="none" stroke={color} strokeWidth="1.5" />
                );
              case 4: // Puzzle
                return (
                  <path d="M-5 -3 C-5 -5 -3 -5 -3 -5 C-3 -7 -1 -7 -1 -7 C1 -7 1 -5 1 -5 C1 -5 3 -5 3 -5 C3 -3 5 -3 5 -3 C5 -1 5 1 5 1 C5 1 7 1 7 3 C7 5 5 5 5 5 C5 5 5 7 3 7 C3 7 1 7 1 7" fill="none" stroke={color} strokeWidth="1.5" />
                );
              case 5: // Leaf/Sprout
                return (
                  <path d="M-5 5 C-5 0, 0 -5, 5 -5 M0 0 C2 2, 5 2, 5 2 M-5 5 L5 -5" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
                );
              default: // Trophy / Award
                return (
                  <path d="M-6 -6 H6 V0 C6 3.5, 3.5 6, 0 6 C-3.5 6, -6 3.5, -6 0 Z M-3 6 L-5 9 H5 L3 6" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                );
            }
          };

          const exportAsSvg = () => {
            const svgEl = document.getElementById("interactive-mindmap-svg");
            if (!svgEl) return;
            try {
              const svgString = new XMLSerializer().serializeToString(svgEl);
              const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `Mapa_Mental_${note.title.replace(/\s+/g, "_")}.svg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            } catch (err) {
              console.error("Erro ao exportar:", err);
            }
          };

          const cloudPath = "M -100 -20 C -110 -50, -80 -75, -50 -70 C -30 -90, 10 -90, 30 -70 C 55 -80, 85 -65, 80 -35 C 100 -30, 100, 10, 80, 25 C 85, 55, 55, 70, 25, 60 C 0, 80, -40, 80, -60, 60 C -90, 65, -105, 35, -100, 15 C -120, 10, -120 -15, -100 -20 Z";

          // Spiral bindings
          const spiralRings = Array.from({ length: 17 }).map((_, i) => (
            <g key={`spiral-${i}`} transform={`translate(20, ${40 + i * 32})`}>
              <circle cx="5" cy="0" r="4.5" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
              <path d="M 5 -4 C 5 -12, -18 -12, -18 0 C -18 12, 5 12, 5 4" fill="none" stroke="url(#spiral-wire)" strokeWidth="3" filter="url(#spiral-shadow)" />
            </g>
          ));

          return (
            <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-extrabold text-slate-800 font-sans flex items-center gap-2">
                    <Map className="w-5 h-5 text-blue-500 animate-pulse" />
                    Mapa Mental do Caderno de Estudos
                  </h3>
                  <p className="text-xs text-slate-500">
                    Estilo caderno personalizado com distribuição dinâmica de tópicos. Arraste para mover, use os botões ou scroll para ampliar.
                  </p>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-2 self-start sm:self-auto bg-slate-50 border border-slate-200 rounded-xl p-1 shadow-2xs">
                  <button
                    onClick={() => setMmZoom(prev => Math.min(prev * 1.2, 3.5))}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 shadow-3xs transition-colors cursor-pointer"
                    title="Ampliar (Zoom In)"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMmZoom(prev => Math.max(prev / 1.2, 0.4))}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 shadow-3xs transition-colors cursor-pointer"
                    title="Reduzir (Zoom Out)"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => { setMmZoom(1); setMmPan({ x: 0, y: 0 }); }}
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 border border-slate-200 shadow-3xs transition-colors cursor-pointer"
                    title="Restaurar Visão"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 mx-1" />
                  <button
                    onClick={exportAsSvg}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-all cursor-pointer"
                    title="Exportar mapa mental em vetor SVG"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar SVG</span>
                  </button>
                </div>
              </div>

              {/* Canvas Wrapper */}
              <div 
                className="relative border border-slate-200 bg-slate-50 rounded-2xl overflow-hidden h-[500px] flex items-center justify-center shadow-inner select-none"
                style={{ cursor: mmDragging ? 'grabbing' : 'grab' }}
                onMouseDown={handleMmMouseDown}
                onMouseMove={handleMmMouseMove}
                onMouseUp={handleMmMouseUp}
                onMouseLeave={handleMmMouseUp}
                onTouchStart={handleMmTouchStart}
                onTouchMove={handleMmTouchMove}
                onTouchEnd={handleMmMouseUp}
              >
                {/* Visual Hint */}
                <div className="absolute top-3 left-3 bg-white/85 backdrop-blur-xs border border-slate-200/60 px-2 py-1 rounded-md text-[10px] text-slate-500 font-sans pointer-events-none z-10 flex items-center gap-1">
                  <Grab className="w-3 h-3 text-slate-400" />
                  <span>Arraste com o mouse para navegar no mapa</span>
                </div>

                <svg 
                  id="interactive-mindmap-svg"
                  width="100%" 
                  height="100%" 
                  viewBox={`0 0 ${viewWidth} ${viewHeight}`} 
                  className="max-w-full transition-all duration-75"
                >
                  <defs>
                    {/* Dotted grid paper pattern */}
                    <pattern id="notebook-dots" width="24" height="24" patternUnits="userSpaceOnUse">
                      <circle cx="12" cy="12" r="1" fill="#cbd5e1" />
                    </pattern>
                    {/* Ring dropshadow */}
                    <filter id="spiral-shadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="1" dy="2" stdDeviation="1" floodOpacity="0.15" />
                    </filter>
                    {/* Ring metallic gradient */}
                    <linearGradient id="spiral-wire" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#94a3b8" />
                      <stop offset="35%" stopColor="#f8fafc" />
                      <stop offset="65%" stopColor="#e2e8f0" />
                      <stop offset="100%" stopColor="#475569" />
                    </linearGradient>
                    {/* Handwritten marker */}
                    <marker id="hand-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1.5 L 9 5 L 0 8.5 C 1.5 6, 1.5 4, 0 1.5 Z" fill="#3b82f6" />
                    </marker>
                    {/* Shadow filter */}
                    <filter id="sticker-shadow" x="-10%" y="-10%" width="130%" height="130%">
                      <feDropShadow dx="1" dy="3" stdDeviation="2.5" floodOpacity="0.08" />
                    </filter>
                  </defs>

                  {/* Cozy paper background */}
                  <rect width="100%" height="100%" fill="#FAF9F5" />
                  <rect width="100%" height="100%" fill="url(#notebook-dots)" opacity="0.8" />

                  {/* Margins */}
                  <line x1="60" y1="0" x2="60" y2="100%" stroke="#fecaca" strokeWidth="1.5" />
                  <line x1="63" y1="0" x2="63" y2="100%" stroke="#fecaca" strokeWidth="0.8" opacity="0.5" />

                  {/* Spiral rings on left */}
                  <g>{spiralRings}</g>

                  {/* Zoom/Pan Group */}
                  <g transform={`translate(${mmPan.x}, ${mmPan.y}) scale(${mmZoom})`} style={{ transformOrigin: "center" }}>
                    
                    {/* Connecting lines drawn behind the nodes */}
                    {edges.map((edge, i) => {
                      const fromPos = positions[edge.from];
                      const toPos = positions[edge.to];
                      if (!fromPos || !toPos) return null;

                      // Make lines beautifully curved
                      const dx = toPos.x - fromPos.x;
                      const dy = toPos.y - fromPos.y;
                      const midX = (fromPos.x + toPos.x) / 2;
                      const midY = (fromPos.y + toPos.y) / 2;

                      // Perpendicular offset for curved feel
                      const len = Math.sqrt(dx * dx + dy * dy) || 1;
                      const px = -dy / len;
                      const py = dx / len;
                      const isCoreEdge = edge.from === coreNode?.id;

                      const offsetVal = (isCoreEdge ? 25 : 12) * (i % 2 === 0 ? 1 : -1);
                      const ctrlX = midX + px * offsetVal;
                      const ctrlY = midY + py * offsetVal;

                      const isSub = subNodes.some(s => s.id === edge.to);
                      const parentStyle = getNodeStyle({ id: edge.to, type: isSub ? "sub" : "main" });

                      return (
                        <g key={`edge-${i}`}>
                          {/* Main stroke line */}
                          <path 
                            d={`M ${fromPos.x} ${fromPos.y} Q ${ctrlX} ${ctrlY} ${toPos.x} ${toPos.y}`}
                            fill="none" 
                            stroke={parentStyle.accent}
                            strokeWidth={isCoreEdge ? "3" : "1.8"} 
                            strokeDasharray={isCoreEdge ? "none" : "5 3"}
                            strokeLinecap="round"
                            markerEnd="url(#hand-arrow)"
                            opacity="0.8"
                          />
                        </g>
                      );
                    })}

                    {/* Nodes group */}
                    {nodes.map((node, i) => {
                      const pos = positions[node.id];
                      if (!pos) return null;

                      const isCore = node.id === coreNode?.id;
                      const isMain = node.type === "main";
                      const style = getNodeStyle(node);

                      if (isCore) {
                        // Core Node: Beautiful central cloud with a yellow lightbulb on top!
                        return (
                          <g key={`node-${node.id}`} className="transition-all hover:scale-[1.03] duration-150">
                            {/* Hand-drawn yellow lightbulb floating above core */}
                            <g transform={`translate(${pos.x}, ${pos.y - 72})`}>
                              {/* Hand-sketched glowing spark lines */}
                              <line x1="-15" y1="-22" x2="-25" y2="-32" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                              <line x1="0" y1="-28" x2="0" y2="-40" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                              <line x1="15" y1="-22" x2="25" y2="-32" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                              <line x1="-25" y1="0" x2="-35" y2="0" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />
                              <line x1="25" y1="0" x2="35" y2="0" stroke="#eab308" strokeWidth="1.5" strokeLinecap="round" />

                              {/* Bulb yellow glass */}
                              <path 
                                d="M -12 8 C -12 20, 12 20, 12 8 C 12 4, 16 0, 16 -8 C 16 -16, 8 -24, 0 -24 C -8 -24, -16 -16, -16 -8 C -16 0, -12 4, -12 8 Z" 
                                fill="#fef08a" 
                                stroke="#d97706" 
                                strokeWidth="2" 
                              />
                              {/* Glowing inner filament */}
                              <path d="M -5 -4 L -2 -12 L 2 -12 L 5 -4" fill="none" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
                              {/* Base */}
                              <rect x="-6" y="14" width="12" height="3" rx="1" fill="#94a3b8" stroke="#ca8a04" strokeWidth="1" />
                            </g>

                            {/* Bumpy shadow cloud */}
                            <path 
                              d={cloudPath} 
                              transform={`translate(${pos.x + 2}, ${pos.y + 4})`}
                              fill="#1e293b" 
                              opacity="0.08" 
                            />
                            {/* Bumpy cloud core */}
                            <path 
                              d={cloudPath} 
                              transform={`translate(${pos.x}, ${pos.y})`}
                              fill="#eff6ff" 
                              stroke="#2563eb" 
                              strokeWidth="3.5" 
                            />
                            {/* Inner dashed line for stickers feel */}
                            <path 
                              d={cloudPath} 
                              transform={`translate(${pos.x}, ${pos.y}) scale(0.92)`}
                              fill="none" 
                              stroke="#60a5fa" 
                              strokeWidth="1.2" 
                              strokeDasharray="4 3" 
                            />
                            {/* Text inside core */}
                            <text 
                              x={pos.x} 
                              y={pos.y} 
                            >
                              {renderWrappedText(node.label, pos.x, pos.y, "#1e3a8a", "18px", "bold", 14)}
                            </text>
                          </g>
                        );
                      }

                      // Sub-topic sticker notes (main or sub types)
                      const radiusX = isMain ? 80 : 70;
                      const radiusY = isMain ? 28 : 24;

                      return (
                        <g 
                          key={`node-${node.id}`} 
                          className="transition-all hover:scale-[1.04] duration-150 cursor-default"
                          filter="url(#sticker-shadow)"
                        >
                          {/* Styled notebook sticker rectangle */}
                          <rect 
                            x={pos.x - radiusX} 
                            y={pos.y - radiusY} 
                            width={radiusX * 2} 
                            height={radiusY * 2} 
                            rx="12" 
                            fill={style.bg} 
                            stroke={style.border} 
                            strokeWidth={isMain ? "2.5" : "1.8"} 
                          />
                          {/* Inner dashed decoration line */}
                          <rect 
                            x={pos.x - radiusX + 3.5} 
                            y={pos.y - radiusY + 3.5} 
                            width={(radiusX - 3.5) * 2} 
                            height={(radiusY - 3.5) * 2} 
                            rx="9" 
                            fill="none" 
                            stroke={style.accent} 
                            strokeWidth="1" 
                            strokeDasharray="3 3.5" 
                            opacity="0.8"
                          />

                          {/* Render custom sketched icon */}
                          <g transform={`translate(${pos.x - radiusX + 16}, ${pos.y})`}>
                            {renderNodeIcon(i, style.border)}
                          </g>

                          {/* Text label */}
                          <text 
                            x={pos.x + 8} 
                            y={pos.y} 
                          >
                            {renderWrappedText(node.label, pos.x + 8, pos.y, style.text, isMain ? "15px" : "13.5px", "bold", isMain ? 13 : 11)}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>

              {/* Detailed Node Explanations */}
              <div className="mt-6 border-t border-slate-100 pt-6 space-y-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                  <h4 className="text-sm font-extrabold text-slate-800 font-sans">
                    Explicação Detalhada de cada Balão do Mapa Mental
                  </h4>
                </div>
                <p className="text-xs text-slate-500 font-sans leading-relaxed">
                  Confira abaixo a explicação conceitual de cada balão presente no mapa mental acima, facilitando sua revisão rápida e memorização ativa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {nodes.map((node) => {
                    const style = getNodeStyle(node);
                    const isCore = node.id === coreNode?.id;
                    const isMain = node.type === "main";

                    // Match description
                    let desc = (node as any).description;
                    if (!desc) {
                      if (note.importantWords) {
                        const match = note.importantWords.find(
                          (w) => w.word.toLowerCase() === node.label.toLowerCase() ||
                                 node.label.toLowerCase().includes(w.word.toLowerCase()) ||
                                 w.word.toLowerCase().includes(node.label.toLowerCase())
                        );
                        if (match) {
                          desc = match.definition;
                        }
                      }
                    }
                    if (!desc) {
                      if (isCore) {
                        desc = note.summary;
                      } else if (isMain) {
                        desc = `Tópico principal focado no estudo aprofundado, cobrindo os aspectos essenciais de "${node.label}" dentro de ${note.subject}.`;
                      } else {
                        desc = `Subtópico complementar detalhando conceitos práticos, definições e causas de "${node.label}".`;
                      }
                    }

                    return (
                      <div 
                        key={node.id} 
                        className="p-4 rounded-2xl border transition-all hover:shadow-2xs space-y-2 flex flex-col justify-between"
                        style={{ 
                          backgroundColor: style.bg + "22", // ~13% opacity
                          borderColor: style.border + "40" 
                        }}
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span 
                              className="px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider font-sans shrink-0 text-white"
                              style={{ 
                                backgroundColor: style.border
                              }}
                            >
                              {isCore ? "Central" : isMain ? "Tópico" : "Subtópico"}
                            </span>
                            <span 
                              className="font-bold text-xs font-sans leading-tight"
                              style={{ color: style.text }}
                            >
                              {node.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 font-sans leading-relaxed">
                            {desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })()}

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
                  <div className="flex items-center gap-2">
                    <span className="font-mono bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold">
                      Box {flashcardsList[currentFcIndex]?.box || 1}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const currentFc = flashcardsList[currentFcIndex];
                        setEditingFc(currentFc);
                        setEditingFcFront(currentFc.front);
                        setEditingFcBack(currentFc.back);
                      }}
                      title="Editar este flashcard"
                      className="p-1.5 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-blue-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlashcard(flashcardsList[currentFcIndex].id)}
                      title="Excluir este flashcard"
                      className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer flex items-center justify-center border border-transparent hover:border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardRating('again'); }}
                    className="h-14 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs group"
                  >
                    <span className="text-xs font-extrabold font-sans">Errei</span>
                    <span className="text-[10px] text-red-500 font-mono font-bold mt-0.5">{formatInterval(intervalAgain)}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardRating('hard'); }}
                    className="h-14 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs group"
                  >
                    <span className="text-xs font-extrabold font-sans">Difícil</span>
                    <span className="text-[10px] text-amber-600 font-mono font-bold mt-0.5">{formatInterval(intervalHard)}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardRating('good'); }}
                    className="h-14 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs group"
                  >
                    <span className="text-xs font-extrabold font-sans">Bom</span>
                    <span className="text-[10px] text-emerald-600 font-mono font-bold mt-0.5">{formatInterval(intervalGood)}</span>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleFlashcardRating('easy'); }}
                    className="h-14 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-2xl transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xs group"
                  >
                    <span className="text-xs font-extrabold font-sans">Fácil</span>
                    <span className="text-[10px] text-blue-600 font-mono font-bold mt-0.5">{formatInterval(intervalEasy)}</span>
                  </button>
                </div>

                {/* Spaced repetition description text & settings toggle */}
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    <p className="text-[10px] text-slate-400 text-center font-sans">
                      *Sistema de repetição espaçada integrado (Estilo Anki).
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowIntervalSettings(!showIntervalSettings)}
                      className="text-[10px] text-blue-600 font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                    >
                      {showIntervalSettings ? "Ocultar Ajustes" : "Personalizar Tempos"}
                    </button>
                  </div>

                  {showIntervalSettings && (
                    <div className="w-full bg-slate-50 border border-slate-100 p-3 rounded-2xl animate-fadeIn space-y-2">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                        Personalizar Tempos (em minutos)
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-red-500 block text-center">Errei</label>
                          <input 
                            type="number" 
                            min="1"
                            value={intervalAgain}
                            onChange={(e) => setIntervalAgain(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-1 text-center text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-red-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-amber-600 block text-center">Difícil</label>
                          <input 
                            type="number" 
                            min="1"
                            value={intervalHard}
                            onChange={(e) => setIntervalHard(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-1 text-center text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-emerald-600 block text-center">Bom</label>
                          <input 
                            type="number" 
                            min="1"
                            value={intervalGood}
                            onChange={(e) => setIntervalGood(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-1 text-center text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-blue-600 block text-center">Fácil</label>
                          <input 
                            type="number" 
                            min="1"
                            value={intervalEasy}
                            onChange={(e) => setIntervalEasy(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full p-1 text-center text-xs font-mono border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIntervalAgain(2);
                            setIntervalHard(30);
                            setIntervalGood(180);
                            setIntervalEasy(600);
                          }}
                          className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-0.5 rounded-md font-bold cursor-pointer transition-all"
                        >
                          Resetar para Padrão (2m, 30m, 3h, 10h)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Custom Flashcard Creator Panel */}
            <div className="border-t border-slate-100 pt-6 mt-6 space-y-3">
              {generationError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-2 font-sans">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{generationError}</span>
                </div>
              )}

              {!showCreateFcForm ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateFcForm(true)}
                    className="flex-1 py-3 border border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/10 hover:bg-blue-50/40 text-blue-600 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs font-sans"
                  >
                    <Plus className="w-4 h-4" />
                    Criar Flashcard Manual
                  </button>
                  <button
                    type="button"
                    disabled={isAiGenerating}
                    onClick={() => handleGenerateMoreMaterials("flashcards")}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs font-sans"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Gerando com IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Gerar +3 Flashcards com IA ✨</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleAddCustomFlashcard} className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Novo Flashcard Personalizado
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowCreateFcForm(false)}
                      className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Frente / Pergunta</label>
                    <textarea
                      required
                      rows={2}
                      value={newFcFront}
                      onChange={(e) => setNewFcFront(e.target.value)}
                      placeholder="Ex: Qual é o principal evento que desencadeou a Primeira Guerra Mundial?"
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Verso / Resposta</label>
                    <textarea
                      required
                      rows={2}
                      value={newFcBack}
                      onChange={(e) => setNewFcBack(e.target.value)}
                      placeholder="Ex: O assassinato do Arquiduque Francisco Ferdinando em Sarajevo em 1914."
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                    />
                  </div>

                  {/* Option "Possibilidade de cair na prova" */}
                  <div className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100 rounded-2xl">
                    <div className="space-y-0.5 pr-2">
                      <p className="text-xs font-bold text-slate-700 font-sans">Cair na Prova/Simulado?</p>
                      <p className="text-[10px] text-slate-400 font-sans">Ao ativar, esta pergunta poderá aparecer de forma objetiva no seu Quiz de Prática!</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={newFcCanQuiz}
                        onChange={(e) => setNewFcCanQuiz(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateFcForm(false)}
                      className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-all font-sans"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-all font-sans"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Salvar Flashcard
                    </button>
                  </div>
                </form>
              )}
            </div>
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
            <div className="lg:col-span-3 space-y-6">
              
              {/* Option A: QUIZ DE ALTERNATIVAS */}
              {practiceSubTab === "quiz" && (
                combinedQuiz && combinedQuiz.length > 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <span className="font-bold text-blue-600 font-sans">Questão {selectedQuizIndex + 1} de {combinedQuiz.length}</span>
                      <span className="font-semibold text-slate-400 font-sans">Objetiva</span>
                    </div>

                    <p className="font-bold text-sm text-slate-800 leading-relaxed font-sans text-left">
                      {combinedQuiz[selectedQuizIndex]?.question}
                    </p>

                    <div className="space-y-2.5">
                      {combinedQuiz[selectedQuizIndex]?.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === combinedQuiz[selectedQuizIndex]?.correctOptionIndex;
                        
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
                            className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between text-left ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                            {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification action area */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                      {!quizChecked ? (
                        <button
                          type="button"
                          onClick={() => checkQuizAnswer(combinedQuiz[selectedQuizIndex], selectedQuizIndex)}
                          disabled={selectedOption === null}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer font-sans"
                        >
                          Verificar Resposta
                        </button>
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600 text-left font-sans">
                            <p className="font-bold text-slate-800 mb-1">Explicação do Professor:</p>
                            <p>{combinedQuiz[selectedQuizIndex]?.explanation}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => nextQuizQuestion(combinedQuiz.length)}
                            className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer font-sans"
                          >
                            Próxima Questão
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xs text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h5 className="font-bold text-sm text-slate-800 font-sans">Sem questões de Quiz</h5>
                    <p className="text-xs text-slate-500 font-sans">Ainda não existem perguntas objetivas cadastradas neste caderno de estudos.</p>
                  </div>
                )
              )}

              {/* Option B: ENEM QUESTIONS */}
              {practiceSubTab === "enem" && (
                note.enemQuestions && note.enemQuestions.length > 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <span className="font-extrabold text-blue-600 font-sans tracking-wide">Padrão ENEM / Vestibular</span>
                      <span className="font-semibold text-slate-400 font-sans">Questão {selectedQuizIndex + 1} de {note.enemQuestions.length}</span>
                    </div>

                    <p className="text-xs text-slate-500 bg-slate-100 p-4 rounded-xl border border-slate-200/50 leading-relaxed italic font-serif text-left">
                      Texto de Apoio ENEM: {note.summary}
                    </p>

                    <p className="font-semibold text-sm text-slate-800 leading-relaxed font-sans text-left">
                      {note.enemQuestions[selectedQuizIndex]?.question}
                    </p>

                    <div className="space-y-2.5">
                      {note.enemQuestions[selectedQuizIndex]?.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === note.enemQuestions[selectedQuizIndex]?.correctOptionIndex;
                        
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
                            className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between text-left ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                            {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification action area */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                      {!quizChecked ? (
                        <button
                          type="button"
                          onClick={() => checkQuizAnswer(note.enemQuestions[selectedQuizIndex], selectedQuizIndex)}
                          disabled={selectedOption === null}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer font-sans"
                        >
                          Verificar Resposta
                        </button>
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600 text-left font-sans">
                            <p className="font-bold text-slate-800 mb-1 font-sans">Gabarito Comentado (ENEM):</p>
                            <p>{note.enemQuestions[selectedQuizIndex]?.explanation}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => nextQuizQuestion(note.enemQuestions.length)}
                            className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer font-sans"
                          >
                            Próxima Questão
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xs text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h5 className="font-bold text-sm text-slate-800 font-sans">Sem simulados ENEM</h5>
                    <p className="text-xs text-slate-500 font-sans">Ainda não existem simulados no padrão ENEM criados para este conteúdo.</p>
                  </div>
                )
              )}

              {/* Option C: CHALLENGES */}
              {practiceSubTab === "challenges" && (
                note.challenges && note.challenges.length > 0 ? (
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-5">
                    <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                      <span className="font-extrabold text-amber-600 font-sans tracking-wide flex items-center gap-1">
                        <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
                        Desafio Extremo
                      </span>
                      <span className="font-semibold text-slate-400 font-sans">Questão {selectedQuizIndex + 1} de {note.challenges.length}</span>
                    </div>

                    <p className="font-bold text-sm text-slate-800 leading-relaxed font-sans text-left">
                      {note.challenges[selectedQuizIndex]?.question}
                    </p>

                    <div className="space-y-2.5">
                      {note.challenges[selectedQuizIndex]?.options.map((opt, i) => {
                        const isSelected = selectedOption === i;
                        const isCorrect = i === note.challenges[selectedQuizIndex]?.correctOptionIndex;
                        
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
                            className={`p-3.5 border rounded-2xl text-xs font-medium cursor-pointer transition-all flex items-center justify-between text-left ${optionStyle}`}
                          >
                            <span>{opt}</span>
                            {quizChecked && isCorrect && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                            {quizChecked && isSelected && !isCorrect && <X className="w-4 h-4 text-red-600 shrink-0 ml-2" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification action area */}
                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between gap-4">
                      {!quizChecked ? (
                        <button
                          type="button"
                          onClick={() => checkQuizAnswer(note.challenges[selectedQuizIndex], selectedQuizIndex)}
                          disabled={selectedOption === null}
                          className="px-5 h-10 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all ml-auto flex items-center gap-1 cursor-pointer font-sans"
                        >
                          Verificar Resposta
                        </button>
                      ) : (
                        <div className="w-full space-y-4">
                          <div className="p-4 rounded-2xl text-xs leading-relaxed bg-slate-50 border border-slate-100 text-slate-600 text-left font-sans">
                            <p className="font-bold text-slate-800 mb-1 font-sans">Gabarito e Raciocínio de Alto Nível:</p>
                            <p>{note.challenges[selectedQuizIndex]?.explanation}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => nextQuizQuestion(note.challenges.length)}
                            className="px-5 h-10 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all ml-auto block cursor-pointer font-sans"
                          >
                            Próxima Questão
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xs text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h5 className="font-bold text-sm text-slate-800 font-sans">Sem Desafios Acadêmicos</h5>
                    <p className="text-xs text-slate-500 font-sans">Ainda não há desafios de alto nível de dificuldade disponíveis.</p>
                  </div>
                )
              )}

              {/* Option D: Questões Discursivas */}
              {practiceSubTab === "discursive" && (
                note.discursiveQuestions && note.discursiveQuestions.length > 0 ? (
                  note.discursiveQuestions.map((q, i) => (
                    <div key={i} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-2xs space-y-4 text-left">
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
                          type="button"
                          onClick={() => setDiscursiveRevealed({ ...discursiveRevealed, [i]: !discursiveRevealed[i] })}
                          className="px-4 h-9 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer font-sans"
                        >
                          {discursiveRevealed[i] ? "Ocultar Gabarito" : "Comparar com Resposta Esperada"}
                        </button>
                      </div>

                      {discursiveRevealed[i] && (
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-2xl text-xs leading-relaxed font-sans border border-emerald-100/40 animate-fadeIn text-left">
                          <p className="font-bold mb-1">Gabarito sugerido pelo Professor:</p>
                          <p>{q.suggestedAnswer}</p>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-2xs text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-500 mx-auto" />
                    <h5 className="font-bold text-sm text-slate-800 font-sans">Sem Questões Discursivas</h5>
                    <p className="text-xs text-slate-500 font-sans">Nenhuma questão de resposta dissertativa aberta foi cadastrada.</p>
                  </div>
                )
              )}

              {/* Custom Exercise Panel */}
              <div className="border-t border-slate-100 pt-6 mt-6 space-y-4">
                {generationError && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-700 text-xs rounded-xl flex items-center gap-2 font-sans text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{generationError}</span>
                  </div>
                )}

                {!showCreateQuestionForm ? (
                  <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 text-left">
                    <div className="space-y-0.5">
                      <h5 className="text-xs font-bold text-slate-800 font-sans flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                        Quer expandir seus exercícios?
                      </h5>
                      <p className="text-[11px] text-slate-500 font-sans leading-relaxed">
                        Adicione suas próprias perguntas personalizadas ou use o poder da IA para criar novos desafios do assunto.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button
                        type="button"
                        onClick={() => {
                          setNewQuestionOptions(practiceSubTab === "enem" ? ["", "", "", "", ""] : ["", "", "", ""]);
                          setShowCreateQuestionForm(true);
                        }}
                        className="flex-1 md:flex-initial px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-3xs font-sans whitespace-nowrap"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Criar Questão
                      </button>
                      <button
                        type="button"
                        disabled={isAiGenerating}
                        onClick={() => handleGenerateMoreMaterials(practiceSubTab)}
                        className="flex-1 md:flex-initial px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs font-sans whitespace-nowrap"
                      >
                        {isAiGenerating ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Gerando...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Gerar +3 com IA ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleAddCustomQuestion} className="bg-white border border-slate-150 p-5 rounded-3xl shadow-sm space-y-4 animate-fadeIn text-left w-full">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5 font-sans">
                        <Plus className="w-4 h-4 text-blue-500" />
                        Nova Questão: <span className="text-blue-600 capitalize">{practiceSubTab}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCreateQuestionForm(false)}
                        className="p-1 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Enunciado da Pergunta</label>
                      <textarea
                        required
                        rows={2}
                        value={newQuestionText}
                        onChange={(e) => setNewQuestionText(e.target.value)}
                        placeholder={`Ex: Escreva aqui a pergunta para o seu ${practiceSubTab}...`}
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                      />
                    </div>

                    {practiceSubTab === "discursive" ? (
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Gabarito Sugerido / Resposta Esperada</label>
                        <textarea
                          required
                          rows={3}
                          value={newQuestionSuggestedAnswer}
                          onChange={(e) => setNewQuestionSuggestedAnswer(e.target.value)}
                          placeholder="Ex: Resposta ideal esperada para esta questão discursiva..."
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Alternativas</label>
                          <div className="grid grid-cols-1 gap-2">
                            {(practiceSubTab === "enem" ? [0, 1, 2, 3, 4] : [0, 1, 2, 3]).map((idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 font-mono w-5">
                                  {String.fromCharCode(65 + idx)})
                                </span>
                                <input
                                  type="text"
                                  required
                                  value={newQuestionOptions[idx] || ""}
                                  onChange={(e) => {
                                    const opts = [...newQuestionOptions];
                                    opts[idx] = e.target.value;
                                    setNewQuestionOptions(opts);
                                  }}
                                  placeholder={`Alternativa ${String.fromCharCode(65 + idx)}`}
                                  className="flex-1 p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-500 bg-slate-50/10 focus:bg-white transition-all font-sans"
                                />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Opção Correta (Gabarito)</label>
                            <select
                              value={newQuestionCorrectIndex}
                              onChange={(e) => setNewQuestionCorrectIndex(parseInt(e.target.value))}
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-white font-sans font-semibold text-slate-700"
                            >
                              {(practiceSubTab === "enem" ? [0, 1, 2, 3, 4] : [0, 1, 2, 3]).map((idx) => (
                                <option key={idx} value={idx}>
                                  Opção {String.fromCharCode(65 + idx)}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Explicação / Resolução comentada</label>
                            <input
                              type="text"
                              value={newQuestionExplanation}
                              onChange={(e) => setNewQuestionExplanation(e.target.value)}
                              placeholder="Explicação amigável de por que esta opção está correta..."
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all font-sans"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowCreateQuestionForm(false)}
                        className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold cursor-pointer transition-all font-sans"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer shadow-xs transition-all font-sans"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Salvar Exercício
                      </button>
                    </div>
                  </form>
                )}
              </div>
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

        {/* MODAL: ADICIONAR NOVOS ASSUNTOS DA PROVA */}
        <AnimatePresence>
          {isAppendModalOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl max-w-xl w-full border border-slate-100 shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[90vh]"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                      <Sparkles className="w-5 h-5 fill-blue-600/10 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-800 tracking-tight">Adicionar Novos Assuntos do Professor</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Matéria: {note.subject}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      if (!isAppending) {
                        setIsAppendModalOpen(false);
                        setAppendTopic("");
                        setAppendUploadedFiles([]);
                        setAppendError(null);
                      }
                    }}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {isAppending ? (
                  /* Loading State */
                  <div className="flex-1 py-12 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                      {/* Double Pulsing Circles */}
                      <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 animate-pulse">
                        <Sparkles className="w-10 h-10 fill-blue-600/10 animate-spin" />
                      </div>
                      <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-ping" />
                    </div>
                    
                    <div className="space-y-2 max-w-md">
                      <h4 className="text-sm font-bold text-slate-800 animate-pulse">Professor Virtual trabalhando...</h4>
                      <p className="text-xs text-slate-500 font-semibold min-h-[36px] px-4 leading-relaxed transition-all duration-300">
                        {APPEND_LOADER_PHRASES[appendLoaderPhraseIndex]}
                      </p>
                    </div>

                    <div className="w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: `${((appendLoaderPhraseIndex + 1) / APPEND_LOADER_PHRASES.length) * 100}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  /* Form State */
                  <div className="flex-1 overflow-y-auto space-y-5 pr-1 text-left">
                    <p className="text-xs text-slate-500 leading-relaxed font-sans">
                      Se o seu professor passou novos temas que vão cair na prova, anote-os aqui ou envie fotos das anotações/slides. O Professor Virtual vai mesclar isso ao seu caderno existente, adicionando novas explicações, gerando novos flashcards ativos e novos exercícios personalizados!
                    </p>

                    {/* Text Field */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        Descreva os novos assuntos da prova:
                      </label>
                      <textarea
                        value={appendTopic}
                        onChange={(e) => setAppendTopic(e.target.value)}
                        placeholder="Ex: Formula de bhaskara para achar o x, o delta, e também como calcular o vértice da parábola..."
                        rows={4}
                        className="w-full p-3 border border-slate-200 rounded-2xl text-xs focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50/50 focus:bg-white transition-all font-sans resize-none"
                      />
                    </div>

                    {/* File Attachment Upload */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 block">
                        Fotos de anotações ou slides do professor (Opcional):
                      </label>
                      
                      <div 
                        onClick={() => appendFileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-200 hover:border-blue-500 hover:bg-blue-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group"
                      >
                        <input
                          type="file"
                          ref={appendFileInputRef}
                          onChange={handleAppendFileChange}
                          multiple
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-blue-50 text-slate-400 group-hover:text-blue-500 flex items-center justify-center transition-colors">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Clique para enviar arquivos</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Formatos aceitos: Imagens (PNG, JPG, WEBP)</p>
                        </div>
                      </div>

                      {/* List of uploaded files */}
                      {appendUploadedFiles.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                          {appendUploadedFiles.map((file) => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] font-semibold text-slate-700"
                            >
                              <span className="truncate max-w-[80%]">{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeAppendUploadedFile(file.id)}
                                className="p-1 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Error message */}
                    {appendError && (
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex flex-col gap-2">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-rose-600 mt-0.5" />
                          <div>
                            <p className="font-extrabold text-rose-900">Erro temporário ao atualizar caderno</p>
                            <p className="text-[11px] text-rose-700 font-medium mt-0.5">{appendError}</p>
                          </div>
                        </div>
                        <div className="p-3 bg-white/70 border border-rose-100/50 rounded-xl">
                          <p className="font-bold text-[11px] text-rose-900 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                            Nenhum dado do caderno foi modificado ou perdido!
                          </p>
                          <p className="text-[10px] text-rose-600 mt-0.5 leading-normal font-medium">
                            Seu caderno de estudos continua intacto e seguro. Como esta instabilidade é passageira, aguarde alguns instantes e clique para tentar atualizar novamente.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-50">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAppendModalOpen(false);
                          setAppendTopic("");
                          setAppendUploadedFiles([]);
                          setAppendError(null);
                        }}
                        className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={triggerAppendContent}
                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-blue-700"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-blue-200 fill-blue-300/20" />
                        Atualizar Caderno & Flashcards 🚀
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* MODAL: EDITAR FLASHCARD */}
        <AnimatePresence>
          {editingFc && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="bg-white rounded-3xl max-w-md w-full border border-slate-100 shadow-2xl p-6 relative overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
                  <div className="flex items-center gap-2 text-left">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                      <Pencil className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Editar Pergunta e Resposta</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Ajuste seu flashcard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingFc(null)}
                    className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSaveEditedFlashcard} className="space-y-4 text-left">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Pergunta / Frente</label>
                    <textarea
                      required
                      rows={3}
                      value={editingFcFront}
                      onChange={(e) => setEditingFcFront(e.target.value)}
                      placeholder="Qual é a pergunta do flashcard?"
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-extrabold text-slate-500 uppercase font-sans">Resposta / Verso</label>
                    <textarea
                      required
                      rows={3}
                      value={editingFcBack}
                      onChange={(e) => setEditingFcBack(e.target.value)}
                      placeholder="Qual é a resposta sugerida?"
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 bg-slate-50/30 focus:bg-white transition-all resize-none font-sans"
                    />
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingFc(null)}
                      className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-blue-700"
                    >
                      Salvar Alterações
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
