# 🎨 Visual Component Guide

## Component Tree

```
📱 Tickets Page (Main Route: /tickets)
│
├─ 🎯 Header Bar
│  ├─ Back to Documents Link
│  ├─ Page Title: "Ticket Board"
│  ├─ "+ New Ticket" Button
│  ├─ "GitHub" Button (opens Sheet)
│  └─ Theme Toggle
│
├─ 🎪 Ticket Board (Main Content)
│  │
│  ├─ 🔍 Search & Filter Bar
│  │  ├─ Search Input (full-text search)
│  │  ├─ Filter Button (priority + tags)
│  │  └─ Clear Filters Button
│  │
│  └─ 📊 Kanban Columns (4 columns)
│     │
│     ├─ 📝 To Do Column
│     │  ├─ Column Header (title + count + create button)
│     │  └─ Ticket Cards (draggable)
│     │
│     ├─ 🔄 In Progress Column
│     │  ├─ Column Header
│     │  └─ Ticket Cards
│     │
│     ├─ 👀 In Review Column
│     │  ├─ Column Header
│     │  └─ Ticket Cards
│     │
│     └─ ✅ Done Column
│        ├─ Column Header
│        └─ Ticket Cards
│
├─ 🎫 Ticket Modal (Dialog)
│  ├─ Title Input
│  ├─ Status Selector
│  ├─ Priority Selector
│  ├─ Assignee Input
│  ├─ Tags Manager
│  │  ├─ Tag Input + Add Button
│  │  └─ Tag Badges (with remove)
│  ├─ Description Editor
│  │  ├─ Edit/Preview Tabs
│  │  ├─ Textarea (markdown)
│  │  └─ Preview Pane (rendered markdown)
│  ├─ Linked PRs
│  │  ├─ PR URL Input + Add Button
│  │  └─ PR List (with remove)
│  └─ Action Buttons
│     ├─ Delete Button (left)
│     ├─ Cancel Button (right)
│     └─ Save Button (right)
│
└─ 🐙 GitHub Panel (Sheet)
   │
   ├─ Connection Tab
   │  ├─ Auth Card
   │  │  ├─ Connect Button → Auth Dialog
   │  │  │  ├─ Instructions
   │  │  │  ├─ Token Input
   │  │  │  └─ Connect/Cancel Buttons
   │  │  └─ User Profile (when connected)
   │  │     ├─ Avatar
   │  │     ├─ Name + Username
   │  │     └─ Disconnect Button
   │  └─ Sync PR Status Button
   │
   └─ Pull Requests Tab
      └─ PR Panel
         ├─ Repository Selector
         ├─ Refresh Button
         ├─ Search Input
         ├─ Status Filter
         └─ PR List
            └─ PR Cards
               ├─ PR Number + Status Badge
               ├─ PR Title
               ├─ Author + Branch
               ├─ Link Button
               └─ Open in GitHub Button
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Tickets Page                            │
│                                                              │
│  ┌──────────────┐        ┌──────────────┐                  │
│  │  useTickets  │        │  useGitHub   │                  │
│  │    Hook      │        │    Hook      │                  │
│  └──────┬───────┘        └──────┬───────┘                  │
│         │                       │                           │
│         │                       │                           │
│  ┌──────▼───────────────────────▼───────┐                  │
│  │                                       │                  │
│  │  Component State (tickets, user, etc) │                  │
│  │                                       │                  │
│  └──────┬───────────────────┬───────────┘                  │
│         │                   │                               │
│    ┌────▼─────┐      ┌─────▼──────┐                       │
│    │ Ticket   │      │  GitHub    │                       │
│    │  Board   │      │   Panel    │                       │
│    └────┬─────┘      └─────┬──────┘                       │
│         │                   │                               │
│    Drag/Click          Browse/Link                         │
│         │                   │                               │
│    ┌────▼─────┐      ┌─────▼──────┐                       │
│    │ Ticket   │      │   PR       │                       │
│    │  Modal   │      │  Browser   │                       │
│    └──────────┘      └────────────┘                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
         ┌──────▼──────┐         ┌─────▼─────┐
         │  IndexedDB  │         │  GitHub   │
         │   Service   │         │    API    │
         └─────────────┘         └───────────┘
```

## User Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                    User Actions                              │
└─────────────────────────────────────────────────────────────┘

1️⃣ CREATE TICKET
   User clicks → Button → Modal opens → Fill form → Save
   ↓
   Hook creates ticket → IndexedDB stores → UI updates

2️⃣ EDIT TICKET
   User clicks card → Modal opens → Edit fields → Save
   ↓
   Hook updates ticket → IndexedDB updates → UI refreshes

3️⃣ DRAG TICKET
   User drags card → Drop in column → Status changes
   ↓
   Hook updates status → IndexedDB updates → UI reflects

4️⃣ SEARCH TICKETS
   User types → Input changes → Filter function runs
   ↓
   useMemo recalculates → Filtered list updates → UI shows results

5️⃣ CONNECT GITHUB
   User clicks → Dialog opens → Enters token → Submits
   ↓
   Hook authenticates → Token stored → User profile fetched

6️⃣ LINK PR
   User browses → Selects PR → Clicks link → PR added
   ↓
   Ticket updated with PR URL → IndexedDB saves → UI shows link

7️⃣ SYNC PR STATUS
   User clicks sync → Hook fetches PR details → Maps status
   ↓
   Updates ticket status → IndexedDB updates → UI refreshes
```

## Color Scheme

```
Priority Colors:
├─ 🔵 Low      → bg-blue-500
├─ 🟡 Medium   → bg-yellow-500
└─ 🔴 High     → bg-red-500

Status Colors:
├─ ⚪ To Do         → bg-slate-500
├─ 🔵 In Progress  → bg-blue-500
├─ 🟡 In Review    → bg-yellow-500
└─ 🟢 Done         → bg-green-500

PR Status:
├─ 🟢 Open     → default badge
├─ 🟣 Merged   → secondary badge
└─ 🔴 Closed   → destructive badge
```

## State Management

```
Local Component State:
├─ selectedTicket (currently viewing/editing)
├─ modalOpen (ticket modal visibility)
├─ githubPanelOpen (side panel visibility)
├─ searchQuery (search input value)
├─ selectedTags (active tag filters)
└─ selectedPriorities (active priority filters)

useTickets Hook State:
├─ tickets[] (all tickets from DB)
├─ loading (fetch in progress)
└─ error (error message if any)

useGitHub Hook State:
├─ authenticated (connection status)
├─ user (GitHub user profile)
├─ loading (API call in progress)
└─ error (error message if any)
```

## Props Flow

```
Tickets (Page)
│
├─ TicketBoard
│  ├─ tickets: Ticket[]
│  ├─ onTicketClick: (ticket) => void
│  ├─ onMoveTicket: (id, status) => void
│  └─ onCreateTicket: (status) => void
│
├─ TicketModal
│  ├─ ticket: Ticket | null
│  ├─ open: boolean
│  ├─ initialStatus?: TicketStatus
│  ├─ onClose: () => void
│  ├─ onSave: (updates) => Promise<void>
│  └─ onDelete?: (id) => Promise<void>
│
└─ GitHubConnect + GitHubPRPanel
   ├─ authenticated: boolean
   ├─ user: GitHubUser | null
   ├─ onAuthenticate: (token) => Promise<void>
   ├─ onLogout: () => void
   ├─ onFetchRepos: () => Promise<GitHubRepo[]>
   ├─ onFetchPRs: (owner, repo) => Promise<GitHubPR[]>
   └─ onLinkPR: (url) => void
```

## Keyboard Navigation

```
Global:
├─ Tab           → Navigate between elements
└─ Esc           → Close modals/dialogs

In Ticket Modal:
├─ Ctrl/Cmd + Enter  → Save ticket
├─ Tab               → Move between fields
└─ Esc               → Close modal

In Input Fields:
└─ Enter         → Add tag/PR (when in those inputs)

Accessibility:
├─ Focus visible indicators
├─ ARIA labels on buttons
└─ Screen reader friendly
```

## Component Sizes

```
TicketBoard.tsx      → ~195 lines
TicketColumn.tsx     → ~85 lines
TicketCard.tsx       → ~95 lines
TicketModal.tsx      → ~375 lines
GitHubConnect.tsx    → ~165 lines
GitHubPRPanel.tsx    → ~235 lines
useTickets.ts        → ~175 lines
useGitHub.ts         → ~120 lines
github.ts            → ~305 lines
Tickets.tsx          → ~335 lines

Total: ~2,085 lines of component code
Plus: ~1,500+ lines in docs and types
```

## File Dependencies

```
Tickets.tsx depends on:
├─ @/components/TicketBoard
├─ @/components/TicketModal
├─ @/components/GitHubConnect
├─ @/components/GitHubPRPanel
├─ @/hooks/useTickets
├─ @/hooks/useGitHub
└─ @/lib/indexedDB (types)

useTickets.ts depends on:
└─ @/lib/indexedDB (all CRUD functions)

useGitHub.ts depends on:
└─ @/lib/github (all API functions)

All components depend on:
├─ @/components/ui/* (shadcn components)
└─ lucide-react (icons)
```

---

This visual guide helps understand how all pieces fit together! 🎉
