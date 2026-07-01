# 💜 FinançasFácil

> Sistema full-stack de gestão financeira pessoal, com autenticação JWT stateless, dashboard interativo e um assistente de IA (FinBot) com contexto financeiro em tempo real via Groq API.

<p align="center">
  <img src="https://img.shields.io/badge/status-em%20produção-brightgreen?style=for-the-badge" alt="status"/>
  <img src="https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="node"/>
  <img src="https://img.shields.io/badge/Express-5.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="express"/>
  <img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="mongodb"/>
  <img src="https://img.shields.io/badge/JWT-Auth-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white" alt="jwt"/>
  <img src="https://img.shields.io/badge/Groq-Llama%203.3%2070B-F55036?style=for-the-badge&logo=data:image/svg+xml;base64,&logoColor=white" alt="groq"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-Vercel-000000?style=flat-square&logo=vercel&logoColor=white" alt="vercel"/>
  <img src="https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white" alt="render"/>
  <img src="https://img.shields.io/badge/JavaScript-Vanilla-F7DF1E?style=flat-square&logo=javascript&logoColor=black" alt="js"/>
  <img src="https://img.shields.io/badge/CSS3-Responsivo-1572B6?style=flat-square&logo=css3&logoColor=white" alt="css"/>
  <img src="https://img.shields.io/badge/Licença-Uso%20Pessoal-lightgrey?style=flat-square" alt="license"/>
</p>

**Demo:** [financas-facil-hazel.vercel.app](https://financas-facil-hazel.vercel.app)
**Repositório:** [github.com/gustavodod34-commits/FinancasFacil](https://github.com/gustavodod34-commits/FinancasFacil)

---

## 📖 Sobre o Projeto

FinançasFácil é uma aplicação web completa para controle financeiro pessoal, construída do zero com JavaScript puro no front-end e uma API REST em Node.js/Express no back-end. O projeto nasceu como um dashboard simples de receitas e despesas, mas evoluiu para incluir autenticação segura entre domínios (front na Vercel, back no Render), um assistente virtual com IA que responde com base nos dados reais do usuário, e uma camada de UI totalmente responsiva.

Este README documenta tanto o funcionamento do produto quanto as decisões técnicas por trás dele — pensado para servir como peça de portfólio.

---

## 🧠 Soluções de Engenharia & Diferenciais Técnicos

Esta seção resume os problemas reais de engenharia enfrentados durante o desenvolvimento e as soluções aplicadas.

### 1. Autenticação Stateless via JWT (contornando bloqueio de cookies mobile)
O front-end (Vercel) e o back-end (Render) vivem em domínios diferentes, o que torna qualquer cookie de sessão um cookie **cross-site**. Navegadores mobile (Safari com ITP, Chrome com bloqueio progressivo de 3rd-party cookies) descartam ou restringem esse tipo de cookie, causando falhas de autenticação (`401 Unauthorized`) mesmo com login válido.

**Solução aplicada:** migração completa de sessões baseadas em cookie (`httpOnly` + `SameSite=None`) para autenticação **JWT stateless**, com o token:
- Emitido no login (`jsonwebtoken`, expiração de 7 dias) e devolvido no corpo da resposta (JSON), nunca em cookie;
- Armazenado no `localStorage` do cliente;
- Enviado em toda requisição protegida via header `Authorization: Bearer <token>`;
- Validado por um middleware Express dedicado (`middleware/auth.js`), sem qualquer estado de sessão guardado no servidor — o que também elimina condições de corrida entre múltiplos dispositivos logados simultaneamente (ex: desktop + celular).

### 2. Prompt Engineering com leitura de banco em tempo real (Groq API)
O FinBot não é um chatbot genérico: ele foi projetado para responder perguntas pessoais como *"quanto eu gastei esse mês?"* com base nos dados reais do usuário.

**Solução aplicada:**
- A rota `/api/chat` é protegida pelo mesmo middleware JWT, garantindo `req.user.id` confiável;
- Antes de cada chamada à IA, o servidor executa `Transaction.find({ user: req.user.id })` no MongoDB e formata os resultados em texto plano estruturado;
- Esse contexto é injetado dinamicamente dentro do **System Prompt** enviado ao modelo (`llama-3.3-70b-versatile` via Groq), junto de regras estritas de formatação (texto plano, sem Markdown) e de comportamento (guia de investimentos em passos, proibição de conselhos não solicitados, comando de teste determinístico `!teste`);
- Resultado: respostas personalizadas, sem alucinação de dados financeiros e sem quebrar o front-end (que renderiza a resposta como texto puro, não HTML).

### 3. Manipulação nativa do DOM contra XSS
Toda a interface — dashboard, tabela de transações e chat do FinBot — é renderizada com JavaScript vanilla, sem frameworks.

**Solução aplicada:**
- Uso sistemático de `textContent` (em vez de `innerHTML`) para injetar qualquer dado vindo do usuário ou da API (descrições de transação, respostas da IA, mensagens de chat), evitando que uma string maliciosa seja interpretada como HTML/JS;
- Criação de elementos via `document.createElement` + `appendChild`, montando a árvore DOM programaticamente em vez de concatenar strings HTML;
- Nenhuma resposta da IA ou input do usuário é interpolada diretamente em templates de HTML.

### 4. Tratamento de memory leaks e limpeza de estado
Componentes de UI de longa duração (widget de chat, tema, sessão) foram auditados para evitar vazamento de memória e de estado obsoleto:
- O indicador de "digitando..." do FinBot é criado e **removido explicitamente** do DOM a cada resposta (`typingIndicator.remove()`), em vez de acumular elementos órfãos a cada mensagem;
- O histórico do chat é persistido de forma controlada no `localStorage` (`finbot_history`), com limpeza explícita no `logout()` — evitando que dados de sessão de um usuário vazem para o próximo login no mesmo navegador;
- Listeners de eventos (tema, captcha, toggle de senha) são registrados uma única vez em `DOMContentLoaded`, evitando duplicação de handlers em re-renderizações;
- Tokens expirados/inválidos são detectados centralizadamente (`401` → limpeza de `localStorage` + redirecionamento), evitando estado de autenticação "fantasma" no cliente.

---

## ✨ Funcionalidades

- **Autenticação segura** com JWT (login/cadastro), sem depender de cookies cross-site.
- **Dashboard financeiro**: saldo atual, total de receitas e despesas, barra de progresso e gráfico de rosca (por tipo ou por categoria).
- **CRUD completo de transações**: adicionar, editar e excluir receitas/despesas, com categoria, data e valor.
- **Filtros e busca**: por mês, tipo, categoria e texto livre.
- **Exportação em CSV** das transações filtradas.
- **FinBot** — assistente financeiro via IA (Groq / Llama 3.3 70B) que:
  - Responde em texto plano, sem Markdown;
  - Orienta sobre reserva de emergência, renda fixa (Tesouro Selic, CDBs, FGC) e alerta sobre golpes;
  - Tem acesso ao histórico de transações do próprio usuário;
  - Mantém o histórico de conversa salvo no navegador (`localStorage`), sobrevivendo a atualizações de página.
- **Tema claro/escuro** com persistência local.
- **Totalmente responsivo**, com header reorganizado em mobile e tabela com rolagem/cabeçalho fixo.

---

## 🛠️ Tecnologias

**Front-end**
- HTML5, CSS3 (variáveis CSS, Flexbox/Grid) e JavaScript puro (vanilla)
- Hospedado na [Vercel](https://vercel.com)

**Back-end**
- [Node.js](https://nodejs.org) + [Express](https://expressjs.com)
- [MongoDB](https://www.mongodb.com) + [Mongoose](https://mongoosejs.com)
- [JWT](https://jwt.io) (`jsonwebtoken`) para autenticação stateless
- [bcryptjs](https://www.npmjs.com/package/bcryptjs) para hash de senhas
- [Groq API](https://groq.com) (modelo `llama-3.3-70b-versatile`) para o FinBot
- Hospedado no [Render](https://render.com)

---

## 📁 Estrutura do Projeto

```
FinancasFacil/
├── server.js                  # Ponto de entrada da API
├── routes/
│   ├── auth.js                # Login, cadastro e logout
│   └── transactions.js        # CRUD de transações (protegido por JWT)
├── middleware/
│   └── auth.js                # Middleware de verificação do token JWT
├── models/
│   ├── User.js                # Schema do usuário
│   └── Transaction.js         # Schema das transações
├── public/
│   ├── index.html             # Dashboard principal
│   ├── login.html             # Tela de login/cadastro
│   ├── style.css              # Estilos (tema claro/escuro, responsivo)
│   ├── script.js               # Lógica do dashboard, transações e FinBot
│   └── auth.js                 # Lógica de login/cadastro
├── package.json
└── README.md
```

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- Node.js 18+
- Uma instância MongoDB (local ou [MongoDB Atlas](https://www.mongodb.com/atlas))
- Uma chave de API da [Groq](https://console.groq.com)

### 1. Clone o repositório
```bash
git clone https://github.com/gustavodod34-commits/FinancasFacil.git
cd FinancasFacil
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto (veja a tabela completa abaixo):
```env
MONGO_URI=sua_connection_string_do_mongodb
JWT_SECRET=uma_string_longa_e_aleatoria
GROQ_API_KEY=sua_chave_da_groq
PORT=5000
```

### 4. Inicie o servidor
```bash
node server.js
```

O back-end sobe em `http://localhost:5000`. Abra `public/index.html` (ou sirva a pasta `public` com uma extensão como Live Server) para acessar o front-end. Ajuste as URLs de API em `public/script.js` e `public/auth.js` caso não esteja usando as URLs de produção.

---

## 🔑 Variáveis de Ambiente

| Variável       | Obrigatória | Descrição                                                  |
|----------------|:-----------:|--------------------------------------------------------------|
| `MONGO_URI`    | ✅          | String de conexão do cluster MongoDB                          |
| `JWT_SECRET`   | ✅          | Chave secreta usada para assinar/verificar os tokens JWT       |
| `GROQ_API_KEY` | ✅          | Chave de API da Groq, usada pelo FinBot                        |
| `PORT`         | ⬜          | Porta em que o servidor Express roda (padrão: `5000`)          |

---

## 📡 Endpoints da API

### 🔐 Autenticação — `/api/auth`

| Método | Rota        | Descrição                     | Protegida | Corpo da requisição                          |
|--------|-------------|---------------------------------|:---------:|-----------------------------------------------|
| POST   | `/register` | Cria uma nova conta             | Não       | `{ name, email, password }`                    |
| POST   | `/login`    | Autentica e retorna um JWT      | Não       | `{ email, password }`                          |
| POST   | `/logout`   | Encerra a sessão (stateless)    | Não       | —                                               |

### 💰 Transações — `/api/transactions`

| Método | Rota   | Descrição                              | Protegida | Corpo da requisição                                          |
|--------|--------|-------------------------------------------|:---------:|-----------------------------------------------------------------|
| GET    | `/`    | Lista as transações do usuário logado     | Sim       | —                                                                 |
| POST   | `/`    | Cria uma nova transação                    | Sim       | `{ type, description, category, amount, date }`                  |
| PUT    | `/:id` | Atualiza uma transação existente           | Sim       | `{ type, description, category, amount, date }`                  |
| DELETE | `/:id` | Remove uma transação                       | Sim       | —                                                                 |

### 🤖 Chat (FinBot) — `/api/chat`

| Método | Rota | Descrição                                                              | Protegida | Corpo da requisição   |
|--------|------|----------------------------------------------------------------------------|:---------:|--------------------------|
| POST   | `/`  | Envia uma mensagem ao FinBot, com contexto das transações do usuário       | Sim       | `{ message }`            |

> **Observação:** todas as rotas marcadas como "Protegida" exigem o header `Authorization: Bearer <token>`, obtido na resposta do `/api/auth/login`.

---

## ☁️ Deploy

- **Front-end**: Vercel, apontando para a pasta `public`.
- **Back-end**: Render, como Web Service Node.js, com as variáveis de ambiente configuradas em *Environment*.
- O CORS do back-end é restrito à origem do front-end em produção (configurado em `server.js`) — ajuste esse valor caso hospede em outro domínio.

---

## 📄 Licença

Projeto de uso pessoal, sem licença de código aberto associada. Todos os direitos reservados ao autor.
