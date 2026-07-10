const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');

const router = express.Router();

const DEFAULT_CATEGORIES = [
  { name: 'Vendas', type: 'receita', color: '#22c55e' },
  { name: 'Servicos prestados', type: 'receita', color: '#0ea5e9' },
  { name: 'Outras receitas', type: 'receita', color: '#a3e635' },
  { name: 'Fornecedores', type: 'despesa', color: '#ef4444' },
  { name: 'Aluguel', type: 'despesa', color: '#f97316' },
  { name: 'Funcionarios', type: 'despesa', color: '#eab308' },
  { name: 'Contas fixas (agua/luz/internet)', type: 'despesa', color: '#8b5cf6' },
  { name: 'Impostos', type: 'despesa', color: '#ec4899' },
  { name: 'Marketing', type: 'despesa', color: '#14b8a6' },
  { name: 'Outras despesas', type: 'despesa', color: '#64748b' },
];

function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Informe seu nome.'),
    body('email').isEmail().withMessage('Email invalido.').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('A senha precisa ter no minimo 6 caracteres.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, businessName, email, password } = req.body;
    const client = await db.pool.connect();

    try {
      const existing = await client.query('SELECT id FROM users WHERE email = $1', [email]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Ja existe uma conta com este email.' });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (name, business_name, email, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, business_name, email, created_at`,
        [name, businessName || null, email, passwordHash]
      );
      const user = userResult.rows[0];

      for (const cat of DEFAULT_CATEGORIES) {
        await client.query(
          `INSERT INTO categories (user_id, name, type, color, is_default)
           VALUES ($1, $2, $3, $4, true)`,
          [user.id, cat.name, cat.type, cat.color]
        );
      }

      await client.query('COMMIT');

      const token = generateToken(user.id);
      res.status(201).json({ token, user });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Erro no registro:', err);
      res.status(500).json({ error: 'Erro ao criar conta. Tente novamente.' });
    } finally {
      client.release();
    }
  }
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalido.').normalizeEmail(),
    body('password').notEmpty().withMessage('Informe a senha.'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;

    try {
      const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
      const user = result.rows[0];

      if (!user) {
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
      }

      const passwordMatches = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatches) {
        return res.status(401).json({ error: 'Email ou senha incorretos.' });
      }

      const token = generateToken(user.id);
      delete user.password_hash;

      res.json({ token, user });
    } catch (err) {
      console.error('Erro no login:', err);
      res.status(500).json({ error: 'Erro ao fazer login. Tente novamente.' });
    }
  }
);

const authMiddleware = require('../middleware/auth');
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, name, business_name, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario nao encontrado.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Erro ao buscar usuario:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

module.exports = router;