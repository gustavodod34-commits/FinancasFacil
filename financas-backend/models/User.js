const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true // Garante que não existam dois usuários com o mesmo e-mail
  },
  password: { 
    type: String, 
    required: true 
  }
}, { timestamps: true }); // Guarda automaticamente a data de criação do usuário

module.exports = mongoose.model('User', userSchema);