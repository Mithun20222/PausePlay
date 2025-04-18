document.getElementById("startBtn").addEventListener("click", () => {
    chrome.storage.local.set({ monitoring: true }, () => {
      document.getElementById("status").textContent = "Status: Monitoring...";
    });
  });
// When popup opens, fetch previous time
chrome.runtime.sendMessage({ command: "getTime" }, (response) => {
  seconds = response.time || 0;
  document.getElementById("timer").textContent = `Time Tracked: ${seconds}s`;
  updateChart(seconds);
});
