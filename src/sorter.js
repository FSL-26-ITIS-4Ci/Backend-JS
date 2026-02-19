const fs = require("fs");
const path = require("path");

function normalizeSet(arr) {
  const normalized = Array.from(arr || [])
    .map((item) => String(item).toLowerCase().trim())
    .filter((item) => item.length > 0);
  return normalized;
}

function jaccard(setA, setB) {
  const a = setA || new Set();
  const b = setB || new Set();
  if (a.size === 0 && b.size === 0) return 0.0;
  const intersection = new Set([...a].filter((x) => b.has(x)));
  const union = new Set([...a, ...b]);

  return intersection.size / union.size;
}

function calculateSimilarity(game, referenceSet) {
  if (!game) return 0;
  const gameSet = new Set([
    ...normalizeSet(game.piattaforme || []),
    ...normalizeSet(game.tag || []),
  ]);

  if (referenceSet.size === 0) return 0;

  const intersection = new Set([...gameSet].filter((x) => referenceSet.has(x)));
  const union = new Set([...gameSet, ...referenceSet]);

  const jaccardScore = union.size === 0 ? 0 : intersection.size / union.size;
  const coverageScore = intersection.size / referenceSet.size;

  return 0.4 * jaccardScore + 0.6 * coverageScore;
}

function sortBySimilarity(games, referenceSet) {
  if (!games || games.length === 0) return games;
  const copy = [...games];

  for (const game of copy) {
    game.affinity = calculateSimilarity(game, referenceSet);
    game.common = Array.from(
      new Set(
        [...game.tag, ...game.piattaforme].filter((x) => referenceSet.has(x)),
      ),
    );
  }

  copy.sort((a, b) => b.affinity - a.affinity);

  const scores = copy.map((g) => g.affinity);
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  for (const game of copy) {
    if (max === min) {
      game.affinity = 0;
    } else {
      game.affinity = Math.round(((game.affinity - min) / (max - min)) * 100);
    }
  }

  return copy;
}

function readGames(file) {
  const data = require(file);
  return data.map((game) => ({
    ...game,
    tag: normalizeSet(game.tag),
    piattaforme: normalizeSet(game.piattaforme),
  }));
}

function getTopMatches(games, referenceSet, count = 10) {
  const sorted = sortBySimilarity(games, referenceSet);
  return sorted.slice(0, count);
}

module.exports = {
  normalizeSet,
  readGames,
  sortBySimilarity,
  getTopMatches,
  calculateSimilarity,
};
