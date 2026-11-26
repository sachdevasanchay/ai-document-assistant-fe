import { useState, useEffect, useRef } from "react";
import {
  Bot,
  Send,
  Plus,
  FileText,
  MessageSquare,
  Sparkles,
  Pencil,
  Trash2
} from "lucide-react";

import "./ChatScreen.css";
import "./Extras.css";
import { apiFetch } from "./api";

const WELCOME_MESSAGE = {
  role: "assistant",
  text: "Hello! I'm DocuMind. Select a PDF document and ask me anything about its content."
};

// A draft is only in the browser until the first message is sent
const createDraftConversation = () => ({
  id: `draft-${Date.now()}`,
  title: "New conversation",
  isDraft: true,
  messages: [WELCOME_MESSAGE]
});

// Converts a conversation from the backend into the shape used here
const normalizeConversation = (chat) => ({
  id: chat.id,
  title: chat.title || "New conversation",
  isDraft: false,
  messages: chat.messages || []
});

function ChatScreen({ documents }) {
  const [selectedDocumentId, setSelectedDocumentId] = useState("");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);

  const bottomRef = useRef(null);

  const currentConversation = conversations.find(
    (item) => item.id === activeConversation
  );

  // Load saved conversations whenever the selected document changes
  useEffect(() => {
    if (!selectedDocumentId) {
      setConversations([]);
      setActiveConversation(null);
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;

    const loadConversations = async () => {
      setHistoryLoading(true);
      setNotice("");

      try {
        const list = await apiFetch(
          `/api/conversations?document_id=${encodeURIComponent(selectedDocumentId)}`
        );

        if (cancelled) return;

        const loaded = list.map(normalizeConversation);

        if (loaded.length > 0) {
          setConversations(loaded);
          setActiveConversation(loaded[0].id);
        } else {
          const fresh = createDraftConversation();
          setConversations([fresh]);
          setActiveConversation(fresh.id);
        }
      } catch (error) {
        if (cancelled) return;

        setNotice(error.message || "Could not load your conversations.");

        const fresh = createDraftConversation();
        setConversations([fresh]);
        setActiveConversation(fresh.id);
      } finally {
        if (!cancelled) setHistoryLoading(false);
      }
    };

    loadConversations();

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId]);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentConversation?.messages.length, loading]);

  const handleNewConversation = () => {
    if (!selectedDocumentId) {
      setNotice("Please select a PDF document first.");
      return;
    }

    // Reuse an existing empty draft instead of stacking many drafts
    const existingDraft = conversations.find((item) => item.isDraft);

    if (existingDraft) {
      setActiveConversation(existingDraft.id);
    } else {
      const draft = createDraftConversation();
      setConversations((previous) => [draft, ...previous]);
      setActiveConversation(draft.id);
    }

    setQuestion("");
    setNotice("");
  };

  const handleRename = async (conversation) => {
    if (conversation.isDraft) return;

    const newTitle = window.prompt("Rename conversation", conversation.title);

    if (!newTitle || !newTitle.trim()) return;

    try {
      const result = await apiFetch(`/api/conversations/${conversation.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: newTitle.trim() })
      });

      setConversations((previous) =>
        previous.map((item) =>
          item.id === conversation.id ? { ...item, title: result.title } : item
        )
      );
    } catch (error) {
      setNotice(error.message || "Could not rename the conversation.");
    }
  };

  const handleDelete = async (conversation) => {
    if (!conversation.isDraft) {
      if (!window.confirm(`Delete "${conversation.title}"?`)) return;

      try {
        await apiFetch(`/api/conversations/${conversation.id}`, {
          method: "DELETE"
        });
      } catch (error) {
        setNotice(error.message || "Could not delete the conversation.");
        return;
      }
    }

    let remaining = conversations.filter((item) => item.id !== conversation.id);

    if (remaining.length === 0) {
      remaining = [createDraftConversation()];
    }

    setConversations(remaining);

    if (activeConversation === conversation.id) {
      setActiveConversation(remaining[0].id);
    }
  };

  const handleSend = async () => {
    if (!question.trim() || loading || !currentConversation) return;

    if (!selectedDocumentId) {
      setNotice("Please select a PDF document first.");
      return;
    }

    const userQuestion = question.trim();
    const conversationId = activeConversation;
    const isDraft = currentConversation.isDraft;

    const userMessage = {
      role: "user",
      text: userQuestion
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: isDraft ? userQuestion.slice(0, 40) : conversation.title,
              messages: [...conversation.messages, userMessage]
            }
          : conversation
      )
    );

    setQuestion("");
    setNotice("");
    setLoading(true);

    try {
      const data = await apiFetch("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          document_id: selectedDocumentId,
          question: userQuestion,
          conversation_id: isDraft ? null : conversationId
        })
      });

      const assistantMessage = {
        role: "assistant",
        text: data.answer,
        sources: data.sources || []
      };

      const savedId = data.conversation_id || conversationId;

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                id: savedId,
                isDraft: false,
                title: data.title || conversation.title,
                messages: [...conversation.messages, assistantMessage]
              }
            : conversation
        )
      );

      if (savedId !== conversationId) {
        setActiveConversation(savedId);
      }
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const messagesToShow = currentConversation
    ? currentConversation.messages
    : [WELCOME_MESSAGE];

  return (
    <div className="chat-workspace">
      <aside className="chat-history">
        <div className="chat-history-header">
          <div>
            <h2>Conversations</h2>
            <p>Your document chats</p>
          </div>

          <button
            className="new-chat-button"
            onClick={handleNewConversation}
            title="New conversation"
          >
            <Plus size={18} />
          </button>
        </div>

        <button
          className="new-conversation-button"
          onClick={handleNewConversation}
        >
          <Plus size={16} />
          New conversation
        </button>

        <div className="conversation-list">
          {historyLoading ? (
            <p className="conversation-loading">Loading conversations...</p>
          ) : (
            conversations.map((conversation) => (
              <div className="conversation-row" key={conversation.id}>
                <button
                  className={`conversation-item ${
                    activeConversation === conversation.id ? "selected" : ""
                  }`}
                  onClick={() => setActiveConversation(conversation.id)}
                >
                  <MessageSquare size={16} />
                  <span>{conversation.title}</span>
                </button>

                <div className="conversation-actions">
                  {!conversation.isDraft && (
                    <button
                      className="icon-button"
                      title="Rename"
                      onClick={() => handleRename(conversation)}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    className="icon-button"
                    title="Delete"
                    onClick={() => handleDelete(conversation)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      <section className="chat-main">
        <div className="chat-header">
          <div className="chat-title">
            <div className="chat-bot-icon">
              <Bot size={20} />
            </div>

            <div>
              <h2>AI Document Chat</h2>
              <p>Ask questions about your documents</p>
            </div>
          </div>

          <div className="document-selector">
            <FileText size={16} />

            <select
              value={selectedDocumentId}
              onChange={(event) => setSelectedDocumentId(event.target.value)}
            >
              <option value="">Select document</option>

              {documents.map((document) => (
                <option key={document.id} value={document.id}>
                  {document.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chat-messages">
          {messagesToShow.map((message, index) => (
            <div key={index} className={`message-row ${message.role}`}>
              {message.role === "assistant" && (
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
              )}

              <div className="message-content">
                <div className="message-author">
                  {message.role === "assistant" ? "DocuMind AI" : "You"}
                </div>

                <div
                  className="message-bubble"
                  style={{ whiteSpace: "pre-wrap" }}
                >
                  {message.text}
                </div>

                {message.role === "assistant" && message.sources?.length > 0 && (
                  <div className="source-placeholder">
                    <FileText size={14} />
                    <div>
                      <strong>Sources</strong>
                      <p>
                        Pages:{" "}
                        {[...new Set(message.sources.map((s) => s.page))].join(", ")}
                      </p>

                      <details className="source-details">
                        <summary>View source text</summary>
                        {message.sources.map((source, sourceIndex) => (
                          <div className="source-snippet" key={sourceIndex}>
                            <strong>Page {source.page}</strong>
                            <p>{source.text}</p>
                          </div>
                        ))}
                      </details>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="message-row assistant">
              <div className="message-avatar">
                <Bot size={18} />
              </div>

              <div className="message-content">
                <div className="message-author">DocuMind AI</div>
                <div className="message-bubble">
                  Thinking... Searching your document.
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className="chat-bottom">
          {notice && <div className="chat-notice">{notice}</div>}

          <div className="chat-input-container">
            <textarea
              placeholder="Ask anything about your document..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
            />

            <button
              className="send-button"
              onClick={handleSend}
              disabled={!question.trim() || loading || !selectedDocumentId}
              title="Send message"
            >
              <Send size={17} />
            </button>
          </div>

          <p className="chat-disclaimer">
            <Sparkles size={13} />
            AI responses will be generated from your uploaded documents.
          </p>
        </div>
      </section>
    </div>
  );
}

export default ChatScreen;