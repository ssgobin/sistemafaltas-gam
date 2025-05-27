import { db } from './firebase-config.js';
import { doc, getDoc, collection, getDocs, query, orderBy, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

import { storage } from './firebase-config.js';
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js";


const urlParams = new URLSearchParams(window.location.search);
const idEncontro = urlParams.get("id");

let modalJustificativa;
let idAtual = "";
let nomeAtual = "";
let statusAtual = "";

async function carregarDetalhes() {
  const docRef = doc(db, "encontros", idEncontro);
  const docSnap = await getDoc(docRef);
  const encontro = docSnap.data();

  document.getElementById("tituloEncontro").textContent = encontro.titulo;
  const data = new Date(encontro.data);
  data.setHours(data.getHours() + 3); // Ajusta para UTC-3
  document.getElementById("dataEncontro").textContent = data.toLocaleDateString();
  document.getElementById("ata").value = encontro.ata || "";

  if (encontro.fotoURL) {
    const img = document.getElementById("fotoEncontro");
    img.src = encontro.fotoURL;
    img.classList.remove("d-none");
  }


  const qIntegrantes = query(collection(db, "integrantes"), orderBy("nome"));
  const integrantesSnapshot = await getDocs(qIntegrantes);
  const presencasRef = collection(db, "encontros", idEncontro, "presencas");
  const presencasSnap = await getDocs(presencasRef);

  const presencas = {};
  presencasSnap.forEach(doc => {
    presencas[doc.id] = doc.data();
  });

  const tbody = document.querySelector("#tabelaPresencas tbody");
  tbody.innerHTML = "";

  integrantesSnapshot.forEach(docSnap => {
    const id = docSnap.id;
    const nome = docSnap.data().nome;
    const presenca = presencas[id] || { status: '', justificativa: '' };

    const tr = document.createElement("tr");
    const tdNome = document.createElement("td");
    tdNome.textContent = nome;
    tdNome.classList.add("align-middle");
    tr.appendChild(tdNome);

    const statusList = [
      { label: "Presente", value: "presente", color: "success" },
      { label: "Online", value: "online", color: "info" },
      { label: "Falta", value: "falta", color: "danger" },
      { label: "Justificada", value: "justificada", color: "warning" }
    ];

    statusList.forEach(({ label, value, color }) => {
      const td = document.createElement("td");
      td.classList.add("text-center");

      const btn = document.createElement("button");
      btn.textContent = label;
      btn.className = `btn btn-sm btn-outline-${color}`;

      if (presenca.status === value) {
        btn.classList.remove(`btn-outline-${color}`);
        btn.classList.add(`btn-${color}`);
      }

      btn.addEventListener("click", async () => {
        if (value === 'justificada') {
          idAtual = id;
          nomeAtual = nome;
          statusAtual = value;
          document.getElementById("inputJustificativa").value = presenca.justificativa || "";
          modalJustificativa.show();
        } else {
          await setDoc(doc(db, "encontros", idEncontro, "presencas", id), {
            nome,
            status: value,
            justificativa: ""
          });
          carregarDetalhes();
        }
      });

      td.appendChild(btn);
      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

async function salvarAta() {
  const ata = document.getElementById("ata").value;

  Swal.fire({
    title: 'Confirma salvar a ata?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sim, salvar',
    cancelButtonText: 'Cancelar'
  }).then(async (result) => {
    if (result.isConfirmed) {
      try {
        const docRef = doc(db, "encontros", idEncontro);
        await updateDoc(docRef, { ata });
        Swal.fire('Salvo!', 'A ata foi salva com sucesso.', 'success');
      } catch (error) {
        Swal.fire('Erro', 'Não foi possível salvar a ata.', 'error');
        console.error(error);
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  modalJustificativa = new bootstrap.Modal(document.getElementById("modalJustificativa"));

  document.getElementById('btnSalvarAta').addEventListener('click', salvarAta);

  document.getElementById("btnSalvarJustificativa").addEventListener("click", async () => {
    const justificativa = document.getElementById("inputJustificativa").value.trim();

    if (!justificativa) {
      alert("A justificativa não pode ficar vazia.");
      return;
    }

    await setDoc(doc(db, "encontros", idEncontro, "presencas", idAtual), {
      nome: nomeAtual,
      status: statusAtual,
      justificativa
    });

    modalJustificativa.hide();
    carregarDetalhes();
  });

  carregarDetalhes();
});

document.getElementById("btnUploadFoto").addEventListener("click", async () => {
  const fileInput = document.getElementById("inputFoto");
  const file = fileInput.files[0];

  if (!file) {
    Swal.fire('Erro', 'Selecione uma imagem primeiro.', 'warning');
    return;
  }

  const storageRef = ref(storage, `encontros/${idEncontro}/foto.jpg`);

  try {
    await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(storageRef);

    // Salva o link no Firestore
    await updateDoc(doc(db, "encontros", idEncontro), {
      fotoURL: downloadURL
    });

    Swal.fire('Sucesso', 'Foto enviada com sucesso.', 'success');
    carregarDetalhes(); // Atualiza a página para mostrar a imagem
  } catch (error) {
    Swal.fire('Erro', 'Erro ao enviar a foto.', 'error');
    console.error(error);
  }
});


