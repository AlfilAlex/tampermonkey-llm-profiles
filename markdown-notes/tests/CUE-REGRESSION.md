# Verificación del botón + Cue / Pregunta

Esta guía corresponde a `openspec/changes/preserve-cue-whitespace-scroll/`. Los casos con Chrome/Tampermonkey deben ejecutarse en una conversación real, porque una comprobación estática no puede demostrar el comportamiento del scroll del navegador.

## Objetivo
Al pulsar **+ Cue / Pregunta**, solo aparece un nuevo encabezado `### Cue: Pregunta o concepto`. El texto, las líneas en blanco y la posición de lectura de ChatGPT no cambian. El placeholder nuevo queda seleccionado para escribir.

## Prueba manual, paso a paso
1. En ChatGPT, abre una conversación suficientemente larga para desplazarte a la mitad, y deja el scroll allí.
2. Abre Markdown Notes en modo Libre. Carga o escribe una nota Cornell válida con al menos **tres líneas en blanco consecutivas** dentro de las notas y del resumen; deja el cursor en el editor.
3. Pulsa **+ Cue / Pregunta** dos veces. Comprueba que las líneas anteriores no cambiaron, aparecen dos Cues nuevos antes de `## Summary`, y queda seleccionado únicamente el Cue más reciente.
4. Sin mover el cursor en el chat, verifica que **la conversación permanece en la misma posición**. El contenido interno del textarea puede desplazarse hasta la nueva pregunta, pero la página no debe saltar hacia arriba.
5. Escribe un documento Libre sin estructura Cornell con sangrías y múltiples líneas en blanco. Pulsa **+ Cue / Pregunta** y comprueba que todo el texto original sigue presente sin normalizar.
6. Recarga la conversación **después de esperar a que persista el borrador**, sin guardar archivo. Comprueba que se restauran las líneas en blanco y los Cues agregados.
7. Opcional: prueba un archivo con CRLF y un fragmento de código delimitado que contenga la cadena `## Summary` para verificar que no se inserta el Cue en el lugar equivocado.

## Verificación con Node.js
Desde la raíz del repositorio, con Node.js instalado:

```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/cue-whitespace-scroll.test.cjs
```

Ambos comandos son **de observación**: comprueban sintaxis y los escenarios de regresión sin modificar notas ni configuración. `node --test` debe terminar sin fallos. El scroll real y el comportamiento del foco deben validarse manualmente en el navegador.
