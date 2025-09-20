import { useEffect, useState } from 'react';
import { useAuth } from './hooks';
import { toast } from 'sonner';
import api from './lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

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

function SweetsDashboard() {
  const [sweets, setSweets] = useState<Sweet[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [purchasingIds, setPurchasingIds] = useState<Set<string>>(new Set());
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
    // Prevent race conditions - don't allow multiple purchases of the same item
    if (purchasingIds.has(id)) {
      toast.warning('Purchase already in progress', {
        description: `Please wait for the current purchase of ${sweetName} to complete.`,
      });
      return;
    }

    setError('');

    // Find the sweet to get current quantity for rollback
    const sweet = sweets.find((s) => s.id === id);
    if (!sweet) {
      toast.error('Purchase failed', {
        description: 'Sweet not found in inventory.',
      });
      return;
    }

    const originalQuantity = sweet.quantity;

    // Prevent purchasing if out of stock
    if (originalQuantity <= 0) {
      toast.error('Out of stock', {
        description: `${sweetName} is currently out of stock.`,
      });
      return;
    }

    // Add to purchasing set to prevent race conditions
    setPurchasingIds((prev) => new Set(prev).add(id));

    // Optimistic update - reduce quantity immediately
    setSweets((sweets) =>
      sweets.map((s) => (s.id === id ? { ...s, quantity: s.quantity - 1 } : s))
    );

    try {
      await api.purchaseSweet(id, { quantity: 1 });

      toast.success('Purchase successful!', {
        description: `You successfully purchased 1 ${sweetName}.`,
      });
    } catch (err: unknown) {
      // Rollback optimistic update on failure
      setSweets((sweets) =>
        sweets.map((s) => (s.id === id ? { ...s, quantity: originalQuantity } : s))
      );

      const errorMessage = err instanceof Error ? err.message : `Failed to purchase ${sweetName}`;
      setError(errorMessage);

      toast.error('Purchase failed', {
        description: errorMessage,
      });
    } finally {
      // Remove from purchasing set
      setPurchasingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center animate-in fade-in-50 duration-500">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-lg border border-blue-200">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Please Login</h2>
          <p className="text-gray-600 leading-relaxed">
            You need to be logged in to view the sweets dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in-50 duration-700">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
          Sweets Dashboard
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Discover and purchase our delicious collection of sweets
        </p>
      </div>

      <div className="relative mb-8 max-w-md mx-auto">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="h-5 w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <Input
          type="text"
          placeholder="Search sweets by name..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="relative">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-12 w-12 border-4 border-blue-300 opacity-30"></div>
          </div>
          <p className="mt-4 text-lg text-gray-600 animate-pulse">Loading delicious sweets...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-6 py-4 rounded-r-lg mb-6 animate-in slide-in-from-left-5 duration-300">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {sweets.filter((s) => s.isActive !== false).length === 0 && !loading ? (
          <div className="col-span-full text-center py-16">
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
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No sweets found</h3>
            <p className="text-gray-500">
              {search
                ? 'Try a different search term or browse all sweets.'
                : 'Check back later for new arrivals!'}
            </p>
          </div>
        ) : null}

        {sweets
          .filter((s) => s.isActive !== false)
          .map((sweet, index) => (
            <div
              key={sweet.id}
              className="group bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in-50 slide-in-from-bottom-4 flex flex-col justify-between"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-xl text-gray-800 group-hover:text-blue-600 transition-colors">
                    {sweet.name}
                  </h3>
                  <Badge
                    variant={
                      sweet.quantity > 10
                        ? 'success'
                        : sweet.quantity > 0
                          ? 'warning'
                          : 'destructive'
                    }
                  >
                    {sweet.quantity > 0 ? `${sweet.quantity} left` : 'Out of stock'}
                  </Badge>
                </div>
                <div className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full mb-3">
                  {sweet.category}
                </div>
                {sweet.description && (
                  <p className="text-gray-600 mb-4 leading-relaxed">{sweet.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-green-600">${sweet.price}</span>
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5zM10 12a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm text-gray-500">In stock</span>
                  </div>
                </div>
              </div>

              <Button
                className="w-full py-3 px-6 rounded-xl"
                disabled={sweet.quantity === 0 || purchasingIds.has(sweet.id)}
                onClick={() => handlePurchase(sweet.id, sweet.name)}
              >
                {purchasingIds.has(sweet.id) ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="w-5 h-5 mr-2 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : sweet.quantity === 0 ? (
                  <span className="flex items-center justify-center">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Out of Stock
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
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5-5M7 13l-2.5 5M17 21a2 2 0 100-4 2 2 0 000 4zm-8 0a2 2 0 100-4 2 2 0 000 4z"
                      />
                    </svg>
                    Purchase (1 item)
                  </span>
                )}
              </Button>
            </div>
          ))}
      </div>
    </div>
  );
}

export default SweetsDashboard;
