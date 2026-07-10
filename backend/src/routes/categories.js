const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, type, color, is_default
       FROM categories
       WHERE user_id = $1
       ORDER BY type, name`,
      [req.userId]
    );
    res.json({ categories: result.rows });
  } catch (err) {
    console.error('Erro ao listar categorias:', err);
    res.status(500).json({ error: 'Erro ao buscar categorias.' });
  }
});

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Informe o nome da categoria.'),
    body('type').isIn(['receita', 'despesa']).withMessage('Tipo invalido.'),
    body('color').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Cor invalida.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, type, color } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO categories (user_id, name, type, color)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, color, is_default`,
        [req.userId, name, type, color || '#6366f1']
      );
      res.status(201).json({ category: result.rows[0] });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Voce ja tem uma categoria com esse nome e tipo.' });
      }
      console.error('Erro ao criar categoria:', err);
      res.status(500).json({ error: 'Erro ao criar categoria.' });
    }
  }
);

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Categoria nao encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover categoria:', err);
    res.status(500).json({ error: 'Erro ao remover categoria.' });
  }
});

module.exports = router;