# Vision Guide - Programmatic Visual Verification

**Purpose:** Teach TUI agents to verify layout geometry programmatically, replacing human visual inspection.

---

## The Problem: Blind Development

TUI agents work "in the dark" - they write code but cannot see if:
- Buttons have visible text
- Widgets collapsed to 0 height
- Layout blocks user interaction
- CSS changes actually took effect

**Solution:** Use `textual.pilot` + DOM querying to assert visual properties.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                 Vision Pipeline                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. RETINA (textual.pilot)                          │
│     └─ Drives app headless, no terminal needed      │
│                                                      │
│  2. OPTIC NERVE (tests/conftest.py)                 │
│     └─ Standardized fixtures for async testing      │
│                                                      │
│  3. VISUAL CORTEX (this guide)                      │
│     └─ Patterns for geometry/focus assertions       │
│                                                      │
│  4. REFLEXES (agent .md constraints)                │
│     └─ Forces tests as proof of correct rendering   │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## Core Concepts

### 1. Widget Region (Coordinate System)

Every Textual widget has a `region` property with **absolute screen coordinates**:

```python
widget.region
# Region(x=10, y=5, width=80, height=3)
#
#   x=10: Widget starts 10 columns from left edge
#   y=5:  Widget starts 5 rows from top
#   width=80: Widget spans 80 columns
#   height=3: Widget spans 3 rows
```

**CRITICAL:** If `width=0` or `height=0`, the widget is INVISIBLE (collapsed).

### 2. Common Invisible Widget Causes

| Symptom | Cause | Detection |
|---------|-------|-----------|
| `height=0` | `height: auto` on empty container | `assert region.height > 0` |
| `width=0` | Parent has `width: 0` | Check parent's region |
| Text invisible | Color matches background | Compare widget.styles |
| Widget off-screen | Wrong grid/dock placement | Check `x`, `y` bounds |

### 3. Focus and Interactivity

A widget might render but be unreachable:

```python
# Widget exists but can't be clicked/tabbed to
assert widget.can_focus, "Widget is not focusable!"
assert app.focused == widget, "Widget didn't receive focus!"
```

---

## Testing Patterns

### Pattern 1: Basic Widget Visibility

```python
import pytest
from legal_extractor_tui.app import LegalExtractorApp

@pytest.mark.parametrize("pilot_app", [LegalExtractorApp], indirect=True)
async def test_header_is_visible(pilot_app):
    """Header must have non-zero dimensions."""
    pilot = pilot_app

    # Query the header widget
    header = pilot.app.query_one("Header")

    # Assert it's actually visible
    assert header.region.height > 0, "Header collapsed to zero height!"
    assert header.region.width > 0, "Header has zero width!"
```

### Pattern 2: Child Widget Presence

```python
@pytest.mark.parametrize("pilot_app", [LegalExtractorApp], indirect=True)
async def test_sidebar_has_buttons(pilot_app):
    """Sidebar must contain all navigation buttons."""
    pilot = pilot_app

    sidebar = pilot.app.query_one("Sidebar")

    # Check required children exist
    assert sidebar.query_one("#btn-extract"), "Extract button missing!"
    assert sidebar.query_one("#btn-settings"), "Settings button missing!"

    # Check they're visible
    for btn in sidebar.query("Button"):
        assert btn.region.height > 0, f"Button {btn.id} is invisible!"
```

### Pattern 3: Focus Flow

```python
@pytest.mark.parametrize("pilot_app", [LegalExtractorApp], indirect=True)
async def test_tab_navigation(pilot_app):
    """Tab key should cycle through interactive widgets."""
    pilot = pilot_app

    # Press Tab and check focus moves
    await pilot.press("tab")
    first_focused = pilot.app.focused
    assert first_focused is not None, "Nothing focused after Tab!"

    await pilot.press("tab")
    second_focused = pilot.app.focused
    assert second_focused != first_focused, "Focus stuck on same widget!"
```

### Pattern 4: DOM Tree Dump on Failure

```python
from tests.conftest import dump_tree

@pytest.mark.parametrize("pilot_app", [LegalExtractorApp], indirect=True)
async def test_with_debug_dump(pilot_app):
    """Test that dumps DOM tree if it fails."""
    pilot = pilot_app

    try:
        widget = pilot.app.query_one("#problematic-widget")
        assert widget.region.height > 0
    except AssertionError:
        # Dump tree for debugging
        tree = dump_tree(pilot.app, "logs/debug_tree.txt")
        print(f"DOM Tree:\n{tree}")
        raise
```

### Pattern 5: Geometry Relationships

```python
@pytest.mark.parametrize("pilot_app", [LegalExtractorApp], indirect=True)
async def test_button_inside_sidebar(pilot_app):
    """Button must be geometrically inside sidebar bounds."""
    pilot = pilot_app

    sidebar = pilot.app.query_one("Sidebar")
    button = pilot.app.query_one("#btn-extract")

    sr = sidebar.region  # Sidebar region
    br = button.region   # Button region

    # Button's left edge >= sidebar's left edge
    assert br.x >= sr.x, "Button overflows sidebar left!"

    # Button's right edge <= sidebar's right edge
    assert br.x + br.width <= sr.x + sr.width, "Button overflows sidebar right!"

    # Button's top >= sidebar's top
    assert br.y >= sr.y, "Button above sidebar!"

    # Button's bottom <= sidebar's bottom
    assert br.y + br.height <= sr.y + sr.height, "Button below sidebar!"
```

### Pattern 6: Responsive Layout

```python
@pytest.mark.parametrize("app_with_size", [(LegalExtractorApp, 80, 24)], indirect=True)
async def test_small_terminal(app_with_size):
    """App must work in small 80x24 terminal."""
    pilot = app_with_size

    # Check critical widgets still visible
    header = pilot.app.query_one("Header")
    assert header.region.height > 0, "Header collapsed in small terminal!"

    # Sidebar might collapse but main content should remain
    main = pilot.app.query_one("#main-content")
    assert main.region.width >= 40, "Main content too narrow!"
```

---

## Running Vision Tests

### Command Line

```bash
# Run all vision tests
pytest tests/ -v -m vision

# Run with stdout (see tree dumps)
pytest tests/ -v -s

# Run specific test
pytest tests/test_header.py::test_header_is_visible -v
```

### Via Script

```bash
# Run vision verification script
./scripts/run_vision.sh

# Check failure logs
cat logs/vision_failure.log
```

---

## Debugging Failed Tests

### Step 1: Read the Assertion Error

```
AssertionError: Header collapsed to zero height!
Region: Region(x=0, y=0, width=120, height=0)
```

**Translation:** Header renders but has `height=0`. CSS issue.

### Step 2: Check the DOM Dump

```bash
cat logs/vision_failure.log
```

Look for:
- Widget in tree? (mounting issue if missing)
- Parent has dimensions? (CSS inheritance issue)
- Correct nesting? (compose() issue)

### Step 3: Inspect CSS

```python
# In test, print computed styles
header = pilot.app.query_one("Header")
print(f"Height rule: {header.styles.height}")
print(f"Min-height: {header.styles.min_height}")
print(f"Background: {header.styles.background}")
```

### Step 4: Check DEFAULT_CSS Conflicts

Widget's `DEFAULT_CSS` overrides external `.tcss` files. Look for:

```python
# In widget file - this BLOCKS external styling
DEFAULT_CSS = """
Header {
    height: auto;  # <-- PROBLEM: auto on empty = 0
}
"""
```

---

## Agent Integration

### For tui-developer

Before committing a widget, run:

```bash
pytest tests/test_<widget>.py -v
```

If no test exists, CREATE ONE that asserts:
1. Widget mounts
2. Widget has `region.height > 0`
3. Key children exist in DOM

### For tui-debugger

When diagnosing layout issues:

1. **Don't guess CSS** - Run the test with `-s`:
   ```bash
   pytest tests/test_<widget>.py -v -s
   ```

2. **Read the tree dump**:
   ```bash
   cat logs/vision_failure.log
   ```

3. **Report findings** with exact coordinates:
   ```
   DIAGNOSIS: Header has height=0
   - Region: (0, 0, 120, 0)
   - Cause: DEFAULT_CSS sets height: auto
   - Fix: Set min-height: 3 in widgets.tcss
   ```

---

## Quick Reference

### Assertion Helpers (from conftest.py)

```python
from tests.conftest import assert_widget_visible, assert_widget_contains, assert_focus_reachable

# Check widget has dimensions
assert_widget_visible(widget, "Header")

# Check parent contains child
assert_widget_contains(sidebar, "#btn-extract", "Sidebar")

# Check widget can receive focus
assert_focus_reachable(app, "file-input")
```

### Region Properties

```python
region = widget.region

region.x        # Left edge (columns from left)
region.y        # Top edge (rows from top)
region.width    # Width in columns
region.height   # Height in rows
region.right    # x + width
region.bottom   # y + height
region.area     # width * height
```

### Style Properties

```python
styles = widget.styles

styles.width        # CSS width value
styles.height       # CSS height value
styles.min_width    # CSS min-width
styles.min_height   # CSS min-height
styles.background   # Background color
styles.color        # Text color
styles.display      # "block", "none", etc.
styles.visibility   # "visible", "hidden"
```

---

## References

- `tests/conftest.py` - Fixture implementations
- `skills/tui-core/bug-patterns.md` - Known CSS bugs
- `skills/tui-core/debugging-guide.md` - General debugging
- [Textual Testing Docs](https://textual.textualize.io/guide/testing/)
