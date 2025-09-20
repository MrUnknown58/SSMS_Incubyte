import { useState } from 'react';
import { useAuth } from './hooks';

function AuthRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, role);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="max-w-sm mx-auto p-4 border rounded bg-green-50">
        <h2 className="text-lg font-bold mb-2 text-green-700">Already Registered</h2>
        <p className="text-green-600">You are logged in as {user.email}</p>
        <p className="text-sm text-gray-600">Role: {user.role}</p>
      </div>
    );
  }

  return (
    <form className="max-w-sm mx-auto p-4 border rounded" onSubmit={handleRegister}>
      <h2 className="text-lg font-bold mb-2">Register</h2>
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
        placeholder="Password (min 8 characters)"
        className="w-full p-2 border rounded mb-2"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        minLength={8}
      />
      <select
        className="w-full p-2 border rounded mb-2"
        value={role}
        onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
      >
        <option value="user">User</option>
        <option value="admin">Admin</option>
      </select>
      <button
        type="submit"
        className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
        disabled={loading}
      >
        {loading ? 'Registering...' : 'Register'}
      </button>
      <div className="mt-2 text-xs text-gray-500">Password must be at least 8 characters long</div>
    </form>
  );
}

export default AuthRegister;
