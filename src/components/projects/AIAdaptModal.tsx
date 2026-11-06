'use client'

import { useState } from 'react'
import { requestAIAdaptationAction, confirmAIAdaptationAction } from '@/app/actions/ai-planner'
import {
  Sparkles,
  CheckCircle2,
  X,
  AlertCircle,
  Calendar,
  Clock,
  ArrowRight,
  TrendingDown,
} from 'lucide-react'

interface AIAdaptModalProps {
  projectId: string
  projectTitle: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function AIAdaptModal({
  projectId,
  projectTitle,
  isOpen,
  onClose,
  onSuccess,
}: AIAdaptModalProps) {
  const [step, setStep] = useState<'INPUT' | 'REVIEW'>('INPUT')
  const [reportedDifficulties, setReportedDifficulties] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [summary, setSummary] = useState('')
  const [adjustedTasks, setAdjustedTasks] = useState<any[]>([])

  if (!isOpen) return null

  const handleRequestAdaptation = async () => {
    if (!reportedDifficulties.trim()) {
      setError('Por favor, informe a dificuldade, atraso ou mudança na sua rotina.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await requestAIAdaptationAction({
        projectId,
        reportedDifficulties: reportedDifficulties.trim(),
      })

      if (res.error) {
        setError(res.error)
      } else if (res.adaptationResult) {
        setSummary(res.adaptationResult.adaptationSummary || '')
        setAdjustedTasks(res.adaptationResult.adjustedTasks || [])
        setStep('REVIEW')
      }
    } catch {
      setError('Falha ao processar adaptação.')
    } finally {
      setLoading(false)
    }
  }

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await confirmAIAdaptationAction({
        projectId,
        approvedAdjustments: adjustedTasks,
      })

      if (res.error) {
        setError(res.error)
      } else {
        onSuccess()
        onClose()
      }
    } catch {
      setError('Erro ao aplicar adaptação.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                Adaptar Projeto com IA
              </h2>
              <p className="text-xs text-slate-400">
                Reorganização adaptativa para {projectTitle}
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {step === 'INPUT' ? (
            <div className="space-y-4">
              <p className="text-xs text-slate-300 leading-relaxed">
                Relate os atrasos, imprevistos ou a nova quantidade de tempo disponível. A IA irá redistribuir os prazos e ajustar o escopo das tarefas pendentes sem perder o foco do objetivo.
              </p>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  O que mudou ou qual foi a dificuldade? *
                </label>
                <textarea
                  rows={4}
                  required
                  value={reportedDifficulties}
                  onChange={(e) => setReportedDifficulties(e.target.value)}
                  placeholder="Ex: Tive imprevistos de trabalho e agora só tenho 30 minutos diários; estou travado na parte prática..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs">
                💡 <strong>Proposta de Reorganização:</strong> {summary}
              </div>

              <div className="space-y-2.5">
                {adjustedTasks.map((t, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-200">{t.title}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold border border-indigo-500/20">
                        {t.action === 'RESCHEDULE' ? 'Reagendada' : 'Ajustada'}
                      </span>
                    </div>
                    {t.description && (
                      <p className="text-slate-400 text-[11px]">{t.description}</p>
                    )}
                    <div className="flex items-center gap-3 text-slate-500 text-[10px] pt-1 border-t border-slate-900">
                      <span>Prazo: +{t.newDueDateOffset} dias</span>
                      <span>Duração: {t.estimatedMinutes}m</span>
                      <span>Prioridade: {t.priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          {step === 'REVIEW' && (
            <button
              type="button"
              onClick={() => setStep('INPUT')}
              className="text-xs text-slate-400 hover:text-white"
            >
              Alterar relato
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

            {step === 'INPUT' ? (
              <button
                type="button"
                onClick={handleRequestAdaptation}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {loading ? 'Analisando...' : 'Solicitar Adaptação'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={loading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{loading ? 'Aplicando...' : 'Confirmar e Aplicar Ajustes'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
