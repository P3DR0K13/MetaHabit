# Especificação Final do Sistema — Meta (MetaHabit)

> **Versão:** 1.0.0 (Final)  
> **Repositório:** [https://github.com/P3DR0K13/MetaHabit](https://github.com/P3DR0K13/MetaHabit)  
> **Status:** Implementado, validado e pronto para deploy.

---

## 1. Visão Geral do Produto

O **Meta (MetaHabit)** é um sistema integrado de produtividade pessoal que combina hábitos diários recorrentes e projetos orientados a objetivos em uma única aplicação. O produto resolve a "paralisia decisória" através do cockpit diário central **"O que faço agora?"**, que resume as prioridades imediatas do usuário.

A aplicação conta com um motor completo de **gamificação** (pontos de experiência - XP, níveis, ranks e moedas) e integração colaborativa com **Inteligência Artificial (Google Gemini)** para elaboração e adaptação de planos com **revisão humana obrigatória** antes de qualquer persistência.

---

## 2. Perfis de Usuário & Controle de Acesso

- **Visitante (Não autenticado):**
  - Acessa landing page pública com apresentação do sistema.
  - Acessa páginas de cadastro (`/cadastro`) e login (`/login`).
  - Bloqueado de qualquer rota ou dado interno via middleware.
- **Usuário Cadastrado e Autenticado:**
  - Gerencia seus próprios hábitos, projetos, tarefas e recompensas.
  - Acompanha progresso diário, XP, nível, rank e saldo de moedas.
  - Solicita planejamento e adaptação à IA com aprovação formal.
  - **Isolamento de dados (RF03):** todas as leituras e mutações no banco de dados validam rigorosamente no servidor a titularidade dos registros (`where: { userId }`), impossibilitando acesso a dados de terceiros por manipulação de URLs ou IDs.

---

## 3. Módulos do Sistema e Requisitos Funcionais Implementados

### 3.1. Autenticação e Segurança (RF01, RF02, RF03)
- **Cadastro:** validação de nome, e-mail válido e senha mínima com verificação de e-mail duplicado.
- **Armazenamento de Senha:** hash seguro utilizando algoritmo `bcryptjs` com 12 salt rounds (senhas nunca em texto puro).
- **Sessão:** cookies seguros (`httpOnly`, `sameSite: "lax"`, `secure` em produção) com tokens assinados via `jose` (JWT).
- **Proteção de Rotas:** middleware de interceptação que redireciona visitantes não autenticados para `/login`.

### 3.2. Hábitos Recorrentes (RF04, RF05, RF13, RF14)
- **Gerenciamento:** CRUD completo de hábitos com nome, frequência (`DAILY`, `WEEKLY`, `SPECIFIC_DAYS`) e status (`ACTIVE`, `PAUSED`, `ARCHIVED`).
- **Registro de Execução Diário:** check-in diário com registro em `HabitLog`.
- **Prevenção de Duplicidade:** restrição única `@@unique([habitId, completedDate])` impedindo duplicidade no mesmo dia.
- **Recompensa:** concessão atômica de `+20 XP` e `+5 Moedas` por hábito concluído via `ActivityReward`.

### 3.3. Projetos e Tarefas (RF06, RF07, RF11, RF13)
- **Projetos:** cadastro de título, objetivo, prazo (`deadline`), disponibilidade semanal/diária (`availableTime`) e dificuldades conhecidas (`difficulties`).
- **Tarefas:** vinculadas a projetos, com prazo, duração estimada (minutos), prioridade (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), dificuldade (`EASY`, `MEDIUM`, `HARD`) e situação (`PENDING`, `COMPLETED`, `CANCELLED`).
- **Registro de Obstáculos:** funcionalidade específica para registrar dificuldades que impediram a realização e reagendar a tarefa.

### 3.4. Inteligência Artificial com Revisão Humana (RF08, RF09, RF10, RF19, RF20, RF22)
- **Geração de Plano (RF08):** decomposição de objetivo e materiais de referência em etapas executáveis com tempo e prioridades.
- **Perguntas de Esclarecimento (RF09):** detecção de dados vagos ou insuficientes, retornando questionamentos para o usuário responder antes de sugerir o plano.
- **Revisão Humana Obrigatória (RF10):** modal interativo onde o usuário pode editar títulos, tempos, dificuldades, excluir itens ou adicionar novas tarefas antes de aprovar. Nada é salvo no banco sem consentimento explícito.
- **Adaptação de Projetos (RF19, RF20):** reorganização de prazos e redistribuição de tarefas pendentes mediante relato de imprevistos ou nova rotina, também exigindo aprovação antes de aplicar.
- **Fallback Gracioso (RF22):** caso a API de IA esteja offline ou sem chave, um gerador inteligente local assume a função sem corromper dados ou interromper a aplicação.

### 3.5. Cockpit Diário "O que faço agora?" (RF12)
- Tela principal consolidada com a data atual formatada em português.
- Visão rápida dos hábitos previstos para hoje com botão de check-in instantâneo e animação de ganho de XP.
- Lista de tarefas prioritárias e com prazo para o dia, ordenadas por urgência.

### 3.6. Gamificação e Loja Pessoal (RF14, RF15, RF16, RF17, RF18)
- **Cálculo de Níveis:** `Nível = floor(sqrt(XP / 50)) + 1`.
- **Escada de Ranks:**
  - *Bronze (Iniciante)*: Nível 1+
  - *Prata (Focado)*: Nível 5+
  - *Ouro (Disciplinado)*: Nível 10+
  - *Platina (Estrategista)*: Nível 20+
  - *Diamante (Mestre dos Hábitos)*: Nível 35+
  - *Lendário (Grão-Mestre)*: Nível 50+
- **Loja Pessoal:** cadastro de recompensas personalizadas com custo em moedas.
- **Resgate Atômico:** transação que valida saldo suficiente, deduz moedas do usuário e gera registro de resgate (`RewardRedemption`), impedindo saldo negativo.
- **Painel de Progresso:** métricas de consistência, total de tarefas, barra de progresso para o próximo nível e histórico de auditoria de recompensas.

---

## 4. Modelo de Dados Relacional (DER)

```prisma
model User {
  id               String            @id @default(cuid())
  name             String
  email            String            @unique
  passwordHash     String            @map("password_hash")
  experiencePoints Int               @default(0) @map("experience_points")
  level            Int               @default(1)
  rank             String            @default("Iniciante")
  coins            Int               @default(0)
  createdAt        DateTime          @default(now()) @map("created_at")

  habits           Habit[]
  projects         Project[]
  activityRewards  ActivityReward[]
  rewards          Reward[]
  redemptions      RewardRedemption[]

  @@map("users")
}

model Habit {
  id          String     @id @default(cuid())
  userId      String     @map("user_id")
  name        String
  description String?
  frequency   String     @default("DAILY")
  status      String     @default("ACTIVE")
  createdAt   DateTime   @default(now()) @map("created_at")

  user        User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs        HabitLog[]

  @@map("habits")
}

model HabitLog {
  id            String   @id @default(cuid())
  habitId       String   @map("habit_id")
  completedDate String   @map("completed_date")
  status        String   @default("COMPLETED")
  notes         String?
  createdAt     DateTime @default(now()) @map("created_at")

  habit         Habit    @relation(fields: [habitId], references: [id], onDelete: Cascade)

  @@unique([habitId, completedDate])
  @@map("habit_logs")
}

model Project {
  id            String    @id @default(cuid())
  userId        String    @map("user_id")
  title         String
  objective     String
  description   String?
  deadline      DateTime?
  availableTime String?   @map("available_time")
  difficulties  String?
  status        String    @default("IN_PROGRESS")
  createdAt     DateTime  @default(now()) @map("created_at")

  user          User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  tasks         Task[]

  @@map("projects")
}

model Task {
  id               String    @id @default(cuid())
  projectId        String    @map("project_id")
  title            String
  description      String?
  dueDate          DateTime? @map("due_date")
  estimatedMinutes Int?      @map("estimated_minutes")
  priority         String    @default("MEDIUM")
  difficulty       String    @default("MEDIUM")
  status           String    @default("PENDING")
  completedAt      DateTime? @map("completed_at")
  obstacle         String?
  createdAt        DateTime  @default(now()) @map("created_at")

  project          Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)

  @@map("tasks")
}

model ActivityReward {
  id               String   @id @default(cuid())
  userId           String   @map("user_id")
  activityType     String   @map("activity_type")
  activityId       String   @map("activity_id")
  experiencePoints Int      @map("experience_points")
  coins            Int
  createdAt        DateTime @default(now()) @map("created_at")

  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, activityType, activityId])
  @@map("activity_rewards")
}

model Reward {
  id          String             @id @default(cuid())
  userId      String             @map("user_id")
  name        String
  description String?
  coinCost    Int                @map("coin_cost")
  createdAt   DateTime           @default(now()) @map("created_at")

  user        User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  redemptions RewardRedemption[]

  @@map("rewards")
}

model RewardRedemption {
  id                   String   @id @default(cuid())
  rewardId             String   @map("reward_id")
  userId               String   @map("user_id")
  coinCostAtRedemption Int      @map("coin_cost_at_redemption")
  redeemedAt           DateTime @default(now()) @map("redeemed_at")

  reward               Reward   @relation(fields: [rewardId], references: [id], onDelete: Cascade)
  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("reward_redemptions")
}
```

---

## 5. Arquitetura Técnica e Segurança

- **Framework:** Next.js 15+ com App Router e Server Actions.
- **Linguagem:** TypeScript com modo estrito (`strict: true`).
- **Banco de Dados:** Prisma ORM v7 com suporte dual: LibSQL (SQLite para dev local) e PostgreSQL (Neon para deploy em produção).
- **Estilização:** Tailwind CSS v4 com paleta escura (indigo, amber/gold, slate).
- **Checklist de Segurança:**
  - Sem credenciais ou segredos commitados no repositório (`.env` no `.gitignore`).
  - Consultas parametrizadas via ORM Prisma (proteção contra SQL Injection).
  - Validação estrita de entradas com Zod em todas as rotas e ações de servidor.
  - Hash de senha irreversível com Bcrypt.
