# Tampermonkey LLM Profiles

Userscripts para extender ChatGPT en el navegador sin modificar el servicio en el servidor.

## Estructura del repositorio

Cada userscript es un proyecto independiente y mantiene su propio OpenSpec:

```text
.
├── prompt-profiles/
│   ├── chatgpt-prompt-profiles.user.js
│   └── openspec/
│       ├── config.yaml
│       └── changes/
└── markdown-notes/
    ├── chatgpt-markdown-notes.user.js
    └── openspec/
        ├── config.yaml
        └── changes/
```

No existe un OpenSpec compartido en la raíz: compartir repositorio no implica compartir capabilities, almacenamiento ni runtime.

## Userscripts

### ChatGPT Prompt Profiles v1.3.0

- Inyecta una base común + un perfil activo en cada mensaje.
- Perfiles principales: Troubleshooting preciso, Aprendizaje con práctica y verificación, Guía estricta de razonamiento y Evaluación autónoma.
- Permite crear perfiles adicionales desde la interfaz.
- Mantiene ON/OFF y perfil seleccionado por conversación.

### ChatGPT Markdown Notes v1.6.1

- Panel lateral de notas Markdown persistente por conversación.
- El panel está acoplado al layout en escritorio: reserva espacio y no tapa los mensajes.
- Anchura ajustable arrastrando el borde izquierdo; se conserva al recargar.
- Borrador persistente en IndexedDB.
- Modos por conversación: **Libre**, **Cornell** y **Repaso**.
- Libre, Cornell y Repaso operan sobre **una sola nota canónica**; Cornell se serializa a Markdown y Libre muestra/edita ese mismo contenido.
- Toolbar Markdown en Libre y en los campos Markdown de Cornell: negrita, cursiva, H2/H3, listas, tareas, citas, código y enlaces.
- Cornell usa bloques `cue + notas`, resumen, layout responsive y exportación Markdown portable.
- Repaso muestra un cue por vez y mantiene las notas ocultas hasta revelarlas.
- El nombre del archivo es editable, obligatorio para guardar y se conserva por conversación.
- El nombre del archivo es **obligatorio y manual**: no se puede guardar hasta escribir uno.
- **Guardar cambios** sobrescribe el target actual; si cambias el nombre, el siguiente guardado escribe el nuevo archivo sin borrar automáticamente el anterior.
- La carpeta se selecciona con File System Access API y el handle se conserva en IndexedDB.
- En pantallas de 900 px o menos vuelve a modo overlay.

Archivos actuales:

- `prompt-profiles/chatgpt-prompt-profiles.user.js`
- `markdown-notes/chatgpt-markdown-notes.user.js`

---

**Recomendación:** usa **Aprendizaje con práctica y verificación** como perfil habitual para estudiar. Combina estrategias con respaldo en ciencias del aprendizaje y decisiones informadas por ensayos de tutoría con LLM. La guía estricta sirve para practicar construyendo tu solución; la evaluación permite observar qué puedes hacer sin ayuda.

Estos textos no se han validado experimentalmente. La evidencia respalda sus componentes, con distinta fuerza, pero no demuestra que este prompt concreto sea superior ni que exista una única forma óptima de aprender con un LLM.

## Cómo usar la base y los perfiles

El mensaje de instrucciones se compone de **BASE COMÚN + UN PERFIL ACTIVO**. La base se guarda una sola vez en tu configuración; cada perfil contiene únicamente sus reglas específicas. Si tu herramienta no tiene campos separados, concatena ambos bloques en un único mensaje.

- Copia los bloques de instrucciones, sin las explicaciones científicas ni las referencias.
- Mantén un solo perfil activo. El perfil explícitamente seleccionado más reciente sustituye al anterior.
- La base no activa preguntas socráticas ni decide cuándo revelar una solución: eso pertenece al perfil.
- Las restricciones del perfil guía no se deben mezclar con una regla global que obligue a dar respuestas directas.
- Cambiar de perfil no borra las respuestas que ya viste. Para comprobar autonomía, usa un problema nuevo.
- Un perfil escrito como prompt orienta al modelo; no garantiza su cumplimiento.

| Perfil | Objetivo | Cuándo entrega la solución |
| --- | --- | --- |
| Troubleshooting preciso | Resolver un fallo mediante observaciones y pruebas. | Cuando la evidencia sustenta una corrección; puede proponer mitigaciones explícitas antes. |
| Aprendizaje con práctica y verificación — recomendado | Comprender, practicar, recuperar y aplicar con ayuda decreciente. | En explicaciones y ejemplos; durante una actividad, espera tu intento. |
| Guía estricta de razonamiento | Construir y justificar tu propia solución con apoyo. | No entrega la solución objetivo mientras siga activo; sí revisa tu propuesta. |
| Evaluación autónoma — opcional | Comprobar lo que puedes resolver sin pistas. | Después de tu intento, como retroalimentación. |



## Qué puede concluirse de la evidencia sobre LLM

Bastani [8] y Kestin [9] estudiaron intervenciones con diseños y contextos distintos. Sus resultados no permiten concluir que toda IA perjudica el aprendizaje ni que cualquier tutor con IA supera la enseñanza presencial. Tampoco aíslan el efecto de cada oración de un prompt.

Como contexto reciente, Wu et al. [10] reúnen 35 estudios experimentales y cuasiexperimentales de 2022–2024, con 4,193 participantes, y reportan un efecto agregado positivo. Los propios autores reconocen límites de selección y cobertura, y la necesidad de evaluar efectos a largo plazo. Este resultado no identifica un protocolo universal ni valida estos perfiles.

La recomendación de este documento combina **estrategias educativas con respaldo acumulado**, **evidencia directa pero acotada sobre tutores con LLM** y **decisiones de implementación**. Es importante conservar esa separación.

El metaanálisis de Wang y Fan de 2025 se mantiene excluido: la revista publicó una nota de retractación el 22 de abril de 2026 por discrepancias en el análisis [11]. No se utiliza como evidencia favorable ni como argumento contra otras investigaciones.

## Cambios aplicados respecto a la versión anterior

| Antes | Ahora | Motivo |
| --- | --- | --- |
| Cuatro prompts independientes repetían idioma, estilo, rol técnico, comandos y verificación. | Base común y cuatro módulos específicos. | Reducir repetición y evitar conflictos entre reglas globales y perfiles. |
| Enseñanza con práctica, sin destacar la calidad de la referencia para evaluar. | Aprendizaje con práctica y verificación, recomendado para estudiar. | Incorporar contenido contrastado y límites de corrección, además de práctica. |
| Ayuda decreciente descrita de forma general. | Elegir explicación o intento según conocimientos y adaptar apoyo al desempeño. | No imponer descubrimiento ni intentos sin bases. |
| Se distinguía ayuda de autonomía. | Se exige un problema nuevo tras ver respuestas o recibir pistas, y se distingue retención posterior. | Evitar atribuir aprendizaje independiente a imitación o rendimiento asistido. |
| Guía estricta presentada como una alternativa. | Se mantiene, con su límite explícito y sin atribuirle superioridad universal. | Conservar tu preferencia sin exagerar la evidencia. |
| Ensayos con IA descritos principalmente por su resultado. | Se explicitan también soluciones preparadas, estructura y contexto. | Evitar atribuir al prompt por sí solo el efecto de un sistema de tutoría completo. |

## Casos para revisar el comportamiento

Estos son criterios de diseño, no resultados de una prueba con un modelo.

| Situación | Conducta esperada |
| --- | --- |
| Una API devuelve 502 y aún faltan logs o topología. | Troubleshooting separa el síntoma de la causa y solicita el dato que cambia la siguiente prueba. |
| Un comando devuelve una salida vacía. | No se convierte automáticamente en “la hipótesis está confirmada”; se explica qué puede y no puede mostrar esa prueba. |
| Entrego resultados de tres comandos. | Se abordan las tres salidas relevantes y se actualiza la decisión. |
| No sé qué es una ruta por defecto. | Aprendizaje enseña ese prerrequisito antes de pedir predicciones que lo necesitan. |
| Se plantea una actividad de recuperación. | Se espera mi intento sin mostrar la respuesta en ese mensaje. |
| Acabo de leer una solución completa. | No se usa resolver ese mismo problema como evidencia de autonomía. |
| Mi respuesta difiere de la del tutor. | Se contrasta con criterios y evidencia, admitiendo alternativas válidas. |
| Pido la respuesta con la guía estricta activa. | Se conserva el límite y se ofrece apoyo útil o un cambio explícito de perfil. |
| Digo que desactivo la guía y quiero la solución. | Se respeta el cambio. |
| Repito un error o estoy bloqueado. | Se cambia el apoyo o se enseña un prerrequisito; no se repite indefinidamente la misma pregunta. |
| Resuelvo después de una pista. | Evaluación registra ayuda y utiliza después otra tarea para observar autonomía. |
| Regreso a estudiar en otra sesión. | Se propone recuperar algo importante antes de volver a explicarlo. |

## Referencias

[1] Kang, S., Chen, B., Yoo, S. y Lou, J.-G. (2025; publicación en línea en 2024). *Explainable automated debugging via large language model-driven scientific debugging*. Empirical Software Engineering, 30, 45. [Artículo](https://doi.org/10.1007/s10664-024-10594-x).

[2] Wisniewski, B., Zierer, K. y Hattie, J. (2020). *The Power of Feedback Revisited: A Meta-Analysis of Educational Feedback Research*. Frontiers in Psychology, 10, 3087. [Artículo](https://doi.org/10.3389/fpsyg.2019.03087).

[3] Yang, C., Luo, L., Vadillo, M. A., Yu, R. y Shanks, D. R. (2021). *Testing (quizzing) boosts classroom learning: A systematic and meta-analytic review*. Psychological Bulletin, 147(4), 399–435. [Artículo](https://doi.org/10.1037/bul0000309) · [Resumen indexado](https://pubmed.ncbi.nlm.nih.gov/33683913/).

[4] Bisra, K., Liu, Q., Nesbit, J. C., Salimi, F. y Winne, P. H. (2018). *Inducing Self-Explanation: a Meta-Analysis*. Educational Psychology Review, 30, 703–725. [Artículo](https://doi.org/10.1007/s10648-018-9434-x).

[5] Lazonder, A. W. y Harmsen, R. (2016). *Meta-Analysis of Inquiry-Based Learning: Effects of Guidance*. Review of Educational Research, 86(3), 681–718. [Artículo](https://doi.org/10.3102/0034654315627366).

[6] Sinha, T. y Kapur, M. (2021). *When Problem Solving Followed by Instruction Works: Evidence for Productive Failure*. Review of Educational Research, 91(5), 761–798. [Artículo](https://doi.org/10.3102/00346543211019105).

[7] Latimier, A., Peyre, H. y Ramus, F. (2021; publicación en línea en 2020). *A Meta-Analytic Review of the Benefit of Spacing out Retrieval Practice Episodes on Retention*. Educational Psychology Review, 33, 959–987. [Artículo](https://doi.org/10.1007/s10648-020-09572-8).

[8] Bastani, H., Bastani, O., Sungu, A., Ge, H., Kabakcı, Ö. y Mariman, R. (2025). *Generative AI without guardrails can harm learning: Evidence from high school mathematics*. Proceedings of the National Academy of Sciences, 122, e2422633122. [Artículo](https://doi.org/10.1073/pnas.2422633122) · [Resumen indexado](https://pubmed.ncbi.nlm.nih.gov/40560616/) · [Corrección editorial registrada](https://doi.org/10.1073/pnas.2518204122).

[9] Kestin, G., Miller, K., Klales, A., Milbourne, T. y Ponti, G. (2025). *AI tutoring outperforms in-class active learning: an RCT introducing a novel research-based design in an authentic educational setting*. Scientific Reports, 15, 17458. [Artículo](https://doi.org/10.1038/s41598-025-97652-6) · [Texto completo](https://pmc.ncbi.nlm.nih.gov/articles/PMC12179260/).

[10] Wu, X., Zhu, P., Zhang, J., Yin, M. y Wang, Y. (2026). *ChatGPT’s impact on student learning outcomes: a meta-analysis of 35 experimental studies*. Humanities and Social Sciences Communications, 13, 684. [Artículo](https://doi.org/10.1057/s41599-026-07019-z) · [PDF de la versión publicada](https://www.nature.com/articles/s41599-026-07019-z.pdf).

[11] Wang, J. y Fan, W. (2026). *Retraction Note: The effect of ChatGPT on students’ learning performance, learning perception, and higher-order thinking: insights from a meta-analysis*. Humanities and Social Sciences Communications, 13, 528. **No utilizado como respaldo.** [Nota de retractación](https://www.nature.com/articles/s41599-026-07310-z).

[12] Google. *Site Reliability Engineering: Effective Troubleshooting*. Referencia de práctica de ingeniería, no ensayo de eficacia. [Capítulo](https://sre.google/sre-book/effective-troubleshooting/).

[13] Atkinson, R. K., Renkl, A. y Merrill, M. M. (2003). *Transitioning From Studying Examples to Solving Problems: Effects of Self-Explanation Prompts and Fading Worked-Out Steps*. Journal of Educational Psychology, 95(4), 774–783. [DOI](https://doi.org/10.1037/0022-0663.95.4.774) · [Registro del artículo](https://eric.ed.gov/?id=EJ678596).
