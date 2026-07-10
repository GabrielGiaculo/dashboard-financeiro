const express = require('express');
const db = require('../config/db');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/summary', async (req, res) => {
  const { start_date, end_date } = req.query;

  const period = {
    start: start_date || new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString().slice(0, 10),
    end: end_date || new Date().toISOString().slice(0, 10),
  };

  try {
    const totalsResult = await db.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (WHERE type = 'receita' AND status = 'confirmado'), 0) AS total_receitas,
         COALESCE(SUM(amount) FILTER (WHERE type = 'despesa' AND status = 'confirmado'), 0) AS total_despesas,
         COALESCE(SUM(amount) FILTER (WHERE type = 'receita' AND status = 'pendente'), 0) AS receitas_pendentes,
         COALESCE(SUM(amount) FILTER (WHERE type = 'despesa' AND status = 'pendente'), 0) AS despesas_pendentes,
         COUNT(*) FILTER (WHERE status = 'pendente') AS qtd_pendentes
       FROM transactions
       WHERE user_id = $1 AND occurred_at BETWEEN $2 AND $3`,
      [req.userId, period.start, period.end]
    );
    const totals = totalsResult.rows[0];

    const byCategoryResult = await db.query(
      `SELECT c.name, c.color, SUM(t.amount) AS total
       FROM transactions t
       LEFT JOIN categories c ON c.id = t.category_id
       WHERE t.user_id = $1 AND t.type = 'despesa' AND t.status = 'confirmado'
         AND t.occurred_at BETWEEN $2 AND $3
       GROUP BY c.name, c.color
       ORDER BY total DESC`,
      [req.userId, period.start, period.end]
    );

    const monthlyResult = await db.query(
      `SELECT
         to_char(date_trunc('month', occurred_at), 'YYYY-MM') AS month,
         COALESCE(SUM(amount) FILTER (WHERE type = 'receita' AND status = 'confirmado'), 0) AS receitas,
         COALESCE(SUM(amount) FILTER (WHERE type = 'despesa' AND status = 'confirmado'), 0) AS despesas
       FROM transactions
       WHERE user_id = $1 AND occurred_at >= (CURRENT_DATE - INTERVAL '6 months')
       GROUP BY date_trunc('month', occurred_at)
       ORDER BY date_trunc('month', occurred_at)`,
      [req.userId]
    );

    const totalReceitas = parseFloat(totals.total_receitas);
    const totalDespesas = parseFloat(totals.total_despesas);

    res.json({
      period,
      summary: {
        total_receitas: totalReceitas,
        total_despesas: totalDespesas,
        saldo: totalReceitas - totalDespesas,
        receitas_pendentes: parseFloat(totals.receitas_pendentes),
        despesas_pendentes: parseFloat(totals.despesas_pendentes),
        qtd_pendentes: parseInt(totals.qtd_pendentes, 10),
      },
      expenses_by_category: byCategoryResult.rows.map((r) => ({
        name: r.name || 'Sem categoria',
        color: r.color || '#94a3b8',
        total: parseFloat(r.total),
      })),
      monthly_trend: monthlyResult.rows.map((r) => ({
        month: r.month,
        receitas: parseFloat(r.receitas),
        despesas: parseFloat(r.despesas),
      })),
    });
  } catch (err) {
    console.error('Erro ao gerar resumo do dashboard:', err);
    res.status(500).json({ error: 'Erro ao gerar resumo financeiro.' });
  }
});

module.exports = router;