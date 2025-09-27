const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Load environment variables from .env

// Initialize the Gemini client with the key from your .env file
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// init DB
const db = new Database("ideas.db");
db.prepare(
  `CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`
).run();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // if you use preload
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Correct way:
  mainWindow.loadFile(path.join(__dirname, "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// IPC handlers
ipcMain.handle("add-idea", (e, text) => {
  db.prepare("INSERT INTO ideas (text) VALUES (?)").run(text);
});

ipcMain.handle("get-ideas", () => {
  return db.prepare("SELECT * FROM ideas ORDER BY created_at DESC").all();
});

// Listen for a message from the renderer process
ipcMain.handle("generate-content", async (event, prompt) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return "Failed to generate content.";
  }
});
