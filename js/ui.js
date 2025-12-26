// --- INTERFACE DE USUÁRIO (UI) ---

// 1. Renderiza o texto na tela (com filtro visual)
function recalcularLinhas() {
    if (!itensPaginaAtual || itensPaginaAtual.length === 0) return;
    const tol = parseInt(document.getElementById('tolerancia').value);
    document.getElementById('tolVal').innerText = tol + "px";

    // Filtra o que aparece na tela baseado nos limites
    let itensFiltrados = itensPaginaAtual.filter(item => {
        const yVisual = (alturaPagina - item.y) * escala;
        // Se o limite de Início for nesta página, esconde o que está acima
        if (startMarker.pag === pagAtual && yVisual < (startMarker.y - 5)) return false;
        // Se o limite de Fim for nesta página, esconde o que está abaixo
        if (endMarker.pag === pagAtual && yVisual > (endMarker.y + 5)) return false;
        return true;
    });

    itensFiltrados.sort((a,b) => b.y - a.y);
    
    let linhasVisuais = [];
    if (itensFiltrados.length > 0) {
        let atual = { base: itensFiltrados[0].y, topo: itensFiltrados[0].y, itens: [itensFiltrados[0]] };
        for(let i=1; i<itensFiltrados.length; i++) {
            const item = itensFiltrados[i];
            if (Math.abs(atual.base - item.y) <= tol) {
                atual.itens.push(item);
                if (item.y < atual.base) atual.base = item.y;
            } else {
                linhasVisuais.push(atual);
                atual = { base: item.y, topo: item.y, itens: [item] };
            }
        }
        linhasVisuais.push(atual);
    }
    desenharWorkspace(linhasVisuais);
}

function desenharWorkspace(linhas) {
    const container = document.getElementById('page-container');
    if(!container) return;

    // Salva elementos interativos (colunas e limites)
    const cols = document.querySelectorAll('.col-sep');
    const limits = document.querySelectorAll('.limit-line');
    
    container.innerHTML = ""; 
    cols.forEach(c => container.appendChild(c));
    limits.forEach(l => container.appendChild(l));

    if(!linhas) return;

    linhas.forEach(linha => {
        const div = document.createElement('div');
        div.className = 'pdf-row';
        const yTela = (alturaPagina - linha.topo) * escala;
        const hTela = (linha.topo - linha.base) * escala + 12;
        div.style.top = yTela + "px"; div.style.height = hTela + "px";
        
        linha.itens.forEach(item => {
            const span = document.createElement('span');
            span.className = 'pdf-item';
            span.innerText = item.str;
            span.style.left = (item.x * escala) + "px";
            span.style.top = (((alturaPagina - item.y) * escala) - yTela) + "px";
            div.appendChild(span);
        });
        container.appendChild(div);
    });
}

// 2. Interação de Clique
function ativarModo(modo) {
    modoFerramenta = modo;
    document.getElementById('btnTop').className = modo==='top' ? 'btn-tool active-top' : 'btn-tool';
    document.getElementById('btnBottom').className = modo==='bottom' ? 'btn-tool active-bottom' : 'btn-tool';
}

function cliqueWorkspace(e) {
    // Ignora clique em elementos já existentes
    if(e.target.classList.contains('col-sep') || e.target.classList.contains('limit-line')) return;

    const container = document.getElementById('page-container');
    if(!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Modo Início
    if (modoFerramenta === 'top') {
        startMarker = { pag: pagAtual, y: y };
        modoFerramenta = null;
        document.getElementById('btnTop').className = 'btn-tool';
        desenharLimites();
        recalcularLinhas();
    } 
    // Modo Fim
    else if (modoFerramenta === 'bottom') {
        endMarker = { pag: pagAtual, y: y };
        modoFerramenta = null;
        document.getElementById('btnBottom').className = 'btn-tool';
        desenharLimites();
        recalcularLinhas();
    } 
    // Modo Coluna (Padrão)
    else {
        // Proteção contra clique duplo (colunas muito perto)
        let colunasExistem = document.querySelectorAll('.col-sep');
        let muitoPerto = false;
        colunasExistem.forEach(col => {
            let colX = parseFloat(col.style.left);
            if (Math.abs(colX - x) < 10) muitoPerto = true;
        });

        if (!muitoPerto) {
            const l = document.createElement('div');
            l.className = 'col-sep'; l.style.left = x + "px";
            l.title = "Clique para remover";
            l.onclick = (evt) => { evt.stopPropagation(); l.remove(); };
            container.appendChild(l);
        }
    }
}

function desenharLimites() {
    const container = document.getElementById('page-container');
    if(!container) return;

    // Remove antigos
    document.querySelectorAll('.limit-line').forEach(e => e.remove());

    if (startMarker.pag === pagAtual) {
        let l = document.createElement('div');
        l.className = 'limit-line limit-top';
        l.style.top = startMarker.y + "px";
        l.innerHTML = '<span class="limit-label">INÍCIO</span>';
        l.onclick = (e) => { e.stopPropagation(); startMarker = {pag:null, y:-1}; desenharLimites(); recalcularLinhas(); };
        container.appendChild(l);
    }

    if (endMarker.pag === pagAtual) {
        let l = document.createElement('div');
        l.className = 'limit-line limit-bottom';
        l.style.top = endMarker.y + "px";
        l.innerHTML = '<span class="limit-label">FIM</span>';
        l.onclick = (e) => { e.stopPropagation(); endMarker = {pag:null, y:99999}; desenharLimites(); recalcularLinhas(); };
        container.appendChild(l);
    }
}

function limparTudo() {
    document.querySelectorAll('.col-sep').forEach(e => e.remove());
    startMarker = { pag: null, y: -1 };
    endMarker = { pag: null, y: 99999 };
    desenharLimites();
    recalcularLinhas();
}