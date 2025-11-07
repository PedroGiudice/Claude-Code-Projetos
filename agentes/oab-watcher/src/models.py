"""
Models - Representação dos schemas da API DJEN
"""
from dataclasses import dataclass, field
from typing import List, Optional
from datetime import datetime


@dataclass
class Advogado:
    """Schema: destinatarioadvogados[].advogado"""
    id: int
    nome: str
    numero_oab: str
    uf_oab: str


@dataclass
class DestinatarioAdvogado:
    """Schema: destinatarioadvogados[]"""
    id: int
    comunicacao_id: int
    advogado_id: int
    created_at: str
    updated_at: str
    advogado: Advogado


@dataclass
class Destinatario:
    """Schema: destinatarios[]"""
    nome: str
    polo: str
    comunicacao_id: int


@dataclass
class ComunicacaoOAB:
    """Schema: items[] da busca por OAB"""
    id: int
    data_disponibilizacao: str
    siglaTribunal: str
    tipoComunicacao: str
    nomeOrgao: str
    texto: str
    numero_processo: str
    meio: str
    link: str
    tipoDocumento: str
    nomeClasse: str
    codigoClasse: str
    numeroComunicacao: int
    ativo: bool
    hash: str
    datadisponibilizacao: str
    meiocompleto: str
    numeroprocessocommascara: str
    destinatarios: List[Destinatario]
    destinatarioadvogados: List[DestinatarioAdvogado]


@dataclass
class RespostaBuscaOAB:
    """Schema completo: Response da busca por OAB"""
    status: str
    message: str
    count: int
    items: List[ComunicacaoOAB]


@dataclass
class CadernoTribunal:
    """Schema: Response da busca de cadernos"""
    tribunal: str
    sigla_tribunal: str
    meio: str
    status: str
    versao: str
    data: str
    total_comunicacoes: int
    numero_paginas: int
    hash: str
    url: str  # URL do PDF para download
