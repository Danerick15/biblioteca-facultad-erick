Instrucciones: colocar `bg_luis5.png` en esta carpeta

Por favor copia tu archivo `bg_luis5.png` desde tu carpeta Descargas a:

frontend/frontend/public/images/bg_luis5.png

Puedes hacerlo desde PowerShell con (ajusta la ruta si tu usuario es distinto):

```powershell
Copy-Item -Path "$HOME\Downloads\bg_luis5.png" -Destination "d:\2025-2\DSW\biblioteca-facultad\frontend\frontend\public\images\bg_luis5.png"
```

Si prefieres mover el archivo manualmente, colócalo exactamente en `public/images/bg_luis5.png`.

Notas:
- El código del `Dashboard` usa `/images/bg_luis5.png` para mostrar el PNG en la parte inferior.
- Si el nombre del archivo difiere, renómbralo a `bg_luis5.png` o modifica `Dashboard.tsx` para apuntar a otro nombre.
