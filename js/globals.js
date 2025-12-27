// Configuração do Worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

// --- VARIÁVEIS GLOBAIS ---
var pdfDoc = null;          
var pagAtual = 1;           
var totalPags = 0;          
var escala = 1.3;           
var alturaPagina = 0;       
var itensPaginaAtual = [];  

// Controle de Múltiplos Blocos (Regiões) na Planilha Atual
var regioes = []; 

// LISTA DE PLANILHAS SALVAS (Para o Excel final)
var planilhasSalvas = [];

// Ferramenta Ativa
var modoFerramenta = null;

// NOVA VARIÁVEL: Armazena faixas de Y que o usuário excluiu
var linhasIgnoradas = [];