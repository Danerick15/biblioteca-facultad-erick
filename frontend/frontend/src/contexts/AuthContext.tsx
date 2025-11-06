import React, { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { verificarSesion, logout as logoutAPI } from '../api/auth';
import { AuthContext, type Usuario, type AuthContextType } from './AuthContextTypes';

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [usuario, setUsuarioState] = useState<Usuario | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Verificar sesión al inicializar
    useEffect(() => {
        const verificarSesionActiva = async () => {
            try {
                setCargando(true);
                setError(null);
                
                const response = await verificarSesion();
                
                if (response.autenticado) {
                    const usuarioCompleto: Usuario = {
                        usuarioID: parseInt(response.usuarioId),
                        nombre: response.nombreUsuario,
                        emailInstitucional: '',
                        codigoUniversitario: '',
                        rol: response.rol
                    };
                    
                    setUsuarioState(usuarioCompleto);
                    localStorage.setItem("usuario", JSON.stringify(usuarioCompleto));
                } else {
                    // Sesión inválida, limpiar datos
                    localStorage.removeItem("usuario");
                    sessionStorage.removeItem("usuario");
                    setUsuarioState(null);
                }
            } catch (error: unknown) {
                console.warn('Error verificando sesión:', error);
                
                // Verificar si es un error de Axios con response
                const isAxiosError = error && 
                    typeof error === 'object' && 
                    'response' in error && 
                    error.response && 
                    typeof error.response === 'object' && 
                    'status' in error.response;
                
                // Si es 401, significa que no hay sesión activa (comportamiento normal)
                if (isAxiosError && (error.response as { status: number }).status === 401) {
                    console.log('No hay sesión activa (comportamiento normal)');
                    setUsuarioState(null);
                    localStorage.removeItem("usuario");
                    sessionStorage.removeItem("usuario");
                } else {
                    // Si es otro error, usar localStorage como fallback
                    const errorMessage = error && typeof error === 'object' && 'message' in error 
                        ? String(error.message) 
                        : 'Error desconocido';
                    console.warn('Backend no disponible, usando modo offline:', errorMessage);
                    
                    const storedUser = localStorage.getItem("usuario");
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            if (parsedUser && parsedUser.usuarioID && parsedUser.nombre && parsedUser.rol) {
                                setUsuarioState(parsedUser);
                                console.log('Usuario cargado desde localStorage (modo offline)');
                            } else {
                                console.warn('Usuario en localStorage incompleto, limpiando...');
                                localStorage.removeItem("usuario");
                                sessionStorage.removeItem("usuario");
                                setUsuarioState(null);
                            }
                        } catch (parseError) {
                            console.error('Error parsing stored user:', parseError);
                            localStorage.removeItem("usuario");
                            sessionStorage.removeItem("usuario");
                            setUsuarioState(null);
                        }
                    } else {
                        setUsuarioState(null);
                    }
                }
            } finally {
                setCargando(false);
            }
        };

        verificarSesionActiva();
    }, []);

    // Listener para sincronizar sesión entre pestañas
    useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === "usuario" && event.newValue === null) {
                // Token eliminado en otra pestaña, cerrar sesión aquí también
                setUsuarioState(null);
                setError(null);
            }
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    const login = (usuario: Usuario) => {
        setUsuarioState(usuario);
        setError(null);
        localStorage.setItem("usuario", JSON.stringify(usuario));
    };

    const logout = async () => {
        try {
            // Llamar al endpoint de logout del backend
            await logoutAPI();
        } catch (error) {
            console.warn('Error en logout del backend:', error);
            // Continuar con el logout local aunque falle el backend
        } finally {
            // Limpiar datos locales
            setUsuarioState(null);
            setError(null);
            localStorage.removeItem("usuario");
            sessionStorage.removeItem("usuario");
            
            // Notificar a otras pestañas
            window.dispatchEvent(new StorageEvent("storage", {
                key: "usuario",
                newValue: null,
                oldValue: localStorage.getItem("usuario")
            }));
        }
    };

    const setUsuario = (usuario: Usuario) => {
        setUsuarioState(usuario);
        setError(null);
        localStorage.setItem("usuario", JSON.stringify(usuario));
    };

    // Funciones de utilidad para verificar permisos
    const tieneRol = (rol: string): boolean => {
        return usuario?.rol === rol;
    };

    const tieneAlgunRol = (roles: string[]): boolean => {
        return usuario ? roles.includes(usuario.rol) : false;
    };

    const esAdmin = (): boolean => {
        return tieneAlgunRol(['Administrador', 'Bibliotecaria']);
    };

    const esEstudiante = (): boolean => {
        return tieneRol('Estudiante');
    };

    const esProfesor = (): boolean => {
        return tieneRol('Profesor');
    };

    const value: AuthContextType = {
        usuario,
        cargando,
        error,
        login,
        logout,
        setUsuario,
        tieneRol,
        tieneAlgunRol,
        esAdmin,
        esEstudiante,
        esProfesor
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

