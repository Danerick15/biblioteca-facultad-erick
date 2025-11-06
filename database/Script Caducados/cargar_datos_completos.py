#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script para cargar TODOS los datos a la base de datos
- Libros
- Autores (con limpieza de duplicados similares)
- Categorías
- Relaciones Libro-Autor (con reparación automática)
- Relaciones Libro-Categoría
- Ejemplares
- Limpieza de libros huérfanos (sin ejemplares y sin autores)

FUNCIONALIDADES AUTOMÁTICAS:
- Elimina autores duplicados similares (diferencias de acentos/mayúsculas)
- Repara relaciones libro-autor después de limpiar duplicados
- Garantiza que todos los libros tengan autores y ejemplares
"""

import pyodbc
import pandas as pd
from difflib import SequenceMatcher
import re
import unicodedata

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

def similitud_texto(a, b):
    """Calcular similitud entre dos textos"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def limpiar_texto(texto):
    """Limpiar texto para evitar caracteres problemáticos"""
    if pd.isna(texto) or texto is None:
        return None
    return str(texto).strip()

def normalizar_nombre(nombre):
    """Normalizar nombre para comparación de duplicados"""
    if pd.isna(nombre) or nombre is None:
        return ""
    nombre = str(nombre).lower()
    nombre = unicodedata.normalize('NFD', nombre).encode('ascii', 'ignore').decode('ascii')
    nombre = re.sub(r'\s+', ' ', nombre).strip()
    return nombre

def cargar_datos_completos():
    """Cargar todos los datos a la base de datos"""
    conn = conectar_bd()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Limpiar datos existentes
        print("Limpiando datos existentes...")
        cursor.execute("DELETE FROM Ejemplares")
        cursor.execute("DELETE FROM LibroCategorias")
        cursor.execute("DELETE FROM LibroAutores")
        cursor.execute("DELETE FROM Libros")
        cursor.execute("DELETE FROM Autores")
        cursor.execute("DELETE FROM Categorias")
        conn.commit()
        print("Datos limpiados")
        
        # Leer CSV
        print("Leyendo CSV...")
        df = pd.read_csv('CATALOGO DE LIBROS FISI RC.csv', sep=';', encoding='utf-8')
        print(f"CSV leído: {len(df)} filas")
        
        # 1. CREAR AUTORES ÚNICOS
        print("Creando autores...")
        autores_unicos_csv = df['Autor'].dropna().unique()
        autores_dict = {}
        autores_creados = 0
        
        for autor_csv_completo in autores_unicos_csv:
            # Dividir por comas y limpiar cada autor individual
            autores_en_esta_fila = [a.strip() for a in str(autor_csv_completo).split(',') if a.strip()]
            for autor_individual in autores_en_esta_fila:
                autor_limpio = limpiar_texto(autor_individual)
                if autor_limpio and len(autor_limpio) > 0 and autor_limpio not in autores_dict:
                    try:
                        cursor.execute("""
                            INSERT INTO Autores (Nombre, Biografia, ORCID)
                            VALUES (?, ?, ?)
                        """, (autor_limpio, None, f"ORCID{autores_creados + 1:06d}"))
                        
                        autor_id = cursor.lastrowid if hasattr(cursor, 'lastrowid') else None
                        if autor_id is None:
                            cursor.execute("SELECT @@IDENTITY")
                            autor_id = cursor.fetchone()[0]
                        
                        autores_dict[autor_limpio] = autor_id
                        autores_creados += 1
                        
                        if autores_creados % 100 == 0:
                            print(f"  Autores creados: {autores_creados}")
                            
                    except Exception as e:
                        print(f"Error insertando autor '{autor_limpio}': {e}")
                        continue
        
        print(f"Autores creados: {len(autores_dict)}")
        
        # 1.5. LIMPIAR AUTORES DUPLICADOS SIMILARES
        print("Limpiando autores duplicados similares...")
        cursor.execute("SELECT AutorID, Nombre FROM Autores ORDER BY AutorID")
        todos_autores = cursor.fetchall()
        
        autores_eliminados = 0
        autores_a_eliminar = []
        
        for i, autor1 in enumerate(todos_autores):
            if autor1[0] in autores_a_eliminar:
                continue
                
            nombre1_normalizado = normalizar_nombre(autor1[1])
            
            for j, autor2 in enumerate(todos_autores[i+1:], i+1):
                if autor2[0] in autores_a_eliminar:
                    continue
                    
                nombre2_normalizado = normalizar_nombre(autor2[1])
                
                if nombre1_normalizado == nombre2_normalizado and nombre1_normalizado != "":
                    print(f"  Duplicado encontrado: '{autor1[1]}' (ID {autor1[0]}) y '{autor2[1]}' (ID {autor2[0]})")
                    autores_a_eliminar.append(autor2[0])
                    autores_eliminados += 1
        
        # Eliminar autores duplicados
        for autor_id in autores_a_eliminar:
            cursor.execute("DELETE FROM Autores WHERE AutorID = ?", (autor_id,))
        
        if autores_eliminados > 0:
            conn.commit()
            print(f"✅ Autores duplicados eliminados: {autores_eliminados}")
            
            # Actualizar el diccionario de autores después de eliminar duplicados
            cursor.execute("SELECT AutorID, Nombre FROM Autores ORDER BY AutorID")
            autores_actualizados = cursor.fetchall()
            autores_dict = {autor[1]: autor[0] for autor in autores_actualizados}
            print(f"  Diccionario de autores actualizado: {len(autores_dict)} autores")
        else:
            print("✅ No se encontraron autores duplicados")
        
        # 2. CREAR CATEGORÍAS ÚNICAS
        print("Creando categorías...")
        categorias_unicas = df['LCCSeccion'].dropna().unique()
        categorias_dict = {}
        
        for categoria in categorias_unicas:
            categoria_limpia = limpiar_texto(categoria)
            if categoria_limpia and len(categoria_limpia) > 0:
                try:
                    cursor.execute("""
                        INSERT INTO Categorias (Nombre)
                        VALUES (?)
                    """, (categoria_limpia,))
                    categoria_id = cursor.lastrowid if hasattr(cursor, 'lastrowid') else None
                    if categoria_id is None:
                        cursor.execute("SELECT @@IDENTITY")
                        categoria_id = cursor.fetchone()[0]
                    categorias_dict[categoria_limpia] = categoria_id
                except Exception as e:
                    if "duplicate key" in str(e).lower():
                        # Si ya existe, obtener su ID
                        cursor.execute("SELECT CategoriaID FROM Categorias WHERE Nombre = ?", (categoria_limpia,))
                        result = cursor.fetchone()
                        if result:
                            categorias_dict[categoria_limpia] = result[0]
                    else:
                        print(f"Error insertando categoría '{categoria_limpia}': {e}")
                        continue
        
        print(f"Categorías creadas: {len(categorias_dict)}")
        
        # 3. CREAR LIBROS ÚNICOS
        print("Creando libros...")
        # CORRECCIÓN: Usar todas las columnas bibliográficas como clave de agrupación
        columnas_bibliograficas = ['TITULO', 'Autor', 'Año', 'LCCSeccion', 'LCCNumero', 'LCCCutter']
        libros_unicos = df.drop_duplicates(subset=columnas_bibliograficas).reset_index(drop=True)
        libros_dict = {}
        
        for index, row in libros_unicos.iterrows():
            titulo = limpiar_texto(row['TITULO'])
            try:
                anio = int(row['Año']) if pd.notna(row['Año']) and str(row['Año']).strip() != '' else None
                # Validar que el año esté en un rango razonable
                if anio and (anio < 1800 or anio > 2030):
                    anio = None
            except (ValueError, TypeError):
                anio = None
            lcc_seccion = limpiar_texto(row['LCCSeccion'])
            lcc_numero = limpiar_texto(row['LCCNumero'])
            lcc_cutter = limpiar_texto(row['LCCCutter'])
            
            if titulo and len(titulo) > 0:
                cursor.execute("""
                    INSERT INTO Libros (ISBN, Titulo, Editorial, AnioPublicacion, Idioma, Paginas, 
                                      LCCSeccion, LCCNumero, LCCCutter)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    None,  # ISBN
                    titulo,
                    None,  # Editorial
                    anio,
                    'Español',  # Idioma por defecto
                    None,  # Páginas
                    lcc_seccion,
                    lcc_numero,
                    lcc_cutter
                ))
                
                libro_id = cursor.lastrowid if hasattr(cursor, 'lastrowid') else None
                if libro_id is None:
                    cursor.execute("SELECT @@IDENTITY")
                    libro_id = cursor.fetchone()[0]
                # Crear clave única para este libro usando todas las columnas bibliográficas
                clave_libro = f"{titulo.lower()}|{row['Autor']}|{anio}|{lcc_seccion}|{lcc_numero}|{lcc_cutter}"
                libros_dict[clave_libro] = libro_id
        
        print(f"Libros creados: {len(libros_dict)}")
        
        # 4. CREAR RELACIONES LIBRO-AUTOR
        print("Creando relaciones libro-autor...")
        relaciones_libro_autor = 0
        
        for index, row in df.iterrows():
            titulo = limpiar_texto(row['TITULO'])
            try:
                anio = int(row['Año']) if pd.notna(row['Año']) and str(row['Año']).strip() != '' else None
                if anio and (anio < 1800 or anio > 2030):
                    anio = None
            except (ValueError, TypeError):
                anio = None
            lcc_seccion = limpiar_texto(row['LCCSeccion'])
            lcc_numero = limpiar_texto(row['LCCNumero'])
            lcc_cutter = limpiar_texto(row['LCCCutter'])
            
            # Crear la misma clave única para buscar en libros_dict
            clave_libro = f"{titulo.lower()}|{row['Autor']}|{anio}|{lcc_seccion}|{lcc_numero}|{lcc_cutter}"
            
            if clave_libro in libros_dict:
                libro_id = libros_dict[clave_libro]
                autor_csv_completo = limpiar_texto(row['Autor'])
                autores_individuales = [a.strip() for a in autor_csv_completo.split(',') if a.strip()]
                
                for autor_individual in autores_individuales:
                    if autor_individual in autores_dict:
                        autor_id = autores_dict[autor_individual]
                        
                        # Verificar si la relación ya existe
                        cursor.execute("""
                            SELECT COUNT(*) FROM LibroAutores 
                            WHERE LibroID = ? AND AutorID = ?
                        """, (libro_id, autor_id))
                        
                        if cursor.fetchone()[0] == 0:
                            cursor.execute("""
                                INSERT INTO LibroAutores (LibroID, AutorID)
                                VALUES (?, ?)
                            """, (libro_id, autor_id))
                            relaciones_libro_autor += 1
        
        print(f"Relaciones libro-autor creadas: {relaciones_libro_autor}")
        
        # 4.5. ARREGLAR RELACIONES LIBRO-AUTOR DESPUÉS DE LIMPIAR DUPLICADOS
        print("Arreglando relaciones libro-autor después de limpiar duplicados...")
        
        # Encontrar libros sin autores
        cursor.execute("""
            SELECT l.LibroID, l.Titulo, l.AnioPublicacion
            FROM Libros l
            LEFT JOIN LibroAutores la ON l.LibroID = la.LibroID
            WHERE la.LibroID IS NULL
        """)
        libros_sin_autores = cursor.fetchall()
        
        if libros_sin_autores:
            print(f"  Libros sin autores encontrados: {len(libros_sin_autores)}")
            
            # Obtener autores actuales
            cursor.execute("SELECT AutorID, Nombre FROM Autores ORDER BY AutorID")
            autores_actuales = cursor.fetchall()
            autores_dict_actualizado = {normalizar_nombre(autor[1]): autor[0] for autor in autores_actuales}
            
            relaciones_agregadas = 0
            
            for libro in libros_sin_autores:
                libro_id = libro[0]
                titulo = libro[1]
                anio = libro[2]
                
                # Buscar en el CSV por título y año
                filas_coincidentes = df[
                    (df['TITULO'].str.strip().str.lower() == titulo.lower()) &
                    (df['Año'] == anio)
                ]
                
                if not filas_coincidentes.empty:
                    fila = filas_coincidentes.iloc[0]
                    autor_csv = str(fila['Autor']).strip()
                    autores_individuales = [a.strip() for a in autor_csv.split(',') if a.strip()]
                    
                    for autor_individual in autores_individuales:
                        autor_normalizado = normalizar_nombre(autor_individual)
                        
                        if autor_normalizado in autores_dict_actualizado:
                            autor_id = autores_dict_actualizado[autor_normalizado]
                            
                            # Verificar si la relación ya existe
                            cursor.execute("""
                                SELECT COUNT(*) FROM LibroAutores 
                                WHERE LibroID = ? AND AutorID = ?
                            """, (libro_id, autor_id))
                            
                            if cursor.fetchone()[0] == 0:
                                cursor.execute("""
                                    INSERT INTO LibroAutores (LibroID, AutorID)
                                    VALUES (?, ?)
                                """, (libro_id, autor_id))
                                relaciones_agregadas += 1
            
            if relaciones_agregadas > 0:
                conn.commit()
                print(f"  ✅ Relaciones libro-autor agregadas: {relaciones_agregadas}")
            else:
                print("  ✅ No se necesitaron relaciones adicionales")
        else:
            print("  ✅ Todos los libros ya tienen autores")
        
        # 5. CREAR RELACIONES LIBRO-CATEGORÍA
        print("Creando relaciones libro-categoría...")
        relaciones_libro_categoria = 0
        
        for index, row in df.iterrows():
            titulo = limpiar_texto(row['TITULO'])
            try:
                anio = int(row['Año']) if pd.notna(row['Año']) and str(row['Año']).strip() != '' else None
                if anio and (anio < 1800 or anio > 2030):
                    anio = None
            except (ValueError, TypeError):
                anio = None
            lcc_seccion = limpiar_texto(row['LCCSeccion'])
            lcc_numero = limpiar_texto(row['LCCNumero'])
            lcc_cutter = limpiar_texto(row['LCCCutter'])
            clave_libro = f"{titulo.lower()}|{row['Autor']}|{anio}|{lcc_seccion}|{lcc_numero}|{lcc_cutter}"
            categoria = limpiar_texto(row['LCCSeccion'])
            
            if clave_libro in libros_dict and categoria in categorias_dict:
                libro_id = libros_dict[clave_libro]
                categoria_id = categorias_dict[categoria]
                
                # Verificar si la relación ya existe
                cursor.execute("""
                    SELECT COUNT(*) FROM LibroCategorias 
                    WHERE LibroID = ? AND CategoriaID = ?
                """, (libro_id, categoria_id))
                
                if cursor.fetchone()[0] == 0:
                    cursor.execute("""
                        INSERT INTO LibroCategorias (LibroID, CategoriaID)
                        VALUES (?, ?)
                    """, (libro_id, categoria_id))
                    relaciones_libro_categoria += 1
        
        print(f"Relaciones libro-categoría creadas: {relaciones_libro_categoria}")
        
        # 6. CREAR EJEMPLARES
        print("Creando ejemplares...")
        ejemplares_por_libro = {}
        ejemplares_creados = 0
        
        for index, row in df.iterrows():
            titulo = limpiar_texto(row['TITULO'])
            try:
                anio = int(row['Año']) if pd.notna(row['Año']) and str(row['Año']).strip() != '' else None
                if anio and (anio < 1800 or anio > 2030):
                    anio = None
            except (ValueError, TypeError):
                anio = None
            lcc_seccion = limpiar_texto(row['LCCSeccion'])
            lcc_numero = limpiar_texto(row['LCCNumero'])
            lcc_cutter = limpiar_texto(row['LCCCutter'])
            clave_libro = f"{titulo.lower()}|{row['Autor']}|{anio}|{lcc_seccion}|{lcc_numero}|{lcc_cutter}"
            ejemplar_num = int(row['Ejemplar']) if pd.notna(row['Ejemplar']) else 1
            observaciones = limpiar_texto(row['Observaciones'])
            
            if clave_libro in libros_dict:
                libro_id = libros_dict[clave_libro]
                
                # Inicializar contador para este libro si no existe
                if libro_id not in ejemplares_por_libro:
                    ejemplares_por_libro[libro_id] = set()
                
                # Si el número de ejemplar ya existe, incrementarlo
                while ejemplar_num in ejemplares_por_libro[libro_id]:
                    ejemplar_num += 1
                
                ejemplares_por_libro[libro_id].add(ejemplar_num)
                
                # Generar código de barras único
                try:
                    codigo_barras = f"FISI{int(libro_id):06d}{int(ejemplar_num):03d}"
                except (ValueError, TypeError) as e:
                    print(f"Error generando código de barras para libro {libro_id}, ejemplar {ejemplar_num}: {e}")
                    continue
                
                # Insertar ejemplar
                cursor.execute("""
                    INSERT INTO Ejemplares (LibroID, NumeroEjemplar, CodigoBarras, Ubicacion, Estado, FechaAlta, Observaciones)
                    VALUES (?, ?, ?, ?, ?, GETDATE(), ?)
                """, (
                    libro_id,
                    ejemplar_num,
                    codigo_barras,
                    'Estante Principal',
                    'Disponible',
                    observaciones
                ))
                
                ejemplares_creados += 1
                
                if ejemplares_creados % 100 == 0:
                    print(f"Ejemplares creados: {ejemplares_creados}")
        
        conn.commit()
        
        # 7. LIMPIAR LIBROS HUÉRFANOS
        print("\n=== LIMPIEZA DE LIBROS HUÉRFANOS ===")
        
        # Encontrar libros sin ejemplares (independientemente de si tienen autores)
        cursor.execute("""
            SELECT l.LibroID, l.Titulo, l.AnioPublicacion
            FROM Libros l
            LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
            WHERE e.LibroID IS NULL
        """)
        libros_huerfanos = cursor.fetchall()
        
        if libros_huerfanos:
            print(f"Encontrados {len(libros_huerfanos)} libros huérfanos (sin ejemplares)")
            print("Ejemplos:")
            for libro in libros_huerfanos[:3]:
                print(f"  - {libro[0]}: '{libro[1]}' ({libro[2]})")
            
            # Eliminar relaciones libro-categoría de libros huérfanos
            cursor.execute("""
                DELETE FROM LibroCategorias 
                WHERE LibroID IN (
                    SELECT l.LibroID
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
                    WHERE e.LibroID IS NULL
                )
            """)
            relaciones_categoria_eliminadas = cursor.rowcount
            
            # Eliminar relaciones libro-autor de libros huérfanos
            cursor.execute("""
                DELETE FROM LibroAutores 
                WHERE LibroID IN (
                    SELECT l.LibroID
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
                    WHERE e.LibroID IS NULL
                )
            """)
            relaciones_autor_eliminadas = cursor.rowcount
            
            # Eliminar libros huérfanos
            cursor.execute("""
                DELETE FROM Libros 
                WHERE LibroID IN (
                    SELECT l.LibroID
                    FROM Libros l
                    LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
                    WHERE e.LibroID IS NULL
                )
            """)
            libros_eliminados = cursor.rowcount
            
            conn.commit()
            print(f"✅ Libros huérfanos eliminados: {libros_eliminados}")
            print(f"✅ Relaciones libro-categoría eliminadas: {relaciones_categoria_eliminadas}")
            print(f"✅ Relaciones libro-autor eliminadas: {relaciones_autor_eliminadas}")
        else:
            print("✅ No se encontraron libros huérfanos")
        
        print("\n=== RESUMEN FINAL ===")
        print(f"[OK] Autores: {len(autores_dict)}")
        print(f"[OK] Categorías: {len(categorias_dict)}")
        print(f"[OK] Libros: {len(libros_dict)}")
        print(f"[OK] Relaciones libro-autor: {relaciones_libro_autor}")
        print(f"[OK] Relaciones libro-categoría: {relaciones_libro_categoria}")
        print(f"[OK] Ejemplares: {ejemplares_creados}")
        
        # Verificar algunos ejemplos
        print("\n=== VERIFICACIÓN FINAL ===")
        cursor.execute("SELECT COUNT(*) FROM Autores")
        print(f"Total autores en BD: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM Categorias")
        print(f"Total categorías en BD: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM Libros")
        print(f"Total libros en BD: {cursor.fetchone()[0]}")
        
        cursor.execute("SELECT COUNT(*) FROM Ejemplares")
        print(f"Total ejemplares en BD: {cursor.fetchone()[0]}")
        
        # Verificar que todos los libros restantes tengan ejemplares
        cursor.execute("""
            SELECT COUNT(*) FROM Libros l
            LEFT JOIN Ejemplares e ON l.LibroID = e.LibroID
            WHERE e.LibroID IS NULL
        """)
        libros_sin_ejemplares_restantes = cursor.fetchone()[0]
        
        if libros_sin_ejemplares_restantes == 0:
            print("✅ Todos los libros restantes tienen ejemplares")
        else:
            print(f"⚠️  Aún hay {libros_sin_ejemplares_restantes} libros sin ejemplares")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    print("Cargando TODOS los datos a la base de datos...")
    cargar_datos_completos()
    print("Proceso completado")
