import { useEffect, useState } from 'react';

interface Sweet {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
}

function SweetsDashboard() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSweets() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/sweets?name=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to fetch sweets');
        setSweets(data.sweets || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchSweets();
  }, [search]);

  async function handlePurchase(id: string) {
    setError('');
    try {
      const res = await fetch(`/api/sweets/${id}/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Purchase failed');
      // Refresh sweets list
      setSweets((sweets) =>
        sweets.map((s) => (s.id === id ? { ...s, quantity: s.quantity - 1 } : s))
      );
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Sweets Dashboard</h2>
      <input
        type="text"
        placeholder="Search sweets by name..."
        className="input mb-4 w-full"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      {loading && <div>Loading sweets...</div>}
      {error && <div className="text-red-500 mb-2">{error}</div>}
      <div className="grid grid-cols-1 gap-4">
        {sweets.length === 0 && !loading ? <div>No sweets found.</div> : null}
        {sweets.map((sweet) => (
          <div key={sweet.id} className="border rounded p-4 flex justify-between items-center">
            <div>
              <div className="font-semibold">{sweet.name}</div>
              <div className="text-sm text-neutral-500">{sweet.category}</div>
              <div className="text-sm">${sweet.price.toFixed(2)}</div>
              <div className="text-xs">Stock: {sweet.quantity}</div>
            </div>
            <button
              className="btn"
              disabled={sweet.quantity === 0}
              onClick={() => handlePurchase(sweet.id)}
            >
              {sweet.quantity === 0 ? 'Out of Stock' : 'Purchase'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SweetsDashboard;
