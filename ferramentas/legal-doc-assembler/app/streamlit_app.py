"""
Legal Engine Workbench v2.0

Streamlit frontend integrado com o backend de normalização.
NÃO duplica lógica - importa diretamente de src.normalizers.

Features:
- Upload de JSON/TXT para entrada de dados
- Template Builder com upload de .docx
- Botão de Assembling para processamento
- Visualização em tempo real
"""

import json
import sys
import io
import re
import tempfile
from pathlib import Path
from datetime import datetime

import streamlit as st

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

# Importa do BACKEND - zero duplicação de lógica
from src.normalizers import (
    normalize_whitespace,
    normalize_name,
    normalize_address,
    format_cpf,
    format_cnpj,
    format_cep,
    format_oab,
    normalize_punctuation,
    normalize_all,
)
from src.engine import DocumentEngine

# -----------------------------------------------------------------------------
# UI CONFIGURATION & STYLING (Linear Dark Theme)
# -----------------------------------------------------------------------------

st.set_page_config(
    page_title="Legal Engine Workbench",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS - Linear Dark aesthetic
st.markdown("""
<style>
    /* Global Theme */
    .stApp {
        background-color: #0F1117;
        color: #cbd5e1;
    }

    /* Inputs */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {
        background-color: #0B0C10;
        color: #e2e8f0;
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: #6366f1;
        box-shadow: 0 0 0 1px #6366f1;
    }

    /* JSON / Code Blocks */
    .stJson, .stCode {
        background-color: #0B0C10;
        border: 1px solid rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }

    /* Sidebar */
    section[data-testid="stSidebar"] {
        background-color: #0B0C10;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }

    /* Headers */
    h1, h2, h3 {
        color: #f1f5f9 !important;
        font-family: 'Inter', sans-serif;
    }

    /* Expanders (Cards) */
    div[data-testid="stExpander"] {
        background-color: #161922;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 12px;
    }

    /* Upload area */
    .stFileUploader > div {
        background-color: #161922;
        border: 2px dashed rgba(99, 102, 241, 0.3);
        border-radius: 12px;
    }

    /* Buttons */
    .stButton > button {
        background-color: #6366f1;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 0.5rem 1rem;
        font-weight: 600;
    }
    .stButton > button:hover {
        background-color: #4f46e5;
    }

    /* Success/Error boxes */
    .success-box {
        background-color: rgba(34, 197, 94, 0.1);
        border: 1px solid #22c55e;
        border-radius: 8px;
        padding: 1rem;
        color: #22c55e;
    }
    .error-box {
        background-color: rgba(239, 68, 68, 0.1);
        border: 1px solid #ef4444;
        border-radius: 8px;
        padding: 1rem;
        color: #ef4444;
    }

    /* Data cards */
    .data-card {
        background-color: #161922;
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 1rem;
        margin: 0.5rem 0;
    }

    /* Field comparison */
    .field-raw {
        background-color: rgba(251, 191, 36, 0.1);
        border-left: 4px solid #fbbf24;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9rem;
    }
    .field-normalized {
        background-color: rgba(34, 197, 94, 0.1);
        border-left: 4px solid #22c55e;
        padding: 8px 12px;
        border-radius: 4px;
        font-family: monospace;
        font-size: 0.9rem;
    }
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# SESSION STATE INITIALIZATION
# -----------------------------------------------------------------------------

if 'input_data' not in st.session_state:
    st.session_state.input_data = {}
if 'normalized_data' not in st.session_state:
    st.session_state.normalized_data = {}
if 'template_content' not in st.session_state:
    st.session_state.template_content = None
if 'template_variables' not in st.session_state:
    st.session_state.template_variables = []
if 'assembled_doc' not in st.session_state:
    st.session_state.assembled_doc = None

# -----------------------------------------------------------------------------
# SIDEBAR
# -----------------------------------------------------------------------------

with st.sidebar:
    st.title("⚖️ Legal Engine")
    st.caption("Workbench v2.0")

    st.markdown("---")

    nav_mode = st.radio(
        "Navigation",
        ["📥 Data Input", "📝 Template Builder", "⚡ Assembler", "💻 Source Code"],
        label_visibility="collapsed"
    )

    st.markdown("---")
    st.subheader("Configuration")

    auto_normalize = st.checkbox("Auto-Normalize", value=True)
    debug_mode = st.checkbox("Debug Mode", value=False)

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

    st.markdown("---")

    # Status indicator
    data_loaded = len(st.session_state.input_data) > 0
    template_loaded = st.session_state.template_content is not None

    if data_loaded and template_loaded:
        st.success("🟢 Ready to Assemble")
    elif data_loaded:
        st.info("📥 Data loaded, awaiting template")
    elif template_loaded:
        st.info("📝 Template loaded, awaiting data")
    else:
        st.warning("⚪ No data or template loaded")

# -----------------------------------------------------------------------------
# DATA INPUT PAGE
# -----------------------------------------------------------------------------

if nav_mode == "📥 Data Input":
    st.title("📥 Data Input")
    st.markdown("Load client data via file upload or manual entry.")

    # Tabs for different input methods
    tab_upload, tab_manual = st.tabs(["📁 Upload File", "✏️ Manual Entry"])

    with tab_upload:
        st.markdown("### Upload JSON or TXT file")
        st.markdown("Upload a file containing client data in JSON format.")

        uploaded_file = st.file_uploader(
            "Choose a file",
            type=["json", "txt"],
            help="JSON file with key-value pairs or TXT file with JSON content"
        )

        if uploaded_file is not None:
            try:
                content = uploaded_file.read().decode("utf-8")
                data = json.loads(content)

                st.success(f"✅ File loaded: {uploaded_file.name}")

                # Show preview
                st.markdown("#### Preview")
                st.json(data)

                # Load button
                if st.button("📥 Load Data", key="load_uploaded"):
                    st.session_state.input_data = data
                    st.success("Data loaded successfully!")
                    st.rerun()

            except json.JSONDecodeError as e:
                st.error(f"❌ Invalid JSON format: {e}")
            except Exception as e:
                st.error(f"❌ Error reading file: {e}")

        # Example template
        st.markdown("---")
        st.markdown("#### Example JSON Format")
        example_json = {
            "nome": "MARIA DAS GRACAS DA SILVA",
            "cpf": "12345678901",
            "endereco": "R. das flores, N. 42",
            "cidade": "SAO PAULO",
            "cep": "01310100",
            "empresa": "EMPRESA TESTE LTDA",
            "cnpj": "12345678000199",
            "oab": "SP123456"
        }
        st.code(json.dumps(example_json, indent=2, ensure_ascii=False), language="json")

        # Download example
        st.download_button(
            label="📥 Download Example JSON",
            data=json.dumps(example_json, indent=2, ensure_ascii=False),
            file_name="example_data.json",
            mime="application/json"
        )

    with tab_manual:
        st.markdown("### Manual Data Entry")
        st.markdown("Enter client data manually in the fields below.")

        col1, col2 = st.columns(2)

        with col1:
            with st.expander("👤 Personal Data", expanded=True):
                nome = st.text_input("Full Name", value="MARIA DAS GRACAS DA SILVA")
                c1, c2 = st.columns(2)
                with c1:
                    cpf_input = st.text_input("CPF", value="12345678901")
                with c2:
                    rg_input = st.text_input("RG", placeholder="12.345.678-9")

            with st.expander("🏢 Company Data", expanded=True):
                empresa = st.text_input("Company Name", value="EMPRESA TESTE LTDA")
                c3, c4 = st.columns(2)
                with c3:
                    cnpj_input = st.text_input("CNPJ", value="12345678000199")
                with c4:
                    oab_input = st.text_input("OAB", value="SP123456")

        with col2:
            with st.expander("📍 Address Data", expanded=True):
                endereco = st.text_input("Street Address", value="R. das flores, N. 42")
                c5, c6 = st.columns(2)
                with c5:
                    cidade = st.text_input("City", value="SAO PAULO")
                with c6:
                    estado = st.text_input("State", value="SP")
                cep_input = st.text_input("CEP", value="01310100")

            with st.expander("📝 Additional Fields", expanded=False):
                campo_extra1 = st.text_input("Custom Field 1", key="extra1")
                campo_extra2 = st.text_input("Custom Field 2", key="extra2")
                campo_extra3 = st.text_area("Custom Text Field", key="extra3", height=100)

        # Build data object
        manual_data = {
            "nome": nome,
            "cpf": cpf_input,
            "rg": rg_input,
            "empresa": empresa,
            "cnpj": cnpj_input,
            "oab": oab_input,
            "endereco": endereco,
            "cidade": cidade,
            "estado": estado,
            "cep": cep_input,
        }

        # Add extra fields if filled
        if campo_extra1:
            manual_data["campo_extra1"] = campo_extra1
        if campo_extra2:
            manual_data["campo_extra2"] = campo_extra2
        if campo_extra3:
            manual_data["campo_extra3"] = campo_extra3

        # Load button
        st.markdown("---")
        if st.button("📥 Load Manual Data", type="primary"):
            st.session_state.input_data = manual_data
            st.success("✅ Data loaded successfully!")
            st.rerun()

    # Show current loaded data
    if st.session_state.input_data:
        st.markdown("---")
        st.markdown("### 📋 Currently Loaded Data")

        col_raw, col_normalized = st.columns(2)

        with col_raw:
            st.markdown("#### Raw Input")
            st.json(st.session_state.input_data)

        with col_normalized:
            st.markdown("#### Normalized (Preview)")

            # Apply normalization
            normalized = {}
            for key, value in st.session_state.input_data.items():
                if value:
                    if key in ['nome', 'empresa', 'cidade']:
                        normalized[key] = normalize_name(str(value))
                    elif key == 'cpf':
                        normalized[key] = format_cpf(str(value))
                    elif key == 'cnpj':
                        normalized[key] = format_cnpj(str(value))
                    elif key == 'cep':
                        normalized[key] = format_cep(str(value))
                    elif key == 'oab':
                        normalized[key] = format_oab(str(value))
                    elif key == 'endereco':
                        normalized[key] = normalize_address(str(value))
                    else:
                        normalized[key] = str(value)
                else:
                    normalized[key] = value

            st.session_state.normalized_data = normalized
            st.json(normalized)

        # Clear button
        if st.button("🗑️ Clear Data"):
            st.session_state.input_data = {}
            st.session_state.normalized_data = {}
            st.rerun()

# -----------------------------------------------------------------------------
# TEMPLATE BUILDER PAGE
# -----------------------------------------------------------------------------

elif nav_mode == "📝 Template Builder":
    st.title("📝 Template Builder")
    st.markdown("Upload and configure document templates with Jinja2 variables.")

    # Template upload
    st.markdown("### Upload Template")

    uploaded_template = st.file_uploader(
        "Choose a .docx template",
        type=["docx"],
        help="Word document with {{ variable }} placeholders"
    )

    if uploaded_template is not None:
        try:
            # Save to temp file for processing
            with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as tmp:
                tmp.write(uploaded_template.read())
                tmp_path = tmp.name

            # Create engine and extract variables
            engine = DocumentEngine()
            variables = engine.get_template_variables(tmp_path)

            st.session_state.template_content = tmp_path
            st.session_state.template_variables = list(variables)

            st.success(f"✅ Template loaded: {uploaded_template.name}")

            # Show extracted variables
            st.markdown("#### Detected Variables")
            if variables:
                cols = st.columns(3)
                for i, var in enumerate(sorted(variables)):
                    with cols[i % 3]:
                        st.code(f"{{{{ {var} }}}}")
            else:
                st.warning("No Jinja2 variables detected in template.")

        except Exception as e:
            st.error(f"❌ Error processing template: {e}")

    # Or create template from scratch
    st.markdown("---")
    st.markdown("### Or Create Template Text")
    st.markdown("Write template content with Jinja2 placeholders.")

    template_text = st.text_area(
        "Template Content",
        value="""PROCURAÇÃO AD JUDICIA

Outorgante: {{ nome|nome }}
CPF: {{ cpf|cpf }}
Endereço: {{ endereco|endereco }}
CEP: {{ cep|cep }} - {{ cidade|nome }}/{{ estado }}

Outorgado: {{ advogado|nome }}
OAB: {{ oab|oab }}

{{ cidade|nome }}, {{ data }}

_______________________________
{{ nome|nome }}
""",
        height=400,
        help="Use {{ variable }} or {{ variable|filter }} syntax"
    )

    # Variable mapping
    st.markdown("---")
    st.markdown("### Variable Mapping")

    if st.session_state.input_data:
        st.markdown("Map template variables to loaded data fields:")

        # Extract variables from text template
        try:
            text_vars = set(re.findall(r'\{\{\s*(\w+)(?:\|[\w]+)?\s*\}\}', template_text))
        except Exception as e:
            st.error(f"Error extracting variables: {e}")
            text_vars = set()

        if text_vars:
            mapping = {}
            cols = st.columns(2)

            data_fields = list(st.session_state.input_data.keys())

            for i, var in enumerate(sorted(text_vars)):
                with cols[i % 2]:
                    # Try to auto-match
                    default_idx = 0
                    for j, field in enumerate(data_fields):
                        if field.lower() == var.lower() or var.lower() in field.lower():
                            default_idx = j
                            break

                    mapping[var] = st.selectbox(
                        f"{{ {var} }} →",
                        options=data_fields + ["[Custom Value]"],
                        index=default_idx if default_idx < len(data_fields) else 0,
                        key=f"map_{var}"
                    )

            if st.button("💾 Save Mapping"):
                st.session_state.variable_mapping = mapping
                st.success("Mapping saved!")
    else:
        st.info("📥 Load data first to map variables")

    # Available filters reference
    st.markdown("---")
    st.markdown("### Available Filters")

    st.markdown("""
    | Filter | Description | Example |
    |--------|-------------|---------|
    | `nome` | Name normalization | `{{ nome\\|nome }}` |
    | `endereco` | Address expansion | `{{ rua\\|endereco }}` |
    | `cpf` | CPF formatting | `{{ cpf\\|cpf }}` |
    | `cnpj` | CNPJ formatting | `{{ cnpj\\|cnpj }}` |
    | `cep` | CEP formatting | `{{ cep\\|cep }}` |
    | `oab` | OAB formatting | `{{ oab\\|oab }}` |
    | `texto` | Text normalization | `{{ descricao\\|texto }}` |
    """)

# -----------------------------------------------------------------------------
# ASSEMBLER PAGE
# -----------------------------------------------------------------------------

elif nav_mode == "⚡ Assembler":
    st.title("⚡ Document Assembler")
    st.markdown("Combine template with data to generate final document.")

    # Status check
    data_ready = len(st.session_state.input_data) > 0
    template_ready = st.session_state.template_content is not None

    col_status1, col_status2 = st.columns(2)

    with col_status1:
        if data_ready:
            st.markdown('<div class="success-box">✅ Data Loaded</div>', unsafe_allow_html=True)
            st.markdown(f"**Fields:** {len(st.session_state.input_data)}")
        else:
            st.markdown('<div class="error-box">❌ No Data Loaded</div>', unsafe_allow_html=True)
            st.markdown("Go to **Data Input** to load data")

    with col_status2:
        if template_ready:
            st.markdown('<div class="success-box">✅ Template Loaded</div>', unsafe_allow_html=True)
            st.markdown(f"**Variables:** {len(st.session_state.template_variables)}")
        else:
            st.markdown('<div class="error-box">❌ No Template Loaded</div>', unsafe_allow_html=True)
            st.markdown("Go to **Template Builder** to load template")

    st.markdown("---")

    # Preview section
    if data_ready and template_ready:
        st.markdown("### 🔍 Pre-Assembly Validation")

        # Check for missing variables
        try:
            engine = DocumentEngine()
            validation = engine.validate_data(
                st.session_state.template_content,
                st.session_state.input_data
            )

            col_val1, col_val2 = st.columns(2)

            with col_val1:
                if validation['missing']:
                    st.warning(f"⚠️ Missing {len(validation['missing'])} variable(s)")
                    with st.expander("View Missing Variables"):
                        for var in validation['missing']:
                            st.code(f"{{ {var} }}")
                else:
                    st.success("✅ All required variables present")

            with col_val2:
                if validation['extra']:
                    st.info(f"ℹ️ {len(validation['extra'])} extra field(s) in data")
                    with st.expander("View Extra Fields"):
                        for var in validation['extra']:
                            st.code(var)
                else:
                    st.success("✅ No unused data fields")

        except Exception as e:
            st.error(f"Validation error: {e}")

        st.markdown("---")

    if data_ready:
        st.markdown("### 📋 Data Preview (Normalized)")

        # Show normalized data
        normalized = st.session_state.normalized_data or st.session_state.input_data
        st.json(normalized)

    # Assembly button
    st.markdown("---")
    st.markdown("### 🔧 Assembly")

    col_btn, col_options = st.columns([1, 2])

    with col_options:
        apply_normalization = st.checkbox(
            "Apply normalization filters",
            value=True,
            help="Normalize names, addresses, CPF/CNPJ, etc. using backend normalizers"
        )
        st.caption("ℹ️ Fault-tolerant mode: undefined variables will appear as {{ var_name }} in output")

    with col_btn:
        assemble_disabled = not (data_ready and template_ready)

        if st.button(
            "⚡ ASSEMBLE DOCUMENT",
            type="primary",
            disabled=assemble_disabled,
            use_container_width=True
        ):
            try:
                with st.spinner("Assembling document..."):
                    # Get the engine with auto-normalization setting
                    engine = DocumentEngine(auto_normalize=apply_normalization)

                    # Use raw input data (engine will normalize if apply_normalization=True)
                    data = st.session_state.input_data

                    # Render to temp file
                    output_path = Path(tempfile.gettempdir()) / f"assembled_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"
                    engine.render(
                        template_path=st.session_state.template_content,
                        data=data,
                        output_path=str(output_path)
                    )

                    st.session_state.assembled_doc = str(output_path)

                    st.success("✅ Document assembled successfully!")

            except Exception as e:
                st.error(f"❌ Assembly failed: {e}")

    # Download result
    if st.session_state.assembled_doc and Path(st.session_state.assembled_doc).exists():
        st.markdown("---")
        st.markdown("### 📥 Download Result")

        with open(st.session_state.assembled_doc, "rb") as f:
            st.download_button(
                label="📥 Download Assembled Document (.docx)",
                data=f.read(),
                file_name=f"document_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx",
                mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                type="primary",
                use_container_width=True
            )

    # Quick JSON export
    if data_ready:
        st.markdown("---")
        st.markdown("### 📤 Export Data")

        col_exp1, col_exp2 = st.columns(2)

        with col_exp1:
            st.download_button(
                label="📥 Export Raw JSON",
                data=json.dumps(st.session_state.input_data, indent=2, ensure_ascii=False),
                file_name="raw_data.json",
                mime="application/json"
            )

        with col_exp2:
            st.download_button(
                label="📥 Export Normalized JSON",
                data=json.dumps(st.session_state.normalized_data, indent=2, ensure_ascii=False),
                file_name="normalized_data.json",
                mime="application/json"
            )

# -----------------------------------------------------------------------------
# SOURCE CODE PAGE
# -----------------------------------------------------------------------------

elif nav_mode == "💻 Source Code":
    st.title("💻 Source Code")

    tabs = st.tabs(["🎨 Frontend", "⚙️ Normalizers", "🔧 Engine"])

    with tabs[0]:
        st.markdown("### streamlit_app.py")
        with open(__file__, "r", encoding="utf-8") as f:
            st.code(f.read(), language="python", line_numbers=True)

    with tabs[1]:
        st.markdown("### src/normalizers.py")
        try:
            normalizers_path = Path(__file__).parent.parent / "src" / "normalizers.py"
            with open(normalizers_path, "r", encoding="utf-8") as f:
                st.code(f.read(), language="python", line_numbers=True)
        except Exception as e:
            st.error(f"Error: {e}")

    with tabs[2]:
        st.markdown("### src/engine.py")
        try:
            engine_path = Path(__file__).parent.parent / "src" / "engine.py"
            with open(engine_path, "r", encoding="utf-8") as f:
                st.code(f.read(), language="python", line_numbers=True)
        except Exception as e:
            st.error(f"Error: {e}")

# -----------------------------------------------------------------------------
# FOOTER
# -----------------------------------------------------------------------------

st.markdown("---")
st.markdown(
    """
    <div style='text-align: center; color: #666;'>
        <p>Legal Engine Workbench v2.0.0 |
        <a href='https://github.com/PedroGiudice/Claude-Code-Projetos'>GitHub</a> |
        Built with Streamlit + Python Backend</p>
    </div>
    """,
    unsafe_allow_html=True
)
