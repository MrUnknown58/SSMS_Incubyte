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

function SweetsDashboard() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    async function fetchSweets() {
      if (!user) return;

      setLoading(true);
      setError('');
      try {
        let response;
        if (search) {
          response = await api.searchSweets({ name: search });
        } else {
          response = await api.getSweets();
        }
        setSweets(response.sweets || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch sweets');
      } finally {
        setLoading(false);
      }
    }
    fetchSweets();
  }, [search, user]);

  async function handlePurchase(id: string, sweetName: string) {
    setError('');
    try {
      await api.purchaseSweet(id, { quantity: 1 });
      // Refresh sweets list
      setSweets((sweets) =>
        sweets.map((s) => (s.id === id ? { ...s, quantity: s.quantity - 1 } : s))
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : `Failed to purchase ${sweetName}`);
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Please Login</h2>
        <p className="text-gray-600">You need to be logged in to view the sweets dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Sweets Dashboard</h2>
        <p className="text-gray-600">Browse and purchase delicious sweets</p>
      </div>

      <input
        type="text"
        placeholder="Search sweets by name..."
        className="w-full p-3 border rounded-lg mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2">Loading sweets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sweets.length === 0 && !loading ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No sweets found. {search ? 'Try a different search term.' : ''}
          </div>
        ) : null}

        {sweets.map((sweet) => (
          <div
            key={sweet.id}
            className="border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-1">{sweet.name}</h3>
              <p className="text-sm text-gray-500 mb-2">{sweet.category}</p>
              {sweet.description && (
                <p className="text-sm text-gray-600 mb-2">{sweet.description}</p>
              )}
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">${sweet.price}</span>
                <span className="text-sm text-gray-500">Stock: {sweet.quantity}</span>
              </div>
            </div>

            <button
              className={`w-full py-2 px-4 rounded font-medium transition-colors ${
                sweet.quantity === 0
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={sweet.quantity === 0}
              onClick={() => handlePurchase(sweet.id, sweet.name)}
            >
              {sweet.quantity === 0 ? 'Out of Stock' : 'Purchase (1 item)'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SweetsDashboard;
