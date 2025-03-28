const { spawn, exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const puppeteer = require("puppeteer");
const screenshots = require("./screenshots");
const execPromise = promisify(exec);

// Tempo de espera para o servidor iniciar (ajustável)
const SERVER_STARTUP_WAIT_TIME = 15000; // 15 segundos

/**
 * Função principal que executa todo o processo de entrega
 */
async function runFullProcess(options) {
  const {
    name,
    entrega,
    backendDir,
    frontendDir,
    especFilePath,
    outputDir = "arquivos-entrega",
    baseUrl = "http://localhost:3000",
    userType = "Maestro",
  } = options;

  const results = {
    steps: {},
    success: false,
    error: null,
  };

  try {
    console.log("Iniciando processo completo de entrega...");

    // Passo 1: Gerar documentação para backend e frontend
    results.steps.documentation = await generateDocumentation(
      name,
      entrega,
      backendDir,
      frontendDir,
      outputDir
    );

    // Passo 2: Iniciar servidor web
    const serverProcess = await startWebServer(backendDir);
    console.log(
      `Servidor iniciado, aguardando ${
        SERVER_STARTUP_WAIT_TIME / 1000
      } segundos para estabilização...`
    );

    // Aguarda o servidor iniciar
    await new Promise((resolve) =>
      setTimeout(resolve, SERVER_STARTUP_WAIT_TIME)
    );

    try {
      // Passo 3: Capturar screenshots
      results.steps.screenshots = await captureScreenshots(baseUrl, userType);

      // Passo 4: Gerar documento com screenshots
      results.steps.screenshotsDoc = await generateScreenshotsDocument(
        name,
        entrega,
        results.steps.screenshots,
        outputDir
      );

      // Passo 5: Atualizar arquivo de especificação
      if (especFilePath) {
        results.steps.especUpdate = await updateEspecFile(
          name,
          entrega,
          especFilePath
        );
      }
    } finally {
      // Garantir que o servidor seja finalizado mesmo em caso de erro
      await stopWebServer(serverProcess);
    }

    results.success = true;
    console.log("Processo completo de entrega finalizado com sucesso!");
  } catch (error) {
    console.error("Erro durante o processo completo:", error);
    results.success = false;
    results.error = error.message || "Erro desconhecido durante o processo";
  }

  return results;
}

/**
 * Gera documentação para backend e frontend
 */
async function generateDocumentation(
  name,
  entrega,
  backendDir,
  frontendDir,
  outputDir
) {
  const results = {
    backend: null,
    frontend: null,
  };

  // Verifica se diretórios existem
  if (!backendDir || !fs.existsSync(backendDir)) {
    throw new Error(`Diretório de backend não encontrado: ${backendDir}`);
  }

  if (!frontendDir || !fs.existsSync(frontendDir)) {
    throw new Error(`Diretório de frontend não encontrado: ${frontendDir}`);
  }

  // Garante que o diretório de saída existe
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Roda o gerador para backend
  console.log("Gerando documentação para backend...");
  const backendCmd = `python "${path.join(
    __dirname,
    "..",
    "backend",
    "gerador.py"
  )}" --name "${name}" --entrega "${entrega}" --include-dirs "${backendDir}" --output "back-end"`;
  results.backend = await execPromise(backendCmd);

  // Roda o gerador para frontend
  console.log("Gerando documentação para frontend...");
  const frontendCmd = `python "${path.join(
    __dirname,
    "..",
    "backend",
    "gerador.py"
  )}" --name "${name}" --entrega "${entrega}" --include-dirs "${frontendDir}" --output "front-end"`;
  results.frontend = await execPromise(frontendCmd);

  return results;
}

/**
 * Inicia o servidor web usando yarn web no diretório do backend
 */
async function startWebServer(backendDir) {
  console.log(`Iniciando servidor web no diretório: ${backendDir}`);

  // Verifica se o diretório existe
  if (!fs.existsSync(backendDir)) {
    throw new Error(`Diretório de backend não encontrado: ${backendDir}`);
  }

  // Inicia o servidor usando spawn para manter o processo em execução
  const serverProcess = spawn("yarn", ["web"], {
    cwd: backendDir,
    shell: true,
    stdio: "pipe",
  });

  // Log para debug
  serverProcess.stdout.on("data", (data) => {
    console.log(`Servidor stdout: ${data}`);
  });

  serverProcess.stderr.on("data", (data) => {
    console.error(`Servidor stderr: ${data}`);
  });

  serverProcess.on("error", (error) => {
    console.error(`Erro ao iniciar servidor: ${error.message}`);
  });

  return serverProcess;
}

/**
 * Para o servidor web quando não for mais necessário
 */
async function stopWebServer(serverProcess) {
  if (serverProcess) {
    console.log("Finalizando servidor web...");

    // No Windows, o process.kill não funciona bem com processos filhos do shell
    // Por isso usamos uma abordagem multiplataforma
    if (process.platform === "win32") {
      // No Windows, usa taskkill para garantir que todos os processos filhos sejam finalizados
      exec("taskkill /F /T /PID " + serverProcess.pid);
    } else {
      // Em sistemas Unix, o sinal SIGTERM normalmente é suficiente
      serverProcess.kill("SIGTERM");
    }

    return new Promise((resolve) => {
      // Espera um pouco para garantir que o processo foi finalizado
      setTimeout(resolve, 2000);
    });
  }
}

/**
 * Captura screenshots usando o módulo existente
 */
async function captureScreenshots(baseUrl, userType) {
  console.log("Capturando screenshots...");

  // Usa o módulo de screenshots existente
  const screenshotPaths = await screenshots.executarTestes({
    baseUrl,
    userType,
    captureMode: "all",
  });

  return screenshotPaths;
}

/**
 * Gera um documento Word com os screenshots e converte para PDF
 */
async function generateScreenshotsDocument(
  name,
  entrega,
  screenshotPaths,
  outputDir
) {
  console.log("Gerando documento com screenshots...");

  // Verifica se existem screenshots para incluir
  if (!screenshotPaths || screenshotPaths.length === 0) {
    throw new Error("Nenhum screenshot capturado para incluir no documento");
  }

  // Cria um arquivo temporário com os caminhos dos screenshots
  const tempFilePath = path.join(__dirname, "temp_screenshots_list.txt");
  fs.writeFileSync(tempFilePath, screenshotPaths.join("\n"));

  // Executa script Python para gerar o documento
  const pythonCmd = `python "${path.join(
    __dirname,
    "generate_screenshots_doc.py"
  )}" --name "${name}" --entrega "${entrega}" --screenshots-list "${tempFilePath}" --output "${path.join(
    outputDir,
    "screenshots"
  )}"`;
  const result = await execPromise(pythonCmd);

  // Remove o arquivo temporário
  fs.unlinkSync(tempFilePath);

  return {
    output: result.stdout,
    error: result.stderr,
  };
}

/**
 * Atualiza o arquivo de especificação com novo título e data
 */
async function updateEspecFile(name, entrega, especFilePath) {
  console.log(`Atualizando arquivo de especificação: ${especFilePath}`);

  // Verifica se o arquivo existe
  if (!fs.existsSync(especFilePath)) {
    throw new Error(
      `Arquivo de especificação não encontrado: ${especFilePath}`
    );
  }

  // Obtém a data atual formatada
  const today = new Date();
  const day = today.getDate().toString().padStart(2, "0");
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const year = today.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;

  // Título padronizado
  const title = `Linguagem de Programação III - Entrega ${entrega} - ${name}`;

  // Executa script Python para atualizar o documento
  const pythonCmd = `python "${path.join(
    __dirname,
    "update_espec_doc.py"
  )}" --title "${title}" --date "${formattedDate}" --file "${especFilePath}"`;
  const result = await execPromise(pythonCmd);

  return {
    output: result.stdout,
    error: result.stderr,
  };
}

module.exports = {
  runFullProcess,
};
