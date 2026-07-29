# CORTEX

![Deploy Status](https://github.com/[username]/Smart-md-viewer/actions/workflows/deploy.yml/badge.svg)
![CI Status](https://github.com/[username]/Smart-md-viewer/actions/workflows/ci.yml/badge.svg)

CORTEX is the planning and knowledge brain - a professional markdown viewer and editor with advanced features for organizing, editing, and previewing markdown documents.

> **Note:** Replace `[username]` in the badges above with your GitHub username.

## ✨ Features

- **Multi-Document Management** - Create, organize, and manage multiple markdown documents
- **Folder Organization** - Organize documents in hierarchical folders
- **Live Preview** - Real-time markdown rendering with syntax highlighting
- **Split View** - Edit and preview side-by-side
- **Mermaid Diagrams** - Create flowcharts, sequence diagrams, and more
- **Interactive Mermaid Sandbox** - Test and export diagrams (PNG/JPG)
- **Document Tagging** - Tag and filter documents for easy organization
- **Pin Favorites** - Quick access to frequently used documents
- **Search Functionality** - Full-text search across all documents
- **Dark/Light Theme** - Toggle between themes
- **Auto-Save** - Never lose your work with automatic saving
- **Export Options** - Export as Markdown, PDF, or Word documents
- **Workspace Backup** - Import/export entire workspace
- **Offline Storage** - Uses IndexedDB for local storage

## 🚀 Quick Start

### Prerequisites

- Node.js (v20 or higher) - [Install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/[username]/Smart-md-viewer.git

# Navigate to the project directory
cd Smart-md-viewer
# Note: Repository name may differ from product name (CORTEX)

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`

## 🛠️ Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## 🏗️ Tech Stack

- **[Vite](https://vitejs.dev/)** - Fast build tool and dev server
- **[React](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - High-quality UI components
- **[React Markdown](https://github.com/remarkjs/react-markdown)** - Markdown rendering
- **[Mermaid](https://mermaid.js.org/)** - Diagram and flowchart generation
- **[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)** - Client-side storage

## 📦 Project Structure

```
CORTEX/
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── lib/             # Utilities and helpers
│   ├── hooks/           # Custom React hooks
│   └── App.tsx          # Main application component
├── public/              # Static assets
├── .github/workflows/   # CI/CD workflows
└── README.md
```

## 🚢 Deployment

This project includes automated GitHub Actions workflows for continuous deployment.

**Quick Deploy to GitHub Pages:**

1. Push your code to GitHub
2. Go to **Settings** → **Pages**
3. Select Source: **GitHub Actions**
4. Your site will be live at `https://[username].github.io/Smart-md-viewer/`
   (Update URL if repository name changes)

For detailed deployment instructions, troubleshooting, and alternative hosting options, see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the MIT License.
