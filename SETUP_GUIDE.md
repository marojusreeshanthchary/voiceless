# VØICELESS Setup & Deployment Guide

Complete guide for running VØICELESS locally, on GitHub, and in production environments.

---

## 🚀 Local Setup (5 minutes)

### Step 1: Clone & Navigate
```bash
git clone https://github.com/yourusername/voiceless.git
cd voiceless
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run Calibration & Detection
```bash
python voiceless_mvp.py
```

**What you'll see:**
- Calibration window opens
- Prompts appear: "Prepare for: HELP" → "Calibrate: HELP" (for 2.5 seconds each)
- Repeat for STOP, YES, NO
- Detection starts automatically
- Press `q` to quit

---

## 🌐 Web Demo (Local Browser)

### Option A: Direct Browser
```bash
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Option B: Local Server (Recommended)
```bash
# Python 3
python -m http.server 8000

# Then open: http://localhost:8000
```

**Demo Features:**
- ✅ Fully functional without backend
- ✅ Click demo buttons to simulate detections
- ✅ Interactive lip visualization
- ✅ Confidence scoring display

---

## 🔗 Connect Backend to Frontend

### Setup Flask API Server

**Option 1: Quick Wrapper**

Create `voiceless_api.py`:
```python
from flask import Flask, jsonify
from flask_cors import CORS
import threading
import voiceless_mvp  # Import your main module

app = Flask(__name__)
CORS(app)

# Global state (updated by voiceless_mvp)
current_prediction = {"word": "WAITING", "confidence": 0.0}

@app.route('/api/prediction')
def get_prediction():
    return jsonify(current_prediction)

if __name__ == '__main__':
    # In production, run voiceless_mvp in a separate thread
    # and update current_prediction continuously
    app.run(debug=True, port=5000)
```

Run both:
```bash
# Terminal 1: Backend
python voiceless_api.py

# Terminal 2: Frontend server
python -m http.server 8000
```

**Option 2: Modify script.js**

In `script.js`, change:
```javascript
const CONFIG = {
  API_URL: 'http://127.0.0.1:5000/api/prediction',
  USE_MOCK: false  // Enable real backend
};
```

---

## 📦 GitHub Setup

### 1. Initialize Git Repository
```bash
git init
git add .
git commit -m "Initial commit: VØICELESS MVP"
```

### 2. Create GitHub Repo
- Go to github.com/new
- Create repo named `voiceless`
- Copy remote URL

### 3. Push to GitHub
```bash
git remote add origin https://github.com/yourusername/voiceless.git
git branch -M main
git push -u origin main
```

### 4. Create README Badges (Optional)
In README.md, add:
```markdown
# VØICELESS

![Python](https://img.shields.io/badge/Python-3.10%2B-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)
[![GitHub](https://img.shields.io/badge/GitHub-voiceless-black)](https://github.com/yourusername/voiceless)
```

### 5. Add Demo Screenshots/GIFs
```bash
mkdir demo-output
# Add images: calibration.png, detection.gif, ui-demo.png

# In README.md:
![Demo UI](demo-output/ui-demo.png)
```

### 6. GitHub Pages (Optional - Show Live Demo)
```bash
# Create gh-pages branch
git checkout -b gh-pages
git push -u origin gh-pages

# Enable in GitHub repo settings:
# Settings → Pages → Branch: gh-pages → Save
# Your site: https://yourusername.github.io/voiceless
```

---

## 🐳 Docker Deployment (Production)

Create `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libsm6 libxext6 libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy files
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY voiceless_mvp.py .
COPY voiceless_api.py .

EXPOSE 5000

CMD ["python", "voiceless_api.py"]
```

Build & Run:
```bash
# Build
docker build -t voiceless:latest .

# Run
docker run -p 5000:5000 --device /dev/video0 voiceless:latest
```

---

## ☁️ Cloud Deployment (AWS/Google Cloud)

### AWS EC2
1. Launch Ubuntu instance with GPU (g4dn.xlarge)
2. Connect via SSH
3. Install dependencies:
   ```bash
   sudo apt-get update
   pip install -r requirements.txt
   ```
4. Run API server with Gunicorn:
   ```bash
   pip install gunicorn
   gunicorn -w 4 -b 0.0.0.0:5000 voiceless_api:app
   ```

### Google Cloud Run
1. Create Dockerfile (see above)
2. Deploy:
   ```bash
   gcloud run deploy voiceless \
     --source . \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated
   ```

---

## 🧪 Testing Checklist

- [ ] Python version: `python --version` (3.10+)
- [ ] Dependencies installed: `pip list | grep mediapipe`
- [ ] Webcam access: `python -c "import cv2; print(cv2.VideoCapture(0).isOpened())"`
- [ ] Calibration works: Run `python voiceless_mvp.py` and complete 4 intents
- [ ] Detection works: See predicted words in OpenCV window
- [ ] Web UI loads: Open `index.html` or run local server
- [ ] Demo buttons work: Click "Simulate HELP" etc.
- [ ] Console clean: No error messages in browser dev tools

---

## 📊 Performance Optimization

### For Laptops (Default)
- Resolution: 640×480 (balanced)
- Buffer size: 30 frames
- Polling: 500ms intervals
- MediaPipe confidence: 0.6

### For High-End Desktops
- Resolution: 1280×960 (higher accuracy)
- Buffer size: 45 frames
- Polling: 300ms intervals
- Use GPU if available

### For Mobile/Raspberry Pi
- Resolution: 320×240 (faster)
- Buffer size: 15 frames
- Polling: 1000ms intervals
- Reduce face detection confidence to 0.5

---

## 🔐 Security Notes

1. **Privacy**:
   - ✅ All processing is local, no data sent to cloud
   - ✅ No cloud APIs required
   - ✅ CORS headers restrict browser access

2. **Data Storage**:
   - No persistent database in MVP
   - Calibration data stored in memory only
   - Optional: Save calibrations locally with encryption

3. **API Security**:
   - Enable CORS only for your domain
   - Use HTTPS in production
   - Rate limit requests to prevent abuse

---

## 📚 Useful Commands

```bash
# Virtual environment
source venv/bin/activate          # Activate (macOS/Linux)
venv\Scripts\activate             # Activate (Windows)
deactivate                         # Deactivate

# Python
python voiceless_mvp.py            # Run backend
python -m http.server 8000         # Run web server
python -c "import mediapipe"       # Test import

# Git
git status                         # Check changes
git add .                          # Stage all
git commit -m "message"            # Commit
git push                           # Push to GitHub

# Docker
docker build -t voiceless .        # Build image
docker run voiceless              # Run container
docker ps                         # List containers
```

---

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| **"No module named 'mediapipe'"** | Run `pip install mediapipe` |
| **Camera not found** | Check permissions, try `/dev/video1` or higher |
| **Poor FPS** | Reduce resolution from 640×480 to 320×240 |
| **CORS errors** | Check `CORS(app)` in Flask, ensure right port |
| **Docker GPU errors** | Use `nvidia/cuda:11.8` base image instead |

---

## 📞 Support

- 📖 Read README.md for overview
- 🐛 Check existing GitHub issues
- 💬 Open new issue with: OS, Python version, error message
- 📧 Email for sensitive issues

---

**Happy deploying! 🚀**
