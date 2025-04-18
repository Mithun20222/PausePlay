document.addEventListener('DOMContentLoaded', function () {
  const startBtn = document.getElementById('startBtn');
  const statusText = document.getElementById('status');
  const timerDisplay = document.getElementById('timer');
  const currentEmotionDisplay = document.getElementById('currentEmotion');
  const lastAlertDisplay = document.getElementById('lastAlert');

  let isMonitoring = false;
  let startTime;
  let elapsedTime = 0;
  let timerInterval;

  const retroSound = new Audio(chrome.runtime.getURL("blip.mp3")); // Optional retro sound

  // Restore previous state and show last known emotion
  chrome.storage.local.get(['startTime', 'monitoring', 'lastEmotion'], function (result) {
    if (result.startTime && result.monitoring) {
      startTime = result.startTime;
      isMonitoring = true;
      activateMonitoringUI();
      timerInterval = setInterval(updateTimer, 1000);
    }

    if (result.lastEmotion) {
      currentEmotionDisplay.textContent = result.lastEmotion.emotion;
      lastAlertDisplay.textContent = result.lastEmotion.timestamp;
    }
  });

  // Receive live alerts while popup is open
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === "ALERT") {
      currentEmotionDisplay.textContent = message.emotion;
      lastAlertDisplay.textContent = new Date().toLocaleTimeString();
      animateAlert();
    }
  });

  // Start/Stop monitoring
  startBtn.addEventListener('click', function () {
    isMonitoring = !isMonitoring;

    if (retroSound) retroSound.play();

    if (isMonitoring) {
      startTime = Date.now();
      chrome.storage.local.set({
        startTime,
        monitoring: true
      }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "startMonitoring" });
          }
        });
      });

      activateMonitoringUI();
      timerInterval = setInterval(updateTimer, 1000);
    } else {
      chrome.storage.local.set({ monitoring: false }, () => {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          if (tabs.length > 0) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "stopMonitoring" });
          }
        });
      });
      chrome.storage.local.remove(['startTime']);

      clearInterval(timerInterval);
      resetMonitoringUI();
    }
  });

  function activateMonitoringUI() {
    startBtn.textContent = 'Stop Monitoring';
    startBtn.style.backgroundColor = '#dc3545';
    statusText.textContent = 'Status: Monitoring...';
  }

  function resetMonitoringUI() {
    startBtn.textContent = 'Start Monitoring';
    startBtn.style.backgroundColor = '#28a745';
    statusText.textContent = 'Status: Idle';
    currentEmotionDisplay.textContent = '-';
    lastAlertDisplay.textContent = 'None';
    elapsedTime = 0;
    timerDisplay.textContent = formatTime(elapsedTime);
  }

  function updateTimer() {
    elapsedTime = Math.floor((Date.now() - startTime) / 1000);
    timerDisplay.textContent = formatTime(elapsedTime);
  }

  function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    } else {
      return `${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }
  }

  function padZero(num) {
    return num < 10 ? `0${num}` : num;
  }

  function animateAlert() {
    currentEmotionDisplay.classList.add('flash');
    setTimeout(() => currentEmotionDisplay.classList.remove('flash'), 800);
  }
});
