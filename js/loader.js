// --- CARREGAMENTO E NAVEGAÇÃO ---

async function carregarPDF(input) {
    if (!input.files[0]) return;
    const buffer = await input.files[0].arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument(buffer).promise;
    totalPags = pdfDoc.numPages;
    
    // Reset Geral
    pagAtual = 1;
    regioes = [];
    planilhasSalvas = []; 
    atualizarContadorPlanilhas();
    
    // Atualiza o total de páginas na tela
    const totalEl = document.getElementById('totalPags');
    if(totalEl) totalEl.innerText = totalPags;
    
    limparTudo();
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

async function irParaPagina() {
    if (!pdfDoc) return;
    
    const input = document.getElementById('pagInput');
    let valor = parseInt(input.value);

    if (valor >= 1 && valor <= totalPags) {
        pagAtual = valor;
        await carregarPagina(pagAtual);
    } else {
        input.value = pagAtual; // Se inválido, volta
    }
}

async function carregarPagina(num) {
    // Atualiza o input com o número da página
    const input = document.getElementById('pagInput');
    if(input) input.value = num;
    
    const page = await pdfDoc.getPage(num);
    const viewport = page.getViewport({ scale: 1.0 });
    alturaPagina = viewport.height;
    const content = await page.getTextContent();

    const ws = document.getElementById('workspace');
    
    // Remove msg inicial se existir
    const msg = document.getElementById('msgInicial');
    if(msg) {
        msg.classList.remove('d-flex');
        msg.style.display = 'none';
    }

    let container = document.getElementById('page-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'page-container';
        container.style.position = 'relative';
        ws.appendChild(container);
    }

    // Aplica o tamanho baseado na escala (zoom)
    container.style.width = (viewport.width * escala) + "px";
    container.style.height = (viewport.height * escala) + "px";
    ws.style.width = (viewport.width * escala) + "px";
    ws.style.height = (viewport.height * escala) + "px";

    itensPaginaAtual = content.items.map(i => ({ 
        str: i.str, 
        x: i.transform[4], 
        y: i.transform[5] 
    }));
    
    recalcularLinhas();
    desenharLimites();
}

// NOVA FUNÇÃO: Controle de Zoom
async function mudarEscala(delta) {
    if (!pdfDoc) return;

    let novaEscala = escala + delta;
    
    // Limites de segurança (entre 50% e 300%)
    if (novaEscala < 0.5) novaEscala = 0.5;
    if (novaEscala > 3.0) novaEscala = 3.0;
    
    escala = novaEscala;
    
    // Atualiza o mostrador na tela
    const display = document.getElementById('displayZoom');
    if(display) display.innerText = Math.round(escala * 100) + "%";

    // Recarrega a página com o novo tamanho
    await carregarPagina(pagAtual);
}