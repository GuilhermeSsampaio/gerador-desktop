import React, { useState } from "react";
import "./ScreenshotTool.css";

export const ScreenshotTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [saveModalVisible, setSaveModalVisible] = useState(false);
  const [screenshotPaths, setScreenshotPaths] = useState([]);

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

  // Estado para gerenciar os campos específicos do usuário
  const [specificFields, setSpecificFields] = useState(
    Object.entries(config.specificData).map(([key, value]) => ({ key, value }))
  );

  // Atualiza as configurações básicas
  const handleChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Função para atualizar o specificData no config quando specificFields mudar
  const updateSpecificDataConfig = (updatedFields) => {
    const newSpecificData = {};
    updatedFields.forEach((field) => {
      if (field.key.trim()) {
        newSpecificData[field.key] = field.value;
      }
    });

    setConfig((prev) => ({
      ...prev,
      specificData: newSpecificData,
    }));
  };

  // Atualiza o nome/chave de um campo específico
  const handleSpecificFieldKeyChange = (index, newKey) => {
    const updatedFields = [...specificFields];
    updatedFields[index].key = newKey;
    setSpecificFields(updatedFields);
    updateSpecificDataConfig(updatedFields);
  };

  // Atualiza o valor de um campo específico
  const handleSpecificFieldValueChange = (index, newValue) => {
    const updatedFields = [...specificFields];
    updatedFields[index].value = newValue;
    setSpecificFields(updatedFields);
    updateSpecificDataConfig(updatedFields);
  };

  // Adiciona um novo campo específico
  const addSpecificField = () => {
    const updatedFields = [...specificFields, { key: "", value: "" }];
    setSpecificFields(updatedFields);
    updateSpecificDataConfig(updatedFields);
  };

  // Remove um campo específico
  const removeSpecificField = (index) => {
    const updatedFields = specificFields.filter((_, i) => i !== index);
    setSpecificFields(updatedFields);
    updateSpecificDataConfig(updatedFields);
  };

  // Função para iniciar a captura de screenshots
  const startScreenshots = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setResult(null);
      setScreenshotPaths([]);

      const response = await window.electronAPI.takeScreenshots(config);

      if (response.success) {
        setResult(response);
        setScreenshotPaths(response.screenshotPaths || []);
        setSaveModalVisible(true);
      } else {
        setError(response.error || "Erro desconhecido ao capturar screenshots");
      }
    } catch (err) {
      setError(err.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
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
        sourceDir: "screenshots",
        targetDir: targetDir,
        fileList: screenshotPaths,
      });

      if (moveResult.success) {
        setResult((prev) => ({
          ...prev,
          extraInfo: `Arquivos movidos para: ${targetDir}\n${moveResult.message}`,
        }));
      } else {
        setError(`Erro ao mover screenshots: ${moveResult.error}`);
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

  return (
    <div className="screenshot-tool">
      {/* Configurações básicas */}
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
          <input
            type="text"
            id="userType"
            value={config.userType}
            onChange={(e) => setConfig({ ...config, userType: e.target.value })}
            placeholder="Digite o perfil do usuário"
          />
        </div>
      </div>

      {/* Dados do formulário */}
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

      {/* Dados específicos */}
      <div className="config-section">
        <h3>Dados Específicos</h3>
        <p className="text-muted small">
          Defina os campos específicos do perfil selecionado. Você pode
          adicionar, remover e editar os nomes dos campos conforme necessário.
        </p>

        {specificFields.map((field, index) => (
          <div className="form-group specific-field-group" key={index}>
            <div
              className="d-flex align-items-center"
              style={{ width: "100%" }}
            >
              <input
                type="text"
                className="form-control me-2"
                placeholder="Nome do campo"
                value={field.key}
                onChange={(e) =>
                  handleSpecificFieldKeyChange(index, e.target.value)
                }
              />
              <input
                type="text"
                className="form-control me-2"
                placeholder="Valor"
                value={field.value}
                onChange={(e) =>
                  handleSpecificFieldValueChange(index, e.target.value)
                }
              />
              <button
                type="button"
                className="btn btn-sm btn-danger"
                onClick={() => removeSpecificField(index)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          </div>
        ))}

        <div className="mt-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={addSpecificField}
          >
            <i className="bi bi-plus-circle me-1"></i>
            Adicionar campo
          </button>
        </div>
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

          {result.extraInfo && (
            <div className="mt-3 p-2 bg-info bg-opacity-10 rounded">
              <p className="mb-0">{result.extraInfo}</p>
            </div>
          )}

          <ul>
            {result.screenshotPaths?.map((path, index) => (
              <li key={index}>{path}</li>
            ))}
          </ul>

          {!saveModalVisible && screenshotPaths.length > 0 && (
            <div className="mt-3">
              <button
                className="btn btn-outline-primary"
                onClick={() => setSaveModalVisible(true)}
              >
                <i className="bi bi-folder-symlink me-2"></i>
                Salvar screenshots em outro local
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal para perguntar se quer mover os screenshots */}
      {saveModalVisible && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Salvar screenshots</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={handleKeepFiles}
                ></button>
              </div>
              <div className="modal-body">
                <p>
                  Os screenshots foram capturados com sucesso na pasta padrão{" "}
                  <code>screenshots</code>.
                </p>
                <p>
                  Deseja salvar os screenshots em outro local? Os arquivos serão
                  movidos do local atual.
                </p>
                <div className="mt-2">
                  <strong>Screenshots capturados:</strong>
                  <ul className="mt-2 screenshot-list">
                    {screenshotPaths.map((path, index) => (
                      <li key={index}>{path}</li>
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
    </div>
  );
};
