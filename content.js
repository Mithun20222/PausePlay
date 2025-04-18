let startTime = Date.now();

chrome.storage.local.get("monitoring", (res) => {
  if (res.monitoring) {
    addCameraAndDetect();
  }
});

function addCameraAndDetect() {
  const video = document.createElement("video");
  video.autoplay = true;
  video.style.position = "fixed";
  video.style.bottom = "10px";
  video.style.right = "10px";
  video.style.width = "100px";
  video.style.zIndex = "10000";
  document.body.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    });

  // Mock emotion detection every 1 min
  setInterval(() => {
    const emotion = detectEmotion(); // Simulate it
    console.log("Emotion:", emotion);

    const elapsedMins = Math.floor((Date.now() - startTime) / 60000);
    if ((emotion === "angry" || emotion === "tired") && elapsedMins > 30) {
      chrome.runtime.sendMessage({ type: "ALERT" });
    }
  }, 60000);
}

function detectEmotion() {
  // TODO: Integrate TensorFlow.js or MediaPipe
  const emotions = ["neutral", "happy", "tired", "angry"];
  return emotions[Math.floor(Math.random() * emotions.length)];
}
