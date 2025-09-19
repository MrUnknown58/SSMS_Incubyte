import { Routes, Route, Link } from 'react-router-dom';
import AuthRegister from './AuthRegister';
import AuthLogin from './AuthLogin';
import SweetsDashboard from './SweetsDashboard';
import AdminPanel from './AdminPanel';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-neutral-100 shadow px-4 py-2 flex items-center justify-between">
        <nav className="flex gap-4">
          <Link to="/" className="font-semibold">
            Dashboard
          </Link>
          <Link to="/auth" className="font-semibold">
            Auth
          </Link>
          <Link to="/admin" className="font-semibold">
            Admin
          </Link>
        </nav>
        <span className="text-xs text-neutral-500">Sweet Shop Management System</span>
      </header>
      <main className="flex-1 p-4">{children}</main>
      <footer className="bg-neutral-100 text-center py-2 text-xs text-neutral-500">
        © 2025 Sweet Shop
      </footer>
    </div>
  );
}

function Dashboard() {
  return <SweetsDashboard />;
}

function Auth() {
  return (
    <div className="flex flex-col gap-4">
      <AuthRegister />
      <AuthLogin />
    </div>
  );
}

function Admin() {
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
