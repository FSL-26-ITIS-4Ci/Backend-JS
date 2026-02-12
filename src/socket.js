const WebSocket = require("ws");
const { readGames, getTopMatches, normalizeSet } = require("./sorter");

const wss = new WebSocket.Server({
  port: 8080,
  verifyClient: (info) => {
    const origin = info.origin;
    const allowedOrigins = [
      "http://localhost:5500",
      "http://127.0.0.1:5500",
      "https://backend-js-o2lj.onrender.com",
    ];

    if (!origin) return true;

    return allowedOrigins.some((allowed) =>
      allowed instanceof RegExp ? allowed.test(origin) : allowed === origin,
    );
  },
});

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
  try {
    console.log("LOG: Sending the client the games list");
    ws.send(
      JSON.stringify({
        type: "gamesList",
        value: games,
      }),
    );
  } catch (error) {
    console.error("Failed to send games:", error.message);
  }

  const setTag = new Set();
  games.forEach((element) => {
    element.tag.forEach((tag) => {
      setTag.add(capitalize(tag));
    });
  });

  const arrSetTag = Array.from(setTag);
  arrSetTag.sort();

  const setPiat = new Set();
  games.forEach((element) => {
    element.piattaforme.forEach((piattaforma) => {
      setPiat.add(capitalize(piattaforma));
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
          console.log(`RECEIVED: ${data.value || "filter update"}`);

          let risultati = games;

          const searchTerm = (data.value || data.searchTerm || "")
            .toLowerCase()
            .trim();
          if (searchTerm) {
            risultati = risultati.filter((item) => {
              return item.nome.toLowerCase().trim().includes(searchTerm);
            });
          }

          if (data.platforms?.length || data.tags?.length) {
            console.log(
              "RECEIVED TAGS: " + (data.tags.length ? data.tags : "None"),
            );
            console.log(
              "RECEIVED PLATFORMS: " +
                (data.platforms.length ? data.platforms : "None"),
            );
            const referencePlatforms = normalizeSet(data.platforms || []);
            const referenceTags = normalizeSet(data.tags || []);
            const referenceSet = new Set([
              ...referencePlatforms,
              ...referenceTags,
            ]);
            risultati = getTopMatches(
              risultati,
              referenceSet,
              data.count || risultati.length,
            );
          }

          ws.send(
            JSON.stringify({
              type: data.type,
              value: risultati,
            }),
          );
          break;

        default:
          console.log("ERROR: Invalid request");
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

function capitalize(str) {
  const s = String(str).toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

console.log("WebSocket server running on ws://localhost:8080");
