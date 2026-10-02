# Design

## Observed Problem

The implementation already has one canonical `body`, but Libre exposes raw Markdown while Cornell exposes semantic fields.

The generated Cornell body is currently:

```markdown
## Cornell Notes

### 1. Cue

Notes...

## Summary

Summary...
```

That structure is an implementation contract, not a useful user mental model.

The UX should not ask the user to remember:

- H1 vs H2 vs H3;
- the literal `Cornell Notes` heading;
- numbering rules;
- the exact Summary marker.

## Interaction Model

Libre gains a structure-assistant row under the generic Markdown toolbar.

### Status

Three states:

1. Empty
   - label: `Libre vacío`
   - action: `Preparar Cornell`

2. Non-empty, not canonical Cornell
   - label: `Libre · sin estructura Cornell`
   - action: `Preparar Cornell`

3. Canonical Cornell
   - label: `Cornell listo · N bloques`
   - actions: `+ Cue / Pregunta`, `Ir a resumen`

The status is derived from `parseCornellBody(activeState.body)`; no new persistence field is required.

## Preparing an Empty Note

Generate the minimal canonical structure:

```markdown
## Cornell Notes

## Summary
```

This is valid Cornell Markdown with zero blocks.

The caret moves between the Cornell heading and Summary so the next action can add a cue.

## Preparing Arbitrary Libre Markdown

Given:

```markdown
## Linux routing

- longest-prefix match
- metric
```

Preparation uses the existing preservation-first import:

```js
{
  blocks: [
    {
      cue: "",
      notes: originalBody
    }
  ],
  summary: ""
}
```

Then serialization produces one neutral `Nota` block.

No Markdown AST guessing is attempted.

This is deliberate: the tool should never reinterpret arbitrary H2/H3 headings as cues without explicit user intent.

## Adding a Cue

The semantic action operates on canonical Cornell state rather than manipulating raw heading syntax heuristically.

1. Ensure body is Cornell-ready.
2. Parse body to structured Cornell.
3. Append:
   ```js
   { cue: "Pregunta o concepto", notes: "" }
   ```
4. Serialize back to body.
5. Render Libre.
6. Locate the generated cue text in the textarea and select `Pregunta o concepto`.

The placeholder is real text but is selected immediately for replacement. If the user leaves it unchanged, the note remains valid and understandable.

## Summary Navigation

1. Ensure Cornell structure exists.
2. Locate `## Summary`.
3. Place caret after the blank line following the Summary heading.
4. Focus Libre textarea.

No placeholder text is inserted.

## Switching to Cornell

Current behavior silently canonicalizes arbitrary Libre content.

New behavior:

- body empty -> allow switch;
- body canonical Cornell -> allow switch;
- body non-empty and non-canonical -> do not switch;
- show status:
  `Esta nota sigue en formato libre. Usa “Preparar Cornell” para convertirla sin perder contenido.`
- emphasize the assistant row briefly.

This makes the conversion boundary explicit and reversible before the user changes view.

## H2/H3 Toolbar

Generic Markdown headings remain useful inside Libre notes, but they must not look like required Cornell controls.

Visible labels change:

- `H2` -> `Sección`
- `H3` -> `Subsec.`

Titles/ARIA retain precise Markdown meaning:

- `Sección Markdown (H2)`
- `Subsección Markdown (H3)`

The help disclosure states:

```text
No necesitas usar H1/H2/H3 para Cornell.
Usa Cue/Pregunta y Resumen; la app genera la estructura Markdown.
```

## Compact Help

Use native `<details>` / `<summary>` to avoid modal complexity.

Content:

- `Título / archivo`: controlled by the required manual name field.
- `Cue / Pregunta`: one recall prompt / Cornell block.
- `Texto debajo`: notes for that cue.
- `Resumen`: final synthesis.
- `Sección/Subsec.`: ordinary Markdown only.

No tutorial overlay, onboarding state, or new persisted preference is required.

## Responsive Behavior

The assistant uses flex-wrap and compact buttons.

On narrow panels:

- status takes a full row when needed;
- buttons wrap;
- help details spans full width;
- no horizontal scrolling is introduced.

## Persistence

No new state fields.

Every transformation updates `activeState.body` and dispatches the existing persistence/update flow.

The browser draft and filesystem save remain separate.

## Failure Safety

- Preparation never discards original body text.
- Parsing failure after a semantic action aborts and shows an error status.
- No filesystem writes happen as part of preparation.
- Saving remains controlled by the existing manual-name and directory permission flow.
