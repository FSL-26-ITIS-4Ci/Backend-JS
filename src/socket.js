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

  const setTag = new Set();
  games.forEach((element) => {
    element.tag.forEach((tag) => {
      let tempTag = tag.toLowerCase().trim();
      tempTag = tempTag[0].toUpperCase() + tempTag.substring(1);
      setTag.add(tempTag);
    });
  });

  const arrSetTag = Array.from(setTag);
  arrSetTag.sort();

  const setPiat = new Set();
  games.forEach((element) => {
    element.piattaforme.forEach((piattaforma) => {
      let tempPiat = piattaforma.toLowerCase().trim();
      tempPiat = tempPiat[0].toUpperCase() + tempPiat.substring(1);
      setPiat.add(tempPiat);
    });
  });

  const arrSetPiat = Array.from(setPiat);
  arrSetPiat.sort();

  ws.send(
    JSON.stringify({
      type: "initialFilters",
      piattaforme: arrSetPiat,
      tags: arrSetTag,
    }),
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message);
      switch (data.type) {
        case "search":
          console.log(`RECEIVED: ${data.value}`);
          const r = data.value.toLowerCase().trim();
          const risultati = games.filter((item) => {
            return item.nome.toLowerCase().trim().includes(r);
          });

          ws.send(
            JSON.stringify({
              type: "search",
              value: risultati,
            }),
          );
          break;
        default:
          const referencePlatforms = normalizeSet(data.platforms);
          const referenceTags = normalizeSet(data.tags);
          const referenceSet = new Set([
            ...referencePlatforms,
            ...referenceTags,
          ]);

          const topMatches = getTopMatches(
            games,
            referenceSet,
            data.count || 10,
          );

          ws.send(
            JSON.stringify({
              success: true,
              matches: topMatches,
            }),
          );
      }
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
