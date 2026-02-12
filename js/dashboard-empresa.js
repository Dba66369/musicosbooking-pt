// dashboard-empresa.js - Company Dashboard with Profile Management
// Features: Display profile data, edit profile with blank fields, orders management

import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js';
import { firebaseConfig } from './firebase.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// DOM Elements
const profileSection = document.getElementById('profile-section');
const editProfileBtn = document.getElementById('edit-profile-btn');
const voltarBtn = document.getElementById('voltar-btn');
const inicioBtn = document.getElementById('inicio-btn');
const logoutBtn = document.getElementById('logout-btn');
const editProfileForm = document.getElementById('edit-profile-form');
const profileDisplay = document.getElementById('profile-display');
const ordersSection = document.getElementById('orders-section');
const pedidosAceitosSection = document.getElementById('pedidos-aceitos-section');
const loadingSpinner = document.getElementById('loading-spinner');
const erroMsg = document.getElementById('erro-msg');
const sucessoMsg = document.getElementById('sucesso-msg');

let currentUser = null;
let empresaData = null;

// Check Authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      erroMsg.textContent = 'Por favor, verifique seu email antes de continuar. Verifique sua caixa de correio.';
      erroMsg.style.display = 'block';
      // Option to resend verification email
      return;
    }
    
    await loadEmpresaData();
  } else {
    window.location.href = 'login.html';
  }
});

// Load Company Data
async function loadEmpresaData() {
  try {
    showLoading(true);
    const q = query(collection(db, 'empresas'), where('uid', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      empresaData = querySnapshot.docs[0].data();
      empresaData.id = querySnapshot.docs[0].id;
      displayProfile();
      await loadOrders();
    } else {
      erroMsg.textContent = 'Perfil da empresa não encontrado.';
      erroMsg.style.display = 'block';
    }
    showLoading(false);
  } catch (error) {
    console.error('Error loading empresa data:', error);
    showError('Erro ao carregarem dados: ' + error.message);
    showLoading(false);
  }
}

// Display Profile (Read-only)
function displayProfile() {
  profileDisplay.innerHTML = `
    <div class="profile-card">
      <h3>Perfil da Empresa</h3>
      <p><strong>Nome:</strong> ${empresaData.nome}</p>
      <p><strong>Email:</strong> ${empresaData.email}</p>
      <p><strong>Telefone:</strong> ${empresaData.telefone}</p>
      <p><strong>NIF:</strong> ${empresaData.nif}</p>
      <p><strong>Morada:</strong> ${empresaData.morada}</p>
      <p><strong>Pessoa de Contacto:</strong> ${empresaData.pessoaContacto}</p>
    </div>
  `;
}

// Edit Profile (Blank Fields)
if (editProfileBtn) {
  editProfileBtn.addEventListener('click', () => {
    profileDisplay.style.display = 'none';
    editProfileForm.style.display = 'block';
    editProfileForm.innerHTML = `
      <form id="edit-form-submit">
        <div class="form-group">
          <label>Nome da Empresa *</label>
          <input type="text" id="edit-nome" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Telefone *</label>
          <input type="tel" id="edit-telefone" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Morada *</label>
          <input type="text" id="edit-morada" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Pessoa de Contacto *</label>
          <input type="text" id="edit-pessoa-contacto" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <button type="submit" class="btn btn-primary">Guardar Alterações</button>
        <button type="button" class="btn btn-secondary" id="cancel-edit">Cancelar</button>
      </form>
    `;
    
    document.getElementById('cancel-edit').addEventListener('click', () => {
      editProfileForm.style.display = 'none';
      profileDisplay.style.display = 'block';
    });
    
    document.getElementById('edit-form-submit').addEventListener('submit', async (e) => {
      e.preventDefault();
      await updateProfile();
    });
  });
}

// Update Profile
async function updateProfile() {
  try {
    showLoading(true);
    
    const nome = document.getElementById('edit-nome').value.trim();
    const telefone = document.getElementById('edit-telefone').value.trim();
    const morada = document.getElementById('edit-morada').value.trim();
    const pessoaContacto = document.getElementById('edit-pessoa-contacto').value.trim();
    
    const updates = {};
    if (nome) updates.nome = nome;
    if (telefone) updates.telefone = telefone;
    if (morada) updates.morada = morada;
    if (pessoaContacto) updates.pessoaContacto = pessoaContacto;
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'empresas', empresaData.id), updates);
      empresaData = { ...empresaData, ...updates };
      displayProfile();
      editProfileForm.style.display = 'none';
      profileDisplay.style.display = 'block';
      showSuccess('Perfil atualizado com sucesso!');
    }
    showLoading(false);
  } catch (error) {
    console.error('Error updating profile:', error);
    showError('Erro ao atualizar perfil: ' + error.message);
    showLoading(false);
  }
}

// Load Orders
async function loadOrders() {
  try {
    const q = query(collection(db, 'pedidos'), where('id_empresa', '==', empresaData.id));
    const querySnapshot = await getDocs(q);
    
    const pedidos = [];
    const pedidosAceitos = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const pedido = docSnapshot.data();
      pedido.id = docSnapshot.id;
      
      if (pedido.status === 'aceite') {
        pedidosAceitos.push(pedido);
      } else {
        pedidos.push(pedido);
      }
    }
    
    displayOrders(pedidos);
    displayPedidosAceitos(pedidosAceitos);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Display Orders
function displayOrders(orders) {
  if (orders.length === 0) {
    ordersSection.innerHTML = '<p>Nenhum orçamento pendente.</p>';
    return;
  }
  
  let html = '<h3>Meus Orçamentos</h3><div class="orders-list">';
  orders.forEach(order => {
    html += `
      <div class="order-card">
        <p><strong>Músico:</strong> ${order.id_musico}</p>
        <p><strong>Data:</strong> ${order.data}</p>
        <p><strong>Local:</strong> ${order.local}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <p><strong>Preço:</strong> EUR ${order.preco_sugerido}</p>
        <button class="btn btn-sm btn-success">Aceitar</button>
        <button class="btn btn-sm btn-danger">Recusar</button>
      </div>
    `;
  });
  html += '</div>';
  ordersSection.innerHTML = html;
}

// Display Accepted Orders
function displayPedidosAceitos(orders) {
  if (orders.length === 0) {
    pedidosAceitosSection.innerHTML = '<p>Nenhum evento confirmado.</p>';
    return;
  }
  
  let html = '<h3>Meus Eventos Confirmados</h3><div class="orders-list">';
  orders.forEach(order => {
    html += `
      <div class="order-card">
        <p><strong>Músico:</strong> ${order.id_musico}</p>
        <p><strong>Data:</strong> ${order.data}</p>
        <p><strong>Preço Acordado:</strong> EUR ${order.preco_sugerido}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <button class="btn btn-sm btn-info">Ir para Checkout</button>
      </div>
    `;
  });
  html += '</div>';
  pedidosAceitosSection.innerHTML = html;
}

// Navigation
if (voltarBtn) {
  voltarBtn.addEventListener('click', () => {
    window.history.back();
  });
}

if (inicioBtn) {
  inicioBtn.addEventListener('click', () => {
    window.location.href = 'dashboard-empresa.html';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      window.location.href = 'login.html';
    } catch (error) {
      console.error('Logout error:', error);
      showError('Erro ao fazer logout: ' + error.message);
    }
  });
}

// Helper Functions
function showLoading(show) {
  if (loadingSpinner) {
    loadingSpinner.style.display = show ? 'block' : 'none';
  }
}

function showError(message) {
  erroMsg.textContent = message;
  erroMsg.style.display = 'block';
  setTimeout(() => erroMsg.style.display = 'none', 5000);
}

function showSuccess(message) {
  sucessoMsg.textContent = message;
  sucessoMsg.style.display = 'block';
  setTimeout(() => sucessoMsg.style.display = 'none', 5000);
}

export { auth, db };
