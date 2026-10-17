# QA — Atajos estilo VS Code (Markdown Notes v1.13.0)

## Preparación
En Chrome/Edge, actualiza el mismo userscript desde el PR y abre una
conversación de ChatGPT o un video compatible de Udemy. Este userscript carga
**CodeMirror 5.65.21** mediante `@require` y su CSS mediante `@resource`.
La instalación o actualización necesita obtener ambos recursos de cdnjs.
Permite que Tampermonkey acceda a ellos de manera normal; no ejecutes
scripts copiados manualmente desde fuentes no verificadas.

Crea una nota de prueba con estas líneas:

```text
alpha
beta beta
última
```

## Pruebas principales

1. En **Libre**, activa **Editor avanzado (multicursor)**. Debes ver
   un editor con números de línea. La preferencia debe sobrevivir recargas.
2. Selecciona `beta` y pulsa Ctrl/Cmd+D. Se deben ver dos selecciones
   independientes; escribe `gamma`: ambas deben reemplazarse.
3. Selecciona `gamma`, pulsa Ctrl/Cmd+Shift+L. Todas las coincidencias
   deben seleccionarse para edición simultánea.
4. Con Alt+clic crea otro cursor. Comprueba que escribir aplica a las
   posiciones elegidas sin duplicar el resto del documento.
5. Sin selección, coloca el cursor en `alpha` y pulsa Ctrl/Cmd+X.
   Debe eliminarse la línea completa y quedar `alpha\n` en el portapapeles.
   Prueba Ctrl/Cmd+V en la nota; debe reaparecer el texto.
6. **Con texto seleccionado**, Ctrl/Cmd+X debe cortar solo lo seleccionado.
7. Comprueba Ctrl/Cmd+Shift+K, Alt+flecha arriba/abajo y
   Shift+Alt+flecha arriba/abajo. No deben eliminarse líneas no relacionadas.
8. Usa Ctrl/Cmd+B, Ctrl/Cmd+I y Ctrl/Cmd+K y los botones de la
   barra de formato. El resultado debe ser Markdown válido.
9. Guarda a disco y comprueba que el archivo tiene todas las ediciones.
   Navega a otro chat/video; no deben mezclarse los borradores.
10. **Desactiva Editor avanzado**: el textarea habitual debe aparecer
    con exactamente el mismo texto. Alterna varias veces.
11. En **Cornell**, prueba Ctrl/Cmd+X sin selección y los comandos de
    eliminar, duplicar y mover dentro de Notes y Summary.
    Comprueba que el campo Cue no se modifica.
12. En **Repaso** y en el **compositor de ChatGPT**, los atajos de
    notas no deben interceptar los controles originales.
13. Repite Libre/Cornell y la biblioteca con los paneles
    **Lateral / Abajo / Flotante**; ningún editor debe quedar oculto
    tras un cambio de modo o tamaño.
14. En Udemy, comprueba que los atajos no alteran el video ni fuerzan scroll.
15. Simula la indisponibilidad de CodeMirror con un entorno de prueba:
    debe preservarse el editor nativo cuando el motor avanzado no arranca.

## Verificación con Node.js

Desde la raíz del repositorio, con Node.js instalado:

```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/vscode-editing.test.cjs
```

Los comandos son **solo de observación**: el primero verifica sintaxis,
el segundo comprueba operaciones puras de líneas y presencia de integración
CodeMirror. Una salida exitosa **no demuestra** que los eventos de
portapapeles ni el CSS funcionen en Chrome/Tampermonkey.

## Alcance conocido

La selección múltiple real está disponible en **Libre avanzado**.
Los campos Cornell continúan utilizando textarea y reciben los atajos
de edición de línea, no la selección múltiple simultánea.

CodeMirror 5 quedó archivado upstream en 2026 y es una dependencia
fijada por versión; documentar su mantenimiento futuro.
