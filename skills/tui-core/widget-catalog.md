# Widget Catalog - Catalogo de Widgets Textual

---

## Widgets Built-in Essenciais

### DataTable

**Uso:** Exibir dados tabulares.

```python
from textual.widgets import DataTable

table = DataTable(cursor_type="row", zebra_stripes=True)
table.add_column("Status", key="status", width=8)
table.add_column("Document", key="name")

# Celulas com Rich styling
from rich.text import Text
status = Text("OK", style="bold green", justify="center")
table.add_row(status, "Contract.pdf")

# Sorting
table.sort("date", key=lambda d: d, reverse=True)
```

**Styling:**
```tcss
DataTable {
    height: 1fr;
    border: solid $primary;
}

DataTable > .datatable--header {
    background: $surface;
    text-style: bold;
}

DataTable > .datatable--cursor {
    background: $accent;
}

DataTable > .datatable--even-row {
    background: $panel;
}
```

**Para datasets grandes:** Use `textual-fastdatatable` com Apache Arrow/Parquet.

---

### Tree

**Uso:** Hierarquias, navegacao de arquivos.

```python
from textual.widgets import Tree

tree = Tree("Root")
node = tree.root.add("Folder 1", expand=True)
node.add_leaf("File 1.txt")
node.add_leaf("File 2.txt")
tree.root.add("Folder 2")
```

**Customizacao:**
```python
class DocTree(Tree[Document]):
    ICON_NODE = "[] "
    ICON_NODE_EXPANDED = "[v] "
```

**Styling:**
```tcss
Tree {
    padding: 1;
    background: $panel;
}

Tree > .tree--guides {
    color: $primary-darken-3;
}

Tree > .tree--cursor {
    background: $accent;
}
```

**Lazy loading:**
```python
def on_tree_node_expanded(self, event: Tree.NodeExpanded) -> None:
    if not event.node.data.loaded:
        # Carregar filhos sob demanda
        children = load_children(event.node.data)
        for child in children:
            event.node.add(child.name, data=child)
        event.node.data.loaded = True
```

---

### Input

**Uso:** Entrada de texto.

```python
from textual.widgets import Input

input = Input(placeholder="Digite aqui...", id="search")
input.value  # Obter valor
```

**Styling:**
```tcss
Input {
    border: solid $primary;
    padding: 0 1;
}

Input:focus {
    border: heavy $accent;
}

Input > .input--placeholder {
    color: $text-muted;
}
```

---

### Button

**Uso:** Acoes do usuario.

```python
from textual.widgets import Button

btn = Button("Click Me", id="submit", variant="primary")
# Variants: default, primary, success, warning, error
```

**Handling:**
```python
def on_button_pressed(self, event: Button.Pressed) -> None:
    if event.button.id == "submit":
        self.do_submit()
```

**Styling:**
```tcss
Button {
    min-width: 16;
}

Button:hover {
    background: $primary-darken-1;
}

Button:focus {
    text-style: bold reverse;
}

Button.-primary {
    background: $primary;
}
```

---

### TabbedContent

**Uso:** Multiplas views em abas.

```python
from textual.widgets import TabbedContent, TabPane

def compose(self) -> ComposeResult:
    with TabbedContent(initial="dashboard"):
        with TabPane("Dashboard", id="dashboard"):
            yield DashboardContent()
        with TabPane("Settings", id="settings"):
            yield SettingsForm()
        with TabPane("Help", id="help"):
            yield HelpContent()

# Trocar aba programaticamente
def action_show_settings(self) -> None:
    self.query_one(TabbedContent).active = "settings"
```

---

### Static/Label

**Uso:** Texto estatico.

```python
from textual.widgets import Static, Label

# Static - texto simples
Static("Hello World", id="greeting")

# Label - como Static mas com classes predefinidas
Label("Status: Ready", classes="status")

# Com Rich markup
Static("[bold]Important[/bold] message")
```

**Nota versao 6.0+:**
- `Static.renderable` -> `Static.content`
- `Label.renderable` -> `Label.content`

---

### Markdown

**Uso:** Renderizar markdown.

```python
from textual.widgets import Markdown

md = Markdown("# Title\n**Bold** and *italic* text")

# Ou de arquivo
md = Markdown()
md.load("README.md")
```

---

### ProgressBar

**Uso:** Indicar progresso.

```python
from textual.widgets import ProgressBar

progress = ProgressBar(total=100, show_eta=True)
progress.advance(10)  # +10
progress.update(progress=50)  # Set to 50
```

---

## Containers

### Vertical / Horizontal

```python
from textual.containers import Vertical, Horizontal

def compose(self) -> ComposeResult:
    with Vertical():
        yield Header()
        with Horizontal():
            yield Sidebar()
            yield Content()
        yield Footer()
```

### Grid

```python
from textual.containers import Grid

def compose(self) -> ComposeResult:
    with Grid(id="dashboard"):
        yield Card("Sales", id="card1")
        yield Card("Users", id="card2")
        yield Card("Revenue", id="card3")
```

```tcss
#dashboard {
    grid-size: 3;
    grid-gutter: 1;
}
```

### ScrollableContainer

```python
from textual.containers import ScrollableContainer

def compose(self) -> ComposeResult:
    with ScrollableContainer():
        for i in range(100):
            yield Label(f"Item {i}")
```

---

## Modal Dialogs

### ModalScreen

```python
from textual.screen import ModalScreen
from textual.containers import Grid
from textual.widgets import Button, Label

class ConfirmDialog(ModalScreen[bool]):
    """Modal que retorna True/False."""

    BINDINGS = [("escape", "cancel", "Cancel")]

    def compose(self) -> ComposeResult:
        yield Grid(
            Label("Confirma exclusao?", id="question"),
            Button("Sim", variant="error", id="yes"),
            Button("Nao", variant="primary", id="no"),
            id="dialog",
        )

    def on_button_pressed(self, event: Button.Pressed) -> None:
        self.dismiss(event.button.id == "yes")

    def action_cancel(self) -> None:
        self.dismiss(False)

# Uso com callback
def show_confirm(self) -> None:
    def handle_result(confirmed: bool) -> None:
        if confirmed:
            self.do_delete()
    self.push_screen(ConfirmDialog(), handle_result)

# Uso com await (requer @work)
from textual import work

@work
async def confirm_delete(self) -> None:
    result = await self.push_screen_wait(ConfirmDialog())
    if result:
        self.do_delete()
```

---

## Toast Notifications

```python
# Severidades: 'information' (default), 'warning', 'error'
self.notify("Arquivo salvo!", title="Sucesso")
self.notify("Erro ocorreu", title="Erro", severity="error", timeout=10)
self.notify("Verifique", severity="warning", timeout=None)  # Persistente
```

---

## Third-Party Widgets Recomendados

| Package | Proposito | Quando Usar |
|---------|-----------|-------------|
| **textual-fastdatatable** | Arrow/Parquet backend | Tabelas com 100K+ linhas |
| **textology** | Callbacks estilo Dash, MultiSelect | Padroes reativos |
| **textual-autocomplete** | Autocompletar input | Campos de busca |
| **textual-plotext** | Graficos no terminal | Visualizacao de dados |
| **textual-fspicker** | Seletor de arquivos modal | Dialogs de arquivo |
| **textual-window** | Janelas flutuantes | Aplicacoes MDI |
| **textual-image** | Exibir imagens (TGP/Sixel) | Preview de imagens |
| **zandev-textual-widgets** | MenuBar, context menus | UI estilo desktop |

**Catalogo completo:** https://github.com/davep/transcendent-textual

---

## Showcase Apps para Estudar

| App | GitHub | Aprender |
|-----|--------|----------|
| **Harlequin** | tconbeer/harlequin | Multi-panel SQL IDE, plugins |
| **Posting** | darrenburns/posting | 9+ temas, YAML config |
| **Dolphie** | charles-001/dolphie | Dashboards real-time |
| **Toolong** | Textualize/toolong | Performance, large files |
| **Elia** | darrenburns/elia | LLM client, streaming |
| **Frogmouth** | Textualize/frogmouth | Browser-like navigation |
