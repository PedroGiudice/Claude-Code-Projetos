"""Theme definitions for TUI Template."""

from textual.theme import Theme

from legal_extractor_tui.themes.minimal_dark import MINIMAL_DARK_THEME
from legal_extractor_tui.themes.minimal_light import MINIMAL_LIGHT_THEME
from legal_extractor_tui.themes.vibe_matrix import VIBE_MATRIX_THEME
from legal_extractor_tui.themes.vibe_neon import VIBE_NEON_THEME
from legal_extractor_tui.themes.vibe_synthwave import VIBE_SYNTHWAVE_THEME

# Registry of all available themes
THEMES: dict[str, Theme] = {
    "vibe-neon": VIBE_NEON_THEME,
    "matrix": VIBE_MATRIX_THEME,
    "synthwave": VIBE_SYNTHWAVE_THEME,
    "minimal-dark": MINIMAL_DARK_THEME,
    "minimal-light": MINIMAL_LIGHT_THEME,
}

__all__ = [
    "THEMES",
    "VIBE_NEON_THEME",
    "VIBE_MATRIX_THEME",
    "VIBE_SYNTHWAVE_THEME",
    "MINIMAL_DARK_THEME",
    "MINIMAL_LIGHT_THEME",
]
