document.getElementById("startBtn").addEventListener("click", () => {
    chrome.storage.local.set({ monitoring: true }, () => {
      document.getElementById("status").textContent = "Status: Monitoring...";
    });
  });
  