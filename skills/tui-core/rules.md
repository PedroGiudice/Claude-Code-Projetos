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

---

## TCSS Mindset: Why You're "Tiptoeing" and How to Stop

### The Problem: Web CSS Muscle Memory

Developers with Web CSS experience (especially LLMs trained on web code) have deeply ingrained patterns:

```css
/* What your brain WANTS to write: */
.button {
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    transition: all 0.3s ease;
    display: flex;
    justify-content: center;
}
```

**In Web CSS:** This code renders (maybe not perfectly, but it renders).
**In TCSS:** This code CRASHES. Hard. Parser error. Application dies.

### Why TCSS Feels "Risky"

| Web CSS | TCSS |
|---------|------|
| Invalid property? Ignored silently | Invalid property? **Parser crash** |
| Wrong value? Falls back | Wrong value? **Parser crash** |
| Typo in color? Shows nothing | Typo in variable? **Parser crash** |
| Test visually in browser | Test by running app (slower feedback) |

**Result:** Your brain perceives TCSS as "dangerous" because mistakes are punished immediately and severely. This triggers "tiptoeing" - excessive hesitation before writing any CSS.

### The "Tiptoeing" Phenomenon

Signs you're tiptoeing:
1. Writing TCSS in tiny increments, testing after each line
2. Over-commenting obvious properties
3. Avoiding complex selectors even when needed
4. Copy-pasting known-working CSS instead of writing new
5. Feeling anxious when writing layout properties

**Tiptoeing is NOT a solution.** It's slow, produces fragmented code, and doesn't prevent errors - it just delays them.

### The Correct Mindset: "Subset, Not Dialect"

**Mental Model Shift:**

> TCSS is NOT "CSS with quirks."
> TCSS is a **strict subset** of CSS concepts, with **different syntax** for some features.

Think of it like Python vs JavaScript:
- Both have functions, loops, conditionals
- But `def` vs `function`, `for x in list` vs `for (let x of list)`
- You don't "guess" Python syntax - you KNOW it or look it up

**Apply the same discipline to TCSS:**
1. **KNOW the valid properties** (see anti-hallucination list above)
2. **KNOW the valid syntax** (`$var`, not `var(--name)`)
3. **LOOK UP when uncertain** (don't guess border types)
4. **NEVER assume** Web CSS properties exist

### Practical Rules to Avoid Getting Tricked

**Rule 1: The "Does This Exist?" Check**

Before writing ANY property, ask: "Does this exist in terminals?"

```tcss
/* PAUSE before writing: */
border-radius: 4px;

/* ASK: Can a terminal cell have rounded corners? */
/* ANSWER: No. Terminals are character grids. */
/* CONCLUSION: This property CANNOT exist in TCSS. */
```

**Rule 2: The "Web vs Terminal" Filter**

| Concept | Web | Terminal |
|---------|-----|----------|
| Pixels | Yes | No (cells) |
| Shadows | Yes | No |
| Gradients | Yes | No (use Rich markup in Python) |
| Animations | CSS | Python (set_interval, animate) |
| Flexbox | CSS | layout: horizontal/vertical |
| Custom fonts | Yes | No (terminal font) |
| Rounded corners | Yes | No |
| Transparency | rgba() | hex with alpha (#rrggbbaa) |

**Rule 3: When In Doubt, Use Theme Variables**

Instead of hardcoding colors:
```tcss
/* WRONG - might not match theme */
Button { background: #ff5500; }

/* CORRECT - always valid */
Button { background: $primary; }
```

**Rule 4: Test Incrementally, But With COMPLETE Blocks**

DON'T do this:
```tcss
Button {
    color: $foreground;  /* test */
}
/* add more later... */
```

DO this:
```tcss
Button {
    color: $foreground;
    background: $surface;
    border: solid $primary;
    padding: 1 2;
}
/* Test complete block, not fragments */
```

**Rule 5: The Pre-Flight Checklist**

Before running `textual run`:
1. Ctrl+F for `var(--` → Replace with `$`
2. Ctrl+F for `rgba(` → Replace with hex+alpha
3. Ctrl+F for `border-radius` → Delete
4. Ctrl+F for `px` → Replace with cell units
5. Ctrl+F for `transition` → Delete

### The Anti-Hallucination Mantra

Repeat before writing TCSS:

> "This is NOT web CSS.
> Terminals have cells, not pixels.
> Variables use `$`, not `var()`.
> If it works in browsers but not in terminals, it doesn't exist.
> When in doubt, check the rules.md."

---

## Common Traps and Escapes

### Trap 1: "It looks like CSS, so it must work"

```tcss
/* LOOKS valid to Web eyes: */
.card {
    border-radius: 8px;
    box-shadow: 0 2px 4px #00000033;
}
```

**Escape:** TCSS parsers are strict. Unknown properties = crash, not ignore.

### Trap 2: "I'll just use rgba() with alpha"

```tcss
/* WRONG */
background: rgba(255, 0, 0, 0.5);

/* CORRECT */
background: #ff000080;
```

**Escape:** TCSS uses hex with alpha suffix, not rgba().

### Trap 3: "I need flexbox for this layout"

```tcss
/* WRONG - flexbox doesn't exist */
Container {
    display: flex;
    justify-content: center;
}

/* CORRECT - use layout + content-align */
Container {
    layout: horizontal;
    content-align: center middle;
}
```

**Escape:** Use `layout:` and `content-align:` instead of flex properties.

### Trap 4: "Let me just add a quick transition"

```tcss
/* WRONG - transitions don't exist */
Button:hover {
    transition: background 0.3s;
}
```

**Escape:** Use Python's `animate()` method for animations, or `set_interval()` for timed updates.

### Trap 5: "I'll use CSS variables like normal"

```tcss
/* WRONG */
:root { --primary: #ff5500; }
Button { color: var(--primary); }

/* CORRECT */
$primary: #ff5500;
Button { color: $primary; }
```

**Escape:** TCSS variables use SCSS-like `$syntax`, not CSS `var(--syntax)`.

---

## Summary: The 5 Commandments of TCSS

1. **Thou shalt not hallucinate Web properties** - If unsure, check the anti-hallucination list
2. **Thou shalt use $variables** - Never `var(--name)`, always `$name`
3. **Thou shalt think in cells, not pixels** - Units are character cells, not px/em/rem
4. **Thou shalt trust theme variables** - $primary, $surface, etc. always work
5. **Thou shalt test before commit** - `textual run --dev` catches parser errors
