# Gerador de Documentação Automática

Este projeto gera documentos Word e PDF contendo códigos-fonte organizados a partir de diretórios específicos, formatando os arquivos corretamente e incluindo uma assinatura ao final.

## Funcionalidades

- Gera um documento `.docx` e um `.pdf` automaticamente.
- Ordena arquivos e pastas alfabeticamente.
- Formata corretamente os títulos e o conteúdo dos arquivos.
- Ignora diretórios `node_modules` e arquivos `.env` (exceto quando explicitamente solicitado).
- Inclui cabeçalho centralizado e um rodapé com local, data e assinatura.

## Tecnologias Utilizadas

- Python
- `python-docx` (para gerar documentos Word)
- `docx2pdf` (para converter Word para PDF)

## Instalação

1. Clone o repositório (dentro da pasta de LPIII - que deve contar os subdiretórios front-end e back-end):

```sh
git clone [https://github.com/GuilhermeSsampaio/gerador-documents-lp.git](https://github.com/GuilhermeSsampaio/gerador)
cd gerador
```

2. Execute o script principal para gerar os documentos:
crie o venv:
```sh
python -m venv venv

```
```sh
python startGerador.py
```

3. Insira seu nome e o número da entrega

4. Revise os docs

5. Assine

Os arquivos serão gerados na pasta raiz do projeto (DO GERADOR).

## Estrutura dos Arquivos Gerados

- O documento gerado contém um cabeçalho com o título do trabalho.
- Cada arquivo é listado em uma página separada com seu nome formatado como `diretório.arquivo : nome_do_arquivo`.
- No final, há uma seção com a data e um espaço para assinatura.

## Corrigir

- corrigir a ordem que aparecem os arquivos

## Licença

Este projeto está sob a licença MIT. Veja o arquivo LICENSE para mais detalhes.
