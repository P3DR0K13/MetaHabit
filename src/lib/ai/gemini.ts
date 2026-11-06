import { GoogleGenAI } from '@google/genai'

export interface GeneratedTaskProposal {
  title: string
  description: string
  dayOffset: number // Dias a partir de hoje para o prazo
  estimatedMinutes: number
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
}

export interface AIPlanResult {
  needsClarification: boolean
  clarificationQuestions?: string[]
  summary?: string
  suggestedTasks?: GeneratedTaskProposal[]
  rawError?: string
}

export interface AIAdaptationResult {
  needsClarification: boolean
  adaptationSummary: string
  adjustedTasks: {
    originalTaskId?: string
    title: string
    description: string
    newDueDateOffset: number // Dias a partir de hoje
    estimatedMinutes: number
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    action: 'RESCHEDULE' | 'SPLIT' | 'ADJUST' | 'KEEP'
  }[]
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey || apiKey.trim() === '' || apiKey.includes('seu_gemini_api_key')) {
    return null
  }
  return new GoogleGenAI({ apiKey })
}

export async function generateProjectPlanWithAI(params: {
  title: string
  objective: string
  description?: string
  deadline?: string
  availableTime?: string
  difficulties?: string
  referenceMaterials?: string
}): Promise<AIPlanResult> {
  const { title, objective, description, deadline, availableTime, difficulties, referenceMaterials } = params

  // 1. Verificar se as informações são excessivamente vagas para gerar um plano útil (RF09)
  const totalLength = (title + ' ' + objective + ' ' + (description || '')).trim().length
  if (totalLength < 15 && !referenceMaterials) {
    return {
      needsClarification: true,
      clarificationQuestions: [
        'Qual é o escopo específico ou resultado final tangível que você deseja alcançar?',
        'Quantas horas por semana ou por dia você planeja dedicar a este projeto?',
        'Existe alguma data limite estrita ou marco intermediário?',
      ],
    }
  }

  const ai = getGeminiClient()

  // Se a chave não estiver configurada, usamos o gerador inteligente local como fallback elegante (RF22)
  if (!ai) {
    return generateFallbackPlan(params)
  }

  try {
    const prompt = `
Você é o assistente de planejamento do Meta (MetaHabit). Seu objetivo é decompor o objetivo de um projeto em etapas e missões executáveis para o usuário.

DADOS DO PROJETO:
- Título: ${title}
- Objetivo: ${objective}
- Descrição: ${description || 'Não informada'}
- Prazo final estimado: ${deadline || 'Não informado'}
- Tempo disponível: ${availableTime || 'Não informado'}
- Dificuldades / Obstáculos previstos: ${difficulties || 'Não informados'}
- Material de apoio / Edital / Instruções: ${referenceMaterials || 'Nenhum'}

DIRETRIZES:
1. Se as informações forem tão insuficientes que impossibilitem um plano coerente, responda com needsClarification: true e liste de 2 a 3 perguntas essenciais.
2. Caso contrário, elabore entre 4 e 8 tarefas acionáveis e realistas, organizadas em ordem lógica.
3. Para cada tarefa, informe:
   - title: Título conciso da missão (ex: "Pesquisar bibliografia inicial", "Configurar ambiente")
   - description: Descrição do que fazer e como medir que foi concluída
   - dayOffset: Em quantos dias a partir de hoje esta tarefa deve ser entregue (ex: 1 para amanhã, 3 para daqui a 3 dias)
   - estimatedMinutes: Estimativa de tempo em minutos (ex: 30, 45, 60, 120)
   - priority: Uma de: "LOW", "MEDIUM", "HIGH", "URGENT"
   - difficulty: Uma de: "EASY", "MEDIUM", "HARD"

Retorne EXCLUSIVAMENTE um objeto JSON válido com a estrutura:
{
  "needsClarification": false,
  "summary": "Resumo da estratégia do plano em 1 ou 2 frases",
  "suggestedTasks": [
    {
      "title": "string",
      "description": "string",
      "dayOffset": 1,
      "estimatedMinutes": 45,
      "priority": "MEDIUM",
      "difficulty": "EASY"
    }
  ]
}
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    })

    const text = response.text
    if (!text) throw new Error('Resposta vazia da IA')

    const parsed = JSON.parse(text) as AIPlanResult
    return parsed
  } catch (error) {
    console.error('Erro na chamada da IA Gemini (usando fallback seguro):', error)
    return generateFallbackPlan(params)
  }
}

export async function adaptProjectPlanWithAI(params: {
  projectTitle: string
  reportedDifficulties: string
  pendingTasks: {
    id: string
    title: string
    priority: string
    difficulty: string
    estimatedMinutes?: number
  }[]
}): Promise<AIAdaptationResult> {
  const { projectTitle, reportedDifficulties, pendingTasks } = params
  const ai = getGeminiClient()

  if (!ai) {
    return {
      needsClarification: false,
      adaptationSummary: `Plano redistribuído considerando: "${reportedDifficulties}". Os prazos foram espaçados para diminuir a sobrecarga diária.`,
      adjustedTasks: pendingTasks.map((t, index) => ({
        originalTaskId: t.id,
        title: t.title,
        description: `Adaptada para ritmo flexível. Obstáculo considerado: ${reportedDifficulties}`,
        newDueDateOffset: (index + 1) * 2,
        estimatedMinutes: Math.max(20, Math.round((t.estimatedMinutes || 45) * 0.8)),
        priority: (t.priority as any) || 'MEDIUM',
        difficulty: (t.difficulty as any) || 'MEDIUM',
        action: 'RESCHEDULE',
      })),
    }
  }

  try {
    const prompt = `
O usuário está trabalhando no projeto "${projectTitle}" e relatou o seguinte obstáculo/atraso:
"${reportedDifficulties}"

TAREFAS PENDENTES ATUAIS:
${JSON.stringify(pendingTasks, null, 2)}

Adapte e reorganize essas tarefas para viabilizar o cumprimento sem frustração. Você pode:
- Redistribuir prazos (newDueDateOffset em dias)
- Reduzir tempo estimado dividindo ou flexibilizando tarefas
- Ajustar prioridades

Retorne EXCLUSIVAMENTE um objeto JSON no formato:
{
  "needsClarification": false,
  "adaptationSummary": "Breve justificativa da adaptação proposta",
  "adjustedTasks": [
    {
      "originalTaskId": "id_da_tarefa",
      "title": "string",
      "description": "string",
      "newDueDateOffset": 2,
      "estimatedMinutes": 30,
      "priority": "MEDIUM",
      "difficulty": "EASY",
      "action": "RESCHEDULE"
    }
  ]
}
`

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    })

    const text = response.text
    if (!text) throw new Error('Resposta vazia da IA')
    return JSON.parse(text) as AIAdaptationResult
  } catch (error) {
    console.error('Erro na adaptação via IA (fallback):', error)
    return {
      needsClarification: false,
      adaptationSummary: `Adaptação sugerida para contornar: ${reportedDifficulties}`,
      adjustedTasks: pendingTasks.map((t, idx) => ({
        originalTaskId: t.id,
        title: t.title,
        description: `Reorganizado após relato de dificuldade`,
        newDueDateOffset: (idx + 1) * 2,
        estimatedMinutes: t.estimatedMinutes || 40,
        priority: (t.priority as any) || 'MEDIUM',
        difficulty: (t.difficulty as any) || 'MEDIUM',
        action: 'RESCHEDULE',
      })),
    }
  }
}

function generateFallbackPlan(params: {
  title: string
  objective: string
  availableTime?: string
  difficulties?: string
}): AIPlanResult {
  return {
    needsClarification: false,
    summary: `Plano estratégico estruturado em etapas sequenciais para "${params.title}".`,
    suggestedTasks: [
      {
        title: `Mapeamento e preparação: ${params.title}`,
        description: `Levantar requisitos iniciais, materiais e definir o ambiente de trabalho para ${params.objective}.`,
        dayOffset: 1,
        estimatedMinutes: 30,
        priority: 'HIGH',
        difficulty: 'EASY',
      },
      {
        title: `Execução da primeira etapa prática`,
        description: `Desenvolver a primeira entrega concreta do objetivo, contornando a dificuldade: ${params.difficulties || 'foco sustentado'}.`,
        dayOffset: 3,
        estimatedMinutes: 60,
        priority: 'HIGH',
        difficulty: 'MEDIUM',
      },
      {
        title: `Revisão intermediária e consolidação`,
        description: `Avaliar o progresso realizado, refinar os pontos de melhoria e organizar a etapa final.`,
        dayOffset: 5,
        estimatedMinutes: 45,
        priority: 'MEDIUM',
        difficulty: 'MEDIUM',
      },
      {
        title: `Finalização e entrega do resultado`,
        description: `Concluir todas as pendências e validar o resultado final atingido para ${params.title}.`,
        dayOffset: 7,
        estimatedMinutes: 60,
        priority: 'URGENT',
        difficulty: 'HARD',
      },
    ],
  }
}
