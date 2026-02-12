const bcrypt = require("bcrypt");
const crypto = require("crypto");

const ADMIN_PASSWORD_HASH =
  "$2a$12$UxNkIvOzISqA.Ne5ecRNMO1SK9v7FbTKUvjVGTBzZCQ1oWAScEdlC";

const sessions = new Map();

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

  const isValidPassword = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
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
  sessions.set(token, true);
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

function handleProtectedAction(ws, message) {
  const { token, data } = message;

  if (!verifyToken(token)) {
    ws.send(
      JSON.stringify({ type: "error", message: "Unauthorized - please login" }),
    );
    return;
  }

  ws.send(JSON.stringify({ type: "protected_response", success: true, data }));
}

module.exports = {
  handleLogin,
  handleLogout,
  handleProtectedAction,
  verifyToken,
};
