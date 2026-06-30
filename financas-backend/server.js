// ==========================================
// 1. IMPORTAÇÃO DE BIBLIOTECAS
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Carrega as variáveis do arquivo .env

// ==========================================
// 2. CONFIGURAÇÃO INICIAL DO APP
// ==========================================
const app = express();

app.use(express.json()); 
app.use(cookieParser()); 

app.use(cors({
    origin: 'https://financas-facil-hazel.vercel.app', 
    credentials: true 
}));

// ==========================================
// 3. CONEXÃO COM O BANCO DE DADOS MONGODB
// ==========================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Conectado ao MongoDB com sucesso!'))
  .catch((err) => console.error('❌ Erro ao conectar ao MongoDB:', err));

// ==========================================
// 4. ROTAS
// ==========================================

// Rotas de Autenticação (Usuários)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Finanças protegidas por usuário
const transactionRoutes = require('./routes/transactions');
app.use('/api/transactions', transactionRoutes);

// ── ROTA DO CHATBOT COM GROQ (Alta Velocidade) ───────
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'A mensagem não pode estar vazia.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ message: 'Chave de API do Groq não configurada no servidor.' });
    }

    // Regras de personalidade do FinBot
    const systemInstruction = 
      "Você é o FinBot, o assistente virtual inteligente do sistema FinançasFácil. " +
      "Seu objetivo é ajudar os usuários com dúvidas sobre educação financeira, controle de gastos, " +
      "planejamento e economia doméstica. Seja sempre gentil, encorajador, use emojis moderadamente " +
      "e dê respostas diretas, limpas e estruturadas em tópicos curtos. Recuse responder perguntas " +
      "que não sejam ligadas a finanças ou ao sistema.";

    // Chamada direta para a API do Groq usando o padrão compatível com OpenAI
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Modelo ultra rápido e inteligente do Groq
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: message }
        ],
        temperature: 0.6
      })
    });

    const data = await groqResponse.json();

    // Se o Groq retornar o texto com sucesso
    if (data.choices && data.choices[0].message && data.choices[0].message.content) {
      const aiReply = data.choices[0].message.content;
      return res.json({ reply: aiReply });
    } else {
      console.error('❌ Resposta inesperada do Groq:', data);
      throw new Error('Estrutura de resposta desconhecida do Groq');
    }

  } catch (error) {
    console.error('❌ Erro no processamento do servidor:', error);
    res.status(500).json({ reply: 'Desculpe, tive um pequeno apagão financeiro aqui. Pode repetir?' });
  }
});

// Rota base de teste
app.get('/', (req, res) => {
    res.send('API do FinançasFácil está a correr!');
});

// ==========================================
// 5. INICIANDO O SERVIDOR (Sempre por último)
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});