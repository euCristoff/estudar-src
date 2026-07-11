import { StudyNote, UserStats } from "./types";

export const INITIAL_STATS: UserStats = {
  streak: 0,
  lastStudyDate: "",
  totalTimeStudied: 0, // in minutes
  contentsLearned: 0,
  quizAccuracy: 0,
  totalQuizzesTaken: 0,
  totalCorrectAnswers: 0,
  subjectProgress: {
    "Biologia": 0,
    "História": 0,
    "Matemática": 0,
    "Geografia": 0,
    "Português": 0,
    "Física": 0,
    "Química": 0,
    "Inglês": 0
  },
  mistakesBySubject: {},
  studyTimeline: []
};

export const INITIAL_NOTES: StudyNote[] = [
  {
    id: "note-tabuada-1-ao-10",
    title: "Tabuada de Multiplicação (1 ao 10)",
    subject: "Matemática",
    date: new Date().toISOString(),
    summary: "A tabuada é a base de toda a aritmética e cálculo mental. Compreender seus padrões lógicos e automatizar as respostas de 1 a 10 ajuda a acelerar o raciocínio, resolver problemas do dia a dia e dominar conceitos mais complexos como frações, divisão e álgebra.",
    explanationBasic: "A multiplicação é simplesmente uma soma repetida do mesmo número. Por exemplo: 3 x 4 significa somar o número 4 três vezes (4 + 4 + 4 = 12), ou somar o número 3 quatro vezes (3 + 3 + 3 + 3 = 12). \n\nAlgumas regras básicas tornam tudo mais fácil:\n- **Tabuada do 1**: Qualquer número multiplicado por 1 é ele mesmo (ex: 1 x 8 = 8).\n- **Tabuada do 2**: É sempre o dobro do número (ex: 2 x 6 = 12).\n- **Tabuada do 5**: Sempre termina em 0 ou 5, pulando de 5 em 5 (ex: 5, 10, 15, 20...).\n- **Tabuada do 10**: Basta colocar um número zero à direita do número multiplicado (ex: 10 x 7 = 70).",
    explanationIntermediate: "Para dominar as tabuadas intermediárias (como 3, 4, 6, 7, 8 e 9), use truques de associação e a propriedade comutativa. A propriedade comutativa garante que 'a ordem dos fatores não altera o produto': sabendo que 5 x 6 = 30, você automaticamente sabe que 6 x 5 = 30! Isso reduz pela metade o número de contas que você precisa decorar.\n\nOutros truques práticos:\n- **Tabuada do 4**: É o dobro do dobro (ex: para fazer 4 x 7, pense no dobro de 7, que é 14, e dobre novamente: 28).\n- **Tabuada do 9**: A soma dos dois algarismos do resultado é sempre igual a 9! (ex: 9 x 2 = 18 [1+8=9], 9 x 5 = 45 [4+5=9], 9 x 8 = 72 [7+2=9]). Além disso, o primeiro algarismo do resultado é sempre o número que você está multiplicando menos 1 (ex: 9 x 8 -> dezenas: 8 - 1 = 7, unidades: o que falta para 9, que é 2. Logo, 72!).",
    explanationAdvanced: "A automação de cálculos mentais (saber instantaneamente sem contar nos dedos) é chamada de 'Automação Cognitiva'. Ao fixar que 7 x 8 = 56 ou 6 x 9 = 54 na memória de longo prazo, o cérebro economiza espaço de processamento da memória de trabalho. Isso permite que você resolva problemas matemáticos difíceis, como equações e geometria, com muito menos cansaço mental.\n\nTécnicas de memorização ativa, como o método Leitner com flashcards (separando as contas que você erra das que você já sabe) e simulações rápidas de quizzes, provaram cientificamente ser 80% mais eficazes do que apenas ler a tabela repetidamente.",
    importantWords: [
      { word: "Fatores", definition: "Os números que estão sendo multiplicados entre si para gerar o produto final (ex: em 3 x 4 = 12, os fatores são 3 e 4)." },
      { word: "Produto", definition: "O resultado obtido através da operação de multiplicação." },
      { word: "Comutatividade", definition: "Propriedade que permite alterar a ordem dos fatores sem alterar o resultado (a x b = b x a)." },
      { word: "Dobro", definition: "O valor de um número multiplicado por 2. É a base da tabuada do 2, do 4 e do 8." }
    ],
    mindMap: {
      nodes: [
        { id: "1", label: "Tabuada 1 a 10", type: "core" },
        { id: "2", label: "Padrões de Pares (2, 4, 8)", type: "main" },
        { id: "3", label: "Padrões Especiais (5, 9, 10)", type: "main" },
        { id: "4", label: "Dobro do Dobro", type: "sub" },
        { id: "5", label: "Soma de dígitos = 9", type: "sub" },
        { id: "6", label: "Termina em 0 ou 5", type: "sub" },
        { id: "7", label: "Propriedade Comutativa", type: "sub" }
      ],
      edges: [
        { from: "1", to: "2" },
        { from: "1", to: "3" },
        { from: "2", to: "4" },
        { from: "3", to: "5" },
        { from: "3", to: "6" },
        { from: "1", to: "7" }
      ]
    },
    flashcards: [
      {
        id: "fc-tab-2-8",
        front: "Quanto é 2 x 8?",
        back: "16 (Dica: o dobro de 8)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-3-7",
        front: "Quanto é 3 x 7?",
        back: "21 (Três grupos de sete: 7 + 7 + 7)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-4-6",
        front: "Quanto é 4 x 6?",
        back: "24 (Dica: o dobro de 12, que é 2 x 6)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-5-9",
        front: "Quanto é 5 x 9?",
        back: "45 (Dica: metade de 10 x 9, que seria 90)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-6-8",
        front: "Quanto é 6 x 8?",
        back: "48 (Seis vezes oito ou oito vezes seis)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-7-7",
        front: "Quanto é 7 x 7?",
        back: "49 (O quadrado perfeito de sete)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-7-8",
        front: "Quanto é 7 x 8?",
        back: "56 (Dica fácil de lembrar: sequência 5, 6, 7, 8 -> 56 é igual a 7 x 8!)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-8-8",
        front: "Quanto é 8 x 8?",
        back: "64 (Dica: o dobro de 8 x 4, que é 32)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-9-6",
        front: "Quanto é 9 x 6?",
        back: "54 (Dica do 9: dezenas é 6 - 1 = 5. Unidades é o que falta de 5 para 9, que é 4. Total: 54)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-9-8",
        front: "Quanto é 9 x 8?",
        back: "72 (Dica do 9: dezenas 7, unidades 2. Soma = 9)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-10-9",
        front: "Quanto é 10 x 9?",
        back: "90 (Dica: adicione o zero ao 9)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-3-8",
        front: "Quanto é 3 x 8?",
        back: "24",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-6-7",
        front: "Quanto é 6 x 7?",
        back: "42",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-tab-8-9",
        front: "Quanto é 8 x 9?",
        back: "72 (Dica comutativa: o mesmo que 9 x 8)",
        box: 1,
        nextReviewDate: new Date().toISOString()
      }
    ],
    quiz: [
      {
        question: "Se uma caixa de lápis de cor contém 6 unidades, quantos lápis haverá no total em 7 caixas iguais?",
        options: [
          "36 lápis",
          "42 lápis",
          "48 lápis",
          "40 lápis"
        ],
        correctOptionIndex: 1,
        explanation: "Pela tabuada, 6 caixas x 7 unidades por caixa = 42 unidades no total (6 x 7 = 42)."
      },
      {
        question: "Usando a técnica da tabuada do 9, qual é o resultado correto de 9 x 7?",
        options: [
          "56",
          "63",
          "72",
          "81"
        ],
        correctOptionIndex: 1,
        explanation: "Para 9 x 7, o algarismo das dezenas é 7 - 1 = 6. O algarismo das unidades é o que falta para somar 9 (9 - 6 = 3). O resultado é 63."
      },
      {
        question: "Qual propriedade da matemática nos permite saber que 8 x 6 dá exatamente o mesmo resultado que 6 x 8?",
        options: [
          "Propriedade Associativa",
          "Propriedade Comutativa",
          "Propriedade Distributiva",
          "Elemento Neutro"
        ],
        correctOptionIndex: 1,
        explanation: "A propriedade comutativa afirma que a ordem dos fatores não altera o produto (a x b = b x a). Assim, 8 x 6 = 6 x 8 = 48."
      }
    ],
    discursiveQuestions: [
      {
        question: "Como você explicaria a um colega como fazer de cabeça a conta de '4 x 8' utilizando a técnica do 'dobro do dobro'?",
        suggestedAnswer: "Para multiplicar por 4, podemos multiplicar primeiro por 2 (achar o dobro) e depois multiplicar por 2 de novo (dobrar novamente). No caso de 4 x 8: o dobro de 8 é 16, e o dobro de 16 é 32. Logo, 4 x 8 = 32."
      }
    ],
    challenges: [
      {
        question: "Um fazendeiro organizou seu pomar em 8 fileiras de árvores. Se cada fileira contém exatamente 9 laranjeiras, quantas laranjeiras há no pomar?",
        options: [
          "56 laranjeiras",
          "64 laranjeiras",
          "72 laranjeiras",
          "81 laranjeiras"
        ],
        correctOptionIndex: 2,
        explanation: "Multiplicamos o número de fileiras pelo número de árvores por fileira: 8 x 9 = 72 laranjeiras."
      }
    ],
    enemQuestions: [
      {
        question: "Uma distribuidora de livros embala seus produtos em fardos. Cada fardo contém 8 pacotes menores, e cada pacote menor contém 8 livros. Um caminhão transporta 5 fardos dessa distribuidora. O total de livros transportados por esse caminhão é:",
        options: [
          "64 livros",
          "128 livros",
          "320 livros",
          "400 livros"
        ],
        correctOptionIndex: 2,
        explanation: "Primeiro, calculamos os livros por fardo: 8 pacotes x 8 livros = 64 livros. Como são 5 fardos, calculamos: 5 x 64 = 320 livros."
      }
    ],
    diagrams: [
      {
        title: "Mapa de Padrões das Tabuadas",
        diagramAscii: `  [Número de Entrada]
           |
           +---> Multiplicar por 2: Dobro imediato (ex: 7 -> 14)
           |
           +---> Multiplicar por 4: Dobro do dobro (ex: 7 -> 14 -> 28)
           |
           +---> Multiplicar por 8: Dobro do dobro do dobro (ex: 7 -> 14 -> 28 -> 56)
           |
           +---> Multiplicar por 5: Metade da tabuada do 10 (ex: 7 x 10 = 70 -> Metade = 35)`,
        description: "Enxergar a tabuada como conexões de dobras e metades ajuda o cérebro a calcular muito mais rápido do que decorar de forma isolada."
      }
    ],
    curiosities: [
      "Você sabia que pode resolver a tabuada do 9 usando as mãos? Estenda as duas mãos, numere os dedos de 1 a 10 da esquerda para a direita. Para multiplicar 9 por 4, dobre o dedo 4. À esquerda do dedo dobrado sobram 3 dedos (dezenas), e à direita sobram 6 dedos (unidades). O resultado é 36!",
      "A tabuada de dupla entrada (a tabela que cruza linhas e colunas) é conhecida como Tabela de Pitágoras em homenagem ao grande filósofo grego Pitágoras, que a organizou para facilitar os cálculos de seus discípulos há mais de 2.500 anos."
    ],
    practicalExamples: [
      "Compras rápidas: Se um chocolate custa R$ 6 e você deseja comprar 8 unidades, você calcula mentalmente 6 x 8 = R$ 48 para pagar no caixa.",
      "Planejamento diário: Se você estuda 3 horas por dia de segunda a sexta (5 dias), você estuda no total 3 x 5 = 15 horas semanais."
    ],
    tags: ["matematica-basica", "tabuada", "calculo-mental", "multiplicacao"],
    folder: "Matemática Básica",
    isFavorite: true,
    reviewCount: 0
  }
];
