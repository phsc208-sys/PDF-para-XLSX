// Configuração do Worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// Variáveis de Estado Global
var pdfDoc = null;          // O documento PDF carregado
var pagAtual = 1;           // Página atual sendo visualizada
var totalPags = 0;          // Total de páginas
var escala = 1.3;           // Zoom da visualização
var alturaPagina = 0;       // Altura em pixels da página atual
var itensPaginaAtual = [];  // Cache dos textos da página atual (para desenhar na tela)

// Marcadores de Limite Global
// Se pag === null, o limite não está ativo
var startMarker = { pag: null, y: -1 }; 
var endMarker = { pag: null, y: 99999 };

// Ferramenta Ativa na UI ('top', 'bottom' ou null)
var modoFerramenta = null;