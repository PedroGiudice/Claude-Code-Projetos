import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';

// Constants
const STORAGE_KEY = 'ccui-chat-history';
const MAX_CONVERSATIONS = 50;

// Message interface (matches CCuiChatInterface)
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  isStreaming?: boolean;
  isError?: boolean;
  isSystem?: boolean;
}

// Conversation interface
export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string; // ISO string for serialization
  updatedAt: string; // ISO string for serialization
}

// Context value interface
interface ChatHistoryContextValue {
  conversations: Conversation[];
  currentConversationId: string | null;
  saveConversation: (messages: Message[], conversationId?: string | null) => string;
  loadConversation: (id: string) => Conversation | null;
  deleteConversation: (id: string) => void;
  listConversations: () => Conversation[];
  setCurrentConversationId: (id: string | null) => void;
  startNewConversation: () => void;
  getCurrentConversation: () => Conversation | null;
}

const ChatHistoryContext = createContext<ChatHistoryContextValue | null>(null);

interface ChatHistoryProviderProps {
  children: ReactNode;
}

// Helper: Generate title from first user message
function generateTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((m) => m.role === 'user');
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim();
    if (content.length <= 50) {
      return content;
    }
    return content.substring(0, 47) + '...';
  }
  return 'New Conversation';
}

// Helper: Generate unique ID
function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Helper: Load conversations from localStorage
function loadFromStorage(): Conversation[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.warn('[ChatHistory] Failed to load from localStorage:', error);
  }
  return [];
}

// Helper: Save conversations to localStorage
function saveToStorage(conversations: Conversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.warn('[ChatHistory] Failed to save to localStorage:', error);
  }
}

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({ children }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    const loaded = loadFromStorage();
    setConversations(loaded);
  }, []);

  // Persist conversations whenever they change
  useEffect(() => {
    if (conversations.length > 0) {
      saveToStorage(conversations);
    }
  }, [conversations]);

  const saveConversation = useCallback(
    (messages: Message[], conversationId?: string | null): string => {
      // Filter out system messages and streaming states for storage
      const storedMessages = messages
        .filter((m) => !m.isSystem)
        .map((m) => ({
          ...m,
          isStreaming: false, // Never store streaming state
        }));

      // Skip saving if no meaningful messages
      if (storedMessages.length === 0) {
        return conversationId || '';
      }

      const now = new Date().toISOString();
      const id = conversationId || currentConversationId;

      setConversations((prev) => {
        const existingIndex = id ? prev.findIndex((c) => c.id === id) : -1;

        if (existingIndex >= 0) {
          // Update existing conversation
          const updated = [...prev];
          updated[existingIndex] = {
            ...updated[existingIndex],
            messages: storedMessages,
            title: generateTitle(storedMessages),
            updatedAt: now,
          };
          return updated;
        } else {
          // Create new conversation
          const newConversation: Conversation = {
            id: generateId(),
            title: generateTitle(storedMessages),
            messages: storedMessages,
            createdAt: now,
            updatedAt: now,
          };

          // Add to beginning and enforce FIFO limit
          const updated = [newConversation, ...prev];
          if (updated.length > MAX_CONVERSATIONS) {
            return updated.slice(0, MAX_CONVERSATIONS);
          }

          // Update current conversation ID to the new one
          setCurrentConversationId(newConversation.id);
          return updated;
        }
      });

      return id || currentConversationId || '';
    },
    [currentConversationId]
  );

  const loadConversation = useCallback(
    (id: string): Conversation | null => {
      return conversations.find((c) => c.id === id) || null;
    },
    [conversations]
  );

  const deleteConversation = useCallback(
    (id: string): void => {
      setConversations((prev) => {
        const filtered = prev.filter((c) => c.id !== id);
        saveToStorage(filtered);
        return filtered;
      });

      // Clear current ID if we deleted the current conversation
      if (currentConversationId === id) {
        setCurrentConversationId(null);
      }
    },
    [currentConversationId]
  );

  const listConversations = useCallback((): Conversation[] => {
    return conversations;
  }, [conversations]);

  const startNewConversation = useCallback((): void => {
    setCurrentConversationId(null);
  }, []);

  const getCurrentConversation = useCallback((): Conversation | null => {
    if (!currentConversationId) return null;
    return conversations.find((c) => c.id === currentConversationId) || null;
  }, [currentConversationId, conversations]);

  return (
    <ChatHistoryContext.Provider
      value={{
        conversations,
        currentConversationId,
        saveConversation,
        loadConversation,
        deleteConversation,
        listConversations,
        setCurrentConversationId,
        startNewConversation,
        getCurrentConversation,
      }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
};

export const useChatHistory = (): ChatHistoryContextValue => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};
