# 🔥 Daena — Personal AI Command Center

> *Daēnā (Avesta): "Inner vision, the spirit of sight" — From Zoroastrian philosophy, the essence of wisdom and conscious perception.*

**8 AI agents. 20 models. One command center.**

Daena is a desktop + mobile AI application that gives you a personal AI command center with 8 specialized department agents and a 20-model cascade that ensures your AI never goes silent — all at near-zero cost.

---

## 🎯 What Makes Daena Different

| Feature | ChatGPT / Claude | Daena |
|---------|------------------|-------|
| AI Agents | Single AI | 8 specialized departments |
| Models | 1 model | 20-model cascade, never silent |
| Cost | $20-200/month | ~2,600 FREE requests/day |
| Memory | Basic | Tiered: Hot → Warm → Cold |
| Control | Cloud-based | Runs on YOUR machine |
| Triggers | None | Auto agent-to-agent chains |

---

## 📦 System Requirements

- **macOS** 12+ / **Windows** 10+ / **Linux** (Ubuntu 20+)
- **Python** 3.10+
- **Node.js** 18+
- **~50 MB** disk space
- Internet connection (for AI model access)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Clone or Download

```bash
# If you received a zip file:
unzip daena-app.zip
cd daena-app

# Or clone from repo:
git clone <repo-url> daena-app
cd daena-app
```

### Step 2: Get Your API Key (Free)

1. Go to [openrouter.ai](https://openrouter.ai)
2. Sign up (free, no credit card)
3. Go to **Keys** → **Create Key**
4. Copy your key (starts with `sk-or-v1-...`)

### Step 3: Configure

```bash
# Copy the environment template
cp backend/.env.example backend/.env

# Edit with your API key
nano backend/.env
# Or on macOS:
open -e backend/.env
```

Set your API key:
```env
OPENROUTER_API_KEY=sk-or-v1-your-actual-key-here
```

### Step 4: Install & Start

```bash
# Install Node.js dependencies
npm install

# Make start script executable
chmod +x start.sh

# Start everything!
./start.sh
```

### Step 5: Open Daena

Open your browser and go to: **http://localhost:1420**

🎉 Done! Walk through the 5-step setup wizard and start chatting.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                 DAENA APP                        │
├─────────────────────────────────────────────────┤
│  FRONTEND (React + TypeScript + TailwindCSS)    │
│  ┌──────┐ ┌──────────┐ ┌──────┐ ┌────────┐    │
│  │ Chat │ │Dashboard │ │Agents│ │Settings│    │
│  └──────┘ └──────────┘ └──────┘ └────────┘    │
├─────────────────────────────────────────────────┤
│  BACKEND (Python, zero external dependencies)   │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │WorkerPool│ │MessageBus │ │AgentTriggers │  │
│  │20 models │ │8 agents   │ │5 chains      │  │
│  └──────────┘ └───────────┘ └──────────────┘  │
│  ┌──────────┐ ┌───────────┐ ┌──────────────┐  │
│  │MemoryMgr │ │Orchestrat.│ │  Brain.py    │  │
│  │3-tier    │ │task router│ │  main logic  │  │
│  └──────────┘ └───────────┘ └──────────────┘  │
├─────────────────────────────────────────────────┤
│  AI MODEL CASCADE (OpenRouter)                  │
│  T0: Qwen 3.6 Plus [FREE]                      │
│  T1: 7 strong free models                      │
│  T2: 5 light free models                       │
│  T3: 7 paid models ($0.04 → $0.80/M tokens)   │
│  Total: 13 free + 7 paid = 20 models           │
└─────────────────────────────────────────────────┘
```

---

## 🤖 The 8 Agents

| Agent | Icon | Role | Trigger Chain |
|-------|------|------|--------------|
| **Main Brain** | 🧠 | Central intelligence | Receives all alerts |
| **Finance** | 💰 | Invoicing, budgets | ← Sales (deal closed) |
| **Data** | 📊 | Leads, CRM, enrichment | → Sales (new lead) |
| **Marketing** | 📣 | Content, campaigns | ← Research (competitor) |
| **Sales** | 🎯 | Outreach, proposals | ← Data (new lead) |
| **Research** | 🔬 | Market analysis | → Marketing (intel) |
| **Watchdog** | 🛡️ | System monitoring | → Coordinator (error) |
| **Heartbeat** | 💓 | Health & reports | Scheduled: 08:30, 13:30, 20:30 |
| **Coordinator** | 🎭 | Task routing | ← Watchdog (recovery) |

### Trigger Chains
```
📊 Data finds lead → 🎯 Sales starts outreach
🔬 Research finds intel → 📣 Marketing updates strategy
💰 Finance late invoice → 🧠 Main Brain sends alert
🛡️ Watchdog detects error → 🎭 Coordinator starts recovery
🎯 Sales closes deal → 💰 Finance creates invoice
```

---

## 📊 The 20-Model Cascade

Your AI never goes silent. If one model is rate-limited, the next one takes over automatically:

### Free Tier (13 models, ~2,600 requests/day)
| # | Model | Tier | Context |
|---|-------|------|---------|
| 1 | Qwen 3.6 Plus | T0 | 1M |
| 2 | Llama 4 Maverick | T1 | 1M |
| 3 | Qwen 3 Coder | T1 | 256K |
| 4 | Devstral 2 | T1 | 256K |
| 5 | DeepSeek R1 | T1 | 64K |
| 6 | Nemotron 120B | T1 | 128K |
| 7 | GPT-OSS 120B | T1 | 128K |
| 8 | Qwen Next 80B | T1 | 64K |
| 9 | Llama 4 Scout | T2 | 512K |
| 10 | MiniMax M2.5 | T2 | 1M |
| 11 | Gemma 3 27B | T2 | 96K |
| 12 | Step 3.5 Mini | T2 | 128K |
| 13 | Llama 3.3 70B | T2 | 128K |

### Paid Tier (7 models, last resort)
| # | Model | Tier | Price |
|---|-------|------|-------|
| 14 | GPT-OSS 120B | T3 | $0.04/M |
| 15 | Gemini 2.5 Flash Lite | T3 | $0.10/M |
| 16 | Gemma 4 31B | T3 | $0.14/M |
| 17 | GPT-4o Mini | T3 | $0.15/M |
| 18 | Gemini 3.1 Flash | T3 | $0.25/M |
| 19 | DeepSeek V3.2 | T3 | $0.26/M |
| 20 | Claude 3.5 Haiku | T3 | $0.80/M |

---

## 🧠 Memory System

Daena uses a 3-tier memory system inspired by Mem0/Letta:

| Tier | Storage | Content | Token Cost |
|------|---------|---------|------------|
| **HOT** | RAM | Last 10 messages | ~200 |
| **WARM** | JSONL cache | 24h session summaries | ~100 |
| **COLD** | Disk | Agent contexts (lazy-load) | ~200 |

**Result:** ~500 tokens vs ~6,000 traditional = **92% savings**

---

## 📱 Mobile Connection (Coming Soon)

1. Install Daena on your phone
2. Install [Tailscale](https://tailscale.com) on both devices
3. Scan QR code from Desktop → Settings → Mobile
4. Chat with your AI from anywhere

---

## 📁 Project Structure

```
daena-app/
├── index.html              # Entry HTML
├── package.json            # Node.js dependencies
├── vite.config.ts          # Vite + TailwindCSS config
├── tsconfig.json           # TypeScript config
├── start.sh                # One-command startup
├── src/                    # React Frontend
│   ├── App.tsx            # Main app with routing
│   ├── main.tsx           # React entry point
│   ├── index.css          # Design system (glassmorphism)
│   ├── types/index.ts     # TypeScript interfaces
│   ├── stores/appStore.ts # Zustand state (persisted)
│   ├── lib/api.ts         # Backend API client
│   └── components/
│       ├── layout/        # Sidebar, TopBar
│       ├── setup/         # 5-step Setup Wizard
│       ├── chat/          # Chat interface
│       ├── dashboard/     # KPIs, agents, models
│       ├── agents/        # Agent management
│       └── settings/      # All settings
├── backend/               # Python Backend
│   ├── server.py          # HTTP server (port 8910)
│   ├── .env.example       # API key template
│   ├── config/            # Settings JSON
│   ├── scripts/
│   │   ├── worker_pool.py    # 20-model cascade
│   │   ├── orchestrator.py   # Task routing
│   │   ├── memory_manager.py # 3-tier memory
│   │   ├── message_bus.py    # Inter-agent comms
│   │   ├── agent_triggers.py # Auto trigger chains
│   │   └── brain.py          # Central intelligence
│   ├── agents/            # 8 department configs
│   │   ├── finance/CLAUDE.md
│   │   ├── data/CLAUDE.md
│   │   ├── marketing/CLAUDE.md
│   │   ├── sales/CLAUDE.md
│   │   ├── research/CLAUDE.md
│   │   ├── watchdog/CLAUDE.md
│   │   ├── heartbeat/CLAUDE.md
│   │   └── coordinator/CLAUDE.md
│   └── data/              # Runtime data (JSONL)
└── public/                # Static assets
```

---

## ⚙️ Configuration

### Environment Variables (backend/.env)

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENROUTER_API_KEY` | ✅ | Free from openrouter.ai |
| `ANTHROPIC_API_KEY` | ❌ | For direct Claude API |
| `TELEGRAM_BOT_TOKEN` | ❌ | Telegram bot integration |
| `TELEGRAM_CHAT_ID` | ❌ | Your Telegram user ID |
| `CLAUDE_PATH` | ❌ | Path to claude CLI binary |

### In-App Settings
- **Language:** English, Türkçe, Nederlands, Kurdî
- **Theme:** Dark, Light, System
- **Model Cascade:** Enable/disable, set daily budget
- **Agents:** Toggle each department on/off
- **Notifications:** Desktop alerts

---

## 🔧 Troubleshooting

### "Backend Offline" in the top bar
```bash
# Start the backend manually:
python3 backend/server.py
```

### "No API key configured"
```bash
# Make sure you've set your key:
cat backend/.env
# Should show: OPENROUTER_API_KEY=sk-or-v1-...
```

### Port already in use
```bash
# Kill existing processes:
lsof -ti:1420 | xargs kill -9  # Frontend
lsof -ti:8910 | xargs kill -9  # Backend
```

### Module not found
```bash
npm install  # Reinstall frontend deps
```

---

## 🌍 Supported Platforms

| Platform | Status | Method |
|----------|--------|--------|
| macOS | ✅ Ready | Direct / Tauri build |
| Windows | ✅ Ready | Direct / Tauri build |
| Linux | ✅ Ready | Direct / Tauri build |
| iOS | 🔜 Coming | Tauri Mobile + Tailscale |
| Android | 🔜 Coming | Tauri Mobile + Tailscale |

---

## 📜 License

MIT — Use it, modify it, share it.

---

<div align="center">

**Built with 🔥 by Daena Team**

*"Through inner vision, wisdom is revealed."* — Avesta

</div>
