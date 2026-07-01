const jwt = require('jsonwebtoken');

// ==========================================
// MIDDLEWARE DE AUTENTICAÇÃO — JWT (Bearer Token)
// ==========================================
// Antes: lia o token de req.cookies.token (cookie SameSite=None),
// que é bloqueado por Safari/Chrome mobile em contexto cross-site.
// Agora: lê do header "Authorization: Bearer <token>", que não sofre
// nenhuma restrição de cookie do navegador.

module.exports = function auth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Acesso negado. Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Mantém o mesmo formato que suas rotas de transactions já esperam: req.user.id
    req.user = { id: decoded.id };
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Sessão expirada ou token inválido. Faça login novamente.' });
  }
};