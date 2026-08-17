# Canvas

An Excalidraw-style infinite drawing surface: a fifth top-level section in
kaori-desktop, alongside notes, tasks, routines, and folders.

**Desktop only today.** The scene model, interaction logic, and geometry all
live in `kaori-core` as platform-free TypeScript, so a future React Native
surface reuses them — only rendering and raw input are per-platform. See
[roadmap.md](roadmap.md) for what mobile still needs.

## The two data types

A drawing is split in two, because the halves have opposite access patterns.

**`Canvas`** (`kaori-core/src/types.ts`) is list metadata — title, folder,
timestamps, pinned/archived, links. Same field conventions as `Note`/`Task`.
Listing canvases reads only these columns, so opening the list never parses a
stroke.

**`CanvasScene`** (`kaori-core/src/canvas/types.ts`) is the drawing itself:

```ts
type CanvasScene = {
  version: number; // upcast on read by parseScene, never by SQL
  elements: CanvasElement[]; // array order IS z-order — there is no `z` field
  viewport: Viewport; // last camera, restored when the canvas reopens
};
```

Scene coordinates are unbounded floats, y-down, 1 unit = 1px at zoom 1:
`screen = (scene - viewport.{x,y}) * zoom`. Elements never store screen
coordinates, which is what lets the same scene render on DOM SVG and
react-native-svg.

### Element kinds

`rect`, `ellipse`, `line`, `arrow`, `draw` (freehand), `text`, `image`, `frame`.

Every element shares a `Base`: an axis-aligned box (`x/y/w/h`), `stroke`,
`fill`, `strokeWidth`, `opacity`, plus optional `angle`, `dash`, and `frameId`.
Optional fields are optional _on purpose_ — a scene written before that field
existed still parses, so no field addition so far has needed a schema bump.

Colors are stored as **theme tokens** (`'ink'`, `'amber'`, …), not hex, so an
old drawing re-colors when the app's tone/accent changes. `custom:#hex` exists
in the union for exact colors later.

## Relationships between elements

Four kinds of relationship, all sharing one design decision: **derive, don't
store.** The relationship holds an identity, and everything positional is
recomputed at the reducer boundary. That's why no code path can leave one stale.

| Relationship              | Stored                                   | Derived                                |
| ------------------------- | ---------------------------------------- | -------------------------------------- |
| Text in a shape           | `containerId` / `boundTextId`            | wrap width, position, container growth |
| Arrow attached to a shape | `startBinding` / `endBinding` (id + aim) | the endpoint itself                    |
| Element in a frame        | `frameId`                                | membership, from the element's centre  |
| Elbow arrow               | `route: 'elbow'`                         | the corner waypoints                   |

**Bound text** (`canvas/binding.ts`) wraps at the container's inner width — an
ellipse uses its inscribed rectangle so text doesn't poke through the curve —
and grows the container's height on overflow, never shrinking below the drawn
size. It's the only place `layoutText` gets a real `maxWidth`; standalone text
passes `0` and auto-grows to its longest line, which is why alignment controls
appear only for text inside a shape.

**Arrow binding** (`canvas/arrowBinding.ts`) stores which shape each end is
attached to plus a `dir` — a direction from the shape's centre in the shape's
_own unrotated frame_, captured from where the end was dropped. That's what
lets you pin an arrow to a chosen side and have it survive moving, resizing,
and rotating the shape. Dropping near the centre leaves `dir` unset, and the
attachment auto-aims at the other end instead.

**Frames** (`canvas/frames.ts`) own what's inside them: an element belongs to
the frame its centre sits in. Membership therefore needs no "add to frame"
gesture. A frame carries its contents when dragged and takes them when deleted;
a label inherits its shape's frame rather than being tested on its own, since
its centre can fall outside a frame the shape is well inside. Frames never nest.

## Rotation

`angle` is stored on the element and applied at exactly two edges: one wrapping
`<g transform>` when drawing, and one un-rotation of the pointer in `hitTest`.
Everything in between — bounds, wrapping, routing, resize math — keeps working
on axis-aligned numbers. Resizing runs in the element's local frame and pins the
opposite corner in _world_ space, which is what stops a rotated shape drifting
sideways as its box changes size.

Lines and arrows have no transform box at all: they get two endpoint grips,
since a box can only scale a segment where what you want is to move an end —
and that same gesture is what attaches an arrow to a shape.

## Tools

`select` `V`, `hand` `H`, `rect` `R`, `ellipse` `O`, `line` `L`, `arrow` `A`,
`draw` `D`, `text` `T`, `eraser` `E`, `frame` `F`, with digits `1`–`0` as
positional aliases. Insert-image (`I`) is an _action_, not a mode — choosing a
file is the whole gesture, so it never shows a pressed state.

- **Select** drags from empty canvas to rubber-band; shift adds. The band must
  _fully enclose_ an element to catch it — brushing past a long line or a wide
  text block shouldn't sweep it up, since picking those back off is worse than
  having to enclose deliberately. Enclosure is measured on world bounds, so a
  rotated element must be covered where it's actually drawn. Pressing on an
  element moves it instead.
- **Eraser** marks what the sweep touches (dimmed as a preview) and deletes it
  all on release, as one undo step.
- **Images** arrive three ways: the toolbar button, drag-and-drop from Finder,
  and paste. They resize aspect-locked with shift to _free_ — the reverse of a
  shape, because a stretched photo reads as a mistake rather than a choice.
- Layer ops (`[` `]`, `⌘[` `⌘]`) reorder the array, operating on _groups_ so a
  shape and its label always stay adjacent.

## Storage (kaori-desktop)

Three tables' worth of concerns, split by write frequency:

| What            | Where                        | Why                                 |
| --------------- | ---------------------------- | ----------------------------------- |
| Canvas metadata | `canvases` columns           | listed often, tiny                  |
| Scene JSON      | `canvases.scene`             | rewritten on every debounced save   |
| Image bytes     | `canvas_files` (migration 6) | written once, potentially megabytes |

Image bytes are **base64 in a TEXT column, not a BLOB**: the Tauri SQL plugin
has no binary binding, so passing a number array serializes to the _string_
`"[137,80,78,…]"` — which reads back as that string, decodes to garbage, and
renders as a broken-image icon, at ~3.6× the size. Base64 costs 1.33× and
survives the round trip. Reads still decode the old format, so anything stored
under the broken encoding heals on reload.

A file's id is a **content hash**, so the same picture used twice is stored
once. `pruneOrphanedCanvasFiles()` collects files no scene references, and runs
at app startup and after a canvas is deleted. Its timing is load-bearing: it
reads _persisted_ scenes while the editor saves on a debounce, so running it
while an editor is open could delete a file referenced only by an unsaved
in-memory scene. Startup is the one moment no editor can be open.

Scenes autosave 600ms after you stop and flush on close. A failed write is
surfaced in the editor header rather than swallowed — a dropped scene write
loses the drawing with nothing on screen to show for it.

`parseScene` validates structurally and drops malformed elements individually,
so one bad record can't take a whole document down. Forward compatibility comes
from the scene's own `version`, upcast on read — never from a SQL migration.

## Undo

A snapshot ring (cap 50) inside the reducer, not a command stack. The reducer
never mutates, so a snapshot is one array of pointers — a few KB. A command
stack would need a correct inverse for every operation and goes subtly wrong the
first time one touches several elements, which is the "undo that lies" failure
this avoids.

Snapshots are pushed only at commit boundaries, so a whole drag, sweep, or typed
label is one step. Continuous derived updates during a gesture — a shape growing
as its label is typed, a label re-wrapping as its shape is dragged — go through
`UPDATE_ELEMENTS_SILENT`, deliberately outside history: one entry per pointer
move would bury the edit it belongs to. Selection and viewport are never history
entries.

## Where the code lives

**kaori-core** (`src/canvas/`) — `types`, `factories`, `geometry`, `transform`,
`viewport`, `binding`, `arrowBinding`, `frames`, `layers`, `routing`, `path`,
`simplify`, `text`, `history`, `serialize`, and `sceneReducer`, which is the
interaction state machine the platform dispatches into.

**kaori-desktop** — `src/components/canvas/` (surface, toolbar, style panel,
element renderer, text overlay, selection chrome), `src/hooks/useCanvases.ts`
and `useCanvasScene.ts`, and `src/storage/sqliteCanvas*.ts`.

Rendering is **SVG, not canvas 2D**, because theming is runtime CSS variables:
SVG nodes take `stroke="var(--color-ink)"` and re-theme for free, where a 2D
context would need a `getComputedStyle`-and-repaint subsystem invented purely to
work around the renderer.
