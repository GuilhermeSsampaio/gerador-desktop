import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";

function App() {
  const [formData, setFormData] = useState({
    name: "",
    entrega: "",
    includeDirs: [], // Agora é um array em vez de uma string
    outputFilename: "",
    includeEnv: false,
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectDirectory = async () => {
    try {
      const dir = await window.electron.selectDirectory();
      if (dir) {
        setFormData((prev) => ({
          ...prev,
          includeDirs: [...prev.includeDirs, dir],
        }));
      }
    } catch (err) {
      console.error("Erro ao selecionar diretório:", err);
    }
  };

  const removeDirectory = (index) => {
    setFormData((prev) => ({
      ...prev,
      includeDirs: prev.includeDirs.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await window.electron.generateDocumentation({
        name: formData.name,
        entrega: formData.entrega,
        includeDirs: formData.includeDirs,
        outputFilename: formData.outputFilename,
        includeEnv: formData.includeEnv,
      });

      setResult(response.output);
    } catch (err) {
      console.error("Erro na geração:", err);
      setError(err.error || "Ocorreu um erro ao gerar a documentação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4">
      <header className="mb-5 text-center">
        <h1 className="mb-3">Gerador de Documentação Automática</h1>
        <p className="lead">
          Gere documentos .docx e .pdf com seu código-fonte formatado
        </p>
      </header>

      <div className="row">
        <div className="col-lg-8 mx-auto">
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
                  <label className="form-label">Diretórios a Incluir</label>
                  <div className="d-flex">
                    <button
                      type="button"
                      className="btn btn-outline-primary mb-2"
                      onClick={handleSelectDirectory}
                    >
                      <i className="bi bi-folder-plus me-2"></i>
                      Selecionar Diretório
                    </button>
                  </div>

                  {formData.includeDirs.length > 0 ? (
                    <div className="list-group mt-2">
                      {formData.includeDirs.map((dir, index) => (
                        <div
                          key={index}
                          className="list-group-item d-flex justify-content-between align-items-center"
                        >
                          <span
                            className="text-truncate"
                            style={{ maxWidth: "80%" }}
                          >
                            {dir}
                          </span>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removeDirectory(index)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="alert alert-warning mt-2">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      Nenhum diretório selecionado
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label htmlFor="outputFilename" className="form-label">
                    Nome do Arquivo de Saída (sem extensão)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="outputFilename"
                    name="outputFilename"
                    value={formData.outputFilename}
                    onChange={handleChange}
                    placeholder="Ex: entrega1"
                    required
                  />
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
                Os arquivos foram gerados na pasta <code>arquivos-entrega</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
