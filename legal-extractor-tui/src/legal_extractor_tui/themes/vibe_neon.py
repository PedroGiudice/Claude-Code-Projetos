"""Vibe Neon theme - Dracula/Cyberpunk aesthetic."""

from textual.theme import Theme

VIBE_NEON_THEME = Theme(
    name="vibe-neon",
    primary="#8be9fd",  # Cyan neon
    secondary="#bd93f9",  # Roxo
    accent="#ff79c6",  # Magenta neon
    foreground="#f8f8f2",  # Texto claro
    background="#0d0d0d",  # Void black
    surface="#1a1a2e",  # Surface
    panel="#16213e",  # Paineis
    success="#50fa7b",  # Verde neon
    warning="#ffb86c",  # Laranja
    error="#ff5555",  # Vermelho
    dark=True,
)
