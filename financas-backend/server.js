// ==========================================
// 1. IMPORTAÇÃO DE BIBLIOTECAS
// ==========================================
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config(); // Carrega as variáveis do arquivo .env
// cookie-parser não é mais necessário: a autenticação agora usa JWT
// enviado no header Authorization, não em cookies.

// ==========================================
// 2. CONFIGURAÇÃO INICIAL DO APP
// ==========================================
const app = express();

app.use(express.json());
app.set('trust proxy', 1);
app.use(cors({
    origin: 'https://financas-facil-hazel.vercel.app',
    // "credentials: true" só é necessário para cookies cross-site.
    // Com JWT no header Authorization não precisamos mais disso, mas
    // deixamos habilitado sem custo — não afeta o funcionamento do JWT.
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
    // Regras de personalidade e conhecimento do FinBot
    const systemInstruction = 
      "Você é o FinBot, o assistente virtual do sistema FinançasFácil. " +
      "Siga estas regras estritamente:\n\n" +

      "1. FORMATO: Responda APENAS em texto plano. NUNCA use Markdown. " +
      "Não use asteriscos (*), não use hashtags (#), não use listas numeradas ou com marcadores. " +
      "Organize o texto em parágrafos curtos usando apenas quebras de linha normais (\\n).\n\n" +

      "2. PERSONALIDADE: Seja direto, casual e conciso no dia a dia. Não dê conselhos não solicitados " +
      "fora do tema de investimentos. Responda exatamente o que foi perguntado, sem rodeios e sem palestras.\n\n" +

      "3. GUIA DE INVESTIMENTOS: Quando o usuário perguntar sobre investimentos, onde investir ou como " +
      "começar, seja extremamente prestativo, didático e focado em segurança, seguindo este caminho lógico:\n" +
      "Passo 1 - Reserva de Emergência: explique que antes de qualquer investimento, o usuário precisa " +
      "guardar de 3 a 6 meses de custos fixos em um lugar seguro e com liquidez diária.\n" +
      "Passo 2 - Renda Fixa Segura: apresente o Tesouro Direto (Tesouro Selic) e CDBs de bancos digitais " +
      "que rendem próximo de 100% do CDI. Explique de forma simples o que é o FGC (Fundo Garantidor de " +
      "Créditos) e como ele protege o dinheiro do investidor até o limite garantido por instituição.\n" +
      "Passo 3 - Alerta de Golpes e Riscos: avise para desconfiar de promessas de ganho fácil, esquemas " +
      "de pirâmide e criptomoedas desconhecidas ou sem lastro.\n\n" +

      "4. REGRAS CRÍTICAS DE INVESTIMENTO: Nunca dê ordens de compra direta (como 'compre a ação X'). " +
      "Fale sempre em termos de conceitos e caminhos seguros, como Renda Fixa, e deixe claro que a decisão " +
      "final é sempre do usuário.\n\n" +

      "5. COMANDO DE TESTE: Se a mensagem do usuário for exatamente \"!teste\" (sem mais nada), " +
      "responda ÚNICA e EXCLUSIVAMENTE com a frase: Teste recebido, sistema operante. " +
      "Não adicione nenhuma outra palavra, saudação ou pontuação extra nesse caso.";

      
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