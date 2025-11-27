"""Vibe Synthwave theme - Magenta/cyan over purple aesthetic."""

from textual.theme import Theme

VIBE_SYNTHWAVE_THEME = Theme(
    name="vibe-synthwave",
    primary="#ff006e",  # Hot magenta
    secondary="#8338ec",  # Electric purple
    accent="#06ffa5",  # Neon cyan
    foreground="#ffffff",  # Pure white
    background="#1a0b2e",  # Deep purple
    surface="#2d1b4e",  # Medium purple
    panel="#3e2c5f",  # Light purple panel
    success="#06ffa5",  # Cyan success
    warning="#ffbe0b",  # Golden yellow
    error="#ff006e",  # Hot magenta error
    dark=True,
)
