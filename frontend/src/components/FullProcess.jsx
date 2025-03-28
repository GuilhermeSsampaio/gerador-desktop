import React, { useState } from "react";
import "./FullProcess.css";

export const FullProcess = () => {
  const [formData, setFormData] = useState({
    name: "",
    entrega: "",
    backendDir: "",
    frontendDir: "",
    especFilePath: "",
    baseUrl: "http://localhost:3000",
    userType: "Maestro",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [logOutput, setLogOutput] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectDirectory = async (field) => {
    try {
      const dir = await window.electronAPI.selectDirectory();
      if (dir) {
        setFormData((prev) => ({
          ...prev,
          [field]: dir,
        }));
      }
    } catch (err) {
      setError(`Erro ao selecionar diretório: ${err.message}`);
    }
  };

  const handleSelectEspecFile = async () => {
    try {
      const filePath = await window.electronAPI.selectSpecFile();
      if (filePath) {
        setFormData((prev) => ({
          ...prev,
          especFilePath: filePath,
        }));
      }
    } catch (err) {
      setError(`Erro ao selecionar arquivo de especificação: ${err.message}`);
    }
  };

  const startFullProcess = async () => {
    // Validar campos obrigatórios
    if (
      !formData.name ||
      !formData.entrega ||
      !formData.backendDir ||
      !formData.frontendDir
    ) {
      setError(
        "Preencha todos os campos obrigatórios (nome, entrega, diretório backend e frontend)."
      );
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setLogOutput(["Iniciando processo completo..."]);

      // Chamar a API do Electron para executar o processo completo
      const response = await window.electronAPI.runFullProcess(formData);

      setLogOutput((prev) => [...prev, "Processo finalizado!"]);

      if (response.success) {
        setResult(response);

        // Adiciona detalhes do processo ao log
        if (response.steps?.documentation?.backend) {
          setLogOutput((prev) => [
            ...prev,
            "✅ Documentação do backend gerada com sucesso",
          ]);
        }

        if (response.steps?.documentation?.frontend) {
          setLogOutput((prev) => [
            ...prev,
            "✅ Documentação do frontend gerada com sucesso",
          ]);
        }

        if (response.steps?.screenshots) {
          setLogOutput((prev) => [
            ...prev,
            `✅ ${response.steps.screenshots.length} screenshots capturados com sucesso`,
          ]);
        }

        if (response.steps?.screenshotsDoc) {
          setLogOutput((prev) => [
            ...prev,
            "✅ Documento de screenshots gerado com sucesso",
          ]);
        }

        if (response.steps?.especUpdate) {
          setLogOutput((prev) => [
            ...prev,
            "✅ Arquivo de especificação atualizado com sucesso",
          ]);
        }
      } else {
        setError(
          response.error || "Erro desconhecido ao executar o processo completo"
        );
        setLogOutput((prev) => [...prev, `❌ Erro: ${response.error}`]);
      }
    } catch (err) {
      setError(err.message || "Erro inesperado");
      setLogOutput((prev) => [...prev, `❌ Erro: ${err.message}`]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="full-process">
      <div className="config-section">
        <h3>Processo Completo de Entrega</h3>
        <p className="text-muted small">
          Esta ferramenta executa todo o processo em uma única operação: gera
          documentação, captura screenshots, cria documento de screenshots e
          atualiza o arquivo de especificação.
        </p>

        <div className="form-group">
          <label htmlFor="name">Nome Completo:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Seu nome completo"
          />
        </div>

        <div className="form-group">
          <label htmlFor="entrega">Número da Entrega:</label>
          <input
            type="text"
            id="entrega"
            name="entrega"
            value={formData.entrega}
            onChange={handleChange}
            placeholder="Ex: 2"
          />
        </div>

        <div className="form-group">
          <label htmlFor="backendDir">Diretório do Backend:</label>
          <div className="input-with-button">
            <input
              type="text"
              id="backendDir"
              name="backendDir"
              value={formData.backendDir}
              onChange={handleChange}
              readOnly
              placeholder="Selecione o diretório do backend"
            />
            <button
              type="button"
              onClick={() => handleSelectDirectory("backendDir")}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-folder"></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="frontendDir">Diretório do Frontend:</label>
          <div className="input-with-button">
            <input
              type="text"
              id="frontendDir"
              name="frontendDir"
              value={formData.frontendDir}
              onChange={handleChange}
              readOnly
              placeholder="Selecione o diretório do frontend"
            />
            <button
              type="button"
              onClick={() => handleSelectDirectory("frontendDir")}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-folder"></i>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="especFilePath">
            Arquivo de Especificação (opcional):
          </label>
          <div className="input-with-button">
            <input
              type="text"
              id="especFilePath"
              name="especFilePath"
              value={formData.especFilePath}
              onChange={handleChange}
              readOnly
              placeholder="Selecione o arquivo de especificação (.docx)"
            />
            <button
              type="button"
              onClick={handleSelectEspecFile}
              className="btn btn-outline-primary"
            >
              <i className="bi bi-file-earmark"></i>
            </button>
          </div>
          <small className="text-muted">
            Se fornecido, o título e a data serão atualizados no arquivo.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="baseUrl">URL Base:</label>
          <input
            type="text"
            id="baseUrl"
            name="baseUrl"
            value={formData.baseUrl}
            onChange={handleChange}
            placeholder="URL da aplicação web"
          />
        </div>

        <div className="form-group">
          <label htmlFor="userType">Tipo de Usuário:</label>
          <input
            type="text"
            id="userType"
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            placeholder="Ex: Maestro"
          />
        </div>
      </div>

      <div className="actions">
        <button
          className="primary-button"
          onClick={startFullProcess}
          disabled={isLoading}
        >
          {isLoading ? "Processando..." : "Executar Processo Completo"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {logOutput.length > 0 && (
        <div className="log-output">
          <h4>Log de Execução:</h4>
          <div className="log-content">
            {logOutput.map((line, index) => (
              <div key={index} className="log-line">
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {result && (
        <div className="result-message">
          <h4>Processo Completo Finalizado!</h4>
          <p>Todos os arquivos foram gerados com sucesso.</p>

          <div className="result-details">
            <h5>Arquivos Gerados:</h5>
            <ul>
              <li>arquivos-entrega/back-end.docx e .pdf</li>
              <li>arquivos-entrega/front-end.docx e .pdf</li>
              <li>arquivos-entrega/screenshots.docx e .pdf</li>
              {formData.especFilePath && (
                <li>{formData.especFilePath} (atualizado)</li>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
