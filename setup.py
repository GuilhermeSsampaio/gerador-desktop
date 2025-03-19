import os
import sys
import subprocess
import platform


def create_venv():
    """Cria um ambiente virtual para o projeto."""
    if not os.path.exists("venv"):
        print("Criando ambiente virtual...")
        subprocess.check_call([sys.executable, "-m", "venv", "venv"])
        print("Ambiente virtual criado com sucesso!")
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
    subprocess.check_call([pip_path, "install", "--upgrade", "pip"])

    # Instala as dependências do requirements.txt
    subprocess.check_call([pip_path, "install", "-r", "requirements.txt"])

    print("Dependências instaladas com sucesso!")


def install_node_dependencies():
    """Instala as dependências do Node.js."""
    print("Instalando dependências do Node.js...")
    subprocess.check_call(["npm", "install"])
    print("Dependências do Node.js instaladas com sucesso!")


def main():
    """Função principal."""
    print("Configurando ambiente de desenvolvimento...")

    create_venv()
    install_dependencies()
    install_node_dependencies()

    print("\nTudo pronto! Para executar o projeto:")
    print("1. Ative o ambiente virtual:")
    if platform.system() == "Windows":
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")
    print("2. Execute o projeto:")
    print("   npm start")


if __name__ == "__main__":
    main()
