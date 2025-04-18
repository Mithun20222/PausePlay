const video = document.getElementById('videoFeed');
let sleepyFrames = 0;

Promise.all([
  faceapi.nets.tinyFaceDetector.loadFromUri(chrome.runtime.getURL('models')),
  faceapi.nets.faceExpressionNet.loadFromUri(chrome.runtime.getURL('models')),
  faceapi.nets.faceLandmark68Net.loadFromUri(chrome.runtime.getURL('models'))
]).then(startVideo);

function startVideo() {
  navigator.mediaDevices.getUserMedia({ video: true })
    .then(stream => video.srcObject = stream)
    .catch(err => console.error("Webcam access error:", err));
}

function getEAR(eye) {
  const a = faceapi.euclideanDistance(eye[1], eye[5]);
  const b = faceapi.euclideanDistance(eye[2], eye[4]);
  const c = faceapi.euclideanDistance(eye[0], eye[3]);
  return (a + b) / (2.0 * c);
}

video.addEventListener('play', () => {
  const canvas = faceapi.createCanvasFromMedia(video);
  document.getElementById('wrapper').append(canvas);
  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions();

    const resized = faceapi.resizeResults(detections, displaySize);
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    faceapi.draw.drawDetections(canvas, resized);
    faceapi.draw.drawFaceExpressions(canvas, resized);

    if (detections.length > 0) {
      const expressions = detections[0].expressions;
      const landmarks = detections[0].landmarks;

      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();
      const ear = (getEAR(leftEye) + getEAR(rightEye)) / 2;

      const timestamp = new Date().toLocaleTimeString();

      // Sleepy detection
      if (ear < 0.25) {
        sleepyFrames++;
      } else {
        sleepyFrames = 0;
      }

      if (sleepyFrames >= 10) {
        const alert = {
          emotion: "drowsiness 😴",
          timestamp: timestamp
        };
        chrome.storage.local.set({ lastEmotion: alert });
        chrome.runtime.sendMessage({ type: "ALERT", ...alert });
        sleepyFrames = 0;
      }

      // Emotion stress detection
      if (
        expressions.angry > 0.6 ||
        expressions.sad > 0.6 ||
        expressions.fearful > 0.6 ||
        expressions.disgusted > 0.6
      ) {
        const alert = {
          emotion: "stress/frustration 😠",
          timestamp: timestamp
        };
        chrome.storage.local.set({ lastEmotion: alert });
        chrome.runtime.sendMessage({ type: "ALERT", ...alert });
      }
    }
  }, 1000);
});
