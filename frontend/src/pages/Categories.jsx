import { useEffect, useState } from 'react';
import api from '../api';

const SUGGESTED_COLORS = ['#0f6b4c', '#B5432A', '#B5842A', '#3D6C86', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', type: 'despesa', color: SUGGESTED_COLORS[0] });
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    api.get('/categories').then((res) => setCategories(res.data.categories)).finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    try {
      await api.post('/categories', form);
      setForm({ name: '', type: 'despesa', color: SUGGESTED_COLORS[0] });
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao criar categoria.');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Remover esta categoria? As transações associadas ficarão sem categoria.')) return;
    await api.delete(`/categories/${id}`);
    load();
  }

  const receitas = categories.filter((c) => c.type === 'receita');
  const despesas = categories.filter((c) => c.type === 'despesa');

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <div className="subtitle">Organize suas receitas e despesas do seu jeito.</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Nova categoria</h2></div>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleAdd}>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Nome</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Delivery, Comissões..." />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="despesa">Despesa</option>
                <option value="receita">Receita</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Cor</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {SUGGESTED_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                  style={{
                    width: 26, height: 26, borderRadius: '50%', background: c,
                    border: form.color === c ? '2px solid var(--ink)' : '2px solid transparent', padding: 0,
                  }} />
              ))}
            </div>
          </div>
          <button type="submit" className="btn btn-primary">Adicionar categoria</button>
        </form>
      </div>

      {loading ? (
        <div className="loading-text">Carregando...</div>
      ) : (
        <div className="charts-grid-even">
          <div className="panel">
            <div className="panel-header"><h2>Receitas ({receitas.length})</h2></div>
            {receitas.map((c) => (
              <div key={c.id} className="transaction-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <span className="category-chip"><span className="category-dot" style={{ background: c.color }} />{c.name}</span>
                {!c.is_default && <button className="icon-btn btn-danger-text" onClick={() => handleDelete(c.id)}>Excluir</button>}
              </div>
            ))}
          </div>
          <div className="panel">
            <div className="panel-header"><h2>Despesas ({despesas.length})</h2></div>
            {despesas.map((c) => (
              <div key={c.id} className="transaction-row" style={{ gridTemplateColumns: '1fr auto' }}>
                <span className="category-chip"><span className="category-dot" style={{ background: c.color }} />{c.name}</span>
                {!c.is_default && <button className="icon-btn btn-danger-text" onClick={() => handleDelete(c.id)}>Excluir</button>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}