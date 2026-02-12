const WebSocket = require("ws");
const { handleLogin, handleLogout, handleProtectedAction } = require("./auth");
const { loadGames, getInitialFilters, handleSearch } = require("./games");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
  port: PORT,
  verifyClient: (info) => {
    const origin = info.origin;
    const allowedOrigins = [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://frontend-ljor.onrender.com",
    ];

    if (!origin) return true;
    return allowedOrigins.some((allowed) =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin,
    );
  },
});
let games;
try {
  games = loadGames("../resources/games.json");
} catch (error) {
  console.error("Failed to load games:", error.message);
  process.exit(1);
}

wss.on("connection", (ws) => {
  console.log("New client connected");

  try {
    ws.send(JSON.stringify({ type: "gamesList", value: games }));
    const { tags, piattaforme } = getInitialFilters(games);
    ws.send(JSON.stringify({ type: "initialFilters", piattaforme, tags }));
  } catch (error) {
    console.error("Failed to send initial data:", error.message);
  }

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case "search":
          console.log(`RECEIVED: ${data.value || "filter update"}`);
          handleSearch(ws, games, data);
          break;
        case "login":
          await handleLogin(ws, data);
          break;
        case "logout":
          handleLogout(ws, data);
          break;
        case "protected_action":
          handleProtectedAction(ws, data);
          break;
        default:
          console.log("ERROR: Invalid request");
      }
    } catch (error) {
      ws.send(JSON.stringify({ success: false, error: error.message }));
    }
  });

  ws.on("close", () => console.log("Client disconnected"));
  ws.on("error", (error) => console.error("WebSocket error:", error));
});

console.log(`WebSocket server running on ws://localhost:${PORT}`);
