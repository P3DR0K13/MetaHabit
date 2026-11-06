# Meta (MetaHabit) 🎯

> **Sistema de produtividade pessoal que reúne hábitos recorrentes, projetos orientados a objetivos, inteligência artificial e gamificação.**

---

## 🚀 Sobre o Projeto

O **Meta** transforma objetivos amplos em missões e tarefas concretas, eliminando a paralisia decisória através da tela central **"O que faço agora?"**. O progresso é acompanhado por um motor de gamificação completo (XP, Níveis, Ranks, Moedas e Loja Pessoal de Recompensas).

A **IA** participa ativamente da decomposição e adaptação dos projetos, considerando prazos, disponibilidade, dificuldades e materiais de apoio (editais/ementas), com **aprovação humana obrigatória** antes de qualquer alteração no banco de dados.

---

## 🛠️ Stack Tecnológica

- **Frontend & Backend**: Next.js 15+ (App Router, Server Actions, TypeScript)
- **Estilização**: Tailwind CSS v4
- **Banco de Dados**: PostgreSQL (Neon) / SQLite (desenvolvimento local com zero-setup)
- **ORM**: Prisma ORM v7
- **Autenticação**: Sessão segura via cookies HTTP-only, tokens JWT (`jose`) e hash de senhas (`bcryptjs`)
- **Inteligência Artificial**: Google Gemini API (`@google/genai` com fallback inteligente local)
- **Deploy**: Vercel + Neon

---

## 📦 Instalação e Execução

### 1. Clonar o repositório
```bash
git clone https://github.com/P3DR0K13/MetaHabit.git
cd MetaHabit
```

### 2. Instalar dependências
```bash
npm install
```

### 3. Configurar variáveis de ambiente
Copie o arquivo `.env.example` para `.env`:
```bash
cp .env.example .env
```
Variáveis principais:
- `DATABASE_URL`: `"file:./dev.db"` para SQLite local ou a string de conexão do Neon PostgreSQL.
- `JWT_SECRET`: Segredo para assinatura de tokens de sessão.
- `GEMINI_API_KEY`: Chave da API do Google AI Studio (opcional; o sistema possui fallback gracioso).

### 4. Sincronizar banco de dados
```bash
npx prisma db push
npx prisma generate
```

### 5. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

---

## 🎮 Gamificação e Ranks

| Rank | Nível Mínimo | Benefício |
|---|---|---|
| **Bronze (Iniciante)** | Nível 1 | Acesso à loja básica e criação de hábitos |
| **Prata (Focado)** | Nível 5 | Desbloqueio de insígnia Prata |
| **Ouro (Disciplinado)** | Nível 10 | Conquistas avançadas de consistência |
| **Platina (Estrategista)** | Nível 20 | Planejamento multietapas |
| **Diamante (Mestre dos Hábitos)** | Nível 35 | Domínio de rotinas diárias |
| **Lendário (Grão-Mestre)** | Nível 50 | Status supremo de produtividade |

### Recompensas por Atividade:
- **Hábito diário concluído**: `+20 XP`, `+5 Moedas`
- **Tarefa Fácil**: `+15 XP`, `+5 Moedas`
- **Tarefa Média**: `+35 XP`, `+10 Moedas`
- **Tarefa Difícil / Urgente**: `+75 XP`, `+25 Moedas`

---

## 🔒 Segurança e Privacidade

- **Senhas Criptografadas**: Utiliza algoritmo bcrypt com 12 rounds de salt.
- **Autorização no Servidor**: Todas as consultas e mutações validam rigorosamente a posse dos registros (`where: { userId }`).
- **Resiliência a Falhas de IA**: A indisponibilidade de serviços externos não afeta o funcionamento das rotas centrais nem corrompe dados existentes.

---

Desenvolvido para máxima produtividade e consistência pessoal.
