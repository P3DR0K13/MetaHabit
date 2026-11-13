# Changelog & Registro de Decisões do Projeto — Meta (MetaHabit)

Registro detalhado das decisões arquiteturais, revisões humanas sobre as propostas do agente de IA e correções técnicas realizadas ao longo do desenvolvimento do **MetaHabit**, atendendo às diretrizes de desenvolvimento responsável com IA.

---

## [1.0.0] - 2026-11-13

### 📌 1. Reestruturação da Raiz do Repositório
- **Contexto:** A pasta inicial continha resquícios de um projeto anterior não commitado (`sentinela`).
- **Decisão Humana:** Rejeitar a manutenção de uma subpasta confusa. Todos os arquivos e dependências foram movidos diretamente para a raiz de `MetaHabit`, garantindo compatibilidade imediata com a detecção automática de projetos na Vercel sem necessidade de configurar *Root Directory*.
- **Ações:** Remoção do blueprint e código anterior de segurança pública, atualização do `package.json` para o nome `metahabit` e reconfiguração do Git origin para `https://github.com/P3DR0K13/MetaHabit.git`.

---

### 🛡️ 2. Arquitetura de Autenticação e Segurança
- **Decisão:** Substituir bibliotecas complexas e instáveis de autenticação externa por uma solução leve, auditável e 100% controlada no servidor.
- **Implementação:**
  - Hashing de senhas com `bcryptjs` utilizando custo 12 de salt.
  - Sessão criptografada baseada em tokens JWT gerados pela biblioteca moderna `jose` e armazenados em cookies HTTP-Only com flags `sameSite: "lax"` e `secure` em ambiente de produção.
  - Implementação de `middleware.ts` para proteção das rotas `/hoje`, `/habitos`, `/projetos`, `/loja` e `/progresso`, redirecionando visitantes não autenticados para `/login`.
  - Validação estrita de posse em todas as Server Actions (`where: { userId }`), impedindo vulnerabilidades de Broken Object Level Authorization (BOLA).

---

### 🗄️ 3. Prisma ORM v7 e Compatibilidade Dual (SQLite Local + Neon PostgreSQL)
- **Problema Encontrado:** O Prisma v7 introduziu breaking changes em relação às versões anteriores: a propriedade `url` foi removida do bloco `datasource` no `schema.prisma`, exigindo o uso de *Driver Adapters* no construtor do `PrismaClient`.
- **Diagnóstico e Correção:**
  - Ao rodar `prisma db push`, o Prisma sinalizou a nova convenção de configuração via `prisma.config.ts`.
  - Ao executar os testes locais com `@prisma/adapter-libsql`, ocorreu o erro `URL_INVALID: The URL 'undefined' is not in a valid format`.
  - **Revisão Técnica:** Identificamos que a classe `PrismaLibSql` é uma fábrica de adaptadores que recebe o objeto de configuração `{ url }` (e não uma instância pré-criada do client).
  - **Solução Implementada:** Desenvolvemos um singleton inteligente em `src/lib/db.ts` que detecta a variável `DATABASE_URL`:
    - Se iniciar com `postgres://` ou `postgresql://`, inicializa `@prisma/adapter-pg` com pool de conexões (preparado para **Neon** em produção).
    - Se for `file:`, inicializa `@prisma/adapter-libsql` para desenvolvimento local offline com zero-setup.

---

### 🤖 4. Integração com IA e Princípio "Human-in-the-Loop" (RF08, RF09, RF10, RF19, RF20)
- **Decisão:** O sistema de IA (Google Gemini) deve atuar como colaborador, nunca como decisor autônomo sobre os dados do usuário.
- **Revisão das Sugestões da IA:**
  - **Perguntas de Esclarecimento (RF09):** Quando o usuário fornece informações vagas (ex: "estudar para passar"), a IA não alucina um plano genérico; ela formula perguntas pontuais para calibrar a resposta.
  - **Modal de Revisão Humana Obrigatória (RF10):** A IA retorna uma proposta estruturada (tarefa, descrição, prazo relativo, tempo estimado, prioridade e dificuldade). O usuário tem liberdade total para:
    - Alterar o título ou a descrição de qualquer tarefa;
    - Ajustar a estimativa de tempo e a dificuldade;
    - Deletar tarefas irrelevantes;
    - Adicionar tarefas manuais adicionais.
    - **Apenas o conjunto aprovado com um clique explícito é salvo no banco de dados.**
  - **Adaptação de Projetos (RF19, RF20):** Se o usuário relatar atrasos ou imprevistos, a IA propõe um reescalonamento, que também necessita de confirmação explícita antes de sobrescrever as tarefas originais.
  - **Fallback Gracioso (RF22):** Implementamos um gerador de estratégias local estruturado para garantir que, mesmo se a chave da API estiver ausente ou a cota esgotada, a aplicação continue 100% operacional sem falhar silenciosamente ou corromper o banco.

---

### 🎮 5. Motor de Gamificação e Integridade Financeira de Moedas
- **Decisão:** A gamificação deve ser justa, auditável e imune a abusos de cliques repetidos.
- **Implementações:**
  - Criação da tabela `activity_rewards` com restrição única `@@unique([userId, activityType, activityId])`. Se o usuário desmarcar e remarcar uma tarefa ou hábito na mesma data, o sistema reconhece a conclusão anterior e não gera XP/moedas duplicados.
  - Transação atômica (`prisma.$transaction`) no resgate da Loja Pessoal: o sistema confere se `user.coins >= reward.coinCost` dentro da transação, garantindo que mesmo requisições concorrentes não tornem o saldo do usuário negativo.
  - Progressão de ranks calibrada:
    - Nível 1 a 4: *Bronze (Iniciante)*
    - Nível 5 a 9: *Prata (Focado)*
    - Nível 10 a 19: *Ouro (Disciplinado)*
    - Nível 20 a 34: *Platina (Estrategista)*
    - Nível 35 a 49: *Diamante (Mestre dos Hábitos)*
    - Nível 50+: *Lendário (Grão-Mestre)*

---

### 🔄 6. Resolução de Conflitos Git & Sincronização
- **Situação:** O repositório remoto continha um commit inicial gerado pela interface do GitHub com um `README.md` vazio.
- **Ação:** Realizado `git pull origin main --allow-unrelated-histories`, resolvido o conflito em favor da documentação técnica completa do MetaHabit, criado o commit de merge e executado o push para a branch `main`.

---

### ✅ 7. Validação e Qualidade
- Bateria de testes automatizados unitários e de integração implementada em `scripts/verify-metahabit.ts`.
- Verificação de tipos TypeScript (`npx tsc --noEmit`): 0 erros.
- Build de produção Next.js Turbopack (`npm run build`): compilação e geração estática/dinâmica de 10 rotas com 100% de sucesso.
