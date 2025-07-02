require("dotenv").config();
const API_KEY = process.env.API_KEY;

const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const axios = require("axios");
const cors = require("cors");
const fs = require("fs");
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());

// const API_KEY = "YOUR_OPENWEATHERMAP_API_KEY"; // Replace with your own API key
const PORT = 3000;
let clients = new Map();
let weatherHistory = [];

async function fetchWeather(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
  const response = await axios.get(url);
  return response.data;
}

async function fetchWeatherByCoords(lat, lon) {
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  const response = await axios.get(url);
  return response.data;
}

function broadcastWeather() {
  for (const [ws, subscription] of clients.entries()) {
    const { city, lat, lon } = subscription;
    const fetcher = city ? fetchWeather(city) : fetchWeatherByCoords(lat, lon);

    fetcher
      .then((data) => {
        ws.send(JSON.stringify(data));
        weatherHistory.push({ timestamp: Date.now(), city: data.name, data });
      })
      .catch((err) => console.error("Error fetching weather:", err.message));
  }
}

wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    try {
      const parsed = JSON.parse(message);
      if (parsed.city || (parsed.lat && parsed.lon)) {
        clients.set(ws, parsed);
        console.log("Client subscribed to:", parsed);
      }
    } catch (err) {
      console.error("Invalid message format:", message);
    }
  });

  ws.on("close", () => {
    clients.delete(ws);
  });
});

setInterval(broadcastWeather, 10000);

app.get("/download", (req, res) => {
  const hours = parseInt(req.query.hours || "1");
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  const filteredData = weatherHistory.filter(
    (entry) => entry.timestamp >= cutoff
  );

  const jsonContent = JSON.stringify(filteredData, null, 2);
  const fileName = `weather_report_last_${hours}_hours.json`;

  fs.writeFileSync(fileName, jsonContent);
  res.download(fileName, () => fs.unlinkSync(fileName));
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
