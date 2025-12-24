import google.generativeai as genai
import os
import sys
from dotenv import load_dotenv

# Try to load from .env in the ts agent folder
env_path = 'GEMINI-FILES/agents/typescript-frontend/frontend-helper/.env'
load_dotenv(env_path)

api_key = os.getenv('GEMINI_API_KEY')

if not api_key:
    print("Error: GEMINI_API_KEY not found in", env_path)
    sys.exit(1)

genai.configure(api_key=api_key)

print("Listing available models...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(m.name)
except Exception as e:
    print(f"Error listing models: {e}")
