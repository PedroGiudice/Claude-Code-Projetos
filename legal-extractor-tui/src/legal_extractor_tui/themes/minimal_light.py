"""Minimal Light theme - Google blue on white aesthetic."""

from textual.theme import Theme

MINIMAL_LIGHT_THEME = Theme(
    name="minimal-light",
    primary="#1a73e8",  # Google blue
    secondary="#5094ed",  # Light blue
    accent="#80b4f2",  # Lighter blue
    foreground="#202124",  # Almost black
    background="#ffffff",  # Pure white
    surface="#f8f9fa",  # Off-white
    panel="#e8eaed",  # Light gray panel
    success="#1e8e3e",  # Green success
    warning="#f29900",  # Orange warning
    error="#d93025",  # Red error
    dark=False,
)
