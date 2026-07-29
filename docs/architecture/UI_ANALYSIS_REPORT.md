# CORTEX - UI Analysis Report

**Date:** December 2024  
**Product:** CORTEX (Planning and Knowledge Brain)  
**Analysis Type:** User Interface, Navigation Flows, and User Journeys

---

## 📋 Executive Summary

CORTEX is a multi-page application with 6 main routes, each serving distinct purposes. The application uses a **decentralized navigation pattern** where each page has its own header with context-specific navigation buttons. There is **no global navigation menu**, which creates some navigation challenges but allows for page-specific functionality.

### Key Findings

✅ **Strengths:**
- Consistent header design across pages
- Sidebar navigation on Documents page
- Tab-based navigation within modals and detail pages
- Responsive design considerations

⚠️ **Areas for Improvement:**
- No global navigation menu
- Inconsistent navigation patterns between pages
- Some pages lack clear "back" navigation
- No breadcrumb navigation
- Entry point confusion (root route goes to Focus, not Documents)

---

## 🗺️ Application Routes & Pages

### Route Structure

```
/                    → Focus (Planning/Daily View)
/documents          → Index (Markdown Editor - Main Feature)
/tickets            → Tickets (Kanban Board)
/tasks              → Tasks (Task Management)
/projects           → Projects (Project List)
/projects/:id       → ProjectDetail (Project Workspace)
*                   → NotFound (404 Page)
```

### Page Overview

| Route | Page | Purpose | Has Sidebar | Has Tabs |
|-------|------|---------|-------------|----------|
| `/` | Focus | Daily planning view, project-focused tasks | ❌ | ✅ (in modals) |
| `/documents` | Index | Markdown editor and document management | ✅ | ❌ |
| `/tickets` | Tickets | Ticket management with Kanban board | ❌ | ✅ (GitHub panel) |
| `/tasks` | Tasks | Task management across all projects | ❌ | ✅ (GitHub panel) |
| `/projects` | Projects | Project list and management | ❌ | ❌ |
| `/projects/:id` | ProjectDetail | Project workspace with tabs | ❌ | ✅ (main tabs) |

---

## 🧭 Navigation Patterns

### 1. Header Navigation (Per-Page)

Each page implements its own header with different navigation patterns:

#### **Focus Page (`/`)**
```
Header Layout:
├── Left: [Icon] "Focus" (title)
└── Right: [Projects] [Documents] [All Tasks] [Theme Toggle]
```
- **Navigation:** Links to other main pages
- **No back button** (entry point)
- **Responsive:** Buttons collapse to icons on mobile

#### **Documents Page (`/documents`)**
```
Header Layout:
├── Left: [Sidebar Toggle] [Icon] "CORTEX" (title)
└── Right: [Theme Toggle] [Tickets] [Diagram Editor] [Workspace Menu]
```
- **Navigation:** Link to Tickets page
- **No back button** (main feature page)
- **Sidebar:** Document navigation sidebar

#### **Tickets Page (`/tickets`)**
```
Header Layout:
├── Left: [Back to Documents] | "Ticket Board" (title)
└── Right: [New Ticket] [GitHub] [Theme Toggle]
```
- **Navigation:** Back link to Documents
- **Context-specific:** Ticket creation and GitHub integration

#### **Tasks Page (`/tasks`)**
```
Header Layout:
├── Left: [Back to Documents] | "Tasks" (title)
└── Right: [New Task] [GitHub] [Theme Toggle]
```
- **Navigation:** Back link to Documents
- **Similar pattern to Tickets**

#### **Projects Page (`/projects`)**
```
Header Layout:
├── Left: [Back Arrow] "Projects" (title)
└── Right: [New Project] [Theme Toggle]
```
- **Navigation:** Back button (likely to Focus)
- **Simple layout**

#### **ProjectDetail Page (`/projects/:id`)**
```
Header Layout:
├── Left: [Back Arrow] "Project Name" [Edit Button]
└── Right: [Theme Toggle]
```
- **Navigation:** Back to Projects list
- **Context:** Project-specific actions

### 2. Sidebar Navigation

**Only on Documents Page:**
- Collapsible sidebar (shadcn/ui Sidebar component)
- Document tree with folders
- Search functionality
- Pinned documents section
- Tag filtering
- Context menus for actions

**Other Pages:** No sidebar navigation

### 3. Tab Navigation

Tabs are used in several contexts:

#### **A. GitHub Integration Panel (Tickets & Tasks)**
```
Tabs:
├── Connection (default)
└── Pull Requests (disabled if not authenticated)
```

#### **B. Project Detail Page**
```
Tabs:
├── Overview (default)
├── Tasks
├── Documents
└── Links
```

#### **C. Modal Editors (Ticket, Task, Project)**
```
Tabs:
├── Edit (markdown editor)
└── Preview (rendered markdown)
```

#### **D. Focus View (Project Description)**
```
Tabs:
├── Edit
└── Preview
```

---

## 🚶 User Journeys

### Journey 1: Document Creation & Editing

**Entry Point:** `/documents` or `/` → Click "Documents"

**Flow:**
1. User lands on Documents page
2. Sidebar shows document tree
3. User clicks "New Document" or right-clicks folder
4. New document opens in editor
5. User edits in split view (code + preview)
6. Auto-save after 500ms
7. User can:
   - Add tags
   - Pin document
   - Move to folder
   - Export (MD, PDF, Word)
   - Open Mermaid sandbox

**Navigation Points:**
- Sidebar: Document selection
- Header: Tickets link, Diagram Editor, Workspace menu
- No way to navigate to Projects/Tasks from here

**Issues:**
- ❌ Can't navigate to Projects or Tasks without going through Focus
- ❌ No breadcrumb showing current folder location

---

### Journey 2: Ticket Management

**Entry Point:** `/documents` → Click "Tickets" button

**Flow:**
1. User clicks "Tickets" in Documents header
2. Lands on Tickets page
3. Sees Kanban board (4 columns)
4. User can:
   - Create new ticket (header button or column button)
   - Click ticket to edit
   - Drag ticket between columns
   - Search and filter tickets
   - Connect GitHub and link PRs
5. Back link returns to Documents

**Navigation Points:**
- Header: "Back to Documents" link
- Header: "New Ticket" button
- Header: "GitHub" button (opens sheet with tabs)
- No direct link to Projects or Tasks

**Issues:**
- ❌ "Back to Documents" assumes user came from Documents
- ❌ No way to navigate to Projects/Tasks
- ❌ Can't see related documents or tasks

---

### Journey 3: Project-Based Workflow

**Entry Point:** `/` (Focus page)

**Flow:**
1. User lands on Focus page (root route)
2. Sees project selector
3. Selects or creates project
4. Sees project tasks in Kanban view
5. Can navigate to:
   - Projects page (full list)
   - Documents page
   - Tasks page (all tasks)
6. Clicks project card → ProjectDetail page
7. ProjectDetail shows tabs:
   - Overview (description, stats)
   - Tasks (project tasks)
   - Documents (project documents)
   - Links (external links)

**Navigation Points:**
- Focus header: Links to Projects, Documents, Tasks
- ProjectDetail: Back to Projects, Edit project
- Projects: Back button, New Project

**Issues:**
- ⚠️ Root route goes to Focus (unexpected for many users)
- ⚠️ Focus page is project-centric, but Documents is the main feature
- ❌ No direct link from Documents to Projects

---

### Journey 4: Task Management

**Entry Point:** `/tasks` or `/` → Click "All Tasks"

**Flow:**
1. User navigates to Tasks page
2. Sees all tasks across all projects
3. Kanban board with task columns
4. Can filter by project
5. Can create tasks
6. Can connect GitHub

**Navigation Points:**
- Header: "Back to Documents" link
- Header: "New Task" button
- Header: "GitHub" button

**Issues:**
- ❌ "Back to Documents" doesn't make sense if user came from Focus
- ❌ No link to Projects page
- ❌ No link to Tickets page

---

## 📊 Navigation Flow Diagram

```
                    ┌─────────────┐
                    │   Focus (/) │ ← Entry Point
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Projects    │  │  Documents   │  │    Tasks     │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                  │
       │                 │                  │
       ▼                 ▼                  │
┌──────────────┐  ┌──────────────┐         │
│ProjectDetail │  │   Tickets    │◄────────┘
│  (with tabs) │  │  (Kanban)    │
└──────────────┘  └──────────────┘
```

**Navigation Matrix:**

| From → To | Focus | Documents | Tickets | Tasks | Projects | ProjectDetail |
|-----------|-------|-----------|---------|-------|----------|---------------|
| **Focus** | - | ✅ Link | ❌ | ✅ Link | ✅ Link | ✅ Via Projects |
| **Documents** | ❌ | - | ✅ Link | ❌ | ❌ | ❌ |
| **Tickets** | ❌ | ✅ Back | - | ❌ | ❌ | ❌ |
| **Tasks** | ❌ | ✅ Back | ❌ | - | ❌ | ❌ |
| **Projects** | ✅ Back? | ❌ | ❌ | ❌ | - | ✅ Click Project |
| **ProjectDetail** | ❌ | ❌ | ❌ | ❌ | ✅ Back | - |

**Legend:**
- ✅ = Direct navigation available
- ❌ = No direct navigation
- ⚠️ = Navigation exists but may be confusing

---

## 🎨 UI Component Analysis

### Headers

**Common Elements:**
- Sticky positioning (`sticky top-0 z-20`)
- Border bottom (`border-b border-border`)
- Background (`bg-card`)
- Consistent padding (`px-4 py-3` or `px-4 sm:px-6 py-3`)
- Theme toggle (all pages)

**Variations:**
- **Documents:** Sidebar trigger, CORTEX branding
- **Tickets/Tasks:** "Back to Documents" link
- **Focus:** Multiple navigation buttons
- **Projects:** Back arrow button
- **ProjectDetail:** Back arrow + Edit button

### Sidebars

**Documents Page Sidebar:**
- Type: Collapsible (shadcn/ui Sidebar)
- Features:
  - Search bar
  - Folder tree (expandable)
  - Document list
  - Pinned documents
  - Tag filtering
  - Context menus
- Width: Variable (collapsible to icon-only)

**Other Pages:** No sidebar

### Tabs

**Usage Patterns:**

1. **GitHub Integration (Tickets/Tasks)**
   - 2 tabs: Connection | Pull Requests
   - Disabled state for PRs tab when not authenticated
   - Inside Sheet component

2. **Project Detail**
   - 4 tabs: Overview | Tasks | Documents | Links
   - Main content area
   - Responsive wrapping

3. **Modal Editors**
   - 2 tabs: Edit | Preview
   - Markdown editing mode
   - Small tabs (`h-8`, `text-xs`)

4. **Focus View**
   - 2 tabs: Edit | Preview
   - Project description editing

---

## 🔍 Navigation Issues & Recommendations

### Critical Issues

#### 1. **No Global Navigation Menu**
**Problem:** Users can't easily navigate between main features.

**Impact:**
- Users get "stuck" on pages
- Must use browser back button
- Inconsistent navigation patterns

**Recommendation:**
- Add global navigation menu (sidebar or top nav)
- Or add consistent navigation buttons to all headers

#### 2. **Entry Point Confusion**
**Problem:** Root route (`/`) goes to Focus page, not Documents (main feature).

**Impact:**
- Users expect Documents to be the entry point
- Focus page may be confusing for new users

**Recommendation:**
- Make `/documents` the default route
- Or create a dashboard/landing page at `/`
- Or redirect `/` to `/documents`

#### 3. **Inconsistent Back Navigation**
**Problem:** 
- Tickets/Tasks have "Back to Documents" but user might come from elsewhere
- Projects page back button destination unclear

**Impact:**
- Confusing navigation flow
- Users may lose context

**Recommendation:**
- Use breadcrumbs instead of "Back" buttons
- Or use history-based back navigation
- Or show "Back to [Previous Page]"

#### 4. **Missing Cross-Feature Navigation**
**Problem:** Can't navigate between Tickets, Tasks, Projects from Documents page.

**Impact:**
- Users must go through Focus page
- Fragmented workflow

**Recommendation:**
- Add navigation menu to Documents header
- Or create global navigation component

### Medium Priority Issues

#### 5. **No Breadcrumbs**
**Problem:** No indication of current location in hierarchy.

**Recommendation:**
- Add breadcrumbs to:
  - ProjectDetail page
  - Documents page (folder path)
  - Nested navigation contexts

#### 6. **No Active State Indicators**
**Problem:** Can't tell which page you're on from navigation buttons.

**Recommendation:**
- Highlight active page in navigation
- Use different styling for current page

#### 7. **Mobile Navigation**
**Problem:** Navigation buttons may overflow on mobile.

**Current State:**
- Some pages have responsive classes (`hidden sm:inline`)
- Buttons collapse to icons
- But no mobile menu

**Recommendation:**
- Add hamburger menu for mobile
- Collapse navigation into drawer

---

## 📱 Responsive Design Analysis

### Header Responsiveness

**Desktop (> 1024px):**
- Full button labels visible
- All navigation options shown
- Sidebar visible (Documents page)

**Tablet (768px - 1024px):**
- Some text hidden (`hidden sm:inline`)
- Icons remain visible
- Sidebar collapsible

**Mobile (< 768px):**
- Text labels hidden
- Icons only
- Stacked layout on Focus page
- Sidebar becomes sheet/drawer

### Navigation Responsiveness

**Issues:**
- Focus page buttons wrap on mobile (good)
- Documents header may overflow with many buttons
- No mobile menu for global navigation

---

## 🎯 User Journey Recommendations

### Recommended Navigation Structure

```
┌─────────────────────────────────────────┐
│  Global Navigation (Top or Side)       │
├─────────────────────────────────────────┤
│  [Focus] [Documents] [Tickets] [Tasks] │
│  [Projects]                            │
└─────────────────────────────────────────┘
```

**Benefits:**
- Always accessible
- Clear current location
- Consistent across pages

### Alternative: Enhanced Headers

Add consistent navigation to all headers:

```
All Headers:
├── Left: [Back/Home] [Page Title]
└── Right: [Nav Menu] [Page Actions] [Theme]
```

**Nav Menu Dropdown:**
- Focus
- Documents
- Tickets
- Tasks
- Projects

---

## 📈 Navigation Metrics (Hypothetical)

### Current Navigation Efficiency

| Action | Current Clicks | Optimal Clicks | Efficiency |
|--------|---------------|----------------|------------|
| Documents → Tickets | 1 | 1 | ✅ 100% |
| Documents → Projects | 3+ | 1 | ❌ 33% |
| Tickets → Tasks | 3+ | 1 | ❌ 33% |
| Focus → Documents | 1 | 1 | ✅ 100% |
| Any → Projects | 2-3 | 1 | ⚠️ 50% |

### User Flow Efficiency

**Most Common Flows:**
1. Documents → Tickets (✅ Easy)
2. Documents → Projects (❌ Difficult)
3. Focus → Documents (✅ Easy)
4. Tickets → Documents (✅ Easy)
5. Projects → Documents (❌ Difficult)

---

## 🔧 Technical Implementation Notes

### Navigation Components Used

1. **React Router**
   - `BrowserRouter` with basename
   - `Link` components for navigation
   - `useNavigate` hook for programmatic navigation
   - `useParams` for dynamic routes

2. **shadcn/ui Components**
   - `Sidebar` (Documents page)
   - `Tabs` (multiple contexts)
   - `Sheet` (GitHub panel)
   - `Dialog` (modals)
   - `Button` (navigation buttons)

3. **Navigation Patterns**
   - Link-based navigation (React Router)
   - Button-based navigation (onClick handlers)
   - History-based back navigation
   - Programmatic navigation (useNavigate)

---

## ✅ Strengths

1. **Consistent Header Design**
   - All pages use similar header structure
   - Theme toggle always accessible
   - Sticky positioning for easy access

2. **Context-Specific Navigation**
   - Each page has relevant actions
   - No clutter from unrelated features

3. **Sidebar on Documents**
   - Excellent for document navigation
   - Collapsible for more space
   - Rich functionality (search, filters, context menus)

4. **Tab-Based Organization**
   - Good use of tabs in modals
   - ProjectDetail tabs organize content well
   - GitHub integration tabs are clear

5. **Responsive Considerations**
   - Mobile-friendly button layouts
   - Text hiding on small screens
   - Icon fallbacks

---

## 🎨 Visual Navigation Hierarchy

### Current Hierarchy

```
Level 1: Pages (Routes)
  ├── Focus (/)
  ├── Documents (/documents)
  ├── Tickets (/tickets)
  ├── Tasks (/tasks)
  ├── Projects (/projects)
  └── ProjectDetail (/projects/:id)

Level 2: Page Sections
  ├── Header (navigation + actions)
  ├── Sidebar (Documents only)
  └── Main Content

Level 3: Content Organization
  ├── Tabs (ProjectDetail, Modals)
  ├── Kanban Columns (Tickets, Tasks)
  └── Document Tree (Documents)
```

### Recommended Hierarchy

```
Level 1: Global Navigation
  └── Always visible navigation menu

Level 2: Pages (Routes)
  └── Same as current

Level 3: Page Sections
  ├── Header (page-specific actions)
  ├── Breadcrumbs (context)
  ├── Sidebar (when applicable)
  └── Main Content

Level 4: Content Organization
  └── Same as current
```

---

## 📝 Summary & Action Items

### Immediate Improvements (High Priority)

1. **Add Global Navigation**
   - Create shared navigation component
   - Add to all page headers
   - Show active state

2. **Fix Entry Point**
   - Redirect `/` to `/documents` OR
   - Create dashboard at `/` OR
   - Make Documents the default

3. **Improve Back Navigation**
   - Replace "Back to Documents" with breadcrumbs
   - Or use history-based navigation
   - Show actual previous page

4. **Add Breadcrumbs**
   - ProjectDetail page
   - Documents page (folder path)
   - Nested contexts

### Medium Priority

5. **Mobile Navigation Menu**
   - Hamburger menu for mobile
   - Collapsible navigation drawer

6. **Cross-Feature Links**
   - Add navigation menu to Documents header
   - Link related features (Tickets ↔ Tasks)

7. **Active State Indicators**
   - Highlight current page
   - Show current location

### Low Priority

8. **Navigation Analytics**
   - Track common navigation paths
   - Optimize based on usage

9. **Keyboard Navigation**
   - Keyboard shortcuts for navigation
   - Accessible navigation

10. **Navigation Search**
    - Quick navigation search
    - Jump to any page/feature

---

## 🎯 Conclusion

CORTEX has a **functional but fragmented navigation system**. Each page works well in isolation, but **cross-page navigation is challenging**. The lack of a global navigation menu forces users to remember navigation paths and use browser back buttons.

**Key Recommendation:** Implement a **global navigation menu** (sidebar or top nav) that's always accessible, showing all main features with clear active states. This will significantly improve user experience and make the application feel more cohesive.

**Priority:** High - Navigation is a core UX concern and should be addressed before adding new features.

---

*Report Generated: December 2024*  
*Next Review: After navigation improvements implemented*


