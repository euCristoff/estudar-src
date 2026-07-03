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
    id: "note-primeiros-passos",
    title: "Como Usar o EstudaIA (Guia Prático)",
    subject: "Português",
    date: new Date().toISOString(),
    summary: "O EstudaIA é o seu ecossistema inteligente de estudos. Aqui, você pode importar suas anotações do Notion, visualizar as conexões automáticas em um Grafo de Conhecimento, treinar com Quizzes do ENEM, revisar com Flashcards e interagir com um Professor Virtual por chat.",
    explanationBasic: "Seja muito bem-vindo ao EstudaIA! Esta plataforma foi desenhada para transformar anotações passivas em ferramentas de estudo ativo. Quando você cria ou importa uma nota: 1) O 'Caderno de Estudos' resume o conteúdo em níveis e destaca termos importantes. 2) O 'Mapa Mental' desenha conexões visuais estruturadas. 3) Os 'Flashcards' ajudam você a fixar a matéria de forma interativa. 4) O 'Praticar Quizzes' simula exames reais para treinar seu cérebro. 5) O 'Professor Virtual' bate um papo por chat para testar suas dúvidas!",
    explanationIntermediate: "Para usar a plataforma ao máximo, o fluxo recomendado é: Primeiro, use a aba 'Biblioteca (Notion)' para adicionar ou criar um caderno de estudos sobre qualquer tema. A IA gerará automaticamente explicações estruturadas nos níveis básico, intermediário e avançado, além de diagramas didáticos em formato de texto, baralho de flashcards e simulados com questões inéditas e comentadas. Conforme você responde às questões, o sistema rastreia seus pontos fracos e atualiza seu progresso e streak no Dashboard!",
    explanationAdvanced: "A fundamentação pedagógica do EstudaIA repousa sobre a Prática de Lembrança Ativa (Active Recall) e a Repetição Espaçada (Spaced Repetition). O sistema de Flashcards utiliza uma adaptação do consagrado sistema Leitner, em que os cartões avançam de caixa (Box 1 a 5) ao serem acertados, aumentando o intervalo para a próxima revisão. O módulo de 'Plano de Estudos Inteligente' analisa as estatísticas de erro coletadas em tempo real e calcula de forma dinâmica as prioridades de foco semanais, assegurando que o estudante despenda energia nos seus pontos mais vulneráveis.",
    importantWords: [
      { word: "Notion", definition: "Aplicativo de produtividade e escrita onde você mantém anotações e pode integrá-las ao EstudaIA." },
      { word: "Active Recall", definition: "Metodologia ativa que consiste em testar a si mesmo antes de rever a matéria, forçando o cérebro a recuperar a informação." },
      { word: "Repetição Espaçada", definition: "Técnica de memorização de longo prazo que consiste em revisar conteúdos em intervalos de tempo crescentes." },
      { word: "Professor Virtual", definition: "Assistente interativo de IA treinado para realizar simulações de prova oral e responder dúvidas específicas." }
    ],
    mindMap: {
      nodes: [
        { id: "1", label: "EstudaIA", type: "core" },
        { id: "2", label: "Importação Notion", type: "main" },
        { id: "3", label: "Métodos Ativos", type: "main" },
        { id: "4", label: "Biblioteca", type: "sub" },
        { id: "5", label: "Grafo de Conexões", type: "sub" },
        { id: "6", label: "Repetição Espaçada", type: "sub" },
        { id: "7", label: "Quizzes & Simulados", type: "sub" },
        { id: "8", label: "Professor Virtual", type: "sub" }
      ],
      edges: [
        { from: "1", to: "2" },
        { from: "1", to: "3" },
        { from: "2", to: "4" },
        { from: "2", to: "5" },
        { from: "3", to: "6" },
        { from: "3", to: "7" },
        { from: "3", to: "8" }
      ]
    },
    flashcards: [
      {
        id: "fc-onboarding-1",
        front: "Como o progresso das matérias é atualizado no EstudaIA?",
        back: "Ao acertar questões nos Quizzes das matérias, seu progresso no Dashboard sobe automaticamente!",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-onboarding-2",
        front: "O que acontece ao marcar 'Acertei / Lembrei' em um flashcard?",
        back: "O cartão avança de caixa (Box 1 a 5) e passará a ser revisado com menos frequência, otimizando seu foco.",
        box: 1,
        nextReviewDate: new Date().toISOString()
      },
      {
        id: "fc-onboarding-3",
        front: "Como posso garantir que não vou perder minhas notas criadas?",
        back: "O app salva tudo no seu navegador automaticamente, mas você também pode ir na aba lateral e clicar em 'Exportar' para baixar um arquivo JSON de backup.",
        box: 1,
        nextReviewDate: new Date().toISOString()
      }
    ],
    quiz: [
      {
        question: "Qual é o principal benefício de usar o sistema de Flashcards com Caixas (Leitner) do EstudaIA?",
        options: [
          "Evitar ler qualquer tipo de matéria ou explicação",
          "Otimizar o tempo de estudo, repetindo mais os cartões difíceis e espaçando os fáceis",
          "Ganhar prêmios em dinheiro convertidos de pontos virtuais",
          "Apenas colorir os cartões para decoração visual"
        ],
        correctOptionIndex: 1,
        explanation: "O método das Caixas de Leitner garante que você passe mais tempo revisando o que tem dificuldade de lembrar, enquanto os tópicos conhecidos são espaçados para o futuro, poupando seu tempo!"
      },
      {
        question: "Como você pode carregar ou salvar dados caso precise trocar de computador?",
        options: [
          "O site não permite salvar nenhum dado de nenhuma forma",
          "Imprimir todas as telas em papel e digitá-las de novo manualmente",
          "Usar as opções de 'Exportar' e 'Importar' na barra lateral para salvar e restaurar arquivos JSON",
          "O site exige a digitação de dados em cartões físicos reais"
        ],
        correctOptionIndex: 2,
        explanation: "O EstudaIA possui um prático painel de backup que permite que você baixe seu arquivo JSON de backup (Exportar) e carregue-o novamente em qualquer navegador ou celular (Importar)!"
      }
    ],
    discursiveQuestions: [
      {
        question: "Explique como o 'Plano de Estudos Inteligente' do EstudaIA ajuda você a regular sua rotina.",
        suggestedAnswer: "O Plano de Estudos monitora ativamente as respostas incorretas nos Quizzes. Ele exibe as matérias mais vulneráveis como 'Prioridades de Foco' e recomenda ações diretas com os cadernos salvos, garantindo que você gaste tempo nos seus pontos fracos e não apenas estudando o que já domina."
      }
    ],
    challenges: [
      {
        question: "Qual técnica pedagógica fundamenta o uso simultâneo de mapas conceituais e testes de recordação ativa (Active Recall) na fixação de longa duração?",
        options: [
          "Apenas memorização mecânica por cópia de textos repetidos",
          "A visão espacial estruturada criada pelo mapa mental aliada ao fortalecimento neural gerado pelas respostas ativas",
          "O relaxamento do cérebro gerado por diagramas de cores neutras",
          "Ouvir áudio binaural em baixa velocidade"
        ],
        correctOptionIndex: 1,
        explanation: "A combinação de mapas de conexões (que estruturam o conteúdo na mente) com o recall ativo (quizzes e flashcards) estimula os hemisférios lógicos e visuais, consolidando as sinapses de forma duradoura."
      }
    ],
    enemQuestions: [
      {
        question: "As metodologias ativas digitais trouxeram inovações relevantes para a rotina escolar, transformando o aprendizado passivo em uma jornada personalizada. Ferramentas que geram revisões adaptativas baseadas em erros, de acordo com as premissas modernas de educação, buscam principalmente promover:",
        options: [
          "A eliminação de provas e avaliações nos colégios públicos",
          "O protagonismo e a autonomia do estudante através do diagnóstico contínuo de suas próprias facilidades e gargalos",
          "O entretenimento passivo com o objetivo de reter a atenção e estender o uso de telas",
          "A substituição total de professores humanos por sistemas computadorizados rígidos"
        ],
        correctOptionIndex: 1,
        explanation: "A autoavaliação contínua pautada em dados permite que o estudante regule seu próprio aprendizado (metacognição), focando com autonomia no que precisa para atingir a proficiência."
      }
    ],
    diagrams: [
      {
        title: "Ciclo de Estudo Ativo",
        diagramAscii: `  [Passo 1: Criar Caderno]
                 |
                 v
     [Passo 2: Praticar Ativo] <------+
          /            \\              |
         v              v             | (Refocar nos
    [Flashcards]   [Quizzes/ENEM]     |  erros mapeados)
         \\              /             |
          v            v              |
       [Plano de Estudos Inteligente]-+`,
        description: "Este diagrama mostra como o EstudaIA fecha o círculo do seu aprendizado. Ao registrar seus erros em quizzes, o Plano de Estudos guia você de volta aos pontos fracos para consolidação."
      }
    ],
    curiosities: [
      "Você sabia que o cérebro esquece cerca de 50% de tudo o que lê em apenas 24 horas se não houver um teste de recordação ativa? Esse fenômeno biológico chama-se 'Curva do Esquecimento'.",
      "Explicar uma matéria para si mesmo ou para outra pessoa (Técnica de Feynman) aumenta a retenção de aprendizado para até 90%!"
    ],
    practicalExamples: [
      "Prática Rápida de 5 Minutos: Ao acordar ou iniciar o dia, faça 5 a 10 flashcards rápidos de revisões pendentes para fortalecer as memórias.",
      "Tire Dúvidas Ativas: Se você não entender um conceito em um caderno, abra o 'Professor Virtual' e peça para ele explicar usando uma metáfora do cotidiano."
    ],
    tags: ["boas-vindas", "onboarding", "como-estudar", "tutorial"],
    folder: "Guia de Boas-Vindas",
    isFavorite: true,
    reviewCount: 0
  }
];
