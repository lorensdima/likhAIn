const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const Database = require("better-sqlite3");

// init DB
const db = new Database("ideas.db");
db.prepare(`CREATE TABLE IF NOT EXISTS ideas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  text TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`).run();

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"), // if you use preload
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
