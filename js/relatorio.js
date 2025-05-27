import { db } from './firebase-config.js';
import { collection, query, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

let encontrosPorMes = {}; // { "2025-05": [encDoc, ...], ... }

function formatMesAno(date) {
  const ano = date.getFullYear();
  const mes = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${ano}-${mes}`;
}

// Função para criar o modal de calendário (cria só uma vez)
function criarModal() {
  let modal = document.getElementById("modalCalendario");
  if (modal) return modal;

  modal = document.createElement("div");
  modal.id = "modalCalendario";
  Object.assign(modal.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    backgroundColor: "rgba(0,0,0,0.5)",
    display: "none",
    justifyContent: "center",
    alignItems: "center",
    zIndex: "1050",
  });

  const modalContent = document.createElement("div");
  Object.assign(modalContent.style, {
    background: "white",
    padding: "20px",
    borderRadius: "8px",
    maxWidth: "400px",
    maxHeight: "80vh",
    overflowY: "auto",
  });

  // Botão fechar
  const btnFechar = document.createElement("button");
  btnFechar.textContent = "Fechar";
  btnFechar.className = "btn btn-secondary mb-3";
  btnFechar.onclick = () => { modal.style.display = "none"; };

  modalContent.appendChild(btnFechar);

  const calendarioDiv = document.createElement("div");
  calendarioDiv.id = "calendarioDetalhado";
  modalContent.appendChild(calendarioDiv);

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  return modal;
}

// Função que gera o calendário com status
function gerarCalendario(mesAno, presencasMensais, encontrosDoMes) {
  const modal = criarModal();
  const calendarioDiv = document.getElementById("calendarioDetalhado");
  calendarioDiv.innerHTML = "";

  const [ano, mesStr] = mesAno.split("-");
  const mes = parseInt(mesStr, 10) - 1;

  const primeiraData = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0).getDate();

  // Título do calendário
  const titulo = document.createElement("h5");
  titulo.textContent = primeiraData.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  calendarioDiv.appendChild(titulo);

  // Criar tabela simples para o calendário
  const tabela = document.createElement("table");
  tabela.className = "table table-bordered text-center";

  // Cabeçalho com dias da semana
  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].forEach(dia => {
    const th = document.createElement("th");
    th.textContent = dia;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");
  let row = document.createElement("tr");

  // Preencher células vazias antes do primeiro dia do mês
  const primeiroDiaSemana = primeiraData.getDay();
  for(let i = 0; i < primeiroDiaSemana; i++) {
    row.appendChild(document.createElement("td"));
  }

  // Função para achar status pelo encontro daquele dia
  function statusDia(dia) {
    const dataAtual = new Date(ano, mes, dia).toISOString().split("T")[0]; // '2025-05-24'

    for (const encDoc of encontrosDoMes) {
      const dataFirebase = encDoc.data().data;
      const dataEnc = dataFirebase.toDate ? dataFirebase.toDate() : new Date(dataFirebase);
      const dataEncontro = dataEnc.toISOString().split("T")[0];

      if (dataAtual === dataEncontro) {
        return presencasMensais[encDoc.id] || "-";
      }
    }

    return "-";
  }

  for(let dia = 1; dia <= ultimoDia; dia++) {
    const td = document.createElement("td");
    td.style.fontWeight = "600";
    td.textContent = dia;

    // Pinta a célula conforme status
    const status = statusDia(dia);
    switch(status) {
      case "presente":
        td.style.backgroundColor = "#198754"; // verde
        td.style.color = "white";
        break;
      case "online":
        td.style.backgroundColor = "#0dcaf0"; // azul claro
        td.style.color = "black";
        break;
      case "falta":
        td.style.backgroundColor = "#dc3545"; // vermelho
        td.style.color = "white";
        break;
      case "justificada":
        td.style.backgroundColor = "#ffc107"; // amarelo
        td.style.color = "black";
        break;
      default:
        td.style.backgroundColor = "#f8f9fa"; // cinza claro
        td.style.color = "black";
    }

    row.appendChild(td);

    // Quebra de linha da tabela a cada sábado (index 6)
    if ((primeiroDiaSemana + dia) % 7 === 0) {
      tbody.appendChild(row);
      row = document.createElement("tr");
    }
  }
  // Append última linha se não estiver vazia
  if (row.children.length > 0) tbody.appendChild(row);

  tabela.appendChild(tbody);
  calendarioDiv.appendChild(tabela);

  modal.style.display = "flex";
}

async function gerarRelatorio() {
  const qIntegrantes = query(collection(db, "integrantes"), orderBy("nome"));
  const qEncontros = query(collection(db, "encontros"), orderBy("data"));

  const integrantesSnapshot = await getDocs(qIntegrantes);
  const encontrosSnapshot = await getDocs(qEncontros);

  // Agrupar encontros por mês
  encontrosPorMes = {};
  encontrosSnapshot.forEach(encDoc => {
    const data = new Date(encDoc.data().data);
    const mesAno = formatMesAno(data);
    if (!encontrosPorMes[mesAno]) encontrosPorMes[mesAno] = [];
    encontrosPorMes[mesAno].push(encDoc);
  });

  const presencasPorIntegrante = {};
  integrantesSnapshot.forEach(intDoc => {
    presencasPorIntegrante[intDoc.id] = {
      nome: intDoc.data().nome,
      presencas: {},
      totais: { presente: 0, online: 0, falta: 0, justificada: 0 },
      presencaPorMes: {}
    };
  });

  // Popular presenças detalhadas
  for (const encDoc of encontrosSnapshot.docs) {
    const presencasSnap = await getDocs(collection(db, "encontros", encDoc.id, "presencas"));
    presencasSnap.forEach(pDoc => {
      const dados = pDoc.data();
      if (presencasPorIntegrante[pDoc.id]) {
        presencasPorIntegrante[pDoc.id].presencas[encDoc.id] = dados.status;
        presencasPorIntegrante[pDoc.id].totais[dados.status]++;

        const data = new Date(encDoc.data().data);
        const mesAno = formatMesAno(data);
        if (!presencasPorIntegrante[pDoc.id].presencaPorMes[mesAno]) {
          presencasPorIntegrante[pDoc.id].presencaPorMes[mesAno] = {
            presente: 0, online: 0, falta: 0, justificada: 0,
            presencasDetalhadas: {}
          };
        }
        presencasPorIntegrante[pDoc.id].presencaPorMes[mesAno][dados.status]++;
        presencasPorIntegrante[pDoc.id].presencaPorMes[mesAno].presencasDetalhadas[encDoc.id] = dados.status;
      }
    });
  }

  // Montar tabela
  const tabela = document.createElement("table");
  tabela.className = "table table-bordered";

  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  headerRow.innerHTML = "<th>Integrante</th>";

  // Colunas: meses
  const mesesOrdenados = Object.keys(encontrosPorMes).sort();
  mesesOrdenados.forEach(mesAno => {
    const [ano, mes] = mesAno.split("-");
    const dataExibir = new Date(ano, Number(mes) - 1, 1).toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    headerRow.innerHTML += `<th>${dataExibir}</th>`;
  });

  headerRow.innerHTML += "<th>Presente</th><th>Online</th><th>Faltas</th><th>Justificadas</th>";
  thead.appendChild(headerRow);
  tabela.appendChild(thead);

  const tbody = document.createElement("tbody");

  for (const [intId, info] of Object.entries(presencasPorIntegrante)) {
    const tr = document.createElement("tr");

    // Coluna do nome do integrante
    const tdNome = document.createElement("td");
    tdNome.textContent = info.nome;
    tr.appendChild(tdNome);

    mesesOrdenados.forEach(mesAno => {
      const mesData = info.presencaPorMes[mesAno];
      const tdMes = document.createElement("td");
      tdMes.className = "text-center";
      tdMes.style.cursor = "pointer";

      if (!mesData) {
        tdMes.textContent = "-";
      } else {
        tdMes.title = `Presente: ${mesData.presente}, Online: ${mesData.online}, Faltas: ${mesData.falta}, Justificadas: ${mesData.justificada}`;
        tdMes.innerHTML = `
          <span style="color: #198754; font-weight: 600;">${mesData.presente}</span> /
          <span style="color: #dc3545; font-weight: 600;">${mesData.falta}</span> /
          <span style="color: #0dcaf0; font-weight: 600;">${mesData.online}</span> /
          <span style="color: #ffc107; font-weight: 600;">${mesData.justificada}</span>
        `;

        tdMes.addEventListener("click", () => {
          console.log("Célula clicada para abrir modal:", mesAno);
          const encontrosDoMes = encontrosPorMes[mesAno];
          gerarCalendario(mesAno, mesData.presencasDetalhadas, encontrosDoMes);
        });
      }

      tr.appendChild(tdMes);
    });

    // Totais finais
    const tdPresente = document.createElement("td");
    tdPresente.className = "text-success text-center";
    tdPresente.textContent = info.totais.presente;
    tr.appendChild(tdPresente);

    const tdOnline = document.createElement("td");
    tdOnline.className = "text-info text-center";
    tdOnline.textContent = info.totais.online;
    tr.appendChild(tdOnline);

    const tdFalta = document.createElement("td");
    tdFalta.className = "text-danger text-center";
    tdFalta.textContent = info.totais.falta;
    tr.appendChild(tdFalta);

    const tdJustificada = document.createElement("td");
    tdJustificada.className = "text-warning text-center";
    tdJustificada.textContent = info.totais.justificada;
    tr.appendChild(tdJustificada);

    tbody.appendChild(tr);
  }

  tabela.appendChild(tbody);

  const relatorioDiv = document.getElementById("relatorio");
  relatorioDiv.innerHTML = "";
  relatorioDiv.appendChild(tabela);
}

gerarRelatorio();

document.getElementById("btnExportarExcel").addEventListener("click", () => {
  exportarTabelaParaExcel();
});

function exportarTabelaParaExcel() {
  const tabela = document.querySelector("#relatorio table");
  if (!tabela) {
    alert("Nenhuma tabela para exportar!");
    return;
  }

  // Converte a tabela HTML em worksheet XLSX
  const ws = XLSX.utils.table_to_sheet(tabela);

  // Cria um novo workbook e adiciona a worksheet
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  // Exporta o arquivo com nome padrão
  XLSX.writeFile(wb, "relatorio_presencas.xlsx");
}
