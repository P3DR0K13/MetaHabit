'use client'

import { useState } from 'react'
import { requestAIPlanAction, confirmAIPlanAction } from '@/app/actions/ai-planner'
import { GeneratedTaskProposal } from '@/lib/ai/gemini'
import {
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Clock,
  X,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  FileText,
} from 'lucide-react'

interface AIPlanReviewModalProps {
  projectId: string
  projectTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AIPlanReviewModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onSuccess,
}: AIPlanReviewModalProps) {
  const [step, setStep] = useState<'INPUT' | 'QUESTIONS' | 'REVIEW'>('INPUT')
  const [referenceMaterials, setReferenceMaterials] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Clarification questions state (RF09)
  const [clarificationQuestions, setClarificationQuestions] = useState<string[]>([])
  const [clarificationAnswers, setClarificationAnswers] = useState('')

  // Generated tasks state (RF10)
  const [summary, setSummary] = useState('')
  const [tasks, setTasks] = useState<GeneratedTaskProposal[]>([])

  if (!isOpen) return null

  const handleGeneratePlan = async () => {
    setLoading(true)
    setError(null)

    const fullContext = [
      referenceMaterials.trim() ? `Material de referência / Edital:\n${referenceMaterials.trim()}` : '',
      clarificationAnswers.trim() ? `Respostas aos esclarecimentos:\n${clarificationAnswers.trim()}` : '',
    ].filter(Boolean).join('\n\n')

    try {
      const res = await requestAIPlanAction({
        projectId,
        referenceMaterials: fullContext || undefined,
      })

      if (res.error) {
        setError(res.error)
      } else if (res.planResult) {
        if (res.planResult.needsClarification && res.planResult.clarificationQuestions?.length) {
          setClarificationQuestions(res.planResult.clarificationQuestions)
          setStep('QUESTIONS')
        } else if (res.planResult.suggestedTasks) {
          setSummary(res.planResult.summary || '')
          setTasks(res.planResult.suggestedTasks)
          setStep('REVIEW')
        }
      }
    } catch {
      setError('Falha ao se comunicar com o serviço de planejamento.')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateTask = (index: number, field: keyof GeneratedTaskProposal, value: any) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t))
    )
  }

  const handleRemoveTask = (index: number) => {
    setTasks((prev) => prev.filter((_, i) => i !== index))
  }

  const handleAddTask = () => {
    setTasks((prev) => [
      ...prev,
      {
        title: 'Nova Tarefa',
        description: '',
        dayOffset: 1,
        estimatedMinutes: 30,
        priority: 'MEDIUM',
        difficulty: 'MEDIUM',
      },
    ])
  }

  const handleConfirmAndSave = async () => {
    if (tasks.length === 0) {
      setError('Selecione ou mantenha ao menos uma tarefa no plano.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Persistir apenas o que o usuário aprovou formalmente (RF10, CA10)
      const res = await confirmAIPlanAction({
        projectId,
        approvedTasks: tasks,
      })

      if (res.error) {
        setError(res.error)
      } else {
        onSuccess()
        onClose()
      }
    } catch {
      setError('Erro ao salvar as tarefas no projeto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Planejamento Inteligente com IA
              </h2>
              <p className="text-xs text-slate-400">
                Projeto: <strong className="text-slate-200">{projectTitle}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* STEP 1: Context and Reference Materials (RF07) */}
          {step === 'INPUT' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                A IA analisará o objetivo, prazo e disponibilidade do seu projeto. Se desejar, adicione abaixo o conteúdo do edital, ementa, instruções ou referências para personalizar o plano:
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  Material de Apoio / Edital / Instruções (Opcional)
                </label>
                <textarea
                  rows={5}
                  value={referenceMaterials}
                  onChange={(e) => setReferenceMaterials(e.target.value)}
                  placeholder="Cole aqui o texto do edital, tópicos de estudo, instruções de entrega ou qualquer detalhe relevante..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* STEP 2: Clarification Questions (RF09, CA09) */}
          {step === 'QUESTIONS' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-indigo-400" />
                <div>
                  <span className="font-bold">A IA precisa de mais detalhes:</span>
                  <ul className="list-disc list-inside mt-1.5 space-y-1 text-slate-300">
                    {clarificationQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Suas Respostas de Esclarecimento
                </label>
                <textarea
                  rows={4}
                  value={clarificationAnswers}
                  onChange={(e) => setClarificationAnswers(e.target.value)}
                  placeholder="Escreva suas respostas para que a IA consiga calcular um plano assertivo..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Review and Edit AI Plan (RF10, CA10) */}
          {step === 'REVIEW' && (
            <div className="space-y-4">
              {summary && (
                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
                  ✨ <strong>Estratégia:</strong> {summary}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Tarefas Propostas ({tasks.length})
                </span>
                <button
                  type="button"
                  onClick={handleAddTask}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar Tarefa</span>
                </button>
              </div>

              <div className="space-y-3">
                {tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 w-5">
                        #{idx + 1}
                      </span>
                      <input
                        type="text"
                        value={task.title}
                        onChange={(e) => handleUpdateTask(idx, 'title', e.target.value)}
                        placeholder="Título da tarefa"
                        className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-100 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTask(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                        title="Remover sugestão"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <textarea
                      rows={2}
                      value={task.description}
                      onChange={(e) => handleUpdateTask(idx, 'description', e.target.value)}
                      placeholder="Descrição do que fazer..."
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Prazo (+ dias)</label>
                        <input
                          type="number"
                          min={1}
                          max={365}
                          value={task.dayOffset}
                          onChange={(e) => handleUpdateTask(idx, 'dayOffset', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Minutos</label>
                        <input
                          type="number"
                          min={5}
                          step={5}
                          value={task.estimatedMinutes}
                          onChange={(e) => handleUpdateTask(idx, 'estimatedMinutes', Number(e.target.value))}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Prioridade</label>
                        <select
                          value={task.priority}
                          onChange={(e) => handleUpdateTask(idx, 'priority', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        >
                          <option value="LOW">Baixa</option>
                          <option value="MEDIUM">Média</option>
                          <option value="HIGH">Alta</option>
                          <option value="URGENT">Urgente</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-slate-500 uppercase">Dificuldade</label>
                        <select
                          value={task.difficulty}
                          onChange={(e) => handleUpdateTask(idx, 'difficulty', e.target.value)}
                          className="w-full px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs"
                        >
                          <option value="EASY">Fácil</option>
                          <option value="MEDIUM">Média</option>
                          <option value="HARD">Difícil</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {step !== 'INPUT' && (
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Voltar ao início
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>

            {step !== 'REVIEW' ? (
              <button
                type="button"
                onClick={handleGeneratePlan}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? (
                  <span>Analisando com IA...</span>
                ) : (
                  <>
                    <span>{step === 'QUESTIONS' ? 'Reenviar Esclarecimentos' : 'Gerar Plano com IA'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirmAndSave}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Salvando...' : 'Aprovar e Salvar no Projeto'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
