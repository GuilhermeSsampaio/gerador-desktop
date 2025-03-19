import React, { useState } from "react";
import "./ScreenshotTool.css";

export const ScreenshotTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Configurações para os screenshots
  const [config, setConfig] = useState({
    baseUrl: "http://localhost:3000",
    userType: "Maestro",
    formData: {
      cpf: "123.456.789-10",
      nome: "Usuário Teste",
      email: "teste@exemplo.com",
      senha: "senha123",
      confirmacao: "senha123",
      questao: "Qual o nome do seu primeiro pet?",
      resposta: "Rex",
    },
    specificData: {
      estilo: "Elegante",
      origem: "Brasileiro",
      experiencia: "15",
    },
  });

  // Atualiza as configurações
  const handleChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Função para iniciar a captura de screenshots
  const startScreenshots = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);

      const response = await window.electronAPI.takeScreenshots(config);

      if (response.success) {
        setResult(response);
      } else {
        setError(response.error || "Erro desconhecido ao capturar screenshots");
      }
    } catch (err) {
      setError(err.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="screenshot-tool">
      {/* Removida a tag h2 que duplicava o título, já que agora temos um título na card */}

      <div className="config-section">
        <h3>Configurações Básicas</h3>
        <div className="form-group">
          <label htmlFor="baseUrl">URL Base:</label>
          <input
            type="text"
            id="baseUrl"
            value={config.baseUrl}
            onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label htmlFor="userType">Tipo de Usuário:</label>
          <select
            id="userType"
            value={config.userType}
            onChange={(e) => setConfig({ ...config, userType: e.target.value })}
          >
            <option value="Maestro">Maestro</option>
            <option value="Aluno">Aluno</option>
            <option value="Professor">Professor</option>
          </select>
        </div>
      </div>

      <div className="config-section">
        <h3>Dados do Formulário</h3>
        {Object.entries(config.formData).map(([field, value]) => (
          <div className="form-group" key={field}>
            <label htmlFor={`form-${field}`}>{field}:</label>
            <input
              type="text"
              id={`form-${field}`}
              value={value}
              onChange={(e) => handleChange("formData", field, e.target.value)}
            />
          </div>
        ))}
      </div>

      <div className="config-section">
        <h3>Dados Específicos</h3>
        {Object.entries(config.specificData).map(([field, value]) => (
          <div className="form-group" key={field}>
            <label htmlFor={`specific-${field}`}>{field}:</label>
            <input
              type="text"
              id={`specific-${field}`}
              value={value}
              onChange={(e) =>
                handleChange("specificData", field, e.target.value)
              }
            />
          </div>
        ))}
      </div>

      <div className="actions">
        <button
          className="primary-button"
          onClick={startScreenshots}
          disabled={isLoading}
        >
          {isLoading ? "Capturando..." : "Capturar Screenshots"}
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="result-message">
          <h4>Screenshots capturados com sucesso!</h4>
          <p>Total de screenshots: {result.screenshotPaths?.length || 0}</p>
          <ul>
            {result.screenshotPaths?.map((path, index) => (
              <li key={index}>{path}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
