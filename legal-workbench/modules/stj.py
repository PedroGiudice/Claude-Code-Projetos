# modules/stj.py

import streamlit as st
from pathlib import Path
import sys
import pandas as pd
from datetime import datetime, timedelta, date
import logging

# Setup backend path (must be done before imports)
_backend_path = Path(__file__).parent.parent / "ferramentas" / "stj-dados-abertos"


def _setup_imports():
    """Lazy import setup to avoid module resolution issues."""
    if str(_backend_path) not in sys.path:
        sys.path.insert(0, str(_backend_path))

    from src.database import STJDatabase
    from src.downloader import STJDownloader
    from src.processor import STJProcessor
    from config import DATABASE_PATH, ORGAOS_JULGADORES, get_date_range_urls
    return STJDatabase, STJDownloader, STJProcessor, DATABASE_PATH, ORGAOS_JULGADORES, get_date_range_urls


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Organ display names mapping
ORGAN_DISPLAY_NAMES = {
    "corte_especial": "Corte Especial",
    "primeira_secao": "1ª Seção",
    "segunda_secao": "2ª Seção",
    "terceira_secao": "3ª Seção",
    "primeira_turma": "1ª Turma",
    "segunda_turma": "2ª Turma",
}

def _map_display_to_key(display_name: str) -> str:
    """Map display name to config key."""
    for key, name in ORGAN_DISPLAY_NAMES.items():
        if name == display_name:
            return key
    return "corte_especial"


def render():
    """Renders the Streamlit UI for the STJ Dados Abertos module."""
    # Lazy imports
    STJDatabase, STJDownloader, STJProcessor, DATABASE_PATH, ORGAOS_JULGADORES, get_date_range_urls = _setup_imports()

    st.header("STJ Dados Abertos")
    st.caption("Download, busca e análise de acórdãos do Superior Tribunal de Justiça")

    # --- Session State Initialization ---
    if "stj_search_results" not in st.session_state:
        st.session_state.stj_search_results = None
    if "stj_stats" not in st.session_state:
        st.session_state.stj_stats = None
    if "stj_download_logs" not in st.session_state:
        st.session_state.stj_download_logs = []
    if "stj_download_running" not in st.session_state:
        st.session_state.stj_download_running = False

    # --- Database Status ---
    db_exists = DATABASE_PATH.exists()

    # Stats display
    st.subheader("Status do Banco de Dados")

    if db_exists:
        try:
            with STJDatabase(DATABASE_PATH) as db:
                stats = db.obter_estatisticas()
                st.session_state.stj_stats = stats

            if stats:
                col1, col2, col3, col4 = st.columns(4)

                col1.metric(
                    "Total de Acórdãos",
                    f"{stats.get('total_acordaos', 0):,}".replace(",", ".")
                )

                col2.metric(
                    "Últimos 30 dias",
                    f"{stats.get('ultimos_30_dias', 0):,}".replace(",", ".")
                )

                col3.metric(
                    "Tamanho do Banco",
                    f"{stats.get('tamanho_db_mb', 0):.1f} MB"
                )

                periodo = stats.get('periodo', {})
                mais_recente = periodo.get('mais_recente', 'N/A')
                if isinstance(mais_recente, str) and mais_recente != 'N/A':
                    try:
                        mais_recente_date = datetime.fromisoformat(mais_recente)
                        mais_recente = mais_recente_date.strftime("%d/%m/%Y")
                    except:
                        pass

                col4.metric(
                    "Última Publicação",
                    str(mais_recente)
                )

        except Exception as e:
            st.error(f"Erro ao carregar estatísticas: {e}")
            stats = None
    else:
        st.warning("⚠️ Base de dados não encontrada. Use a aba 'Download Center' para criar.")
        stats = None

    st.markdown("---")

    # --- Tabs ---
    tab1, tab2, tab3, tab4 = st.tabs([
        "📥 Download Center",
        "🔍 Busca",
        "📊 Estatísticas",
        "⚙️ Manutenção"
    ])

    # ==========================================================================
    # TAB 1: DOWNLOAD CENTER (RESTORED)
    # ==========================================================================
    with tab1:
        st.subheader("Download Center")
        st.caption("Baixe acórdãos diretamente do STJ Dados Abertos")

        # --- Configuration ---
        col_config, col_terminal = st.columns([1, 2])

        with col_config:
            st.markdown("#### Configuração")

            with st.container(border=True):
                # Date range
                start_date = st.date_input(
                    "Data Inicial",
                    value=date(2023, 1, 1),
                    min_value=date(2020, 1, 1),
                    max_value=date.today(),
                    key="stj_start_date"
                )

                end_date = st.date_input(
                    "Data Final",
                    value=date.today(),
                    min_value=date(2020, 1, 1),
                    max_value=date.today(),
                    key="stj_end_date"
                )

                # Organ selection
                target_organs = st.multiselect(
                    "Órgãos Julgadores",
                    options=list(ORGAN_DISPLAY_NAMES.values()),
                    default=["Corte Especial"],
                    key="stj_organs"
                )

                st.markdown("---")

                # Action buttons
                col1, col2 = st.columns(2)

                with col1:
                    start_download = st.button(
                        "▶️ Iniciar Download",
                        type="primary",
                        use_container_width=True,
                        disabled=st.session_state.stj_download_running
                    )

                with col2:
                    retroactive = st.button(
                        "📦 Download Completo",
                        use_container_width=True,
                        help="Baixa todos os dados de 2022 até hoje",
                        disabled=st.session_state.stj_download_running
                    )

        with col_terminal:
            st.markdown("#### System Logs")

            # Terminal display
            terminal_container = st.empty()

            # Display current logs
            logs = st.session_state.stj_download_logs
            if logs:
                log_html = "<br>".join([f"<span style='color:#64748b'>></span> {l}" for l in logs[-15:]])
                terminal_container.markdown(f"""
                    <div style='background-color: #0f172a; padding: 15px; border-radius: 6px;
                                border: 1px solid #1e293b; height: 350px; font-family: monospace;
                                font-size: 12px; overflow-y: auto; color: #e2e8f0;'>
                        <div style='color: #38bdf8; margin-bottom: 10px;'>
                            stj-downloader@legal-workbench:~$ ./download.sh
                        </div>
                        {log_html}
                    </div>
                """, unsafe_allow_html=True)
            else:
                terminal_container.info("Aguardando comando de download...")

            # Progress bar
            progress_bar = st.empty()

        # --- Execute Download ---
        if start_download or retroactive:
            st.session_state.stj_download_running = True
            st.session_state.stj_download_logs = []

            # Determine date range
            if retroactive:
                start_dt = datetime(2022, 1, 1)
                end_dt = datetime.now()
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] MODO: Download Retroativo Completo"
                )
            else:
                start_dt = datetime.combine(start_date, datetime.min.time())
                end_dt = datetime.combine(end_date, datetime.min.time())

            # Convert organ names to keys
            organ_keys = [_map_display_to_key(name) for name in target_organs]

            try:
                # Log start
                log_time = datetime.now().strftime('%H:%M:%S')
                st.session_state.stj_download_logs.append(
                    f"[{log_time}] INICIANDO download para {len(organ_keys)} órgão(s)"
                )
                st.session_state.stj_download_logs.append(
                    f"[{log_time}] Período: {start_dt.strftime('%d/%m/%Y')} a {end_dt.strftime('%d/%m/%Y')}"
                )

                # Generate URLs
                all_url_configs = []
                for organ_key in organ_keys:
                    urls = get_date_range_urls(start_dt, end_dt, organ_key)
                    all_url_configs.extend(urls)

                total_files = len(all_url_configs)
                st.session_state.stj_download_logs.append(
                    f"[{log_time}] Total de arquivos para download: {total_files}"
                )

                # Update terminal
                logs = st.session_state.stj_download_logs
                log_html = "<br>".join([f"<span style='color:#64748b'>></span> {l}" for l in logs[-15:]])
                terminal_container.markdown(f"""
                    <div style='background-color: #0f172a; padding: 15px; border-radius: 6px;
                                border: 1px solid #1e293b; height: 350px; font-family: monospace;
                                font-size: 12px; overflow-y: auto; color: #e2e8f0;'>
                        <div style='color: #38bdf8; margin-bottom: 10px;'>
                            stj-downloader@legal-workbench:~$ ./download.sh
                        </div>
                        {log_html}
                        <span style='background-color: #10b981; width: 8px; height: 14px; display: inline-block;'></span>
                    </div>
                """, unsafe_allow_html=True)

                progress_bar.progress(0, "Iniciando...")

                # PHASE 1: Download
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] FASE 1: Download de arquivos JSON..."
                )

                downloaded_files = []

                with STJDownloader() as downloader:
                    for idx, config in enumerate(all_url_configs):
                        try:
                            file_path = downloader.download_json(
                                config["url"],
                                config["filename"],
                                force=False
                            )

                            if file_path:
                                downloaded_files.append(file_path)
                                st.session_state.stj_download_logs.append(
                                    f"[{datetime.now().strftime('%H:%M:%S')}] ✓ {config['filename']}"
                                )

                            # Update progress (40% for download)
                            progress = int((idx + 1) / total_files * 40)
                            progress_bar.progress(progress, f"Download: {idx + 1}/{total_files}")

                            # Update terminal every 5 files
                            if idx % 5 == 0:
                                logs = st.session_state.stj_download_logs
                                log_html = "<br>".join([f"<span style='color:#64748b'>></span> {l}" for l in logs[-15:]])
                                terminal_container.markdown(f"""
                                    <div style='background-color: #0f172a; padding: 15px; border-radius: 6px;
                                                border: 1px solid #1e293b; height: 350px; font-family: monospace;
                                                font-size: 12px; overflow-y: auto; color: #e2e8f0;'>
                                        <div style='color: #38bdf8; margin-bottom: 10px;'>
                                            stj-downloader@legal-workbench:~$ ./download.sh
                                        </div>
                                        {log_html}
                                        <span style='background-color: #10b981; width: 8px; height: 14px; display: inline-block;'></span>
                                    </div>
                                """, unsafe_allow_html=True)

                        except Exception as e:
                            st.session_state.stj_download_logs.append(
                                f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ {config['filename']}: {str(e)[:50]}"
                            )

                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] Download: {len(downloaded_files)} arquivos"
                )

                # PHASE 2: Processing
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] FASE 2: Processamento de JSON..."
                )
                progress_bar.progress(40, "Processando...")

                processor = STJProcessor()
                all_records = []

                for idx, file_path in enumerate(downloaded_files):
                    try:
                        records = processor.processar_arquivo_json(file_path)
                        all_records.extend(records)

                        # Update progress (30% for processing)
                        progress = 40 + int((idx + 1) / len(downloaded_files) * 30)
                        progress_bar.progress(progress, f"Processando: {idx + 1}/{len(downloaded_files)}")

                    except Exception as e:
                        st.session_state.stj_download_logs.append(
                            f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ Erro processando {file_path.name}"
                        )

                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] Processados: {len(all_records)} registros"
                )

                # PHASE 3: Database insertion
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] FASE 3: Inserção no banco de dados..."
                )
                progress_bar.progress(70, "Inserindo no banco...")

                with STJDatabase(DATABASE_PATH) as db:
                    # Create schema if needed
                    db.criar_schema()

                    if all_records:
                        inseridos, duplicados, erros = db.inserir_batch(all_records)

                        st.session_state.stj_download_logs.append(
                            f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Inseridos: {inseridos}"
                        )
                        st.session_state.stj_download_logs.append(
                            f"[{datetime.now().strftime('%H:%M:%S')}] → Duplicados: {duplicados}"
                        )
                        if erros > 0:
                            st.session_state.stj_download_logs.append(
                                f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ Erros: {erros}"
                            )
                    else:
                        st.session_state.stj_download_logs.append(
                            f"[{datetime.now().strftime('%H:%M:%S')}] ⚠ Nenhum registro para inserir"
                        )

                # Complete
                progress_bar.progress(100, "Concluído!")
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] ========== DOWNLOAD CONCLUÍDO =========="
                )

                st.success(f"✅ Download concluído! {len(all_records)} registros processados.")
                st.balloons()

            except Exception as e:
                st.session_state.stj_download_logs.append(
                    f"[{datetime.now().strftime('%H:%M:%S')}] ❌ ERRO FATAL: {str(e)}"
                )
                st.error(f"Erro durante o download: {e}")

            finally:
                st.session_state.stj_download_running = False

                # Final terminal update
                logs = st.session_state.stj_download_logs
                log_html = "<br>".join([f"<span style='color:#64748b'>></span> {l}" for l in logs[-15:]])
                terminal_container.markdown(f"""
                    <div style='background-color: #0f172a; padding: 15px; border-radius: 6px;
                                border: 1px solid #1e293b; height: 350px; font-family: monospace;
                                font-size: 12px; overflow-y: auto; color: #e2e8f0;'>
                        <div style='color: #38bdf8; margin-bottom: 10px;'>
                            stj-downloader@legal-workbench:~$ ./download.sh
                        </div>
                        {log_html}
                    </div>
                """, unsafe_allow_html=True)

    # --- TAB 2: DOWNLOAD ---
    with tab2:
        st.subheader("Download de Dados")

        st.info("""
        **Gerenciamento de Downloads**

        Para fazer download de novos dados do STJ, utilize o aplicativo standalone
        que oferece funcionalidades completas:

        - Download retroativo (2022 até hoje)
        - Seleção de órgãos julgadores
        - Processamento em lote
        - Monitoramento de progresso
        - Gerenciamento de armazenamento

        **Como executar:**

        ```bash
        cd legal-workbench/ferramentas/stj-dados-abertos
        source .venv/bin/activate
        streamlit run app.py
        ```

        O aplicativo standalone possui interface completa com dashboard DuckDB
        e todas as ferramentas necessárias para gerenciar a base de dados.
        """)

        if db_exists and stats:
            st.markdown("**Dados disponíveis no banco atual:**")

            periodo = stats.get('periodo', {})
            st.markdown(f"- **Período:** {periodo.get('mais_antigo', 'N/A')} até {periodo.get('mais_recente', 'N/A')}")
            st.markdown(f"- **Total de acórdãos:** {stats.get('total_acordaos', 0):,}".replace(",", "."))

            por_orgao = stats.get('por_orgao', {})
            if por_orgao:
                st.markdown("**Distribuição por órgão:**")
                for orgao, count in list(por_orgao.items())[:5]:
                    st.markdown(f"  - {orgao}: {count:,}".replace(",", "."))

    # --- TAB 3: ESTATÍSTICAS ---
    with tab3:
        st.subheader("Estatísticas do Banco de Dados")

        if not stats:
            st.warning("Estatísticas não disponíveis")
        else:
            # Overview
            col1, col2 = st.columns(2)

            with col1:
                st.markdown("### 📈 Resumo Geral")
                st.markdown(f"**Total de acórdãos:** {stats.get('total_acordaos', 0):,}".replace(",", "."))
                st.markdown(f"**Tamanho do banco:** {stats.get('tamanho_db_mb', 0):.1f} MB")
                st.markdown(f"**Acórdãos (últimos 30 dias):** {stats.get('ultimos_30_dias', 0):,}".replace(",", "."))

                periodo = stats.get('periodo', {})
                st.markdown(f"**Período coberto:**")
                st.markdown(f"  - De: {periodo.get('mais_antigo', 'N/A')}")
                st.markdown(f"  - Até: {periodo.get('mais_recente', 'N/A')}")

            with col2:
                st.markdown("### 📊 Distribuição por Tipo")
                por_tipo = stats.get('por_tipo', {})
                if por_tipo:
                    tipo_df = pd.DataFrame(
                        list(por_tipo.items()),
                        columns=['Tipo', 'Quantidade']
                    ).sort_values('Quantidade', ascending=False)
                    st.dataframe(tipo_df, use_container_width=True, hide_index=True)

            # Chart: Distribuição por órgão
            st.markdown("### 📊 Acórdãos por Órgão Julgador")
            por_orgao = stats.get('por_orgao', {})
            if por_orgao:
                orgao_df = pd.DataFrame(
                    list(por_orgao.items()),
                    columns=['Órgão', 'Quantidade']
                ).sort_values('Quantidade', ascending=False)

                st.bar_chart(orgao_df.set_index('Órgão'))

                # Details table
                with st.expander("Ver detalhes"):
                    st.dataframe(orgao_df, use_container_width=True, hide_index=True)
