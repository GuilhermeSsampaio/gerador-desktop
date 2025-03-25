import React from "react";
import { createRoot } from "react-dom/client";
import App from "./src/App";
import "bootstrap/dist/css/bootstrap.min.css";
import "./src/styles/bootstrap-icons.css"; // Mudança importante aqui
import "./styles/styles.css"; // Caminho corrigido para o arquivo CSS

// Verifica se o ambiente é de desenvolvimento
const isDev = import.meta.env.DEV;
console.log("Ambiente:", isDev ? "Desenvolvimento" : "Produção");

// Log para verificar se a API do Electron está disponível
if (window.electronAPI) {
  console.log("Electron API detectada!");
} else {
  console.warn("Electron API não encontrada. Rodando em modo web?");
}

const container = document.getElementById("root");
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
