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
  