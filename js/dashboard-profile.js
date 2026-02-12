// js/dashboard-profile.js
import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "—";
}

function getInputValue(id) {
  const el = document.getElementById(id);
  if (!el) return null;
  const v = el.value?.trim();
  return v ? v : null;
}

async function loadProfile(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return snap.data();
}

function applyProfileToView(user, profile) {
  setText("viewNome", profile?.nome || "—");
  setText("viewEmail", user?.email || "—");
  setText("viewNif", profile?.nif || "—");
  setText("viewTelefone", profile?.telefone || "—");
}

async function saveProfile(uid) {
  const payload = {};
  const nome = getInputValue("editNome");
  const nif = getInputValue("editNif");
  const telefone = getInputValue("editTelefone");
  
  if (nome) payload.nome = nome;
  if (nif) payload.nif = nif;
  if (telefone) payload.telefone = telefone;
  
  if (Object.keys(payload).length === 0) {
    alert("Nenhum campo preenchido para atualizar.");
    return;
  }
  
  await updateDoc(doc(db, "users", uid), payload);
  alert("Perfil atualizado com sucesso.");
  window.location.reload();
}

function clearForm() {
  ["editNome", "editNif", "editTelefone"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = "";
  });
}

export function initDashboardProfile() {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = "registo.html";
      return;
    }
    
    // Guard: verificar email confirmado (requisito #4)
    if (!user.emailVerified) {
      await signOut(auth);
      window.location.href = "registo.html?msg=confirme_email";
      return;
    }
    
    const profile = await loadProfile(user.uid);
    applyProfileToView(user, profile);
    
    const form = document.getElementById("formEditarPerfil");
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await saveProfile(user.uid);
      });
    }
    
    const btnLimpar = document.getElementById("btnLimpar");
    if (btnLimpar) btnLimpar.addEventListener("click", clearForm);
  });
}
