// ============================================================
// VØICELESS Demo Controller
// Simulates backend responses and manages UI updates
// ============================================================

const CONFIG = {
  API_URL: 'http://127.0.0.1:5000/api/prediction', // Flask backend URL
  POLL_INTERVAL: 500, // ms
  USE_MOCK: true     // Set to false if you have Flask backend running
};

// ============================================================
// STATE MANAGEMENT
// ============================================================
const state = {
  currentWord: 'WAITING',
  confidence: 0,
  features: {
    mean: 0,
    energy: 0,
    peak: 0
  },
  backendConnected: false
};

// ============================================================
// DOM ELEMENTS
// ============================================================
const elements = {
  wordDisplay: document.getElementById('current-word'),
  confidenceFill: document.getElementById('confidence-fill'),
  confidencePercent: document.getElementById('confidence-percent'),
  confidenceValue: document.getElementById('confidence-value'),
  featureMean: document.getElementById('feature-mean'),
  featureEnergy: document.getElementById('feature-energy'),
  featurePeak: document.getElementById('feature-peak'),
  upperLip: document.getElementById('upper-lip'),
  lowerLip: document.getElementById('lower-lip'),
  distanceLine: document.getElementById('distance-line'),
  mouthShape: document.getElementById('mouth-shape')
};

// ============================================================
// MOCK DATA GENERATOR (for demo without backend)
// ============================================================
function generateMockData(word) {
  const baseData = {
    'HELP': { mean: 35.2, energy: 8.5, peak: 4.2, conf: 0.92 },
    'STOP': { mean: 22.1, energy: 5.3, peak: 2.8, conf: 0.88 },
    'YES':  { mean: 18.5, energy: 4.1, peak: 2.1, conf: 0.85 },
    'NO':   { mean: 20.3, energy: 4.8, peak: 2.4, conf: 0.79 }
  };

  const data = baseData[word] || { mean: 0, energy: 0, peak: 0, conf: 0 };
  
  // Add slight randomness for realism
  return {
    word: word,
    confidence: data.conf + (Math.random() - 0.5) * 0.05,
    features: {
      mean: data.mean + (Math.random() - 0.5) * 2,
      energy: data.energy + (Math.random() - 0.5) * 1,
      peak: data.peak + (Math.random() - 0.5) * 0.5
    }
  };
}

// ============================================================
// FETCH DATA FROM BACKEND (or mock)
// ============================================================
async function fetchPrediction() {
  try {
    if (CONFIG.USE_MOCK) {
      // Generate random prediction from calibrated words
      const words = ['HELP', 'STOP', 'YES', 'NO', 'WAITING'];
      const randomWord = words[Math.floor(Math.random() * words.length)];
      return generateMockData(randomWord);
    }

    // Real backend call
    const response = await fetch(CONFIG.API_URL, {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error('Backend unavailable');
    return await response.json();
  } catch (error) {
    console.warn('Backend fetch failed, using mock data:', error);
    CONFIG.USE_MOCK = true;
    return generateMockData('WAITING');
  }
}

// ============================================================
// UPDATE UI
// ============================================================
function updateUI(data) {
  // Clamp confidence [0, 1]
  const conf = Math.max(0, Math.min(1, data.confidence || 0));
  
  // Update state
  state.currentWord = data.word || 'WAITING';
  state.confidence = conf;
  state.features = data.features || { mean: 0, energy: 0, peak: 0 };

  // Update word display
  elements.wordDisplay.textContent = state.currentWord;
  
  // Update confidence bar
  const confPercent = Math.round(conf * 100);
  elements.confidenceFill.style.width = confPercent + '%';
  elements.confidencePercent.textContent = confPercent + '%';
  elements.confidenceValue.textContent = `(${conf.toFixed(2)})`;

  // Update features
  elements.featureMean.textContent = state.features.mean.toFixed(1);
  elements.featureEnergy.textContent = state.features.energy.toFixed(1);
  elements.featurePeak.textContent = state.features.peak.toFixed(1);

  // Animate lip visualization
  animateLips(conf);

  // Change word display color based on confidence
  updateWordDisplayColor(conf);
}

// ============================================================
// ANIMATE LIP VISUALIZATION
// ============================================================
function animateLips(confidence) {
  const baseOpenness = 40;
  const maxOpenness = 80;
  const currentOpenness = baseOpenness + (confidence * (maxOpenness - baseOpenness));

  // Move upper lip up
  const upperY = 60 - (currentOpenness / 2);
  elements.upperLip.setAttribute('cy', upperY);

  // Move lower lip down
  const lowerY = 60 + (currentOpenness / 2);
  elements.lowerLip.setAttribute('cy', lowerY);

  // Update distance line
  elements.distanceLine.setAttribute('y1', upperY);
  elements.distanceLine.setAttribute('y2', lowerY);
  
  if (confidence > 0.3) {
    elements.distanceLine.style.opacity = '1';
  } else {
    elements.distanceLine.style.opacity = '0';
  }

  // Scale mouth shape
  const ry = 30 * (0.7 + confidence * 0.3);
  elements.mouthShape.setAttribute('ry', ry);
}

// ============================================================
// CHANGE WORD DISPLAY COLOR BASED ON CONFIDENCE
// ============================================================
function updateWordDisplayColor(confidence) {
  let color1 = '#06b6d4'; // Cyan
  let color2 = '#22c55e'; // Green
  
  if (confidence < 0.3) {
    color1 = '#ef4444'; // Red for low confidence
    color2 = '#f59e0b'; // Amber
  }

  elements.wordDisplay.style.background = 
    `linear-gradient(135deg, ${color1}, ${color2})`;
}

// ============================================================
// PUBLIC DEMO SIMULATION (called from HTML buttons)
// ============================================================
window.simulateDetection = function(word, customConfidence) {
  const data = generateMockData(word);
  if (customConfidence !== undefined) {
    data.confidence = customConfidence;
  }
  updateUI(data);
};

window.resetDemo = function() {
  updateUI({
    word: 'WAITING',
    confidence: 0,
    features: { mean: 0, energy: 0, peak: 0 }
  });
};

// ============================================================
// POLLING LOOP
// ============================================================
let pollInterval;

function startPolling() {
  pollInterval = setInterval(async () => {
    const data = await fetchPrediction();
    updateUI(data);
  }, CONFIG.POLL_INTERVAL);
}

function stopPolling() {
  clearInterval(pollInterval);
}

// ============================================================
// INITIALIZATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('VØICELESS Demo Initialized');
  console.log('Backend URL:', CONFIG.API_URL);
  console.log('Using mock data:', CONFIG.USE_MOCK);
  
  // Start with initial state
  updateUI({
    word: 'WAITING',
    confidence: 0,
    features: { mean: 0, energy: 0, peak: 0 }
  });

  // Start polling
  startPolling();
});

// Cleanup on page unload
window.addEventListener('beforeunload', stopPolling);
