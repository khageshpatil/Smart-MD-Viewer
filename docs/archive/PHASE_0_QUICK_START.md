# 🎙️ Phase 0 Quick Start

## 3-Minute Setup

### Step 1: Get Gemini API Key (1 min)
1. Go to https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### Step 2: Configure Environment (30 sec)
```bash
# Copy template
cp .env.example .env

# Edit .env and paste your API key
VITE_GEMINI_API_KEY=AIzaSyAbc123...YourActualKey
```

### Step 3: Verify Setup (30 sec)
```bash
node scripts/verify-phase0.mjs
```

Should show all ✅ checks.

### Step 4: Run (1 min)
```bash
npm run dev
```

### Step 5: Test Voice Loop (30 sec)
1. Open `http://localhost:5173`
2. Navigate to **Focus** page
3. Click **"Start Listening"**
4. Allow microphone permissions
5. Say: *"What is React?"*
6. Watch the state transitions!

## 🎯 Success!

If you hear the AI respond, **Phase 0 is working!**

## Test Interrupt

1. Start listening and ask a long question
2. While AI is speaking, click **"Interrupt"**
3. Speech stops immediately (<100ms)
4. Click "Reset" to return to idle

## Common Issues

**"Microphone permission denied"**
- Check browser settings → Privacy → Microphone → Allow localhost

**"Gemini API error"**
- Verify .env has correct API key
- No spaces around `=` sign
- Restart dev server after editing .env

**"Speech not working"**
- Use Chrome or Edge (recommended)
- Firefox has limited Speech Recognition support

## What Phase 0 Does

✅ Listen → Think → Speak → Repeat  
✅ Instant interrupt (<100ms)  
✅ Visual state machine display  
✅ Error handling with reset  

## What Phase 0 Doesn't Do

❌ No conversation context  
❌ No planning features  
❌ No voice commands  
❌ No data persistence  

**These come in later phases!**

---

**Start speaking and watch the state machine in action!** 🎉

For details, see [PHASE_0_COMPLETE.md](./PHASE_0_COMPLETE.md)
