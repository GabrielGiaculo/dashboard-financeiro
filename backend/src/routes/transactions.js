const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', async (req, res) => {
  const {
    type, category_id, status, start_date, end_date, search,
    page = 1, limit = 20,
  } = req.query;

  const conditions = ['t.user_id = $1'];
  const params = [req.userId];
  let paramIndex = 2;

  if (type) {
    conditions.push(`t.type = $${paramIndex++}`);
    params.push(type);
  }
  if (category_id) {
    conditions.push(`t.category_id = $${paramIndex++}`);
    params.push(category_id);
  }
  if (status) {
    conditions.push(`t.status = $${paramIndex++}`);
    params.push(status);
  }
  if (start_date) {
    conditions.push(`t.occurred_at >= $${paramIndex++}`);
    params.push(start_date);
  }
  if (end_date) {
    conditions.push(`t.occurred_at <= $${paramIndex++}`);
    params.push(end_date);
  }
  if (search) {
    conditions.push(`t.description ILIKE $${paramIndex++}`);
    params.push(`%${search}%`);
  }

  const whereClause = conditions.join(' AND ');
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  try {
    const countResult = await db.query(
      `SELECT COUNT(*) FROM transactions t WHERE ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    const dataParams = [...params, safeLimit, offset];
    const result = await db.query(
      `SELECT t.id, t.type, t.description, t.amount, t.payment_method, t.status,
              t.occurred_at, t.is_recurring, t.notes, t.created_at,
              c.id AS category_id, c.name AS category_name, c.color AS category_color
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE ${whereClause}
       ORDER BY t.occurred_at DESC, t.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      dataParams
    );

    res.json({
      transactions: result.rows,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit) || 1,
      },
    });
  } catch (err) {
    console.error('Erro ao listar transacoes:', err);
    res.status(500).json({ error: 'Erro ao buscar transacoes.' });
  }
});

router.post(
  '/',
  [
    body('type').isIn(['receita', 'despesa']).withMessage('Tipo invalido.'),
    body('description').trim().notEmpty().withMessage('Informe uma descricao.'),
    body('amount').isFloat({ gt: 0 }).withMessage('O valor precisa ser maior que zero.'),
    body('occurred_at').isDate().withMessage('Data invalida.'),
    body('category_id').optional({ nullable: true }).isUUID().withMessage('Categoria invalida.'),
    body('payment_method')
      .optional()
      .isIn(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'boleto', 'transferencia', 'outro']),
    body('status').optional().isIn(['confirmado', 'pendente']),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const {
      type, description, amount, category_id, payment_method,
      status, occurred_at, is_recurring, notes,
    } = req.body;

    try {
      const result = await db.query(
        `INSERT INTO transactions
           (user_id, category_id, type, description, amount, payment_method, status, occurred_at, is_recurring, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          req.userId, category_id || null, type, description, amount,
          payment_method || 'outro', status || 'confirmado', occurred_at,
          !!is_recurring, notes || null,
        ]
      );
      res.status(201).json({ transaction: result.rows[0] });
    } catch (err) {
      console.error('Erro ao criar transacao:', err);
      res.status(500).json({ error: 'Erro ao criar transacao.' });
    }
  }
);

router.put('/:id', async (req, res) => {
  const {
    type, description, amount, category_id, payment_method,
    status, occurred_at, is_recurring, notes,
  } = req.body;

  try {
    const result = await db.query(
      `UPDATE transactions SET
         type = COALESCE($1, type),
         description = COALESCE($2, description),
         amount = COALESCE($3, amount),
         category_id = $4,
         payment_method = COALESCE($5, payment_method),
         status = COALESCE($6, status),
         occurred_at = COALESCE($7, occurred_at),
         is_recurring = COALESCE($8, is_recurring),
         notes = $9,
         updated_at = now()
       WHERE id = $10 AND user_id = $11
       RETURNING *`,
      [
        type, description, amount, category_id || null, payment_method,
        status, occurred_at, is_recurring, notes || null,
        req.params.id, req.userId,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada.' });
    }
    res.json({ transaction: result.rows[0] });
  } catch (err) {
    console.error('Erro ao atualizar transacao:', err);
    res.status(500).json({ error: 'Erro ao atualizar transacao.' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM transactions WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Transacao nao encontrada.' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Erro ao remover transacao:', err);
    res.status(500).json({ error: 'Erro ao remover transacao.' });
  }
});

module.exports = router;