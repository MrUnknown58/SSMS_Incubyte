import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks';
import AuthRegister from './AuthRegister';
import AuthLogin from './AuthLogin';
import SweetsDashboard from './SweetsDashboard';
import AdminPanel from './AdminPanel';

function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100 shadow px-4 py-2 flex items-center justify-between">
        <nav className="flex gap-4">
          <Link to="/" className="font-semibold hover:text-blue-600">
            Dashboard
          </Link>
          {user ? (
            <>
              {user.role === 'admin' && (
                <Link to="/admin" className="font-semibold hover:text-blue-600">
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="font-semibold hover:text-red-600 transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/auth" className="font-semibold hover:text-blue-600">
              Login
            </Link>
          )}
        </nav>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-neutral-600">
              Welcome, {user.email} ({user.role})
            </span>
          )}
          <span className="text-xs text-neutral-500">Sweet Shop Management System</span>
        </div>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <footer className="bg-neutral-100 text-center py-2 text-xs text-neutral-500">
        © 2025 Sweet Shop - Stage 8 & 9 Complete
      </footer>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4">Please Login</h2>
        <p className="text-gray-600 mb-4">You need to login to access the dashboard.</p>
        <Link
          to="/auth"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return <SweetsDashboard />;
}

function Auth() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4 text-green-700">Already Logged In</h2>
        <p className="text-green-600 mb-4">Welcome back, {user.email}!</p>
        <Link
          to="/"
          className="inline-block bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center mb-4">
        <h1 className="text-2xl font-bold mb-2">Sweet Shop Authentication</h1>
        <p className="text-gray-600">Register a new account or login to continue</p>
      </div>
      <AuthRegister />
      <AuthLogin />
    </div>
  );
}

function Admin() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Access Denied</h2>
        <p className="text-red-600 mb-4">Please login to access admin features.</p>
        <Link
          to="/auth"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-md mx-auto text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-700">Admin Access Required</h2>
        <p className="text-red-600 mb-4">You need admin privileges to access this area.</p>
        <Link
          to="/"
          className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go to Dashboard
        </Link>
      </div>
    );
  }

  return <AdminPanel />;
}

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/register" element={<AuthRegister />} />
        <Route path="/auth/login" element={<AuthLogin />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </Layout>
  );
}

export default App;
