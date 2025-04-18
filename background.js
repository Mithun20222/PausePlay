let activeTime = 0;
let interval = null;

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.command === "startMonitoring") {
    if (!interval) {
      interval = setInterval(() => {
        activeTime++;
        if (activeTime % 300 === 0) {
          chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: "PausePlay Alert",
            message: "You've been active for 5 minutes. Take a break!",
          });
        }
      }, 1000);
    }
  }

  if (request.command === "stopMonitoring") {
    clearInterval(interval);
    interval = null;
  }
});
