# 🎫 Ticket Board System Documentation

## Overview

The Smart MD Viewer now includes a full-featured Jira-like ticket management system with GitHub Pull Request integration. This system enables you to manage development tasks, track progress, and automatically sync ticket status with GitHub PR states.

## Features

### 🎯 Core Features

1. **Kanban Board** - Visual board with 4 columns:
   - To Do
   - In Progress
   - In Review
   - Done

2. **Rich Ticket Management**
   - Create, edit, and delete tickets
   - Drag-and-drop between columns
   - Markdown support in descriptions
   - Priority levels (Low, Medium, High)
   - Tag system for categorization
   - Assignee tracking
   - Search and filter capabilities

3. **GitHub Integration**
   - Connect via Personal Access Token (PAT)
   - Link GitHub Pull Requests to tickets
   - Browse PRs from your repositories
   - Automatic status synchronization
   - PR status mapping:
     - PR opened → Ticket moves to "In Review"
     - PR merged → Ticket moves to "Done"
     - PR closed (not merged) → Ticket moves to "To Do"

### 🎨 UI/UX Features

- **Dark/Light Theme Support** - Seamless theme switching
- **Responsive Design** - Works on all screen sizes
- **Live Preview** - Markdown preview in ticket editor
- **Keyboard Shortcuts** - Ctrl/Cmd + Enter to save
- **Visual Indicators** - Color-coded priorities and status
- **Smooth Animations** - Professional transitions

## Getting Started

### Accessing the Ticket Board

1. Navigate to the main application
2. Click the **"Tickets"** button in the header
3. You'll see the Kanban board with 4 columns

### Creating a Ticket

**Method 1: Quick Create**
1. Click the **"+ New Ticket"** button in the header
2. Fill in the ticket details
3. Click **"Save"**

**Method 2: Column-Specific Create**
1. Click the **"+"** button at the top of any column
2. Ticket will be automatically assigned to that column's status
3. Fill in details and save

### Editing a Ticket

1. Click on any ticket card
2. Modal opens with all ticket details
3. Edit fields as needed
4. Switch between **Edit** and **Preview** tabs for description
5. Press **Ctrl/Cmd + Enter** or click **"Save"**

### Moving Tickets

**Method 1: Drag and Drop**
1. Click and hold the grip handle on a ticket
2. Drag to desired column
3. Drop to update status

**Method 2: Edit Status**
1. Open the ticket
2. Change the **Status** dropdown
3. Save the ticket

### Deleting Tickets

1. Open the ticket
2. Click the **"Delete"** button at bottom-left
3. Confirm deletion in the dialog

## GitHub Integration

### Setup

1. **Get a GitHub Personal Access Token**
   - Go to GitHub Settings → Developer settings → Personal access tokens
   - Click "Generate new token (classic)"
   - Give it a descriptive name (e.g., "Smart MD Viewer Tickets")
   - Select the **"repo"** scope (full control of private repositories)
   - Click "Generate token"
   - Copy the token immediately (you won't see it again!)

2. **Connect to GitHub**
   - Click the **"GitHub"** button in the Tickets header
   - In the "Connection" tab, click **"Connect GitHub"**
   - Paste your Personal Access Token
   - Click **"Connect"**
   - You'll see your GitHub profile once connected

### Linking Pull Requests

**Method 1: Manual URL Entry**
1. Open a ticket
2. Scroll to "Linked Pull Requests"
3. Paste the full GitHub PR URL
4. Click the **"+"** button

**Method 2: Browse and Link**
1. Open a ticket
2. Click **"GitHub"** button in header
3. Switch to **"Pull Requests"** tab
4. Select a repository from the dropdown
5. Browse PRs and click the link icon to attach

### Syncing PR Status

1. Ensure you're connected to GitHub
2. Click **"GitHub"** button in header
3. In the "Connection" tab, click **"Sync PR Status with Tickets"**
4. System will check all linked PRs and update ticket statuses accordingly

## Search and Filtering

### Search

1. Use the search bar at the top of the board
2. Searches across:
   - Ticket titles
   - Descriptions
   - Tags
   - Assignee names

### Filtering

1. Click the **Filter** icon (funnel)
2. Select filters:
   - **Priority**: Low, Medium, High
   - **Tags**: Any tags you've created
3. Selected filters appear as badges below the search bar
4. Click the **"×"** on a badge to remove that filter
5. Click **"Clear"** to remove all filters

## Data Storage

All ticket data is stored locally in your browser using **IndexedDB**:
- Fully offline-capable
- No server required
- Fast and reliable
- Automatic persistence

### Data Schema

Each ticket contains:
```typescript
{
  id: string;              // Unique identifier
  title: string;           // Ticket title
  description: string;     // Markdown description
  status: TicketStatus;    // todo | in-progress | in-review | done
  priority: TicketPriority; // low | medium | high
  tags: string[];          // Array of tags
  assignee: string | null; // Assignee name
  linkedPRs: string[];     // GitHub PR URLs
  createdAt: number;       // Timestamp
  updatedAt: number;       // Timestamp
}
```

## Best Practices

### Ticket Organization

1. **Use Descriptive Titles** - Make it clear what the ticket is about
2. **Add Detailed Descriptions** - Use markdown to structure information
3. **Set Appropriate Priority** - Helps with prioritization
4. **Use Tags Consistently** - Create a tagging system (e.g., "bug", "feature", "docs")
5. **Link PRs Early** - Connect PRs as soon as they're created
6. **Keep Status Updated** - Move tickets through the workflow

### GitHub Workflow

1. **Create Ticket** - Define the task
2. **Move to "In Progress"** - When you start working
3. **Create PR and Link** - Link the PR URL to the ticket
4. **Sync Status** - Periodically sync to auto-update from PR status
5. **Automatic Completion** - Ticket auto-moves to "Done" when PR is merged

### Tag Suggestions

Create a consistent tagging system:
- **Type**: `bug`, `feature`, `enhancement`, `docs`, `refactor`
- **Area**: `ui`, `backend`, `api`, `database`, `auth`
- **Priority**: `critical`, `urgent`, `nice-to-have`
- **Version**: `v1.0`, `v2.0`, `next-release`

## Keyboard Shortcuts

- **Ctrl/Cmd + Enter** - Save ticket (when editing)
- **Esc** - Close modal
- **Enter** - Add tag/PR when in input field

## Technical Architecture

### Components

- **TicketBoard.tsx** - Main Kanban board with filtering
- **TicketColumn.tsx** - Individual column with drag-drop
- **TicketCard.tsx** - Ticket card display
- **TicketModal.tsx** - Full ticket editor modal
- **GitHubConnect.tsx** - GitHub authentication UI
- **GitHubPRPanel.tsx** - PR browsing and linking

### Hooks

- **useTickets.ts** - Ticket CRUD operations
- **useGitHub.ts** - GitHub API integration

### Services

- **lib/indexedDB.ts** - Database operations
- **lib/github.ts** - GitHub API wrapper

## Troubleshooting

### GitHub Connection Issues

**Problem**: "Failed to fetch user information"
- **Solution**: Check that your PAT has the "repo" scope
- **Solution**: Ensure the token hasn't expired

**Problem**: Can't see repositories
- **Solution**: Make sure you granted "repo" access
- **Solution**: Try disconnecting and reconnecting

**Problem**: PR status not syncing
- **Solution**: Verify the PR URL is correct
- **Solution**: Ensure you have access to the repository
- **Solution**: Check that you're still authenticated

### Ticket Issues

**Problem**: Tickets not saving
- **Solution**: Check browser console for errors
- **Solution**: Ensure title field is not empty
- **Solution**: Clear browser cache and try again

**Problem**: Drag and drop not working
- **Solution**: Ensure you're grabbing the grip handle
- **Solution**: Try refreshing the page
- **Solution**: Check if browser supports drag API

**Problem**: Search not working
- **Solution**: Refresh the page
- **Solution**: Clear filters and try again

## API Reference

### Ticket Operations

```typescript
// Create ticket
const ticket = await createTicket({
  title: "New feature",
  description: "Description here",
  status: "todo",
  priority: "medium",
  tags: ["feature"],
  assignee: "developer",
  linkedPRs: [],
});

// Update ticket
await updateTicket(ticketId, {
  status: "in-progress",
  priority: "high",
});

// Delete ticket
await deleteTicket(ticketId);

// Search tickets
const results = await searchTickets("bug");

// Filter by status
const inProgress = await filterByStatus("in-progress");
```

### GitHub Operations

```typescript
// Authenticate
await authenticateWithToken("ghp_xxxxx");

// Fetch repositories
const repos = await fetchRepos();

// Fetch pull requests
const prs = await fetchPRs("owner", "repo");

// Get PR details
const pr = await getPRDetails("https://github.com/owner/repo/pull/123");
```

## Future Enhancements

Potential features for future development:

1. **Comments** - Add discussion threads to tickets
2. **Attachments** - Upload files to tickets
3. **Time Tracking** - Log time spent on tickets
4. **Sprint Planning** - Organize tickets into sprints
5. **Burndown Charts** - Visualize progress
6. **Webhooks** - Real-time PR status updates
7. **Multi-user** - Collaboration features
8. **Export/Import** - Backup and restore tickets
9. **Templates** - Pre-configured ticket templates
10. **Automation** - Rules for automatic actions

## Contributing

When contributing to the ticket system:

1. Follow existing code patterns
2. Use TypeScript for type safety
3. Maintain shadcn/ui component consistency
4. Write clean, documented code
5. Test drag-and-drop functionality
6. Verify GitHub integration
7. Check dark/light theme compatibility

## License

This feature is part of Smart MD Viewer and follows the same license.

---

**Need Help?**
- Check the troubleshooting section above
- Review the code comments in source files
- Open an issue on the GitHub repository
