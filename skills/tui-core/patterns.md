# TUI Core Patterns - Reusable Solutions

**Common patterns for Textual TUI development.**

---

## Widget Architecture Patterns

### Basic Widget Structure

```python
from textual.app import ComposeResult
from textual.widgets import Static
from textual.containers import Vertical

class MyWidget(Vertical):
    """Widget with minimal DEFAULT_CSS."""

    # ONLY structural layout in DEFAULT_CSS
    DEFAULT_CSS = """
    MyWidget {
        height: auto;
        width: 100%;
    }
    """

    def compose(self) -> ComposeResult:
        """Build widget tree."""
        yield Static("Title", classes="title")
        yield Static("Content", classes="content")

    def on_mount(self) -> None:
        """Called when widget is added to DOM."""
        pass
```

### Message-Based Communication

```python
from textual.message import Message

class MyWidget(Static):

    class Selected(Message):
        """Emitted when item selected."""
        def __init__(self, item_id: str) -> None:
            self.item_id = item_id
            super().__init__()

    def action_select(self) -> None:
        self.post_message(self.Selected(self.current_item))

# Parent handles message
class ParentWidget(Container):
    def on_my_widget_selected(self, event: MyWidget.Selected) -> None:
        self.log(f"Selected: {event.item_id}")
```

### Reactive Properties

```python
from textual.reactive import reactive

class StatusWidget(Static):
    status: reactive[str] = reactive("Ready")
    count: reactive[int] = reactive(0)

    def watch_status(self, status: str) -> None:
        """Called when status changes."""
        self.update(f"Status: {status}")

    def watch_count(self, count: int) -> None:
        """Called when count changes."""
        self.query_one("#counter").update(str(count))
```

---

## Layout Patterns

### Header-Sidebar-Content-Footer

```tcss
/* layout.tcss */
#header {
    dock: top;
    height: 3;
}

#sidebar {
    dock: left;
    width: 25;
    min-width: 20;
    max-width: 40;
}

#footer {
    dock: bottom;
    height: 3;
}

#content {
    /* Fills remaining space automatically */
    width: 1fr;
    height: 1fr;
}
```

### Grid Dashboard

```tcss
Screen {
    layout: grid;
    grid-size: 3 2;  /* 3 columns, 2 rows */
    grid-gutter: 1;
}

.card {
    border: solid $primary;
    padding: 1;
}

.card-wide {
    column-span: 2;
}

.card-tall {
    row-span: 2;
}
```

### Responsive Sidebar

```python
from textual.events import Resize

class MainScreen(Screen):
    SIDEBAR_BREAKPOINT = 80  # cells

    def on_resize(self, event: Resize) -> None:
        sidebar = self.query_one("#sidebar")
        sidebar.display = event.size.width >= self.SIDEBAR_BREAKPOINT
```

---

## TCSS Styling Patterns

### Panel with Title

```tcss
.panel {
    border: heavy $primary;
    background: $panel;
    padding: 1 2;
}

.panel-title {
    color: $accent;
    text-style: bold;
    margin-bottom: 1;
    padding-bottom: 1;
    border-bottom: solid $primary;
}

.panel-content {
    height: 1fr;
}
```

### Status Indicators

```tcss
.status-ready {
    color: $success;
}

.status-warning {
    color: $warning;
}

.status-error {
    color: $error;
    text-style: bold;
}

.status-processing {
    color: $secondary;
    text-style: italic;
}
```

### Focus States

```tcss
Input:focus {
    border: heavy $accent;
    background: $surface;
}

Button:hover {
    background: $primary-darken-1;
}

Button:focus {
    text-style: bold reverse;
}

.selectable:hover {
    background: $primary 20%;
}

.selectable.-selected {
    background: $accent;
    color: $background;
}
```

### DataTable Styling

```tcss
DataTable {
    height: 1fr;
    border: solid $primary;
}

DataTable > .datatable--header {
    background: $surface;
    text-style: bold;
    color: $primary;
}

DataTable > .datatable--cursor {
    background: $accent;
    color: $background;
}

DataTable > .datatable--even-row {
    background: $panel;
}
```

---

## Screen Patterns

### Modal Dialog

```python
from textual.screen import ModalScreen
from textual.containers import Grid
from textual.widgets import Button, Label

class ConfirmDialog(ModalScreen[bool]):
    """Returns True on confirm, False on cancel."""

    BINDINGS = [("escape", "cancel", "Cancel")]

    def compose(self) -> ComposeResult:
        yield Grid(
            Label("Are you sure?", id="question"),
            Button("Yes", variant="error", id="yes"),
            Button("No", variant="primary", id="no"),
            id="dialog",
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "yes")

    def action_cancel(self) -> None:
        self.dismiss(False)

# Usage
def show_confirm(self) -> None:
    def handle_result(confirmed: bool) -> None:
        if confirmed:
            self.do_action()
    self.push_screen(ConfirmDialog(), handle_result)
```

### Tab Navigation

```python
from textual.widgets import TabbedContent, TabPane

class MainScreen(Screen):
    def compose(self) -> ComposeResult:
        with TabbedContent(initial="home"):
            with TabPane("Home", id="home"):
                yield HomeContent()
            with TabPane("Settings", id="settings"):
                yield SettingsContent()
            with TabPane("Help", id="help"):
                yield HelpContent()

    def action_goto_settings(self) -> None:
        self.query_one(TabbedContent).active = "settings"
```

---

## Theme Definition Pattern

```python
from textual.theme import Theme

CUSTOM_THEME = Theme(
    name="custom-theme",
    # Required 11 base colors
    primary="#8be9fd",
    secondary="#bd93f9",
    accent="#ff79c6",
    foreground="#f8f8f2",
    background="#0d0d0d",
    surface="#1e1e2e",
    panel="#282a36",
    success="#50fa7b",
    warning="#ffb86c",
    error="#ff5555",
    dark=True,
    # Optional variable overrides
    variables={
        "border": "#8be9fd",
        "border-blurred": "#44475a",
        "scrollbar": "#44475a",
        "scrollbar-hover": "#6272a4",
    },
)
```

**App Registration:**

```python
class MyApp(App):
    def __init__(self) -> None:
        super().__init__()
        self.register_theme(CUSTOM_THEME)

    def on_mount(self) -> None:
        self.theme = "custom-theme"  # Apply in on_mount, NOT __init__
```

---

## Worker Patterns

### Background Task

```python
from textual.worker import Worker, WorkerState

class ProcessingScreen(Screen):

    def start_processing(self, file_path: str) -> None:
        self.run_worker(self._process_file(file_path), name="processor")

    async def _process_file(self, path: str) -> dict:
        """Runs in background thread."""
        # Long operation...
        return {"status": "done", "path": path}

    def on_worker_state_changed(self, event: Worker.StateChanged) -> None:
        if event.worker.name == "processor":
            if event.state == WorkerState.SUCCESS:
                result = event.worker.result
                self.notify(f"Done: {result['path']}")
            elif event.state == WorkerState.ERROR:
                self.notify("Error!", severity="error")
```

### Cancellable Worker

```python
class ExtractorWidget(Widget):
    _worker: Worker | None = None

    def start_extraction(self) -> None:
        if self._worker:
            self._worker.cancel()
        self._worker = self.run_worker(self._extract(), name="extractor")

    def cancel_extraction(self) -> None:
        if self._worker:
            self._worker.cancel()
            self._worker = None
```

---

## Debugging Patterns

### Console Logging

```python
from textual import log

class MyWidget(Widget):
    def on_mount(self) -> None:
        log("Widget mounted")
        log.info(f"ID: {self.id}")
        log.warning("Something odd")
        log.error("Critical issue")
```

### DOM Inspection

```python
# In textual console (Terminal 1: textual console)
# Print widget tree
self.log(self.tree)

# Inspect styles
widget = self.query_one("#my-widget")
self.log(widget.styles)
self.log(widget.css_identifier)
```

### Style Debugging

```python
def debug_styles(self, widget_id: str) -> None:
    widget = self.query_one(f"#{widget_id}")
    self.log("=== Style Debug ===")
    self.log(f"CSS ID: {widget.css_identifier}")
    self.log(f"Classes: {widget.classes}")
    self.log(f"Background: {widget.styles.background}")
    self.log(f"Color: {widget.styles.color}")
    self.log(f"Border: {widget.styles.border}")
```

---

## File Organization

```
src/my_app/
├── __init__.py
├── __main__.py           # Entry point
├── app.py                # App class, theme registration
├── config.py             # Constants
├── screens/
│   ├── __init__.py
│   ├── main_screen.py
│   └── help_screen.py
├── widgets/
│   ├── __init__.py
│   ├── header.py
│   ├── sidebar.py
│   └── status_bar.py
├── styles/
│   ├── base.tcss         # Variables
│   ├── layout.tcss       # Structure
│   └── widgets.tcss      # Components
├── themes/
│   ├── __init__.py
│   └── custom_theme.py
└── messages/
    ├── __init__.py
    └── events.py         # Custom messages
```
