const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  // 🔥 O segredo está aqui: vincula a transação ao ID do usuário do banco
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  description: {
    type: String,
    required: true,
    maxlength: 60
  },
  category: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: String, // Mantendo formato YYYY-MM-DD igual ao seu front
    required: true
  }
}, { timestamps: true }); // Cria campos de "criado em" e "atualizado em" automaticamente

module.exports = mongoose.model('Transaction', TransactionSchema);