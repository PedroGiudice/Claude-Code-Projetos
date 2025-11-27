"""Vibe Matrix theme - Matrix green aesthetic."""

from textual.theme import Theme

VIBE_MATRIX_THEME = Theme(
    name="vibe-matrix",
    primary="#00ff41",  # Matrix green
    secondary="#008f11",  # Dark green
    accent="#00ff41",  # Bright green
    foreground="#00ff41",  # Green text
    background="#000000",  # Pure black
    surface="#0a0e0a",  # Very dark green-tinted
    panel="#0d120d",  # Darker green-tinted panel
    success="#00ff41",  # Matrix green
    warning="#ffff00",  # Yellow warning
    error="#ff0000",  # Red error
    dark=True,
)
