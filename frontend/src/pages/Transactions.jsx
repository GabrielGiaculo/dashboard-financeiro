import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import TransactionForm from '../components/TransactionForm.jsx';

const PAYMENT_LABELS = {
  dinheiro: 'Dinheiro', pix: 'Pix', cartao_credito: 'Cartão crédito',
  cartao_debito: 'Cartão débito', boleto: 'Boleto', transferencia: 'Transferência', outro: 'Outro',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}
function formatDate(dateStr) {
  return new Date(dateStr.slice(0, 10) + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ type: '', category_id: '', status: '', search: '' });
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);

  const loadTransactions = useCallback((page = 1) => {
    setLoading(true);
    const params = { page, limit: 15 };
    Object.entries(filters).forEach(([key, value]) => { if (value) params[key] = value; });

    api.get('/transactions', { params })
      .then((res) => {
        setTransactions(res.data.transactions);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    api.get('/categories').then((res) => setCategories(res.data.categories));
  }, []);

  useEffect(() => {
    loadTransactions(1);
  }, [loadTransactions]);

  async function handleDelete(id) {
    if (!window.confirm('Tem certeza que deseja excluir este lançamento?')) return;
    await api.delete(`/transactions/${id}`);
    loadTransactions(pagination.page);
  }

  function handleSaved() {
    setShowForm(false);
    setEditingTransaction(null);
    loadTransactions(pagination.page);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Transações</h1>
          <div className="subtitle">{pagination.total} lançamento(s) encontrado(s)</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <i className="ti ti-plus"></i> Novo lançamento
        </button>
      </div>

      <div className="filters-bar">
        <select value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value })}>
          <option value="">Todos os tipos</option>
          <option value="receita">Receitas</option>
          <option value="despesa">Despesas</option>
        </select>
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Todos os status</option>
          <option value="confirmado">Confirmado</option>
          <option value="pendente">Pendente</option>
        </select>
        <select value={filters.category_id} onChange={(e) => setFilters({ ...filters, category_id: e.target.value })}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input type="text" placeholder="Buscar por descrição..." value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
      </div>

      <div className="panel">
        <div className="transaction-row header">
          <span></span><span>Data</span><span>Descrição</span><span className="tx-category">Categoria</span><span className="tx-payment">Pagamento</span>
          <span style={{ textAlign: 'right' }}>Valor</span><span></span>
        </div>

        {loading ? (
          <div className="loading-text">Carregando...</div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <h3>Nenhum lançamento por aqui</h3>
            <p>Adicione sua primeira receita ou despesa para começar.</p>
          </div>
        ) : (
          transactions.map((t) => (
            <div className="transaction-row" key={t.id}>
              <span className={`tx-icon ${t.type}`}>
                <i className={`ti ${t.type === 'receita' ? 'ti-arrow-narrow-up' : 'ti-arrow-narrow-down'}`}></i>
              </span>
              <span className="mono tx-date" style={{ fontSize: 12.5 }}>{formatDate(t.occurred_at)}</span>
              <div className="tx-description">
                <div>{t.description}</div>
                <span className={`stamp ${t.status}`}>{t.status === 'confirmado' ? 'Confirmado' : 'Pendente'}</span>
              </div>
              <span className="category-chip tx-category">
                {t.category_name && <span className="category-dot" style={{ background: t.category_color }} />}
                {t.category_name || 'Sem categoria'}
              </span>
              <span className="tx-payment" style={{ fontSize: 12.5, color: 'var(--muted)' }}>{PAYMENT_LABELS[t.payment_method]}</span>
              <span className={`row-amount amount tx-amount ${t.type}`}>
                {t.type === 'despesa' ? '-' : '+'}{formatCurrency(t.amount)}
              </span>
              <span className="row-actions tx-actions">
                <button className="icon-btn" onClick={() => setEditingTransaction(t)}>Editar</button>
                <button className="icon-btn btn-danger-text" onClick={() => handleDelete(t.id)}>Excluir</button>
              </span>
            </div>
          ))
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button className="btn btn-secondary" disabled={pagination.page <= 1}
              onClick={() => loadTransactions(pagination.page - 1)}>Anterior</button>
            <span>Página {pagination.page} de {pagination.totalPages}</span>
            <button className="btn btn-secondary" disabled={pagination.page >= pagination.totalPages}
              onClick={() => loadTransactions(pagination.page + 1)}>Próxima</button>
          </div>
        )}
      </div>

      {(showForm || editingTransaction) && (
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingTransaction(null); }}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}