const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script está sendo executado");

contextBridge.exposeInMainWorld("electronAPI", {
  // Função para rodar o gerador
  runGenerator: (args) => ipcRenderer.invoke("run-generator", args),

  // Função para selecionar diretório
  selectDirectory: () => ipcRenderer.invoke("select-directory"),

  // Função para tirar screenshots
  takeScreenshots: (config) => ipcRenderer.invoke("take-screenshots", config),

  // Funções para gerenciar diretórios e movimentação de arquivos
  selectSaveDirectory: () => ipcRenderer.invoke("select-save-directory"),
  moveFiles: (args) => ipcRenderer.invoke("move-files", args),
});

console.log("API do Electron exposta:", "electronAPI");
