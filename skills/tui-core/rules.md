# TUI Core Rules - TCSS Anti-Hallucination Guide

**READ THIS BEFORE ANY TUI WORK. VIOLATIONS CAUSE RUNTIME ERRORS.**

---

## TCSS Anti-Hallucination List

### CSS Properties That DO NOT EXIST in Textual

**NEVER use these. They will cause parser errors or be silently ignored:**

| Web CSS | Status | Why |
|---------|--------|-----|
| `border-radius` | DOES NOT EXIST | Terminals use character cells |
| `box-shadow` | DOES NOT EXIST | No shadows in terminal |
| `text-shadow` | DOES NOT EXIST | No shadows in terminal |
| `animation` | DOES NOT EXIST | Use Textual animation system |
| `@keyframes` | DOES NOT EXIST | Use Textual animation system |
| `transition` | DOES NOT EXIST | Use Textual animation system |
| `transform` | DOES NOT EXIST | No transformations |
| `rotate` | DOES NOT EXIST | No transformations |
| `scale` | DOES NOT EXIST | No transformations |
| `translate` | DOES NOT EXIST | No transformations |
| `flex` | DOES NOT EXIST | Use `layout: horizontal/vertical/grid` |
| `flex-direction` | DOES NOT EXIST | Use `layout: horizontal/vertical` |
| `justify-content` | DOES NOT EXIST | Use `content-align` |
| `align-items` | DOES NOT EXIST | Use `content-align` |
| `z-index` | DOES NOT EXIST | Use `layers` |
| `top/left/right/bottom` | DOES NOT EXIST | Use `offset-x`, `offset-y` |
| `font-family` | DOES NOT EXIST | Terminal font only |
| `font-size` | DOES NOT EXIST | Terminal font only |
| `font-weight` | DOES NOT EXIST | Use `text-style: bold` |
| `line-height` | DOES NOT EXIST | Terminal line height |
| `float` | DOES NOT EXIST | Use `dock` |
| `position: absolute/relative` | DOES NOT EXIST | Use `dock` or `layers` |
| `calc()` | DOES NOT EXIST | Pre-calculate values |
| `min()` | DOES NOT EXIST | Use `min-width`, `min-height` |
| `max()` | DOES NOT EXIST | Use `max-width`, `max-height` |
| `clamp()` | DOES NOT EXIST | Not supported |
| `rgba()` | DOES NOT EXIST | Use hex with alpha: `#ff000080` |
| `@media` | DOES NOT EXIST | Use Python `on_resize()` |
| `:nth-child()` | DOES NOT EXIST | Not supported |
| `:first-of-type` | DOES NOT EXIST | Not supported |
| `var(--name)` | DOES NOT EXIST | Use `$name` |
| `--custom-prop` | DOES NOT EXIST | Use `$custom-prop` |

---

## TCSS Variable Syntax

```tcss
/* CORRECT - Textual syntax */
$my-color: #ff5500;
Button { color: $my-color; }

/* WRONG - Web CSS syntax */
--my-color: #ff5500;
Button { color: var(--my-color); }
```

---

## Valid Units in TCSS

| Unit | Description | Example |
|------|-------------|---------|
| (none) | Cells/characters | `width: 20;` |
| `%` | Percentage of parent | `width: 50%;` |
| `fr` | Fractional unit | `width: 1fr;` |
| `w` | Container width % | `width: 50w;` |
| `h` | Container height % | `height: 50h;` |
| `vw` | Viewport width % | `width: 50vw;` |
| `vh` | Viewport height % | `height: 50vh;` |
| `auto` | Automatic sizing | `height: auto;` |

**NOTE:** `px`, `em`, `rem` DO NOT EXIST. Use cell units (no suffix).

---

## Valid Border Types (16 total)

```tcss
border: ascii | blank | dashed | double | heavy | hidden | hkey |
        inner | outer | panel | round | solid | tall | thick | vkey | wide;
```

**Common choices:**
- `solid` - Standard border
- `heavy` - Emphasized border (thicker)
- `thick` - Also emphasized
- `double` - Double-line border
- `round` - Rounded corners (character-based)
- `hidden` - No visible border

---

## Theme Variables (11 Base Colors)

Every Textual theme defines:

| Variable | Purpose |
|----------|---------|
| `$primary` | Branding, titles |
| `$secondary` | Alternative accent |
| `$accent` | Attention, contrast |
| `$foreground` | Default text |
| `$background` | Screen background |
| `$surface` | Widget backgrounds |
| `$panel` | Section backgrounds |
| `$boost` | Alpha-layered |
| `$success` | Green indicator |
| `$warning` | Orange indicator |
| `$error` | Red indicator |

**Auto-generated variants:**
- `$primary-lighten-1`, `-lighten-2`, `-lighten-3`
- `$primary-darken-1`, `-darken-2`, `-darken-3`
- `$primary-muted` (70% opacity)

---

## CSS Precedence (CRITICAL)

**Order (highest to lowest):**
1. Inline styles (`widget.styles.property = value`)
2. `DEFAULT_CSS` in widget class
3. External `.tcss` files via `CSS_PATH`

**Problem:** If widget has `DEFAULT_CSS`, external `.tcss` CANNOT override unless higher specificity.

**Solution:** Remove `DEFAULT_CSS` from widgets, put styles in `.tcss`.

---

## Layout Rules

### Docking
```tcss
#header { dock: top; }
#sidebar { dock: left; }
#footer { dock: bottom; }
/* Main content fills remaining space automatically */
```

### Grid
```tcss
Screen {
    layout: grid;
    grid-size: 3 4;  /* columns rows */
}
```

### Horizontal/Vertical
```tcss
Container { layout: horizontal; }  /* Children side-by-side */
Container { layout: vertical; }    /* Children stacked */
```

---

## Python-TCSS Separation Rule

**CRITICAL for multi-agent workflow:**

1. **TCSS files**: Visual styling ONLY
   - Colors, borders, spacing, layout
   - NO logic, NO conditionals

2. **Python files**: Logic ONLY
   - Event handlers, data processing
   - NO `styles="..."` inline strings
   - NO hardcoded colors

**Exception:** Minimal `DEFAULT_CSS` for structural layout (height/width) is acceptable.

---

## File Locations

```
project/
├── src/app/
│   ├── styles/
│   │   ├── base.tcss      # Variables, resets
│   │   ├── layout.tcss    # Grid, docking
│   │   └── widgets.tcss   # Component styles
│   ├── themes/
│   │   └── my_theme.py    # Theme definition (Python)
│   └── widgets/
│       └── my_widget.py   # Widget logic (Python)
```

---

## Quick Validation Checklist

Before committing TUI code:

- [ ] No `var(--name)` syntax (use `$name`)
- [ ] No Web CSS properties (border-radius, flex, etc.)
- [ ] Using valid border types
- [ ] Using theme variables for colors
- [ ] No inline `styles="..."` in Python
- [ ] Theme set in `on_mount()`, not `__init__()`
- [ ] Tested with `textual run --dev`
