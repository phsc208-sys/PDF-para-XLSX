// --- PROCESSAMENTO E EXPORTAÇÃO ---

window.extrairDadosGerais = extrairDadosGerais;

async function extrairDadosGerais() {
    if(!pdfDoc) return null;
    
    let cortes = [];
    document.querySelectorAll('.col-sep').forEach(el => cortes.push(parseFloat(el.style.left) / escala));
    cortes.sort((a,b) => a - b);
    
    const tol = parseInt(document.getElementById('tolerancia').value);
    
    const elColar = document.getElementById('checkColar');
    const colarSemEspaco = elColar ? elColar.checked : true;
    
    let regioesAtivas = regioes.length > 0 ? regioes : [{inicio: null, fim: null}];
    let dadosFinais = [];

    for(let p=1; p<=totalPags; p++) {
        const page = await pdfDoc.getPage(p);
        const content = await page.getTextContent();
        let itensPagina = content.items.map(i => ({ str: i.str, x: i.transform[4], y: i.transform[5] }));

        for (let reg of regioesAtivas) {
            let startP = reg.inicio ? reg.inicio.pag : 1;
            let endP = reg.fim ? reg.fim.pag : totalPags;
            
            if (p < startP || p > endP) continue;

            let itensRegiao = itensPagina.filter(item => {
                const yVisual = (alturaPagina - item.y) * escala;
                if (reg.inicio && p === startP && yVisual < (reg.inicio.y - 5)) return false;
                if (reg.fim && p === endP && yVisual > (reg.fim.y + 5)) return false;
                return true;
            });

            if (itensRegiao.length === 0) continue;
            itensRegiao.sort((a,b) => b.y - a.y);

            let grupo = { base: itensRegiao[0].y, itens: [itensRegiao[0]] };
            let grupos = [];
            for(let i=1; i<itensRegiao.length; i++) {
                if(Math.abs(grupo.base - itensRegiao[i].y) <= tol) {
                    grupo.itens.push(itensRegiao[i]);
                    if(itensRegiao[i].y < grupo.base) grupo.base = itensRegiao[i].y;
                } else { grupos.push(grupo); grupo = { base: itensRegiao[i].y, itens: [itensRegiao[i]] }; }
            }
            grupos.push(grupo);

            grupos.forEach(grp => {
                let cols = []; for(let k=0; k<=cortes.length; k++) cols.push([]);
                grp.itens.forEach(it => {
                    let idx = 0;
                    for(let c=0; c<cortes.length; c++) if(it.x > cortes[c]) idx = c+1;
                    cols[idx].push(it);
                });
                
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
                        
                        let ehDecimal = /^[.,]\d/.test(itemAtual.str); 
                        let ehMoeda = /R\$$/.test(itemAnt.str.trim());       
                        
                        if ((colarSemEspaco && distY > 4) || ehDecimal || ehMoeda) {
                                textoFinal += itemAtual.str;
                        } else {
                                textoFinal += " " + itemAtual.str;
                        }
                    }
                    return textoFinal.trim();
                });

                if(linhaProc.join("").length > 0) dadosFinais.push(linhaProc);
            });
        }
    }

    let resultado = unirLinhasQuebradas(dadosFinais, colarSemEspaco);
    return { dados: resultado, numColunas: cortes.length+1 };
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

// FUNÇÕES DE PREVIEW E DOWNLOAD
async function gerarPreview() {
    document.getElementById('previewDiv').style.display = 'block';
    const res = await extrairDadosGerais();
    
    if(!res || !res.dados || res.dados.length === 0) return;
    
    document.getElementById('totalLinhas').innerText = res.dados.length;
    
    const thead = document.getElementById('tabelaHeader');
    const tbody = document.getElementById('tabelaBody');
    thead.innerHTML = "";
    tbody.innerHTML = "";
    
    // Verifica checkbox do cabeçalho
    const checkHeader = document.getElementById('checkCabecalho');
    const usarPrimeiraComoCabecalho = checkHeader ? checkHeader.checked : false;
    
    let dados = res.dados;
    let headerHTML = "";

    if (usarPrimeiraComoCabecalho && dados.length > 0) {
        dados[0].forEach(txt => { headerHTML += `<th scope="col">${txt}</th>`; });
        dados = dados.slice(1);
    } else {
        let numCols = dados.length > 0 ? dados[0].length : 0;
        for(let i=1; i<=numCols; i++) { headerHTML += `<th scope="col">Coluna ${i}</th>`; }
    }
    thead.innerHTML = headerHTML;

    let bodyHTML = "";
    dados.forEach(linha => {
        bodyHTML += "<tr>";
        linha.forEach(txt => { bodyHTML += `<td>${txt}</td>`; });
        bodyHTML += "</tr>";
    });
    tbody.innerHTML = bodyHTML;
}

async function baixarXLSX() {
    if (regioes.length > 0 || document.querySelectorAll('.col-sep').length > 0) {
        if(confirm("Deseja incluir a configuração atual não salva no Excel?")) {
            await window.salvarPlanilhaAtual(); 
        }
    }

    if (planilhasSalvas.length === 0) {
        alert("Nenhuma planilha salva para baixar!");
        return;
    }

    var wb = XLSX.utils.book_new();
    
    const checkHeader = document.getElementById('checkCabecalho');
    const usarPrimeiraComoCabecalho = checkHeader ? checkHeader.checked : false;

    planilhasSalvas.forEach(planilha => {
        let ws_data = [];
        if (usarPrimeiraComoCabecalho) {
            ws_data = planilha.dados;
        } else {
            let headers = [];
            for(let i=1; i <= planilha.colunas; i++) headers.push(`Coluna ${i}`);
            ws_data = [headers, ...planilha.dados];
        }
        var ws = XLSX.utils.aoa_to_sheet(ws_data);
        XLSX.utils.book_append_sheet(wb, ws, planilha.nome);
    });

    XLSX.writeFile(wb, "Extrato_PDF.xlsx");
}