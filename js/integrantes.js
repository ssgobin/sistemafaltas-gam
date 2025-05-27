import { db } from './firebase-config.js';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  doc, 
  deleteDoc 
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

function carregarIntegrantes() {
  const q = query(collection(db, "integrantes"), orderBy("nome"));
  onSnapshot(q, snapshot => {
    const lista = document.getElementById("listaIntegrantes");
    lista.innerHTML = "";
    snapshot.forEach(docSnap => {
      const integrante = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = integrante.nome;
      var totalIntegrantes = snapshot.size;
      var totalIntegrantesText = document.getElementById("totalIntegrantes");
      totalIntegrantesText.textContent = `Total de integrantes: ${totalIntegrantes}`;

      const btnApagar = document.createElement("button");
      btnApagar.className = "btn btn-sm btn-outline-danger";
      btnApagar.title = "Apagar integrante";
      btnApagar.innerHTML = `<i class="bi bi-trash"></i>`;
      btnApagar.addEventListener("click", () => {
        Swal.fire({
          title: `Apagar integrante "${integrante.nome}"?`,
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
              await deleteDoc(doc(db, "integrantes", docSnap.id));
              Swal.fire("Apagado!", "O integrante foi removido.", "success");
            } catch (error) {
              Swal.fire("Erro", "Não foi possível apagar o integrante.", "error");
              console.error(error);
            }
          }
        });
      });

      li.appendChild(btnApagar);
      lista.appendChild(li);
    });
  });
}

async function adicionarIntegrante() {
  const nome = document.getElementById("nomeIntegrante").value;
  if (nome) {
    await addDoc(collection(db, "integrantes"), { nome });
    document.getElementById("nomeIntegrante").value = "";
    const modal = bootstrap.Modal.getInstance(document.getElementById("modalIntegrante"));
    modal.hide();
  } else {
    Swal.fire({
      icon: 'info',
      title: 'Campo obrigatório',
      text: 'Por favor, preencha o nome do integrante.'
    });
  }
}

document.addEventListener("DOMContentLoaded", carregarIntegrantes);
document.getElementById('btnAdicionarIntegrante').addEventListener('click', adicionarIntegrante);
