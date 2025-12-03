import streamlit as st
import time
import json
import pandas as pd

# 1. PAGE CONFIG
st.set_page_config(layout="wide", page_title="Legal CLI", page_icon="⚖️")

# 2. RETRO THEME CSS (Safe Injection)
st.markdown("""
<style>
    /* Global Terminal Black */
    .stApp { background-color: #000000; color: #00ff00; font-family: 'Courier New', monospace; }
    
    /* Widget Colors */
    .stMarkdown, .stButton>button, .stSelectbox, .stFileUploader, h1, h2, h3 { 
        color: #00ff00 !important; 
    }
    
    /* Neon Accents */
    h1 { border-bottom: 2px solid #ff00ff; padding-bottom: 10px; }
    
    /* Button Style */
    .stButton>button { 
        border: 2px solid #00ff00; 
        background-color: #000000; 
        color: #00ff00;
        border-radius: 0px;
    }
    .stButton>button:hover { 
        background-color: #00ff00; 
        color: #000000; 
    }
</style>
""", unsafe_allow_html=True)

# 3. HEADER (Simple & Safe)
st.title(">> LEGAL_EXTRACTOR_V1")

# 4. SIDEBAR
with st.sidebar:
    st.header(">> INPUT_ZONE")
    uploaded_file = st.file_uploader("UPLOAD_TARGET [PDF]", type=['pdf'])
    system = st.selectbox("JUDICIAL_SYSTEM", ["AUTO_DETECT", "PJE", "ESAJ", "STF"])
    process_btn = st.button(">> EXECUTE PIPELINE", use_container_width=True)

# 5. MAIN EXECUTION (MOCKED)
if process_btn:
    # Status Container
    with st.status(">> RUNNING SYSTEM...", expanded=True) as status:
        st.write("> [INIT] MEMORY CHECK...")
        # TODO: INTEGRATION POINT - CLAUDE WILL CONNECT BACKEND HERE
        time.sleep(1) 
        st.write("> [OK] CORE MODULES LOADED")
        time.sleep(1)
        status.update(label=">> PROCESS COMPLETE", state="complete")

    # MOCK DATA (Placeholder for real results)
    st.session_state['results'] = {
        "raw": "DOCUMENT TEXT PREVIEW...",
        "json": {"status": "success", "entities": 14},
        "debug": pd.DataFrame({"module": ["OCR", "NER"], "time": [0.4, 0.2]})
    }

# 6. RESULTS DISPLAY
if 'results' in st.session_state:
    tab1, tab2, tab3 = st.tabs(["RAW_TEXT", "JSON_DATA", "METRICS"])
    with tab1: st.text_area("", st.session_state['results']['raw'])
    with tab2: st.json(st.session_state['results']['json'])
    with tab3: st.dataframe(st.session_state['results']['debug'])
