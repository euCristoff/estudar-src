import React, { useState, useRef, useEffect } from "react";
import { StudyNote } from "../types";
import { 
  Search, 
  Upload, 
  Folder, 
  Tag, 
  Star, 
  Trash2, 
  Plus, 
  FileText, 
  BookOpen, 
  Sparkles, 
  AlertCircle,
  FileDown,
  X,
  Edit2,
  FolderOpen,
  Camera,
  RotateCw,
  Video,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LibraryProps {
  notes: StudyNote[];
  onOpenNote: (id: string, initialTab?: "content" | "mindmap" | "flashcards" | "practice" | "professor") => void;
  onDeleteNote: (id: string) => void;
  onUpdateNote: (note: StudyNote) => void;
  onAddNote: (note: StudyNote) => void;
}

const SUBJECT_OPTIONS = [
  "Biologia",
  "História",
  "Matemática",
  "Geografia",
  "Português",
  "Física",
  "Química",
  "Inglês",
  "Outra"
];

const FUNNY_LOADER_PHRASES = [
  "A IA está decifrando a caligrafia do material...",
  "Organizando as moléculas e elétrons da explicação...",
  "Desenhando as conexões do seu mapa mental...",
  "Gerando flashcards inteligentes de memorização...",
  "Estruturando os níveis de dificuldade (Básico, Médio e Avançado)...",
  "Elaborando questões inéditas no estilo do ENEM e Vestibulares...",
  "Polindo os detalhes visuais com carinho..."
];

export default function Library({ notes, onOpenNote, onDeleteNote, onUpdateNote, onAddNote }: LibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  
  // Generation Modal States
  const [isGeneratingModalOpen, setIsGeneratingModalOpen] = useState(false);
  const [uploadSubject, setUploadSubject] = useState("Biologia");
  const [uploadTopic, setUploadTopic] = useState("");
  
  // Multiple Uploaded Files
  interface UploadedFile {
    id: string;
    name: string;
    base64: string;
    mimeType: string;
  }
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [loaderPhraseIndex, setLoaderPhraseIndex] = useState(0);
  const loaderIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Edit folder modal state
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [tempFolder, setTempFolder] = useState("");
  const [tempTags, setTempTags] = useState("");

  // Confirmation state for deleting a subject
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Extract all folders & tags
  const folders = Array.from(new Set(notes.map(n => n.folder).filter(Boolean))) as string[];
  const tags = Array.from(new Set(notes.flatMap(n => n.tags || []))).filter(Boolean) as string[];

  // Cycle funny loader phrases
  const startLoaderPhrases = () => {
    setLoaderPhraseIndex(0);
    loaderIntervalRef.current = setInterval(() => {
      setLoaderPhraseIndex(prev => (prev + 1) % FUNNY_LOADER_PHRASES.length);
    }, 3000);
  };

  const stopLoaderPhrases = () => {
    if (loaderIntervalRef.current) {
      clearInterval(loaderIntervalRef.current);
    }
  };

  // Convert uploaded files to Base64 and append
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    (Array.from(files) as File[]).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Get raw base64 data without data:image/png;base64, prefix
        const base64Data = result.split(",")[1];
        
        setUploadedFiles(prev => [
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

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const triggerGenerateNote = async () => {
    if (uploadedFiles.length === 0 && !uploadTopic.trim()) {
      setGenerationError("Por favor, envie pelo menos um arquivo ou digite um tópico/texto para estudo.");
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    startLoaderPhrases();

    try {
      const response = await fetch("/api/generate-study", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          images: uploadedFiles.map(f => ({ base64: f.base64, mimeType: f.mimeType })),
          subject: uploadSubject,
          topic: uploadTopic
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Erro desconhecido ao chamar API de estudos.");
      }

      const noteData = await response.json();
      
      // Inject ID and default folder/favorite properties
      const newNote: StudyNote = {
        ...noteData,
        id: `note-${Date.now()}`,
        date: new Date().toISOString(),
        folder: selectedFolder || noteData.folder || noteData.subject || "Estudos Gerais",
        isFavorite: false,
        reviewCount: 0,
        flashcards: (noteData.flashcards || []).map((fc: any, index: number) => ({
          ...fc,
          id: `fc-${Date.now()}-${index}`,
          box: 1,
          nextReviewDate: new Date().toISOString()
        }))
      };

      onAddNote(newNote);
      setIsGeneratingModalOpen(false);
      
      // Reset inputs
      setUploadedFiles([]);
      setUploadTopic("");
      onOpenNote(newNote.id, "flashcards");
    } catch (err: any) {
      console.error("Erro ao gerar nota:", err);
      setGenerationError(err.message || "Não foi possível conectar com o servidor de IA. Verifique sua chave API.");
    } finally {
      setIsGenerating(false);
      stopLoaderPhrases();
    }
  };

  // Drag and drop events
  const [dragActive, setDragActive] = useState(false);
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      (Array.from(e.dataTransfer.files) as File[]).forEach((file: File) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(",")[1];
          
          setUploadedFiles(prev => [
            ...prev,
            {
              id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              base64: base64Data,
              mimeType: file.type
            }
          ]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Filter notes
  const filteredNotes = notes.filter(note => {
    // Search filter
    const matchesSearch = searchQuery.trim() === "" || 
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.tags && note.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    // Folder filter
    const matchesFolder = !selectedFolder || note.folder === selectedFolder;

    // Tag filter
    const matchesTag = !selectedTag || (note.tags && note.tags.includes(selectedTag));

    // Favorite filter
    const matchesFavorite = !showOnlyFavorites || note.isFavorite;

    return matchesSearch && matchesFolder && matchesTag && matchesFavorite;
  });

  const toggleFavorite = (e: React.MouseEvent, note: StudyNote) => {
    e.stopPropagation();
    onUpdateNote({
      ...note,
      isFavorite: !note.isFavorite
    });
  };

  const openEditMeta = (e: React.MouseEvent, note: StudyNote) => {
    e.stopPropagation();
    setEditingNoteId(note.id);
    setTempFolder(note.folder || "");
    setTempTags(note.tags ? note.tags.join(", ") : "");
  };

  const saveEditMeta = (note: StudyNote) => {
    const formattedTags = tempTags.split(",")
      .map(t => t.trim())
      .filter(t => t.length > 0);

    onUpdateNote({
      ...note,
      folder: tempFolder.trim() || undefined,
      tags: formattedTags
    });
    setEditingNoteId(null);
  };

  return (
    <div id="library-view" className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-12">
      
      {/* Library Left Sidebar */}
      <div id="library-sidebar" className="md:col-span-1 space-y-6">
        {/* Main Action Buttons */}
        <button 
          onClick={() => setIsGeneratingModalOpen(true)}
          className="w-full py-3 bg-linear-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
        >
          <Plus className="w-5 h-5" />
          Importar Caderno / PDF
          <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
        </button>

        {/* Navigation Categories */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2">Navegação</h3>
          
          <button 
            onClick={() => { setSelectedFolder(null); setSelectedTag(null); setShowOnlyFavorites(false); }}
            className={`w-full text-left px-3 py-2 h-9 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              !selectedFolder && !selectedTag && !showOnlyFavorites 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Todos os Conteúdos
            <span className="ml-auto font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm text-[10px]">{notes.length}</span>
          </button>

          <button 
            onClick={() => { setSelectedFolder(null); setSelectedTag(null); setShowOnlyFavorites(true); }}
            className={`w-full text-left px-3 py-2 h-9 rounded-xl text-xs font-semibold flex items-center gap-2.5 transition-all cursor-pointer ${
              showOnlyFavorites 
                ? "bg-blue-50 text-blue-600" 
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            Favoritos
            <span className="ml-auto font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-sm text-[10px]">
              {notes.filter(n => n.isFavorite).length}
            </span>
          </button>
        </div>

        {/* Folders (Pastas) */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1.5">
            <Folder className="w-4 h-4" />
            Pastas
          </h3>
          
          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {folders.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-1.5 italic">Nenhuma pasta criada</p>
            ) : (
              folders.map(folder => (
                <button
                  key={folder}
                  onClick={() => { setSelectedFolder(folder); setSelectedTag(null); }}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedFolder === folder 
                      ? "bg-blue-50 text-blue-600 font-bold" 
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  {folder}
                  <span className="ml-auto font-mono text-[10px] text-slate-400">
                    {notes.filter(n => n.folder === folder).length}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-2xs space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-2 flex items-center gap-1.5">
            <Tag className="w-4 h-4" />
            Tags
          </h3>
          
          <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
            {tags.length === 0 ? (
              <p className="text-xs text-slate-400 px-3 py-1.5 italic w-full">Sem tags</p>
            ) : (
              tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => { setSelectedTag(tag === selectedTag ? null : tag); setSelectedFolder(null); }}
                  className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedTag === tag 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                  }`}
                >
                  #{tag}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Library Main Pane */}
      <div id="library-main" className="md:col-span-3 space-y-6">
        
        {/* Search & Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Pesquise por linguagem natural (ex: fotossíntese)..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 h-11 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-sm transition-all shadow-2xs font-sans"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
              >
                Limpar
              </button>
            )}
          </div>
          
          {(selectedFolder || selectedTag || showOnlyFavorites) && (
            <button 
              onClick={() => { setSelectedFolder(null); setSelectedTag(null); setShowOnlyFavorites(false); }}
              className="px-4 h-11 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Filter Title */}
        <div className="flex items-center justify-between">
          <h2 className="text-md font-bold text-slate-700 font-sans">
            {selectedFolder ? `Pasta: ${selectedFolder}` : selectedTag ? `Tag: #${selectedTag}` : showOnlyFavorites ? "Notas Favoritas" : "Todas as Notas de Estudo"}
            <span className="ml-2 font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-bold">
              {filteredNotes.length} encontrado(s)
            </span>
          </h2>
        </div>

        {/* Notes Grid */}
        {filteredNotes.length === 0 ? (
          <div className="text-center py-20 bg-white border border-slate-100 rounded-3xl p-8 space-y-4 shadow-2xs">
            <div className="p-4 bg-slate-50 rounded-2xl w-fit mx-auto text-slate-400">
              <FileText className="w-10 h-10" />
            </div>
            <div className="space-y-1">
              <p className="text-md font-bold text-slate-800 font-sans">Nenhum caderno ou assunto encontrado</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery ? "Nenhum resultado corresponde à sua pesquisa. Tente usar termos diferentes." : "Que tal importar seu primeiro caderno escolar ou enviar uma foto de livro agora mesmo?"}
              </p>
            </div>
            {!searchQuery && (
              <button 
                onClick={() => setIsGeneratingModalOpen(true)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Importar Primeiro Material
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredNotes.map(note => (
              <motion.div
                key={note.id}
                whileHover={{ y: -3 }}
                onClick={() => onOpenNote(note.id)}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-2xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Subject and Favorite row */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 h-5 rounded-full bg-linear-to-r from-blue-50 to-sky-50 text-blue-600 border border-blue-100 inline-flex items-center">
                      {note.subject}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={(e) => toggleFavorite(e, note)}
                        className="p-1 text-slate-300 hover:text-amber-400 hover:scale-110 transition-all cursor-pointer"
                      >
                        <Star className={`w-4 h-4 ${note.isFavorite ? "fill-amber-400 text-amber-400" : ""}`} />
                      </button>
                      <button 
                        onClick={(e) => openEditMeta(e, note)}
                        className="p-1 text-slate-300 hover:text-blue-600 transition-all cursor-pointer"
                        title="Organizar em pasta/tags"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                        className="p-1 text-slate-300 hover:text-red-500 transition-all"
                        title="Excluir Matéria"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Title and Summary */}
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-slate-800 hover:text-blue-600 transition-colors leading-snug">
                      {note.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                      {note.summary}
                    </p>
                  </div>
                </div>

                {note.flashcards && note.flashcards.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenNote(note.id, "flashcards");
                    }}
                    className="w-full h-8.5 bg-blue-50 hover:bg-blue-100 text-blue-700 hover:text-blue-800 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-blue-100/40 relative overflow-hidden group/btn"
                  >
                    <Zap className="w-3.5 h-3.5 fill-blue-600 text-blue-600 group-hover/btn:scale-110 transition-transform" />
                    Estudar {note.flashcards.length} Flashcards
                  </button>
                )}

                {/* Footer details */}
                <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1">
                    <Folder className="w-3 h-3 text-slate-400" />
                    <span className="font-semibold truncate max-w-[100px]">{note.folder || "Sem pasta"}</span>
                  </div>

                  <span className="font-mono">{new Date(note.date).toLocaleDateString("pt-BR")}</span>
                </div>

                {/* Micro Meta Editor drawer inside the card if matching id */}
                {editingNoteId === note.id && (
                  <div 
                    onClick={(e) => e.stopPropagation()} 
                    className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-3"
                  >
                    <h4 className="text-xs font-bold text-slate-600">Organizar Nota</h4>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Pasta</label>
                        <input 
                          type="text" 
                          value={tempFolder}
                          onChange={(e) => setTempFolder(e.target.value)}
                          placeholder="Ex: Ciências Humanas"
                          className="w-full bg-white px-2.5 h-8 border border-slate-200 rounded-md text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">Tags (separadas por vírgula)</label>
                        <input 
                          type="text" 
                          value={tempTags}
                          onChange={(e) => setTempTags(e.target.value)}
                          placeholder="Ex: história, frança, napoleão"
                          className="w-full bg-white px-2.5 h-8 border border-slate-200 rounded-md text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button 
                        onClick={() => setEditingNoteId(null)}
                        className="px-2.5 h-7 bg-white border border-slate-200 text-slate-500 rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => saveEditMeta(note)}
                        className="px-2.5 h-7 bg-blue-600 text-white rounded-md text-xs font-semibold cursor-pointer"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Modern Generation Modal */}
      <AnimatePresence>
        {isGeneratingModalOpen && (
          <div id="generation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
                <div className="flex items-center gap-2 text-slate-800">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base leading-tight">Novo Estudo com IA</h3>
                    <p className="text-xs text-slate-400">Envie uma imagem/PDF ou descreva por texto</p>
                  </div>
                </div>
                <button 
                  onClick={() => !isGenerating && setIsGeneratingModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                  disabled={isGenerating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-5 flex-1">
                
                {isGenerating ? (
                  /* Cool Loader */
                  <div className="py-12 space-y-6 text-center">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse" />
                      <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin" />
                      <Sparkles className="w-8 h-8 text-blue-500 absolute inset-0 m-auto animate-bounce" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-extrabold text-slate-700 animate-pulse">
                        {FUNNY_LOADER_PHRASES[loaderPhraseIndex]}
                      </p>
                      <p className="text-xs text-slate-400">Isso leva aproximadamente 5-10 segundos.</p>
                    </div>
                  </div>
                ) : (
                  /* Forms */
                  <>
                    {generationError && (
                      <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-2xl flex items-start gap-2.5 text-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Houve um imprevisto:</p>
                          <p className="mt-0.5">{generationError}</p>
                        </div>
                      </div>
                    )}

                    {/* Choose Subject */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">Matéria Recomendada</label>
                      <div className="grid grid-cols-3 gap-2">
                        {SUBJECT_OPTIONS.map(subj => (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => setUploadSubject(subj)}
                            className={`px-3 py-2 h-9 rounded-xl text-xs font-bold border transition-all text-center ${
                              uploadSubject === subj 
                                ? "bg-blue-600 border-blue-600 text-white shadow-xs" 
                                : "bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100"
                            }`}
                          >
                            {subj}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Drag and Drop Upload */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Foto da Apostila, Caderno ou Arquivo PDF ({uploadedFiles.length})
                        </label>
                        {uploadedFiles.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setUploadedFiles([])}
                            className="text-[10px] text-red-500 font-extrabold hover:underline cursor-pointer"
                          >
                            Limpar Tudo
                          </button>
                        )}
                      </div>
                      
                      <div
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                          dragActive 
                            ? "border-blue-500 bg-blue-50/50" 
                            : "border-slate-200 hover:border-blue-400 bg-slate-50/50"
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*,application/pdf"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        {uploadedFiles.length === 0 ? (
                          <div className="space-y-2">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl w-fit mx-auto">
                              <Upload className="w-6 h-6" />
                            </div>
                            <p className="text-xs font-bold text-slate-600">Arraste ou clique para adicionar fotos ou PDFs</p>
                            <p className="text-[10px] text-slate-400">Pode selecionar várias fotos juntas ou colocar mais depois</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                              {uploadedFiles.map((file) => (
                                <div 
                                  key={file.id} 
                                  className="relative bg-white border border-slate-150 rounded-xl p-2.5 flex flex-col items-center justify-center text-center group/item hover:border-blue-300 transition-all shadow-2xs"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {file.mimeType.includes("pdf") ? (
                                    <div className="w-12 h-12 rounded-lg bg-red-50 text-red-500 flex items-center justify-center border border-red-100">
                                      <FileDown className="w-6 h-6" />
                                    </div>
                                  ) : (
                                    <img 
                                      src={`data:${file.mimeType};base64,${file.base64}`} 
                                      alt={file.name} 
                                      className="w-12 h-12 object-cover rounded-lg border border-slate-150 shadow-2xs" 
                                    />
                                  )}
                                  <span className="text-[10px] font-bold text-slate-600 truncate max-w-full mt-2 px-1">{file.name}</span>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); removeUploadedFile(file.id); }}
                                    className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-xs transition-colors cursor-pointer"
                                    title="Remover arquivo"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                            <div className="pt-2.5 border-t border-slate-100/50 flex items-center justify-center gap-1.5 text-[10px] text-blue-600 font-extrabold uppercase tracking-wide">
                              <Plus className="w-3.5 h-3.5" />
                              Adicionar mais fotos ou PDFs
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* List of uploaded files */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-1.5 mt-2">
                        <div className="max-h-[160px] overflow-y-auto pr-1 space-y-1.5">
                          {uploadedFiles.map((file) => (
                            <div 
                              key={file.id} 
                              className="flex items-center justify-between p-2 bg-slate-50 border border-slate-100 rounded-xl text-xs"
                            >
                              <div className="flex items-center gap-2 truncate flex-1 mr-2">
                                {file.mimeType.includes("pdf") ? (
                                  <FileDown className="w-4 h-4 text-red-500 shrink-0" />
                                ) : file.mimeType.startsWith("image/") ? (
                                  <img 
                                    src={`data:${file.mimeType};base64,${file.base64}`} 
                                    alt={file.name} 
                                    className="w-8 h-8 object-cover rounded-lg border border-slate-200/80 shrink-0 shadow-2xs" 
                                  />
                                ) : (
                                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                )}
                                <span className="font-semibold text-slate-700 truncate">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeUploadedFile(file.id); }}
                                className="p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center justify-center gap-2 p-2.5 border border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 hover:bg-blue-50/50 text-blue-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar mais fotos / PDFs
                        </button>
                      </div>
                    )}

                    {/* Or Text Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                          Ou Digite o Tópico de Estudo
                        </label>
                        <span className="text-[10px] bg-slate-100 text-slate-400 px-2 py-0.5 rounded-sm">Opcional</span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Ex: Explique as leis de Newton com foco no ENEM e faça exercícios desafiadores."
                        value={uploadTopic}
                        onChange={(e) => setUploadTopic(e.target.value)}
                        className="w-full p-3 bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-xl text-xs font-sans transition-all"
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Footer */}
              {!isGenerating && (
                <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsGeneratingModalOpen(false)}
                    className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold rounded-xl transition-all"
                  >
                    Voltar
                  </button>
                  <button
                    type="button"
                    onClick={triggerGenerateNote}
                    className="px-5 py-2.5 bg-linear-to-r from-blue-600 to-sky-600 hover:from-blue-700 hover:to-sky-700 text-white text-xs font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-1.5"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200 fill-amber-200" />
                    Gerar Trilha de Estudos
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Excluir Matéria Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-2.5 bg-red-50 rounded-xl">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-extrabold text-base leading-tight">Excluir Matéria?</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tem certeza que deseja excluir esta matéria de estudos permanentemente? Isso removerá todos os cadernos, flashcards, mapas mentais e relatórios de quizzes gerados pela IA. Esta ação não poderá ser desfeita.
              </p>
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onDeleteNote(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  Confirmar Exclusão
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
