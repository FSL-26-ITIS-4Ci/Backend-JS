const stato = document.getElementById("status");
const searchArea = document.getElementById("searchArea");
const tagSelect = document.getElementById("tagSelect");
const platformSelect = document.getElementById("platformSelect");
const ws = new WebSocket("ws://localhost:8080");
let games;

function waitForConnection() {
  return new Promise((resolve) => {
    ws.onopen = () => {
      stato.textContent = "Connected to server";
      stato.style.color = "green";
      resolve();
    };
  });
}

async function init() {
  await waitForConnection();

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === "gamesList" || data.type === "search") {
      renderGames(data.value);
    } else if (data.type === "initialFilters") {
      data.tags.forEach((tag) => {
        tagSelect.innerHTML += `<input type="checkbox" id="${tag}" name="${tag}" value="${tag}">
        <label for="${tag}">${tag}</label><br>`;
      });
      data.piattaforme.forEach((piattaforma) => {
        platformSelect.innerHTML += `<input type="checkbox" id="${piattaforma}" name="${piattaforma}" value="${piattaforma}">
        <label for="${piattaforma}">${piattaforma}</label><br>`;
      });
    }
  };
}

init();

ws.onerror = (error) => {
  stato.textContent = "Error: " + error.message;
  stato.style.color = "red";
};

ws.onclose = () => {
  stato.textContent = "Disconnected from server";
  stato.style.color = "red";
};

async function cerca() {
  ws.send(
    JSON.stringify({
      type: "search",
      value: searchArea.value,
    }),
  );
}

function createGameCard(game) {
  return `
    <div class="game-card">
      <h2>${game.nome}</h2>
      <p>${game.studio}</p>
      <div>
        ${game.tag.map((tag) => `<span>${tag}</span>`).join(", ")}
      </div>
      <p>Price: €${game.prezzo}</p>
      <p>Platforms: ${game.piattaforme.join(", ")}</p>
      <p>PEGI: ${game.pegi}</p>
      <p>Cross-Play: ${game.crossPlay ? "Yes" : "No"}</p>
    </div>
  `;
}

function renderGames(gamesList) {
  const gamesGrid = document.getElementById("gamesGrid");
  gamesGrid.innerHTML = gamesList.map((game) => createGameCard(game)).join("");
}
