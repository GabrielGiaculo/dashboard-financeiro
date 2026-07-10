import { useState } from 'react';
import api from '../api';

const PAYMENT_METHODS = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao_credito', label: 'Cartão de crédito' },
  { value: 'cartao_debito', label: 'Cartão de débito' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'outro', label: 'Outro' },
];

export default function TransactionForm({ transaction, categories, onClose, onSaved }) {
  const isEditing = !!transaction;
  const [form, setForm] = useState({
    type: transaction?.type || 'despesa',
    description: transaction?.description || '',
    amount: transaction?.amount || '',
    category_id: transaction?.category_id || '',
    payment_method: transaction?.payment_method || 'pix',
    status: transaction?.status || 'confirmado',
    occurred_at: transaction?.occurred_at?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    notes: transaction?.notes || '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === form.type);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount), category_id: form.category_id || null };
      if (isEditing) {
        await api.put(`/transactions/${transaction.id}`, payload);
      } else {
        await api.post('/transactions', payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao salvar transação.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2>{isEditing ? 'Editar lançamento' : 'Novo lançamento'}</h2>
        {error && <div className="error-banner">{error}</div>}

        <div className="type-toggle">
          <button type="button" className={form.type === 'receita' ? 'active receita' : ''}
            onClick={() => setForm({ ...form, type: 'receita', category_id: '' })}>Receita</button>
          <button type="button" className={form.type === 'despesa' ? 'active despesa' : ''}
            onClick={() => setForm({ ...form, type: 'despesa', category_id: '' })}>Despesa</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Descrição</label>
            <input required value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Ex: Venda balcão, Conta de luz..." />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor (R$)</label>
              <input type="number" step="0.01" min="0.01" required value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0,00" />
            </div>
            <div className="form-group">
              <label>Data</label>
              <input type="date" required value={form.occurred_at}
                onChange={(e) => setForm({ ...form, occurred_at: e.target.value })} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Categoria</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}>
                <option value="">Sem categoria</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Forma de pagamento</label>
              <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })}>
                {PAYMENT_METHODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="confirmado">Confirmado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          <div className="form-group">
            <label>Observações (opcional)</label>
            <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar lançamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}