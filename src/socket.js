const WebSocket = require("ws");
const { readGames, getTopMatches, normalizeSet } = require("./sorter");

const wss = new WebSocket.Server({ port: 8080 });

let games;
try {
  games = readGames("../resources/games.json");
  console.log(`Loaded ${games.length} games`);
} catch (error) {
  console.error("Failed to load games:", error.message);
  process.exit(1);
}

wss.on("connection", (ws) => {
  console.log("New client connected");
  ws.send(JSON.stringify(games));

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);

      const referencePlatforms = normalizeSet(data.platforms);
      const referenceTags = normalizeSet(data.tags);
      const referenceSet = new Set([...referencePlatforms, ...referenceTags]);

      const topMatches = getTopMatches(games, referenceSet, data.count || 10);

      ws.send(
        JSON.stringify({
          success: true,
          matches: topMatches,
        }),
      );
    } catch (error) {
      ws.send(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
      );
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });

  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("WebSocket server running on ws://localhost:8080");
