// background.js

// Request notification permission when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.notifications.getPermissionLevel((level) => {
    if (level !== 'granted') {
      chrome.notifications.requestPermission();
    }
  });
});

let activeTime = 0;
let interval = null;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Handle emotion alerts
  if (msg.type === "ALERT") {
    let emotionMessage = "";

    switch (msg.emotion) {
      case "tired":
        emotionMessage = "You look tired. Time for a break?";
        break;
      case "stressed":
        emotionMessage = "You seem stressed. Maybe take a moment to relax?";
        break;
      case "angry":
        emotionMessage = "Feeling frustrated? Step away for a few minutes.";
        break;
      case "sleepy":
        emotionMessage = "You're looking sleepy 😴 — quick power nap?";
        break;
      default:
        emotionMessage = "You might need a quick breather!";
    }

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icon.png",
      title: "PausePlay Alert ⚠",
      message: emotionMessage,
      priority: 2,
      requireInteraction: true
    });
  }

  // Handle monitoring commands
  if (msg.command === "startMonitoring") {
    if (!interval) {
      interval = setInterval(() => {
        activeTime++;
        chrome.storage.local.set({ activeTime });
      }, 1000);
    }
  }

  if (msg.command === "stopMonitoring") {
    clearInterval(interval);
    interval = null;
    chrome.storage.local.set({ activeTime });
  }

  if (msg.command === "getTime") {
    chrome.storage.local.get("activeTime", (data) => {
      sendResponse({ time: data.activeTime || 0 });
    });
    return true; // needed for async response
  }
});
