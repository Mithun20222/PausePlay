let startTime = Date.now();

chrome.storage.local.get("monitoring", (res) => {
  if (res.monitoring) {
    startMonitoring();
  }
});

function startMonitoring() {
  const video = document.createElement("video");
  video.autoplay = true;
  video.style.position = "fixed";
  video.style.bottom = "10px";
  video.style.right = "10px";
  video.style.width = "120px";
  video.style.zIndex = "9999";
  document.body.appendChild(video);

  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
    });

  setInterval(() => {
    const emotion = mockDetectEmotion(); // placeholder
    console.log("Detected Emotion:", emotion);

    const minutesPassed = Math.floor((Date.now() - startTime) / 60000);
    if ((emotion === "angry" || emotion === "tired") && minutesPassed >= 30) {
      chrome.runtime.sendMessage({ type: "ALERT" });
    }
  }, 60000);
}

function mockDetectEmotion() {
  const emotions = ["neutral", "happy", "tired", "angry"];
  return emotions[Math.floor(Math.random() * emotions.length)];
}
