# CORTEX - Comprehensive Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Core Features](#core-features)
3. [Technical Architecture](#technical-architecture)
4. [Project Structure](#project-structure)
5. [Key Components](#key-components)
6. [Data Management](#data-management)
7. [User Interface](#user-interface)
8. [Workflow & User Journey](#workflow--user-journey)
9. [Technical Stack Details](#technical-stack-details)
10. [Build & Deployment](#build--deployment)
11. [Future Enhancement Opportunities](#future-enhancement-opportunities)

---

## 🎯 Project Overview

**CORTEX** is the planning and knowledge brain - a professional, feature-rich markdown editor and viewer built as a Progressive Web Application (PWA). It provides a comprehensive solution for creating, organizing, editing, and managing markdown documents entirely in the browser with offline-first capabilities.

### Primary Purpose
- Professional markdown editing and live preview
- Document organization with folder hierarchies
- Visual diagram creation with Mermaid.js
- Offline-first document management
- Export capabilities (MD, PDF, Word)
- Workspace backup/restore functionality

### Target Users
- Developers writing technical documentation
- Content creators working with markdown
- Technical writers and documentation teams
- Students and researchers organizing notes
- Anyone needing a powerful, offline-capable markdown editor

---

## ✨ Core Features

### 1. Document Management
- **Create/Edit/Delete** documents with auto-save (500ms debounce)
- **Folder Organization**: Hierarchical folder structure (unlimited nesting)
- **Document Search**: Full-text search across all documents
- **Pinned Documents**: Quick access to frequently used documents
- **Tags System**: Multi-tag support for categorization
- **Document Moving**: Drag-and-drop between folders (via context menu)

### 2. Editing & Preview
- **Three View Modes**:
  - **Code Mode**: Full-width editor
  - **Preview Mode**: Full-width rendered markdown
  - **Split Mode**: Side-by-side editor and preview
- **Live Preview**: Real-time markdown rendering with 500ms auto-save
- **Syntax Highlighting**: Code blocks with syntax highlighting (via Prism.js)
- **GitHub Flavored Markdown**: Tables, task lists, strikethrough support

### 3. Mermaid Diagram Support
- **Inline Diagrams**: Render Mermaid diagrams directly in documents
- **Interactive Sandbox**: Dedicated Mermaid playground with:
  - **6 Built-in Templates**: Flowchart, Sequence, Class, ER, Gantt, Pie
  - **Save Templates**: Save custom diagrams to localStorage
  - **Export Options**: PNG/JPG export functionality
  - **Zoom & Pan**: Interactive diagram preview (zoom: 25%-400%)
  - **Theme Support**: Adapts to light/dark mode
  - **Keyboard Shortcuts**: Quick access to common actions

### 4. Export Capabilities
- **Markdown Export**: Download as `.md` file
- **PDF Export**: Print-to-PDF functionality
- **Word Export**: Export as `.doc` file (HTML-based)
- **Workspace Backup**: Export entire workspace as JSON
- **Workspace Import**: Restore workspace from backup

### 5. Storage & Data Persistence
- **IndexedDB Storage**: All data stored locally in browser
- **Offline-First**: Works completely offline
- **Auto-Save**: Automatic saving with 500ms debounce
- **Data Import/Export**: Full workspace backup/restore
- **No Server Required**: 100% client-side application

### 6. UI/UX Features
- **Dark/Light Theme**: Toggle between themes with persistence
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Collapsible Sidebar**: Expandable document navigation
- **Context Menus**: Right-click actions on documents/folders
- **Toast Notifications**: User feedback for actions
- **Keyboard Shortcuts**: Quick actions in Mermaid sandbox
- **Split Resizable Panels**: Adjustable editor/preview split

---

## 🏗️ Technical Architecture

### Architecture Pattern
**Single Page Application (SPA)** with client-side routing and state management

### Data Flow
```
User Interaction
    ↓
React Component
    ↓
State Update (useState/useEffect)
    ↓
IndexedDB Operations (lib/indexedDB.ts)
    ↓
Auto-save with Debounce (500ms)
    ↓
UI Update & Toast Notification
```

### Component Hierarchy
```
App.tsx (Root)
├── ThemeProvider (Dark/Light mode)
├── QueryClientProvider (TanStack Query)
├── TooltipProvider (Radix UI)
├── BrowserRouter
│   └── Routes
│       ├── Index (Main App)
│       │   ├── SidebarProvider
│       │   │   └── DocumentSidebar
│       │   │       ├── Search
│       │   │       ├── Folder Tree
│       │   │       └── Document List
│       │   ├── Main Content Area
│       │   │   ├── Toolbar (View modes, Export)
│       │   │   ├── Document Title Input
│       │   │   ├── Editor (Textarea)
│       │   │   └── Preview (ReactMarkdown)
│       │   │       ├── SyntaxHighlighter
│       │   │       └── MermaidDiagram
│       │   └── MermaidSandbox (Dialog)
│       └── NotFound (404 Page)
└── Toaster & Sonner (Notifications)
```

---

## 📁 Project Structure

```
CORTEX/
├── .github/workflows/          # CI/CD workflows
│   ├── ci.yml                  # Continuous Integration
│   └── deploy.yml              # GitHub Pages deployment
│
├── public/                     # Static assets
│   ├── .nojekyll              # GitHub Pages config
│   ├── favicon-preview.html   # Favicon preview
│   └── robots.txt             # SEO configuration
│
├── src/                        # Source code
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components (40+ components)
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── sidebar.tsx
│   │   │   └── ... (35+ more)
│   │   ├── DocumentSidebar.tsx    # Main sidebar component (435 lines)
│   │   ├── MermaidDiagram.tsx     # Inline Mermaid renderer
│   │   ├── MermaidSandbox.tsx     # Mermaid playground (872 lines)
│   │   ├── NavLink.tsx            # Navigation link component
│   │   └── ThemeToggle.tsx        # Dark/light theme switcher
│   │
│   ├── hooks/                 # Custom React hooks
│   │   ├── use-mobile.tsx    # Mobile detection hook
│   │   └── use-toast.ts      # Toast notification hook
│   │
│   ├── lib/                   # Utilities and helpers
│   │   ├── indexedDB.ts      # IndexedDB operations (251 lines)
│   │   └── utils.ts          # Utility functions (cn, etc.)
│   │
│   ├── pages/                 # Page components
│   │   ├── Index.tsx         # Main application page (645 lines)
│   │   └── NotFound.tsx      # 404 error page
│   │
│   ├── App.tsx               # Root application component
│   ├── main.tsx              # Application entry point
│   ├── index.css             # Global styles
│   ├── App.css               # App-specific styles
│   └── vite-env.d.ts         # TypeScript definitions
│
├── Configuration Files
│   ├── package.json           # Dependencies & scripts
│   ├── vite.config.ts         # Vite build configuration
│   ├── tsconfig.json          # TypeScript configuration
│   ├── tsconfig.app.json      # App-specific TS config
│   ├── tsconfig.node.json     # Node-specific TS config
│   ├── tailwind.config.ts     # Tailwind CSS configuration
│   ├── postcss.config.js      # PostCSS configuration
│   ├── eslint.config.js       # ESLint configuration
│   ├── components.json        # shadcn/ui configuration
│   └── .gitignore            # Git ignore rules
│
├── Documentation
│   ├── README.md              # Project overview
│   ├── DEPLOYMENT.md          # Deployment guide
│   └── PROJECT_DOCUMENTATION.md  # This file
│
└── Build Artifacts
    ├── index.html             # HTML entry point
    ├── bun.lockb             # Bun lock file
    └── dist/                 # Production build (generated)
```

---

## 🧩 Key Components

### 1. Index.tsx (Main Application - 645 lines)
**Location**: `src/pages/Index.tsx`

**Purpose**: Core application logic and UI orchestration

**Key Responsibilities**:
- Document CRUD operations
- View mode management (code/preview/split)
- Auto-save with debounce (500ms)
- Export functionality (MD, PDF, Word)
- Workspace import/export
- Mermaid sandbox state management
- Tag management
- Toast notifications

**State Management**:
```typescript
- activeDocument: Document | null       // Currently open document
- viewMode: "preview" | "code" | "split" // Current view mode
- sandboxOpen: boolean                   // Mermaid sandbox state
- tagDialogOpen: boolean                 // Tag dialog state
- newTag: string                         // New tag input
- editingDocId: string | null            // Document being edited
- refreshSidebar: number                 // Sidebar refresh trigger
```

**Key Functions**:
- `handleDocumentSelect()` - Load and display document
- `handleNewDocument()` - Create new document
- `handleDeleteDocument()` - Delete document with confirmation
- `updateDocumentContent()` - Update and auto-save content
- `autoSave()` - Debounced save operation (500ms)
- `exportAsMarkdown()` - Export to .md file
- `exportAsPDF()` - Print to PDF
- `exportAsWord()` - Export to .doc format
- `handleExportWorkspace()` - Backup entire workspace
- `handleImportWorkspace()` - Restore workspace from backup

### 2. DocumentSidebar.tsx (435 lines)
**Location**: `src/components/DocumentSidebar.tsx`

**Purpose**: Document and folder navigation/management

**Key Features**:
- Hierarchical folder tree with expand/collapse
- Document list with icons and metadata
- Search functionality (debounced)
- Tag filtering
- Pinned documents section
- Context menus for actions
- Drag-and-drop support (visual feedback)

**State Management**:
```typescript
- searchQuery: string                    // Search input
- documents: Document[]                  // All documents
- folders: FolderType[]                  // All folders
- pinnedDocs: Document[]                 // Pinned documents
- expandedFolders: Set<string>           // Expanded folder IDs
- selectedTag: string | null             // Active tag filter
- renameDialog: {...} | null            // Rename dialog state
```

**Key Functions**:
- `buildFileTree()` - Construct hierarchical tree structure
- `renderFileTree()` - Recursive tree rendering
- `handleSearch()` - Debounced search (300ms)
- `handleDocumentAction()` - Context menu actions
- `handleFolderAction()` - Folder operations

### 3. MermaidSandbox.tsx (872 lines)
**Location**: `src/components/MermaidSandbox.tsx`

**Purpose**: Interactive Mermaid diagram editor and playground

**Key Features**:
- 6 built-in diagram templates (flowchart, sequence, class, ER, gantt, pie)
- Live preview with error handling
- Save/load custom templates (localStorage)
- Export to PNG/JPG with custom dimensions
- Zoom (25%-400%) and pan functionality
- Keyboard shortcuts help dialog
- Theme-aware rendering

**State Management**:
```typescript
- code: string                           // Mermaid code
- svgContent: string                     // Rendered SVG
- error: string                          // Error messages
- savedTemplates: SavedTemplate[]        // Saved diagrams
- saveName: string                       // Template name
- zoomLevel: number                      // Zoom percentage
- panPosition: {x, y}                    // Pan coordinates
```

**Key Functions**:
- `renderDiagram()` - Render Mermaid code to SVG
- `handleExport()` - Export to PNG/JPG
- `handleSaveTemplate()` - Save to localStorage
- `handleZoom()` - Zoom in/out
- `loadTemplate()` - Load built-in or saved template

**Keyboard Shortcuts**:
- `Ctrl/Cmd + S` - Save template
- `Ctrl/Cmd + N` - New diagram
- `Ctrl/Cmd + D` - Delete saved template
- `Ctrl/Cmd + E` - Export PNG
- `Ctrl/Cmd + /` - Show shortcuts help

### 4. MermaidDiagram.tsx
**Location**: `src/components/MermaidDiagram.tsx`

**Purpose**: Inline Mermaid diagram renderer for documents

**Key Features**:
- Automatic diagram rendering
- Error handling and display
- Unique ID generation for multiple diagrams
- Re-render on content change

### 5. indexedDB.ts (251 lines)
**Location**: `src/lib/indexedDB.ts`

**Purpose**: Database operations and data persistence

**Database Schema**:
```typescript
interface Document {
  id: string;                // Unique identifier
  title: string;             // Document title
  content: string;           // Markdown content
  folderId: string | null;   // Parent folder (null = root)
  tags: string[];            // Tag array
  isPinned: boolean;         // Pin status
  createdAt: number;         // Creation timestamp
  updatedAt: number;         // Last update timestamp
}

interface Folder {
  id: string;                // Unique identifier
  name: string;              // Folder name
  parentId: string | null;   // Parent folder (null = root)
  createdAt: number;         // Creation timestamp
}
```

**IndexedDB Stores**:
- `documents` - Document storage with indexes:
  - `folderId` - Query documents by folder
  - `tags` - Multi-entry tag index
  - `isPinned` - Filter pinned documents
  - `updatedAt` - Sort by update time

- `folders` - Folder storage with indexes:
  - `parentId` - Query child folders

**Key Functions**:
- `initDB()` - Initialize database
- `saveDocument()` - Create/update document
- `getDocument()` - Retrieve single document
- `getAllDocuments()` - Get all documents
- `deleteDocument()` - Remove document
- `searchDocuments()` - Full-text search
- `getPinnedDocuments()` - Get pinned documents
- `saveFolder()` - Create/update folder
- `getAllFolders()` - Get all folders
- `deleteFolder()` - Remove folder
- `exportWorkspace()` - Export all data
- `importWorkspace()` - Import workspace data

---

## 💾 Data Management

### Storage Strategy
- **Primary Storage**: IndexedDB (client-side, persistent)
- **Secondary Storage**: localStorage (Mermaid templates only)
- **No Backend**: Completely offline-capable

### Data Persistence
- Auto-save every 500ms after user stops typing
- Immediate save on document switch
- Workspace export creates JSON backup
- Import restores full workspace state

### Data Structure
```
IndexedDB: SmartMDWorkspace
├── Store: documents
│   ├── Index: folderId
│   ├── Index: tags (multiEntry)
│   ├── Index: isPinned
│   └── Index: updatedAt
└── Store: folders
    └── Index: parentId

localStorage:
├── theme-preference
└── mermaid-saved-templates
```

---

## 🎨 User Interface

### Design System
- **Framework**: Tailwind CSS (utility-first)
- **Component Library**: shadcn/ui (40+ components)
- **Icons**: Lucide React (800+ icons)
- **Typography Plugin**: @tailwindcss/typography
- **Theme**: Dark/Light mode with next-themes

### Layout Structure
```
┌─────────────────────────────────────────┐
│ Header: [Menu] Title [Theme] [Actions] │
├─────────┬───────────────────────────────┤
│         │                               │
│ Sidebar │        Main Content           │
│         │                               │
│ Search  │  ┌─────────────────────────┐ │
│         │  │  Document Title         │ │
│ Folders │  ├─────────────────────────┤ │
│   📁    │  │                         │ │
│   📄    │  │  Editor  │   Preview    │ │
│   📄    │  │          │              │ │
│         │  │  (Split View)           │ │
│ Pinned  │  │                         │ │
│   ⭐📄  │  └─────────────────────────┘ │
│         │                               │
└─────────┴───────────────────────────────┘
```

### Component Library (shadcn/ui)
The project uses 40+ pre-built, accessible UI components:

**Layout**: Sidebar, Separator, Scroll Area, Resizable Panels
**Navigation**: Breadcrumb, Navigation Menu, Menubar, Tabs
**Input**: Input, Textarea, Select, Checkbox, Radio Group, Switch, Slider
**Feedback**: Toast, Sonner, Alert, Alert Dialog, Progress
**Overlay**: Dialog, Sheet, Drawer, Popover, Tooltip, Hover Card, Dropdown Menu
**Display**: Card, Badge, Avatar, Skeleton, Accordion, Collapsible
**Data**: Table, Calendar, Chart
**Forms**: Form (with React Hook Form), Label, Input OTP
**Misc**: Button, Toggle, Toggle Group, Command, Context Menu, Carousel

### Theme Implementation
```typescript
// Using next-themes
<ThemeProvider attribute="class" defaultTheme="light">
  {/* App content */}
</ThemeProvider>

// Mermaid theme adaptation
mermaid.initialize({
  theme: theme === 'dark' ? 'dark' : 'neutral'
});
```

---

## 🔄 Workflow & User Journey

### First-Time User
1. Opens application (empty state)
2. Sees welcome screen with "New Document" prompt
3. Creates first document in root folder
4. Types markdown with live preview
5. Auto-save activates after 500ms
6. Can create folders to organize documents
7. Can pin important documents for quick access

### Typical Editing Session
1. Open application (loads from IndexedDB)
2. Browse sidebar or search for document
3. Click document to open in split view
4. Edit markdown with real-time preview
5. Add tags for categorization
6. Pin document if frequently used
7. Export to desired format if needed
8. Changes auto-save continuously

### Advanced Features
1. **Mermaid Diagrams**:
   - Click "Sandbox" button
   - Select template or write custom code
   - Preview with zoom/pan
   - Export as PNG/JPG or copy to document

2. **Organization**:
   - Create nested folder structure
   - Drag documents between folders
   - Use tags for cross-cutting categories
   - Pin important documents

3. **Workspace Management**:
   - Export entire workspace as backup
   - Import workspace on new device
   - Share workspace file with team

---

## 🛠️ Technical Stack Details

### Core Technologies
```json
{
  "runtime": "Browser (ES2020+)",
  "language": "TypeScript 5.8.3",
  "framework": "React 18.3.1",
  "buildTool": "Vite 5.4.19",
  "packageManager": "npm / bun"
}
```

### Frontend Stack
- **React 18.3**: Component-based UI
- **TypeScript 5.8**: Type-safe development
- **Vite 5.4**: Fast build tool and dev server
- **TanStack Query 5.83**: Data fetching and caching
- **React Router DOM 6.30**: Client-side routing

### UI & Styling
- **Tailwind CSS 3.4**: Utility-first CSS framework
- **shadcn/ui**: High-quality React components
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library (800+ icons)
- **next-themes 0.3**: Theme management
- **Vaul 0.9**: Drawer component

### Markdown & Diagrams
- **React Markdown 10.1**: Markdown renderer
- **remark-gfm 4.0**: GitHub Flavored Markdown
- **React Syntax Highlighter 16.1**: Code highlighting
- **Mermaid 11.12**: Diagram generation
- **Prism.js**: Syntax highlighting themes

### Data & Storage
- **IndexedDB API**: Client-side database
- **JSZip 3.10**: Workspace backup/compression
- **date-fns 3.6**: Date formatting

### Forms & Validation
- **React Hook Form 7.61**: Form management
- **Zod 3.25**: Schema validation
- **@hookform/resolvers 3.10**: Form resolvers

### Development Tools
- **ESLint 9.32**: Code linting
- **TypeScript ESLint 8.38**: TS-specific linting
- **Autoprefixer 10.4**: CSS vendor prefixing
- **PostCSS 8.5**: CSS processing
- **@vitejs/plugin-react-swc 3.11**: Fast React refresh

### UI Component Details (Radix UI)
```json
{
  "@radix-ui/react-accordion": "1.2.11",
  "@radix-ui/react-alert-dialog": "1.1.14",
  "@radix-ui/react-dialog": "1.1.14",
  "@radix-ui/react-dropdown-menu": "2.1.15",
  "@radix-ui/react-popover": "1.1.14",
  "@radix-ui/react-scroll-area": "1.2.9",
  "@radix-ui/react-select": "2.2.5",
  "@radix-ui/react-tabs": "1.1.12",
  "@radix-ui/react-toast": "1.2.14",
  "@radix-ui/react-tooltip": "1.2.7"
}
```

---

## 🚀 Build & Deployment

### Development
```bash
# Install dependencies
npm install

# Start dev server (http://localhost:8080)
npm run dev

# Run linter
npm run lint
```

### Production Build
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Build for development (with source maps)
npm run build:dev
```

### Vite Configuration
```typescript
// vite.config.ts
export default defineConfig({
  base: mode === 'production' ? '/Smart-MD-Viewer/' : '/', // Update if repo name changes
  server: {
    host: "::",
    port: 8080
  },
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") }
  }
});
```

### GitHub Pages Deployment

**Automated via GitHub Actions**:
1. Push to `main` branch
2. `.github/workflows/deploy.yml` triggers
3. Builds production bundle
4. Deploys to `gh-pages` branch
5. Available at: `https://[username].github.io/Smart-MD-Viewer/` (Update if repo name changes)

**Deployment Workflow**:
```yaml
# .github/workflows/deploy.yml
- Build with Vite
- Upload artifacts
- Deploy to GitHub Pages
- Uses Node.js 20
```

**Alternative Hosting**:
- **Netlify**: Auto-deploy from GitHub
- **Vercel**: Import GitHub repo
- **Custom Server**: Deploy `dist` folder

---

## 💡 Future Enhancement Opportunities

### Feature Enhancements
1. **Collaboration Features**
   - Real-time collaborative editing
   - Share documents via link
   - Comment system on documents
   - Version history with diff view

2. **Advanced Markdown**
   - Math equation support (KaTeX/MathJax)
   - Custom markdown extensions
   - Footnotes and citations
   - Table of contents auto-generation
   - Front matter YAML support

3. **Editor Improvements**
   - Vim/Emacs keybindings
   - Code completion for markdown
   - Snippet library
   - Find and replace in document
   - Multi-cursor editing
   - Word count and reading time

4. **Organization**
   - Nested tags / tag hierarchies
   - Smart folders (auto-populate by rules)
   - Document templates
   - Bulk operations (move, tag, delete)
   - Advanced search (regex, filters)
   - Sort options for documents

5. **Export Options**
   - EPUB format for e-readers
   - HTML export with themes
   - LaTeX export
   - Confluence/Notion export
   - GitHub Gist integration
   - Medium/Dev.to publishing

6. **Sync & Backup**
   - Cloud sync (Google Drive, Dropbox)
   - Git integration (commit changes)
   - Automatic backups
   - Multi-device sync
   - Conflict resolution

7. **UI/UX**
   - Customizable themes
   - Font selection
   - Editor themes (light/dark variants)
   - Distraction-free mode
   - Presentation mode
   - Custom CSS support

8. **Performance**
   - Virtual scrolling for large documents
   - Web Worker for markdown parsing
   - Progressive loading of documents
   - Service Worker for offline caching

### Technical Improvements
1. **Testing**
   - Unit tests (Vitest)
   - Integration tests (React Testing Library)
   - E2E tests (Playwright/Cypress)
   - Accessibility testing

2. **Code Quality**
   - Comprehensive TypeScript types
   - Error boundary components
   - Logging and analytics
   - Performance monitoring

3. **PWA Features**
   - Service Worker for offline support
   - Install as app prompt
   - Push notifications
   - Background sync

4. **Accessibility**
   - ARIA labels and roles
   - Keyboard navigation improvements
   - Screen reader optimization
   - Focus management

5. **Mobile Optimization**
   - Touch gestures
   - Mobile-optimized editor
   - Bottom sheet navigation
   - Swipe actions

### Integration Ideas
1. **API Integration**
   - GitHub API (repos, gists)
   - Notion API
   - Confluence API
   - WordPress API

2. **Import Options**
   - Import from Notion
   - Import from Evernote
   - Import from OneNote
   - HTML to Markdown converter

3. **Plugin System**
   - Custom markdown renderers
   - Third-party integrations
   - Custom themes
   - Toolbar extensions

### Mermaid Enhancements
1. **Additional Diagram Types**
   - Timeline diagrams
   - User journey maps
   - Git graph
   - Mindmaps
   - State diagrams

2. **Advanced Features**
   - Collaborative diagram editing
   - Diagram library/templates
   - Export animations
   - Interactive diagrams
   - Embed external diagrams

### Performance Optimizations
1. Code splitting for better initial load
2. Lazy loading of components
3. Image optimization and lazy loading
4. IndexedDB query optimization
5. Memoization of expensive computations
6. Virtual DOM optimizations

### Security Enhancements
1. Content Security Policy (CSP)
2. XSS protection for markdown
3. Sanitize user input
4. Secure export functionality
5. Optional encryption for documents

---

## 📊 Project Statistics

### Codebase Size
- **Total Files**: ~80+ files
- **Source Code**: ~3,500+ lines
- **Components**: 45+ components (40+ shadcn/ui + custom)
- **Main Logic**: 
  - Index.tsx: 645 lines
  - DocumentSidebar.tsx: 435 lines
  - MermaidSandbox.tsx: 872 lines
  - indexedDB.ts: 251 lines

### Dependencies
- **Production**: 55+ packages
- **Development**: 15+ packages
- **Total Bundle Size**: ~2-3 MB (production build)

### Browser Compatibility
- **Minimum**: ES2020+ browsers
- **Recommended**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **IndexedDB**: Required (supported by all modern browsers)

---

## 🔧 Configuration Files

### package.json
- **Scripts**: dev, build, build:dev, lint, preview
- **Type**: module (ES modules)
- **Version**: 0.0.0 (pre-release)

### TypeScript Configuration
- **tsconfig.json**: Base configuration
- **tsconfig.app.json**: Application-specific config
- **tsconfig.node.json**: Node/build tools config
- **Target**: ES2020
- **Module**: ESNext
- **JSX**: react-jsx

### Tailwind Configuration
- **Theme**: Custom theme variables
- **Plugins**: @tailwindcss/typography, tailwindcss-animate
- **Dark Mode**: class-based
- **Content**: All TSX files

### ESLint Configuration
- **Parser**: TypeScript ESLint
- **Plugins**: React Hooks, React Refresh
- **Rules**: Recommended presets
- **Ignore**: dist, node_modules

---

## 📝 Key Concepts & Patterns

### React Patterns Used
1. **Custom Hooks**: `use-mobile`, `use-toast`
2. **Context Providers**: Theme, Query Client, Tooltip
3. **Compound Components**: Sidebar, Dialog, Dropdown
4. **Controlled Components**: All form inputs
5. **Refs**: Mermaid rendering, title input focus
6. **Debouncing**: Auto-save, search
7. **Conditional Rendering**: View modes, dialogs

### State Management
- **Local State**: useState for component state
- **Side Effects**: useEffect for data loading
- **Memoization**: useMemo for expensive computations
- **Callbacks**: useCallback for stable function references
- **Refs**: useRef for DOM access and timers

### Code Organization
- **Feature-based**: Components grouped by feature
- **Utility Functions**: Centralized in lib/
- **Type Definitions**: Co-located with components
- **Constants**: Defined at file/component top
- **Separation of Concerns**: UI, logic, data separated

---

## 🎓 Learning Resources

### To Understand This Project
1. **React Fundamentals**: Components, Hooks, State
2. **TypeScript Basics**: Types, Interfaces, Generics
3. **IndexedDB**: Browser database API
4. **Markdown**: Syntax and rendering
5. **Mermaid.js**: Diagram syntax
6. **Tailwind CSS**: Utility classes
7. **Vite**: Build tool and configuration

### Official Documentation
- React: https://react.dev/
- TypeScript: https://www.typescriptlang.org/
- Vite: https://vitejs.dev/
- Tailwind: https://tailwindcss.com/
- shadcn/ui: https://ui.shadcn.com/
- Mermaid: https://mermaid.js.org/
- IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

---

## 📞 Support & Contribution

### How to Contribute
1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request
5. Follow code style guidelines

### Reporting Issues
- Use GitHub Issues
- Provide reproducible steps
- Include browser/OS information
- Attach screenshots if relevant

### Development Guidelines
- Write TypeScript types for all code
- Use ESLint and fix all warnings
- Test in multiple browsers
- Follow existing code patterns
- Document complex logic

---

## 🏁 Conclusion

CORTEX is a comprehensive, production-ready markdown editor built with modern web technologies. It demonstrates best practices in:
- React component architecture
- TypeScript type safety
- Offline-first application design
- Progressive Web App patterns
- Accessible UI components
- Modern build tools (Vite)
- Client-side data persistence (IndexedDB)

The project is well-structured, maintainable, and ready for both personal use and further development. Its modular architecture makes it easy to extend with new features while maintaining code quality.

---

**Last Updated**: November 2025  
**Version**: 0.0.0 (Pre-release)  
**License**: [Specify License]  
**Author**: [Your Name]
