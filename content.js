let startTime = Date.now();
let videoElement = null;
let emotionDetectionInterval = null;
let isModelLoaded = false;
let sleepyFrameCount = 0;
const EAR_THRESHOLD = 0.22;
const EAR_CONSEC_FRAMES = 5;
const EXERCISE_INTERVAL = 60000; // 1 minute in milliseconds
let exerciseInterval = null;

// Function to create and show exercise popup
function showExercisePopup() {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 0 20px rgba(0,0,0,0.2);
    z-index: 10001;
    text-align: center;
  `;

  const exerciseContainer = document.createElement('div');
  exerciseContainer.style.cssText = `
    width: 400px;
    height: 300px;
    margin-bottom: 20px;
    background: #f5f5f5;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  // Placeholder for exercise image/video
  const exerciseContent = document.createElement('div');
  exerciseContent.innerHTML = `
    <img src="${chrome.runtime.getURL('assets/exercises/breathing.gif')}" 
         alt="Breathing Exercise" 
         style="max-width: 100%; max-height: 100%;">
  `;

  const closeButton = document.createElement('button');
  closeButton.textContent = 'Close';
  closeButton.style.cssText = `
    padding: 10px 20px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
  `;

  closeButton.onclick = () => popup.remove();

  exerciseContainer.appendChild(exerciseContent);
  popup.appendChild(exerciseContainer);
  popup.appendChild(closeButton);
  document.body.appendChild(popup);
}

// Function to start exercise reminders
function startExerciseReminders() {
  if (exerciseInterval) {
    clearInterval(exerciseInterval);
  }
  
  exerciseInterval = setInterval(() => {
    showExercisePopup();
  }, EXERCISE_INTERVAL);
}

// Function to stop exercise reminders
function stopExerciseReminders() {
  if (exerciseInterval) {
    clearInterval(exerciseInterval);
    exerciseInterval = null;
  }
}

// Load face-api models
async function loadModels() {
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(chrome.runtime.getURL('models')),
      faceapi.nets.faceLandmark68Net.loadFromUri(chrome.runtime.getURL('models')),
      faceapi.nets.faceExpressionNet.loadFromUri(chrome.runtime.getURL('models'))
    ]);
    isModelLoaded = true;
    console.log('Face detection models loaded');
  } catch (error) {
    console.error('Error loading face detection models:', error);
  }
}

// Load models when content script starts
loadModels();

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "startMonitoring") {
    addCameraAndDetect();
  } else if (message.action === "stopMonitoring") {
    stopMonitoring();
  }
});

// Check initial monitoring state
chrome.storage.local.get("monitoring", (res) => {
  if (res.monitoring) {
    addCameraAndDetect();
  }
});

function addCameraAndDetect() {
  if (videoElement) return; // Already monitoring

  videoElement = document.createElement("video");
  videoElement.autoplay = true;
  videoElement.style.position = "fixed";
  videoElement.style.bottom = "20px";
  videoElement.style.right = "20px";
  videoElement.style.width = "200px";
  videoElement.style.height = "150px";
  videoElement.style.borderRadius = "10px";
  videoElement.style.border = "2px solid #28a745";
  videoElement.style.zIndex = "10000";
  videoElement.style.backgroundColor = "#000";
  document.body.appendChild(videoElement);

  navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 200 }, height: { ideal: 150 } } })
    .then((stream) => {
      videoElement.srcObject = stream;
      startEmotionDetection();
      startExerciseReminders(); // Start exercise reminders
    })
    .catch((err) => {
      console.error("Error accessing camera:", err);
      if (videoElement) {
        videoElement.remove();
        videoElement = null;
      }
    });
}

function stopMonitoring() {
  if (videoElement) {
    const stream = videoElement.srcObject;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    videoElement.remove();
    videoElement = null;
  }
  if (emotionDetectionInterval) {
    clearInterval(emotionDetectionInterval);
    emotionDetectionInterval = null;
  }
  stopExerciseReminders(); // Stop exercise reminders
}

function calculateEAR(eye) {
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const A = dist(eye[1], eye[5]);
  const B = dist(eye[2], eye[4]);
  const C = dist(eye[0], eye[3]);
  return (A + B) / (2.0 * C);
}

async function detectEmotion() {
  if (!isModelLoaded || !videoElement) return "neutral";

  try {
    const detections = await faceapi
      .detectAllFaces(videoElement, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    if (detections.length === 0) return "neutral";

    const face = detections[0];
    const expressions = face.expressions;
    const landmarks = face.landmarks;

    const leftEye = landmarks.getLeftEye();
    const rightEye = landmarks.getRightEye();
    const leftEAR = calculateEAR(leftEye);
    const rightEAR = calculateEAR(rightEye);
    const avgEAR = (leftEAR + rightEAR) / 2.0;

    if (avgEAR < EAR_THRESHOLD) {
      sleepyFrameCount++;
    } else {
      sleepyFrameCount = 0;
    }

    if (sleepyFrameCount >= EAR_CONSEC_FRAMES) {
      return "sleepy";
    }

    let maxEmotion = "neutral";
    let maxProbability = 0;
    for (const [emotion, probability] of Object.entries(expressions)) {
      if (probability > maxProbability) {
        maxProbability = probability;
        maxEmotion = emotion;
      }
    }

    const emotionMap = {
      neutral: "neutral",
      happy: "happy",
      sad: "tired",
      angry: "angry",
      disgusted: "tired",
      fearful: "tired",
      surprised: "neutral"
    };

    return emotionMap[maxEmotion] || "neutral";
  } catch (error) {
    console.error("Emotion detection error:", error);
    return "neutral";
  }
}

function startEmotionDetection() {
  if (emotionDetectionInterval) {
    clearInterval(emotionDetectionInterval);
  }

  emotionDetectionInterval = setInterval(async () => {
    const emotion = await detectEmotion();
    console.log("Detected emotion:", emotion);

    if (["angry", "tired", "sleepy", "happy"].includes(emotion)) {
      chrome.runtime.sendMessage({ type: "ALERT", emotion });
    }
  }, 5000);
}
