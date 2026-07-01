const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Importamos o modelo que acabou de criar!

// ==========================================
// ROTA 1: REGISTAR NOVO UTILIZADOR
// ==========================================
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Verifica se já existe alguém com este e-mail
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'Este e-mail já está registado.' });
    }

    // 2. Criptografa a palavra-passe (o "sal" adiciona aleatoriedade para ficar mais seguro)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Cria e guarda o utilizador no banco de dados com a palavra-passe protegida
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: 'Conta criada com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// ==========================================
// ROTA 2: FAZER LOGIN (ENTRAR)
// ==========================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Procura o utilizador pelo e-mail
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'E-mail ou palavra-passe incorretos.' });
    }

    // 2. Compara a palavra-passe que ele digitou com a criptografada no banco
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'E-mail ou palavra-passe incorretos.' });
    }

    // 3. Tudo certo! Vamos gerar o Token JWT (Bilhete VIP) válido por 7 dias
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // 4. Envia o Token no corpo da resposta (JSON), NÃO em cookie.
    //    Cookies "SameSite=None" cross-site (front na Vercel, back no Render)
    //    são bloqueados/descartados por Safari e Chrome mobile — por isso o
    //    401 no celular. O front agora guarda esse token no localStorage e
    //    manda em "Authorization: Bearer <token>" em toda requisição.
    res.json({
      message: 'Login realizado com sucesso!',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
});

// ==========================================
// ROTA 3: SAIR DA CONTA (LOGOUT)
// ==========================================
router.post('/logout', (req, res) => {
  // Com JWT não há cookie/sessão no servidor para destruir — o front
  // simplesmente apaga o token do localStorage. Mantemos a rota só
  // por compatibilidade.
  res.json({ message: 'Logout realizado com sucesso!' });
});

module.exports = router;