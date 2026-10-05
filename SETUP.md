# Versa AI Gateway — NVIDIA Z.ai GLM-5.3 Setup Guide

## What was built

A minimal Node.js backend (`server.js`) was added alongside the existing
`versa-ai-gateway.html` prototype.  The frontend is **unchanged** except for:

- **Z.ai** added as a provider (NVIDIA-hosted GLM-5.3)
- **Test Connection** for Z.ai now calls the real NVIDIA API (not simulated)
- All other providers keep their existing simulated behavior

The NVIDIA API key lives **only** in `server.js` environment — it is never
sent to the browser or stored in the HTML.

---

## Files added / changed

```
versa-ai-gateway.html   ← patched (Z.ai provider + real test connection)
server.js               ← NEW — local backend proxy to NVIDIA
package.json            ← NEW — Node.js project metadata
.env.example            ← NEW — template for your API key
SETUP.md                ← this file
```

---

## Prerequisites

| Tool   | Minimum version | Check with          |
|--------|-----------------|---------------------|
| Node.js | 18 or later    | `node --version`    |
| npm    | included with Node | `npm --version` |

**Download Node.js (free):** https://nodejs.org  — choose the **LTS** version.

---

## Step-by-step setup

### Step 1 — Put all files in one folder

Make sure these four files are in the **same folder** on your computer:

```
versa-ai-gateway.html
server.js
package.json
.env.example
```

### Step 2 — Get your NVIDIA API key

1. Go to https://integrate.api.nvidia.com
2. Sign in (or create a free account)
3. Click **API Keys** → **Generate Key**
4. Copy the key — it starts with `nvapi-`

### Step 3 — Store your API key

**Option A (recommended) — .env file:**

1. In the same folder, copy `.env.example` and rename the copy to `.env`
2. Open `.env` in any text editor (Notepad, TextEdit, VS Code)
3. Replace `nvapi-YOUR_KEY_HERE` with your actual key:
   ```
   NVIDIA_API_KEY=nvapi-abc123yourrealkeyhere
   ```
4. Save the file.

**Option B — single command (no .env file needed):**

Skip this step and use the command shown in Step 5b instead.

### Step 4 — Install dependencies

Open **Terminal** (Mac) or **Command Prompt** (Windows), navigate to
the folder containing the files, then run:

```bash
npm install
```

This installs only `dotenv` (a tiny package that reads `.env` files).
No internet connection to NVIDIA is made at this step.

### Step 5 — Start the server

**If you used Option A (.env file):**

```bash
node -r dotenv/config server.js
```

**If you used Option B (no .env file):**

```bash
NVIDIA_API_KEY=nvapi-your_key_here node server.js
```

*(On Windows Command Prompt, use:)*
```cmd
set NVIDIA_API_KEY=nvapi-your_key_here && node server.js
```

You should see:

```
  ╔══════════════════════════════════════════════════╗
  ║      Versa AI Gateway – NVIDIA Backend           ║
  ╠══════════════════════════════════════════════════╣
  ║  Server running at http://localhost:3000          ║
  ║  Model: z-ai/glm-5.3                             ║
  ║  API key: ✓ configured                           ║
  ╚══════════════════════════════════════════════════╝
```

### Step 6 — Open the application

Open your browser and go to:

```
http://localhost:3000
```

The Versa AI Gateway prototype loads exactly as before.

---

## How to test the Z.ai connection

1. In the prototype, go to **AI Gateway → Models (LLMs)**
2. Click **+ Add Gateway**
3. In the Connectors step, find **Z.ai** and click **Connect**
4. Enter:
   - **Connection Name:** anything (e.g. `My Z.ai Connection`)
   - **NVIDIA API Key:** paste your key (starts with `nvapi-`)
5. Click **Test Connection**
6. The frontend sends the key to your local `server.js`, which calls
   NVIDIA and returns a real result — success ✓ or the actual error message.
7. Click **Connect** to save.

> **Note:** After saving, the API key is shown masked (`••••••••••••••••`) and
> is not stored anywhere in the browser.

---

## Data flow

```
Browser (versa-ai-gateway.html)
   │  POST /api/test-connection  { apiKey: "nvapi-..." }
   ▼
server.js  (localhost:3000)
   │  reads NVIDIA_API_KEY from environment
   │  POST https://integrate.api.nvidia.com/v1/chat/completions
   │       Authorization: Bearer nvapi-...
   │       model: z-ai/glm-5.3
   ▼
NVIDIA API  →  Z.ai GLM-5.3
   │  200 OK  /  4xx error
   ▼
server.js  →  { success: true/false, message, responseTime, details }
   ▼
Browser  →  displays result using existing Versa UI
```

---

## Error messages and what they mean

| Message | Cause | Fix |
|---------|-------|-----|
| Invalid or missing API key | Wrong key | Check key starts with `nvapi-`, no extra spaces |
| Access forbidden | Key lacks model permission | Check NVIDIA dashboard for model access |
| Model not found | GLM-5.3 unavailable | Check NVIDIA model catalog |
| Rate limit exceeded | Too many requests | Wait and retry |
| Cannot reach the local backend | server.js not running | Start server (Step 5) |
| NVIDIA_API_KEY not configured | .env not loaded | Use `node -r dotenv/config server.js` |

---

## Stopping the server

Press **Ctrl + C** in the terminal.

---

## Security notes

- The API key is **never** in `versa-ai-gateway.html`
- The API key is **never** sent back to the browser in any response
- The `.env` file should **never** be committed to git  
  (add `.env` to your `.gitignore`)
- The server only accepts connections from your own computer (`localhost`)

---

## Quick-start cheatsheet

```bash
# 1. Install
npm install

# 2. Start (with .env file containing your key)
node -r dotenv/config server.js

# 3. Open browser
open http://localhost:3000
```
