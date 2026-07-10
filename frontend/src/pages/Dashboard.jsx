import { useEffect, useState } from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import api from '../api';
import TransactionForm from '../components/TransactionForm.jsx';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler);

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
}

function pad(n) { return String(n).padStart(2, '0'); }

function getMonthRange(month, year) {
  const start = `${year}-${pad(month + 1)}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const end = `${year}-${pad(month + 1)}-${pad(lastDay)}`;
  return { start, end };
}

export default function Dashboard() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [data, setData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quickType, setQuickType] = useState(null);

  function loadSummary() {
    setLoading(true);
    const { start, end } = getMonthRange(selectedMonth, selectedYear);
    api.get('/dashboard/summary', { params: { start_date: start, end_date: end } })
      .then((res) => setData(res.data))
      .catch(() => setError('Não foi possível carregar o resumo financeiro.'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    loadSummary();
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories));
  }, []);

  const years = [];
  for (let y = now.getFullYear(); y >= now.getFullYear() - 4; y--) years.push(y);

  if (loading) return <div className="loading-text">Carregando seu resumo financeiro...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  const { summary, expenses_by_category, monthly_trend } = data;
  const margemBruta = summary.total_receitas > 0 ? (summary.saldo / summary.total_receitas) * 100 : 0;
  const margem = Math.max(Math.min(margemBruta, 999), -999);
  const saudeCaixaReal = summary.total_receitas > 0
  ? (summary.total_despesas / summary.total_receitas) * 100
  : (summary.total_despesas > 0 ? 999 : 0);
const saudeCaixa = Math.min(saudeCaixaReal, 100);
const corSaude = saudeCaixaReal < 60 ? 'var(--brand)' : saudeCaixaReal < 100 ? 'var(--amber)' : 'var(--expense)';
const statusSaude = saudeCaixaReal < 60
  ? 'Saudável esta semana'
  : saudeCaixaReal < 100
    ? 'Atenção ao ritmo de gastos'
    : `Estourou o orçamento: gastou ${saudeCaixaReal.toFixed(0)}% da receita`;
  const circunferencia = 2 * Math.PI * 40;
  const arcoPreenchido = (saudeCaixa / 100) * circunferencia;

  const monthLabels = monthly_trend.map((m) => {
    const [year, month] = m.month.split('-');
    return new Date(year, month - 1).toLocaleDateString('pt-BR', { month: 'short' });
  });

  const barData = {
    labels: monthLabels,
    datasets: [
      { label: 'Receitas', data: monthly_trend.map((m) => m.receitas), backgroundColor: '#D4AF37', borderRadius: 4 },
      { label: 'Despesas', data: monthly_trend.map((m) => m.despesas), backgroundColor: '#C44557', borderRadius: 4 },
    ],
  };

  const sparklineData = {
    labels: monthLabels,
    datasets: [{
      data: monthly_trend.map((m) => m.receitas - m.despesas),
      borderColor: '#D4AF37', borderWidth: 2, pointRadius: 0, fill: true,
      backgroundColor: 'rgba(212,175,55,0.10)', tension: 0.35,
    }],
  };

  const doughnutData = {
    labels: expenses_by_category.map((c) => c.name),
    datasets: [{
      data: expenses_by_category.map((c) => c.total),
      backgroundColor: expenses_by_category.map((c) => c.color),
      borderWidth: 0,
    }],
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Resumo do caixa</h1>
          <div className="subtitle">{MONTH_NAMES[selectedMonth]} de {selectedYear}</div>
        </div>
        <div className="page-header-actions">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            style={{ background: 'var(--input-bg)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', fontSize: 13.5 }}
          >
            {MONTH_NAMES.map((name, idx) => <option key={name} value={idx}>{name}</option>)}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            style={{ background: 'var(--input-bg)', color: 'var(--ink)', border: '1px solid var(--border)', borderRadius: 7, padding: '9px 12px', fontSize: 13.5 }}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button className="btn btn-primary" onClick={() => setQuickType('receita')}>
            <i className="ti ti-plus"></i> Venda
          </button>
          <button className="btn btn-secondary" onClick={() => setQuickType('despesa')}>
            <i className="ti ti-plus"></i> Despesa
          </button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="kpi-card receita">
          <div className="kpi-label"><i className="ti ti-trending-up"></i> Receita</div>
          <div className="kpi-value">{formatCurrency(summary.total_receitas)}</div>
        </div>
        <div className="kpi-card despesa">
          <div className="kpi-label"><i className="ti ti-trending-down"></i> Despesa</div>
          <div className="kpi-value">{formatCurrency(summary.total_despesas)}</div>
        </div>
        <div className="kpi-card resultado">
          <div className="kpi-label"><i className="ti ti-scale"></i> Resultado</div>
          <div className="kpi-value">{formatCurrency(summary.saldo)}</div>
        </div>
        <div className="kpi-card margem">
          <div className="kpi-label"><i className="ti ti-percentage"></i> Margem</div>
          <div className="kpi-value">{margem.toFixed(1)}%</div>
        </div>
      </div>

      <div className="charts-grid" style={{ marginBottom: 14 }}>
        <div className="hero-panel">
          <div className="hero-label">saldo do período</div>
          <div className="hero-value">{formatCurrency(summary.saldo)}</div>
          <div style={{ height: 60, marginTop: 6 }}>
            {monthly_trend.length > 0 ? (
              <Line data={sparklineData} options={{
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: { enabled: false } },
                scales: { x: { display: false }, y: { display: false } },
              }} />
            ) : (
              <div className="empty-state"><p>Ainda sem histórico suficiente.</p></div>
            )}
          </div>
        </div>

        <div className="panel health-panel">
          <div className="panel-header" style={{ alignSelf: 'flex-start', marginBottom: 6 }}>
            <h2><i className="ti ti-heartbeat"></i> Saúde do caixa</h2>
          </div>
          <div className="health-ring-wrap">
            <svg width="110" height="110" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" fill="none" stroke="var(--input-bg)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="40" fill="none" stroke={corSaude} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${arcoPreenchido} ${circunferencia}`}
                transform="rotate(-90 50 50)"
              />
            </svg>
            <div className="health-ring-value">
              {saudeCaixa.toFixed(0)}%
              <div className="health-ring-sublabel">desp./receita</div>
            </div>
          </div>
          <div className="health-status">{statusSaude}</div>
        </div>
      </div>

      <div className="charts-grid">
        <div className="panel">
          <div className="panel-header"><h2><i className="ti ti-chart-bar"></i> Receitas x despesas — últimos meses</h2></div>
          {monthly_trend.length === 0 ? (
            <div className="empty-state"><h3>Sem dados ainda</h3><p>Adicione transações para ver a evolução.</p></div>
          ) : (
            <Bar data={barData} options={{
              responsive: true,
              plugins: { legend: { position: 'bottom' } },
              scales: { y: { ticks: { font: { family: 'JetBrains Mono', size: 11 } } } },
            }} />
          )}
        </div>

        <div className="panel">
          <div className="panel-header"><h2><i className="ti ti-chart-donut"></i> Despesas por categoria</h2></div>
          {expenses_by_category.length === 0 ? (
            <div className="empty-state"><h3>Sem despesas no período</h3></div>
          ) : (
            <Doughnut data={doughnutData} options={{
              responsive: true,
              plugins: {
                legend: {
                  position: 'right',
                  labels: { boxWidth: 10, font: { size: 11 }, color: '#8B92A8', padding: 12 },
                },
              },
            }} />
          )}
        </div>
      </div>

      {quickType && (
        <TransactionForm
          transaction={{ type: quickType }}
          categories={categories}
          onClose={() => setQuickType(null)}
          onSaved={() => { setQuickType(null); loadSummary(); }}
        />
      )}
    </div>
  );
}