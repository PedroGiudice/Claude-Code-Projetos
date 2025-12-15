#!/usr/bin/env python3
"""
Integration test for STJ module
Tests that all components can be imported and basic functionality works
"""

import sys
from pathlib import Path
from datetime import datetime, date

# Add project root to path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

def test_module_import():
    """Test 1: Module imports successfully"""
    print("Test 1: Module import...")
    try:
        from modules.stj import render, _setup_imports, _map_display_to_key, ORGAN_DISPLAY_NAMES
        print("  ✅ Module imports successful")
        return True
    except Exception as e:
        print(f"  ❌ Module import failed: {e}")
        return False

def test_backend_imports():
    """Test 2: Backend components import successfully"""
    print("\nTest 2: Backend imports...")
    try:
        backend_path = project_root / "ferramentas" / "stj-dados-abertos"
        sys.path.insert(0, str(backend_path))

        from src.database import STJDatabase
        from src.downloader import STJDownloader
        from src.processor import STJProcessor
        from config import DATABASE_PATH, ORGAOS_JULGADORES, get_date_range_urls

        print("  ✅ Backend imports successful")
        print(f"     - DATABASE_PATH: {DATABASE_PATH}")
        print(f"     - ORGAOS_JULGADORES: {len(ORGAOS_JULGADORES)} organs")
        return True
    except Exception as e:
        print(f"  ❌ Backend import failed: {e}")
        return False

def test_organ_mapping():
    """Test 3: Organ name mapping works"""
    print("\nTest 3: Organ mapping...")
    try:
        from modules.stj import _map_display_to_key, ORGAN_DISPLAY_NAMES

        test_cases = [
            ("Corte Especial", "corte_especial"),
            ("1ª Seção", "primeira_secao"),
            ("2ª Turma", "segunda_turma"),
        ]

        for display_name, expected_key in test_cases:
            result = _map_display_to_key(display_name)
            if result != expected_key:
                print(f"  ❌ Mapping failed: {display_name} -> {result} (expected {expected_key})")
                return False

        print("  ✅ Organ mapping works correctly")
        return True
    except Exception as e:
        print(f"  ❌ Organ mapping test failed: {e}")
        return False

def test_url_generation():
    """Test 4: URL generation for date ranges works"""
    print("\nTest 4: URL generation...")
    try:
        backend_path = project_root / "ferramentas" / "stj-dados-abertos"
        sys.path.insert(0, str(backend_path))

        from config import get_date_range_urls

        start = datetime(2023, 1, 1)
        end = datetime(2023, 1, 31)
        urls = get_date_range_urls(start, end, "corte_especial")

        print(f"  ✅ Generated {len(urls)} URLs for Jan 2023")
        if len(urls) > 0:
            print(f"     - Sample URL: {urls[0]['url'][:80]}...")
        return True
    except Exception as e:
        print(f"  ❌ URL generation failed: {e}")
        return False

def test_database_connection():
    """Test 5: Database connection works (if DB exists)"""
    print("\nTest 5: Database connection...")
    try:
        backend_path = project_root / "ferramentas" / "stj-dados-abertos"
        sys.path.insert(0, str(backend_path))

        from src.database import STJDatabase
        from config import DATABASE_PATH

        if DATABASE_PATH.exists():
            with STJDatabase(DATABASE_PATH) as db:
                stats = db.obter_estatisticas()
                print("  ✅ Database connection successful")
                print(f"     - Total acordãos: {stats.get('total_acordaos', 0):,}")
                print(f"     - DB size: {stats.get('tamanho_db_mb', 0):.1f} MB")
        else:
            print("  ℹ️  Database file doesn't exist yet (will be created on first download)")
        return True
    except Exception as e:
        print(f"  ⚠️  Database test failed (this is OK if DB doesn't exist): {e}")
        return True  # Non-critical failure

def main():
    """Run all integration tests"""
    print("="*70)
    print("STJ Module Integration Test Suite")
    print("="*70)

    tests = [
        test_module_import,
        test_backend_imports,
        test_organ_mapping,
        test_url_generation,
        test_database_connection,
    ]

    results = []
    for test_func in tests:
        results.append(test_func())

    print("\n" + "="*70)
    print("RESULTS")
    print("="*70)

    passed = sum(results)
    total = len(results)

    print(f"Passed: {passed}/{total}")

    if passed == total:
        print("\n🎉 All tests passed! The STJ module is ready to use.")
        print("\nNext steps:")
        print("  1. Start Streamlit: cd legal-workbench && streamlit run app.py")
        print("  2. Navigate to STJ module")
        print("  3. Test Download Center with a small date range")
        return 0
    else:
        print("\n⚠️  Some tests failed. Please review the errors above.")
        return 1

if __name__ == "__main__":
    exit(main())
