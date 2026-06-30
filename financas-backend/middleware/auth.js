const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  // Como você ativou o cookieParser no server.js, pegamos o token direto daqui
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Faça login primeiro.' });
  }

  try {
    // Valida o token usando a sua chave secreta definida no .env
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Injeta os dados decodificados (que possuem o { id: user._id }) dentro do objeto req
    req.user = decoded; 
    
    next(); // Autoriza a requisição a seguir para a rota correspondente
  } catch (error) {
    console.error('Erro na validação do token:', error);
    return res.status(401).json({ message: 'Sessão expirada ou inválida. Faça login novamente.' });
  }
};