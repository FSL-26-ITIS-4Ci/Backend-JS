const status = document.getElementById("status");
const form = document.getElementById("form");
const searchArea = document.getElementById("searchArea");
const field = document.getElementById("result");
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
  const games = await waitForGames();

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

  arrSetTag.forEach((tag) => {
    form.innerHTML += `<input type="checkbox" id="${tag}" name="${tag}" value="${tag}">\n<label for="${tag}">${tag}</label><br>`;
  });
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
