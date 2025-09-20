import { useEffect, useState } from 'react';
import { useAuth } from './hooks';
import api from './lib/api';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

function AdminPanel() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [form, setForm] = useState({
    name: '',
    category: '',
    price: '',
    quantity: '',
    description: '',
  });
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [restockQuantity, setRestockQuantity] = useState<{ [key: string]: number }>({});
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchSweets();
    }
  }, [user]);

  async function fetchSweets() {
    setLoading(true);
    setError('');
    try {
      const response = await api.getSweets();
      setSweets(response.sweets || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sweets');
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
        description: form.description || undefined,
      };

      if (editId) {
        await api.updateSweet(editId, payload);
      } else {
        await api.createSweet(payload);
      }

      setForm({ name: '', category: '', price: '', quantity: '', description: '' });
      setEditId(null);
      await fetchSweets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    setError('');
    setLoading(true);
    try {
      await api.deleteSweet(id);
      await fetchSweets();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to delete ${name}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleRestock(id: string, sweetName: string) {
    const quantity = restockQuantity[id] || 10;
    setError('');
    setLoading(true);
    try {
      await api.restockSweet(id, { quantity });
      await fetchSweets();
      setRestockQuantity((prev) => ({ ...prev, [id]: 10 })); // Reset to default
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to restock ${sweetName}`);
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(sweet: Sweet) {
    setEditId(sweet.id);
    setForm({
      name: sweet.name,
      category: sweet.category,
      price: sweet.price,
      quantity: sweet.quantity.toString(),
      description: sweet.description || '',
    });
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Access Denied</h2>
        <p className="text-red-600">Please login to access admin features.</p>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Admin Access Required</h2>
        <p className="text-red-600">You need admin privileges to access this area.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Admin Panel</h2>
        <p className="text-gray-600">Manage sweets inventory and pricing</p>
      </div>

      {/* Sweet Form */}
      <form className="mb-8 bg-white border rounded-lg p-6 shadow-sm" onSubmit={handleSubmit}>
        <h3 className="font-semibold text-lg mb-4">{editId ? 'Edit Sweet' : 'Add New Sweet'}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Sweet Name"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Category"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Price ($)"
            step="0.01"
            min="0"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
          <input
            type="number"
            placeholder="Initial Quantity"
            min="0"
            className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={form.quantity}
            onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
            required
          />
        </div>

        <textarea
          placeholder="Description (optional)"
          className="w-full p-3 border rounded-lg mt-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        />

        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            disabled={loading}
          >
            {loading ? 'Processing...' : editId ? 'Update Sweet' : 'Add Sweet'}
          </button>

          {editId && (
            <button
              type="button"
              className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 font-medium"
              onClick={() => {
                setEditId(null);
                setForm({ name: '', category: '', price: '', quantity: '', description: '' });
              }}
            >
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Sweets List */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-lg">Current Inventory</h3>
        </div>

        {loading && sweets.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="mt-2">Loading inventory...</p>
          </div>
        ) : (
          <div className="divide-y">
            {sweets.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No sweets in inventory. Add some above!
              </div>
            ) : (
              sweets.map((sweet) => (
                <div
                  key={sweet.id}
                  className="p-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{sweet.name}</h4>
                    <p className="text-gray-600">{sweet.category}</p>
                    {sweet.description && (
                      <p className="text-sm text-gray-500 mt-1">{sweet.description}</p>
                    )}
                    <div className="flex gap-4 mt-2">
                      <span className="text-lg font-bold text-green-600">${sweet.price}</span>
                      <span
                        className={`text-sm font-medium ${
                          sweet.quantity > 10
                            ? 'text-green-600'
                            : sweet.quantity > 0
                              ? 'text-yellow-600'
                              : 'text-red-600'
                        }`}
                      >
                        Stock: {sweet.quantity}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    {/* Restock Controls */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={restockQuantity[sweet.id] || 10}
                        onChange={(e) =>
                          setRestockQuantity((prev) => ({
                            ...prev,
                            [sweet.id]: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-16 p-1 border rounded text-center"
                      />
                      <button
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm font-medium"
                        onClick={() => handleRestock(sweet.id, sweet.name)}
                        disabled={loading}
                      >
                        Restock
                      </button>
                    </div>

                    {/* Edit/Delete Controls */}
                    <div className="flex gap-2">
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 text-sm font-medium"
                        onClick={() => handleEdit(sweet)}
                        disabled={loading}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm font-medium"
                        onClick={() => handleDelete(sweet.id, sweet.name)}
                        disabled={loading}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPanel;
