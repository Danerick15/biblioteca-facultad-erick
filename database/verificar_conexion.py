#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para verificar la conexión a SQL Server y detectar instancias disponibles
"""

import pyodbc
import subprocess
import sys

def listar_servidores_sql():
    """Listar servidores SQL disponibles usando sqlcmd"""
    print("=== DETECTANDO SERVIDORES SQL SERVER ===\n")
    
    try:
        # Intentar usar sqlcmd para listar servidores
        result = subprocess.run(
            ['sqlcmd', '-L'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            print("Servidores SQL Server detectados:")
            print(result.stdout)
        else:
            print("No se pudo detectar servidores con sqlcmd")
            print("(Esto puede ser normal si sqlcmd no está en el PATH)")
    except FileNotFoundError:
        print("sqlcmd no encontrado. Instalando herramientas de SQL Server puede ayudar.")
    except Exception as e:
        print(f"Error al intentar listar servidores: {e}")
    
    print("\n" + "="*50 + "\n")

def probar_conexion(servidor, base_datos='master'):
    """Probar conexión a un servidor específico"""
    try:
        conn = pyodbc.connect(
            'DRIVER={ODBC Driver 17 for SQL Server};'
            f'SERVER={servidor};'
            f'DATABASE={base_datos};'
            'Trusted_Connection=yes;'
            'Connection Timeout=3;'
        )
        cursor = conn.cursor()
        cursor.execute("SELECT @@VERSION")
        version = cursor.fetchone()[0]
        conn.close()
        return True, version
    except Exception as e:
        return False, str(e)

def verificar_conexiones():
    """Verificar conexiones a diferentes configuraciones de servidor"""
    print("=== PROBANDO CONEXIONES ===\n")
    
    # Lista de posibles configuraciones de servidor
    servidores = [
        ('localhost', 'Instancia por defecto'),
        ('localhost\\SQLEXPRESS', 'SQL Server Express'),
        ('localhost\\MSSQLSERVER', 'SQL Server (instancia nombrada)'),
        ('.\\SQLEXPRESS', 'SQL Server Express (notación corta)'),
        ('.', 'Instancia local (notación corta)'),
    ]
    
    conexiones_exitosas = []
    
    for servidor, descripcion in servidores:
        print(f"Probando: {servidor} ({descripcion})...")
        exito, resultado = probar_conexion(servidor)
        
        if exito:
            print(f"  ✅ CONEXIÓN EXITOSA")
            print(f"  Versión: {resultado[:80]}...")
            conexiones_exitosas.append((servidor, descripcion))
        else:
            print(f"  ❌ FALLO: {resultado[:100]}")
        print()
    
    # Probar con base de datos específica
    if conexiones_exitosas:
        print("\n=== PROBANDO BASE DE DATOS 'BibliotecaFISI' ===\n")
        for servidor, descripcion in conexiones_exitosas:
            print(f"Probando base de datos 'BibliotecaFISI' en {servidor}...")
            exito, resultado = probar_conexion(servidor, 'BibliotecaFISI')
            
            if exito:
                print(f"  ✅ Base de datos 'BibliotecaFISI' encontrada y accesible")
            else:
                if "cannot open database" in resultado.lower():
                    print(f"  ⚠️  Base de datos 'BibliotecaFISI' no existe")
                    print(f"     Necesitas ejecutar el script SQL para crearla primero")
                else:
                    print(f"  ❌ Error: {resultado[:100]}")
            print()
    
    return conexiones_exitosas

def verificar_servicios_windows():
    """Verificar servicios de SQL Server en Windows"""
    print("=== VERIFICANDO SERVICIOS DE SQL SERVER ===\n")
    
    try:
        result = subprocess.run(
            ['powershell', '-Command', "Get-Service -Name '*SQL*' | Format-Table -AutoSize"],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        if result.returncode == 0 and result.stdout:
            print(result.stdout)
        else:
            print("No se encontraron servicios de SQL Server")
    except Exception as e:
        print(f"Error al verificar servicios: {e}")
    
    print("\n" + "="*50 + "\n")

def main():
    """Función principal"""
    print("="*50)
    print("VERIFICACIÓN DE CONEXIÓN A SQL SERVER")
    print("="*50 + "\n")
    
    # Verificar servicios
    verificar_servicios_windows()
    
    # Listar servidores (si es posible)
    listar_servidores_sql()
    
    # Probar conexiones
    conexiones_exitosas = verificar_conexiones()
    
    # Resumen
    print("\n" + "="*50)
    print("RESUMEN")
    print("="*50)
    
    if conexiones_exitosas:
        print(f"\n✅ Se encontraron {len(conexiones_exitosas)} conexión(es) exitosa(s):")
        for servidor, descripcion in conexiones_exitosas:
            print(f"   - {servidor} ({descripcion})")
        print("\n💡 Puedes usar cualquiera de estos servidores en los scripts de carga de datos.")
    else:
        print("\n❌ No se pudo establecer ninguna conexión exitosa.")
        print("\nPasos recomendados:")
        print("1. Verifica que SQL Server esté instalado")
        print("2. Verifica que el servicio de SQL Server esté ejecutándose")
        print("3. Verifica que tengas permisos de autenticación de Windows")
        print("4. Si usas una instancia con nombre personalizado, agrega 'localhost\\NOMBRE_INSTANCIA' a la lista de servidores")
    
    print("\n" + "="*50)

if __name__ == "__main__":
    main()


