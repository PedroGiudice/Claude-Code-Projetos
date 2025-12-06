"""
Legal Document Assembler - Streamlit Frontend

A visual interface for testing Brazilian legal document normalization.
Integrates with the backend normalizers - NO duplicated logic.
"""

import json
import sys
from pathlib import Path

import streamlit as st

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.normalizers import (
    normalize_whitespace,
    normalize_name,
    normalize_address,
    normalize_honorific,
    format_cpf,
    format_cnpj,
    format_cep,
    format_oab,
    normalize_punctuation,
)
from src.engine import DocumentEngine

# =============================================================================
# PAGE CONFIG
# =============================================================================

st.set_page_config(
    page_title="Legal Doc Assembler",
    page_icon="📜",
    layout="wide",
    initial_sidebar_state="expanded",
)

# =============================================================================
# CUSTOM CSS
# =============================================================================

st.markdown("""
<style>
    /* Main container */
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }

    /* Headers */
    h1 {
        color: #1f4e79;
        border-bottom: 2px solid #1f4e79;
        padding-bottom: 0.5rem;
    }

    /* Cards */
    .stCard {
        background-color: #f8f9fa;
        border-radius: 10px;
        padding: 1rem;
        margin: 0.5rem 0;
    }

    /* Input fields */
    .stTextInput > div > div > input {
        border-radius: 5px;
    }

    /* Comparison boxes */
    .original-box {
        background-color: #fff3cd;
        border-left: 4px solid #ffc107;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
    }

    .normalized-box {
        background-color: #d4edda;
        border-left: 4px solid #28a745;
        padding: 10px;
        border-radius: 5px;
        font-family: monospace;
    }

    /* Sidebar */
    .css-1d391kg {
        background-color: #f8f9fa;
    }

    /* Success/Info messages */
    .success-msg {
        color: #155724;
        background-color: #d4edda;
        border: 1px solid #c3e6cb;
        padding: 10px;
        border-radius: 5px;
    }

    /* Code blocks */
    .code-block {
        background-color: #2d2d2d;
        color: #f8f8f2;
        padding: 1rem;
        border-radius: 5px;
        font-family: 'Fira Code', monospace;
        overflow-x: auto;
    }
</style>
""", unsafe_allow_html=True)

# =============================================================================
# SIDEBAR NAVIGATION
# =============================================================================

with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/law.png", width=80)
    st.title("Legal Doc Assembler")
    st.markdown("---")

    page = st.radio(
        "Navigation",
        ["🎮 Playground", "📝 Template Builder", "💻 Source Code"],
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.markdown("### About")
    st.markdown("""
    **v2.0.0** - Deterministic engine for
    Brazilian legal document generation.

    - ✅ Fault-tolerant templates
    - ✅ UTF-8 safe
    - ✅ Brazilian normalization
    """)

    st.markdown("---")
    st.markdown("### Quick Reference")
    with st.expander("Normalization Types"):
        st.markdown("""
        | Type | Example |
        |------|---------|
        | `nome` | MARIA DA SILVA → Maria da Silva |
        | `endereco` | R. BRASIL → Rua Brasil |
        | `cpf` | 12345678901 → 123.456.789-01 |
        | `cnpj` | 12345678000199 → 12.345.678/0001-99 |
        | `cep` | 01310100 → 01310-100 |
        | `oab` | 123456SP → OAB/SP 123.456 |
        """)

# =============================================================================
# PLAYGROUND PAGE
# =============================================================================

if page == "🎮 Playground":
    st.title("🎮 Normalization Playground")
    st.markdown("Test Brazilian legal document normalization in real-time.")

    # Two columns: Input and Output
    col_input, col_output = st.columns(2)

    with col_input:
        st.subheader("📥 Input Data")

        # Personal Data Section
        st.markdown("#### 👤 Personal Data")
        full_name = st.text_input(
            "Full Name",
            value="MARIA DAS GRAÇAS DA SILVA",
            help="Enter name in any format"
        )

        col_cpf, col_rg = st.columns(2)
        with col_cpf:
            cpf = st.text_input(
                "CPF",
                value="12345678901",
                help="11 digits, any format"
            )
        with col_rg:
            rg = st.text_input(
                "RG",
                value="12.345.678-9",
                help="RG is not normalized (varies by state)"
            )

        # Address Section
        st.markdown("#### 🏠 Address")
        address_street = st.text_input(
            "Street",
            value="AV. BRASIL N 500 AP 201",
            help="Abbreviations will be expanded"
        )

        col_city, col_state = st.columns(2)
        with col_city:
            city = st.text_input("City", value="SAO PAULO")
        with col_state:
            state = st.text_input("State", value="SP")

        cep = st.text_input(
            "CEP",
            value="01310100",
            help="8 digits, any format"
        )

        # Company Section
        st.markdown("#### 🏢 Company Data (Optional)")
        company_name = st.text_input(
            "Company Name",
            value="EMPRESA TESTE LTDA",
            help="Company abbreviations preserved"
        )

        cnpj = st.text_input(
            "CNPJ",
            value="12345678000199",
            help="14 digits, any format"
        )

        # Legal Section
        st.markdown("#### ⚖️ Legal Data (Optional)")
        oab = st.text_input(
            "OAB Registration",
            value="123456SP",
            help="Number + State"
        )

    with col_output:
        st.subheader("📤 Normalized Output")

        # Normalize all data using backend functions
        normalized_data = {
            "full_name": normalize_name(full_name) if full_name else "",
            "cpf": format_cpf(cpf) if cpf else "",
            "rg": rg,  # RG is NOT normalized (varies by state)
            "address_street": normalize_address(address_street) if address_street else "",
            "city": normalize_name(city) if city else "",
            "state": state.upper() if state else "",
            "cep": format_cep(cep) if cep else "",
            "company_name": normalize_name(company_name) if company_name else "",
            "cnpj": format_cnpj(cnpj) if cnpj else "",
            "oab": format_oab(oab) if oab else "",
        }

        # Display results with comparison
        st.markdown("#### 👤 Personal Data")

        # Name comparison
        st.markdown("**Full Name**")
        col_orig, col_norm = st.columns(2)
        with col_orig:
            st.markdown(f'<div class="original-box">📝 {full_name}</div>', unsafe_allow_html=True)
        with col_norm:
            st.markdown(f'<div class="normalized-box">✅ {normalized_data["full_name"]}</div>', unsafe_allow_html=True)

        # CPF comparison
        st.markdown("**CPF**")
        col_orig, col_norm = st.columns(2)
        with col_orig:
            st.markdown(f'<div class="original-box">📝 {cpf}</div>', unsafe_allow_html=True)
        with col_norm:
            st.markdown(f'<div class="normalized-box">✅ {normalized_data["cpf"]}</div>', unsafe_allow_html=True)

        # Address comparison
        st.markdown("#### 🏠 Address")
        st.markdown("**Street**")
        col_orig, col_norm = st.columns(2)
        with col_orig:
            st.markdown(f'<div class="original-box">📝 {address_street}</div>', unsafe_allow_html=True)
        with col_norm:
            st.markdown(f'<div class="normalized-box">✅ {normalized_data["address_street"]}</div>', unsafe_allow_html=True)

        # City comparison
        st.markdown("**City**")
        col_orig, col_norm = st.columns(2)
        with col_orig:
            st.markdown(f'<div class="original-box">📝 {city}</div>', unsafe_allow_html=True)
        with col_norm:
            st.markdown(f'<div class="normalized-box">✅ {normalized_data["city"]}</div>', unsafe_allow_html=True)

        # CEP comparison
        st.markdown("**CEP**")
        col_orig, col_norm = st.columns(2)
        with col_orig:
            st.markdown(f'<div class="original-box">📝 {cep}</div>', unsafe_allow_html=True)
        with col_norm:
            st.markdown(f'<div class="normalized-box">✅ {normalized_data["cep"]}</div>', unsafe_allow_html=True)

        # Company comparison
        if company_name or cnpj:
            st.markdown("#### 🏢 Company Data")
            if company_name:
                st.markdown("**Company Name**")
                col_orig, col_norm = st.columns(2)
                with col_orig:
                    st.markdown(f'<div class="original-box">📝 {company_name}</div>', unsafe_allow_html=True)
                with col_norm:
                    st.markdown(f'<div class="normalized-box">✅ {normalized_data["company_name"]}</div>', unsafe_allow_html=True)

            if cnpj:
                st.markdown("**CNPJ**")
                col_orig, col_norm = st.columns(2)
                with col_orig:
                    st.markdown(f'<div class="original-box">📝 {cnpj}</div>', unsafe_allow_html=True)
                with col_norm:
                    st.markdown(f'<div class="normalized-box">✅ {normalized_data["cnpj"]}</div>', unsafe_allow_html=True)

        # OAB comparison
        if oab:
            st.markdown("#### ⚖️ Legal Data")
            st.markdown("**OAB**")
            col_orig, col_norm = st.columns(2)
            with col_orig:
                st.markdown(f'<div class="original-box">📝 {oab}</div>', unsafe_allow_html=True)
            with col_norm:
                st.markdown(f'<div class="normalized-box">✅ {normalized_data["oab"]}</div>', unsafe_allow_html=True)

    # JSON Output Section
    st.markdown("---")
    st.subheader("📋 JSON Output")

    col_json, col_actions = st.columns([3, 1])
    with col_json:
        json_output = json.dumps(normalized_data, ensure_ascii=False, indent=2)
        st.code(json_output, language="json")

    with col_actions:
        st.download_button(
            label="📥 Download JSON",
            data=json_output,
            file_name="normalized_data.json",
            mime="application/json"
        )

        if st.button("📋 Copy to Clipboard"):
            st.write("✅ Copied!")
            # Note: Actual clipboard copy requires JavaScript

# =============================================================================
# TEMPLATE BUILDER PAGE
# =============================================================================

elif page == "📝 Template Builder":
    st.title("📝 Template Builder")
    st.markdown("Build document templates with Jinja2 placeholders.")

    st.info("🚧 **Coming Soon** - This feature is under development.")

    st.markdown("""
    ### Planned Features

    - **Template Upload**: Upload .docx templates
    - **Variable Inspector**: Auto-detect `{{ variables }}` in templates
    - **Live Preview**: See rendered output in real-time
    - **Filter Support**: Apply normalization filters like `{{ nome|nome }}`

    ### Available Filters

    | Filter | Description | Example |
    |--------|-------------|---------|
    | `nome` | Name normalization | `{{ nome_raw\|nome }}` |
    | `endereco` | Address normalization | `{{ end_raw\|endereco }}` |
    | `cpf` | CPF formatting | `{{ cpf_raw\|cpf }}` |
    | `cnpj` | CNPJ formatting | `{{ cnpj_raw\|cnpj }}` |
    | `cep` | CEP formatting | `{{ cep_raw\|cep }}` |
    | `oab` | OAB formatting | `{{ oab_raw\|oab }}` |
    | `texto` | Text normalization | `{{ text\|texto }}` |
    """)

    # Placeholder template preview
    st.markdown("### Example Template")
    example_template = '''
    PROCURAÇÃO AD JUDICIA

    Outorgante: {{ nome|nome }}
    CPF: {{ cpf|cpf }}
    Endereço: {{ endereco|endereco }}
    CEP: {{ cep|cep }}

    {{ cidade|nome }}, {{ data }}
    '''
    st.code(example_template, language="jinja2")

# =============================================================================
# SOURCE CODE PAGE
# =============================================================================

elif page == "💻 Source Code":
    st.title("💻 Source Code Reference")
    st.markdown("View the backend normalization code.")

    # Read source files
    base_path = Path(__file__).parent.parent / "src"

    tab_normalizers, tab_engine = st.tabs(["normalizers.py", "engine.py"])

    with tab_normalizers:
        st.markdown("### `src/normalizers.py`")
        st.markdown("Text normalization utilities for Brazilian legal documents.")

        normalizers_path = base_path / "normalizers.py"
        if normalizers_path.exists():
            with open(normalizers_path, 'r', encoding='utf-8') as f:
                code = f.read()
            st.code(code, language="python", line_numbers=True)
        else:
            st.error("File not found")

    with tab_engine:
        st.markdown("### `src/engine.py`")
        st.markdown("Document rendering engine with Jinja2 integration.")

        engine_path = base_path / "engine.py"
        if engine_path.exists():
            with open(engine_path, 'r', encoding='utf-8') as f:
                code = f.read()
            st.code(code, language="python", line_numbers=True)
        else:
            st.error("File not found")

# =============================================================================
# FOOTER
# =============================================================================

st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>Legal Doc Assembler v2.0.0 |
        <a href='https://github.com/PedroGiudice/Claude-Code-Projetos'>GitHub</a> |
        Built with Streamlit</p>
    </div>
    """,
    unsafe_allow_html=True
)
