import { db } from './firebase-config.js';
import { 
  collection, 
  getDocs, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

function formatarDataBR(dataStr) {
  const [ano, mes, dia] = dataStr.split("-");
  return `${dia}/${mes}/${ano}`;
}

function carregarEncontros() {
  const q = query(collection(db, "encontros"), orderBy("data", "desc"));
  onSnapshot(q, snapshot => {
    const lista = document.getElementById("listaEncontros");
    lista.innerHTML = "";
    snapshot.forEach(docSnap => {
      const encontro = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      li.innerHTML = `
        <span>
          <strong>${encontro.titulo}</strong><br>
          <small>${formatarDataBR(encontro.data)}</small>
        </span>
        <div>
          <a href="detalhes.html?id=${docSnap.id}" class="btn btn-sm btn-outline-primary me-2">Detalhes</a>
          <button class="btn btn-sm btn-outline-danger btn-apagar" title="Apagar encontro">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      `;

      // Botão apagar
      const btnApagar = li.querySelector(".btn-apagar");
      btnApagar.addEventListener("click", () => {
        Swal.fire({
          title: `Apagar encontro "${encontro.titulo}"?`,
          text: "Essa ação não pode ser desfeita!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#3085d6",
          confirmButtonText: "Sim, apagar!",
          cancelButtonText: "Cancelar"
        }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              await deleteDoc(doc(db, "encontros", docSnap.id));
              Swal.fire("Apagado!", "O encontro foi removido.", "success");
            } catch (error) {
              Swal.fire("Erro", "Não foi possível apagar o encontro.", "error");
              console.error(error);
            }
          }
        });
      });

      lista.appendChild(li);
    });
  });
}

async function adicionarEncontro() {
  const titulo = document.getElementById("tituloEncontro").value;
  const data = document.getElementById("dataEncontro").value;
  if (titulo && data) {
    await addDoc(collection(db, "encontros"), { titulo, data });
    document.getElementById("tituloEncontro").value = "";
    document.getElementById("dataEncontro").value = "";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalEncontro"));
    modal.hide();
  } else {
    Swal.fire({
      icon: 'info',
      title: 'Campos obrigatórios',
      text: 'Por favor, preencha título e data do encontro.'
    });
  }
}

document.getElementById('btnAdicionarEncontro').addEventListener('click', adicionarEncontro);
document.addEventListener("DOMContentLoaded", carregarEncontros);
