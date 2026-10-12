# Manual: elegir nota activa (Markdown Notes v1.10.0)

**Entorno:** Chrome o Edge de escritorio, Tampermonkey con `markdown-notes/chatgpt-markdown-notes.user.js`, carpeta local de pruebas. Preparar chats A y B y un nuevo chat sin ID todavía.

## Pruebas principales

1. En A, **Crear nuevo**; poner nombre `redes.md`, editar y guardar.
   - Revisar que el documento tenga `chat_id` y `chat_url` de A.
2. En B, **Elegir existente**; seleccionar `redes.md` y pulsar **Usar como nota activa**.
   - Se carga el cuerpo editable en el panel, no solo un visor.
   - Modificar texto y pulsar **Guardar cambios**; comprobar que se actualiza el mismo archivo y que el origen sigue siendo A.
3. En B, modificar texto sin guardar y recargar ChatGPT.
   - Debe mantenerse `redes.md` como documento activo junto al texto no guardado.
4. En B, con cambios no guardados, elegir **Crear nuevo** y rechazar la confirmación.
   - El borrador y archivo activo deben permanecer intactos.
5. En B, aceptar **Crear nuevo** y guardar un nombre diferente.
   - Se debe crear un archivo nuevo sin modificar `redes.md`.
6. Abrir chat nuevo SIN ID; elegir `redes.md` como activo, enviar el primer mensaje y esperar a `/c/<id>`.
   - La elección se conserva; al guardar, el chat permanente se incluye en los vínculos del documento.
7. Probar formato Cornell: crear un documento Cornell, abrirlo en otro chat, modificar un bloque y guardar.
   - La estructura canónica, cues, notas y resumen deben persistir sin duplicar encabezados.

## Seguridad y errores

8. Con el mismo archivo activo en dos chats, guardar una edición en el primero y después intentar guardar cambios antiguos en el segundo.
   - Se rechaza el segundo guardado, se informa conflicto y se conserva su borrador.
9. En un chat nuevo, escribir un nombre idéntico al de un archivo existente y pulsar Guardar.
   - El archivo antiguo no debe sobrescribirse.
10. En Biblioteca, solamente pulsar un archivo para previsualizarlo.
    - No debe cambiar el documento que estaba activo.
11. Revocar permisos o cambiar la carpeta después de seleccionar un documento.
    - Guardar debe fallar de manera explícita sin perder el borrador.
12. Abrir Markdown plano sin front matter, adoptarlo y guardar.
    - No debe asignársele falsamente un chat de origen.

## Comprobaciones de desarrollador

Desde la raíz del repositorio:

```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/active-note.test.cjs
```

Ambos son comandos de observación, no modifican el archivo. El primero comprueba sintaxis; el segundo ejecuta los tests puros de round-trip y conflicto. Su éxito no sustituye los recorridos en el navegador con el File System Access API.
