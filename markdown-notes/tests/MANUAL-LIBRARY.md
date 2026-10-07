# Pruebas manuales — biblioteca y chat de origen

Estas pruebas requieren **Chrome o Edge de escritorio**, Tampermonkey y dos conversaciones reales de ChatGPT con URL `/c/<id>`. Utiliza una **carpeta temporal** y copias de archivos: vincular/desvincular modifica metadatos del archivo local.

## Flujo principal

1. Instala la versión de la rama `feat/link-existing-notes-to-chats` (Markdown Notes 1.9.0) y recarga ChatGPT.
2. Abre el chat **A**, selecciona la carpeta de pruebas, escribe una nota nueva con nombre explícito y guarda el archivo `.md`.
   - Comprueba que su front matter incluye `chat_id` y `chat_url` del chat A.
3. Abre el chat **B**, escribe un borrador sin guardarlo en archivo y pulsa **Biblioteca**.
   - Comprueba que se listan los `.md` de la carpeta, sin escanear subcarpetas.
   - Selecciona el archivo de A; el visor debe mostrar su contenido y un enlace al chat A.
4. Pulsa **Vincular a este chat**.
   - Comprueba que `linked_chat_urls` contiene la URL de B sin alterar el `chat_url` original de A.
   - Cierra y recarga B: la nota sigue figurando como vinculada.
   - Vuelve al editor: el borrador de B debe estar intacto.
5. Desde B, pulsa **Desvincular**.
   - El archivo sigue en disco, se elimina únicamente el enlace a B y conserva los metadatos de A.
6. Vincula el mismo archivo desde un **tercer chat C** y vuelve a B.
   - La asociación de C no debe borrarse al operar desde B.

## Compatibilidad y errores

- **Nota antigua:** coloca un `.md` con `chat_id` y `chat_url` previos. Vincúlalo desde otro chat y confirma que permanecen sin cambios.
- **Markdown sin front matter:** añade un archivo `.md` plano. Al vincularlo se crean metadatos mínimos y se conserva exactamente el cuerpo original.
- **Cambio externo:** modifica el archivo con otro editor, pulsa **Actualizar archivos** y ábrelo de nuevo. El visor debe leer la versión nueva.
- **Archivo eliminado:** vincula, elimina el archivo manualmente y ábrelo en la biblioteca. Debe mostrar un error; se debe poder limpiar la referencia local con **Desvincular**.
- **Permiso revocado:** retira el permiso de la carpeta y reintenta. Debe mostrar un error y conservar los borradores.
- **Chat nuevo sin ID:** antes de que aparezca `/c/<id>`, intentar vincular debe informar que se necesita un chat guardado.
- **Cornell:** verifica que los bloques, el resumen, la vista Repaso y la persistencia siguen intactos al abrir/cerrar Biblioteca.
- **Contenido inseguro:** coloca `<script>alert('x')</script>` en el archivo; el visor debe mostrar el texto, no ejecutarlo.

## Comprobaciones de desarrollador

Desde la raíz del repositorio con Node.js instalado:
```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/metadata.test.cjs
```

El primer comando **no modifica archivos** y comprueba sintaxis JavaScript. El segundo ejecuta las pruebas unitarias del parser/actualizador de front matter: debe terminar sin pruebas fallidas. Ambos son observaciones y **no sustituyen** las pruebas de integración en el navegador con permisos reales.
