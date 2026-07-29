# Rename Summary: Smart MD Viewer → CORTEX

## Files to Modify

### 1. User-Facing UI Text
- `src/pages/Index.tsx` - Header title "Smart MD Viewer" → "CORTEX"

### 2. Metadata & Config
- `index.html` - Title and meta tags
- `vite.config.ts` - Base path (deployment config)
- `src/App.tsx` - Basename for routing

### 3. Documentation Files
- `README.md` - Title and descriptions
- `DEPLOYMENT.md` - References to repo name
- `PROJECT_DOCUMENTATION.md` - Product name references
- `TICKET_SYSTEM_DOCS.md` - Product name references
- `TICKET_BOARD_COMPLETE.md` - Product name references
- `IMPLEMENTATION_SUMMARY.md` - Product name references
- `QUICK_START.md` - If it contains product name
- `VISUAL_GUIDE.md` - If it contains product name

### 4. Database/Storage (⚠️ NEEDS DECISION)
- `src/lib/indexedDB.ts` - `DB_NAME = "SmartMDWorkspace"`
  - **Question:** Should we rename this? 
  - **Risk:** Changing this will create a new database, losing existing user data
  - **Recommendation:** Keep as-is for backward compatibility, or add migration logic

## Types of Changes

1. **UI Text:** "Smart MD Viewer" → "CORTEX" (uppercase in UI)
2. **Documentation:** "Smart MD Viewer" → "Cortex" (sentence case in prose)
3. **Config:** "Smart-MD-Viewer" → "CORTEX" or keep as-is for deployment paths
4. **Database:** Keep "SmartMDWorkspace" for backward compatibility (recommended)

## Notes

- Repository name references in URLs/docs can stay as-is (they're technical, not user-facing)
- Database name should likely remain unchanged to preserve user data
- Deployment paths in vite.config.ts and App.tsx may need to stay as-is if repo name doesn't change

