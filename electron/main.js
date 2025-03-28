const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const screenshotModule = require("../scripts/screenshots");
const allInOneModule = require("../scripts/all_in_one");
const fs = require("fs");

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadURL("http://localhost:5173"); // Vite roda nessa porta

  // Abrir DevTools em desenvolvimento para depuração
  // win.webContents.openDevTools();
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
      path.join(__dirname, "..", "backend", "gerador.py"),
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

// Nova função para selecionar diretório de destino para salvar arquivos
ipcMain.handle("select-save-directory", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecione um diretório para salvar os arquivos",
    properties: ["openDirectory"],
    buttonLabel: "Salvar aqui",
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});

// Função para mover arquivos de um diretório para outro
ipcMain.handle(
  "move-files",
  async (event, { sourceDir, targetDir, fileList }) => {
    try {
      // Verifica se os diretórios existem
      if (!fs.existsSync(sourceDir)) {
        throw new Error(`Diretório de origem não existe: ${sourceDir}`);
      }
      if (!fs.existsSync(targetDir)) {
        throw new Error(`Diretório de destino não existe: ${targetDir}`);
      }

      const results = [];
      const errors = [];

      // Se fileList for fornecida, move apenas os arquivos específicos
      if (fileList && Array.isArray(fileList) && fileList.length > 0) {
        for (const filePath of fileList) {
          try {
            const fileName = path.basename(filePath);
            const targetPath = path.join(targetDir, fileName);

            // Copia o arquivo para o destino
            fs.copyFileSync(filePath, targetPath);

            // Remove o arquivo original
            fs.unlinkSync(filePath);

            results.push({
              original: filePath,
              destination: targetPath,
              success: true,
            });
          } catch (err) {
            errors.push({
              file: filePath,
              error: err.message,
            });
          }
        }
      } else {
        // Move todos os arquivos do diretório de origem
        const files = fs.readdirSync(sourceDir);

        for (const file of files) {
          try {
            const sourcePath = path.join(sourceDir, file);
            const targetPath = path.join(targetDir, file);

            // Verifica se é um arquivo (e não um diretório)
            if (fs.statSync(sourcePath).isFile()) {
              // Copia o arquivo para o destino
              fs.copyFileSync(sourcePath, targetPath);

              // Remove o arquivo original
              fs.unlinkSync(sourcePath);

              results.push({
                original: sourcePath,
                destination: targetPath,
                success: true,
              });
            }
          } catch (err) {
            errors.push({
              file: file,
              error: err.message,
            });
          }
        }
      }

      return {
        success: true,
        results,
        errors,
        message: `${results.length} arquivos movidos com sucesso. ${errors.length} erros.`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
);

// Adicionar um manipulador de erros não tratados para depuração
process.on("uncaughtException", (error) => {
  console.error("Erro não tratado:", error);
});

ipcMain.handle("take-screenshots", async (event, args) => {
  const { baseUrl, userType, formData, specificData } = args;
  console.log("Recebidos atributos para screenshots:", args);

  try {
    const result = await screenshotModule.executarTestes({
      baseUrl: baseUrl || "http://localhost:3000",
      userType: userType || "Maestro",
      formData: formData || {},
      specificData: specificData || {},
    });

    return {
      success: true,
      message: "Screenshots capturados com sucesso",
      screenshotPaths: result,
    };
  } catch (error) {
    console.error("Erro ao capturar screenshots:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido ao capturar screenshots",
    };
  }
});

// Adicionar handler para o processo completo
ipcMain.handle("run-full-process", async (event, options) => {
  console.log("Iniciando processo completo com opções:", options);

  try {
    const result = await allInOneModule.runFullProcess(options);
    return result;
  } catch (error) {
    console.error("Erro no processo completo:", error);
    return {
      success: false,
      error: error.message || "Erro desconhecido durante o processo completo",
    };
  }
});

// Adicionar handler para selecionar arquivo de especificação
ipcMain.handle("select-spec-file", async () => {
  const result = await dialog.showOpenDialog({
    title: "Selecione o arquivo de especificação",
    properties: ["openFile"],
    filters: [
      { name: "Documentos Word", extensions: ["docx"] },
      { name: "Todos os arquivos", extensions: ["*"] },
    ],
    buttonLabel: "Selecionar",
  });

  if (result.canceled) {
    return null;
  }

  return result.filePaths[0];
});
