import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks';
import ThemeToggle from '@/components/ThemeToggle';
import Container from './Container';

export default function Navbar() {
  const { user, logout } = useAuth();
  return (
    <header className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <Container>
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">SS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Sweet Shop
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">Management System</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 font-medium"
            >
              <span>Dashboard</span>
            </Link>
            {user?.isAdmin && (
              <Link
                to="/admin"
                className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-700 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 font-medium"
              >
                <span>Admin Panel</span>
              </Link>
            )}
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            {user ? (
              <button
                onClick={logout}
                className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/auth"
                className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </Container>
    </header>
  );
}
