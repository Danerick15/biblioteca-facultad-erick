import React, { useState, memo, useCallback, useEffect, useRef } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
    BookOpen, 
    User, 
    Bell, 
    LogOut, 
    Settings, 
    ChevronDown,
    Menu,
    X,
    Library,
    DollarSign
} from 'lucide-react';
import Breadcrumbs from './Breadcrumbs';
import PageTransition from './PageTransition';
import { obtenerConteoNoLeidas } from '../api/notificaciones';
import './Layout.css';

const Layout: React.FC = memo(() => {
    const { usuario, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showAdminMenu, setShowAdminMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);
    const [notificationCount, setNotificationCount] = useState<number>(0);

    const handleLogout = useCallback(async () => {
        await logout();
        setShowUserMenu(false);
        navigate('/login');
    }, [logout, navigate]);

    const isActive = useCallback((path: string) => {
        return location.pathname === path;
    }, [location.pathname]);

    const hasAdminAccess = usuario?.rol === 'Administrador' || usuario?.rol === 'Bibliotecaria';

    const userMenuRef = useRef<HTMLDivElement>(null);
    const adminMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
                setShowUserMenu(false);
            }
            if (adminMenuRef.current && !adminMenuRef.current.contains(event.target as Node)) {
                setShowAdminMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Cargar conteo real de notificaciones no leídas
    useEffect(() => {
        let isMounted = true;
        const cargarConteo = async () => {
            if (!usuario) {
                setNotificationCount(0);
                return;
            }
            try {
                const count = await obtenerConteoNoLeidas();
                if (isMounted) setNotificationCount(count);
            } catch (e) {
                // Si falla, no romper UI; mantener último valor
            }
        };
        cargarConteo();
        return () => { isMounted = false; };
    }, [usuario]);

    return (
        <div className="layout">
            {/* Navbar */}
            <nav className="navbar">
                <div className="navbar-container">
                    {/* Logo y nombre */}
                    <div className="navbar-brand">
                        <Link to="/catalogo" className="brand-link">
                            <Library size={28} className="brand-icon" />
                            <span className="brand-text">Biblioteca FISI</span>
                        </Link>
                    </div>

                    {/* Enlaces de navegación - Desktop */}
                    <div className="navbar-nav desktop-nav">
                        <Link 
                            to="/dashboard" 
                            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>Dashboard</span>
                        </Link>
                        
                        <Link 
                            to="/catalogo" 
                            className={`nav-link ${isActive('/catalogo') ? 'active' : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>Catálogo</span>
                        </Link>
                        
                        <Link 
                            to={hasAdminAccess ? "/admin/reservas" : "/reservas"}
                            className={`nav-link ${isActive(hasAdminAccess ? '/admin/reservas' : '/reservas') ? 'active' : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>{hasAdminAccess ? "Reservas" : "Mis Reservas"}</span>
                        </Link>

                        <Link 
                            to={hasAdminAccess ? "/admin/devoluciones" : "/prestamos"}
                            className={`nav-link ${isActive(hasAdminAccess ? '/admin/devoluciones' : '/prestamos') ? 'active' : ''}`}
                        >
                            <BookOpen size={18} />
                            <span>{hasAdminAccess ? "Devoluciones" : "Mis Préstamos"}</span>
                        </Link>

                    </div>

                    {/* Acciones del usuario - Desktop */}
                    <div className="navbar-actions desktop-actions">
                        {/* Notificaciones */}
                        <Link to="/notificaciones" className="action-btn notification-btn" title="Notificaciones">
                            <Bell size={20} />
                            {notificationCount > 0 && (
                                <span className="notification-badge">{notificationCount}</span>
                            )}
                        </Link>

                        {/* Admin Dropdown */}
                        {hasAdminAccess && (
                            <div className="nav-dropdown" ref={adminMenuRef}>
                                <button 
                                    className={`nav-link dropdown-toggle ${location.pathname.startsWith('/admin') ? 'active' : ''}`}
                                    onClick={() => setShowAdminMenu(!showAdminMenu)}
                                >
                                    <Settings size={18} />
                                    <span>Admin</span>
                                    <ChevronDown size={16} />
                                </button>
                                
                                {showAdminMenu && (
                                    <div className="dropdown-menu">
                                        <Link 
                                            to="/admin/libros" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <BookOpen size={16} />
                                            <span>Gestionar Libros</span>
                                        </Link>
                                        <Link 
                                            to="/admin/ejemplares" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <Library size={16} />
                                            <span>Gestionar Ejemplares</span>
                                        </Link>
                                        <Link 
                                            to="/admin/devoluciones" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <BookOpen size={16} />
                                            <span>Gestionar Devoluciones</span>
                                        </Link>
                                        <Link 
                                            to="/admin/autores" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <User size={16} />
                                            <span>Gestionar Autores</span>
                                        </Link>
                                        <Link 
                                            to="/admin/categorias" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <Settings size={16} />
                                            <span>Gestionar Categorías</span>
                                        </Link>
                                        <Link 
                                            to="/admin/reservas" 
                                            className="dropdown-item"
                                            onClick={() => setShowAdminMenu(false)}
                                        >
                                            <BookOpen size={16} />
                                            <span>Gestionar Reservas</span>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Menú de usuario - Al extremo derecho */}
                        <div className="user-menu" ref={userMenuRef}>
                            <button 
                                className="user-btn"
                                onClick={() => setShowUserMenu(!showUserMenu)}
                            >
                                <div className="user-avatar">
                                    <User size={20} />
                                </div>
                                <span className="user-name">{usuario?.nombre}</span>
                                <ChevronDown size={16} />
                            </button>

                            {showUserMenu && (
                                <div className="user-dropdown">
                                    <div className="user-info">
                                        <div className="user-avatar-large">
                                            <User size={24} />
                                        </div>
                                        <div className="user-details">
                                            <div className="user-name-large">{usuario?.nombre}</div>
                                            {/* Mostrar el nombre también en la línea secundaria en lugar del rol (evita que aparezca 'Estudiante') */}
                                            <div className="user-role">{usuario?.nombre}</div>
                                        </div>
                                    </div>
                                    
                                    <div className="dropdown-divider"></div>
                                    
                                    <Link 
                                        to="/multas" 
                                        className="dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <DollarSign size={16} />
                                        <span>Mis Multas</span>
                                    </Link>
                                    
                                    <Link 
                                        to="/perfil" 
                                        className="dropdown-item"
                                        onClick={() => setShowUserMenu(false)}
                                    >
                                        <User size={16} />
                                        <span>Mi Perfil</span>
                                    </Link>
                                    
                                    <div className="dropdown-divider"></div>
                                    
                                    <button 
                                        className="dropdown-item logout-item"
                                        onClick={handleLogout}
                                    >
                                        <LogOut size={16} />
                                        <span>Cerrar Sesión</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botón de menú móvil */}
                    <button 
                        className="mobile-menu-btn"
                        onClick={() => setShowMobileMenu(!showMobileMenu)}
                    >
                        {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>

                {/* Menú móvil */}
                {showMobileMenu && (
                    <div className="mobile-menu">
                        <div className="mobile-nav">
                            <Link 
                                to="/dashboard" 
                                className={`mobile-nav-link ${isActive('/dashboard') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <BookOpen size={20} />
                                <span>Dashboard</span>
                            </Link>
                            
                            <Link 
                                to="/catalogo" 
                                className={`mobile-nav-link ${isActive('/catalogo') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <BookOpen size={20} />
                                <span>Catálogo</span>
                            </Link>
                            
                            <Link 
                                to={hasAdminAccess ? "/admin/reservas" : "/reservas"}
                                className={`mobile-nav-link ${isActive(hasAdminAccess ? '/admin/reservas' : '/reservas') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <BookOpen size={20} />
                                <span>{hasAdminAccess ? "Reservas" : "Mis Reservas"}</span>
                            </Link>

                            <Link 
                                to={hasAdminAccess ? "/admin/devoluciones" : "/prestamos"}
                                className={`mobile-nav-link ${isActive(hasAdminAccess ? '/admin/devoluciones' : '/prestamos') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <BookOpen size={20} />
                                <span>{hasAdminAccess ? "Devoluciones" : "Mis Préstamos"}</span>
                            </Link>

                            <Link 
                                to="/multas"
                                className={`mobile-nav-link ${isActive('/multas') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <DollarSign size={20} />
                                <span>Mis Multas</span>
                            </Link>

                            {hasAdminAccess && (
                                <>
                                    <Link 
                                        to="/admin/libros" 
                                        className={`mobile-nav-link ${isActive('/admin/libros') ? 'active' : ''}`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <BookOpen size={20} />
                                        <span>Gestionar Libros</span>
                                    </Link>
                                    
                                    <Link 
                                        to="/admin/ejemplares" 
                                        className={`mobile-nav-link ${isActive('/admin/ejemplares') ? 'active' : ''}`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Library size={20} />
                                        <span>Gestionar Ejemplares</span>
                                    </Link>
                                    <Link 
                                        to="/admin/autores" 
                                        className={`mobile-nav-link ${isActive('/admin/autores') ? 'active' : ''}`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <User size={20} />
                                        <span>Gestionar Autores</span>
                                    </Link>
                                    <Link 
                                        to="/admin/categorias" 
                                        className={`mobile-nav-link ${isActive('/admin/categorias') ? 'active' : ''}`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <Settings size={20} />
                                        <span>Gestionar Categorías</span>
                                    </Link>
                                    <Link 
                                        to="/admin/reservas" 
                                        className={`mobile-nav-link ${isActive('/admin/reservas') ? 'active' : ''}`}
                                        onClick={() => setShowMobileMenu(false)}
                                    >
                                        <BookOpen size={20} />
                                        <span>Gestionar Reservas</span>
                                    </Link>
                                </>
                            )}

                            <Link 
                                to="/perfil" 
                                className={`mobile-nav-link ${isActive('/perfil') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <User size={20} />
                                <span>Mi Perfil</span>
                            </Link>

                            <Link 
                                to="/notificaciones" 
                                className={`mobile-nav-link ${isActive('/notificaciones') ? 'active' : ''}`}
                                onClick={() => setShowMobileMenu(false)}
                            >
                                <Bell size={20} />
                                <span>Notificaciones</span>
                            </Link>

                            <button 
                                className="mobile-nav-link logout-link"
                                onClick={() => {
                                    handleLogout();
                                    setShowMobileMenu(false);
                                }}
                            >
                                <LogOut size={20} />
                                <span>Cerrar Sesión</span>
                            </button>
                        </div>
                    </div>
                )}
            </nav>

            {/* Contenido principal */}
            <main className="main-content">
                <div className="page-container">
                    <Breadcrumbs />
                    <PageTransition>
                        <Outlet />
                    </PageTransition>
                </div>
            </main>
        </div>
    );
});

Layout.displayName = 'Layout';

export default Layout;
