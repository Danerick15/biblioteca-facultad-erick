#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para crear un administrador inicial
"""

import pyodbc
import hashlib
import secrets
import string

def conectar_bd():
    """Conectar a la base de datos"""
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            'SERVER=localhost;'
            'DATABASE=BibliotecaFISI;'
            'Trusted_Connection=yes;'
        )
        return conn
    except Exception as e:
        print(f"Error conectando a la base de datos: {e}")
        return None

def generar_contrasena_segura(longitud=12):
    """Generar una contraseña segura"""
    caracteres = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(caracteres) for _ in range(longitud))

def hash_contrasena(contrasena):
    """Crear hash de la contraseña usando SHA-256"""
    return hashlib.sha256(contrasena.encode('utf-8')).hexdigest()

def crear_administrador():
    """Crear un administrador inicial"""
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Verificar si ya existe un administrador
        cursor.execute("SELECT COUNT(*) FROM Usuarios WHERE Rol = 'Administrador'")
        admin_count = cursor.fetchone()[0]
        
        if admin_count > 0:
            print("Ya existe al menos un administrador en la base de datos.")
            cursor.execute("SELECT CodigoUniversitario, Nombre, EmailInstitucional FROM Usuarios WHERE Rol = 'Administrador'")
            admins = cursor.fetchall()
            print("\nAdministradores existentes:")
            for admin in admins:
                print(f"  - Código: {admin[0]} | Nombre: {admin[1]} | Email: {admin[2]}")
            return
        
        # Datos del administrador
        codigo = "12345678"  # 8 dígitos
        nombre = "Administrador del Sistema"
        email = "admin@unmsm.edu.pe"  # @unmsm.edu.pe
        contrasena_plana = generar_contrasena_segura(12)
        contrasena_hash = hash_contrasena(contrasena_plana)
        
        print("=== CREANDO ADMINISTRADOR INICIAL ===")
        print(f"Código Universitario: {codigo}")
        print(f"Nombre: {nombre}")
        print(f"Email: {email}")
        print(f"Contraseña: {contrasena_plana}")
        print("=" * 50)
        
        # Insertar administrador
        cursor.execute("""
            INSERT INTO Usuarios (CodigoUniversitario, Nombre, EmailInstitucional, ContrasenaHash, Rol, Estado, FechaRegistro, FechaUltimaActualizacionContrasena)
            VALUES (?, ?, ?, ?, ?, ?, GETDATE(), GETDATE())
        """, (codigo, nombre, email, contrasena_hash, 'Administrador', 1))
        
        conn.commit()
        
        print("[OK] Administrador creado exitosamente!")
        print("\n=== INFORMACIÓN DE ACCESO ===")
        print(f"Usuario: {codigo}")
        print(f"Contraseña: {contrasena_plana}")
        print(f"Email: {email}")
        print("\n[IMPORTANTE] Guarda esta información de forma segura.")
        print("   Puedes cambiar la contraseña desde la aplicación.")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Creando administrador inicial...")
    crear_administrador()
    print("Proceso completado")
