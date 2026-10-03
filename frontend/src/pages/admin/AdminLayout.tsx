import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell, BarChart3, ExternalLink, FolderOpen, Home, ImageIcon, LogOut, Menu, Package, PanelLeftClose,
  PanelLeftOpen, RefreshCw, Settings, ShieldCheck, ShoppingCart, Star, Tag, Users, Warehouse, type LucideIcon,
} from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { adminAlert } from '../../utils/adminAlerts';
import { LiveStatus } from '../../components/admin/AdminUI';

type NavItem = { to: string; label: string; icon: LucideIcon };

// Cada sección aparece una sola vez: no hay accesos repetidos en otros menús.
const navGroups: { title: string; items: NavItem[] }[] = [
  { title: 'Principal', items: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
    { to: '/admin/pedidos', label: 'Órdenes', icon: ShoppingCart },
    { to: '/admin/reportes', label: 'Reportes', icon: BarChart3 },
  ] },
  { title: 'Catálogo', items: [
    { to: '/admin/productos', label: 'Productos', icon: Package },
    { to: '/admin/inventario', label: 'Inventario', icon: Warehouse },
    { to: '/admin/categorias', label: 'Categorías y marcas', icon: FolderOpen },
    { to: '/admin/medios', label: 'Medios', icon: ImageIcon },
  ] },
  { title: 'Clientes', items: [
    { to: '/admin/clientes', label: 'Clientes', icon: Users },
    { to: '/admin/promociones', label: 'Promociones', icon: Tag },
    { to: '/admin/resenas', label: 'Reseñas', icon: Star },
  ] },
  { title: 'Sistema', items: [
    { to: '/admin/administradores', label: 'Administradores', icon: ShieldCheck },
    { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
  ] },
];

const allNavItems = navGroups.flatMap(group => group.items);

const isActivePath = (pathname: string, to: string) =>
  pathname === to || pathname.startsWith(`${to}/`) ||
  (to === '/admin/configuracion' && pathname === '/admin/ajustes') ||
  (to === '/admin/promociones' && (pathname === '/admin/cupones' || pathname === '/admin/marketing'));

function Logo({ compact }: { compact: boolean }) {
  return <img src="/logo.png" alt="Siscomred" className={`object-contain transition-[width] duration-200 ${compact ? 'h-9 w-12' : 'h-11 w-36'}`} />;
}

export default function AdminLayout() {
  const { logout, orders, products, customers, reviews, isSettingsLoading, isSavingSettings, settingsError, productsError, ordersError, adminRecordsError, refreshAll, isDataLoading } = useAdmin();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => { try { return localStorage.getItem('admin_sidebar_collapsed') === '1'; } catch { return false; } });
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const pendingOrders = orders.filter(order => order.status === 'Pendiente').length;
  const pendingReviews = reviews.filter(review => review.approved === false).length;
  const lowStock = products.filter(product => product.stock <= 5).length;
  const badges: Record<string, { count: number; warn?: boolean }> = {
    '/admin/pedidos': { count: pendingOrders },
    '/admin/resenas': { count: pendingReviews },
    '/admin/inventario': { count: lowStock, warn: true },
  };
  const query = search.trim().toLocaleLowerCase('es');
  const current = allNavItems.find(item => isActivePath(pathname, item.to));

  useEffect(() => { try { localStorage.setItem('admin_sidebar_collapsed', collapsed ? '1' : '0'); } catch { /* preferencia opcional */ } }, [collapsed]);
  // Cierra el menú móvil al cambiar de página (ajuste durante el render, sin efecto).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) { setLastPath(pathname); setMobileOpen(false); }
  useEffect(() => { document.title = `${current?.label ?? 'Panel'} · SISCOMRED Admin`; }, [current]);

  // Avisa de pedidos que llegan desde la tienda mientras el panel está abierto.
  const knownOrderIds = useRef<Set<string> | null>(null);
  useEffect(() => {
    if (isDataLoading) return;
    const ids = new Set(orders.map(order => order.id));
    if (knownOrderIds.current) {
      const fresh = orders.filter(order => !knownOrderIds.current?.has(order.id));
      if (fresh.length === 1) void adminAlert.toast(`Nuevo pedido ${fresh[0].id} de ${fresh[0].customer}`, 'info');
      else if (fresh.length > 1) void adminAlert.toast(`${fresh.length} pedidos nuevos`, 'info');
    }
    knownOrderIds.current = ids;
  }, [orders, isDataLoading]);

  const results = useMemo(() => {
    if (query.length < 2) return [];
    return [
      ...orders.filter(order => `${order.id} ${order.customer} ${order.email}`.toLocaleLowerCase('es').includes(query)).slice(0, 3).map(order => ({ label: order.id, detail: order.customer, to: `/admin/pedidos?search=${encodeURIComponent(order.id)}`, type: 'Orden' })),
      ...products.filter(product => product.name.toLocaleLowerCase('es').includes(query)).slice(0, 4).map(product => ({ label: product.name, detail: product.category, to: `/admin/productos?search=${encodeURIComponent(product.name)}`, type: 'Producto' })),
      ...customers.filter(customer => `${customer.name} ${customer.email}`.toLocaleLowerCase('es').includes(query)).slice(0, 3).map(customer => ({ label: customer.name, detail: customer.email, to: `/admin/clientes?search=${encodeURIComponent(customer.email)}`, type: 'Cliente' })),
    ];
  }, [query, orders, products, customers]);

  const compact = collapsed && !mobileOpen;
  const sidebarWidth = collapsed ? 'lg:w-[78px]' : 'lg:w-[256px]';
  const mainOffset = collapsed ? 'lg:ml-[78px]' : 'lg:ml-[256px]';

  const goToResult = (to: string) => { navigate(to); setSearch(''); setSearchOpen(false); };
  const submitSearch = (event: React.SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (results[0]) goToResult(results[0].to);
    else if (query) goToResult(`/admin/productos?search=${encodeURIComponent(search.trim())}`);
  };
  const handleLogout = async () => {
    if (!await adminAlert.confirm('¿Cerrar sesión?', 'Saldrás del panel de administración en este navegador.', 'Cerrar sesión')) return;
    logout();
    navigate('/cuenta');
  };
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      void adminAlert.toast('Datos actualizados');
    } finally {
      setRefreshing(false);
    }
  };
  const toggleSidebar = () => {
    if (window.innerWidth < 1024) setMobileOpen(value => !value);
    else setCollapsed(value => !value);
  };

  return (
    <div className="admin-shell min-h-dvh" data-theme="light" data-admin>
      {mobileOpen && <button className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-[2px] lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Cerrar menú" />}

      <aside className={`admin-sidebar fixed inset-y-0 left-0 z-50 flex w-[256px] flex-col transition-[transform,width] duration-200 lg:translate-x-0 ${sidebarWidth} ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className={`flex h-16 shrink-0 items-center border-b border-slate-100 ${compact ? 'justify-center px-2' : 'px-5'}`}>
          <Link to="/admin/dashboard" aria-label="Ir al dashboard"><Logo compact={compact} /></Link>
        </div>

        <nav className="admin-side-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4" aria-label="Navegación del panel">
          {navGroups.map(group => (
            <div key={group.title} className="mt-4 first:mt-2">
              {compact ? <div className="mx-auto mb-2 h-px w-6 bg-slate-200" /> : <p className="admin-nav-section">{group.title}</p>}
              <ul className="space-y-0.5">
                {group.items.map(({ to, label, icon: Icon }) => {
                  const active = isActivePath(pathname, to);
                  const badge = badges[to];
                  const count = badge?.count ?? 0;
                  return (
                    <li key={to}>
                      <Link to={to} aria-current={active ? 'page' : undefined} title={compact ? label : undefined}
                        className={`admin-nav-link group flex h-10 items-center gap-3 rounded-[10px] text-[13.5px] ${compact ? 'justify-center px-0' : 'px-3'} ${active ? 'admin-nav-link-active' : ''}`}>
                        <span className="relative grid place-items-center">
                          <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                          {compact && count > 0 && <span className={`absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full ${badge?.warn ? 'bg-amber-400' : 'bg-rose-500'} ring-2 ring-white`} />}
                        </span>
                        {!compact && <span className="truncate">{label}</span>}
                        {!compact && count > 0 && <span className={`tabular ml-auto min-w-[22px] rounded-full px-1.5 py-px text-center text-[10.5px] font-bold ${badge?.warn ? 'bg-amber-100 text-amber-800' : 'bg-rose-500 text-white'}`}>{count}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className={`m-3 mt-0 rounded-xl border border-slate-200 bg-slate-50 ${compact ? 'p-1.5' : 'p-2.5'}`}>
          <div className={`flex items-center ${compact ? 'flex-col gap-1.5' : 'gap-2.5'}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#0052cc] text-sm font-black text-white" title="Administrador">A</span>
            {!compact && <span className="min-w-0 flex-1 leading-tight"><span className="block truncate text-[13px] font-semibold text-slate-900">Administrador</span><span className="block truncate text-[11px] text-slate-500">Sesión activa</span></span>}
            <button onClick={() => void handleLogout()} className="admin-side-icon hover:!bg-rose-50 hover:!text-rose-600" aria-label="Cerrar sesión" title="Cerrar sesión"><LogOut className="h-[17px] w-[17px]" /></button>
          </div>
        </div>
      </aside>

      <div className={`min-w-0 transition-[margin] duration-200 ${mainOffset}`}>
        <header className="admin-topbar sticky top-0 z-30 flex h-16 items-center gap-2 px-4 lg:gap-3 lg:px-6">
          <button className="admin-icon-button" onClick={toggleSidebar} aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'} title={collapsed ? 'Expandir menú' : 'Contraer menú'}>
            <Menu className="h-5 w-5 lg:hidden" />
            {collapsed ? <PanelLeftOpen className="hidden h-5 w-5 lg:block" /> : <PanelLeftClose className="hidden h-5 w-5 lg:block" />}
          </button>
          <p className="min-w-0 truncate text-[15px] font-bold text-slate-900">{current?.label ?? 'Administración'}</p>
          <form onSubmit={submitSearch} className="relative mx-auto hidden w-full max-w-[480px] min-w-0 flex-1 md:block" role="search">
            <label className="admin-search block">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input value={search} maxLength={80} onChange={event => { setSearch(event.target.value); setSearchOpen(true); }} onFocus={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 150)} onKeyDown={event => { if (event.key === 'Escape') { setSearch(''); setSearchOpen(false); } }} placeholder="Buscar órdenes, productos, clientes…" aria-label="Buscar en el panel" className="admin-input !min-h-[38px] !bg-slate-50" />
            </label>
            {searchOpen && query.length >= 2 && <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {results.length ? results.map(result => <button type="button" key={`${result.type}-${result.to}`} onMouseDown={event => event.preventDefault()} onClick={() => goToResult(result.to)} className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-left last:border-0 hover:bg-blue-50"><span className="w-16 text-[10px] font-bold uppercase tracking-wide text-blue-600">{result.type}</span><span className="min-w-0 truncate text-sm font-semibold text-slate-800">{result.label}</span><span className="ml-auto max-w-32 truncate text-xs text-slate-500">{result.detail}</span></button>) : <p className="px-4 py-3 text-sm text-slate-500">Sin coincidencias. Pulsa Enter para buscar en productos.</p>}
            </div>}
          </form>
          <div className="ml-auto flex items-center gap-1 sm:gap-1.5">
            <span className="mr-1 hidden xl:inline-flex"><LiveStatus /></span>
            <button onClick={() => void handleRefresh()} disabled={refreshing} className="admin-icon-button" aria-label="Actualizar datos" title="Actualizar datos"><RefreshCw className={`h-[18px] w-[18px] ${refreshing ? 'animate-spin' : ''}`} /></button>
            <Link to="/admin/pedidos?status=Pendiente" className="admin-icon-button relative" aria-label={`${pendingOrders} órdenes pendientes`} title="Órdenes pendientes"><Bell className="h-[18px] w-[18px]" />{pendingOrders > 0 && <span className="tabular absolute -right-0.5 -top-0.5 grid h-[17px] min-w-[17px] place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">{pendingOrders}</span>}</Link>
            <a href="/" target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-secondary admin-btn-sm ml-1 hidden sm:inline-flex" title="Abrir la tienda en otra pestaña"><ExternalLink className="h-3.5 w-3.5" /> Ver tienda</a>
          </div>
        </header>
        <main className="admin-page mx-auto w-full max-w-[1560px] px-4 py-6 sm:px-5 lg:px-8">
          {settingsError && <p role="alert" className="admin-alert admin-alert-error mb-4">{settingsError}</p>}
          {[productsError, ordersError, adminRecordsError].filter(Boolean).map(error => <p key={error} role="alert" className="admin-alert mb-4">{error}. Revisa la conexión con el servidor; se reintentará automáticamente.</p>)}
          {isSettingsLoading
            ? <div className="space-y-4" role="status" aria-label="Cargando panel"><div className="admin-skeleton h-8 w-56" /><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(index => <div key={index} className="admin-skeleton h-28" />)}</div><div className="admin-skeleton h-72" /></div>
            : <fieldset disabled={isSavingSettings} className="min-w-0"><Outlet /></fieldset>}
        </main>
      </div>
    </div>
  );
}
