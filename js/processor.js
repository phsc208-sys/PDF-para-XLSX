// --- PROCESSAMENTO E EXPORTAÇÃO ---

async function extrairDadosGerais() {
    if(!pdfDoc) return null;
    
    // Coleta posição das colunas
    let cortes = [];
    document.querySelectorAll('.col-sep').forEach(el => cortes.push(parseFloat(el.style.left) / escala));
    cortes.sort((a,b) => a - b);
    
    const tol = parseInt(document.getElementById('tolerancia').value);
    const colarSemEspaco = document.getElementById('checkColar').checked;
    
    let todasLinhas = [];
    
    // Define intervalo de páginas a processar
    const pStart = startMarker.pag || 1;
    const pEnd = endMarker.pag || totalPags;

    for(let p=1; p<=totalPags; p++) {
        // Pula páginas fora do intervalo Início/Fim
        if (p < pStart) continue;
        if (p > pEnd) break;

        const page = await pdfDoc.getPage(p);
        const content = await page.getTextContent();
        let itens = content.items.map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));

        // --- FILTRO MATEMÁTICO DE LIMITES ---
        itens = itens.filter(item => {
            const yVisual = (alturaPagina - item.y) * escala;
            // Se for a página de início, ignora o que está acima
            if (p === startMarker.pag && yVisual < (startMarker.y - 5)) return false;
            // Se for a página de fim, ignora o que está abaixo
            if (p === endMarker.pag && yVisual > (endMarker.y + 5)) return false;
            return true;
        });

        itens.sort((a,b) => b.y - a.y);
        if(itens.length===0) continue;

        // Agrupa Linhas (Zebra)
        let grupo = { base: itens[0].y, itens: [itens[0]] };
        let grupos = [];
        for(let i=1; i<itens.length; i++) {
            if(Math.abs(grupo.base - itens[i].y) <= tol) {
                grupo.itens.push(itens[i]);
                if(itens[i].y < grupo.base) grupo.base = itens[i].y;
            } else { grupos.push(grupo); grupo = { base: itens[i].y, itens: [itens[i]] }; }
        }
        grupos.push(grupo);

        // Corta em Colunas
        grupos.forEach(grp => {
            let cols = []; for(let k=0; k<=cortes.length; k++) cols.push([]);
            grp.itens.forEach(it => {
                let idx = 0;
                for(let c=0; c<cortes.length; c++) if(it.x > cortes[c]) idx = c+1;
                cols[idx].push(it);
            });
            
            // Processa Texto da Célula (Cola Inteligente)
            let linhaProc = cols.map(lista => {
                lista.sort((a,b) => { 
                    if(Math.abs(a.y - b.y) > 2) return b.y - a.y; 
                    return a.x - b.x; 
                });

                if (lista.length === 0) return "";
                let textoFinal = lista[0].str;
                
                for (let i = 1; i < lista.length; i++) {
                    let itemAtual = lista[i];
                    let itemAnt = lista[i-1];
                    let distY = Math.abs(itemAtual.y - itemAnt.y);
                    
                    // Lógica para valores quebrados (R$ 50,00)
                    let ehContinuaDecimal = /^[.,]\d/.test(itemAtual.str); 
                    let ehMoeda = /R\$$/.test(itemAnt.str.trim());       
                    
                    if ((colarSemEspaco && distY > 4) || ehContinuaDecimal || ehMoeda) {
                            textoFinal += itemAtual.str;
                    } else {
                            textoFinal += " " + itemAtual.str;
                    }
                }
                return textoFinal.trim();
            });

            if(linhaProc.join("").length > 0) todasLinhas.push(linhaProc);
        });
    }

    return { dados: unirLinhasQuebradas(todasLinhas, colarSemEspaco), numColunas: cortes.length+1 };
}

function unirLinhasQuebradas(linhas, usarCola) {
    if (linhas.length === 0) return [];
    let finais = [];
    let pai = null;
    const rData = /\d{2}\/\d{2}\/\d{4}/;
    const rValor = /R\$\s?[\d.,]+/;

    for (let i = 0; i < linhas.length; i++) {
        let linha = linhas[i];
        let txt = linha.join(" ");

        if (rData.test(txt) || rValor.test(txt)) {
            if (pai) finais.push(pai);
            pai = linha;
        } else {
            if (pai) {
                for (let c = 0; c < linha.length; c++) {
                    if (linha[c]) {
                        let separador = usarCola ? "" : " ";
                        if (/^[.,]/.test(linha[c])) separador = ""; 
                        pai[c] += separador + linha[c];
                    }
                }
            } else { finais.push(linha); }
        }
    }
    if (pai) finais.push(pai);
    return finais;
}

async function gerarPreview() {
    document.getElementById('previewDiv').style.display = 'block';
    const res = await extrairDadosGerais();
    if(!res) return;
    
    document.getElementById('totalLinhas').innerText = res.dados.length;
    const tbody = document.getElementById('tabelaBody');
    tbody.innerHTML = "";
    const thead = document.getElementById('tabelaHeader'); thead.innerHTML = "";
    
    for(let i=0; i<res.numColunas; i++) { 
        let th = document.createElement('th'); 
        th.innerText=`Col ${i+1}`; 
        thead.appendChild(th); 
    }
    
    let html = "";
    res.dados.forEach(linha => {
        html += "<tr>";
        linha.forEach(txt => { html += `<td>${txt}</td>`; });
        html += "</tr>";
    });
    tbody.innerHTML = html;
}

async function baixarCSV() {
    const res = await extrairDadosGerais();
    if(!res) return;
    let csv = "";
    const bom = "\uFEFF";
    
    for(let i=0; i<res.numColunas; i++) csv += `Coluna ${i+1};`; 
    csv += "\n";
    
    res.dados.forEach(l => csv += l.join(";") + "\n");
    
    const blob = new Blob([bom + csv], {type:'text/csv;charset=utf-8'});
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Extrato_Processado.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}