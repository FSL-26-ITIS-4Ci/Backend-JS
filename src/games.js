const { readGames, getTopMatches, normalizeSet } = require("./sorter");

function loadGames(path) {
  const games = readGames(path);
  games.sort((a, b) =>
    a.nome.localeCompare(b.nome, undefined, { sensitivity: "base" }),
  );
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
    const searchTerms = searchTerm.split(" ");

    risultati = risultati.filter((item) => {
      const itemText = `${item.nome} ${item.desc}`.toLowerCase();
      return searchTerms.some((term) => itemText.includes(term));
    });
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
        const { common, affinity, ...cleanGame } = game;
        return cleanGame;
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
  if (data.pegi && data.pegi != "null") {
    risultati = risultati.filter((item) => {
      return item.pegi === data.pegi;
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
