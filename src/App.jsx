
import { useRef, useState } from "react";
import {
  FileText,
  LayoutDashboard,
  MessageSquare,
  Plus,
  Upload,
  Search,
  Settings,
  HelpCircle,
  MoreHorizontal,
  Sparkles,
  FilePlus2,
  X,
  Menu,
  ChevronRight,
  File
} from "lucide-react";

import "./App.css";
import ChatScreen from "./ChatScreen";

function App() {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef(null);

  
  const handleUpload = async (event) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      if (file.type !== "application/pdf") {
        alert(`${file.name} is not a PDF file`);
        continue;
      }

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/documents/upload`,
          {
            method: "POST",
            body: formData
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.detail || "Upload failed");
        }

        setDocuments((previous) => [
          {
            id: `${file.name}-${file.lastModified}`,
            name: result.document.file_name,
            size: (file.size / (1024 * 1024)).toFixed(2),
            uploadedAt: new Date().toLocaleDateString(),
            pages: result.document.total_pages,
            chunks: result.document.total_chunks
          },
          ...previous.filter(
            (document) => document.name !== result.document.file_name
          )
        ]);

        alert(`${file.name} uploaded and processed successfully!`);

      } catch (error) {
        alert(`Upload failed: ${error.message}`);
      }
    }

    event.target.value = "";
  };


  const filteredDocuments = documents.filter((document) =>
    document.name.toLowerCase().includes(search.toLowerCase())
  );

  const removeDocument = (id) => {
    setDocuments((previous) =>
      previous.filter((document) => document.id !== id)
    );
  };

  const openUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="app-layout">

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>

        <div className="brand">
          <div className="brand-icon">
            <FileText size={21} />
          </div>
          <span>DocuMind</span>
          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={19} />
          </button>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${activePage === "Dashboard" ? "active" : ""}`}
            onClick={() => setActivePage("Dashboard")}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>

          <button
            className={`nav-item ${activePage === "Documents" ? "active" : ""}`}
            onClick={() => setActivePage("Documents")}
          >
            <FileText size={18} />
            Documents
            <span className="nav-count">{documents.length}</span>
          </button>

          <button
            className={`nav-item ${activePage === "Conversations" ? "active" : ""}`}
            onClick={() => setActivePage("Conversations")}
          >
            <MessageSquare size={18} />
            Conversations
          </button>
        </nav>

        <div className="sidebar-bottom">
          <button className="nav-item">
            <Settings size={18} />
            Settings
          </button>

          <button className="nav-item">
            <HelpCircle size={18} />
            Help & Support
          </button>

          <div className="profile">
            <div className="avatar">S</div>
            <div className="profile-info">
              <strong>My Workspace</strong>
              <span>Personal account</span>
            </div>
            <MoreHorizontal size={19} />
          </div>
        </div>
      </aside>

      <main className="main-content">

        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={21} />
            </button>

            <span>Workspace</span>
            <ChevronRight size={15} />
            <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={17} />
              <input
                placeholder="Search documents..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              {search && (
                <button onClick={() => setSearch("")}>
                  <X size={15} />
                </button>
              )}
            </div>

            <button className="primary-button" onClick={openUpload}>
              <Plus size={17} />
              Upload PDF
            </button>
          </div>
        </header>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={handleUpload}
        />


        {activePage === "Conversations" ? (
          <ChatScreen documents={documents} />
        ) : (
  <section className="page-container">

          <div className="welcome-section">
            <div>
              <div className="eyebrow">
                <Sparkles size={15} />
                AI DOCUMENT ASSISTANT
              </div>

              <h1>
                {activePage === "Dashboard"
                  ? "Your documents, understood."
                  : activePage}
              </h1>

              <p>
                Upload your PDFs and get answers from your documents
                using AI.
              </p>
            </div>

            <button className="primary-button welcome-button" onClick={openUpload}>
              <Upload size={17} />
              Upload a document
            </button>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon blue">
                <FileText size={19} />
              </div>
              <div>
                <span>Total documents</span>
                <strong>{documents.length}</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <MessageSquare size={19} />
              </div>
              <div>
                <span>Conversations</span>
                <strong>0</strong>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon green">
                <Sparkles size={19} />
              </div>
              <div>
                <span>AI assistant</span>
                <strong className="available-status">Ready to use</strong>
              </div>
            </div>
          </div>

          <div className="section-header">
            <div>
              <h2>
                {activePage === "Documents"
                  ? "All documents"
                  : "Your documents"}
              </h2>
              <p>
                {documents.length} PDF
                {documents.length !== 1 ? "s" : ""} uploaded
              </p>
            </div>

            <button className="text-button" onClick={() => setActivePage("Documents")}>
              View all
              <ChevronRight size={16} />
            </button>
          </div>

          {filteredDocuments.length > 0 ? (
            <div className="document-list">
              {filteredDocuments.map((document) => (
                <div className="document-row" key={document.id}>
                  <div className="pdf-icon">
                    <File size={21} />
                  </div>

                  <div className="document-info">
                    <strong>{document.name}</strong>
                    <span>
                      PDF · {document.size} MB · Uploaded {document.uploadedAt}
                    </span>
                  </div>

                  <button
                    className="remove-button"
                    title="Remove document from this demo"
                    onClick={() => removeDocument(document.id)}
                  >
                    <X size={17} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <FilePlus2 size={27} />
              </div>

              <h3>
                {search
                  ? "No matching documents"
                  : "No documents yet"}
              </h3>

              <p>
                {search
                  ? "Try searching with a different document name."
                  : "Upload your first PDF to start exploring your documents with AI."}
              </p>

              {!search && (
                <button className="primary-button" onClick={openUpload}>
                  <Upload size={17} />
                  Upload your first PDF
                </button>
              )}
            </div>
          )}

          <div className="info-section">
            <div className="info-icon">
              <Sparkles size={20} />
            </div>

            <div>
              <strong>Ask your documents anything</strong>
              <p>
                DocuMind will help you find information, understand
                content and get answers with page references.
              </p>
            </div>
          </div>

        </section>
        )}

        <footer>
          DocuMind · AI-powered document assistant
        </footer>

      </main>
    </div>
  );
}

export default App;
