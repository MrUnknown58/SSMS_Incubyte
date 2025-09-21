import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './hooks';
import { ThemeProvider } from 'next-themes';
import Navbar from '@/components/layout/Navbar';
import Container from '@/components/layout/Container';
import { Toaster } from './components/ui/sonner';
import AuthRegister from './AuthRegister';
import AuthLogin from './AuthLogin';
import SweetsDashboard from './SweetsDashboard';
import AdminPanel from './AdminPanel';

function Layout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100">
        <div className="text-center animate-in fade-in-50 duration-500">
          <div className="relative mb-4">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
            <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border-4 border-blue-300 opacity-30"></div>
          </div>
          <p className="text-xl text-gray-700 font-medium animate-pulse">Loading Sweet Shop...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-1 py-6">
        <Container>{children}</Container>
      </main>
      <footer className="bg-white border-t border-gray-200 py-6">
        <Container>
          <div className="text-center">
            <p className="text-sm text-gray-600">
              © 2025 Sweet Shop Management System -
              {/* <span className="font-medium text-blue-600"> UI Refactor In Progress</span> */}
            </p>
          </div>
        </Container>
      </footer>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center animate-in fade-in-50 duration-500">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-8 shadow-lg border-2 border-blue-200">
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
          <h2 className="text-2xl font-bold mb-4 text-gray-800">Welcome to Sweet Shop</h2>
          <p className="text-gray-600 mb-6 leading-relaxed">
            You need to login to access your personalized dashboard and start shopping for delicious
            sweets.
          </p>
          <Link
            to="/auth"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span>Get Started</span>
          </Link>
        </div>
      </div>
    );
  }

  return <SweetsDashboard />;
}

function Auth() {
  const { user } = useAuth();

  if (user) {
    return (
      <div className="max-w-md mx-auto text-center animate-in fade-in-50 duration-500">
        <div className="bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-200 rounded-2xl p-8 shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-green-800">Already Logged In</h2>
          <p className="text-green-700 mb-6 leading-relaxed">
            Welcome back, {user.email}! You're already authenticated.
          </p>
          <Link
            to="/"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-600 hover:to-teal-700 transition-all duration-200 transform hover:scale-105 shadow-lg font-semibold"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
              />
            </svg>
            <span>Go to Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12 animate-in fade-in-50 duration-500">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Sweet Shop Authentication
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          Create your account or sign in to start exploring our delicious collection
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="animate-in slide-in-from-left-5 duration-700">
          <AuthRegister />
        </div>
        <div className="animate-in slide-in-from-right-5 duration-700">
          <AuthLogin />
        </div>
      </div>
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

  if (!user.isAdmin) {
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
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth/register" element={<AuthRegister />} />
          <Route path="/auth/login" element={<AuthLogin />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Layout>
      <Toaster />
    </ThemeProvider>
  );
}

export default App;
