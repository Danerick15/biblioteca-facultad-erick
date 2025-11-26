import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { obtenerConfiguracion, type ConfiguracionCompleta, type ConfiguracionInterfaz } from '../api/configuracion';
import { useAuth } from '../hooks/useAuth';

interface ConfiguracionContextType {
    configuracion: ConfiguracionCompleta | null;
    interfaz: ConfiguracionInterfaz | null;
    cargando: boolean;
    actualizarConfiguracion: () => Promise<void>;
    aplicarTema: (tema: 'claro' | 'oscuro' | 'auto') => void;
}

const ConfiguracionContext = createContext<ConfiguracionContextType | undefined>(undefined);

export const useConfiguracion = () => {
    const context = useContext(ConfiguracionContext);
    if (!context) {
        throw new Error('useConfiguracion debe usarse dentro de ConfiguracionProvider');
    }
    return context;
};

interface ConfiguracionProviderProps {
    children: ReactNode;
}

export const ConfiguracionProvider: React.FC<ConfiguracionProviderProps> = ({ children }) => {
    const { usuario, esAdmin } = useAuth();
    const [configuracion, setConfiguracion] = useState<ConfiguracionCompleta | null>(null);
    const [interfaz, setInterfaz] = useState<ConfiguracionInterfaz | null>(null);
    const [cargando, setCargando] = useState(true);

    const cargarConfiguracion = async () => {
        try {
            setCargando(true);
            
            // Solo cargar y aplicar configuración de interfaz si el usuario es administrador
            if (!usuario || !esAdmin()) {
                // Si no es administrador, usar valores por defecto y no aplicar tema personalizado
                setConfiguracion(null);
                setInterfaz(null);
                setCargando(false);
                return;
            }
            
            const config = await obtenerConfiguracion();
            
            // Asegurar que la sección de interfaz existe
            if (!config.interfaz) {
                config.interfaz = {
                    tema: 'oscuro',
                    elementosPorPagina: 20,
                    mostrarImagenes: true,
                    animaciones: true
                };
            }
            
            setConfiguracion(config);
            setInterfaz(config.interfaz);
            aplicarTema(config.interfaz.tema);
        } catch (error) {
            console.error('Error al cargar configuración:', error);
            // Si es administrador pero falla, usar valores por defecto
            if (usuario && esAdmin()) {
                const configPorDefecto: ConfiguracionInterfaz = {
                    tema: 'oscuro',
                    elementosPorPagina: 20,
                    mostrarImagenes: true,
                    animaciones: true
                };
                setInterfaz(configPorDefecto);
                aplicarTema(configPorDefecto.tema);
            }
        } finally {
            setCargando(false);
        }
    };

    const aplicarTema = (tema: 'claro' | 'oscuro' | 'auto') => {
        const root = document.documentElement;
        
        // Remover clases de tema anteriores
        root.classList.remove('tema-claro', 'tema-oscuro', 'tema-auto');
        
        // Determinar el tema real a aplicar
        let temaAplicar: 'claro' | 'oscuro' = 'oscuro';
        
        if (tema === 'auto') {
            // Detectar preferencia del sistema
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            temaAplicar = prefersDark ? 'oscuro' : 'claro';
            
            // Escuchar cambios en la preferencia del sistema
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handleChange = () => {
                aplicarTema('auto'); // Re-aplicar para actualizar
            };
            mediaQuery.addEventListener('change', handleChange);
        } else {
            temaAplicar = tema;
        }
        
        // Aplicar el tema
        root.classList.add(`tema-${temaAplicar}`);
        root.setAttribute('data-tema', temaAplicar);
        
        // Guardar preferencia en localStorage
        localStorage.setItem('tema', tema);
    };

    useEffect(() => {
        // Solo cargar configuración si el usuario ya está disponible
        if (usuario !== undefined) {
            cargarConfiguracion();
        }
    }, [usuario]); // Recargar cuando cambie el usuario

    // Escuchar cambios en la configuración cuando se actualiza desde otra parte
    useEffect(() => {
        // Solo aplicar si es administrador
        if (usuario && esAdmin() && configuracion?.interfaz) {
            setInterfaz(configuracion.interfaz);
            aplicarTema(configuracion.interfaz.tema);
        } else if (usuario && !esAdmin()) {
            // Si no es administrador, remover tema personalizado
            const root = document.documentElement;
            root.classList.remove('tema-claro', 'tema-oscuro', 'tema-auto');
            root.removeAttribute('data-tema');
        }
    }, [configuracion, usuario]);

    const actualizarConfiguracion = async () => {
        await cargarConfiguracion();
    };

    return (
        <ConfiguracionContext.Provider
            value={{
                configuracion,
                interfaz,
                cargando,
                actualizarConfiguracion,
                aplicarTema
            }}
        >
            {children}
        </ConfiguracionContext.Provider>
    );
};

