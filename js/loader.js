// --- CARREGAMENTO E NAVEGAÇÃO ---

async function carregarPDF(input) {
    if (!input.files[0]) return;
    const buffer = await input.files[0].arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument(buffer).promise;
    totalPags = pdfDoc.numPages;
    
    // Reset ao carregar novo arquivo
    pagAtual = 1;
    startMarker = { pag: null, y: -1 };
    endMarker = { pag: null, y: 99999 };
    
    // Limpa a UI antiga se houver
    limparTudo();
    
    // Carrega a primeira página
    await carregarPagina(pagAtual);
}

async function mudarPag(delta) {
    if (!pdfDoc) return;
    const nova = pagAtual + delta;
    if (nova >= 1 && nova <= totalPags) {
        pagAtual = nova;
        await carregarPagina(pagAtual);
    }
}

async function carregarPagina(num) {
    document.getElementById('pagInfo').innerText = `${num}/${totalPags}`;
    
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.0 });
    alturaPagina = viewport.height;
    const content = await page.getTextContent();

    // Configura o container da folha
    const ws = document.getElementById('workspace');
    // Remove mensagem inicial
    const msg = document.getElementById('msgInicial');
    if(msg) msg.style.display = 'none';

    // Cria ou seleciona o container da página
    let container = document.getElementById('page-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'page-container';
        container.style.position = 'relative';
        container.style.backgroundColor = 'white';
        container.style.boxShadow = '0 0 20px rgba(0,0,0,0.5)';
        ws.appendChild(container);
    }

    container.style.width = (viewport.width * escala) + "px";
    container.style.height = (viewport.height * escala) + "px";

    // Extrai dados para a UI usar
    itensPaginaAtual = content.items.map(i => ({ 
        str: i.str, 
        x: i.transform[4], 
        y: i.transform[5] 
    }));
    
    // Chama funções do ui.js para desenhar
    recalcularLinhas();
    desenharLimites();
}