chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "ALERT") {
      chrome.notifications.create({
        type: "basic",
        iconUrl: "icon.png",
        title: "PausePlay Alert ⚠️",
        message: "You look tired and stressed. Time for a break?",
      });
    }
  });
  let activeTime = 0;
  let interval = null;
  
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.command === "startMonitoring") {
      if (!interval) {
        interval = setInterval(() => {
          activeTime++;
          
          // Store in chrome storage
          chrome.storage.local.set({ activeTime });
  
          // Optional: Notify every 5 minutes
          if (activeTime % 300 === 0) {
            chrome.notifications.create({
              type: "basic",
              iconUrl: "icon.png",
              title: "PausePlay Reminder",
              message: "You've been active for 5 minutes. Take a short break!",
            });
          }
        }, 1000);
      }
    }
  
    if (request.command === "stopMonitoring") {
      clearInterval(interval);
      interval = null;
      // Final save
      chrome.storage.local.set({ activeTime });
    }
  
    if (request.command === "getTime") {
      chrome.storage.local.get("activeTime", (data) => {
        sendResponse({ time: data.activeTime || 0 });
      });
      return true; // needed for async response
    }
  });
  