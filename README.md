# ⚽ FVision — Football Video Intelligence Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![React 19](https://img.shields.io/badge/react-19.2-61dafb.svg)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688.svg)](https://fastapi.tiangolo.com/)

> **FVision** is an open-source, AI-powered football (soccer) video analysis platform. It combines computer vision (YOLOv8 tracking) with a local large language model (LLM) to provide automated tactical insights — player detection, team classification, trajectory visualization, heatmaps, and AI-generated tactical summaries.

![Dashboard Preview](docs/preview.png)

---

## ✨ Features

### 🎯 Player Detection & Tracking
- **YOLOv8** real-time object detection with **ByteTrack** for multi-player tracking
- Automatic **team classification** via K-Means clustering on HSV color features
- Player bounding boxes overlaid on video with team-coded colors

### 📊 Tactical Analytics
- **Heatmap** — player positional density overlay (Gaussian-blurred, color-mapped)
- **Trajectory arrows** — real-time movement vectors showing player direction and speed
- **Formation minimap** — top-down pitch view with live player positions
- **Event detection** — automatic identification of high-activity (crowded) moments

### 🤖 AI-Powered Insights
- **Frame-level analysis** — capture a video frame and let Qwen3-VL provide tactical context
- **Full-match summary** — end-to-end AI report covering formation, attack bias, key events
- Local LLM integration via OpenAI-compatible API (privacy-first, no data leaves your machine)

### 🖥️ Modern Dashboard UI
- Cyberpunk / HUD-inspired design with **glassmorphism** panels
- Hexagonal stats dashboard: speed, player count, possession distribution
- Interactive video timeline with **event markers** and scrubbing
- Match intensity area chart and possession pie chart (powered by Ant Design Charts)
- Real-time AI insight log feed

---

## 🏗️ Architecture

```
fvision/
├── backend/                      # Python FastAPI server
│   ├── app/
│   │   ├── main.py               # FastAPI app entry, CORS, static mount
│   │   ├── api/
│   │   │   ├── videos.py         # Video upload, analysis, heatmap, events, summary
│   │   │   └── ai.py             # AI frame analysis endpoint
│   │   └── services/
│   │       ├── video_processor.py # YOLO detection, tracking, heatmap, event extraction
│   │       └── ai_service.py      # Local LLM client (OpenAI-compatible)
│   ├── requirements.txt
│   └── yolov8n.pt                # YOLOv8 nano model weights
│
├── frontend/                     # React + Vite SPA
│   ├── src/
│   │   ├── App.jsx               # Main app with video + stats layout
│   │   ├── components/
│   │   │   ├── layout/MainLayout.jsx
│   │   │   ├── video/
│   │   │   │   ├── VideoPlayer.jsx      # Video player, controls, analysis triggers
│   │   │   │   ├── VideoUploader.jsx    # Upload with progress bar
│   │   │   │   ├── HeatmapOverlay.jsx   # Heatmap canvas overlay
│   │   │   │   ├── TrajectoryOverlay.jsx # Player movement arrows
│   │   │   │   └── Timeline.jsx         # Interactive event timeline
│   │   │   └── dashboard/
│   │   │       ├── StatsPanel.jsx        # Metrics, charts, AI insights log
│   │   │       └── FormationMinimap.jsx  # Live top-down pitch view
│   │   └── styles/theme.css             # Cyberpunk/HUD theme tokens
│   ├── package.json
│   └── vite.config.js
│
├── run_backend.bat               # Windows launcher (conda + uvicorn)
└── run_frontend.bat              # Windows launcher (npm run dev)
```

### Data Flow

```
Video Upload → YOLOv8 Tracking → Team Clustering → JSON Storage
                                                        ↓
            ┌───────────────────────────────────────────────────────┐
            │  Frontend fetches analysis results via REST API       │
            │                                                      │
            │  /heatmap → HeatmapOverlay    /events → Timeline     │
            │  /summary → Tactical Report   frames → Overlays      │
            └───────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.10+** with `conda` (recommended) or `venv`
- **Node.js 18+** and **npm**
- **(Optional)** A local LLM server (e.g., [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL), [Ollama](https://ollama.ai/), or any OpenAI-compatible API) for AI features

### Backend Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/fvision.git
cd fvision

# Set up Python environment
conda create -n fvision python=3.11 -y
conda activate fvision

# Install dependencies
cd backend
pip install -r requirements.txt

# Download YOLOv8n model (if not present)
# wget https://github.com/ultralytics/assets/releases/download/v0.0.0/yolov8n.pt

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8002
```

The API will be available at `http://localhost:8002`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The UI will be available at `http://localhost:5173` (default Vite dev server).

### LLM Configuration (Optional)

FVision supports any OpenAI-compatible API for AI analysis. Configure the endpoint in `backend/app/services/ai_service.py`:

```python
client = OpenAI(
    base_url="http://localhost:8000/api/v1",  # Your LLM server URL
    api_key="sk-no-key-required"
)
MODEL_NAME = "Qwen3-VL-8B-Instruct-GGUF"  # Your model name
```

If no AI server is available, the application still works — video analysis, heatmaps, and tracking run without it. Only the AI-powered features (frame analysis, tactical summary) require the LLM.

### Windows Quick Start

Run the batch files directly:

```bash
# Terminal 1: Backend
run_backend.bat

# Terminal 2: Frontend
run_frontend.bat
```

---

## 📖 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/videos/upload` | Upload a video file |
| `POST` | `/api/v1/videos/{filename}/analyze` | Start full video analysis (background) |
| `GET` | `/api/v1/videos/{filename}/status` | Poll analysis completion status |
| `POST` | `/api/v1/videos/{filename}/summary` | Generate AI tactical summary |
| `GET` | `/api/v1/videos/{filename}/heatmap` | Get player position heatmap data |
| `GET` | `/api/v1/videos/{filename}/events` | Get detected high-activity events |
| `GET` | `/api/v1/videos` | List all uploaded videos |
| `POST` | `/api/v1/ai/analyze` | Analyze a single video frame with LLM |

### Typical Workflow

1. **Upload** a football match video → receive `filename`
2. **Analyze** → starts YOLO tracking in background
3. **Poll status** until `"completed"` → retrieve tracking JSON
4. **Visualize** — heatmap, events, trajectories, minimap auto-update
5. **AI Summary** (optional) → get a natural-language tactical report

---

## 🧪 How It Works

### Player Detection & Tracking
1. YOLOv8n processes each frame with ByteTrack for consistent ID assignment
2. Each detected player gets a bounding box, center coordinate, and track ID
3. **Team classification**: dominant HSV color is extracted from each player's torso region, then K-Means (k=2) clusters them into two teams

### Heatmap
- All player center positions across all frames are projected onto a 600×600 grid
- Gaussian blur (σ=15) smooths the density map
- Color gradient: blue → cyan → yellow → red (low to high activity)

### Event Detection
- Average player count per frame is computed
- Moments where player count exceeds `mean + 1.5σ` are flagged as high-activity events
- Duplicates within a 2-second window are merged

### AI Tactical Summary
- Statistics (player distribution, speed, spread) are aggregated from tracking data
- A structured prompt is sent to the local LLM for analysis
- The LLM returns tactical observations in Chinese (configurable)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python, FastAPI, Uvicorn |
| **Computer Vision** | Ultralytics YOLOv8, OpenCV |
| **ML / Analysis** | NumPy, SciPy, scikit-learn |
| **AI / LLM** | OpenAI SDK (for local API), Qwen3-VL |
| **Frontend** | React 19, Vite |
| **Charts** | @ant-design/plots (G2Plot) |
| **Styling** | CSS custom properties, glassmorphism design |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details.

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgements

- [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics) for state-of-the-art object detection
- [ByteTrack](https://github.com/ifzhang/ByteTrack) for multi-object tracking
- [FastAPI](https://fastapi.tiangolo.com/) for the high-performance web framework
- [React](https://react.dev/) and [Vite](https://vitejs.dev/) for the frontend tooling
- [Qwen3-VL](https://github.com/QwenLM/Qwen3-VL) for vision-language capabilities
- [Ant Design Charts](https://ant-design-charts.antgroup.com/) for data visualization

---

## 📸 Screenshots

> *Coming soon — add your screenshots to `docs/` and link them here.*

| Dashboard | Heatmap & Trajectories | Timeline |
|:-:|:-:|:-:|
| ![Dashboard](docs/dashboard.png) | ![Heatmap](docs/heatmap.png) | ![Timeline](docs/timeline.png) |
