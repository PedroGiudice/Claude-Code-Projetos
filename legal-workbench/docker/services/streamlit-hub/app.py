"""
Legal Workbench - Streamlit Hub

Frontend orchestrator for Legal Workbench backend services.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any

import streamlit as st
from lib.api_client import BackendClient


# Page configuration
st.set_page_config(
    page_title="Legal Workbench",
    page_icon="⚖️",
    layout="wide",
    initial_sidebar_state="expanded"
)


def init_client() -> BackendClient:
    """Initialize backend client (cached)."""
    if "client" not in st.session_state:
        st.session_state.client = BackendClient()
    return st.session_state.client


async def check_services_health() -> Dict[str, bool]:
    """Check health status of all services."""
    client = init_client()
    services = ["text-extractor", "doc-assembler", "stj-api", "trello-mcp"]

    health_status = {}
    for service in services:
        health_status[service] = await client.check_health(service)

    return health_status


def render_sidebar():
    """Render sidebar with service health status."""
    st.sidebar.title("⚖️ Legal Workbench")
    st.sidebar.markdown("---")

    st.sidebar.subheader("🏥 Service Status")

    # Check health status
    with st.spinner("Checking services..."):
        try:
            health_status = asyncio.run(check_services_health())
        except Exception as e:
            st.sidebar.error(f"Failed to check health: {str(e)}")
            return

    # Display status for each service
    service_names = {
        "text-extractor": "📄 Text Extractor",
        "doc-assembler": "📋 Doc Assembler",
        "stj-api": "🔍 STJ API",
        "trello-mcp": "📌 Trello MCP"
    }

    for service_id, display_name in service_names.items():
        is_healthy = health_status.get(service_id, False)
        status_icon = "✅" if is_healthy else "❌"
        status_text = "Online" if is_healthy else "Offline"
        color = "green" if is_healthy else "red"

        st.sidebar.markdown(
            f"{display_name}: {status_icon} **:{color}[{status_text}]**"
        )

    st.sidebar.markdown("---")
    st.sidebar.caption(f"Last updated: {datetime.now().strftime('%H:%M:%S')}")

    if st.sidebar.button("🔄 Refresh Status"):
        st.rerun()


def render_text_extractor_page():
    """Render Text Extractor functionality page."""
    st.header("📄 PDF Text Extraction")
    st.markdown("Upload PDF files to extract text content.")

    client = init_client()

    uploaded_file = st.file_uploader(
        "Choose a PDF file",
        type=["pdf"],
        help="Upload a PDF document to extract text"
    )

    if uploaded_file:
        st.info(f"**File:** {uploaded_file.name} ({uploaded_file.size / 1024:.1f} KB)")

        col1, col2 = st.columns([1, 4])

        with col1:
            extract_button = st.button("🚀 Extract Text", use_container_width=True)

        if extract_button:
            with st.spinner("Extracting text from PDF..."):
                try:
                    file_bytes = uploaded_file.read()
                    result = asyncio.run(
                        client.extract_pdf(file_bytes, uploaded_file.name)
                    )

                    st.success("✅ Text extracted successfully!")

                    # Display results
                    tab1, tab2 = st.tabs(["📝 Extracted Text", "📊 Metadata"])

                    with tab1:
                        extracted_text = result.get("text", "")
                        if extracted_text:
                            st.text_area(
                                "Extracted Content",
                                value=extracted_text,
                                height=400,
                                disabled=True
                            )
                        else:
                            st.warning("No text content found.")

                    with tab2:
                        metadata = result.get("metadata", {})
                        st.json(metadata)

                except Exception as e:
                    st.error(f"❌ Extraction failed: {str(e)}")
                    st.info("💡 Make sure the Text Extractor service is running.")


def render_doc_assembler_page():
    """Render Document Assembler functionality page."""
    st.header("📋 Document Assembly")
    st.markdown("Generate documents from templates.")

    client = init_client()

    # Template selection
    template_id = st.selectbox(
        "Select Template",
        options=["petição-inicial", "contrato-locacao", "procuração"],
        help="Choose a document template"
    )

    st.subheader("Template Data")
    st.markdown("Fill in the template variables:")

    # Dynamic form based on template
    if template_id == "petição-inicial":
        col1, col2 = st.columns(2)
        with col1:
            autor = st.text_input("Autor", placeholder="Nome do autor")
            advogado = st.text_input("Advogado", placeholder="Nome do advogado")
        with col2:
            reu = st.text_input("Réu", placeholder="Nome do réu")
            comarca = st.text_input("Comarca", placeholder="Comarca")

        pedido = st.text_area("Pedido", height=150)

        data = {
            "autor": autor,
            "reu": reu,
            "advogado": advogado,
            "comarca": comarca,
            "pedido": pedido
        }

    elif template_id == "contrato-locacao":
        col1, col2 = st.columns(2)
        with col1:
            locador = st.text_input("Locador", placeholder="Nome do locador")
            locatario = st.text_input("Locatário", placeholder="Nome do locatário")
        with col2:
            endereco = st.text_input("Endereço", placeholder="Endereço do imóvel")
            valor = st.number_input("Valor (R$)", min_value=0.0, step=100.0)

        data = {
            "locador": locador,
            "locatario": locatario,
            "endereco": endereco,
            "valor": valor
        }

    else:  # procuração
        col1, col2 = st.columns(2)
        with col1:
            outorgante = st.text_input("Outorgante", placeholder="Nome do outorgante")
            outorgado = st.text_input("Outorgado", placeholder="Nome do outorgado")
        with col2:
            poderes = st.multiselect(
                "Poderes",
                ["Representar em juízo", "Assinar documentos", "Receber citações"]
            )

        data = {
            "outorgante": outorgante,
            "outorgado": outorgado,
            "poderes": ", ".join(poderes)
        }

    # Generate button
    if st.button("📄 Generate Document", use_container_width=True):
        # Validate required fields
        if not all(data.values()):
            st.warning("⚠️ Please fill all required fields.")
            return

        with st.spinner("Generating document..."):
            try:
                doc_bytes = asyncio.run(
                    client.assemble_document(template_id, data)
                )

                st.success("✅ Document generated successfully!")

                # Download button
                st.download_button(
                    label="⬇️ Download Document",
                    data=doc_bytes,
                    file_name=f"{template_id}-{datetime.now().strftime('%Y%m%d-%H%M%S')}.docx",
                    mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                    use_container_width=True
                )

            except Exception as e:
                st.error(f"❌ Generation failed: {str(e)}")
                st.info("💡 Make sure the Doc Assembler service is running.")


def render_stj_search_page():
    """Render STJ Search functionality page."""
    st.header("🔍 STJ Jurisprudence Search")
    st.markdown("Search Superior Tribunal de Justiça decisions.")

    client = init_client()

    # Search form
    query = st.text_input(
        "Search Query",
        placeholder="Enter keywords, case numbers, or legal topics",
        help="Search STJ jurisprudence database"
    )

    col1, col2, col3 = st.columns(3)

    with col1:
        date_from = st.date_input("From Date", value=None)
    with col2:
        date_to = st.date_input("To Date", value=None)
    with col3:
        page_size = st.selectbox("Results per page", [10, 25, 50, 100], index=0)

    if st.button("🔍 Search", use_container_width=True):
        if not query:
            st.warning("⚠️ Please enter a search query.")
            return

        with st.spinner("Searching STJ database..."):
            try:
                filters = {}
                if date_from:
                    filters["date_from"] = date_from.isoformat()
                if date_to:
                    filters["date_to"] = date_to.isoformat()

                results = asyncio.run(
                    client.search_stj(
                        query=query,
                        filters=filters if filters else None,
                        page=1,
                        page_size=page_size
                    )
                )

                total = results.get("total", 0)
                items = results.get("items", [])

                st.success(f"✅ Found {total} results")

                # Display results
                if items:
                    for idx, item in enumerate(items, 1):
                        with st.expander(
                            f"**{idx}. {item.get('title', 'Untitled')}**",
                            expanded=(idx == 1)
                        ):
                            st.markdown(f"**Número:** {item.get('number', 'N/A')}")
                            st.markdown(f"**Data:** {item.get('date', 'N/A')}")
                            st.markdown(f"**Relator:** {item.get('relator', 'N/A')}")
                            st.markdown("---")
                            st.markdown(item.get("summary", "No summary available."))

                            if item.get("url"):
                                st.link_button("🔗 View Full Decision", item["url"])
                else:
                    st.info("No results found for this query.")

            except Exception as e:
                st.error(f"❌ Search failed: {str(e)}")
                st.info("💡 Make sure the STJ API service is running.")


def render_trello_page():
    """Render Trello integration functionality page."""
    st.header("📌 Trello Integration")
    st.markdown("Create cards in Trello boards.")

    client = init_client()

    # Card form
    list_id = st.text_input(
        "List ID",
        placeholder="Enter Trello list ID",
        help="Find this in your Trello board URL"
    )

    card_name = st.text_input(
        "Card Name",
        placeholder="Brief card title"
    )

    card_description = st.text_area(
        "Description",
        placeholder="Detailed card description (optional)",
        height=150
    )

    col1, col2 = st.columns(2)

    with col1:
        labels = st.multiselect(
            "Labels",
            ["urgent", "bug", "feature", "documentation"],
            help="Select applicable labels"
        )

    with col2:
        due_date = st.date_input("Due Date", value=None)

    if st.button("📌 Create Card", use_container_width=True):
        if not list_id or not card_name:
            st.warning("⚠️ Please provide List ID and Card Name.")
            return

        with st.spinner("Creating Trello card..."):
            try:
                card_data = asyncio.run(
                    client.create_trello_card(
                        list_id=list_id,
                        name=card_name,
                        description=card_description if card_description else None,
                        labels=labels if labels else None,
                        due_date=due_date.isoformat() if due_date else None
                    )
                )

                st.success("✅ Card created successfully!")

                # Display card info
                st.json(card_data)

                if card_data.get("url"):
                    st.link_button("🔗 Open Card in Trello", card_data["url"])

            except Exception as e:
                st.error(f"❌ Card creation failed: {str(e)}")
                st.info("💡 Make sure the Trello MCP service is running and configured.")


def main():
    """Main application entry point."""
    # Render sidebar
    render_sidebar()

    # Main content area
    st.title("⚖️ Legal Workbench Hub")
    st.markdown("**Unified interface for legal document processing and research.**")
    st.markdown("---")

    # Navigation tabs
    tab1, tab2, tab3, tab4 = st.tabs([
        "📄 Text Extractor",
        "📋 Doc Assembler",
        "🔍 STJ Search",
        "📌 Trello"
    ])

    with tab1:
        render_text_extractor_page()

    with tab2:
        render_doc_assembler_page()

    with tab3:
        render_stj_search_page()

    with tab4:
        render_trello_page()

    # Footer
    st.markdown("---")
    st.caption("Legal Workbench © 2024 | Powered by Streamlit")


if __name__ == "__main__":
    main()
