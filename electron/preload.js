const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script está sendo executado");

contextBridge.exposeInMainWorld("electronAPI", {
  // Funções existentes
  runGenerator: (args) => ipcRenderer.invoke("run-generator", args),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),

  // Nova função para tirar screenshots
  takeScreenshots: (config) => ipcRenderer.invoke("take-screenshots", config),
});

console.log("API do Electron exposta:", "electronAPI"); // Corrigido para mostrar o nome correto
