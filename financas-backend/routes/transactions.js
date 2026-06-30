const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth'); // Importa o middleware de proteção

// ── 1. BUSCAR APENAS AS TRANSAÇÕES DO USUÁRIO LOGADO (GET) ──────────────────
router.get('/', auth, async (req, res) => {
  try {
    // Busca no banco filtrando estritamente pelo ID do usuário extraído do token
    const transactions = await Transaction.find({ user: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao buscar transações.' });
  }
});

// ── 2. SALVAR UMA NOVA TRANSAÇÃO ATRELADA AO USUÁRIO (POST) ─────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { type, description, category, amount, date } = req.body;

    const newTransaction = new Transaction({
      user: req.user.id, // Amarra a transação ao usuário logado automaticamente
      type,
      description,
      category,
      amount,
      date
    });

    const savedTransaction = await newTransaction.save();
    res.status(201).json(savedTransaction);
  } catch (error) {
    console.error(error);
    res.status(400).json({ message: 'Erro ao salvar transação. Verifique os dados.' });
  }
});

// ── 3. ATUALIZAR UMA TRANSAÇÃO (PUT) ────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { type, description, category, amount, date } = req.body;

    // Filtra pelo ID da transação E pelo ID do usuário (Garantia de segurança máxima)
    const updatedTransaction = await Transaction.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { type, description, category, amount, date },
      { new: true } // Retorna a transação já modificada de volta para o frontend
    );

    if (!updatedTransaction) {
      return res.status(404).json({ message: 'Transação não encontrada ou acesso negado.' });
    }

    res.json(updatedTransaction);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao atualizar transação.' });
  }
});

// ── 4. DELETAR UMA TRANSAÇÃO (DELETE) ───────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    // Só deleta se a transação bater com o ID fornecido E pertencer a quem enviou a requisição
    const deletedTransaction = await Transaction.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id
    });

    if (!deletedTransaction) {
      return res.status(404).json({ message: 'Transação não encontrada ou acesso negado.' });
    }

    res.json({ message: 'Transação removida com sucesso!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao remover transação.' });
  }
});

module.exports = router;