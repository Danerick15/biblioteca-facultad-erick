// src/App.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy } from "react";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner from "./components/LoadingSpinner";
import { AuthProvider } from "./contexts/AuthContext";
import { ConfiguracionProvider } from "./contexts/ConfiguracionContext";
import { ToastProvider } from './components/Toast';
import { useAuth } from "./hooks/useAuth";
import "./App.css";

// Lazy loading de páginas públicas
const Login = lazy(() => import("./features/auth/pages/Login/Login"));
const Registro = lazy(() => import("./features/auth/pages/Register/Register"));

// Lazy loading de páginas protegidas
const Dashboard = lazy(() => import("./features/dashboard/pages/Dashboard/Dashboard"));
const Catalogo = lazy(() => import("./features/catalog/pages/Catalog/Catalog"));
const Perfil = lazy(() => import("./features/profile/pages/Profile/Profile"));
const MisPrestamos = lazy(() => import("./features/loans/pages/MyLoans/MyLoans"));
const AdminLoans = lazy(() => import("./features/admin/loans/pages/AdminLoans/AdminLoans"));
const MisReservas = lazy(() => import("./features/reservations/pages/MyReservations/MyReservations"));
const Notificaciones = lazy(() => import("./features/notifications/pages/Notifications/Notifications"));
const Multas = lazy(() => import("./features/fines/pages/Fines/Fines"));

// Lazy loading de páginas de administración
const AdminLibros = lazy(() => import("./features/admin/books/pages/AdminBooks/AdminBooks"));
const AdminEjemplares = lazy(() => import("./features/admin/copies/pages/AdminCopies/AdminCopies"));
const AdminAutores = lazy(() => import("./features/admin/authors/pages/AdminAuthors/AdminAuthors"));
const AdminCategorias = lazy(() => import("./features/admin/categories/pages/AdminCategories/AdminCategories"));
const AdminReservas = lazy(() => import("./features/admin/reservas/pages/AdminReservas/AdminReservas"));
const AdminReturns = lazy(() => import("./features/admin/returns/pages/AdminReturns/AdminReturns"));
const Reports = lazy(() => import("./features/admin/reports/pages/Reports/Reports"));
const UserManagement = lazy(() => import("./features/admin/users/pages/UserManagement/UserManagement"));
const SystemConfig = lazy(() => import("./features/admin/config/pages/SystemConfig/SystemConfig"));

// Lazy loading de páginas de profesor
const ProfessorRecommendations = lazy(() => import("./features/professor/recommendations/pages/ProfessorRecommendations/ProfessorRecommendations"));

// Lazy loading de páginas especiales
const NotFound = lazy(() => import("./features/errors/pages/NotFound/NotFound"));

function AppContent() {
    const { usuario, cargando } = useAuth();

    // Mostrar loading mientras se verifica la sesión
    if (cargando) {
        return <LoadingSpinner message="Verificando sesión..." fullScreen />;
    }

    return (
        <Routes>
            {/* Rutas públicas */}
            <Route 
                path="/login" 
                element={
                    !usuario ? (
                        <Suspense fallback={<LoadingSpinner message="Cargando login..." fullScreen />}>
                            <Login />
                        </Suspense>
                    ) : (
                        <Navigate to="/dashboard" replace />
                    )
                } 
            />
            <Route 
                path="/registro" 
                element={
                    !usuario ? (
                        <Suspense fallback={<LoadingSpinner message="Cargando registro..." fullScreen />}>
                            <Registro />
                        </Suspense>
                    ) : (
                        <Navigate to="/dashboard" replace />
                    )
                } 
            />

            {/* Rutas protegidas con Layout */}
            <Route
                path="/"
                element={
                    usuario ? (
                        <Layout />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            >
                {/* Ruta por defecto */}
                <Route 
                    index 
                    element={<Navigate to="/dashboard" replace />} 
                />

                        {/* Rutas principales */}
                        <Route
                            path="dashboard"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando dashboard..." />}>
                                    <Dashboard usuario={usuario!} />
                                </Suspense>
                            }
                        />

                        <Route
                            path="catalogo"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando catálogo..." />}>
                                    <Catalogo usuario={usuario!} />
                                </Suspense>
                            }
                        />

                        <Route
                            path="perfil"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando perfil..." />}>
                                    <Perfil usuario={usuario!} />
                                </Suspense>
                            }
                        />

                        <Route
                            path="reservas"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando reservas..." />}>
                                    <MisReservas />
                                </Suspense>
                            }
                        />

                        <Route
                            path="prestamos"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando préstamos..." />}>
                                    <MisPrestamos usuario={usuario!} />
                                </Suspense>
                            }
                        />

                        <Route
                            path="notificaciones"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando notificaciones..." />}>
                                    <Notificaciones usuario={usuario!} />
                                </Suspense>
                            }
                        />

                        <Route
                            path="multas"
                            element={
                                <Suspense fallback={<LoadingSpinner message="Cargando multas..." />}>
                                    <Multas usuario={usuario!} />
                                </Suspense>
                            }
                        />

                {/* Rutas de administración (protegidas por rol) */}
                <Route
                    path="admin/libros"
                    element={
                        <ProtectedRoute
                            usuario={usuario!}
                            rolesPermitidos={['Administrador', 'Bibliotecaria']}
                        >
                            <Suspense fallback={<LoadingSpinner message="Cargando administración de libros..." />}>
                                <AdminLibros />
                            </Suspense>
                        </ProtectedRoute>
                    }
                />

                        <Route
                            path="admin/ejemplares"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando administración de ejemplares..." />}>
                                        <AdminEjemplares />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/reservas"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando gestión de reservas..." />}>
                                        <AdminReservas />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/autores"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando administración de autores..." />}>
                                        <AdminAutores />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/categorias"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando administración de categorías..." />}>
                                        <AdminCategorias />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/prestamos"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando gestión de préstamos..." />}>
                                        <AdminLoans />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/devoluciones"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador', 'Bibliotecaria']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando gestión de devoluciones..." />}>
                                        <AdminReturns />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/reportes"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando reportes..." />}>
                                        <Reports />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/usuarios"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando gestión de usuarios..." />}>
                                        <UserManagement />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        <Route
                            path="admin/configuracion"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Administrador']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando configuración..." />}>
                                        <SystemConfig />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                        {/* Rutas de profesor */}
                        <Route
                            path="profesor/recomendaciones"
                            element={
                                <ProtectedRoute
                                    usuario={usuario!}
                                    rolesPermitidos={['Profesor']}
                                >
                                    <Suspense fallback={<LoadingSpinner message="Cargando recomendaciones..." />}>
                                        <ProfessorRecommendations />
                                    </Suspense>
                                </ProtectedRoute>
                            }
                        />

                {/* Ruta 404 - página personalizada */}
                <Route 
                    path="*" 
                    element={
                        <Suspense fallback={<LoadingSpinner message="Cargando..." fullScreen />}>
                            <NotFound />
                        </Suspense>
                    } 
                />
            </Route>
        </Routes>
    );
}

function App() {
    return (
        <ToastProvider>
            <AuthProvider>
                <ConfiguracionProvider>
                    <AppContent />
                </ConfiguracionProvider>
            </AuthProvider>
        </ToastProvider>
    );
}

export default App;
