import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, UserRound } from 'lucide-react';
import { useAdmin } from '../context/AdminContext';

const API_URL = (import.meta.env.VITE_API_URL as string | undefined) || '/api';

type LoginResponse = {
  token?: string;
  user?: {
    name?: string;
    username?: string;
    role?: string;
  };
  error?: string;
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const { isAuthenticated, isVerifying, login } = useAdmin();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });
      const data = await response.json().catch(() => ({})) as LoginResponse;
      if (!response.ok) throw new Error(data.error || 'No se pudo iniciar sesión.');
      if (!data.token || !data.user) throw new Error('La respuesta de acceso no es válida.');
      if (data.user.role !== 'admin' && data.user.role !== 'editor') {
        throw new Error('Esta ruta es exclusiva para administradores.');
      }

      localStorage.setItem('admin_token', data.token);
      login();
      navigate('/admin/dashboard', { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Ocurrió un error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" aria-label="Verificando sesión" />
      </main>
    );
  }
  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-xl shadow-slate-900/5 sm:p-10">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#0052cc]">
          <ArrowLeft size={17} /> Volver a la tienda
        </Link>
        <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-[#0052cc]">
          <ShieldCheck size={28} />
        </div>
        <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.18em] text-[#348f00]">Acceso privado</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#11264b]">Panel de administración</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">Ingresa tus credenciales de administrador para continuar.</p>

        {error && <p role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}

        <form onSubmit={event => void submit(event)} className="mt-7 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Usuario o correo electrónico</span>
            <span className="relative block">
              <UserRound size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                required
                type="text"
                autoComplete="username"
                value={username}
                onChange={event => setUsername(event.target.value)}
                placeholder="Usuario o correo"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-[#0052cc] focus:ring-4 focus:ring-blue-100"
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Contraseña</span>
            <span className="relative block">
              <LockKeyhole size={18} className="absolute left-3.5 top-3.5 text-slate-400" />
              <input
                required
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Ingresa tu contraseña"
                className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-12 text-sm outline-none transition focus:border-[#0052cc] focus:ring-4 focus:ring-blue-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(value => !value)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center text-slate-400 hover:text-[#0052cc]"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0052cc] px-5 text-sm font-bold text-white shadow-lg shadow-blue-600/15 transition hover:bg-[#003fa8] disabled:cursor-wait disabled:opacity-60"
          >
            {loading ? 'Verificando...' : 'Ingresar al panel'}
            {!loading && <ArrowRight size={18} className="transition group-hover:translate-x-1" />}
          </button>
        </form>
      </section>
    </main>
  );
}
