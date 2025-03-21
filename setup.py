import os
import subprocess
import sys


def activate_and_install_dependencies(venv_dir):
    # Ativar o ambiente virtual
    if os.name == "nt":  # Windows
        activate_script = os.path.join(venv_dir, "Scripts", "activate")
    else:  # macOS/Linux
        activate_script = os.path.join(venv_dir, "bin", "activate")

    print(f"Ativando o ambiente virtual: {activate_script}")
    activate_command = (
        f"{activate_script} && " if os.name != "nt" else f"call {activate_script} && "
    )

    # Instalar as dependências do requirements.txt
    requirements_file = "requirements.txt"
    if os.path.exists(requirements_file):
        print("Instalando dependências do requirements.txt...")
        subprocess.check_call(
            f"{activate_command} pip install -r {requirements_file}", shell=True
        )
    else:
        print(
            f"Arquivo {requirements_file} não encontrado. Nenhuma dependência foi instalada."
        )


def main():
    # Nome do ambiente virtual
    venv_dir = "venv"

    # Verificar se o ambiente virtual já existe
    if os.path.exists(venv_dir):
        print(
            f"O ambiente virtual '{venv_dir}' já existe. Ativando e instalando dependências..."
        )
        activate_and_install_dependencies(venv_dir)
    else:
        # Criar o ambiente virtual
        print("Criando o ambiente virtual...")
        subprocess.check_call([sys.executable, "-m", "venv", venv_dir])

        # Ativar e instalar dependências
        activate_and_install_dependencies(venv_dir)


if __name__ == "__main__":
    main()
