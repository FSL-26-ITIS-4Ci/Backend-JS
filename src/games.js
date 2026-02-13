const { readGames, getTopMatches, normalizeSet } = require("./sorter");

function loadGames(path) {
  const games = readGames(path);
  console.log(`Loaded ${games.length} games`);
  return games;
}

function getInitialFilters(games) {
  const setTag = new Set();
  const setPiat = new Set();
  games.forEach((element) => {
    element.tag.forEach((tag) => setTag.add(capitalize(tag)));
    element.piattaforme.forEach((p) => setPiat.add(capitalize(p)));
  });
  return {
    tags: Array.from(setTag).sort(),
    piattaforme: Array.from(setPiat).sort(),
  };
}

function handleSearch(ws, games, data) {
  let risultati = games;
  const searchTerm = (data.value || data.searchTerm || "").toLowerCase().trim();

  if (searchTerm) {
    risultati = risultati.filter(
      (item) =>
        item.nome.toLowerCase().trim().includes(searchTerm) ||
        item.desc.toLowerCase().includes(searchTerm),
    );
  }

  if (data.platforms !== undefined || data.tags !== undefined) {
    const platforms = data.platforms || [];
    const tags = data.tags || [];
    console.log("RECEIVED TAGS: " + (tags.length ? tags : "None"));
    console.log(
      "RECEIVED PLATFORMS: " + (platforms.length ? platforms : "None"),
    );

    if (platforms.length > 0 || tags.length > 0) {
      const referenceSet = new Set([
        ...normalizeSet(platforms),
        ...normalizeSet(tags),
      ]);
      risultati = getTopMatches(
        risultati,
        referenceSet,
        data.count || risultati.length,
      );
    } else {
      risultati = risultati.map((game) => {
        const { common, ...gameWithoutCommon } = game;
        return gameWithoutCommon;
      });
    }
  }

  if (data.crossPlay === "si") {
    risultati = risultati.filter((item) => {
      return item.crossPlay;
    });
  } else if (data.crossPlay === "no") {
    risultati = risultati.filter((item) => {
      return !item.crossPlay;
    });
  }

  ws.send(JSON.stringify({ type: data.type, value: risultati }));
}

function capitalize(str) {
  const s = String(str).toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = {
  loadGames,
  getInitialFilters,
  handleSearch,
};
