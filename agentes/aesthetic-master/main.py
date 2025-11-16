#!/usr/bin/env python3
"""
Aesthetic Master Agent - Frontend & Design Specialist
Enforcement absoluto de regras estéticas e melhores práticas de frontend
"""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Diretórios do projeto
AGENT_DIR = Path(__file__).parent
CONFIG_DIR = AGENT_DIR / "config"
DESIGN_PRINCIPLES = CONFIG_DIR / "design_principles.json"
AESTHETIC_RULES = CONFIG_DIR / "aesthetic_rules.json"


def load_config(config_file: Path) -> Dict:
    """Carrega arquivo de configuração JSON"""
    with open(config_file, 'r', encoding='utf-8') as f:
        return json.load(f)


def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """Converte cor hex para RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def get_relative_luminance(rgb: Tuple[int, int, int]) -> float:
    """
    Calcula luminância relativa conforme WCAG 2.1
    https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
    """
    def adjust(channel: int) -> float:
        c = channel / 255.0
        if c <= 0.03928:
            return c / 12.92
        else:
            return ((c + 0.055) / 1.055) ** 2.4

    r, g, b = rgb
    R = adjust(r)
    G = adjust(g)
    B = adjust(b)

    return 0.2126 * R + 0.7152 * G + 0.0722 * B


def validate_color_contrast(foreground: str, background: str) -> float:
    """
    Calcula razão de contraste entre duas cores
    WCAG 2.1 requer 4.5:1 para texto normal, 3.0:1 para texto grande

    Args:
        foreground: Cor do texto em hex (#RRGGBB)
        background: Cor de fundo em hex (#RRGGBB)

    Returns:
        Razão de contraste (1.0 a 21.0)
    """
    try:
        fg_rgb = hex_to_rgb(foreground)
        bg_rgb = hex_to_rgb(background)

        fg_lum = get_relative_luminance(fg_rgb)
        bg_lum = get_relative_luminance(bg_rgb)

        # Luminância maior sempre no numerador
        lighter = max(fg_lum, bg_lum)
        darker = min(fg_lum, bg_lum)

        contrast_ratio = (lighter + 0.05) / (darker + 0.05)
        return round(contrast_ratio, 2)

    except (ValueError, IndexError):
        # Se parsing falhar, retornar 1.0 (pior contraste)
        return 1.0


def extract_colors_from_code(content: str) -> List[str]:
    """Extrai cores hexadecimais do código"""
    hex_pattern = r'#[0-9A-Fa-f]{6}\b'
    return re.findall(hex_pattern, content)


def extract_font_sizes(content: str) -> List[str]:
    """Extrai tamanhos de fonte do código"""
    font_size_pattern = r'font-size:\s*(\d+)px'
    return re.findall(font_size_pattern, content)


def extract_spacing_values(content: str) -> List[str]:
    """Extrai valores de spacing (padding, margin)"""
    spacing_pattern = r'(?:padding|margin):\s*(\d+)px'
    return re.findall(spacing_pattern, content)


def check_accessibility_issues(content: str) -> List[str]:
    """Verifica problemas comuns de acessibilidade"""
    issues = []

    # Verifica se há <img> sem alt
    if re.search(r'<img\s+(?![^>]*alt=)', content, re.IGNORECASE):
        issues.append("Images without alt text found")

    # Verifica se há botões sem aria-label
    if re.search(r'<button\s+(?![^>]*aria-label=)', content, re.IGNORECASE):
        button_count = len(re.findall(r'<button', content, re.IGNORECASE))
        if button_count > 0:
            issues.append(f"{button_count} button(s) potentially missing aria-label")

    # Verifica uso de onClick sem onKeyPress
    onclick_count = len(re.findall(r'onClick=', content))
    onkeypress_count = len(re.findall(r'onKeyPress=|onKeyDown=', content))
    if onclick_count > onkeypress_count:
        issues.append(f"Interactive elements may lack keyboard support ({onclick_count} onClick vs {onkeypress_count} keyboard handlers)")

    return issues


def audit_component(component_path: Path, rules: Dict) -> Dict:
    """
    Audita um componente contra regras estéticas

    Returns:
        Dict com violations encontradas por categoria
    """
    violations = {
        "BLOCKER": [],
        "CRITICAL": [],
        "HIGH": [],
        "MEDIUM": [],
        "LOW": []
    }

    if not component_path.exists():
        violations["BLOCKER"].append(f"File not found: {component_path}")
        return violations

    try:
        content = component_path.read_text(encoding='utf-8')
    except Exception as e:
        violations["BLOCKER"].append(f"Failed to read file: {e}")
        return violations

    # === COLOR RULES ===
    colors = extract_colors_from_code(content)
    if colors:
        # Verifica cores hardcoded (regra FORBIDDEN)
        for color in colors:
            # Verifica pure black/white
            if color.upper() in ['#000000', '#FFFFFF']:
                violations["BLOCKER"].append(
                    f"Pure black/white found: {color} (use design tokens instead)"
                )

            # Verifica se cor está fora de design tokens (simplificado)
            violations["MEDIUM"].append(
                f"Hardcoded color found: {color} (consider using design tokens)"
            )

    # === TYPOGRAPHY RULES ===
    font_sizes = extract_font_sizes(content)
    for size in font_sizes:
        size_int = int(size)
        # Font-size < 14px é FORBIDDEN
        if size_int < 14:
            violations["BLOCKER"].append(
                f"Font size too small: {size}px (minimum 14px for body text)"
            )
        # Não múltiplo de 4px (não segue type scale)
        if size_int % 4 != 0:
            violations["MEDIUM"].append(
                f"Font size {size}px doesn't follow type scale (use 4px increments)"
            )

    # === SPACING RULES ===
    spacing_values = extract_spacing_values(content)
    for spacing in spacing_values:
        spacing_int = int(spacing)
        # Não múltiplo de 8px (viola 8px spacing system)
        if spacing_int % 8 != 0 and spacing_int % 4 != 0:
            violations["HIGH"].append(
                f"Spacing value {spacing}px doesn't follow 8px system (use multiples of 4 or 8)"
            )

    # === ACCESSIBILITY RULES ===
    a11y_issues = check_accessibility_issues(content)
    for issue in a11y_issues:
        violations["BLOCKER"].append(f"Accessibility: {issue}")

    # === CODE QUALITY RULES ===
    line_count = len(content.split('\n'))
    if line_count > 500:
        violations["CRITICAL"].append(
            f"Component too large: {line_count} lines (max 500 recommended)"
        )
    elif line_count > 300:
        violations["HIGH"].append(
            f"Component large: {line_count} lines (consider splitting at 300+)"
        )

    # Verifica console.log em produção
    if 'console.log' in content:
        log_count = content.count('console.log')
        violations["CRITICAL"].append(
            f"{log_count} console.log() statement(s) found (remove in production)"
        )

    # Verifica TODO sem tickets
    todos = re.findall(r'//\s*TODO:?\s*(.+)', content)
    for todo in todos:
        if not re.search(r'#\d+|TICKET-\d+', todo):
            violations["LOW"].append(
                f"TODO without ticket reference: {todo[:50]}"
            )

    # === COMPONENT RULES ===
    # Verifica inline styles sem CSS-in-JS
    if 'style={{' in content or 'style="' in content:
        violations["MEDIUM"].append(
            "Inline styles found (use CSS-in-JS library or design tokens)"
        )

    return violations


def generate_report(violations: Dict) -> str:
    """
    Gera relatório formatado de violações
    """
    report = []
    report.append("=" * 80)
    report.append("AESTHETIC MASTER - AUDIT REPORT")
    report.append("=" * 80)
    report.append("")

    total_violations = sum(len(v) for v in violations.values())

    if total_violations == 0:
        report.append("✅ NO VIOLATIONS FOUND - Excellent aesthetic compliance!")
        report.append("")
        return "\n".join(report)

    for level in ["BLOCKER", "CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        issues = violations[level]
        if issues:
            report.append(f"\n{level} ({len(issues)} issues):")
            report.append("-" * 80)
            for issue in issues:
                report.append(f"  ❌ {issue}")

    report.append("")
    report.append("=" * 80)
    report.append(f"TOTAL VIOLATIONS: {total_violations}")
    report.append("=" * 80)

    return "\n".join(report)


def review_mode(target: Path, rules: Dict, principles: Dict):
    """
    Modo Review: Analisa componente/arquivo específico
    """
    print(f"🎨 Aesthetic Master - Reviewing: {target}")
    print("")

    violations = audit_component(target, rules)
    report = generate_report(violations)

    print(report)

    # Exit code baseado em violações BLOCKER
    if violations["BLOCKER"]:
        sys.exit(1)  # Falha se houver blockers
    else:
        sys.exit(0)


def audit_mode(project_path: Path, rules: Dict, principles: Dict):
    """
    Modo Audit: Audita projeto completo
    """
    print(f"🎨 Aesthetic Master - Auditing Project: {project_path}")
    print("")

    if not project_path.exists():
        print(f"❌ Project path not found: {project_path}")
        sys.exit(1)

    # Extensões de arquivo para auditar
    target_extensions = ['.tsx', '.jsx', '.ts', '.js', '.vue', '.css', '.scss', '.sass']

    # Encontrar todos arquivos relevantes
    files_to_audit = []
    for ext in target_extensions:
        files_to_audit.extend(project_path.rglob(f'*{ext}'))

    # Filtrar node_modules, .git, dist, build
    excluded_dirs = {'node_modules', '.git', 'dist', 'build', '.next', 'out', 'coverage'}
    files_to_audit = [
        f for f in files_to_audit
        if not any(excluded in f.parts for excluded in excluded_dirs)
    ]

    if not files_to_audit:
        print(f"⚠️  No component files found in {project_path}")
        print(f"    Looking for: {', '.join(target_extensions)}")
        sys.exit(0)

    print(f"📂 Found {len(files_to_audit)} files to audit")
    print("")

    # Consolidar violações de todos os arquivos
    all_violations = {
        "BLOCKER": [],
        "CRITICAL": [],
        "HIGH": [],
        "MEDIUM": [],
        "LOW": []
    }

    files_with_issues = 0
    files_clean = 0

    for file_path in files_to_audit:
        violations = audit_component(file_path, rules)

        # Verificar se arquivo tem violações
        has_violations = any(len(v) > 0 for v in violations.values())

        if has_violations:
            files_with_issues += 1
            # Adicionar caminho relativo às violações
            rel_path = file_path.relative_to(project_path)
            for level, issues in violations.items():
                for issue in issues:
                    all_violations[level].append(f"{rel_path}: {issue}")
        else:
            files_clean += 1

    # Gerar relatório consolidado
    print("=" * 80)
    print("AESTHETIC MASTER - PROJECT AUDIT REPORT")
    print("=" * 80)
    print("")
    print(f"📊 Files audited: {len(files_to_audit)}")
    print(f"   ✅ Clean: {files_clean}")
    print(f"   ⚠️  With issues: {files_with_issues}")
    print("")

    report = generate_report(all_violations)
    print(report)

    # Exit code baseado em violações
    if all_violations["BLOCKER"]:
        print("\n❌ Audit FAILED: BLOCKER violations found")
        sys.exit(1)
    elif all_violations["CRITICAL"]:
        print("\n⚠️  Audit WARNING: CRITICAL violations found")
        sys.exit(0)
    else:
        print("\n✅ Audit PASSED")
        sys.exit(0)


def generate_component_template(component_name: str, variant: str, principles: Dict) -> str:
    """Gera template de componente React/TypeScript"""

    # Extrair design principles
    colors = principles.get('color_philosophy', {})
    spacing = principles.get('spacing', {})
    typography = principles.get('typography', {})

    template = f'''import React from 'react';
import {{ cn }} from '@/lib/utils';

interface {component_name}Props {{
  variant?: '{variant}' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}}

/**
 * {component_name} - Generated by Aesthetic Master
 *
 * Design Principles Applied:
 * - Spacing: {spacing.get('system', '8px base')}
 * - Typography: {typography.get('heading_family', 'sans-serif')}
 * - Accessibility: WCAG 2.1 AA compliant
 */
export const {component_name}: React.FC<{component_name}Props> = ({{
  variant = '{variant}',
  size = 'md',
  disabled = false,
  loading = false,
  children,
  onClick,
  className,
}}) => {{

  // Base styles (8px spacing system)
  const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none';

  // Variant styles (using design tokens)
  const variantStyles = {{
    {variant}: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
  }};

  // Size styles (following spacing scale: {spacing.get('scale', [4, 8, 12, 16])})
  const sizeStyles = {{
    sm: 'h-8 px-3 text-sm',     // 32px height, 12px padding
    md: 'h-10 px-4 text-base',  // 40px height, 16px padding
    lg: 'h-12 px-6 text-lg',    // 48px height, 24px padding
  }};

  return (
    <button
      type="button"
      onClick={{onClick}}
      disabled={{disabled || loading}}
      className={{cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}}
      aria-busy={{loading}}
      aria-disabled={{disabled}}
    >
      {{loading && (
        <svg
          className="mr-2 h-4 w-4 animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}}
      {{children}}
    </button>
  );
}};
'''
    return template


def generate_storybook_story(component_name: str, variant: str) -> str:
    """Gera Storybook story para componente"""

    story = f'''import type {{ Meta, StoryObj }} from '@storybook/react';
import {{ {component_name} }} from './{component_name}';

const meta: Meta<typeof {component_name}> = {{
  title: 'Components/{component_name}',
  component: {component_name},
  parameters: {{
    layout: 'centered',
  }},
  tags: ['autodocs'],
  argTypes: {{
    variant: {{
      control: 'select',
      options: ['{variant}', 'secondary', 'outline'],
    }},
    size: {{
      control: 'select',
      options: ['sm', 'md', 'lg'],
    }},
    disabled: {{ control: 'boolean' }},
    loading: {{ control: 'boolean' }},
  }},
}};

export default meta;
type Story = StoryObj<typeof {component_name}>;

export const Default: Story = {{
  args: {{
    children: 'Click me',
    variant: '{variant}',
  }},
}};

export const Secondary: Story = {{
  args: {{
    children: 'Secondary',
    variant: 'secondary',
  }},
}};

export const Outline: Story = {{
  args: {{
    children: 'Outline',
    variant: 'outline',
  }},
}};

export const Disabled: Story = {{
  args: {{
    children: 'Disabled',
    disabled: true,
  }},
}};

export const Loading: Story = {{
  args: {{
    children: 'Loading',
    loading: true,
  }},
}};

export const AllSizes: Story = {{
  render: () => (
    <div className="flex flex-col gap-4 items-start">
      <{component_name} size="sm">Small</{component_name}>
      <{component_name} size="md">Medium</{component_name}>
      <{component_name} size="lg">Large</{component_name}>
    </div>
  ),
}};
'''
    return story


def generate_component_test(component_name: str) -> str:
    """Gera testes para componente"""

    test = f'''import {{ render, screen, fireEvent }} from '@testing-library/react';
import {{ {component_name} }} from './{component_name}';

describe('{component_name}', () => {{
  it('renders children correctly', () => {{
    render(<{component_name}>Click me</{component_name}>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  }});

  it('calls onClick when clicked', () => {{
    const handleClick = jest.fn();
    render(<{component_name} onClick={{handleClick}}>Click me</{component_name}>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  }});

  it('does not call onClick when disabled', () => {{
    const handleClick = jest.fn();
    render(
      <{component_name} onClick={{handleClick}} disabled>
        Click me
      </{component_name}>
    );

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).not.toHaveBeenCalled();
  }});

  it('shows loading spinner when loading prop is true', () => {{
    render(<{component_name} loading>Loading</{component_name}>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
  }});

  it('applies correct variant styles', () => {{
    const {{ rerender }} = render(<{component_name} variant="secondary">Button</{component_name}>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');

    rerender(<{component_name} variant="outline">Button</{component_name}>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('border');
  }});

  it('applies correct size styles', () => {{
    const {{ rerender }} = render(<{component_name} size="sm">Button</{component_name}>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('h-8');

    rerender(<{component_name} size="lg">Button</{component_name}>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('h-12');
  }});
}});
'''
    return test


def generate_mode(component_name: str, variant: str, principles: Dict):
    """
    Modo Generate: Cria novo componente seguindo design principles
    """
    print(f"🎨 Aesthetic Master - Generating: {component_name} (variant: {variant})")
    print("")

    # Criar diretório de output
    output_dir = AGENT_DIR / "generated" / component_name
    output_dir.mkdir(parents=True, exist_ok=True)

    # Gerar arquivos
    files_generated = []

    # 1. Component principal
    component_file = output_dir / f"{component_name}.tsx"
    component_file.write_text(generate_component_template(component_name, variant, principles))
    files_generated.append(component_file)
    print(f"✅ Created component: {component_file.name}")

    # 2. Storybook story
    story_file = output_dir / f"{component_name}.stories.tsx"
    story_file.write_text(generate_storybook_story(component_name, variant))
    files_generated.append(story_file)
    print(f"✅ Created Storybook story: {story_file.name}")

    # 3. Testes
    test_file = output_dir / f"{component_name}.test.tsx"
    test_file.write_text(generate_component_test(component_name))
    files_generated.append(test_file)
    print(f"✅ Created tests: {test_file.name}")

    # 4. Index file (export)
    index_file = output_dir / "index.ts"
    index_file.write_text(f"export {{ {component_name} }} from './{component_name}';\n")
    files_generated.append(index_file)
    print(f"✅ Created index: {index_file.name}")

    print("")
    print("=" * 80)
    print(f"✅ Component {component_name} generated successfully!")
    print("=" * 80)
    print(f"\n📂 Output directory: {output_dir}")
    print(f"\n📄 Files created ({len(files_generated)}):")
    for f in files_generated:
        print(f"   - {f.name}")
    print("\n💡 Next steps:")
    print(f"   1. Review generated code in {output_dir}")
    print(f"   2. Copy to your project's components directory")
    print(f"   3. Run tests: npm test {component_name}")
    print(f"   4. View in Storybook: npm run storybook")
    print("")


def main():
    parser = argparse.ArgumentParser(
        description="Aesthetic Master - Frontend & Design Specialist Agent"
    )

    parser.add_argument(
        '--mode',
        choices=['review', 'audit', 'generate'],
        required=True,
        help="Operation mode"
    )

    parser.add_argument(
        '--target',
        type=Path,
        help="Target file/directory for review mode"
    )

    parser.add_argument(
        '--project',
        type=Path,
        help="Project path for audit mode"
    )

    parser.add_argument(
        '--component',
        help="Component name for generate mode"
    )

    parser.add_argument(
        '--variant',
        default='default',
        help="Component variant for generate mode"
    )

    args = parser.parse_args()

    # Carregar configurações
    try:
        principles = load_config(DESIGN_PRINCIPLES)
        rules = load_config(AESTHETIC_RULES)
    except FileNotFoundError as e:
        print(f"❌ Config file not found: {e}")
        sys.exit(1)

    # Executar modo selecionado
    if args.mode == 'review':
        if not args.target:
            print("❌ --target required for review mode")
            sys.exit(1)
        review_mode(args.target, rules, principles)

    elif args.mode == 'audit':
        if not args.project:
            print("❌ --project required for audit mode")
            sys.exit(1)
        audit_mode(args.project, rules, principles)

    elif args.mode == 'generate':
        if not args.component:
            print("❌ --component required for generate mode")
            sys.exit(1)
        generate_mode(args.component, args.variant, principles)


if __name__ == "__main__":
    main()
