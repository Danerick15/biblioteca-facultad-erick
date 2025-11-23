#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script rápido para generar todos los reportes de la biblioteca
Conecta directamente a la base de datos y genera reportes en formato texto
"""

import pyodbc
from datetime import datetime, timedelta
import json
import sys
import io

# Configurar salida UTF-8 para Windows
if sys.platform == 'win32':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

# Configuración de conexión
SERVIDOR = 'localhost'
BASE_DATOS = 'BibliotecaFISI'

def conectar_bd():
    """Conectar a la base de datos"""
    try:
        # Intentar diferentes configuraciones de conexión
        configuraciones = [
            # Configuración 1: Sin Encrypt
            f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVIDOR};DATABASE={BASE_DATOS};Trusted_Connection=yes;Connection Timeout=30;',
            # Configuración 2: Con Encrypt=no
            f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVIDOR};DATABASE={BASE_DATOS};Trusted_Connection=yes;Encrypt=no;Connection Timeout=30;',
            # Configuración 3: Con TrustServerCertificate
            f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={SERVIDOR};DATABASE={BASE_DATOS};Trusted_Connection=yes;TrustServerCertificate=yes;Connection Timeout=30;',
        ]
        
        for conn_str in configuraciones:
            try:
                conn = pyodbc.connect(conn_str)
                return conn
            except:
                continue
        
        # Si ninguna funcionó, intentar la última
        conn = pyodbc.connect(configuraciones[0])
        return conn
    except Exception as e:
        print(f"[ERROR] Error al conectar: {e}")
        print("\n[INFO] Asegurate de que:")
        print("   1. SQL Server este ejecutandose")
        print("   2. La base de datos 'BibliotecaFISI' exista")
        print("   3. Tengas permisos de acceso")
        sys.exit(1)

def reporte_estadisticas_generales(conn):
    """Reporte 1: Estadísticas Generales"""
    cursor = conn.cursor()
    
    # Total usuarios
    cursor.execute("SELECT COUNT(*) FROM Usuarios WHERE Estado = 1")
    total_usuarios = cursor.fetchone()[0]
    
    # Total libros
    cursor.execute("SELECT COUNT(*) FROM Libros")
    total_libros = cursor.fetchone()[0]
    
    # Total ejemplares
    cursor.execute("SELECT COUNT(*) FROM Ejemplares")
    total_ejemplares = cursor.fetchone()[0]
    
    # Detectar estructura de Prestamos
    cursor.execute("""
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Prestamos'
    """)
    columnas_prestamos = [row[0] for row in cursor.fetchall()]
    
    # Préstamos activos
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos 
        WHERE Estado IN ('Prestado', 'Atrasado', 'Devuelto')
    """)
    prestamos_activos = cursor.fetchone()[0]
    
    # Préstamos vencidos
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos 
        WHERE Estado = 'Atrasado' OR (Estado = 'Prestado' AND FechaVencimiento < GETDATE())
    """)
    prestamos_vencidos = cursor.fetchone()[0]
    
    # Multas pendientes
    cursor.execute("""
        SELECT COUNT(*), ISNULL(SUM(Monto), 0) 
        FROM Multas 
        WHERE Estado = 'Pendiente'
    """)
    row = cursor.fetchone()
    multas_pendientes = row[0]
    monto_total_multas = float(row[1]) if row[1] else 0.0
    
    return {
        'total_usuarios': total_usuarios,
        'total_libros': total_libros,
        'total_ejemplares': total_ejemplares,
        'prestamos_activos': prestamos_activos,
        'prestamos_vencidos': prestamos_vencidos,
        'multas_pendientes': multas_pendientes,
        'monto_total_multas': monto_total_multas
    }

def reporte_prestamos_por_mes(conn, año=None):
    """Reporte 2: Préstamos por Mes"""
    if año is None:
        año = datetime.now().year
    
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            MONTH(FechaPrestamo) as mes,
            COUNT(*) as cantidad
        FROM Prestamos
        WHERE YEAR(FechaPrestamo) = ?
        GROUP BY MONTH(FechaPrestamo)
        ORDER BY mes
    """, año)
    
    meses_nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 
                     'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    resultados = {mes: 0 for mes in meses_nombres}
    for row in cursor.fetchall():
        mes_idx = row[0] - 1
        resultados[meses_nombres[mes_idx]] = row[1]
    
    return resultados

def reporte_libros_mas_prestados(conn, limite=10):
    """Reporte 3: Libros Más Prestados"""
    cursor = conn.cursor()
    
    # Detectar estructura de Prestamos
    cursor.execute("""
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Prestamos'
    """)
    columnas = [row[0] for row in cursor.fetchall()]
    
    # Si tiene ReservaID, usar estructura nueva
    if 'ReservaID' in columnas:
        cursor.execute("""
            SELECT TOP (?)
                l.Titulo,
                COUNT(p.PrestamoID) as total_prestamos
            FROM Prestamos p
            INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
            INNER JOIN Libros l ON r.LibroID = l.LibroID
            GROUP BY l.LibroID, l.Titulo
            ORDER BY total_prestamos DESC
        """, limite)
    else:
        # Estructura antigua: Prestamos tiene EjemplarID directamente
        cursor.execute("""
            SELECT TOP (?)
                l.Titulo,
                COUNT(p.PrestamoID) as total_prestamos
            FROM Prestamos p
            INNER JOIN Ejemplares e ON p.EjemplarID = e.EjemplarID
            INNER JOIN Libros l ON e.LibroID = l.LibroID
            GROUP BY l.LibroID, l.Titulo
            ORDER BY total_prestamos DESC
        """, limite)
    
    resultados = []
    for row in cursor.fetchall():
        resultados.append({
            'titulo': row[0],
            'prestamos': row[1]
        })
    
    return resultados

def reporte_usuarios_mas_activos(conn, limite=10):
    """Reporte 4: Usuarios Más Activos"""
    cursor = conn.cursor()
    
    # Detectar estructura de Prestamos
    cursor.execute("""
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME = 'Prestamos'
    """)
    columnas = [row[0] for row in cursor.fetchall()]
    
    # Si tiene ReservaID, usar estructura nueva
    if 'ReservaID' in columnas:
        cursor.execute("""
            SELECT TOP (?)
                u.Nombre,
                COUNT(p.PrestamoID) as total_prestamos
            FROM Prestamos p
            INNER JOIN Reservas r ON p.ReservaID = r.ReservaID
            INNER JOIN Usuarios u ON r.UsuarioID = u.UsuarioID
            GROUP BY u.UsuarioID, u.Nombre
            ORDER BY total_prestamos DESC
        """, limite)
    else:
        # Estructura antigua: Prestamos tiene UsuarioID directamente
        cursor.execute("""
            SELECT TOP (?)
                u.Nombre,
                COUNT(p.PrestamoID) as total_prestamos
            FROM Prestamos p
            INNER JOIN Usuarios u ON p.UsuarioID = u.UsuarioID
            GROUP BY u.UsuarioID, u.Nombre
            ORDER BY total_prestamos DESC
        """, limite)
    
    resultados = []
    for row in cursor.fetchall():
        resultados.append({
            'nombre': row[0],
            'prestamos': row[1]
        })
    
    return resultados

def reporte_estadisticas_por_rol(conn):
    """Reporte 5: Estadísticas por Rol"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT 
            Rol,
            COUNT(*) as cantidad
        FROM Usuarios
        WHERE Estado = 1
        GROUP BY Rol
        ORDER BY cantidad DESC
    """)
    
    resultados = []
    for row in cursor.fetchall():
        resultados.append({
            'rol': row[0],
            'cantidad': row[1]
        })
    
    return resultados

def reporte_actividad_diaria(conn, fecha=None):
    """Reporte 6: Actividad Diaria"""
    if fecha is None:
        fecha = datetime.now().date()
    else:
        fecha = fecha.date() if isinstance(fecha, datetime) else fecha
    
    cursor = conn.cursor()
    
    # Préstamos hoy
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos
        WHERE CAST(FechaPrestamo AS DATE) = ?
    """, fecha)
    prestamos_hoy = cursor.fetchone()[0]
    
    # Devoluciones hoy
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos
        WHERE CAST(FechaDevolucion AS DATE) = ?
    """, fecha)
    devoluciones_hoy = cursor.fetchone()[0]
    
    # Multas generadas hoy
    cursor.execute("""
        SELECT COUNT(*) FROM Multas
        WHERE CAST(FechaCobro AS DATE) = ?
    """, fecha)
    multas_generadas_hoy = cursor.fetchone()[0]
    
    # Multas pagadas hoy
    cursor.execute("""
        SELECT COUNT(*) FROM Multas
        WHERE Estado = 'Pagada' AND CAST(FechaCobro AS DATE) = ?
    """, fecha)
    multas_pagadas_hoy = cursor.fetchone()[0]
    
    return {
        'fecha': str(fecha),
        'prestamos_hoy': prestamos_hoy,
        'devoluciones_hoy': devoluciones_hoy,
        'multas_generadas_hoy': multas_generadas_hoy,
        'multas_pagadas_hoy': multas_pagadas_hoy
    }

def reporte_rendimiento_biblioteca(conn, meses=6):
    """Reporte 7: Rendimiento de Biblioteca"""
    fecha_inicio = datetime.now() - timedelta(days=meses*30)
    
    cursor = conn.cursor()
    
    # Total préstamos
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos
        WHERE FechaPrestamo >= ?
    """, fecha_inicio)
    total_prestamos = cursor.fetchone()[0]
    
    # Préstamos completados
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos
        WHERE FechaPrestamo >= ? AND Estado = 'Devuelto'
    """, fecha_inicio)
    prestamos_completados = cursor.fetchone()[0]
    
    # Préstamos vencidos
    cursor.execute("""
        SELECT COUNT(*) FROM Prestamos
        WHERE FechaPrestamo >= ? AND (Estado = 'Atrasado' OR (Estado = 'Prestado' AND FechaVencimiento < GETDATE()))
    """, fecha_inicio)
    prestamos_vencidos = cursor.fetchone()[0]
    
    # Multas
    cursor.execute("""
        SELECT COUNT(*), ISNULL(SUM(Monto), 0) FROM Multas
        WHERE FechaCobro >= ?
    """, fecha_inicio)
    row = cursor.fetchone()
    total_multas = row[0]
    monto_total_multas = float(row[1]) if row[1] else 0.0
    
    # Multas pagadas
    cursor.execute("""
        SELECT COUNT(*) FROM Multas
        WHERE FechaCobro >= ? AND Estado = 'Pagada'
    """, fecha_inicio)
    multas_pagadas = cursor.fetchone()[0]
    
    tasa_devolucion = (prestamos_completados / total_prestamos * 100) if total_prestamos > 0 else 0
    tasa_pago_multas = (multas_pagadas / total_multas * 100) if total_multas > 0 else 0
    
    return {
        'periodo': f'{meses} meses',
        'fecha_inicio': str(fecha_inicio.date()),
        'fecha_fin': str(datetime.now().date()),
        'total_prestamos': total_prestamos,
        'prestamos_completados': prestamos_completados,
        'prestamos_vencidos': prestamos_vencidos,
        'tasa_devolucion': round(tasa_devolucion, 2),
        'total_multas': total_multas,
        'monto_total_multas': round(monto_total_multas, 2),
        'multas_pagadas': multas_pagadas,
        'tasa_pago_multas': round(tasa_pago_multas, 2)
    }

def imprimir_reporte_1(datos):
    """Imprimir Reporte 1: Estadísticas Generales"""
    print("\n" + "="*60)
    print("[REPORTE 1] ESTADISTICAS GENERALES")
    print("="*60)
    print(f"  Total de Usuarios:        {datos['total_usuarios']:,}")
    print(f"  Total de Libros:          {datos['total_libros']:,}")
    print(f"  Total de Ejemplares:      {datos['total_ejemplares']:,}")
    print(f"  Préstamos Activos:        {datos['prestamos_activos']:,}")
    print(f"  Préstamos Vencidos:       {datos['prestamos_vencidos']:,}")
    print(f"  Multas Pendientes:        {datos['multas_pendientes']:,}")
    print(f"  Monto Total Multas:       S/ {datos['monto_total_multas']:,.2f}")

def imprimir_reporte_2(datos, año):
    """Imprimir Reporte 2: Préstamos por Mes"""
    print("\n" + "="*60)
    print(f"[REPORTE 2] PRESTAMOS POR MES ({año})")
    print("="*60)
    total = sum(datos.values())
    for mes, cantidad in datos.items():
        barra = "█" * int(cantidad / max(total, 1) * 50) if total > 0 else ""
        print(f"  {mes:3s}: {cantidad:4d} {barra}")
    print(f"\n  Total anual: {total:,} préstamos")

def imprimir_reporte_3(datos):
    """Imprimir Reporte 3: Libros Más Prestados"""
    print("\n" + "="*60)
    print("[REPORTE 3] LIBROS MAS PRESTADOS")
    print("="*60)
    for i, libro in enumerate(datos, 1):
        print(f"  {i:2d}. {libro['titulo'][:50]:50s} - {libro['prestamos']:3d} préstamos")

def imprimir_reporte_4(datos):
    """Imprimir Reporte 4: Usuarios Más Activos"""
    print("\n" + "="*60)
    print("[REPORTE 4] USUARIOS MAS ACTIVOS")
    print("="*60)
    for i, usuario in enumerate(datos, 1):
        print(f"  {i:2d}. {usuario['nombre'][:45]:45s} - {usuario['prestamos']:3d} préstamos")

def imprimir_reporte_5(datos):
    """Imprimir Reporte 5: Estadísticas por Rol"""
    print("\n" + "="*60)
    print("[REPORTE 5] ESTADISTICAS POR ROL")
    print("="*60)
    total = sum(r['cantidad'] for r in datos)
    for rol in datos:
        porcentaje = (rol['cantidad'] / total * 100) if total > 0 else 0
        print(f"  {rol['rol']:20s}: {rol['cantidad']:4d} ({porcentaje:5.1f}%)")

def imprimir_reporte_6(datos):
    """Imprimir Reporte 6: Actividad Diaria"""
    print("\n" + "="*60)
    print("[REPORTE 6] ACTIVIDAD DIARIA")
    print("="*60)
    print(f"  Fecha:                    {datos['fecha']}")
    print(f"  Préstamos hoy:            {datos['prestamos_hoy']:,}")
    print(f"  Devoluciones hoy:        {datos['devoluciones_hoy']:,}")
    print(f"  Multas generadas hoy:    {datos['multas_generadas_hoy']:,}")
    print(f"  Multas pagadas hoy:      {datos['multas_pagadas_hoy']:,}")

def imprimir_reporte_7(datos):
    """Imprimir Reporte 7: Rendimiento de Biblioteca"""
    print("\n" + "="*60)
    print("[REPORTE 7] RENDIMIENTO DE BIBLIOTECA")
    print("="*60)
    print(f"  Período:                  {datos['periodo']}")
    print(f"  Fecha inicio:             {datos['fecha_inicio']}")
    print(f"  Fecha fin:                {datos['fecha_fin']}")
    print(f"  Total préstamos:          {datos['total_prestamos']:,}")
    print(f"  Préstamos completados:    {datos['prestamos_completados']:,}")
    print(f"  Préstamos vencidos:       {datos['prestamos_vencidos']:,}")
    print(f"  Tasa de devolución:       {datos['tasa_devolucion']:.2f}%")
    print(f"  Total multas:             {datos['total_multas']:,}")
    print(f"  Monto total multas:       S/ {datos['monto_total_multas']:,.2f}")
    print(f"  Multas pagadas:           {datos['multas_pagadas']:,}")
    print(f"  Tasa de pago multas:      {datos['tasa_pago_multas']:.2f}%")

def guardar_json(todos_reportes, archivo='reportes_biblioteca.json'):
    """Guardar todos los reportes en formato JSON"""
    with open(archivo, 'w', encoding='utf-8') as f:
        json.dump(todos_reportes, f, indent=2, ensure_ascii=False, default=str)
    print(f"\n[GUARDADO] Reportes guardados en: {archivo}")

def main():
    """Función principal"""
    print("="*60)
    print("GENERADOR DE REPORTES - BIBLIOTECA FISI")
    print("="*60)
    print(f"\nConectando a {SERVIDOR} - Base de datos: {BASE_DATOS}...")
    
    conn = conectar_bd()
    print("[OK] Conexion exitosa!\n")
    
    try:
        # Generar todos los reportes
        print("Generando reportes...")
        
        r1 = reporte_estadisticas_generales(conn)
        año_actual = datetime.now().year
        r2 = reporte_prestamos_por_mes(conn, año_actual)
        r3 = reporte_libros_mas_prestados(conn, 10)
        r4 = reporte_usuarios_mas_activos(conn, 10)
        r5 = reporte_estadisticas_por_rol(conn)
        r6 = reporte_actividad_diaria(conn)
        r7 = reporte_rendimiento_biblioteca(conn, 6)
        
        # Imprimir todos los reportes
        imprimir_reporte_1(r1)
        imprimir_reporte_2(r2, año_actual)
        imprimir_reporte_3(r3)
        imprimir_reporte_4(r4)
        imprimir_reporte_5(r5)
        imprimir_reporte_6(r6)
        imprimir_reporte_7(r7)
        
        # Guardar en JSON
        todos_reportes = {
            'fecha_generacion': datetime.now().isoformat(),
            'estadisticas_generales': r1,
            'prestamos_por_mes': r2,
            'libros_mas_prestados': r3,
            'usuarios_mas_activos': r4,
            'estadisticas_por_rol': r5,
            'actividad_diaria': r6,
            'rendimiento_biblioteca': r7
        }
        
        guardar_json(todos_reportes)
        
        print("\n" + "="*60)
        print("[OK] TODOS LOS REPORTES GENERADOS EXITOSAMENTE")
        print("="*60)
        
    except Exception as e:
        print(f"\n[ERROR] Error al generar reportes: {e}")
        import traceback
        traceback.print_exc()
    finally:
        conn.close()

if __name__ == "__main__":
    main()






