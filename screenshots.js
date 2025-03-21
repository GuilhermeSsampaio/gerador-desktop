const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Configuração da pasta para screenshots
const screenshotDir = path.join(__dirname, "screenshots");
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir);
}

/**
 * Tira um screenshot e salva com o nome especificado.
 */
async function takeScreenshot(page, filename) {
  const screenshotPath = path.join(screenshotDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`✅ Screenshot salvo em: ${screenshotPath}`);
  return screenshotPath;
}

/**
 * Abre uma página no URL informado e retorna o browser e a página.
 */
async function openPage(url) {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });
  return { browser, page };
}

/**
 * Seleciona uma opção do dropdown com base no texto.
 */
async function selectDropdownItem(page, dropdownSelector, optionText) {
  await page.waitForSelector(dropdownSelector);
  await page.click(dropdownSelector);
  await page.waitForSelector(".p-dropdown-panel");
  await page.evaluate((optionText) => {
    const items = Array.from(document.querySelectorAll("li.p-dropdown-item"));
    const targetItem = items.find(
      (item) => item.textContent.trim() === optionText
    );
    if (targetItem) targetItem.click();
  }, optionText);
}

/**
 * Clica em um botão que contenha o texto especificado.
 * Se contextSelector for informado, a busca é limitada a esse elemento.
 */
async function clickButtonByText(page, buttonText, contextSelector = null) {
  await page.evaluate(
    (buttonText, contextSelector) => {
      const context = contextSelector
        ? document.querySelector(contextSelector)
        : document;
      const buttons = Array.from(context.querySelectorAll("button"));
      const target = buttons.find((btn) =>
        btn.textContent.includes(buttonText)
      );
      if (target) target.click();
    },
    buttonText,
    contextSelector
  );
}

/**
 * Screenshot da página de login para usuário não cadastrado.
 */
async function screenshotLoginPage(baseUrl = "http://localhost:3000/") {
  const { browser, page } = await openPage(baseUrl);
  try {
    const screenshotPath = await takeScreenshot(page, "pagina_inicial.png");
    return screenshotPath;
  } catch (error) {
    console.error("Erro ao acessar a página inicial:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Preenche o formulário com dados errados para exibir as mensagens de erro.
 */
async function fillFormWithErrors(
  baseUrl = "http://localhost:3000",
  userType = "Maestro"
) {
  const { browser, page } = await openPage(`${baseUrl}/criar-usuario`);
  try {
    await selectDropdownItem(page, ".p-dropdown", userType);

    await page.waitForSelector('input[name="cpf"]');
    await page.type('input[name="cpf"]', "163.456.789-40");
    await page.type('input[name="nome"]', "");
    await page.type('input[name="email"]', "joaoomaestr");
    await page.type('input[name="senha"]', "senha123");
    await page.type('input[name="confirmação"]', "senha1323");
    await page.type(
      'input[name="questão"]',
      "Qual o nome do seu primeiro pet?"
    );
    await page.type('input[name="resposta"]', "Rex");

    await delay(100);
    await clickButtonByText(page, "Salvar");
    await delay(100);
    const screenshotPath = await takeScreenshot(
      page,
      "formulario_enviado_erros.png"
    );
    return screenshotPath;
  } catch (error) {
    console.error("Erro ao preencher e enviar o formulário:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Preenche o formulário corretamente, exibe o modal de confirmação e, após confirmação,
 * preenche os dados específicos da próxima tela.
 */
async function fillFormCorrectly(
  baseUrl = "http://localhost:3000",
  userType = "Maestro",
  formData = {},
  specificData = {}
) {
  const { browser, page } = await openPage(`${baseUrl}/criar-usuario`);
  const screenshotPaths = [];

  try {
    // Preenchimento do formulário principal
    await selectDropdownItem(page, ".p-dropdown", userType);
    await page.waitForSelector('input[name="cpf"]');

    // Usa dados fornecidos ou valores padrão
    const userData = {
      cpf: "123.456.719-49",
      nome: "João Arrocha",
      email: "joaoomaestro@gmail.com",
      senha: "senha123",
      confirmacao: "senha123",
      questao: "Qual o nome do seu primeiro pet?",
      resposta: "Rex",
      ...formData,
    };

    await page.type('input[name="cpf"]', userData.cpf);
    await page.type('input[name="nome"]', userData.nome);
    await page.type('input[name="email"]', userData.email);
    await page.type('input[name="senha"]', userData.senha);
    await page.type('input[name="confirmação"]', userData.confirmacao);
    await page.type('input[name="questão"]', userData.questao);
    await page.type('input[name="resposta"]', userData.resposta);

    await delay(100);
    screenshotPaths.push(
      await takeScreenshot(page, "form_preenchido_corretamente.png")
    );

    // Exibe o modal de confirmação e clica em "Salvar" nele
    const confirmPath = await showConfirmationModal(page);
    screenshotPaths.push(confirmPath);

    // Após confirmação, preenche dados específicos na próxima tela
    const specificPaths = await fillSpecificData(page, specificData);
    screenshotPaths.push(...specificPaths);

    return screenshotPaths;
  } catch (error) {
    console.error("Erro ao preencher o formulário corretamente:", error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Exibe o modal de confirmação, ajusta o zoom para caber a tela e tira um screenshot.
 * Em seguida, clica no botão "Salvar" dentro do modal.
 */
async function showConfirmationModal(page) {
  // Abre o modal de confirmação clicando em "Salvar" no formulário
  await clickButtonByText(page, "Salvar");
  await page.waitForSelector(".p-dialog.p-component", { visible: true });
  await delay(100);
  // Ajusta o zoom para visualizar o modal e o backdrop
  await page.evaluate(() => {
    document.body.style.zoom = "0.65";
  });
  await delay(100);
  const screenshotPath = await takeScreenshot(page, "conferir.png");
  await delay(100);
  // Clica em "Salvar" dentro do modal para confirmar
  await clickButtonByText(page, "Salvar", ".p-dialog.p-component");
  await delay(100);
  return screenshotPath;
}

/**
 * Preenche os dados específicos da próxima tela após a confirmação do modal.
 */
async function fillSpecificData(page, specificData = {}) {
  const screenshotPaths = [];
  const data = {
    estilo: { value: "Elegante", inputType: "dropdown" },
    origem: { value: "Brasileiro", inputType: "dropdown" },
    anos_experiência: { value: "20", inputType: "input" },
    ...specificData,
  };

  const dropdowns = await page.$$(".p-dropdown"); // Seleciona todos os dropdowns na página

  let dropdownIndex = 0; // Índice para iterar sobre os dropdowns encontrados

  for (const [key, { value, inputType }] of Object.entries(data)) {
    if (inputType === "dropdown") {
      const dropdown = dropdowns[dropdownIndex];
      if (dropdown) {
        await dropdown.click(); // Abre o dropdown
        await page.waitForSelector(".p-dropdown-panel");
        await page.evaluate((optionText) => {
          const items = Array.from(
            document.querySelectorAll("li.p-dropdown-item")
          );
          const targetItem = items.find(
            (item) => item.textContent.trim() === optionText
          );
          if (targetItem) targetItem.click();
        }, value);
        dropdownIndex++; // Avança para o próximo dropdown
      } else {
        console.warn(`Dropdown não encontrado para a chave: ${key}`);
      }
    } else if (inputType === "input") {
      const inputSelector = `input[name="${key}"]`;
      await page.waitForSelector(inputSelector);
      await fillInputNumberUsingKeyboard(page, inputSelector, value);
    }
  }

  screenshotPaths.push(await takeScreenshot(page, "dados_especificos.png"));
  await delay(2000);
  await clickButtonByText(page, "Cadastrar");
  screenshotPaths.push(await takeScreenshot(page, "cadastro_finalizado.png"));

  return screenshotPaths;
}

// Função auxiliar para preencher o InputNumber via teclado
async function fillInputNumberUsingKeyboard(page, selector, value) {
  await page.waitForSelector(selector);
  // Foca no input
  await page.focus(selector);
  // Seleciona todo o conteúdo do input (para limpar)
  await page.click(selector, { clickCount: 3 });
  // Pressiona Backspace para remover o valor existente
  await page.keyboard.press("Backspace");
  // Digita o novo valor
  await page.keyboard.type(value);
  // Dispara o blur para que o componente atualize (opcional)
  await page.keyboard.press("Tab");
}

/**
 * Função principal que executa os testes desejados.
 */
async function executarTestes(options = {}) {
  const { baseUrl, userType, formData, specificData } = options;

  const screenshotPaths = [];

  try {
    // Captura página de login
    const loginPath = await screenshotLoginPage(baseUrl);
    screenshotPaths.push(loginPath);

    // Captura formulário com erros
    const errorPath = await fillFormWithErrors(baseUrl, userType);
    screenshotPaths.push(errorPath);

    // Captura fluxo completo de formulário preenchido corretamente
    const formPaths = await fillFormCorrectly(
      baseUrl,
      userType,
      formData,
      specificData
    );
    screenshotPaths.push(...formPaths);

    return screenshotPaths;
  } catch (error) {
    console.error("Erro durante execução dos testes:", error);
    throw error;
  }
}

// Exportar funções para uso no electron
module.exports = {
  executarTestes,
  screenshotLoginPage,
  fillFormWithErrors,
  fillFormCorrectly,
  screenshotDir,
};
