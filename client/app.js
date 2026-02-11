const status = document.getElementById("status");
const searchArea = document.getElementById("searchArea");
const field = document.getElementById("result");
const tagSelect = document.getElementById("tagSelect");
const platformSelect = document.getElementById("platformSelect");
const ws = new WebSocket("ws://localhost:8080");
let games;

function waitForConnection() {
  return new Promise((resolve) => {
    ws.onopen = () => {
      status.textContent = "Connected to server";
      status.style.color = "green";
      resolve();
    };
  });
}

function waitForGames() {
  return new Promise((resolve) => {
    ws.onmessage = (event) => {
      games = JSON.parse(event.data);
      resolve(games);
    };
  });
}

async function init() {
  await waitForConnection();
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type != "initialFilters") return;
    data.tags.forEach((tag) => {
      tagSelect.innerHTML += `<input type="checkbox" id="${tag}" name="${tag}" value="${tag}">\n<label for="${tag}">${tag}</label><br>`;
    });

    data.piattaforme.forEach((piattaforma) => {
      platformSelect.innerHTML += `<input type="checkbox" id="${piattaforma}" name="${piattaforma}" value="${piattaforma}">\n<label for="${piattaforma}">${piattaforma}</label><br>`;
    });
  };
}

init();

ws.onerror = (error) => {
  status.textContent = "Error: " + error.message;
  status.style.color = "red";
};

ws.onclose = () => {
  status.textContent = "Disconnected from server";
  status.style.color = "red";
};

async function cerca() {
  field.innerHTML;
  ws.send(
    JSON.stringify({
      type: "search",
      value: searchArea.value,
    }),
  );
  ws.onmessage = (event) => {
    field.innerHTML = null;
    const data = JSON.parse(event.data);
    if (data.type != "search") return;
    field.innerHTML += JSON.stringify(data.value);
  };
}
