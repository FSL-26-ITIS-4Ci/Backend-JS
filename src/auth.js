const bcrypt = require("bcrypt");
const crypto = require("crypto");
const config = require("../resources/config.json");

const sessions = new Set();

function generateToken() {
  return crypto.randomBytes(32).toString("hex");
}

function verifyToken(token) {
  return sessions.has(token);
}

async function handleLogin(ws, message) {
  const { password } = message;

  if (!password) {
    ws.send(
      JSON.stringify({
        type: "login_response",
        success: false,
        message: "Password required",
      }),
    );
    return;
  }

  const isValidPassword = await bcrypt.compare(password, config.admin_password);

  if (!isValidPassword) {
    ws.send(
      JSON.stringify({
        type: "login_response",
        success: false,
        message: "Invalid password",
      }),
    );
    return;
  }

  const token = generateToken();
  sessions.add(token);
  ws.send(JSON.stringify({ type: "login_response", success: true, token }));
}

function handleLogout(ws, message) {
  const { token } = message;

  if (sessions.has(token)) {
    sessions.delete(token);
    ws.send(JSON.stringify({ type: "logout_response", success: true }));
  } else {
    ws.send(
      JSON.stringify({
        type: "logout_response",
        success: false,
        message: "Invalid session",
      }),
    );
  }
}

module.exports = {
  handleLogin,
  handleLogout,
  verifyToken,
};
