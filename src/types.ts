export interface ImportantWord {
  word: string;
  definition: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  box: number; // For spaced repetition (Leitner system Box 1-5)
  nextReviewDate: string; // ISO string
  canAppearInQuiz?: boolean; // Possibilidade de cair na prova/simulados
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface DiscursiveQuestion {
  question: string;
  suggestedAnswer: string;
}

export interface Diagram {
  title: string;
  diagramAscii: string;
  description: string;
}

export interface MindMapNode {
  id: string;
  label: string;
  type: 'core' | 'main' | 'sub';
  x?: number;
  y?: number;
}

export interface MindMapEdge {
  from: string;
  to: string;
}

export interface MindMap {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface StudyNote {
  id: string;
  title: string;
  subject: string;
  date: string;
  summary: string;
  explanationBasic: string;
  explanationIntermediate: string;
  explanationAdvanced: string;
  importantWords: ImportantWord[];
  mindMap: MindMap;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  discursiveQuestions: DiscursiveQuestion[];
  challenges: QuizQuestion[]; // test challenges
  enemQuestions: QuizQuestion[]; // ENEM style questions
  diagrams: Diagram[];
  curiosities: string[];
  practicalExamples: string[];
  tags: string[];
  folder?: string;
  isFavorite: boolean;
  spacedRepetitionDate?: string;
  reviewCount: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai' | 'system';
  text: string;
  timestamp: string;
}

export interface UserStats {
  streak: number;
  lastStudyDate?: string;
  totalTimeStudied: number; // in minutes
  contentsLearned: number;
  quizAccuracy: number; // 0 to 100
  totalQuizzesTaken: number;
  totalCorrectAnswers: number;
  subjectProgress: Record<string, number>; // subject -> progress %
  mistakesBySubject: Record<string, number>; // subject -> mistake count
  studyTimeline: { date: string; minutes: number }[];
}
