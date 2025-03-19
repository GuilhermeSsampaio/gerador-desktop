const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "electron", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173"); // Vite roda nessa porta

  // Abrir DevTools em desenvolvimento para depuração
  win.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Comunicação IPC para executar o script Python
ipcMain.handle("run-generator", async (event, args) => {
  const { name, entrega, includeDirs, outputFilename, includeEnv } = args;
  console.log("Recebido pedido para executar gerador:", args);

  return new Promise((resolve, reject) => {
    // Certifica-se de que includeDirs é uma matriz não vazia
    if (!Array.isArray(includeDirs) || includeDirs.length === 0) {
      return reject({
        success: false,
        error: "Nenhum diretório foi selecionado",
      });
    }

    // Executar o script Python com um processo filho
    const pythonArgs = [
      "gerador.py",
      "--name",
      name,
      "--entrega",
      entrega,
      "--include-dirs",
      includeDirs.join(","),
      "--output",
      outputFilename,
    ];

    if (includeEnv) {
      pythonArgs.push("--include-env");
    }

    console.log("Executando Python com argumentos:", pythonArgs);

    // No Windows, pode ser necessário especificar "python" ou "python3"
    const pythonCommand = process.platform === "win32" ? "python" : "python3";
    const pythonProcess = spawn(pythonCommand, pythonArgs);

    let stdoutData = "";
    let stderrData = "";

    pythonProcess.stdout.on("data", (data) => {
      const text = data.toString();
      console.log("Python stdout:", text);
      stdoutData += text;
    });

    pythonProcess.stderr.on("data", (data) => {
      const text = data.toString();
      console.error("Python stderr:", text);
      stderrData += text;
    });

    pythonProcess.on("close", (code) => {
      console.log("Python processo terminou com código:", code);
      if (code === 0) {
        resolve({ success: true, output: stdoutData });
      } else {
        reject({ success: false, error: stderrData || "Erro desconhecido" });
      }
    });
  });
});

// Comunicação IPC para selecionar diretórios
ipcMain.handle("select-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Adicionar um manipulador de erros não tratados para depuração
process.on("uncaughtException", (error) => {
  console.error("Erro não tratado:", error);
});
