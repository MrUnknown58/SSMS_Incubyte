import { useState } from 'react';
import { useAuth } from './hooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

function AuthRegister() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, user } = useAuth();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await register(email, password, name, isAdmin);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }

  if (user) {
    return (
      <div className="max-w-md mx-auto animate-in fade-in-50 duration-500 py-8">
        <div className="card p-8 text-center">
          <div
            className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'hsl(230 14% 18%)' }}
          >
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{ color: 'hsl(150 65% 46%)' }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-2 gradient-text">Already Registered</h2>
          <p className="text-gray-600 font-medium">{user.email}</p>
          <div
            className="inline-block px-3 py-1 text-sm rounded-full mt-2 font-medium"
            style={{ background: 'hsl(230 14% 18%)', color: 'hsl(220 9% 62%)' }}
          >
            {user.isAdmin ? '👑 Admin' : '👤 User'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
      <Card className="overflow-hidden bg-white border border-gray-200 rounded-2xl shadow-lg">
        <CardHeader className="text-center">
          <h2 className="text-3xl font-bold gradient-text">Join Us</h2>
          <p className="text-gray-600 mt-2">Create your sweet shop account</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleRegister}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg animate-in slide-in-from-left-5 duration-300">
                <div className="flex items-center">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: 'hsl(0 84% 60%)' }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium text-gray-100">{error}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-gray-700">Email Address</Label>
              <div className="relative">
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
                      d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                    />
                  </svg>
                </div>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  className="pl-10 input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Full Name</Label>
              <div className="relative">
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
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  className="pl-10 input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Password</Label>
              <div className="relative">
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
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  className="pl-10 input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div>
              <Label className="text-gray-700">Account Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={!isAdmin ? 'secondary' : 'ghost'}
                  className={!isAdmin ? 'btn' : ''}
                  onClick={() => setIsAdmin(false)}
                >
                  <div className="text-center w-full">
                    <div className="text-2xl mb-1">👤</div>
                    <div className="font-medium">User</div>
                    <div className="text-xs opacity-75">Browse & Purchase</div>
                  </div>
                </Button>
                <Button
                  type="button"
                  variant={isAdmin ? 'secondary' : 'ghost'}
                  className={isAdmin ? 'btn' : ''}
                  onClick={() => setIsAdmin(true)}
                >
                  <div className="text-center w-full">
                    <div className="text-2xl mb-1">👑</div>
                    <div className="font-medium">Admin</div>
                    <div className="text-xs opacity-75">Manage Inventory</div>
                  </div>
                </Button>
              </div>
            </div>

            <Button type="submit" className="w-full mt-2 btn" disabled={loading}>
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
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </Button>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-sm text-gray-400 text-center">
                🔒 Your information is secure and encrypted
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AuthRegister;
