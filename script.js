let ws;
let currentCity = "";

function connectWebSocket(city) {
  ws = new WebSocket("ws://localhost:3000");

  ws.onopen = () => {
    ws.send(JSON.stringify({ city }));
  };

  ws.onmessage = (message) => {
    const data = JSON.parse(message.data);
    updateDisplay(data);
    document.getElementById("cityInput").value = data.name;
  };

  ws.onclose = () => console.log("WebSocket disconnected");
}

function subscribeCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (city) {
    currentCity = city;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ city }));
    } else {
      connectWebSocket(city);
    }
  } else {
    alert("Please enter a city name.");
  }
}

function updateDisplay(data) {
  document.getElementById("cityName").textContent = data.name;
  document.getElementById("temperature").textContent = data.main.temp;
  document.getElementById("humidity").textContent = data.main.humidity;
  document.getElementById("windSpeed").textContent = data.wind.speed;
  document.getElementById("forecast").textContent = data.weather[0].description;
}

function useGeolocation() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition((position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ lat, lon }));
      } else {
        ws = new WebSocket("ws://localhost:3000");
        ws.onopen = () => {
          ws.send(JSON.stringify({ lat, lon }));
        };
        ws.onmessage = (message) => {
          const data = JSON.parse(message.data);
          updateDisplay(data);
          document.getElementById("cityInput").value = data.name; // ✅ Set input value
        };
      }
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

function downloadReport() {
  const hours = document.getElementById("hours").value;
  window.open(`http://localhost:3000/download?hours=${hours}`, "_blank");
}
