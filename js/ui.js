// --- INTERFACE DE USUÁRIO (UI) ---

function recalcularLinhas() {
    if (!itensPaginaAtual || itensPaginaAtual.length === 0) return;
    
    const inputTol = document.getElementById('tolerancia');
    let tol = parseInt(inputTol.value);
    if(isNaN(tol) || tol < 2) tol = 2;
    document.getElementById('tolerancia').value = tol;

    let mostrarTudo = regioes.length === 0;

    let itensFiltrados = itensPaginaAtual.filter(item => {
        // 1. Filtro de Regiões (Blocos)
        const yVisual = (alturaPagina - item.y) * escala;
        let dentroRegiao = false;
        
        if (mostrarTudo) {
            dentroRegiao = true;
        } else {
            for (let reg of regioes) {
                let startOk = true; 
                let endOk = true;
                if (reg.inicio) {
                    if (pagAtual < reg.inicio.pag) startOk = false;
                    if (pagAtual === reg.inicio.pag && yVisual < (reg.inicio.y - 5)) startOk = false;
                }
                if (reg.fim) {
                    if (pagAtual > reg.fim.pag) endOk = false;
                    if (pagAtual === reg.fim.pag && yVisual > (reg.fim.y + 5)) endOk = false;
                }
                if (startOk && endOk) { dentroRegiao = true; break; }
            }
        }
        if (!dentroRegiao) return false;

        // 2. Filtro de Linhas Ignoradas (Exclusão Manual)
        // Se o Y do item estiver dentro de qualquer faixa ignorada (+- 2px de tolerância)
        for (let faixa of linhasIgnoradas) {
            if (item.y <= faixa.topo + 2 && item.y >= faixa.base - 2) {
                return false; // Item excluído
            }
        }

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
                if (item.y > atual.topo) atual.topo = item.y;
            } else {
                linhasVisuais.push(atual);
                atual = { base: item.y, topo: item.y, itens: [item] };
            }
        }
        linhasVisuais.push(atual);
    }
    desenharWorkspace(linhasVisuais);
}

function ajustarTolerancia(delta) {
    const input = document.getElementById('tolerancia');
    let val = parseInt(input.value) || 10;
    val += delta;
    if(val < 2) val = 2;
    if(val > 100) val = 100;
    input.value = val;
    recalcularLinhas();
}

function desenharWorkspace(linhas) {
    const container = document.getElementById('page-container');
    if(!container) return;

    const cols = document.querySelectorAll('.col-sep');
    const limits = document.querySelectorAll('.limit-line');
    
    container.innerHTML = ""; 
    cols.forEach(c => container.appendChild(c));
    limits.forEach(l => container.appendChild(l));

    if(!linhas) return;

    const tamanhoFonte = Math.max(9, 8.5 * escala); 

    linhas.forEach(linha => {
        const div = document.createElement('div');
        div.className = 'pdf-row';
        const yTela = (alturaPagina - linha.topo) * escala;
        const hTela = (linha.topo - linha.base) * escala + (14 * escala);
        
        div.style.top = yTela + "px"; 
        div.style.height = hTela + "px";
        
        // EVENTO DE CLIQUE PARA EXCLUIR
        div.title = "Clique para remover esta linha";
        div.onclick = (e) => {
            // Evita propagar para o workspace (que criaria coluna)
            e.stopPropagation(); 
            if (confirm("Deseja remover esta linha horizontal?")) {
                // Adiciona a faixa Y dessa linha à lista de ignorados
                linhasIgnoradas.push({ topo: linha.topo, base: linha.base });
                recalcularLinhas();
            }
        };

        linha.itens.forEach(item => {
            const span = document.createElement('span');
            span.className = 'pdf-item';
            span.innerText = item.str;
            span.style.fontSize = tamanhoFonte + "px";
            span.style.left = (item.x * escala) + "px";
            span.style.top = (((alturaPagina - item.y) * escala) - yTela) + "px";
            div.appendChild(span);
        });
        container.appendChild(div);
    });
}

// ... (Funções ativarModo, cliqueWorkspace permanecem iguais) ...

// Função cliqueWorkspace precisa ser mantida para criar colunas
function cliqueWorkspace(e) {
    if(e.target.classList.contains('col-sep') || e.target.classList.contains('limit-line')) return;
    // Se clicar numa linha (.pdf-row), o evento onclick dela dispara e o stopPropagation impede de chegar aqui.
    // Portanto, aqui só chega clique no "vazio" (papel branco).

    const container = document.getElementById('page-container');
    if(!container) return;
    const x = e.clientX - container.getBoundingClientRect().left;
    const y = e.clientY - container.getBoundingClientRect().top;

    if (modoFerramenta === 'top') {
        let ultima = regioes.length > 0 ? regioes[regioes.length - 1] : null;
        if (!ultima || (ultima.inicio && ultima.fim)) {
            regioes.push({ id: regioes.length + 1, inicio: { pag: pagAtual, y: y }, fim: null });
        } else {
            ultima.inicio = { pag: pagAtual, y: y };
        }
        modoFerramenta = null; ativarModo(null); desenharLimites(); recalcularLinhas();
    } 
    else if (modoFerramenta === 'bottom') {
        let ultima = regioes.length > 0 ? regioes[regioes.length - 1] : null;
        if (ultima) {
            ultima.fim = { pag: pagAtual, y: y };
        } else {
            alert("Defina o Início primeiro!");
        }
        modoFerramenta = null; ativarModo(null); desenharLimites(); recalcularLinhas();
    } 
    else {
        // Criar Coluna Manual
        let perto = false;
        document.querySelectorAll('.col-sep').forEach(c => { if(Math.abs(parseFloat(c.style.left)-x)<10) perto=true; });
        if(!perto) {
            const l = document.createElement('div');
            l.className = 'col-sep'; l.style.left = x + "px";
            l.title = "Clique para remover coluna";
            l.onclick = (evt) => { evt.stopPropagation(); l.remove(); };
            container.appendChild(l);
        }
    }
}

// ... (Função desenharLimites permanece igual) ...

function desenharLimites() {
    const container = document.getElementById('page-container');
    if(!container) return;
    document.querySelectorAll('.limit-line').forEach(e => e.remove());

    regioes.forEach((reg, index) => {
        if (reg.inicio && reg.inicio.pag === pagAtual) {
            let l = document.createElement('div');
            l.className = 'limit-line limit-top';
            l.style.top = reg.inicio.y + "px";
            l.innerHTML = `<span class="limit-tag" style="background:#198754">INÍCIO ${reg.id}</span>`;
            l.onclick = (e) => { e.stopPropagation(); if(confirm("Apagar bloco?")) { regioes.splice(index,1); desenharLimites(); recalcularLinhas(); } };
            container.appendChild(l);
        }
        if (reg.fim && reg.fim.pag === pagAtual) {
            let l = document.createElement('div');
            l.className = 'limit-line limit-bottom';
            l.style.top = reg.fim.y + "px";
            l.innerHTML = `<span class="limit-tag" style="background:#dc3545">FIM ${reg.id}</span>`;
            l.onclick = (e) => { e.stopPropagation(); if(confirm("Apagar bloco?")) { regioes.splice(index,1); desenharLimites(); recalcularLinhas(); } };
            container.appendChild(l);
        }
    });
}

function limparTudo(limparRegioes = true) {
    document.querySelectorAll('.col-sep').forEach(e => e.remove());
    if (limparRegioes) regioes = [];
    linhasIgnoradas = []; // Limpa também as exclusões manuais
    desenharLimites();
    recalcularLinhas();
}

// ... (salvarPlanilhaAtual e atualizarContadorPlanilhas permanecem iguais) ...
async function salvarPlanilhaAtual() {
    const dados = await extrairDadosGerais();
    if (!dados || dados.dados.length === 0) {
        alert("A planilha atual está vazia.");
        return;
    }
    const nome = prompt("Nome desta planilha (aba do Excel):", `Planilha ${planilhasSalvas.length + 1}`);
    if (!nome) return;
    planilhasSalvas.push({ nome: nome, dados: dados.dados, colunas: dados.numColunas });
    atualizarContadorPlanilhas();
    if(confirm("Planilha salva! Deseja limpar a tela para configurar a próxima?")) {
        limparTudo(true);
    }
}

function atualizarContadorPlanilhas() {
    const div = document.getElementById('contadorPlanilhas');
    if (planilhasSalvas.length > 0) {
        div.style.display = 'block';
        div.querySelector('span').innerText = `${planilhasSalvas.length} Planilha(s)`;
    } else {
        div.style.display = 'none';
    }
}
// 3. INTERAÇÃO E CLIQUES (Função ativarModo precisa estar disponível)
function ativarModo(modo) {
    modoFerramenta = modo;
    const btnTop = document.getElementById('btnTop');
    const btnBottom = document.getElementById('btnBottom');

    btnTop.classList.remove('btn-success'); btnTop.classList.add('btn-outline-success');
    btnBottom.classList.remove('btn-danger'); btnBottom.classList.add('btn-outline-danger');

    if (modo === 'top') {
        btnTop.classList.remove('btn-outline-success'); btnTop.classList.add('btn-success');
        document.getElementById('status').innerText = "Modo INÍCIO: Clique para marcar onde a tabela começa.";
    } else if (modo === 'bottom') {
        btnBottom.classList.remove('btn-outline-danger'); btnBottom.classList.add('btn-danger');
        document.getElementById('status').innerText = "Modo FIM: Clique para marcar onde a tabela termina.";
    } else {
        document.getElementById('status').innerText = "Modo COLUNA: Clique para adicionar divisórias.";
    }
}