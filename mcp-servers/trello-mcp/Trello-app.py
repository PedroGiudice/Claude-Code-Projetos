import asyncio
import os
import re
import math
import logging
from typing import List, Dict, Any, Optional
import streamlit as st
import pandas as pd
from dotenv import load_dotenv

# Local Imports (Assumed available in src/)
try:
    from src.trello_client import TrelloClient, TrelloAPIError
    from src.models import EnvironmentSettings, BatchCardsInput
except ImportError:
    # Fallback/Mock for standalone UI testing
    pass

# --- CONFIGURATION & SETUP ---
load_dotenv()

st.set_page_config(
    page_title="TRELLO_CMD_CENTER",
    page_icon="📟",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# --- STYLES (CLI THEME) ---
st.markdown("""
<style>
    /* GLOBAL THEME */
    body, .stApp {
        background-color: #000000;
        color: #00FF00;
        font-family: 'Courier New', Courier, monospace;
    }
    
    /* HIDE STREAMLIT CHROME */
    header {visibility: hidden;}
    footer {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* INPUTS */
    .stTextInput input, .stSelectbox div[data-baseweb="select"] {
        background-color: #001100;
        color: #00FF00;
        border: 1px solid #004400;
        font-family: 'Courier New', monospace;
    }
    
    /* BUTTONS */
    .stButton > button {
        background-color: transparent;
        color: #00FF00;
        border: 2px solid #00FF00;
        border-radius: 0;
        font-weight: bold;
        text-transform: uppercase;
        padding: 0.5rem 1rem;
        transition: all 0.3s ease;
    }
    .stButton > button:hover {
        background-color: #00FF00;
        color: #000000;
        box-shadow: 0 0 10px #00FF00;
    }
    
    /* DATAFRAME */
    .dataframe {
        background-color: #000000 !important;
        color: #00FF00 !important;
        font-family: 'Courier New', monospace !important;
        border: 1px solid #004400;
    }
    
    /* ALERTS */
    .stAlert {
        background-color: #110000;
        border: 1px solid #FF0000;
        color: #FF0000;
    }
    
    /* LOG CONTAINER */
    .log-container {
        height: 300px;
        overflow-y: auto;
        background-color: #050505;
        border: 1px solid #004400;
        padding: 10px;
        font-size: 0.8em;
        margin-bottom: 20px;
    }
</style>
""", unsafe_allow_html=True)

# --- REGEX PATTERNS (BRAZILIAN LEGAL) ---
REGEX_MAP = {
    "CPF": r"\d{3}\.?\d{3}\.?\d{3}-?\d{2}",
    "CNPJ": r"\d{2}\.?\d{3}\.?\d{3}/?\d{4}-?\d{2}",
    "CURRENCY_BRL": r"R\$\s?(\d{1,3}(\.\d{3})*,\d{2})",
    "OAB": r"\d{1,6}/?[A-Z]{2}"
}

# --- HELPER FUNCTIONS ---

def log_message(msg: str):
    """Appends a message to the session state log."""
    if 'system_logs' not in st.session_state:
        st.session_state.system_logs = []
    st.session_state.system_logs.append(msg)

def extract_legal_data(text: str) -> Dict[str, Any]:
    """Extracts legal entities using regex."""
    data = {}
    for key, pattern in REGEX_MAP.items():
        match = re.search(pattern, text)
        if match:
            # Clean up value
            val = match.group(0)
            if key == "CURRENCY_BRL":
                # Convert to float for sorting/math
                clean_val = match.group(1).replace('.', '').replace(',', '.')
                data['value_raw'] = float(clean_val)
            data[key] = val
    return data

async def fetch_batch_async(client, card_ids: List[str]):
    """Fetches cards in batches of 10 to respect Trello rate limits."""
    results = []
    BATCH_SIZE = 10
    total_batches = math.ceil(len(card_ids) / BATCH_SIZE)
    
    for i in range(0, len(card_ids), BATCH_SIZE):
        batch_ids = card_ids[i:i+BATCH_SIZE]
        try:
            log_message(f"[NET] BATCH REQUEST {i//BATCH_SIZE + 1}/{total_batches} ({len(batch_ids)} CARDS)...")
            batch_input = BatchCardsInput(card_ids=batch_ids)
            cards = await client.batch_get_cards(batch_input)
            results.extend(cards)
            # Gentle yield to event loop
            await asyncio.sleep(0.1) 
        except Exception as e:
            log_message(f"[ERR] BATCH FAILED: {str(e)}")
            st.error(f"SYSTEM ALERT: BATCH ERROR {str(e)}")
    
    return results

async def run_pipeline(api_key: str, token: str, board_id: str):
    """Main execution pipeline."""
    log_message("[SYS] INITIALIZING ASYNC CLIENT...")
    
    try:
        settings = EnvironmentSettings(
            trello_api_key=api_key,
            trello_api_token=token
        )
        
        async with TrelloClient(settings) as client:
            # 1. Validate Credentials
            user = await client.validate_credentials()
            log_message(f"[AUTH] SUCCESS. USER: {user.get('fullName')}")
            
            # 2. Get Board Structure
            log_message(f"[NET] FETCHING STRUCTURE FOR BOARD: {board_id}")
            structure = await client.get_board_structure(board_id)
            all_cards = structure.cards
            log_message(f"[SYS] FOUND {len(all_cards)} CARDS.")
            
            # 3. Batch Fetch (for detailed fields)
            card_ids = [c.id for c in all_cards]
            detailed_cards = await fetch_batch_async(client, card_ids)
            
            # 4. Process Data
            log_message("[CPU] EXECUTING REGEX EXTRACTION KERNELS...")
            processed_data = []
            for card in detailed_cards:
                extracted = extract_legal_data(card.desc or "")
                row = {
                    "ID": card.id,
                    "NAME": card.name,
                    "LIST_ID": card.id_list,
                    **extracted
                }
                processed_data.append(row)
                
            return pd.DataFrame(processed_data)

    except Exception as e:
        log_message(f"[CRITICAL] PIPELINE HALTED: {str(e)}")
        return None

# --- UI LAYOUT ---

def main():
    st.title("TRELLO_COMMAND_CENTER // v2.0")
    st.markdown("---")

    # 1. Credentials
    c1, c2 = st.columns(2)
    with c1:
        # Load from env if available, allow override
        def_key = os.getenv("TRELLO_API_KEY", "")
        api_key = st.text_input("API_KEY", value=def_key, type="password")
    with c2:
        def_token = os.getenv("TRELLO_API_TOKEN", "")
        token = st.text_input("API_TOKEN", value=def_token, type="password")

    # 2. Controls
    c3, c4 = st.columns([3, 1])
    with c3:
        board_id = st.text_input("TARGET_BOARD_ID", placeholder="ENTER BOARD ID (e.g. k7H3n...)")
    with c4:
        st.write("") 
        st.write("") 
        btn_execute = st.button("[ EXECUTE_PIPELINE ]")

    # 3. Output Areas
    tab_log, tab_data = st.tabs(["SYSTEM_LOGS", "DATA_VIEW"])

    with tab_log:
        log_placeholder = st.empty()
        
        # Render logs from session state
        if 'system_logs' in st.session_state:
            log_html = "<div class='log-container'>"
            for line in st.session_state.system_logs:
                log_html += f"<div>> {line}</div>"
            log_html += "</div>"
            log_placeholder.markdown(log_html, unsafe_allow_html=True)
        else:
            log_placeholder.markdown("<div class='log-container'><div>> SYSTEM STANDBY...</div></div>", unsafe_allow_html=True)

    if btn_execute:
        if not api_key or not token or not board_id:
            st.error("ERROR: MISSING CREDENTIALS OR TARGET.")
        else:
            st.session_state.system_logs = []
            
            # RUN ASYNC WRAPPER
            with st.spinner("PROCESSING..."):
                try:
                    df = asyncio.run(run_pipeline(api_key, token, board_id))
                    
                    if df is not None:
                        st.session_state.df = df
                        st.success("OPERATION COMPLETE.")
                        # Refresh logs
                        st.experimental_rerun()
                except Exception as e:
                    st.error(f"RUNTIME ERROR: {str(e)}")

    with tab_data:
        if 'df' in st.session_state:
            st.dataframe(st.session_state.df, use_container_width=True)
            csv = st.session_state.df.to_csv(index=False).encode('utf-8')
            st.download_button("[ DOWNLOAD_CSV ]", csv, "export.csv", "text/csv")
        else:
            st.info("NO DATA LOADED.")

if __name__ == "__main__":
    main()