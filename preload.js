const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  addIdea: (text) => ipcRenderer.invoke("add-idea", text),
  getIdeas: () => ipcRenderer.invoke("get-ideas")
});
