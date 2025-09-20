import { useEffect, useState } from 'react';
import { useAuth } from './hooks';
import { toast } from 'sonner';
import api from './lib/api';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: string;
  quantity: number;
  description?: string | null;
  isActive?: boolean;
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
    if (user?.isAdmin) {
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
        toast.success('Sweet updated successfully!', {
          description: `${form.name} has been updated in your inventory.`,
        });
      } else {
        await api.createSweet(payload);
        toast.success('Sweet added successfully!', {
          description: `${form.name} has been added to your inventory.`,
        });
      }

      setForm({ name: '', category: '', price: '', quantity: '', description: '' });
      setEditId(null);
      await fetchSweets();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Operation failed';
      setError(errorMessage);
      toast.error('Operation failed', {
        description: errorMessage,
      });
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
      toast.success('Sweet deleted successfully!', {
        description: `${name} has been removed from your inventory.`,
      });
      await fetchSweets();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to delete ${name}`;
      setError(errorMessage);
      toast.error('Delete failed', {
        description: errorMessage,
      });
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
      toast.success('Restock completed!', {
        description: `Added ${quantity} units to ${sweetName}.`,
      });
      await fetchSweets();
      setRestockQuantity((prev) => ({ ...prev, [id]: 10 })); // Reset to default
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : `Failed to restock ${sweetName}`;
      setError(errorMessage);
      toast.error('Restock failed', {
        description: errorMessage,
      });
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
      <div className="max-w-md mx-auto text-center animate-in fade-in-50 duration-500">
        <div className="bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl p-8 shadow-lg border-2 border-red-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-red-800">Authentication Required</h2>
          <p className="text-red-700 leading-relaxed">Please login to access admin features.</p>
        </div>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center animate-in fade-in-50 duration-500">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 rounded-2xl p-8 shadow-lg border-2 border-yellow-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-yellow-800">Admin Access Required</h2>
          <p className="text-yellow-700 leading-relaxed">
            You need admin privileges to access this area.
          </p>
          <div className="mt-4 px-4 py-2 bg-yellow-200 text-yellow-800 rounded-lg inline-block font-medium">
            Current Role: {user.isAdmin ? '👑 Admin' : '👤 User'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in-50 duration-700">
      <div className="mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">👑 Admin Dashboard</h1>
              <p className="text-purple-100 text-lg">
                Manage your sweet shop inventory and pricing
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sweet Form */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 mb-8 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center">
            <svg
              className="w-6 h-6 mr-2 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  editId
                    ? 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                    : 'M12 6v6m0 0v6m0-6h6m-6 0H6'
                }
              />
            </svg>
            {editId ? 'Edit Sweet' : 'Add New Sweet'}
          </h3>
          <p className="text-gray-600 mt-1">
            {editId ? 'Update sweet information' : 'Create a new sweet for your inventory'}
          </p>
        </div>

        <form className="p-8" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Sweet Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Chocolate Truffles"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Category *</label>
                <input
                  type="text"
                  placeholder="e.g., Chocolates, Gummies, Hard Candy"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price ($) *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-gray-500 text-lg">$</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className="w-full pl-8 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                    value={form.price}
                    onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Initial Quantity *
                </label>
                <input
                  type="number"
                  placeholder="0"
                  min="0"
                  className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              placeholder="Describe your sweet... ingredients, taste, special features"
              className="w-full p-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={editId ? 'M5 13l4 4L19 7' : 'M12 6v6m0 0v6m0-6h6m-6 0H6'}
                    />
                  </svg>
                  {editId ? 'Update Sweet' : 'Add Sweet'}
                </span>
              )}
            </button>

            {editId && (
              <button
                type="button"
                className="flex-1 sm:flex-none bg-gray-500 text-white px-8 py-4 rounded-xl hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-200 font-semibold transition-all duration-200"
                onClick={() => {
                  setEditId(null);
                  setForm({ name: '', category: '', price: '', quantity: '', description: '' });
                }}
              >
                <span className="flex items-center justify-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  Cancel
                </span>
              </button>
            )}
          </div>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-xl mb-8 animate-in slide-in-from-left-5 duration-300 shadow-sm">
          <div className="flex items-center">
            <svg className="w-6 h-6 mr-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-semibold">{error}</span>
          </div>
        </div>
      )}

      {/* Sweets List */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 py-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                <svg
                  className="w-6 h-6 mr-2 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                Current Inventory
              </h3>
              <p className="text-gray-600 mt-1">Manage your sweet collection</p>
            </div>
            <div className="hidden sm:block px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium">
              {sweets.length} {sweets.length === 1 ? 'Sweet' : 'Sweets'}
            </div>
          </div>
        </div>

        {loading && sweets.length === 0 ? (
          <div className="text-center py-16">
            <div className="relative">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
              <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-300 opacity-30"></div>
            </div>
            <p className="mt-4 text-lg text-gray-600 animate-pulse">Loading inventory...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {sweets.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No sweets in inventory</h3>
                <p className="text-gray-500">Add some delicious sweets using the form above!</p>
              </div>
            ) : (
              sweets.map((sweet, index) => (
                <div
                  key={sweet.id}
                  className="p-8 hover:bg-gray-50 transition-all duration-200 animate-in fade-in-50 slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-800 mb-2">{sweet.name}</h4>
                          <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-3">
                            {sweet.category}
                          </div>
                        </div>
                        <div
                          className={`px-4 py-2 rounded-full text-sm font-bold ${
                            sweet.quantity > 10
                              ? 'bg-green-100 text-green-700'
                              : sweet.quantity > 0
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {sweet.quantity > 0 ? `${sweet.quantity} in stock` : 'Out of stock'}
                        </div>
                      </div>
                      {sweet.description && (
                        <p className="text-gray-600 mb-4 leading-relaxed">{sweet.description}</p>
                      )}
                      <div className="flex items-center space-x-6">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-5 h-5 text-green-600"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.51-1.31c-.562-.649-1.413-1.076-2.353-1.253V5z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-2xl font-bold text-green-600">${sweet.price}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-5 h-5 text-gray-400"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-sm text-gray-500">
                            Added {new Date(sweet.createdAt || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row xl:flex-col gap-4 xl:w-80">
                      {/* Restock Controls */}
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <label className="block text-sm font-semibold text-green-700 mb-2">
                          Restock Quantity
                        </label>
                        <div className="flex items-center space-x-3">
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
                            className="w-20 p-2 border-2 border-green-200 rounded-lg text-center focus:outline-none focus:border-green-500"
                          />
                          <button
                            className="flex-1 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-200 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                            onClick={() => handleRestock(sweet.id, sweet.name)}
                            disabled={loading}
                          >
                            <span className="flex items-center justify-center">
                              <svg
                                className="w-4 h-4 mr-1"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              Restock
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* Edit/Delete Controls */}
                      <div className="flex space-x-3">
                        <button
                          className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-xl hover:bg-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-200 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                          onClick={() => handleEdit(sweet)}
                          disabled={loading}
                        >
                          <span className="flex items-center justify-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                              />
                            </svg>
                            Edit
                          </span>
                        </button>
                        <button
                          className="flex-1 bg-red-500 text-white px-4 py-3 rounded-xl hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                          onClick={() => handleDelete(sweet.id, sweet.name)}
                          disabled={loading}
                        >
                          <span className="flex items-center justify-center">
                            <svg
                              className="w-4 h-4 mr-1"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                            Delete
                          </span>
                        </button>
                      </div>
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
