let monitoring = false;
let timerInterval;
let seconds = 0;

document.getElementById("toggleBtn").addEventListener("click", () => {
  monitoring = !monitoring;

  if (monitoring) {
    chrome.runtime.sendMessage({ command: "startMonitoring" });
    document.getElementById("toggleBtn").textContent = "Stop Monitoring";
    document.getElementById("status").textContent = "Status: Monitoring...";

    timerInterval = setInterval(() => {
      seconds++;
      document.getElementById("timer").textContent = `Time Tracked: ${seconds}s`;
      updateChart(seconds);
    }, 1000);
  } else {
    chrome.runtime.sendMessage({ command: "stopMonitoring" });
    document.getElementById("toggleBtn").textContent = "Start Monitoring";
    document.getElementById("status").textContent = "Status: Paused";
    clearInterval(timerInterval);
  }
});
// Create the chart when popup opens
let ctx = document.getElementById('usageChart').getContext('2d');
let chart = new Chart(ctx, {
  type: 'bar',
  data: {
    labels: ['Tracked'],
    datasets: [{
      label: 'Seconds',
      data: [0],
      backgroundColor: '#00ffc8',
      borderRadius: 5
    }]
  },
  options: {
    responsive: false,
    animation: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
          color: '#333'
        },
        grid: {
          color: '#ccc'
        }
      },
      x: {
        ticks: {
          color: '#333'
        },
        grid: {
          display: false
        }
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  }
});

// Function to update chart value
function updateChart(seconds) {
  chart.data.datasets[0].data[0] = seconds;
  chart.update();
}
