const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script está sendo executado");

contextBridge.exposeInMainWorld("electronAPI", {
  // Funções existentes
  runGenerator: (args) => ipcRenderer.invoke("run-generator", args),
  selectDirectory: () => ipcRenderer.invoke("select-directory"),

  // Nova função para tirar screenshots
  takeScreenshots: (config) => ipcRenderer.invoke("take-screenshots", config),

  // Novas funções para gerenciar diretórios e movimentação de arquivos
  selectSaveDirectory: () => ipcRenderer.invoke("select-save-directory"),
  moveFiles: (args) => ipcRenderer.invoke("move-files", args),
});

console.log("API do Electron exposta:", "electronAPI"); // Corrigido para mostrar o nome correto
