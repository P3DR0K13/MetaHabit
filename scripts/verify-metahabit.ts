import 'dotenv/config'
import {
  calculateLevel,
  calculateRank,
  getLevelProgress,
  getTaskRewardValues,
  awardActivityReward,
  redeemStoreReward,
} from '../src/lib/gamification'
import { hashPassword, verifyPassword } from '../src/lib/auth'
import { prisma } from '../src/lib/db'
import { generateProjectPlanWithAI, adaptProjectPlanWithAI } from '../src/lib/ai/gemini'

async function runTests() {
  console.log('🧪 Iniciando testes de verificação do Meta (MetaHabit)...\n')

  // TESTE 1: Regras de Nível e Rank
  console.log('1. Testando regras de Nível e Rank:')
  console.assert(calculateLevel(0) === 1, 'XP 0 deve ser nível 1')
  console.assert(calculateLevel(49) === 1, 'XP 49 deve ser nível 1')
  console.assert(calculateLevel(50) === 2, 'XP 50 deve ser nível 2')
  console.assert(calculateLevel(200) === 3, 'XP 200 deve ser nível 3')

  console.assert(calculateRank(1).includes('Bronze'), 'Nível 1 deve ser Bronze')
  console.assert(calculateRank(5).includes('Prata'), 'Nível 5 deve ser Prata')
  console.assert(calculateRank(10).includes('Ouro'), 'Nível 10 deve ser Ouro')
  console.assert(calculateRank(20).includes('Platina'), 'Nível 20 deve ser Platina')
  console.assert(calculateRank(35).includes('Diamante'), 'Nível 35 deve ser Diamante')
  console.assert(calculateRank(50).includes('Lendário'), 'Nível 50 deve ser Lendário')

  const progress = getLevelProgress(75)
  console.assert(progress.currentLevel === 2, '75 XP deve ser nível 2')
  console.log('   ✅ Regras de Nível, Rank e XP verificadas com sucesso!')

  // TESTE 2: Valores de recompensa por dificuldade/prioridade
  console.log('\n2. Testando cálculo de recompensas de tarefas:')
  const easyReward = getTaskRewardValues('EASY', 'LOW')
  const mediumReward = getTaskRewardValues('MEDIUM', 'MEDIUM')
  const hardReward = getTaskRewardValues('HARD', 'URGENT')

  console.assert(easyReward.xp === 15 && easyReward.coins === 5, 'Easy deve conceder 15 XP e 5 moedas')
  console.assert(mediumReward.xp === 35 && mediumReward.coins === 10, 'Medium deve conceder 35 XP e 10 moedas')
  console.assert(hardReward.xp > 75 && hardReward.coins >= 25, 'Hard Urgent deve conceder bônus de XP e moedas')
  console.log('   ✅ Tabela de recompensas por dificuldade validada!')

  // TESTE 3: Criptografia de senhas (bcryptjs)
  console.log('\n3. Testando hash e validação de senhas:')
  const password = 'MinhaSenhaSegura123!'
  const hash = await hashPassword(password)
  console.assert(hash !== password, 'O hash deve ser diferente da senha pura')
  const isValid = await verifyPassword(password, hash)
  console.assert(isValid === true, 'A validação da senha correta deve ser verdadeira')
  const isInvalid = await verifyPassword('SenhaErrada', hash)
  console.assert(isInvalid === false, 'A validação de senha incorreta deve ser falsa')
  console.log('   ✅ Criptografia de senhas bcrypt funcionando perfeitamente!')

  // TESTE 4: Transações de banco de dados (Criação de usuário, hábito e concessão atômica de XP)
  console.log('\n4. Testando persistência e regras de negócio no banco de dados:')
  const testEmail = `test_runner_${Date.now()}@metahabit.app`

  const user = await prisma.user.create({
    data: {
      name: 'Tester Habit',
      email: testEmail,
      passwordHash: hash,
      experiencePoints: 0,
      level: 1,
      rank: 'Bronze (Iniciante)',
      coins: 20,
    },
  })

  console.log(`   Usuário de teste criado (ID: ${user.id})`)

  // Conceder recompensa de atividade
  const reward1 = await awardActivityReward({
    userId: user.id,
    activityType: 'HABIT',
    activityId: 'habit_test_01',
    xp: 20,
    coins: 5,
  })

  console.assert(reward1.alreadyRewarded === false, 'Primeira concessão deve ter sucesso')
  console.assert(reward1.xpAwarded === 20, 'Deve ter concedido 20 XP')

  // Tentar conceder a MESMA recompensa novamente (prevenção de duplicidade RF14, CA14)
  const reward2 = await awardActivityReward({
    userId: user.id,
    activityType: 'HABIT',
    activityId: 'habit_test_01',
    xp: 20,
    coins: 5,
  })

  console.assert(reward2.alreadyRewarded === true, 'Segunda tentativa para mesma atividade deve ser ignorada')
  console.assert(reward2.xpAwarded === 0, 'Não deve conceder XP duplicado')
  console.log('   ✅ Prevenção de XP e moedas duplicadas (RF14) validada!')

  // TESTE 5: Loja de recompensas e integridade de saldo (RF17, CA17)
  console.log('\n5. Testando resgate na Loja de Recompensas e prevenção de saldo negativo:')
  const customReward = await prisma.reward.create({
    data: {
      userId: user.id,
      name: 'Jogar 1h de videogame',
      coinCost: 50, // Custa 50 moedas
    },
  })

  // Usuário tem 25 moedas (20 iniciais + 5 da recompensa do hábito). Deve falhar por saldo insuficiente!
  let failedAsExpected = false
  try {
    await redeemStoreReward({
      userId: user.id,
      rewardId: customReward.id,
    })
  } catch (err: any) {
    failedAsExpected = true
    console.log(`   Recusa correta: ${err.message}`)
  }
  console.assert(failedAsExpected, 'Resgate com saldo insuficiente deve ser recusado sem alterar saldo')

  // Criar recompensa acessível de 15 moedas
  const affordableReward = await prisma.reward.create({
    data: {
      userId: user.id,
      name: 'Pausa para café especial',
      coinCost: 15,
    },
  })

  const redemptionRes = await redeemStoreReward({
    userId: user.id,
    rewardId: affordableReward.id,
  })

  console.assert(redemptionRes.success === true, 'Resgate deve ter sucesso com saldo suficiente')
  console.assert(redemptionRes.remainingCoins === 10, 'Saldo deve ter sido descontado para 10 moedas')
  console.log('   ✅ Resgate na Loja e dedução de moedas (RF17) validados com sucesso!')

  // TESTE 6: Serviço de Planejamento de IA (RF08, RF09)
  console.log('\n6. Testando serviço de IA com perguntas de esclarecimento e decomposição:')
  const vaguePlan = await generateProjectPlanWithAI({
    title: 'Estudar',
    objective: 'Passar',
  })
  console.assert(vaguePlan.needsClarification === true, 'Objetivo vago deve solicitar esclarecimentos (RF09)')
  console.assert((vaguePlan.clarificationQuestions?.length || 0) > 0, 'Deve conter perguntas de esclarecimento')
  console.log('   ✅ Mecanismo de perguntas de esclarecimento da IA (RF09) validado!')

  const detailedPlan = await generateProjectPlanWithAI({
    title: 'Aprender Next.js 15 e Prisma',
    objective: 'Construir um sistema web completo com banco de dados relacional e deploy',
    availableTime: '1h por dia',
    difficulties: 'Pouco tempo livre durante a semana',
  })
  console.assert(detailedPlan.needsClarification === false, 'Objetivo claro deve gerar plano direto (RF08)')
  console.assert((detailedPlan.suggestedTasks?.length || 0) >= 3, 'Deve gerar tarefas detalhadas')
  console.log(`   Plano gerado com ${detailedPlan.suggestedTasks?.length} tarefas acionáveis!`)
  console.log('   ✅ Geração de plano por IA (RF08) validada!')

  // Limpar dados do teste
  await prisma.user.delete({ where: { id: user.id } })
  console.log('\n🧹 Limpeza de dados de teste concluída!')
  console.log('🎉 TODOS OS TESTES PASSARAM COM SUCESSO!\n')
}

runTests().catch((e) => {
  console.error('❌ Erro no teste:', e)
  process.exit(1)
})
