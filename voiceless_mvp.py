import cv2
import mediapipe as mp
import numpy as np
from collections import deque
import time

# =========================
# MediaPipe Setup
# =========================
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(
    max_num_faces=1,
    refine_landmarks=True,
    min_detection_confidence=0.6,
    min_tracking_confidence=0.6
)

# Lip landmarks
UPPER_LIP = 13
LOWER_LIP = 14

# =========================
# Helper Functions
# =========================
def openness(face, shape):
    """Calculates the distance between upper and lower lip."""
    h, w, _ = shape
    u = face.landmark[UPPER_LIP]
    l = face.landmark[LOWER_LIP]
    
    # Euclidean distance between lip points
    return np.linalg.norm(
        np.array([u.x * w, u.y * h]) - np.array([l.x * w, l.y * h])
    )

def extract_signature(buffer):
    """
    Extracts statistical features from the lip movement buffer.
    Returns zero-values if buffer is empty to avoid crashes.
    """
    arr = np.array(buffer)
    
    # Safety check: if array is empty or too short, return zeros
    if len(arr) < 2:
        return {"mean": 0, "max": 0, "energy": 0, "peak": 0}
    
    diffs = np.abs(np.diff(arr))
    
    return {
        "mean": np.mean(arr),
        "max": np.max(arr),
        "energy": np.sum(diffs),
        "peak": np.max(diffs) if len(diffs) > 0 else 0
    }

# =========================
# Webcam Setup
# =========================
cap = cv2.VideoCapture(0)
cap.set(3, 640)
cap.set(4, 480)

# =========================
# Calibration Phase
# =========================
CAL_WORDS = ["HELP", "STOP", "YES", "NO"]
cal_data = {}
buffer = deque(maxlen=30)

print("Calibration starting... Check the camera window.")

for word in CAL_WORDS:
    # Small pause before starting next word so user can prepare
    print(f"Prepare for: {word}")
    time.sleep(1.0)
    print(f"Calibrate: {word}")
    start = time.time()
    buffer.clear()
    
    # Record for 2.5 seconds per word
    while time.time() - start < 2.5:
        ret, frame = cap.read()
        if not ret:
            break
        
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        res = face_mesh.process(rgb)
        
        if res.multi_face_landmarks:
            face = res.multi_face_landmarks[0]
            buffer.append(openness(face, frame.shape))
        else:
            # If face lost, visual feedback
            cv2.putText(frame, "NO FACE DETECTED", (50, 100),
                       cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0,0,255), 2)
        
        cv2.putText(frame, f"SAY: {word}",
                   (50, 50), cv2.FONT_HERSHEY_SIMPLEX,
                   1.2, (0, 255, 255), 3)
        
        cv2.imshow("Calibration", frame)
        
        if cv2.waitKey(1) & 0xFF == ord('q'):
            exit()
    
    # Save the signature for this word
    cal_data[word] = extract_signature(buffer)

cv2.destroyWindow("Calibration")
print("Calibration done! Starting detection...")

# =========================
# Runtime Detection Logic
# =========================
runtime_buffer = deque(maxlen=30)

def classify(sig, cal):
    best_word = "..."
    best_score = float("inf")
    
    # Simple distance comparison
    for w, ref in cal.items():
        score = (
            abs(sig["mean"] - ref["mean"]) +
            abs(sig["energy"] - ref["energy"]) +
            abs(sig["peak"] - ref["peak"])
        )
        
        if score < best_score:
            best_score = score
            best_word = w
    
    # Optional: Add a threshold so it doesn't guess random noise
    # if best_score > 50: return "..."
    
    return best_word

# =========================
# Main Loop
# =========================
while True:
    ret, frame = cap.read()
    if not ret:
        break
    
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    res = face_mesh.process(rgb)
    
    word = "..."
    
    if res.multi_face_landmarks:
        face = res.multi_face_landmarks[0]
        
        # Draw lips for visual feedback
        u = face.landmark[UPPER_LIP]
        l = face.landmark[LOWER_LIP]
        h, w, _ = frame.shape
        
        cv2.circle(frame, (int(u.x*w), int(u.y*h)), 2, (0,255,0), -1)
        cv2.circle(frame, (int(l.x*w), int(l.y*h)), 2, (0,255,0), -1)
        
        runtime_buffer.append(openness(face, frame.shape))
        
        # Only classify if buffer is full (stable data)
        if len(runtime_buffer) == runtime_buffer.maxlen:
            sig = extract_signature(runtime_buffer)
            word = classify(sig, cal_data)
    
    # UI Drawing
    cv2.rectangle(frame, (0, 380), (640, 480), (30, 30, 30), -1)
    cv2.putText(frame, f"WORD: {word}",
               (50, 440), cv2.FONT_HERSHEY_DUPLEX,
               2.0, (0, 255, 0), 4)
    
    cv2.imshow("VOICELESS Run", frame)
    
    # Press 'q' to quit
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
