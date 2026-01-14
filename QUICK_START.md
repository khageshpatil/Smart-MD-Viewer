# 🚀 Quick Start Guide - Ticket Board

## 5-Minute Setup

### Step 1: Run the Application
```bash
npm run dev
```

### Step 2: Navigate to Tickets
1. Open your browser at `http://localhost:5173`
2. Click the **"Tickets"** button in the header

### Step 3: Create Your First Ticket
1. Click **"+ New Ticket"** button
2. Enter a title: "Set up development environment"
3. Set priority to "High"
4. Add tags: "setup", "infrastructure"
5. Write a description in markdown:
   ```markdown
   ## Tasks
   - [ ] Install dependencies
   - [ ] Configure environment
   - [ ] Test application
   ```
6. Click **"Save"**

### Step 4: Try Drag and Drop
1. Create a few more tickets
2. Drag a ticket from "To Do" to "In Progress"
3. Notice how smooth it moves!

### Step 5: Connect GitHub (Optional)
1. Click **"GitHub"** button
2. Click **"Connect GitHub"**
3. Get a token from: https://github.com/settings/tokens/new
   - Give it a name
   - Select "repo" scope
   - Generate and copy
4. Paste token and click **"Connect"**
5. Browse your repositories and PRs!

## Common Actions

### Create a Ticket
```
Header → "+ New Ticket" → Fill form → Save
```

### Edit a Ticket
```
Click ticket card → Edit fields → Save
```

### Move a Ticket
```
Grab ticket (grip icon) → Drag to column → Drop
```

### Search Tickets
```
Search bar → Type query → Results filter automatically
```

### Link a PR
```
Open ticket → Paste PR URL → Click "+"
```

### Sync PR Status
```
GitHub button → Connection tab → "Sync PR Status"
```

## Tips

1. **Keyboard Shortcut**: Press `Ctrl+Enter` (or `Cmd+Enter` on Mac) to save a ticket
2. **Quick Create**: Use the "+" button in each column to create tickets in that status
3. **Preview Mode**: Toggle between Edit and Preview to see your markdown rendered
4. **Filters**: Use the filter button to narrow down tickets by priority or tags
5. **Clear Search**: Click the "Clear" button to reset all filters

## What's Next?

- Create tickets for your current tasks
- Link your GitHub PRs
- Organize with tags
- Try the markdown editor
- Explore search and filters
- Set up a workflow that works for you

## Need More Help?

- 📖 Read the full documentation: `TICKET_SYSTEM_DOCS.md`
- 🔍 Check implementation details: `IMPLEMENTATION_SUMMARY.md`
- 💡 Review code comments in source files
- 🐛 Report issues on GitHub

---

**Enjoy your new ticket management system!** 🎉
