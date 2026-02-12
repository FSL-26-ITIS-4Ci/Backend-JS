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
    risultati = risultati.filter((item) =>
      item.nome.toLowerCase().trim().includes(searchTerm),
    );
  }

  if (data.platforms?.length || data.tags?.length) {
    console.log("RECEIVED TAGS: " + (data.tags.length ? data.tags : "None"));
    console.log(
      "RECEIVED PLATFORMS: " +
        (data.platforms.length ? data.platforms : "None"),
    );
    const referenceSet = new Set([
      ...normalizeSet(data.platforms || []),
      ...normalizeSet(data.tags || []),
    ]);
    risultati = getTopMatches(
      risultati,
      referenceSet,
      data.count || risultati.length,
    );
  }

  ws.send(JSON.stringify({ type: data.type, value: risultati }));
}

function capitalize(str) {
  const s = String(str).toLowerCase().trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

module.exports = { loadGames, getInitialFilters, handleSearch };
