# 📄 PDF para XLSX - Extrator Visual de Tabelas

![Status do Projeto](https://img.shields.io/badge/status-concluído-success)
![Licença](https://img.shields.io/badge/license-GPLv3-blue)
![Tecnologia](https://img.shields.io/badge/tech-Javascript%20%7C%20PDF.js%20%7C%20SheetJS-yellow)

Uma ferramenta web moderna e interativa para converter tabelas de arquivos PDF em planilhas Excel (.xlsx). Todo o processamento é feito **localmente no seu navegador**, garantindo velocidade e privacidade dos dados.

Diferente de conversores genéricos, esta ferramenta oferece um **sistema de grid visual**, permitindo definir exatamente onde começam e terminam as colunas e linhas, ideal para PDFs com formatação complexa.

---

## 🚀 Funcionalidades Principais

### 🎯 Controle Total da Extração
* **Definição de Área:** Marque visualmente o **Início** e o **Fim** da tabela para ignorar cabeçalhos e rodapés indesejados.
* **Colunas Manuais:** O sistema sugere colunas, mas você pode **clicar no papel** para criar novas linhas divisórias (linhas azuis) ou remover as existentes.
* **Limpeza de Linhas:** Clique em qualquer linha horizontal de texto para excluí-la da extração (útil para remover subtítulos ou sujeira).

### 🛠️ Ajustes Finos
* **Tolerância de Altura:** Ajuste a sensibilidade para agrupar textos que estão levemente desalinhados na vertical.
* **Unir Quebras:** Opção para detectar e unir textos que foram quebrados em múltiplas linhas dentro da mesma célula.
* **Cabeçalho Automático:** Opção para definir a primeira linha extraída como o cabeçalho da planilha.

### 📦 Gerenciamento de Arquivos
* **Múltiplas Abas:** Extraia tabelas de diferentes páginas e salve-as como abas diferentes no mesmo arquivo Excel final.
* **Pré-visualização:** Veja como os dados ficarão organizados antes de fazer o download.
* **Zoom e Navegação:** Interface fluida com controles de zoom para visualizar detalhes pequenos.

---

## 🖼️ Como Usar

1.  **Carregar:** Clique em "Carregar PDF" e selecione seu arquivo.
2.  **Delimitar:**
    * Clique em **"1. Marcar Início"** e clique no PDF logo acima da tabela.
    * Clique em **"2. Marcar Fim"** e clique logo abaixo da tabela.
3.  **Ajustar Colunas:**
    * Se faltar uma separação de coluna, clique no espaço em branco entre os textos para criar uma **linha azul vertical**.
    * Para remover uma coluna, clique sobre a linha azul.
4.  **Refinar:**
    * Use o **Preview** para verificar os dados.
    * Ajuste a "Altura Linha" se o texto estiver sendo quebrado erradamente.
5.  **Baixar:** Clique em "Baixar Excel".

---

## 🛠️ Instalação e Execução

Este é um projeto **estático** (HTML/CSS/JS puro). Não requer instalação de backend (Node.js, Python, PHP, etc).

### Opção 1: Uso Simples
Basta baixar o código e abrir o arquivo `index.html` diretamente no seu navegador (Chrome, Firefox, Edge).

### Opção 2: Servidor Local (Recomendado)
Para evitar bloqueios de segurança de alguns navegadores (CORS) ao carregar fontes ou workers, recomenda-se usar um servidor simples.
