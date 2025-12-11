"""
Backend API Client for Streamlit Hub.

Provides unified interface to communicate with all backend services.
"""

import os
import asyncio
from typing import Dict, Any, Optional
from io import BytesIO

import httpx
from pydantic import BaseModel


class ServiceConfig(BaseModel):
    """Configuration for a backend service."""
    name: str
    url: str
    timeout: int = 30


class BackendClient:
    """Client for communicating with Legal Workbench backend services."""

    def __init__(self):
        """Initialize client with service URLs from environment."""
        self.text_extractor_url = os.getenv("TEXT_EXTRACTOR_URL", "http://text-extractor:8001")
        self.doc_assembler_url = os.getenv("DOC_ASSEMBLER_URL", "http://doc-assembler:8002")
        self.stj_api_url = os.getenv("STJ_API_URL", "http://stj-api:8003")
        self.trello_mcp_url = os.getenv("TRELLO_MCP_URL", "http://trello-mcp:8004")

        # Retry configuration
        self.max_retries = 3
        self.base_delay = 1.0
        self.max_delay = 10.0

    async def _retry_request(
        self,
        method: str,
        url: str,
        **kwargs
    ) -> httpx.Response:
        """
        Execute HTTP request with exponential backoff retry.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Target URL
            **kwargs: Additional arguments for httpx request

        Returns:
            httpx.Response object

        Raises:
            httpx.HTTPError: If all retries fail
        """
        for attempt in range(self.max_retries):
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.request(method, url, **kwargs)
                    response.raise_for_status()
                    return response

            except (httpx.HTTPError, httpx.TimeoutException) as e:
                if attempt == self.max_retries - 1:
                    raise

                # Exponential backoff
                delay = min(self.base_delay * (2 ** attempt), self.max_delay)
                await asyncio.sleep(delay)

        raise httpx.HTTPError(f"Failed after {self.max_retries} retries")

    async def extract_pdf(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Extract text from PDF file.

        Args:
            file_bytes: PDF file content
            filename: Original filename

        Returns:
            Extraction result with text and metadata

        Raises:
            httpx.HTTPError: If extraction fails
        """
        files = {
            "file": (filename, BytesIO(file_bytes), "application/pdf")
        }

        response = await self._retry_request(
            "POST",
            f"{self.text_extractor_url}/api/v1/extract",
            files=files
        )

        return response.json()

    async def poll_job(self, job_id: str, service: str = "text-extractor") -> Dict[str, Any]:
        """
        Poll job status from a backend service.

        Args:
            job_id: Job identifier
            service: Service name (text-extractor, doc-assembler, etc.)

        Returns:
            Job status and results

        Raises:
            httpx.HTTPError: If polling fails
        """
        service_urls = {
            "text-extractor": self.text_extractor_url,
            "doc-assembler": self.doc_assembler_url,
            "stj-api": self.stj_api_url,
            "trello-mcp": self.trello_mcp_url
        }

        base_url = service_urls.get(service, self.text_extractor_url)

        response = await self._retry_request(
            "GET",
            f"{base_url}/api/v1/jobs/{job_id}"
        )

        return response.json()

    async def assemble_document(
        self,
        template_id: str,
        data: Dict[str, Any]
    ) -> bytes:
        """
        Assemble document from template and data.

        Args:
            template_id: Template identifier
            data: Template data (variables)

        Returns:
            Generated document bytes

        Raises:
            httpx.HTTPError: If assembly fails
        """
        payload = {
            "template_id": template_id,
            "data": data
        }

        response = await self._retry_request(
            "POST",
            f"{self.doc_assembler_url}/api/v1/assemble",
            json=payload
        )

        return response.content

    async def search_stj(
        self,
        query: str,
        filters: Optional[Dict[str, Any]] = None,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Search STJ jurisprudence.

        Args:
            query: Search query
            filters: Optional filters (date range, court, etc.)
            page: Page number
            page_size: Results per page

        Returns:
            Search results with metadata

        Raises:
            httpx.HTTPError: If search fails
        """
        params = {
            "q": query,
            "page": page,
            "page_size": page_size
        }

        if filters:
            params.update(filters)

        response = await self._retry_request(
            "GET",
            f"{self.stj_api_url}/api/v1/search",
            params=params
        )

        return response.json()

    async def create_trello_card(
        self,
        list_id: str,
        name: str,
        description: Optional[str] = None,
        labels: Optional[list] = None,
        due_date: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Create Trello card.

        Args:
            list_id: Target list ID
            name: Card name
            description: Card description
            labels: Label IDs
            due_date: Due date (ISO format)

        Returns:
            Created card data

        Raises:
            httpx.HTTPError: If creation fails
        """
        payload = {
            "list_id": list_id,
            "name": name
        }

        if description:
            payload["description"] = description
        if labels:
            payload["labels"] = labels
        if due_date:
            payload["due_date"] = due_date

        response = await self._retry_request(
            "POST",
            f"{self.trello_mcp_url}/api/v1/cards",
            json=payload
        )

        return response.json()

    async def check_health(self, service: str) -> bool:
        """
        Check health status of a backend service.

        Args:
            service: Service name (text-extractor, doc-assembler, etc.)

        Returns:
            True if service is healthy, False otherwise
        """
        service_urls = {
            "text-extractor": self.text_extractor_url,
            "doc-assembler": self.doc_assembler_url,
            "stj-api": self.stj_api_url,
            "trello-mcp": self.trello_mcp_url
        }

        url = service_urls.get(service)
        if not url:
            return False

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{url}/health")
                return response.status_code == 200
        except Exception:
            return False

    async def get_service_info(self, service: str) -> Optional[Dict[str, Any]]:
        """
        Get service information and metadata.

        Args:
            service: Service name

        Returns:
            Service info dict or None if unavailable
        """
        service_urls = {
            "text-extractor": self.text_extractor_url,
            "doc-assembler": self.doc_assembler_url,
            "stj-api": self.stj_api_url,
            "trello-mcp": self.trello_mcp_url
        }

        url = service_urls.get(service)
        if not url:
            return None

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{url}/api/v1/info")
                return response.json()
        except Exception:
            return None
