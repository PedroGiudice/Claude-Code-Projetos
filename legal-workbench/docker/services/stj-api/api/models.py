"""
Pydantic models for STJ API.

Request/Response schemas for all endpoints.
"""
from __future__ import annotations

from datetime import datetime
from typing import Optional, List, Dict, Any
from enum import Enum

from pydantic import BaseModel, Field, validator


class ResultadoJulgamento(str, Enum):
    """Resultado do julgamento."""
    PROVIMENTO = "provimento"
    PARCIAL_PROVIMENTO = "parcial_provimento"
    DESPROVIMENTO = "desprovimento"
    NAO_CONHECIDO = "nao_conhecido"
    INDETERMINADO = "indeterminado"


class TipoDecisao(str, Enum):
    """Tipo de decisão."""
    ACORDAO = "Acórdão"
    MONOCRATICA = "Decisão Monocrática"


# Request models
class SearchRequest(BaseModel):
    """Request body for search endpoint."""
    termo: str = Field(..., description="Termo para buscar", min_length=3)
    orgao: Optional[str] = Field(None, description="Órgão julgador para filtrar")
    dias: int = Field(365, description="Buscar nos últimos N dias", ge=1, le=3650)
    limit: int = Field(100, description="Máximo de resultados", ge=1, le=1000)
    offset: int = Field(0, description="Offset para paginação", ge=0)
    campo: str = Field("ementa", description="Campo para buscar (ementa ou texto_integral)")

    @validator('campo')
    def validar_campo(cls, v):
        if v not in ['ementa', 'texto_integral']:
            raise ValueError('campo deve ser "ementa" ou "texto_integral"')
        return v


class SyncRequest(BaseModel):
    """Request body for sync endpoint."""
    orgaos: Optional[List[str]] = Field(
        None,
        description="Lista de órgãos para sincronizar (None = todos)"
    )
    dias: int = Field(30, description="Sincronizar últimos N dias", ge=1, le=1500)
    data_inicio: Optional[str] = Field(
        None,
        description="Data de início em formato ISO (YYYY-MM-DD). Alternativa ao parâmetro 'dias'"
    )
    force: bool = Field(False, description="Forçar redownload de arquivos existentes")

    @validator('data_inicio')
    def validar_data_inicio(cls, v):
        if v is not None:
            try:
                datetime.strptime(v, "%Y-%m-%d")
            except ValueError:
                raise ValueError('data_inicio deve estar no formato YYYY-MM-DD')
        return v


class ExportFormat(str, Enum):
    """Formato de exportação."""
    JSON = "json"
    CSV = "csv"


class ExportRequest(BaseModel):
    """Request body for export endpoint."""
    termo: str = Field(..., description="Termo para buscar", min_length=3)
    formato: ExportFormat = Field(ExportFormat.JSON, description="Formato de exportação (json ou csv)")
    dias: int = Field(365, description="Buscar nos últimos N dias", ge=1, le=1500)
    orgao: Optional[str] = Field(None, description="Órgão julgador para filtrar")
    campo: str = Field("ementa", description="Campo para buscar (ementa ou texto_integral)")

    @validator('campo')
    def validar_campo(cls, v):
        if v not in ['ementa', 'texto_integral']:
            raise ValueError('campo deve ser "ementa" ou "texto_integral"')
        return v


class ExportResponse(BaseModel):
    """Response metadata for export (returned in headers, not body)."""
    filename: str
    content_type: str
    total_records: int
    formato: ExportFormat


# Response models
class AcordaoSummary(BaseModel):
    """Summary of an acordao (for search results)."""
    id: str
    numero_processo: str
    orgao_julgador: str
    tipo_decisao: Optional[str] = None
    relator: Optional[str] = None
    data_publicacao: Optional[datetime] = None
    data_julgamento: Optional[datetime] = None
    ementa: Optional[str] = None
    resultado_julgamento: Optional[str] = None
    # FTS fields
    score: Optional[float] = Field(None, description="BM25 relevance score from FTS")
    tamanho_texto: Optional[int] = Field(None, description="Size of texto_integral in chars")

    class Config:
        from_attributes = True


class AcordaoDetail(BaseModel):
    """Full details of an acordão."""
    id: str
    numero_processo: str
    hash_conteudo: str
    tribunal: str
    orgao_julgador: str
    tipo_decisao: Optional[str]
    classe_processual: Optional[str]
    ementa: Optional[str]
    texto_integral: Optional[str]
    relator: Optional[str]
    resultado_julgamento: Optional[str]
    data_publicacao: Optional[datetime]
    data_julgamento: Optional[datetime]
    data_insercao: Optional[datetime]
    assuntos: Optional[str]
    fonte: Optional[str]
    fonte_url: Optional[str]
    metadata: Optional[str]

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    """Response for search endpoint with pagination."""
    total: int
    limit: int
    offset: int
    resultados: List[AcordaoSummary]


class StatsResponse(BaseModel):
    """Response for stats endpoint."""
    total_acordaos: int
    por_orgao: Dict[str, int]
    por_tipo: Dict[str, int]
    periodo: Dict[str, Optional[datetime]]
    tamanho_db_mb: float
    ultimos_30_dias: int


class SyncStatus(BaseModel):
    """Status of a sync operation."""
    status: str = Field(..., description="Status da operação (running, completed, failed)")
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    downloaded: int = 0
    processed: int = 0
    inserted: int = 0
    duplicates: int = 0
    errors: int = 0
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Response for health check endpoint."""
    status: str
    version: str
    database: str
    timestamp: datetime
