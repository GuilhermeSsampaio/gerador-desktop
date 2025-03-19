import os
import datetime
import argparse
from docx2pdf import convert
import format_docx as doc_format
from functools import (
    cmp_to_key,
)  # Importa a ferramenta para usar comparação customizada
import locale

# Define a localidade para português do Brasil
try:
    locale.setlocale(locale.LC_COLLATE, "pt_BR.UTF-8")
except:
    try:
        locale.setlocale(locale.LC_COLLATE, "Portuguese_Brazil.1252")
    except:
        pass  # Se não conseguir configurar a localidade, usa a padrão


def parse_args():
    """Processa os argumentos da linha de comando"""
    parser = argparse.ArgumentParser(description="Gerador de documentação automática")
    parser.add_argument("--name", required=True, help="Nome completo do aluno")
    parser.add_argument("--entrega", required=True, help="Número da entrega")
    parser.add_argument(
        "--include-dirs",
        required=True,
        help="Diretórios a incluir (caminhos completos separados por vírgula)",
    )
    parser.add_argument(
        "--output", required=True, help="Nome do arquivo de saída (sem extensão)"
    )
    parser.add_argument(
        "--include-env", action="store_true", help="Incluir arquivos .env"
    )
    return parser.parse_args()


def add_file_to_doc(doc, base_dir, file_path, add_page_break=True):
    """Adiciona o conteúdo de um arquivo ao documento."""
    if add_page_break:
        doc_format.add_page_break(doc)

    # Determina e formata o caminho relativo para exibição
    try:
        relative_path = os.path.splitext(os.path.relpath(file_path, base_dir))[
            0
        ].replace(os.sep, ".")
    except ValueError:  # Se não for possível calcular um caminho relativo
        # Isso pode acontecer se os caminhos estiverem em drives diferentes
        relative_path = os.path.splitext(os.path.basename(file_path))[0]
        parent_dir = os.path.basename(os.path.dirname(file_path))
        if parent_dir:
            relative_path = f"{parent_dir}.{relative_path}"

    title_text = f"diretório.arquivo : {relative_path}"

    doc_format.add_subtitle(doc, title_text)
    doc_format.add_empty_paragraph(doc)

    try:
        # Verifica se o arquivo é uma imagem
        if file_path.lower().endswith((".png", ".jpg", ".jpeg", ".gif", ".bmp")):
            # Usa caminho absoluto para imagens
            absolute_path = os.path.abspath(file_path)
            print(f"Processando imagem: {absolute_path}")

            # Tenta adicionar a imagem com tamanho reduzido para evitar problemas
            success = doc_format.add_image(
                doc, absolute_path, width=3.5, add_page_break_after=True
            )

            if success:
                print(
                    f"Imagem adicionada com sucesso: {os.path.basename(absolute_path)}"
                )
            else:
                print(f"Falha ao adicionar imagem: {os.path.basename(absolute_path)}")

        else:
            # Para arquivos de texto
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as file:
                    content = file.read()
                    doc_format.add_paragraph_text(doc, content)
                    print(f"Arquivo de texto adicionado: {os.path.basename(file_path)}")
            except UnicodeDecodeError:
                # Se falhar ao abrir como texto, pode ser um arquivo binário
                doc_format.add_paragraph_text(
                    doc, f"[Arquivo binário não exibido: {os.path.basename(file_path)}]"
                )
                print(f"Arquivo binário ignorado: {os.path.basename(file_path)}")
    except Exception as e:
        error_msg = f"Erro ao processar o arquivo: {file_path}\n{str(e)}"
        doc_format.add_paragraph_text(doc, error_msg)
        print(f"ERRO GERAL: {error_msg}")


def collect_files(dirs_list, include_env):
    """Coleta arquivos de múltiplos diretórios."""
    all_files = []

    # Diretórios que devem ser ignorados
    exclude_dirs = [
        "node_modules",
        ".git",
        ".vscode",
        "__pycache__",
        "venv",
        "dist",
        "build",
        ".next",
    ]

    # Arquivos que devem ser ignorados
    exclude_files = [
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
    ]

    # Agora vamos percorrer cada diretório na lista
    for base_dir in dirs_list:
        if not os.path.exists(base_dir):
            print(f"Aviso: Diretório '{base_dir}' não existe.")
            continue

        print(f"Processando diretório: {base_dir}")
        # Verifica também o diretório de imagens dentro do diretório atual
        images_dir = os.path.join(base_dir, "imagens")
        if os.path.exists(images_dir) and os.path.isdir(images_dir):
            print(f"Diretório de imagens encontrado: {images_dir}")

        for root, dirs, files in os.walk(base_dir):
            # Pular diretórios excluídos
            dirs[:] = [d for d in dirs if d not in exclude_dirs]

            for file in files:
                if file in exclude_files:
                    continue
                if file.endswith(".env") and not include_env:
                    continue

                file_path = os.path.join(root, file)
                # Calcula a profundidade relativa ao diretório base atual
                try:
                    relative_path = os.path.relpath(root, base_dir)
                    depth = (
                        len(relative_path.split(os.sep)) if relative_path != "." else 0
                    )
                except ValueError:
                    # Se não puder calcular o caminho relativo (ex: drives diferentes)
                    relative_path = os.path.basename(root)
                    depth = 1

                # Armazena junto com o diretório base para gerar caminhos relativos depois
                all_files.append((depth, relative_path, file, file_path, base_dir))
                print(f"Arquivo adicionado: {file_path}")

    # Função de comparação adaptada para a nova estrutura
    def compare_items(item1, item2):
        base_dir1 = item1[4]
        base_dir2 = item2[4]
        r1 = item1[1]  # relative_path do primeiro item
        r2 = item2[1]  # relative_path do segundo item

        # Primeiro, ordenar por diretório base
        if base_dir1 != base_dir2:
            return -1 if base_dir1 < base_dir2 else 1

        # Agora, para o mesmo diretório base, use a lógica anterior
        if r1 == r2:
            return locale.strcoll(item1[2].lower(), item2[2].lower())

        if r1 == "." and r2 != ".":
            return 1
        if r2 == "." and r1 != ".":
            return -1

        if r1.startswith(r2 + os.sep):
            return -1
        if r2.startswith(r1 + os.sep):
            return 1

        return locale.strcoll(r1, r2)

    # Ordena os arquivos
    all_files_sorted = sorted(all_files, key=cmp_to_key(compare_items))

    # Retorna a lista de arquivos com seu diretório base correspondente
    return [
        (base_dir, file_path)
        for depth, rel_path, file, file_path, base_dir in all_files_sorted
    ]


def generate_document(
    dirs_list, output_filename, include_env=True, name="", entrega=""
):
    """Gera a documentação para os diretórios especificados."""
    doc = doc_format.create_document()

    title = "Linguagem de Programação III - Entrega " + entrega + " - " + name
    doc_format.add_title(doc, title)
    doc_format.add_empty_paragraph(doc)

    print(f"Gerando documentação para os diretórios: {dirs_list}")

    # Coletamos arquivos de todos os diretórios
    files_list = collect_files(dirs_list, include_env)

    if not files_list:
        doc_format.add_paragraph_text(
            doc, "Nenhum arquivo encontrado nos diretórios selecionados."
        )
    else:
        first_file = True
        for base_dir, file_path in files_list:
            add_file_to_doc(doc, base_dir, file_path, add_page_break=not first_file)
            first_file = False

    doc_format.add_empty_paragraph(doc)
    date_str = datetime.datetime.now().strftime("%d/%m/%Y")
    doc_format.add_paragraph_text(doc, f"Dourados, {date_str} -- (Assinatura)")

    output_dir = "arquivos-entrega"
    os.makedirs(output_dir, exist_ok=True)

    docx_path = os.path.join(output_dir, f"{output_filename}.docx")
    pdf_path = os.path.join(output_dir, f"{output_filename}.pdf")

    doc_format.save_document(doc, docx_path)
    print(f"Documento DOCX salvo em: {docx_path}")

    try:
        convert(docx_path, pdf_path)
        print(f"Documento PDF salvo em: {pdf_path}")
    except Exception as e:
        print(f"Erro ao converter para PDF: {str(e)}")


if __name__ == "__main__":
    args = parse_args()
    include_dirs = args.include_dirs.split(",")
    include_dirs = [dir.strip() for dir in include_dirs if dir.strip()]

    print("Diretórios a serem processados:", include_dirs)

    generate_document(
        include_dirs, args.output, args.include_env, args.name, args.entrega
    )
