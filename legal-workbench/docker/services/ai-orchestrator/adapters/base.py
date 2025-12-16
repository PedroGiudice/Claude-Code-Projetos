"""Base adapter interface for AI integrations."""
from abc import ABC, abstractmethod
from typing import AsyncIterator


class BaseAdapter(ABC):
    """
    Abstract base class for AI adapters.

    All adapters must implement stream_response for debate integration.
    """

    @abstractmethod
    async def stream_response(
        self,
        topic: str,
        phase: str,
        prior_synthesis: str = None
    ) -> AsyncIterator[str]:
        """
        Stream a response for a debate topic.

        Args:
            topic: The legal thesis being debated
            phase: Current phase (inicial, replica, razoes_finais)
            prior_synthesis: Previous synthesis for context (never raw opponent responses)

        Yields:
            String chunks of the response as they're generated
        """
        pass

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the adapter is ready to respond."""
        pass
