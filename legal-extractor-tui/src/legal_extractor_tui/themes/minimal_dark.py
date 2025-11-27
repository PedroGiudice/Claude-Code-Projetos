"""Minimal Dark theme - Soft blue on dark blue aesthetic."""

from textual.theme import Theme

MINIMAL_DARK_THEME = Theme(
    name="minimal-dark",
    primary="#4a9eff",  # Soft blue
    secondary="#5eb3ff",  # Light blue
    accent="#7ec8ff",  # Lighter blue
    foreground="#e0e6ed",  # Off-white
    background="#0f1419",  # Very dark blue
    surface="#1a1f29",  # Dark blue surface
    panel="#232936",  # Medium dark panel
    success="#7ec8ff",  # Light blue success
    warning="#ffaa33",  # Warm orange
    error="#ff6b6b",  # Soft red
    dark=True,
)
