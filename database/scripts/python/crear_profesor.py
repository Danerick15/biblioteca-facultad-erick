#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para crear un profesor de prueba
NOTA: La contraseña está establecida en el código (línea 88).
      Cambia la variable 'contrasena_plana' si necesitas una contraseña diferente.
"""

import pyodbc
import hashlib

def conectar_bd():
    """Conectar a la base de datos con múltiples intentos"""
    # Lista de posibles configuraciones de servidor
    servidores = [
        'localhost',  # SQL Server por defecto
        'localhost\\SQLEXPRESS',  # SQL Server Express
        'localhost\\MSSQLSERVER',  # SQL Server por defecto (instancia nombrada)
        '.\\SQLEXPRESS',  # SQL Server Express (notación corta)
        '.',  # Instancia local (notación corta)
    ]
    
    # Intentar con cada configuración de servidor
    for servidor in servidores:
        try:
            print(f"Intentando conectar a: {servidor}...")
            conn = pyodbc.connect(
                'DRIVER={ODBC Driver 17 for SQL Server};'
                f'SERVER={servidor};'
                'DATABASE=BibliotecaFISI;'
                'Trusted_Connection=yes;'
                'Connection Timeout=5;'
            )
            print(f"✅ Conexión exitosa a: {servidor}")
            return conn
        except pyodbc.Error as e:
            # Continuar con el siguiente servidor si falla
            continue
        except Exception as e:
            # Para otros errores, también continuar
            continue
    
    # Si todos los intentos fallaron, mostrar mensaje de ayuda
    print("\n❌ Error: No se pudo conectar a SQL Server con ninguna configuración.")
    print("\nPosibles soluciones:")
    print("1. Verifica que SQL Server esté ejecutándose")
    print("2. Verifica que la base de datos 'BibliotecaFISI' exista")
    print("3. Verifica que tengas permisos de autenticación de Windows")
    return None

def hash_contrasena(contrasena):
    """Crear hash de la contraseña usando SHA-256"""
    return hashlib.sha256(contrasena.encode('utf-8')).hexdigest()

def crear_profesor():
    """Crear un profesor de prueba"""
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Verificar si ya existe este profesor
        email = "profesor@unmsm.edu.pe"
        cursor.execute("SELECT COUNT(*) FROM Usuarios WHERE EmailInstitucional = ?", (email,))
        existe = cursor.fetchone()[0]
        
        if existe > 0:
            print("Ya existe un profesor con este email.")
            cursor.execute("SELECT CodigoUniversitario, Nombre, EmailInstitucional FROM Usuarios WHERE EmailInstitucional = ?", (email,))
            profesor = cursor.fetchone()
            print(f"\nProfesor existente:")
            print(f"  - Código: {profesor[0]} | Nombre: {profesor[1]} | Email: {profesor[2]}")
            print("\n=== INFORMACIÓN DE ACCESO ===")
            print(f"Email: {email}")
            print(f"Contraseña: Profesor123!")
            return
        
        # Datos del profesor
        codigo = "87654321"  # 8 dígitos
        nombre = "Profesor de Prueba"
        email = "profesor@unmsm.edu.pe"
        # Contraseña establecida en el código
        contrasena_plana = "Profesor123!"  # Cambia esta contraseña según necesites
        contrasena_hash = hash_contrasena(contrasena_plana)
        
        print("=== CREANDO PROFESOR DE PRUEBA ===")
        print(f"Código Universitario: {codigo}")
        print(f"Nombre: {nombre}")
        print(f"Email: {email}")
        print(f"Contraseña: {contrasena_plana}")
        print("=" * 50)
        
        # Insertar profesor
        cursor.execute("""
            INSERT INTO Usuarios (CodigoUniversitario, Nombre, EmailInstitucional, ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena)
            VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (codigo, nombre, email, contrasena_hash, 'Profesor', 1))
        
        conn.commit()
        
        print("[OK] Profesor creado exitosamente!")
        print("\n=== INFORMACIÓN DE ACCESO ===")
        print(f"Email: {email}")
        print(f"Contraseña: {contrasena_plana}")
        print("\n[IMPORTANTE] Usa estas credenciales para iniciar sesión y probar las recomendaciones.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Creando profesor de prueba...")
    crear_profesor()
    print("Proceso completado")


