import { createContext } from 'react';

export interface Usuario {
    usuarioID: number;
    nombre: string;
    emailInstitucional: string;
    codigoUniversitario: string;
    rol: string;
}

export interface AuthContextType {
    usuario: Usuario | null;
    cargando: boolean;
    error: string | null;
    login: (usuario: Usuario) => void;
    logout: () => Promise<void>;
    setUsuario: (usuario: Usuario) => void;
    tieneRol: (rol: string) => boolean;
    tieneAlgunRol: (roles: string[]) => boolean;
    esAdmin: () => boolean;
    esEstudiante: () => boolean;
    esProfesor: () => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
