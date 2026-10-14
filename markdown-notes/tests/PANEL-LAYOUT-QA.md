# QA manual — posiciones del panel Markdown Notes v1.12.0

## Alcance
Un único panel que se expande en posición **Lateral**, **Abajo** o
**Flotante**, tanto en ChatGPT como en Udemy. Ninguna operación de
posicionamiento debe crear archivos, alterar borradores o controlar videos.

**Requisitos:** Chrome/Edge de escritorio y Tampermonkey con
`markdown-notes/chatgpt-markdown-notes.user.js` de esta rama.
Utiliza una conversación de ChatGPT y un video de Udemy reconocible;
realiza pruebas con una carpeta de notas de prueba.

## Escenarios

1. Abre Markdown Notes y comprueba que aparece el selector **Posición**,
   inicialmente en **Lateral** para una instalación sin preferencias.
   Arrastra el borde izquierdo para ajustar anchura.
2. Escribe algunas líneas sin guardarlas en archivo. Selecciona **Abajo**:
   se debe desplazar al pie de la ventana sin borrar el texto, cambiar
   el modo de nota ni perder la selección de documento.
3. Arrastra el borde superior del panel inferior para modificar su altura.
   El editor, el botón Guardar, y los controles de la biblioteca deben
   permanecer utilizables.
4. En ChatGPT, comprueba que el área del chat reserva espacio inferior en
   vez de seguir reservándolo a la derecha.
5. Selecciona **Flotante**; usa el botón **Mover** de la cabecera para
   arrastrar el panel. Verifica que no se sale de la pantalla y que
   hacer clic/seleccionar texto en el editor no mueve el panel.
6. Con el botón **Mover** enfocado usa las flechas y Mayús+flecha.
   La ventana debe desplazarse en pasos pequeños/grandes.
7. Arrastra la esquina inferior derecha flotante para cambiar anchura y
   altura sin perder acceso al botón Cerrar o Guardar.
8. Cierra y vuelve a abrir; recarga y cambia a otro chat/video.
   Deben conservarse modo y dimensiones y el borrador correspondiente.
9. Reduce el ancho del navegador por debajo de 901 px: debe mostrarse un
   diseño compacto accesible sin perder la preferencia de escritorio.
   Restaura el ancho y comprueba que vuelve el modo seleccionado.
10. En Udemy, prueba que el panel puede apartarse de los controles del video
    y que no pausa, adelanta ni cambia su reproducción.
11. Alterna entre Libre, Cornell, Repaso y la Biblioteca estando en cada
    posición. Comprueba que Guardar, Elegir existente y vista previa
    funcionan sin reconstruir ni borrar el editor.

## Verificación con Node.js

Desde la raíz del repositorio (comandos de **observación**, no modifican notas):

```bash
node --check markdown-notes/chatgpt-markdown-notes.user.js
node --test markdown-notes/tests/panel-layouts.test.cjs
```

El primero analiza la sintaxis JavaScript del userscript y el segundo ejecuta
pruebas de validación de tamaños y presencia de interacciones. Si fallan,
revisar el detalle del error sin asumir que un error aislado explica el
comportamiento del navegador.

## Límites
Las pruebas de sintaxis y cálculo no demuestran que el panel no tape controles
de Udemy ni que preserve el scroll de ChatGPT. Los once escenarios
anteriores siguen requiriendo una sesión real de navegador.
