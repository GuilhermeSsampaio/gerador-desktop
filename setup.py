import os
import sys
import subprocess
import platform


def create_venv():
    """Cria um ambiente virtual para o projeto."""
    if not os.path.exists("venv"):
        print("Criando ambiente virtual...")
        try:
            subprocess.check_call([sys.executable, "-m", "venv", "venv"])
            print("Ambiente virtual criado com sucesso!")
        except subprocess.CalledProcessError:
            print(
                "Erro ao criar o ambiente virtual. Verifique se o módulo venv está instalado."
            )
            print("Você pode instalá-lo com: pip install virtualenv")
            sys.exit(1)
    else:
        print("O ambiente virtual já existe.")


def install_dependencies():
    """Instala as dependências do projeto."""
    print("Instalando dependências...")

    # Determina o comando de ativação do ambiente virtual conforme o sistema operacional
    if platform.system() == "Windows":
        pip_path = os.path.join("venv", "Scripts", "pip")
    else:
        pip_path = os.path.join("venv", "bin", "pip")

    # Atualiza pip
    try:
        subprocess.check_call([pip_path, "install", "--upgrade", "pip"])
    except subprocess.CalledProcessError:
        print("Erro ao atualizar o pip. Continuando mesmo assim...")

    # Verifica se requirements.txt existe e está em formato válido
    req_file_valid = os.path.exists("requirements.txt")

    try:
        if req_file_valid:
            with open("requirements.txt", "r", encoding="utf-8") as f:
                content = f.read()
                # Verifica se o arquivo parece estar corrompido
                if "��" in content or "  " in content:
                    print("AVISO: O arquivo requirements.txt parece estar corrompido.")
                    req_file_valid = False
    except:
        req_file_valid = False
        print("AVISO: Não foi possível ler o arquivo requirements.txt")

    # Instala pacotes essenciais independentemente do requirements.txt
    print("Instalando pacotes essenciais...")
    essential_packages = [
        "python-docx",
        "pillow",
        "reportlab",
        "lxml",
        "tqdm",
        "colorama",
    ]

    for package in essential_packages:
        try:
            subprocess.check_call([pip_path, "install", package])
            print(f"✓ {package} instalado com sucesso")
        except:
            print(f"✗ Erro ao instalar {package}")

    # Tenta instalar docx2pdf, mas não falha se não conseguir
    print("\nTentando instalar docx2pdf (conversão DOCX para PDF)...")
    try:
        subprocess.check_call([pip_path, "install", "docx2pdf"])
        print("✓ docx2pdf instalado com sucesso")
    except:
        print("✗ Não foi possível instalar docx2pdf")
        print("\nAVISO: A conversão para PDF não estará disponível.")
        print("O programa continuará funcionando, mas gerará apenas arquivos DOCX.")
        print("Se desejar a funcionalidade de PDF, execute manualmente:")
        print(f"{pip_path} install docx2pdf")

    # Caso o requirements.txt seja válido, tenta instalá-lo também
    if req_file_valid:
        try:
            print("\nInstalando dependências do requirements.txt...")
            subprocess.check_call([pip_path, "install", "-r", "requirements.txt"])
            print(
                "Todas as dependências do requirements.txt foram instaladas com sucesso!"
            )
        except subprocess.CalledProcessError:
            print(
                "AVISO: Houve erros ao instalar algumas dependências do requirements.txt."
            )
            print("O programa pode funcionar parcialmente.")


def install_node_dependencies():
    """Instala as dependências do Node.js."""
    print("\nInstalando dependências do Node.js...")
    try:
        subprocess.check_call(["npm", "install"])
        print("Dependências do Node.js instaladas com sucesso!")
    except subprocess.CalledProcessError:
        print("Erro ao instalar dependências do Node.js.")
        print(
            "Verifique se o Node.js está instalado e o arquivo package.json está correto."
        )
    except FileNotFoundError:
        print("AVISO: npm não encontrado. Verifique se o Node.js está instalado.")


def main():
    """Função principal."""
    print("=== Configurando ambiente de desenvolvimento ===")

    create_venv()
    install_dependencies()
    install_node_dependencies()

    print("\n=== Tudo pronto! ===")
    print("Para executar o projeto:")
    print("1. Ative o ambiente virtual:")
    if platform.system() == "Windows":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Execute o projeto:")
    print("   npm start")


if __name__ == "__main__":
    main()
