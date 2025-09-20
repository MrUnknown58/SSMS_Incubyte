import { useState } from 'react';
import { useAuth } from './hooks';

function AuthLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="max-w-sm mx-auto p-4 border rounded bg-green-50">
        <h2 className="text-lg font-bold mb-2 text-green-700">Already Logged In</h2>
        <p className="text-green-600">Welcome, {user.email}!</p>
        <p className="text-sm text-gray-600">Role: {user.role}</p>
      </div>
    );
  }

  return (
    <form className="max-w-sm mx-auto p-4 border rounded" onSubmit={handleLogin}>
      <h2 className="text-lg font-bold mb-2">Login</h2>
      {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
      <input
        type="email"
        placeholder="Email"
        className="w-full p-2 border rounded mb-2"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Password"
        className="w-full p-2 border rounded mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      <button
        type="submit"
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      <div className="mt-2 text-sm text-gray-500">Demo: admin@example.com / password123</div>
    </form>
  );
}

export default AuthLogin;
