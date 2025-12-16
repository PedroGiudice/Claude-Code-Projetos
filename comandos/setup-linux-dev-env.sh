#!/bin/bash
#===============================================================================
# Linux Developer Environment Setup Script
# Diagnoses existing tools and installs missing ones
# Safe to run multiple times (idempotent)
#===============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Counters
INSTALLED=0
SKIPPED=0
FAILED=0

#-------------------------------------------------------------------------------
# Helper Functions
#-------------------------------------------------------------------------------

print_header() {
    echo ""
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BOLD}${BLUE}  $1${NC}"
    echo -e "${BOLD}${BLUE}═══════════════════════════════════════════════════════════════${NC}"
}

print_section() {
    echo ""
    echo -e "${CYAN}▶ $1${NC}"
    echo -e "${CYAN}───────────────────────────────────────${NC}"
}

check_installed() {
    local name="$1"
    local cmd="$2"

    if command -v "$cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $name ${GREEN}(already installed)${NC}"
        ((SKIPPED++))
        return 0
    else
        echo -e "  ${YELLOW}○${NC} $name ${YELLOW}(not found)${NC}"
        return 1
    fi
}

install_apt() {
    local name="$1"
    local package="$2"
    local cmd="${3:-$package}"

    if command -v "$cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $name ${GREEN}(already installed)${NC}"
        ((SKIPPED++))
        return 0
    fi

    echo -e "  ${YELLOW}→${NC} Installing $name..."
    if sudo apt install -y "$package" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $name ${GREEN}installed${NC}"
        ((INSTALLED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name ${RED}failed to install${NC}"
        ((FAILED++))
        return 1
    fi
}

install_from_github() {
    local name="$1"
    local repo="$2"
    local cmd="$3"
    local install_cmd="$4"

    if command -v "$cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $name ${GREEN}(already installed)${NC}"
        ((SKIPPED++))
        return 0
    fi

    echo -e "  ${YELLOW}→${NC} Installing $name from GitHub..."
    if eval "$install_cmd" &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} $name ${GREEN}installed${NC}"
        ((INSTALLED++))
        return 0
    else
        echo -e "  ${RED}✗${NC} $name ${RED}failed to install${NC}"
        ((FAILED++))
        return 1
    fi
}

check_shell_config() {
    local config_file="$1"
    local search_string="$2"

    if [ -f "$config_file" ] && grep -q "$search_string" "$config_file" 2>/dev/null; then
        return 0
    fi
    return 1
}

add_to_shell_config() {
    local config_file="$1"
    local content="$2"
    local marker="$3"

    if check_shell_config "$config_file" "$marker"; then
        echo -e "    ${GREEN}✓${NC} Already configured"
        return 0
    fi

    echo "" >> "$config_file"
    echo "$content" >> "$config_file"
    echo -e "    ${GREEN}✓${NC} Added to $config_file"
    return 0
}

#-------------------------------------------------------------------------------
# Main Script
#-------------------------------------------------------------------------------

print_header "LINUX DEV ENVIRONMENT SETUP"
echo -e "This script will diagnose your system and install missing tools."
echo -e "Safe to run multiple times - existing installations will be skipped."
echo ""

# Detect shell
CURRENT_SHELL=$(basename "$SHELL")
if [ "$CURRENT_SHELL" = "zsh" ]; then
    SHELL_RC="$HOME/.zshrc"
elif [ "$CURRENT_SHELL" = "bash" ]; then
    SHELL_RC="$HOME/.bashrc"
else
    SHELL_RC="$HOME/.bashrc"
fi
echo -e "Detected shell: ${CYAN}$CURRENT_SHELL${NC} (config: $SHELL_RC)"

#-------------------------------------------------------------------------------
print_header "PHASE 1: SYSTEM DIAGNOSIS"
#-------------------------------------------------------------------------------

print_section "Terminal & Shell"
check_installed "Kitty" "kitty" || true
check_installed "tmux" "tmux" || true
check_installed "Bash" "bash" || true
check_installed "Zsh" "zsh" || true

print_section "Core CLI Tools"
check_installed "git" "git" || true
check_installed "curl" "curl" || true
check_installed "wget" "wget" || true

print_section "Modern CLI Replacements"
check_installed "fzf (fuzzy finder)" "fzf" || true
check_installed "ripgrep (rg)" "rg" || true
check_installed "bat (better cat)" "batcat" || check_installed "bat" "bat" || true
check_installed "eza (better ls)" "eza" || true
check_installed "fd (better find)" "fdfind" || check_installed "fd" "fd" || true
check_installed "zoxide (smart cd)" "zoxide" || true
check_installed "delta (git diffs)" "delta" || true

print_section "System Monitoring"
check_installed "btop" "btop" || true
check_installed "htop" "htop" || true
check_installed "ncdu (disk usage)" "ncdu" || true
check_installed "duf (disk free)" "duf" || true

print_section "Developer Tools"
check_installed "lazygit" "lazygit" || true
check_installed "jq (JSON)" "jq" || true
check_installed "yq (YAML)" "yq" || true
check_installed "httpie" "http" || true
check_installed "tldr" "tldr" || true
check_installed "direnv" "direnv" || true
check_installed "glow (Markdown)" "glow" || true
check_installed "tokei (code stats)" "tokei" || true

print_section "Shell Enhancements"
check_installed "Starship prompt" "starship" || true
check_installed "neofetch" "neofetch" || true

print_section "tmux Plugins"
if [ -d "$HOME/.tmux/plugins/tpm" ]; then
    echo -e "  ${GREEN}✓${NC} TPM (tmux plugin manager) ${GREEN}(already installed)${NC}"
else
    echo -e "  ${YELLOW}○${NC} TPM (tmux plugin manager) ${YELLOW}(not found)${NC}"
fi

#-------------------------------------------------------------------------------
print_header "PHASE 2: INSTALLATION"
#-------------------------------------------------------------------------------

echo -e "\nProceed with installation? (y/n): "
read -r CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Installation cancelled.${NC}"
    exit 0
fi

# Update apt cache
echo -e "\n${CYAN}Updating package cache...${NC}"
sudo apt update

print_section "Installing APT Packages"

# Core tools
install_apt "git" "git"
install_apt "curl" "curl"
install_apt "wget" "wget"
install_apt "tmux" "tmux"

# Modern CLI replacements
install_apt "fzf" "fzf"
install_apt "ripgrep" "ripgrep" "rg"
install_apt "bat" "bat" "batcat"
install_apt "fd-find" "fd-find" "fdfind"

# eza (may need external repo on older Ubuntu)
if ! command -v eza &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing eza..."
    if sudo apt install -y eza &> /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} eza ${GREEN}installed${NC}"
        ((INSTALLED++))
    else
        # Try adding the GPG key and repo for older Ubuntu
        echo -e "  ${YELLOW}→${NC} Adding eza repository..."
        sudo mkdir -p /etc/apt/keyrings
        wget -qO- https://raw.githubusercontent.com/eza-community/eza/main/deb.asc | sudo gpg --dearmor -o /etc/apt/keyrings/gierens.gpg 2>/dev/null || true
        echo "deb [signed-by=/etc/apt/keyrings/gierens.gpg] http://deb.gierens.de stable main" | sudo tee /etc/apt/sources.list.d/gierens.list > /dev/null
        sudo apt update &> /dev/null
        if sudo apt install -y eza &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} eza ${GREEN}installed${NC}"
            ((INSTALLED++))
        else
            echo -e "  ${RED}✗${NC} eza ${RED}failed - install manually${NC}"
            ((FAILED++))
        fi
    fi
else
    echo -e "  ${GREEN}✓${NC} eza ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

# System monitoring
install_apt "btop" "btop"
install_apt "htop" "htop"
install_apt "ncdu" "ncdu"
install_apt "duf" "duf"

# Developer tools
install_apt "jq" "jq"
install_apt "httpie" "httpie" "http"
install_apt "tldr" "tldr"
install_apt "direnv" "direnv"
install_apt "neofetch" "neofetch"

print_section "Installing from External Sources"

# zoxide
if ! command -v zoxide &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing zoxide..."
    if curl -sS https://raw.githubusercontent.com/ajeetdsouza/zoxide/main/install.sh | bash &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} zoxide ${GREEN}installed${NC}"
        ((INSTALLED++))
    else
        echo -e "  ${RED}✗${NC} zoxide ${RED}failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${GREEN}✓${NC} zoxide ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

# Starship
if ! command -v starship &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing starship..."
    if curl -sS https://starship.rs/install.sh | sh -s -- -y &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} starship ${GREEN}installed${NC}"
        ((INSTALLED++))
    else
        echo -e "  ${RED}✗${NC} starship ${RED}failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${GREEN}✓${NC} starship ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

# delta (git-delta)
if ! command -v delta &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing delta..."
    DELTA_VERSION=$(curl -s https://api.github.com/repos/dandavison/delta/releases/latest | grep tag_name | cut -d '"' -f 4)
    DELTA_DEB="git-delta_${DELTA_VERSION}_amd64.deb"
    if wget -q "https://github.com/dandavison/delta/releases/download/${DELTA_VERSION}/${DELTA_DEB}" -O "/tmp/${DELTA_DEB}" 2>/dev/null; then
        if sudo dpkg -i "/tmp/${DELTA_DEB}" &> /dev/null; then
            echo -e "  ${GREEN}✓${NC} delta ${GREEN}installed${NC}"
            ((INSTALLED++))
        else
            echo -e "  ${RED}✗${NC} delta ${RED}failed${NC}"
            ((FAILED++))
        fi
        rm -f "/tmp/${DELTA_DEB}"
    else
        echo -e "  ${RED}✗${NC} delta ${RED}download failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${GREEN}✓${NC} delta ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

# lazygit
if ! command -v lazygit &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing lazygit..."
    LAZYGIT_VERSION=$(curl -s "https://api.github.com/repos/jesseduffield/lazygit/releases/latest" | grep -Po '"tag_name": "v\K[^"]*')
    if curl -Lo /tmp/lazygit.tar.gz "https://github.com/jesseduffield/lazygit/releases/latest/download/lazygit_${LAZYGIT_VERSION}_Linux_x86_64.tar.gz" 2>/dev/null; then
        tar xf /tmp/lazygit.tar.gz -C /tmp lazygit
        sudo install /tmp/lazygit /usr/local/bin
        rm -f /tmp/lazygit.tar.gz /tmp/lazygit
        echo -e "  ${GREEN}✓${NC} lazygit ${GREEN}installed${NC}"
        ((INSTALLED++))
    else
        echo -e "  ${RED}✗${NC} lazygit ${RED}failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${GREEN}✓${NC} lazygit ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

# glow (Markdown renderer)
if ! command -v glow &> /dev/null; then
    echo -e "  ${YELLOW}→${NC} Installing glow..."
    if sudo mkdir -p /etc/apt/keyrings && \
       curl -fsSL https://repo.charm.sh/apt/gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/charm.gpg 2>/dev/null && \
       echo "deb [signed-by=/etc/apt/keyrings/charm.gpg] https://repo.charm.sh/apt/ * *" | sudo tee /etc/apt/sources.list.d/charm.list > /dev/null && \
       sudo apt update &> /dev/null && \
       sudo apt install -y glow &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} glow ${GREEN}installed${NC}"
        ((INSTALLED++))
    else
        echo -e "  ${RED}✗${NC} glow ${RED}failed${NC}"
        ((FAILED++))
    fi
else
    echo -e "  ${GREEN}✓${NC} glow ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

#-------------------------------------------------------------------------------
print_header "PHASE 3: TMUX SETUP"
#-------------------------------------------------------------------------------

print_section "TPM (tmux Plugin Manager)"

if [ ! -d "$HOME/.tmux/plugins/tpm" ]; then
    echo -e "  ${YELLOW}→${NC} Installing TPM..."
    git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm &> /dev/null
    echo -e "  ${GREEN}✓${NC} TPM ${GREEN}installed${NC}"
    ((INSTALLED++))
else
    echo -e "  ${GREEN}✓${NC} TPM ${GREEN}(already installed)${NC}"
    ((SKIPPED++))
fi

print_section "tmux Configuration"

TMUX_CONF="$HOME/.tmux.conf"
if [ ! -f "$TMUX_CONF" ] || ! grep -q "tmux-plugins/tpm" "$TMUX_CONF" 2>/dev/null; then
    echo -e "  ${YELLOW}→${NC} Creating/updating tmux.conf..."

    # Backup existing config
    [ -f "$TMUX_CONF" ] && cp "$TMUX_CONF" "${TMUX_CONF}.backup"

    cat >> "$TMUX_CONF" << 'TMUXCONF'

#===============================================================================
# TMUX Configuration (auto-generated by setup script)
#===============================================================================

# Better prefix key (Ctrl+a instead of Ctrl+b)
# Uncomment if you prefer Ctrl+a:
# unbind C-b
# set -g prefix C-a
# bind C-a send-prefix

# Enable mouse support
set -g mouse on

# Start windows and panes at 1, not 0
set -g base-index 1
setw -g pane-base-index 1

# Renumber windows when one is closed
set -g renumber-windows on

# Better colors
set -g default-terminal "tmux-256color"
set -ag terminal-overrides ",xterm-256color:RGB"

# Increase scrollback buffer
set -g history-limit 50000

# Faster key repetition
set -s escape-time 0

# Activity monitoring
setw -g monitor-activity on
set -g visual-activity off

# Better split keys
bind | split-window -h -c "#{pane_current_path}"
bind - split-window -v -c "#{pane_current_path}"

# Easy reload
bind r source-file ~/.tmux.conf \; display "Config reloaded!"

# Vim-style pane navigation
bind h select-pane -L
bind j select-pane -D
bind k select-pane -U
bind l select-pane -R

# Resize panes with Vim keys
bind -r H resize-pane -L 5
bind -r J resize-pane -D 5
bind -r K resize-pane -U 5
bind -r L resize-pane -R 5

#-------------------------------------------------------------------------------
# Status Bar
#-------------------------------------------------------------------------------
set -g status-position bottom
set -g status-style 'bg=#1e1e2e fg=#cdd6f4'
set -g status-left-length 50
set -g status-right-length 100
set -g status-left '#[fg=#1e1e2e,bg=#89b4fa,bold] #S #[fg=#89b4fa,bg=#1e1e2e]'
set -g status-right '#[fg=#45475a]│ #[fg=#f9e2af]%H:%M #[fg=#45475a]│ #[fg=#a6e3a1]%d-%b-%Y '

# Window status
setw -g window-status-format '#[fg=#6c7086] #I:#W '
setw -g window-status-current-format '#[fg=#1e1e2e,bg=#cba6f7,bold] #I:#W #[fg=#cba6f7,bg=#1e1e2e]'

#-------------------------------------------------------------------------------
# Plugins (managed by TPM)
#-------------------------------------------------------------------------------
set -g @plugin 'tmux-plugins/tpm'
set -g @plugin 'tmux-plugins/tmux-sensible'
set -g @plugin 'tmux-plugins/tmux-resurrect'
set -g @plugin 'tmux-plugins/tmux-continuum'
set -g @plugin 'tmux-plugins/tmux-yank'

# Resurrect settings
set -g @resurrect-capture-pane-contents 'on'
set -g @resurrect-strategy-nvim 'session'

# Continuum settings (auto-save every 15 min)
set -g @continuum-restore 'on'
set -g @continuum-save-interval '15'

# Initialize TPM (keep this at the very bottom)
run '~/.tmux/plugins/tpm/tpm'
TMUXCONF

    echo -e "  ${GREEN}✓${NC} tmux.conf ${GREEN}configured${NC}"
    echo -e "  ${CYAN}ℹ${NC}  Run 'tmux source ~/.tmux.conf' then press prefix+I to install plugins"
else
    echo -e "  ${GREEN}✓${NC} tmux.conf ${GREEN}(already configured)${NC}"
fi

#-------------------------------------------------------------------------------
print_header "PHASE 4: SHELL CONFIGURATION"
#-------------------------------------------------------------------------------

print_section "Shell Integrations"

# Create aliases block
ALIASES_BLOCK='
#===============================================================================
# Modern CLI Aliases (auto-generated by setup script)
#===============================================================================

# Modern replacements
command -v eza &> /dev/null && alias ls="eza --icons --group-directories-first"
command -v eza &> /dev/null && alias ll="eza -la --icons --group-directories-first"
command -v eza &> /dev/null && alias lt="eza --tree --level=2 --icons"
command -v batcat &> /dev/null && alias cat="batcat"
command -v bat &> /dev/null && alias cat="bat"
command -v fdfind &> /dev/null && alias fd="fdfind"

# Git shortcuts
alias g="git"
alias gs="git status"
alias gd="git diff"
alias gl="git log --oneline -20"
command -v lazygit &> /dev/null && alias lg="lazygit"

# Navigation
alias ..="cd .."
alias ...="cd ../.."
alias ....="cd ../../.."

# Safety nets
alias rm="rm -i"
alias mv="mv -i"
alias cp="cp -i"
'

# Create integrations block
INTEGRATIONS_BLOCK='
#===============================================================================
# Tool Integrations (auto-generated by setup script)
#===============================================================================

# fzf
[ -f /usr/share/doc/fzf/examples/key-bindings.bash ] && source /usr/share/doc/fzf/examples/key-bindings.bash
[ -f /usr/share/doc/fzf/examples/completion.bash ] && source /usr/share/doc/fzf/examples/completion.bash

# zoxide (smart cd)
command -v zoxide &> /dev/null && eval "$(zoxide init bash)"

# direnv (auto-load .envrc)
command -v direnv &> /dev/null && eval "$(direnv hook bash)"

# Starship prompt
command -v starship &> /dev/null && eval "$(starship init bash)"
'

echo -e "  Configuring $SHELL_RC..."

# Add aliases if not present
if ! grep -q "Modern CLI Aliases" "$SHELL_RC" 2>/dev/null; then
    echo "$ALIASES_BLOCK" >> "$SHELL_RC"
    echo -e "    ${GREEN}✓${NC} Aliases added"
else
    echo -e "    ${GREEN}✓${NC} Aliases already present"
fi

# Add integrations if not present
if ! grep -q "Tool Integrations" "$SHELL_RC" 2>/dev/null; then
    echo "$INTEGRATIONS_BLOCK" >> "$SHELL_RC"
    echo -e "    ${GREEN}✓${NC} Tool integrations added"
else
    echo -e "    ${GREEN}✓${NC} Tool integrations already present"
fi

#-------------------------------------------------------------------------------
print_header "PHASE 5: GIT CONFIGURATION"
#-------------------------------------------------------------------------------

print_section "Git Delta Integration"

if command -v delta &> /dev/null; then
    if ! git config --global core.pager &> /dev/null || [ "$(git config --global core.pager)" != "delta" ]; then
        echo -e "  ${YELLOW}→${NC} Configuring git to use delta..."
        git config --global core.pager delta
        git config --global interactive.diffFilter "delta --color-only"
        git config --global delta.navigate true
        git config --global delta.light false
        git config --global delta.line-numbers true
        git config --global delta.side-by-side true
        git config --global merge.conflictstyle diff3
        git config --global diff.colorMoved default
        echo -e "  ${GREEN}✓${NC} Git delta integration ${GREEN}configured${NC}"
    else
        echo -e "  ${GREEN}✓${NC} Git delta ${GREEN}(already configured)${NC}"
    fi
else
    echo -e "  ${YELLOW}○${NC} Delta not installed, skipping git config"
fi

#-------------------------------------------------------------------------------
print_header "PHASE 6: KITTY CONFIGURATION"
#-------------------------------------------------------------------------------

print_section "Kitty Terminal Config"

KITTY_CONF="$HOME/.config/kitty/kitty.conf"
mkdir -p "$HOME/.config/kitty"

if [ ! -f "$KITTY_CONF" ] || ! grep -q "auto-generated by setup script" "$KITTY_CONF" 2>/dev/null; then
    echo -e "  ${YELLOW}→${NC} Creating Kitty configuration..."

    # Backup existing config
    [ -f "$KITTY_CONF" ] && cp "$KITTY_CONF" "${KITTY_CONF}.backup"

    cat > "$KITTY_CONF" << 'KITTYCONF'
#===============================================================================
# Kitty Configuration (auto-generated by setup script)
#===============================================================================

# Font settings
font_family      JetBrainsMono Nerd Font
bold_font        auto
italic_font      auto
bold_italic_font auto
font_size        12.0

# Disable ligatures if you don't like them
disable_ligatures never

# Cursor
cursor_shape beam
cursor_blink_interval 0.5

# Scrollback
scrollback_lines 10000

# Mouse
mouse_hide_wait 3.0
url_style curly
open_url_with default
copy_on_select clipboard

# Window
window_padding_width 8
placement_strategy center
hide_window_decorations no

# Tab bar
tab_bar_edge bottom
tab_bar_style powerline
tab_powerline_style slanted
active_tab_font_style bold

# Bell
enable_audio_bell no
visual_bell_duration 0.0

# Performance
repaint_delay 10
input_delay 3
sync_to_monitor yes

#-------------------------------------------------------------------------------
# Keybindings
#-------------------------------------------------------------------------------
map ctrl+shift+enter new_window_with_cwd
map ctrl+shift+t     new_tab_with_cwd
map ctrl+shift+n     new_os_window_with_cwd

map ctrl+shift+left  previous_tab
map ctrl+shift+right next_tab

map ctrl+shift+c     copy_to_clipboard
map ctrl+shift+v     paste_from_clipboard

map ctrl+shift+up    scroll_line_up
map ctrl+shift+down  scroll_line_down
map ctrl+shift+page_up scroll_page_up
map ctrl+shift+page_down scroll_page_down

map ctrl+shift+f     show_scrollback

# Font size
map ctrl+shift+equal change_font_size all +1.0
map ctrl+shift+minus change_font_size all -1.0
map ctrl+shift+0     change_font_size all 0

#-------------------------------------------------------------------------------
# Color Scheme (Catppuccin Mocha)
#-------------------------------------------------------------------------------
foreground              #CDD6F4
background              #1E1E2E
selection_foreground    #1E1E2E
selection_background    #F5E0DC

cursor                  #F5E0DC
cursor_text_color       #1E1E2E

url_color               #F5E0DC

active_border_color     #B4BEFE
inactive_border_color   #6C7086
bell_border_color       #F9E2AF

active_tab_foreground   #11111B
active_tab_background   #CBA6F7
inactive_tab_foreground #CDD6F4
inactive_tab_background #181825
tab_bar_background      #11111B

# Black
color0  #45475A
color8  #585B70

# Red
color1  #F38BA8
color9  #F38BA8

# Green
color2  #A6E3A1
color10 #A6E3A1

# Yellow
color3  #F9E2AF
color11 #F9E2AF

# Blue
color4  #89B4FA
color12 #89B4FA

# Magenta
color5  #F5C2E7
color13 #F5C2E7

# Cyan
color6  #94E2D5
color14 #94E2D5

# White
color7  #BAC2DE
color15 #A6ADC8
KITTYCONF

    echo -e "  ${GREEN}✓${NC} Kitty config ${GREEN}created${NC}"
    echo -e "  ${CYAN}ℹ${NC}  Install a Nerd Font for icons: https://www.nerdfonts.com/"
else
    echo -e "  ${GREEN}✓${NC} Kitty config ${GREEN}(already exists)${NC}"
fi

#-------------------------------------------------------------------------------
print_header "SETUP COMPLETE"
#-------------------------------------------------------------------------------

echo ""
echo -e "${GREEN}Summary:${NC}"
echo -e "  ${GREEN}✓${NC} Installed: ${BOLD}$INSTALLED${NC} tools"
echo -e "  ${CYAN}○${NC} Skipped:   ${BOLD}$SKIPPED${NC} (already installed)"
if [ $FAILED -gt 0 ]; then
    echo -e "  ${RED}✗${NC} Failed:    ${BOLD}$FAILED${NC} (check manually)"
fi

echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo -e "  1. ${CYAN}source $SHELL_RC${NC} to reload shell config"
echo -e "  2. ${CYAN}tmux source ~/.tmux.conf${NC} then ${CYAN}prefix+I${NC} to install tmux plugins"
echo -e "  3. Install a Nerd Font for icons: ${CYAN}https://www.nerdfonts.com/${NC}"
echo -e "  4. Run ${CYAN}tldr --update${NC} to download tldr pages"
echo ""
echo -e "${GREEN}Enjoy your enhanced terminal environment!${NC}"
