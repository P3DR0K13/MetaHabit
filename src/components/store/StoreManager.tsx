'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createRewardAction,
  updateRewardAction,
  deleteRewardAction,
  redeemRewardAction,
} from '@/app/actions/rewards'
import {
  Coins,
  Plus,
  ShoppingBag,
  Sparkles,
  Trash2,
  X,
  History,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'

interface Reward {
  id: string
  name: string
  description?: string | null
  coinCost: number
}

interface Redemption {
  id: string
  coinCostAtRedemption: number
  redeemedAt: Date | string
  reward: {
    name: string
  }
}

interface StoreManagerProps {
  initialRewards: Reward[]
  initialRedemptions: Redemption[]
  userCoins: number
}

export function StoreManager({
  initialRewards,
  initialRedemptions,
  userCoins: initialCoins,
}: StoreManagerProps) {
  const router = useRouter()
  const [rewards, setRewards] = useState<Reward[]>(initialRewards)
  const [redemptions, setRedemptions] = useState<Redemption[]>(initialRedemptions)
  const [coins, setCoins] = useState(initialCoins)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [successToast, setSuccessToast] = useState<string | null>(null)

  const handleCreateReward = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)

    try {
      const res = await createRewardAction(formData)
      if (res.error) {
        setError(res.error)
      } else if (res.reward) {
        setRewards((prev) => [res.reward as any, ...prev])
        setIsModalOpen(false)
        router.refresh()
      }
    } catch {
      setError('Erro ao criar recompensa.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReward = async (rewardId: string) => {
    if (!confirm('Deseja excluir esta recompensa?')) return
    try {
      const res = await deleteRewardAction(rewardId)
      if (res.success) {
        setRewards((prev) => prev.filter((r) => r.id !== rewardId))
        router.refresh()
      }
    } catch {
      alert('Erro ao excluir recompensa.')
    }
  }

  const handleRedeem = async (reward: Reward) => {
    if (coins < reward.coinCost) {
      alert(`Saldo insuficiente! Você tem ${coins} moedas e a recompensa custa ${reward.coinCost}.`)
      return
    }

    if (!confirm(`Deseja resgatar "${reward.name}" por ${reward.coinCost} moedas?`)) return

    setRedeemingId(reward.id)
    try {
      const res = await redeemRewardAction(reward.id)
      if (res.error) {
        alert(res.error)
      } else if (res.success && res.redemption) {
        setCoins(res.remainingCoins)
        setRedemptions((prev) => [res.redemption as any, ...prev])
        setSuccessToast(`Parabéns! Recompensa "${reward.name}" resgatada com sucesso!`)
        setTimeout(() => setSuccessToast(null), 4000)
        router.refresh()
      }
    } catch {
      alert('Falha ao processar o resgate.')
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Balance Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Coins className="w-4 h-4" />
            <span>Loja de Recompensas Pessoais</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white">
            Seu Saldo: <span className="text-amber-400">{coins} moedas</span>
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Use as moedas que você conquistou completando hábitos e tarefas para se dar recompensas reais e manter a motivação em alta.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null)
            setIsModalOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Recompensa</span>
        </button>
      </div>

      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Grid of Rewards */}
      <div>
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <ShoppingBag className="w-4 h-4 text-indigo-400" />
          <span>Recompensas Disponíveis ({rewards.length})</span>
        </h2>

        {rewards.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 border-dashed text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">Nenhuma recompensa cadastrada</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Cadastre coisas que você gosta: "1 hora de videogame", "Pedir pizza", "Comprar um livro novo", etc.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Recompensa</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rewards.map((reward) => {
              const canAfford = coins >= reward.coinCost
              const isRedeeming = redeemingId === reward.id

              return (
                <div
                  key={reward.id}
                  className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-extrabold text-xs">
                        <Coins className="w-3.5 h-3.5" />
                        <span>{reward.coinCost} moedas</span>
                      </div>
                      <button
                        onClick={() => handleDeleteReward(reward.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded-md transition-colors"
                        title="Excluir recompensa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-base font-bold text-white mt-1">
                      {reward.name}
                    </h3>
                    {reward.description && (
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {reward.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/80">
                    <button
                      onClick={() => handleRedeem(reward)}
                      disabled={!canAfford || isRedeeming}
                      className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {isRedeeming
                          ? 'Resgatando...'
                          : canAfford
                          ? 'Resgatar Recompensa'
                          : `Faltam ${reward.coinCost - coins} moedas`}
                      </span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* History of Redemptions (RF17) */}
      <div className="pt-4 border-t border-slate-800">
        <h2 className="text-base font-bold text-white mb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-slate-400" />
          <span>Histórico de Resgates ({redemptions.length})</span>
        </h2>

        {redemptions.length === 0 ? (
          <p className="text-xs text-slate-500">Nenhum resgate realizado ainda.</p>
        ) : (
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80">
            {redemptions.map((red) => (
              <div
                key={red.id}
                className="p-3.5 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-white">
                    {red.reward?.name || 'Recompensa'}
                  </span>
                  <span className="text-slate-400 ml-2">
                    {new Date(red.redeemedAt).toLocaleDateString('pt-BR')} às{' '}
                    {new Date(red.redeemedAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="font-bold text-amber-400">
                  -{red.coinCostAtRedemption} moedas
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar Recompensa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-lg font-bold text-white mb-1">
              Criar Recompensa Pessoal
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Defina algo que você gosta e um preço justo em moedas para resgatá-la.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Nome da Recompensa *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="Ex: 1h de videogame, Assistir 1 filme, Pedir sobremesa"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição (Opcional)
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="Regras ou detalhes do seu momento de recompensa..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                  Custo em Moedas *
                </label>
                <input
                  type="number"
                  name="coinCost"
                  required
                  defaultValue={30}
                  min={1}
                  step={5}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
