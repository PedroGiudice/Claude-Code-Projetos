import pytest
import json
import shutil
import tempfile
from pathlib import Path
from unittest.mock import MagicMock, patch

# Adiciona o diretório pai ao path para importar os módulos
import sys
sys.path.insert(0, str(Path(__file__).parents[1]))

from src.batch_engine import BatchProcessor

@pytest.fixture
def sample_json_files(tmp_path):
    """Cria arquivos JSON de exemplo para teste."""
    files = []
    data1 = {"nome": "João Silva", "cpf": "123.456.789-00", "id": "card1"}
    data2 = {"nome": "Maria Santos", "cpf": "987.654.321-00", "id": "card2"}
    
    f1 = tmp_path / "card1.json"
    f2 = tmp_path / "card2.json"
    
    with open(f1, 'w', encoding='utf-8') as f:
        json.dump(data1, f)
    with open(f2, 'w', encoding='utf-8') as f:
        json.dump(data2, f)
        
    return [f1, f2]

@pytest.fixture
def sample_template(tmp_path):
    """Cria um arquivo de template DOCX dummy."""
    template_path = tmp_path / "template.docx"
    with open(template_path, 'wb') as f:
        f.write(b"dummy docx content")
    return template_path

def create_dummy_docx(template_path, data, output_path, field_types):
    """Simula a criação de um arquivo DOCX vazio."""
    Path(output_path).touch() # Cria um arquivo vazio no caminho de saída

def test_batch_processing_flow(sample_json_files, sample_template, tmp_path):
    """Teste do fluxo principal do BatchProcessor."""
    output_dir = tmp_path / "output"
    
    # Mockar o DocumentEngine para não precisar de um docx real
    with patch('src.batch_engine.DocumentEngine') as MockEngine:
        # Configurar o mock para criar um arquivo vazio
        mock_engine_instance = MockEngine.return_value
        mock_engine_instance.render.side_effect = create_dummy_docx
        
        processor = BatchProcessor(
            max_workers=1, # Usar 1 worker para evitar complexidade de multiprocessamento no teste
            auto_normalize=True,
            checkpoint_enabled=False
        )
        
        results = processor.process_batch(
            json_files=sample_json_files,
            template_path=sample_template,
            output_dir=output_dir,
            create_zip=True
        )
        
        # Verificações
        assert results['total'] == 2
        assert results['success'] == 2
        assert results['failed'] == 0
        assert len(results['outputs']) == 2
        assert 'zip_path' in results
        assert Path(results['zip_path']).exists()
        assert Path(output_dir / "Joao_Silva.docx").exists() # Verificar um dos arquivos criados
        assert Path(output_dir / "Maria_Santos.docx").exists()

def test_batch_processing_with_errors(sample_json_files, sample_template, tmp_path):
    """Teste do BatchProcessor lidando com erros."""
    output_dir = tmp_path / "output_err"
    
    # Adicionar um arquivo inválido
    bad_file = tmp_path / "bad.json"
    with open(bad_file, 'w') as f:
        f.write("{invalid json")
    
    files = sample_json_files + [bad_file]
    
    with patch('src.batch_engine.DocumentEngine') as MockEngine:
        mock_engine_instance = MockEngine.return_value
        mock_engine_instance.render.side_effect = create_dummy_docx # Mocar para criar arquivos
        
        processor = BatchProcessor(
            max_workers=1,
            checkpoint_enabled=False
        )
        
        results = processor.process_batch(
            json_files=files,
            template_path=sample_template,
            output_dir=output_dir
        )
        
        assert results['total'] == 3
        assert results['success'] == 2
        assert results['failed'] == 1
        assert len(results['errors']) == 1
        assert results['errors'][0]['error_type'] == 'JSONDecodeError'
