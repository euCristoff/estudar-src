import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit for handling base64 uploads (images, PDFs)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Gemini API
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for automatic retries with exponential backoff on transient errors (like 503 Service Unavailable)
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 3, delayMs = 1500) {
  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorMsg = String(err.message || err.status || err || "").toLowerCase();
      const isTemporary = errorMsg.includes("503") || 
                          errorMsg.includes("unavailable") || 
                          errorMsg.includes("high demand") || 
                          errorMsg.includes("overloaded") || 
                          errorMsg.includes("spikes in demand") ||
                          errorMsg.includes("resource_exhausted") ||
                          errorMsg.includes("exhausted");
      if (isTemporary && i < retries - 1) {
        console.warn(`[Gemini API] Falha temporária (tentativa ${i + 1}/${retries}). Tentando novamente em ${delayMs}ms... Erro: ${errorMsg}`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs *= 2; // exponential backoff
      } else {
        throw err;
      }
    }
  }
  throw lastError;
}

// User-friendly translator for API errors that reassures the user about data preservation
function translateGeminiError(error: any): string {
  const errorMsg = String(error.message || error.status || error || "");
  console.error("Original error from Gemini:", error);
  
  if (
    errorMsg.includes("503") ||
    errorMsg.includes("UNAVAILABLE") ||
    errorMsg.includes("high demand") ||
    errorMsg.includes("spikes in demand") ||
    errorMsg.includes("overloaded")
  ) {
    return "Os servidores do Google Gemini estão sob alta demanda temporária (Erro 503). Nós já tentamos reconectar automaticamente, mas ainda está instável. Por favor, aguarde cerca de 10 a 15 segundos e clique para tentar novamente! Fique super tranquilo: todos os seus cadernos de estudos e progresso de flashcards já estão salvos e 100% seguros no seu navegador!";
  }
  
  if (errorMsg.includes("ResourceExhausted") || errorMsg.includes("quota") || errorMsg.includes("429")) {
    return "O limite temporário de requisições da IA foi alcançado. Por favor, aguarde cerca de 30 segundos antes de tentar novamente. Seus dados estão salvos e protegidos no seu navegador!";
  }

  if (errorMsg.includes("API key not found") || errorMsg.includes("API key")) {
    return "A chave da API do Gemini (GEMINI_API_KEY) não foi configurada corretamente no servidor. Verifique as configurações.";
  }

  return `Ocorreu uma falha temporária na IA: ${errorMsg}. Por favor, tente novamente. Fique tranquilo, todo o seu progresso anterior continua salvo e seguro no seu dispositivo!`;
}

// Helper to sanitize and parse JSON response from Gemini
function cleanAndParseJSON(text: string) {
  let cleaned = text.trim();
  // Remove markdown codeblock wrapper if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.substring(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.substring(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.substring(0, cleaned.length - 3);
  }
  cleaned = cleaned.trim();

  // Find first { or [ and last } or ]
  const firstBrace = Math.min(
    cleaned.indexOf("{") === -1 ? Infinity : cleaned.indexOf("{"),
    cleaned.indexOf("[") === -1 ? Infinity : cleaned.indexOf("[")
  );
  const lastBrace = Math.max(
    cleaned.lastIndexOf("}"),
    cleaned.lastIndexOf("]")
  );

  if (firstBrace !== Infinity && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return JSON.parse(cleaned);
}

// API endpoint to healthcheck
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// API endpoint to generate study notes
app.post("/api/generate-study", async (req, res) => {
  try {
    const { image, mimeType, images, subject, topic } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.",
      });
    }

    let contents: any[] = [];
    let promptText = "";    if (images && Array.isArray(images) && images.length > 0) {
      promptText = `Analise as imagens ou documentos PDF enviados (no total de ${images.length} arquivos). Identifique o texto e o assunto principal de todos eles de forma integrada.
Selecione a matéria correspondente, preferencialmente: ${subject || "Identificar automaticamente"}.
Crie um resumo e uma explicação detalhada estruturada em três níveis (Básico, Intermediário e Avançado) unindo o conteúdo de todos esses arquivos de maneira fluida.
Destaque as palavras importantes com suas definições.
Gere um mapa mental com nós conectados (nodes e edges).
Crie pelo menos 5 flashcards dinâmicos de pergunta/resposta. IMPORTANTE: Se você identificar quaisquer questões, exercícios ou enunciados de provas nas imagens ou documentos fornecidos, você DEVE obrigatoriamente incluí-los como flashcards (Frente: Pergunta/Exercício identificado, Verso: Resposta correta com explicação). Além disso, converta também as questões de quiz, desafios e questões ENEM geradas para este caderno em flashcards individuais adicionais!
Crie um quiz com 4 perguntas objetivas (4 alternativas cada) e uma explicação de cada resposta.
Crie 3 perguntas discursivas com respostas sugeridas.
Crie 3 desafios no estilo de provas difíceis.
Crie 3 questões no estilo do ENEM/Vestibular (questões longas, com texto de apoio, enunciados contextualizados e alternativas).
Crie diagramas visuais estruturados em formato de texto/ASCII que facilitem a compreensão (por exemplo, fluxos, tabelas conceituais ou árvores).
Gere pelo menos 3 curiosidades e 3 exemplos práticos do cotidiano relacionados ao assunto.
Gere 4 ou 5 tags úteis.
Preencha tudo rigorosamente no formato JSON especificado.`;

      for (const img of images) {
        if (img.base64 && img.mimeType) {
          contents.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64,
            },
          });
        }
      }
    } else if (image && mimeType) {
      promptText = `Analise a imagem ou documento PDF enviado. Identifique o texto e o assunto principal.
Selecione a matéria correspondente, preferencialmente: ${subject || "Identificar automaticamente"}.
Crie um resumo e uma explicação detalhada estruturada em três níveis (Básico, Intermediário e Avançado).
Destaque as palavras importantes com suas definições.
Gere um mapa mental com nós conectados (nodes e edges).
Crie pelo menos 5 flashcards dinâmicos de pergunta/resposta. IMPORTANTE: Se você identificar quaisquer questões, exercícios ou enunciados de provas na imagem ou documento fornecido, você DEVE obrigatoriamente incluí-los como flashcards (Frente: Pergunta/Exercício identificado, Verso: Resposta correta com explicação). Além disso, converta também as questões de quiz, desafios e questões ENEM geradas para este caderno em flashcards individuais adicionais!
Crie um quiz com 4 perguntas objetivas (4 alternativas cada) e uma explicação de cada resposta.
Crie 3 perguntas discursivas com respostas sugeridas.
Crie 3 desafios no estilo de provas difíceis.
Crie 3 questões no estilo do ENEM/Vestibular (questões longas, com texto de apoio, enunciados contextualizados e alternativas).
Crie diagramas visuais estruturados em formato de texto/ASCII que facilitem a compreensão (por exemplo, fluxos, tabelas conceituais ou árvores).
Gere pelo menos 3 curiosidades e 3 exemplos práticos do cotidiano relacionados ao assunto.
Gere 4 ou 5 tags úteis.
Preencha tudo rigorosamente no formato JSON especificado.`;

      contents.push({
        inlineData: {
          mimeType: mimeType,
          data: image,
        },
      });
    } else if (topic) {
      promptText = `Crie um conteúdo de estudos completo sobre o tópico solicitado: "${topic}".
Matéria recomendada: ${subject || "Identificar automaticamente"}.
Crie um resumo e uma explicação detalhada estruturada em três níveis (Básico, Intermediário e Avançado).
Destaque as palavras importantes com suas definições.
Gere um mapa mental com nós conectados (nodes e edges).
Crie pelo menos 5 flashcards dinâmicos de pergunta/resposta. IMPORTANTE: Se você identificar quaisquer questões, exercícios ou enunciados de provas no tópico/texto fornecido, você DEVE obrigatoriamente incluí-los como flashcards (Frente: Pergunta/Exercício identificado, Verso: Resposta correta com explicação). Além disso, converta também as questões de quiz, desafios e questões ENEM geradas para este caderno em flashcards individuais adicionais!
Crie um quiz com 4 perguntas objetivas (4 alternativas cada) e uma explicação de cada resposta.
Crie 3 perguntas discursivas com respostas sugeridas.
Crie 3 desafios no estilo de provas difíceis.
Crie 3 questões no estilo do ENEM/Vestibular (questões longas, com texto de apoio, enunciados de situações-problema reais e alternativas).
Crie diagramas visuais estruturados em formato de texto/ASCII que facilitem a compreensão (por exemplo, fluxos, tabelas conceituais ou árvores).
Gere pelo menos 3 curiosidades e 3 exemplos práticos do cotidiano relacionados ao assunto.
Gere 4 ou 5 tags úteis.
Preencha tudo rigorosamente no formato JSON especificado.`;
    } else {
      return res.status(400).json({ error: "Você deve enviar uma imagem/documento ou especificar um tópico por texto." });
    }

    contents.push({ text: promptText });

    const systemInstruction = `Você é um professor virtual e assistente de estudos altamente didático e moderno, que escreve em português do Brasil de forma clara, amigável e entusiasmada (inspirado no estilo de ensino do Duolingo, Notion e Obsidian).
Seu objetivo é analisar materiais escolares (livros, cadernos, slides) ou tópicos de estudo e transformá-los em notas estruturadas.

Você deve responder EXCLUSIVAMENTE com um objeto JSON válido, sem tags markdown externas além do JSON bruto (ou dentro de um bloco \`\`\`json se necessário, mas prefira JSON direto). O JSON deve seguir RIGOROSAMENTE esta estrutura:

{
  "title": "Título claro e atrativo do conteúdo de estudo",
  "subject": "Matéria escolar exata em português (ex: Matemática, História, Biologia, Geografia, Português, Física, Química, Inglês, etc.)",
  "summary": "Resumo conciso em linguagem simples e parágrafos curtos, explicando o que é o assunto",
  "explanationBasic": "Explicação para iniciantes. Use metáforas simples e conceitos fundamentais.",
  "explanationIntermediate": "Explicação intermediária. Aprofunde-se nos mecanismos, fórmulas, regras, causas e efeitos.",
  "explanationAdvanced": "Explicação avançada. Apresente detalhes teóricos profundos, exceções, discussões científicas ou históricas complexas.",
  "importantWords": [
    { "word": "Palavra ou Conceito importante", "definition": "Explicação didática curta da palavra" }
  ],
  "mindMap": {
    "nodes": [
      { "id": "1", "label": "Tópico Principal (mesmo do título)", "type": "core", "description": "Uma explicação concisa, direta e altamente esclarecedora sobre o significado e relevância deste conceito central." },
      { "id": "2", "label": "Subtópico Principal A", "type": "main", "description": "Resumo focado na definição, função ou impacto deste braço conceitual principal do estudo." },
      { "id": "3", "label": "Detalhe de A", "type": "sub", "description": "Fato complementar, fórmula, exemplo ou causa/consequência conectando este detalhe ao seu subtópico pai." }
    ],
    "edges": [
      { "from": "1", "to": "2" },
      { "from": "2", "to": "3" }
    ]
  },
  "flashcards": [
    { "front": "Pergunta direta e instigante", "back": "Resposta curta e clara para memorização" }
  ],
  "quiz": [
    {
      "question": "Pergunta objetiva e conceitual",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 0,
      "explanation": "Explicação amigável de por que a Opção A está correta e as outras estão erradas."
    }
  ],
  "discursiveQuestions": [
    { "question": "Pergunta aberta que exige raciocínio discursivo", "suggestedAnswer": "Resposta modelo esperada para o aluno comparar." }
  ],
  "challenges": [
    {
      "question": "Desafio de prova ou questão complexa e analítica",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 1,
      "explanation": "Explicação detalhada da lógica matemática ou conceitual por trás do desafio."
    }
  ],
  "enemQuestions": [
    {
      "question": "Questão longa clássica do ENEM com texto contextualizado, enunciado claro, terminando com a pergunta.",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctOptionIndex": 2,
      "explanation": "Resolução comentada da questão no estilo do ENEM, analisando o contexto e as competências testadas."
    }
  ],
  "diagrams": [
    {
      "title": "Nome do Diagrama (ex: Ciclo do Carbono)",
      "diagramAscii": "Representação visual didática usando texto ASCII ou linhas (ex: [Sol] --> [Planta] --(Fotossíntese)--> [Glicose])",
      "description": "Explicação em texto do fluxo do diagrama."
    }
  ],
  "curiosities": [
    "Fato surpreendente e interessante sobre o tema"
  ],
  "practicalExamples": [
    "Exemplo prático do dia a dia onde este assunto se aplica"
  ],
  "tags": ["tag1", "tag2", "tag3"]
}

Por favor, gere todo o conteúdo em Português do Brasil de forma rica, completa, com rigor acadêmico e com bastante profundidade, especialmente nas explicações e questões, para que o estudante de fato consiga aprender o assunto de ponta a ponta.`;

    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
      })
    );

    const parsedData = cleanAndParseJSON(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Erro na rota de geração de estudos:", error);
    res.status(500).json({ error: translateGeminiError(error) });
  }
});

// API endpoint for study chat (conversar com a IA, "Explain Better", and "Professor Mode")
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, context, mode, currentQuestion } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.",
      });
    }

    let systemInstruction = `Você é o Professor Virtual do EstudaIA. Seu estilo de conversa é encorajador, atencioso, claro e direto, similar a um professor do Ensino Médio ou cursinho pré-vestibular que se importa de verdade com o aluno.
Sua conversa deve se limitar ESTRITAMENTE ao contexto do seguinte material de estudo fornecido abaixo.

--- INÍCIO DO CONTEÚDO DO MATERIAL ---
Título: ${context.title}
Matéria: ${context.subject}
Resumo: ${context.summary}
Explicação Básica: ${context.explanationBasic}
Explicação Intermediária: ${context.explanationIntermediate}
Explicação Avançada: ${context.explanationAdvanced}
Palavras Importantes: ${JSON.stringify(context.importantWords)}
--- FIM DO CONTEÚDO DO MATERIAL ---

Instruções baseadas no modo de chat selecionado:`;

    if (mode === "professor") {
      systemInstruction += `
MODO PROFESSOR ATIVO (PROVA ORAL):
- Sua missão é testar os conhecimentos do aluno sobre o material fornecido.
- Faça perguntas desafiadoras, uma de cada vez.
- Quando o aluno responder, avalie a resposta dele de forma construtiva: diga se está correta, explique o que faltou ou parabenize, e então faça a PRÓXIMA pergunta.
- Se o aluno errar, explique pacientemente com um exemplo didático e mude para uma pergunta ligeiramente mais fácil para ajudá-lo a recuperar a confiança.
- Comece de forma acolhedora. Se o histórico de mensagens estiver vazio, introduza-se como o avaliador e lance a primeira pergunta!`;
    } else if (mode === "explain-better") {
      systemInstruction += `
MODO APROFUNDAR CONCEITO:
- O aluno pediu para você aprofundar um conceito do material de estudo.
- Explique de forma ainda mais detalhada, traga analogias extras, use exemplos da vida real e mostre conexões com o dia a dia.
- Termine perguntando se a explicação ajudou e se ele quer testar o conhecimento com um pequeno desafio rápido sobre esse ponto.`;
    } else {
      systemInstruction += `
MODO CHAT LIVRE:
- Responda às dúvidas do estudante sobre este conteúdo de estudo com clareza.
- Se ele fizer perguntas fora do assunto do material, guie-o gentilmente de volta para o conteúdo.
- Incentive o pensamento crítico em vez de apenas dar respostas diretas.`;
    }

    // Adapt format to @google/genai chats API
    const formattedHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

    // Start a chat using ai.chats.create
    const chat = ai.chats.create({
      model: "gemini-3.5-flash",
      config: {
        systemInstruction: systemInstruction,
      },
      history: formattedHistory.slice(0, formattedHistory.length - 1),
    });

    // Send the last message
    const lastMsg = messages[messages.length - 1];
    const response = await callGeminiWithRetry(() => 
      chat.sendMessage({
        message: lastMsg.text,
      })
    );

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Erro na rota de chat:", error);
    res.status(500).json({ error: translateGeminiError(error) });
  }
});

// API endpoint to generate additional study materials on-the-fly using Gemini
app.post("/api/generate-more-materials", async (req, res) => {
  try {
    const { note, type, count = 3 } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.",
      });
    }

    if (!note) {
      return res.status(400).json({ error: "O material de estudo (note) é obrigatório." });
    }

    let prompt = "";
    if (type === "flashcards") {
      prompt = `Baseado no seguinte material de estudo sobre o tema "${note.title}" (${note.subject}):
Resumo: ${note.summary}
Explicação Básica: ${note.explanationBasic}
Explicação Intermediária: ${note.explanationIntermediate}
Explicação Avançada: ${note.explanationAdvanced}

Gere exatamente ${count} novos flashcards de pergunta/resposta (frente e verso) que sejam didáticos e complementares, e DIFERENTES dos que já existem.
Os flashcards existentes são:
${JSON.stringify((note.flashcards || []).map((f: any) => ({ front: f.front, back: f.back })))}

Retorne APENAS um array JSON contendo objetos no seguinte formato exato, sem comentários nem marcação extra:
[
  {
    "front": "Pergunta clara de revisão sobre o tema",
    "back": "Resposta sucinta, direta e didática"
  }
]`;
    } else if (type === "quiz") {
      prompt = `Baseado no seguinte material de estudo sobre o tema "${note.title}" (${note.subject}):
Resumo: ${note.summary}
Explicação Básica: ${note.explanationBasic}
Explicação Intermediária: ${note.explanationIntermediate}
Explicação Avançada: ${note.explanationAdvanced}

Gere exatamente ${count} novas perguntas objetivas de múltipla escolha com 4 opções cada e apenas 1 correta, DIFERENTES das existentes.
As perguntas existentes de quiz são:
${JSON.stringify((note.quiz || []).map((q: any) => q.question))}

Retorne APENAS um array JSON contendo objetos no seguinte formato exato, sem comentários nem marcação extra:
[
  {
    "question": "Texto da nova pergunta objetiva",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Explicação detalhada e amigável do porquê esta opção está correta"
  }
]`;
    } else if (type === "enem") {
      prompt = `Baseado no seguinte material de estudo sobre o tema "${note.title}" (${note.subject}):
Resumo: ${note.summary}
Explicação Básica: ${note.explanationBasic}
Explicação Intermediária: ${note.explanationIntermediate}
Explicação Avançada: ${note.explanationAdvanced}

Gere exatamente ${count} novas questões completas no estilo ENEM/Vestibular. Devem possuir enunciado longo de contextualização ou situação-problema e 5 opções de resposta (de A a E) com apenas 1 correta, DIFERENTES das existentes.
As perguntas existentes no estilo ENEM são:
${JSON.stringify((note.enemQuestions || []).map((q: any) => q.question))}

Retorne APENAS um array JSON contendo objetos no seguinte formato exato, sem comentários nem marcação extra:
[
  {
    "question": "Texto longo da pergunta contextualizada estilo ENEM",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D", "Opção E"],
    "correctOptionIndex": 0,
    "explanation": "Gabarito comentado detalhando o porquê de ser esta opção e analisando as outras alternativas"
  }
]`;
    } else if (type === "challenges") {
      prompt = `Baseado no seguinte material de estudo sobre o tema "${note.title}" (${note.subject}):
Resumo: ${note.summary}
Explicação Básica: ${note.explanationBasic}
Explicação Intermediária: ${note.explanationIntermediate}
Explicação Avançada: ${note.explanationAdvanced}

Gere exatamente ${count} novas questões de desafio extremo ou nível acadêmico de alta dificuldade, com 4 opções de resposta (apenas 1 correta), DIFERENTES das existentes.
Os desafios existentes são:
${JSON.stringify((note.challenges || []).map((q: any) => q.question))}

Retorne APENAS um array JSON contendo objetos no seguinte formato exato, sem comentários nem marcação extra:
[
  {
    "question": "Enunciado da pergunta desafiadora de alto nível",
    "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
    "correctOptionIndex": 0,
    "explanation": "Justificativa lógica, profunda ou científica detalhada para a alternativa correta"
  }
]`;
    } else if (type === "discursive") {
      prompt = `Baseado no seguinte material de estudo sobre o tema "${note.title}" (${note.subject}):
Resumo: ${note.summary}
Explicação Básica: ${note.explanationBasic}
Explicação Intermediária: ${note.explanationIntermediate}
Explicação Avançada: ${note.explanationAdvanced}

Gere exatamente ${count} novas questões discursivas (perguntas abertas), DIFERENTES das existentes.
As questões discursivas existentes são:
${JSON.stringify((note.discursiveQuestions || []).map((q: any) => q.question))}

Retorne APENAS um array JSON contendo objetos no seguinte formato exato, sem comentários nem marcação extra:
[
  {
    "question": "Enunciado da questão aberta discursiva",
    "suggestedAnswer": "Texto explicativo detalhado com a resposta ideal recomendada pelo professor"
  }
]`;
    } else {
      return res.status(400).json({ error: "Tipo de material inválido para geração." });
    }

    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      })
    );

    const items = cleanAndParseJSON(response.text);
    res.json({ items });
  } catch (error: any) {
    console.error("Erro na rota de gerar mais materiais:", error);
    res.status(500).json({ error: translateGeminiError(error) });
  }
});

// API endpoint to update/append study notes with new teacher content
app.post("/api/append-study", async (req, res) => {
  try {
    const { note, images, topic } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "GEMINI_API_KEY não configurada nas variáveis de ambiente do servidor.",
      });
    }

    if (!note) {
      return res.status(400).json({ error: "O caderno de estudos atual é obrigatório para atualização." });
    }

    let contents: any[] = [];
    let promptText = `Você é o Professor Virtual do EstudaIA. O usuário está adicionando novas informações de aula (conteúdos que vão cair na prova) ao caderno de estudos atual chamado "${note.title}" (Matéria: ${note.subject}).
Sua missão é integrar essas novas informações ao caderno existente de maneira fluida, mantendo e expandindo o que já existe (nunca apague o conhecimento anterior, apenas complemente-o!).

Aqui está o caderno de estudos atual para referência:
--- INÍCIO DO CADERNO ATUAL ---
Título: ${note.title}
Matéria: ${note.subject}
Resumo Atual: ${note.summary}
Explicação Básica Atual: ${note.explanationBasic}
Explicação Intermediária Atual: ${note.explanationIntermediate}
Explicação Avançada Atual: ${note.explanationAdvanced}
Palavras Importantes: ${JSON.stringify(note.importantWords)}
Mapa Mental (Nodes): ${JSON.stringify(note.mindMap?.nodes || [])}
Mapa Mental (Edges): ${JSON.stringify(note.mindMap?.edges || [])}
Flashcards Existentes: ${JSON.stringify((note.flashcards || []).map((f: any) => ({ front: f.front, back: f.back })))}
Quizzes Existentes: ${JSON.stringify((note.quiz || []).map((q: any) => q.question))}
Perguntas Discursivas: ${JSON.stringify((note.discursiveQuestions || []).map((q: any) => q.question))}
--- FIM DO CADERNO ATUAL ---

Novo Conteúdo fornecido pelo usuário para adicionar (assuntos novos da prova):
${topic ? `Texto/Tópico digitado: "${topic}"` : ""}
${images && images.length > 0 ? `(Também foram enviadas ${images.length} imagem/imagens com novas anotações, slides ou fotos do caderno escolar)` : ""}

Instruções de Integração:
1. EXPANDA o resumo ("summary") e as explicações por nível ("explanationBasic", "explanationIntermediate", "explanationAdvanced") incorporando o novo conteúdo de forma coesa e didática.
2. Adicione novas "importantWords" (palavras importantes) identificadas no novo conteúdo. Mantenha também as anteriores.
3. Atualize o "mindMap" adicionando novos nodes e edges relacionados aos novos tópicos, interligando-os de forma inteligente aos nodes existentes. Use IDs sequenciais únicos que não colidam com os IDs existentes.
4. Crie de 3 a 5 NOVOS flashcards específicos para esse novo assunto. IMPORTANTE: Se você identificar quaisquer questões, exercícios ou enunciados de provas nas anotações, slides ou imagens fornecidas pelo usuário, você DEVE obrigatoriamente incluí-los como flashcards (Frente: Pergunta/Exercício identificado, Verso: Resposta correta com explicação). Além disso, converta também as novas questões de quiz, desafios e questões ENEM criadas para este caderno em flashcards individuais adicionais!
5. Crie de 2 a 3 NOVOS quizzes objetivos, perguntas discursivas, desafios ou questões do ENEM baseadas no novo assunto.
6. Adicione novos diagramas em formato ASCII se o novo assunto puder ser ilustrado visualmente.
7. Mantenha ou adicione curiosidades e exemplos práticos.
8. Retorne o caderno de estudos completamente atualizado, seguindo a estrutura JSON.`;

    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.base64 && img.mimeType) {
          contents.push({
            inlineData: {
              mimeType: img.mimeType,
              data: img.base64,
            },
          });
        }
      }
    }

    contents.push({ text: promptText });

    const systemInstruction = `Você é um professor virtual e assistente de estudos altamente didático e moderno, que escreve em português do Brasil de forma clara, amigável e entusiasmada (inspirado no estilo de ensino do Duolingo, Notion e Obsidian).
Sua missão é fundir e atualizar cadernos de estudos com novos tópicos fornecidos pelo usuário para provas futuras.

Você deve responder EXCLUSIVAMENTE com um objeto JSON válido correspondente ao caderno de estudos atualizado, sem tags markdown externas além do JSON bruto (ou dentro de um bloco \`\`\`json se necessário, mas prefira JSON direto). O JSON deve seguir RIGOROSAMENTE esta estrutura:

{
  "title": "Título atualizado (ou o mesmo título se adequado)",
  "subject": "Matéria escolar do caderno",
  "summary": "Resumo expandido e integrado",
  "explanationBasic": "Explicação básica expandida e integrada",
  "explanationIntermediate": "Explicação intermediária expandida e integrada",
  "explanationAdvanced": "Explicação avançada expandida e integrada",
  "importantWords": [
    { "word": "Palavra ou Conceito importante", "definition": "Explicação curta" }
  ],
  "mindMap": {
    "nodes": [
      { "id": "1", "label": "Tópico Principal", "type": "core", "description": "Descrição" }
    ],
    "edges": [
      { "from": "1", "to": "2" }
    ]
  },
  "flashcards": [
    { "front": "Pergunta", "back": "Resposta" }
  ],
  "quiz": [
    {
      "question": "Pergunta objetiva",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 0,
      "explanation": "Explicação"
    }
  ],
  "discursiveQuestions": [
    { "question": "Pergunta aberta", "suggestedAnswer": "Resposta modelo" }
  ],
  "challenges": [
    {
      "question": "Desafio de prova complexo",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctOptionIndex": 1,
      "explanation": "Explicação"
    }
  ],
  "enemQuestions": [
    {
      "question": "Questão estilo ENEM",
      "options": ["Alternativa A", "Alternativa B", "Alternativa C", "Alternativa D"],
      "correctOptionIndex": 2,
      "explanation": "Resolução comentada"
    }
  ],
  "diagrams": [
    {
      "title": "Nome do Diagrama",
      "diagramAscii": "Representação ASCII",
      "description": "Explicação"
    }
  ],
  "curiosities": ["Fato surpreendente"],
  "practicalExamples": ["Exemplo prático"],
  "tags": ["tag1"]
}

Certifique-se de que o retorno JSON contenha as informações originais do caderno E as novas de forma 100% integrada e enriquecida.`;

    const response = await callGeminiWithRetry(() => 
      ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        },
      })
    );

    const parsedData = cleanAndParseJSON(response.text || "{}");
    res.json(parsedData);
  } catch (error: any) {
    console.error("Erro na rota de adicionar conteúdo:", error);
    res.status(500).json({ error: translateGeminiError(error) });
  }
});

// Configure Vite or Static Files serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] Rodando perfeitamente na porta ${PORT}`);
  });
}

startServer();
