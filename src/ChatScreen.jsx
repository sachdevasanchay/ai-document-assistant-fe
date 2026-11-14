import { useState } from "react";
import {
  Bot,
  Send,
  Plus,
  FileText,
  MessageSquare,
  Sparkles
} from "lucide-react";

import "./ChatScreen.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

function ChatScreen({ documents }) {
  const [selectedDocument, setSelectedDocument] = useState("");
  const [question, setQuestion] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);

  const [conversations, setConversations] = useState([
    {
      id: 1,
      title: "New conversation",
      messages: [
        {
          role: "assistant",
          text: "Hello! I'm DocuMind. Select a PDF document and ask me anything about its content."
        }
      ]
    }
  ]);

  const [activeConversation, setActiveConversation] = useState(1);

  const currentConversation = conversations.find(
    (item) => item.id === activeConversation
  );

  const handleNewConversation = () => {
    const newConversation = {
      id: Date.now(),
      title: "New conversation",
      messages: [
        {
          role: "assistant",
          text: "Hello! Select a document and ask your first question."
        }
      ]
    };

    setConversations((previous) => [
      newConversation,
      ...previous
    ]);

    setActiveConversation(newConversation.id);
    setQuestion("");
    setNotice("");
  };

  const handleSend = async () => {
    if (!question.trim() || loading) return;

    if (!selectedDocument) {
      setNotice("Please select a PDF document first.");
      return;
    }

    const userQuestion = question.trim();
    const conversationId = activeConversation;

    const userMessage = {
      role: "user",
      text: userQuestion
    };

    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title:
                conversation.title === "New conversation"
                  ? userQuestion.slice(0, 35)
                  : conversation.title,
              messages: [
                ...conversation.messages,
                userMessage
              ]
            }
          : conversation
      )
    );

    setQuestion("");
    setNotice("");
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          document_name: selectedDocument,
          question: userQuestion
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to generate answer.");
      }

      const assistantMessage = {
        role: "assistant",
        text: data.answer,
        sources: data.sources || []
      };

      setConversations((previous) =>
        previous.map((conversation) =>
          conversation.id === conversationId
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  assistantMessage
                ]
              }
            : conversation
        )
      );
    } catch (error) {
      setNotice(error.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={`conversation-item ${
                activeConversation === conversation.id ? "selected" : ""
              }`}
              onClick={() => setActiveConversation(conversation.id)}
            >
              <MessageSquare size={16} />
              <span>{conversation.title}</span>
            </button>
          ))}
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
              value={selectedDocument}
              onChange={(event) => setSelectedDocument(event.target.value)}
            >
              <option value="">Select document</option>

              {documents.map((document) => (
                <option
                  key={document.id}
                  value={document.file_name || document.name}
                >
                  {document.file_name || document.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="chat-messages">

          {currentConversation?.messages.map((message, index) => (
            <div
              key={index}
              className={`message-row ${message.role}`}
            >
              {message.role === "assistant" && (
                <div className="message-avatar">
                  <Bot size={18} />
                </div>
              )}

              <div className="message-content">
                <div className="message-author">
                  {message.role === "assistant" ? "DocuMind AI" : "You"}
                </div>

                <div className="message-bubble">
                  {message.text}
                </div>

                {message.role === "assistant" && message.sources?.length > 0 && (
                  <div className="source-placeholder">
                    <FileText size={14} />
                    <div>
                      **Sources**
                      {message.sources.map((source, sourceIndex) => (
                        <p key={sourceIndex}>
                          Page {source.page}
                        </p>
                      ))}
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

        </div>

        <div className="chat-bottom">

          {notice && (
            <div className="chat-notice">
              {notice}
            </div>
          )}

          <div className="chat-input-container">

            <textarea
              placeholder="Ask anything about your document..."
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey
                ) {
                  event.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
            />

            <button
              className="send-button"
              onClick={handleSend}
              disabled={!question.trim() || loading}
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