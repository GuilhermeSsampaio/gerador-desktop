const { contextBridge, ipcRenderer } = require("electron");

console.log("Preload script está sendo executado");

contextBridge.exposeInMainWorld("electron", {
  // Aqui podemos expor funções para o front-end
  generateDocumentation: (args) => {
    console.log("Chamando função generateDocumentation com argumentos:", args);
    return ipcRenderer.invoke("run-generator", args);
  },

  // Nova função para selecionar diretórios
  selectDirectory: () => ipcRenderer.invoke("select-directory"),
});

console.log("API do Electron exposta:", window.electron);
