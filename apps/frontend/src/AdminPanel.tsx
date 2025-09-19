import { useEffect, useState } from 'react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

function AdminPanel() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [form, setForm] = useState({ name: '', category: '', price: '', quantity: '' });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSweets();
  }, []);

  async function fetchSweets() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/sweets');
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch sweets');
      setSweets(data.sweets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: form.name,
        category: form.category,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity, 10),
      };
      const url = editId ? `/api/sweets/${editId}` : '/api/sweets';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Operation failed');
      setForm({ name: '', category: '', price: '', quantity: '' });
      setEditId(null);
      fetchSweets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/sweets/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed');
      fetchSweets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestock(id: string) {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/sweets/${id}/restock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 10 }), // Example restock value
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Restock failed');
      fetchSweets();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(sweet: Sweet) {
    setEditId(sweet.id);
    setForm({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price.toString(),
      quantity: sweet.quantity.toString(),
    });
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin Panel</h2>
      <form className="mb-4 border p-4 rounded" onSubmit={handleSubmit}>
        <h3 className="font-semibold mb-2">{editId ? 'Edit Sweet' : 'Add Sweet'}</h3>
        <input
          type="text"
          placeholder="Name"
          className="input mb-2 w-full"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />
        <input
          type="text"
          placeholder="Category"
          className="input mb-2 w-full"
          value={form.category}
          onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Price"
          className="input mb-2 w-full"
          value={form.price}
          onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
          required
        />
        <input
          type="number"
          placeholder="Quantity"
          className="input mb-2 w-full"
          value={form.quantity}
          onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
          required
        />
        <button type="submit" className="btn w-full" disabled={loading}>
          {editId ? 'Update Sweet' : 'Add Sweet'}
        </button>
        {editId && (
          <button
            type="button"
            className="btn w-full mt-2"
            onClick={() => {
              setEditId(null);
              setForm({ name: '', category: '', price: '', quantity: '' });
            }}
          >
            Cancel Edit
          </button>
        )}
      </form>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="grid grid-cols-1 gap-4">
        {sweets.map((sweet) => (
          <div key={sweet.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{sweet.name}</div>
              <div className="text-sm text-neutral-500">{sweet.category}</div>
              <div className="text-sm">${sweet.price.toFixed(2)}</div>
              <div className="text-xs">Stock: {sweet.quantity}</div>
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={() => handleEdit(sweet)}>
                Edit
              </button>
              <button className="btn" onClick={() => handleDelete(sweet.id)}>
                Delete
              </button>
              <button className="btn" onClick={() => handleRestock(sweet.id)}>
                Restock
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AdminPanel;
