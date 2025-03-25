import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
// Removida a importação do bootstrap-icons, já que está sendo feita no main.jsx
import "../styles/styles.css";
import { ScreenshotTool } from "./components/ScreenshotTool";

// Lista de arquivos e diretórios ignorados por padrão
const defaultIgnoredDirs = [
  "node_modules",
  ".git",
  ".vscode",
  "__pycache__",
  "venv",
  "dist",
  "build",
  ".next",
];

const defaultIgnoredFiles = [
  ".DS_Store",
  ".env.local",
  ".env.example",
  "ormconfig.ts",
  "tsconfig.json",
  "package.json",
  ".env.development",
  ".gitignore",
  "package-lock.json",
  "yarn.lock",
];

function App() {
  const [formData, setFormData] = useState({
    name: "",
    entrega: "",
    includeDirs: [], // Manter para compatibilidade, mas será derivado
    backendDir: "",
    frontendDir: "",
    otherDirs: [], // Novos diretórios que não são nem front nem back
    includeEnv: false,
  });

  // Estado para controlar qual ferramenta está ativa (documentação ou screenshots)
  const [activeTab, setActiveTab] = useState("docs");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showIgnoredFiles, setShowIgnoredFiles] = useState(false);

  // Estado para armazenar informações sobre arquivos gerados
  const [generatedFiles, setGeneratedFiles] = useState([]);
  const [saveModalVisible, setSaveModalVisible] = useState(false);

  // Efeito para atualizar includeDirs quando outros campos mudam
  useEffect(() => {
    const dirs = [];

    if (formData.backendDir) {
      dirs.push(formData.backendDir);
    }

    if (formData.frontendDir) {
      dirs.push(formData.frontendDir);
    }

    // Adiciona outros diretórios
    dirs.push(...formData.otherDirs);

    setFormData((prev) => ({
      ...prev,
      includeDirs: dirs,
    }));
  }, [formData.backendDir, formData.frontendDir, formData.otherDirs]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectDirectory = async (type) => {
    try {
      // Corrigido de window.electron para window.electronAPI
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        if (type === "backend") {
          setFormData((prev) => ({
            ...prev,
            backendDir: dir,
          }));
        } else if (type === "frontend") {
          setFormData((prev) => ({
            ...prev,
            frontendDir: dir,
          }));
        } else {
          // Adiciona como diretório genérico
          setFormData((prev) => {
            // Evita duplicatas
            if (
              !prev.otherDirs.includes(dir) &&
              dir !== prev.backendDir &&
              dir !== prev.frontendDir
            ) {
              return {
                ...prev,
                otherDirs: [...prev.otherDirs, dir],
              };
            }
            return prev;
          });
        }
      }
    } catch (err) {
      console.error("Erro ao selecionar diretório:", err);
    }
  };

  const removeDirectory = (dir) => {
    setFormData((prev) => {
      // Se for o frontend ou backend, zere o campo específico
      const newState = { ...prev };
      if (dir === prev.backendDir) {
        newState.backendDir = "";
      } else if (dir === prev.frontendDir) {
        newState.frontendDir = "";
      } else {
        // Remove dos outros diretórios
        newState.otherDirs = prev.otherDirs.filter((d) => d !== dir);
      }
      return newState;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    setGeneratedFiles([]);

    try {
      // Array para armazenar todos os resultados
      const allResults = [];
      const generatedFilesList = [];

      // Gerar para o backend se selecionado
      if (formData.backendDir) {
        // Corrigido de window.electron para window.electronAPI
        const backendResult = await window.electronAPI.runGenerator({
          name: formData.name,
          entrega: formData.entrega,
          includeDirs: [formData.backendDir],
          outputFilename: "back-end",
          includeEnv: formData.includeEnv,
        });
        allResults.push("--- Backend ---\n" + backendResult.output);

        // Adicionar arquivos gerados à lista
        generatedFilesList.push(`arquivos-entrega/back-end.docx`);
        if (backendResult.output.includes("PDF salvo")) {
          generatedFilesList.push(`arquivos-entrega/back-end.pdf`);
        }
      }

      // Gerar para o frontend se selecionado
      if (formData.frontendDir) {
        // Corrigido de window.electron para window.electronAPI
        const frontendResult = await window.electronAPI.runGenerator({
          name: formData.name,
          entrega: formData.entrega,
          includeDirs: [formData.frontendDir],
          outputFilename: "front-end",
          includeEnv: formData.includeEnv,
        });
        allResults.push("--- Frontend ---\n" + frontendResult.output);

        // Adicionar arquivos gerados à lista
        generatedFilesList.push(`arquivos-entrega/front-end.docx`);
        if (frontendResult.output.includes("PDF salvo")) {
          generatedFilesList.push(`arquivos-entrega/front-end.pdf`);
        }
      }

      // Gerar para cada outro diretório
      for (let i = 0; i < formData.otherDirs.length; i++) {
        const dir = formData.otherDirs[i];
        // Usar o nome da pasta como nome do arquivo
        const folderName = dir.split("\\").pop().split("/").pop();
        const outputName = `outro-${folderName}`;

        // Corrigido de window.electron para window.electronAPI
        const otherResult = await window.electronAPI.runGenerator({
          name: formData.name,
          entrega: formData.entrega,
          includeDirs: [dir],
          outputFilename: outputName,
          includeEnv: formData.includeEnv,
        });
        allResults.push(`--- ${folderName} ---\n` + otherResult.output);

        // Adicionar arquivos gerados à lista
        generatedFilesList.push(`arquivos-entrega/${outputName}.docx`);
        if (otherResult.output.includes("PDF salvo")) {
          generatedFilesList.push(`arquivos-entrega/${outputName}.pdf`);
        }
      }

      // Combinar todos os resultados
      setResult(allResults.join("\n\n"));
      setGeneratedFiles(generatedFilesList);

      // Exibir modal para perguntar se o usuário quer salvar os arquivos em outro local
      setSaveModalVisible(true);
    } catch (err) {
      console.error("Erro na geração:", err);

      // Verifica se é o erro específico de módulo docx2pdf não encontrado
      if (
        err.error &&
        err.error.includes("ModuleNotFoundError: No module named 'docx2pdf'")
      ) {
        setError(
          "O módulo 'docx2pdf' não está instalado. Os documentos foram gerados apenas em formato DOCX.\n\n" +
            "Para instalar o módulo, execute: pip install docx2pdf\n\n" +
            "Você pode continuar usando a aplicação normalmente com arquivos DOCX."
        );
        // Define um resultado parcial para mostrar que os arquivos DOCX foram gerados
        setResult(
          "Os arquivos DOCX foram gerados com sucesso na pasta arquivos-entrega.\nA conversão para PDF foi ignorada devido à falta do módulo 'docx2pdf'."
        );

        // Adicionar apenas arquivos DOCX à lista
        setGeneratedFiles(
          formData.includeDirs.map((dir, index) => {
            const folderName = dir.split("\\").pop().split("/").pop();
            const outputName =
              index === 0
                ? "back-end"
                : index === 1
                ? "front-end"
                : `outro-${folderName}`;
            return `arquivos-entrega/${outputName}.docx`;
          })
        );

        // Exibir modal para perguntar se o usuário quer salvar os arquivos em outro local
        setSaveModalVisible(true);
      } else {
        setError(err.error || "Ocorreu um erro ao gerar a documentação.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Função para mover os arquivos para um diretório selecionado pelo usuário
  const handleSaveToDirectory = async () => {
    try {
      // Pedir ao usuário para selecionar um diretório
      const targetDir = await window.electronAPI.selectSaveDirectory();

      if (!targetDir) {
        setSaveModalVisible(false);
        return; // Usuário cancelou
      }

      // Mover os arquivos para o diretório selecionado
      const moveResult = await window.electronAPI.moveFiles({
        sourceDir: "arquivos-entrega",
        targetDir: targetDir,
        fileList: generatedFiles,
      });

      if (moveResult.success) {
        setResult(
          (prev) =>
            prev +
            `\n\nArquivos movidos para: ${targetDir}\n${moveResult.message}`
        );
      } else {
        setError(`Erro ao mover arquivos: ${moveResult.error}`);
      }

      setSaveModalVisible(false);
    } catch (err) {
      console.error("Erro ao salvar em outro diretório:", err);
      setError(
        `Erro ao salvar em outro diretório: ${
          err.message || "Erro desconhecido"
        }`
      );
      setSaveModalVisible(false);
    }
  };

  // Função para fechar o modal e manter os arquivos no local original
  const handleKeepFiles = () => {
    setSaveModalVisible(false);
  };

  const renderDirectoryList = () => {
    // Lista combinada de diretórios para exibição
    const allDirs = [
      ...(formData.backendDir
        ? [{ path: formData.backendDir, type: "backend" }]
        : []),
      ...(formData.frontendDir
        ? [{ path: formData.frontendDir, type: "frontend" }]
        : []),
      ...formData.otherDirs.map((dir) => ({ path: dir, type: "other" })),
    ];

    if (allDirs.length === 0) {
      return (
        <div className="alert alert-warning">
          <i className="bi bi-exclamation-triangle me-2"></i>
          Nenhum diretório selecionado
        </div>
      );
    }

    return (
      <div className="list-group mt-2">
        {allDirs.map((item, index) => {
          const icon =
            item.type === "backend"
              ? "bi-hdd-rack"
              : item.type === "frontend"
              ? "bi-window"
              : "bi-folder";

          const prefix =
            item.type === "backend"
              ? "Backend"
              : item.type === "frontend"
              ? "Frontend"
              : "Outro";

          const outputName =
            item.type === "backend"
              ? "backend.docx/pdf"
              : item.type === "frontend"
              ? "frontend.docx/pdf"
              : `outro-${item.path
                  .split("\\")
                  .pop()
                  .split("/")
                  .pop()}.docx/pdf`;

          return (
            <div
              key={index}
              className="list-group-item d-flex justify-content-between align-items-center"
            >
              <div className="d-flex flex-column">
                <div className="d-flex align-items-center">
                  <i className={`bi ${icon} me-2`}></i>
                  <span
                    className="text-truncate"
                    style={{ maxWidth: "400px" }}
                    title={item.path}
                  >
                    <strong>{prefix}: </strong>
                    {item.path}
                  </span>
                </div>
                <small className="text-muted ms-4">
                  <i className="bi bi-file-earmark me-1"></i>
                  Gerará: {outputName}
                </small>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeDirectory(item.path)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container py-4">
      <header className="mb-4 text-center">
        <h1 className="mb-3">Assistente de Documentação Automática</h1>
        <p className="lead">
          Gere documentos e capture screenshots para seus projetos
        </p>
      </header>

      {/* Navegação para alternar entre as ferramentas */}
      <div className="row mb-4">
        <div className="col-lg-8 mx-auto">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "docs" ? "active" : ""}`}
                onClick={() => setActiveTab("docs")}
              >
                <i className="bi bi-file-earmark-text me-2"></i>
                Gerador de Documentação
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "screenshots" ? "active" : ""
                }`}
                onClick={() => setActiveTab("screenshots")}
              >
                <i className="bi bi-camera me-2"></i>
                Captura de Screenshots
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="row">
        <div className="col-lg-8 mx-auto">
          {/* Condicional para mostrar a ferramenta selecionada */}
          {activeTab === "docs" ? (
            /* Ferramenta de geração de documentação */
            <>
              <div className="card shadow">
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label htmlFor="name" className="form-label">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label htmlFor="entrega" className="form-label">
                        Número da Entrega
                      </label>
                      <input
                        type="text"
                        className="form-control"
                        id="entrega"
                        name="entrega"
                        value={formData.entrega}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label">
                        Diretórios do Projeto
                      </label>

                      <div className="d-flex flex-wrap gap-2 mb-3">
                        <button
                          type="button"
                          className={`btn ${
                            formData.backendDir
                              ? "btn-success"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => handleSelectDirectory("backend")}
                        >
                          <i className="bi bi-hdd-rack me-2"></i>
                          {formData.backendDir
                            ? "Backend Selecionado"
                            : "Selecionar Backend"}
                        </button>

                        <button
                          type="button"
                          className={`btn ${
                            formData.frontendDir
                              ? "btn-success"
                              : "btn-outline-primary"
                          }`}
                          onClick={() => handleSelectDirectory("frontend")}
                        >
                          <i className="bi bi-window me-2"></i>
                          {formData.frontendDir
                            ? "Frontend Selecionado"
                            : "Selecionar Frontend"}
                        </button>

                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleSelectDirectory("other")}
                        >
                          <i className="bi bi-folder-plus me-2"></i>
                          Adicionar Outro Diretório
                        </button>
                      </div>

                      {renderDirectoryList()}
                    </div>

                    <div className="mb-3 form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="includeEnv"
                        name="includeEnv"
                        checked={formData.includeEnv}
                        onChange={handleChange}
                      />
                      <label className="form-check-label" htmlFor="includeEnv">
                        Incluir arquivos .env
                      </label>
                    </div>

                    <div className="mb-4">
                      <button
                        type="button"
                        className="btn btn-link p-0"
                        onClick={() => setShowIgnoredFiles(!showIgnoredFiles)}
                      >
                        <i
                          className={`bi ${
                            showIgnoredFiles
                              ? "bi-chevron-down"
                              : "bi-chevron-right"
                          } me-1`}
                        ></i>
                        {showIgnoredFiles ? "Ocultar" : "Mostrar"} arquivos
                        ignorados por padrão
                      </button>

                      {showIgnoredFiles && (
                        <div className="mt-2 p-3 bg-light rounded border">
                          <div className="mb-2">
                            <strong>Diretórios ignorados:</strong>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {defaultIgnoredDirs.map((dir, i) => (
                                <span
                                  key={i}
                                  className="badge bg-secondary me-1 mb-1"
                                >
                                  {dir}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div>
                            <strong>Arquivos ignorados:</strong>
                            <div className="d-flex flex-wrap gap-1 mt-1">
                              {defaultIgnoredFiles.map((file, i) => (
                                <span
                                  key={i}
                                  className="badge bg-secondary me-1 mb-1"
                                >
                                  {file}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={loading || formData.includeDirs.length === 0}
                    >
                      {loading ? (
                        <>
                          <span
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                            aria-hidden="true"
                          ></span>
                          Gerando documentação...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-file-earmark-text me-2"></i>
                          Gerar Documentação
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {error && (
                <div className="alert alert-danger mt-4">
                  <h5>
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>Erro
                  </h5>
                  <pre className="mt-2 p-2 bg-light rounded">{error}</pre>
                </div>
              )}

              {result && (
                <div className="alert alert-success mt-4">
                  <h5>
                    <i className="bi bi-check-circle-fill me-2"></i>Sucesso
                  </h5>
                  <pre className="mt-2 p-2 bg-light rounded">{result}</pre>
                  <p className="mt-3 mb-0">
                    Os arquivos foram gerados na pasta{" "}
                    <code>arquivos-entrega</code>
                  </p>

                  {!saveModalVisible && generatedFiles.length > 0 && (
                    <div className="mt-3">
                      <button
                        className="btn btn-outline-primary"
                        onClick={() => setSaveModalVisible(true)}
                      >
                        <i className="bi bi-folder-symlink me-2"></i>
                        Salvar arquivos em outro local
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Modal para perguntar se quer mover os arquivos */}
              {saveModalVisible && (
                <div
                  className="modal show d-block"
                  tabIndex="-1"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <div className="modal-dialog">
                    <div className="modal-content">
                      <div className="modal-header">
                        <h5 className="modal-title">Salvar arquivos</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={handleKeepFiles}
                        ></button>
                      </div>
                      <div className="modal-body">
                        <p>
                          Os arquivos foram gerados com sucesso na pasta padrão{" "}
                          <code>arquivos-entrega</code>.
                        </p>
                        <p>
                          Deseja salvar os arquivos em outro local? Os arquivos
                          serão movidos do local atual.
                        </p>
                        <div className="mt-2">
                          <strong>Arquivos gerados:</strong>
                          <ul className="mt-2">
                            {generatedFiles.map((file, index) => (
                              <li key={index}>{file}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={handleKeepFiles}
                        >
                          Manter no local atual
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={handleSaveToDirectory}
                        >
                          <i className="bi bi-folder-symlink me-2"></i>
                          Escolher outro local
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Ferramenta de captura de screenshots */
            <div className="card shadow">
              <div className="card-body">
                <h4 className="card-title mb-4">
                  <i className="bi bi-camera me-2"></i>
                  Ferramenta de Screenshots
                </h4>
                <ScreenshotTool />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
