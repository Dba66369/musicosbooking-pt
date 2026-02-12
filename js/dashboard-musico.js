// dashboard-musico.js - Musician Dashboard with Profile Management
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
const pedidosSection = document.getElementById('pedidos-section');
const pedidosAceitosSection = document.getElementById('pedidos-aceitos-section');
const loadingSpinner = document.getElementById('loading-spinner');
const erroMsg = document.getElementById('erro-msg');
const sucessoMsg = document.getElementById('sucesso-msg');

let currentUser = null;
let musicoData = null;

// Check Authentication
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    
    // Check if email is verified
    if (!user.emailVerified) {
      erroMsg.textContent = 'Por favor, verifique seu email antes de continuar. Verifique sua caixa de correio.';
      erroMsg.style.display = 'block';
      return;
    }
    
    await loadMusicoData();
  } else {
    window.location.href = 'login.html';
  }
});

// Load Musician Data
async function loadMusicoData() {
  try {
    showLoading(true);
    const q = query(collection(db, 'musicos'), where('uid', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      musicoData = querySnapshot.docs[0].data();
      musicoData.id = querySnapshot.docs[0].id;
      displayProfile();
      await loadOrders();
    } else {
      erroMsg.textContent = 'Perfil do músico não encontrado.';
      erroMsg.style.display = 'block';
    }
    showLoading(false);
  } catch (error) {
    console.error('Error loading musico data:', error);
    showError('Erro ao carregarem dados: ' + error.message);
    showLoading(false);
  }
}

// Display Profile (Read-only)
function displayProfile() {
  profileDisplay.innerHTML = `
    <div class="profile-card">
      <h3>Perfil do Músico</h3>
      <p><strong>Nome:</strong> ${musicoData.nome}</p>
      <p><strong>Email:</strong> ${musicoData.email}</p>
      <p><strong>Telefone:</strong> ${musicoData.telefone}</p>
      <p><strong>Género Musical:</strong> ${musicoData.generoMusical || 'Não preenchido'}</p>
      <p><strong>Preço/hora:</strong> EUR ${musicoData.precoHora || 'Não preenchido'}</p>
      <p><strong>Descrição:</strong> ${musicoData.descricao || 'Não preenchida'}</p>
      <p><strong>Cidades:</strong> ${musicoData.cidades ? musicoData.cidades.join(', ') : 'Não preenchidas'}</p>
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
          <label>Nome *</label>
          <input type="text" id="edit-nome" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Telefone *</label>
          <input type="tel" id="edit-telefone" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Género Musical *</label>
          <input type="text" id="edit-genero" placeholder="Ex: Fado, Rock, Pop..." class="form-control">
        </div>
        <div class="form-group">
          <label>Preço por Hora (EUR) *</label>
          <input type="number" id="edit-preco" placeholder="Deixar em branco para manter" class="form-control">
        </div>
        <div class="form-group">
          <label>Descrição *</label>
          <textarea id="edit-descricao" placeholder="Deixar em branco para manter" class="form-control"></textarea>
        </div>
        <div class="form-group">
          <label>Cidades (separadas por vírgula) *</label>
          <input type="text" id="edit-cidades" placeholder="Ex: Lisboa, Porto, Covilhã" class="form-control">
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
    const genero = document.getElementById('edit-genero').value.trim();
    const preco = document.getElementById('edit-preco').value.trim();
    const descricao = document.getElementById('edit-descricao').value.trim();
    const cidades = document.getElementById('edit-cidades').value.trim();
    
    const updates = {};
    if (nome) updates.nome = nome;
    if (telefone) updates.telefone = telefone;
    if (genero) updates.generoMusical = genero;
    if (preco) updates.precoHora = parseFloat(preco);
    if (descricao) updates.descricao = descricao;
    if (cidades) updates.cidades = cidades.split(',').map(c => c.trim());
    
    if (Object.keys(updates).length > 0) {
      await updateDoc(doc(db, 'musicos', musicoData.id), updates);
      musicoData = { ...musicoData, ...updates };
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

// Load Orders/Requests
async function loadOrders() {
  try {
    const q = query(collection(db, 'pedidos'), where('id_musico', '==', musicoData.id));
    const querySnapshot = await getDocs(q);
    
    const pedidos = [];
    const pedidosAceitos = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const pedido = docSnapshot.data();
      pedido.id = docSnapshot.id;
      
      if (pedido.status === 'aceite') {
        pedidosAceitos.push(pedido);
      } else if (pedido.status === 'pendente') {
        pedidos.push(pedido);
      }
    }
    
    displayOrders(pedidos);
    displayPedidosAceitos(pedidosAceitos);
  } catch (error) {
    console.error('Error loading orders:', error);
  }
}

// Display Pending Orders
function displayOrders(orders) {
  if (orders.length === 0) {
    pedidosSection.innerHTML = '<p>Nenhum pedido pendente.</p>';
    return;
  }
  
  let html = '<h3>Pedidos Recebidos</h3><div class="orders-list">';
  orders.forEach(order => {
    html += `
      <div class="order-card">
        <p><strong>Empresa:</strong> ${order.id_empresa || 'N/A'}</p>
        <p><strong>Data:</strong> ${order.data}</p>
        <p><strong>Local:</strong> ${order.local}</p>
        <p><strong>Duração:</strong> ${order.duracao} horas</p>
        <p><strong>Preço Sugerido:</strong> EUR ${order.preco_sugerido}</p>
        <p><strong>Tipo de Evento:</strong> ${order.tipo_evento}</p>
        <button class="btn btn-sm btn-success" onclick="acceptOrder('${order.id}')">Aceitar</button>
        <button class="btn btn-sm btn-danger" onclick="rejectOrder('${order.id}')">Recusar</button>
      </div>
    `;
  });
  html += '</div>';
  pedidosSection.innerHTML = html;
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
        <p><strong>Empresa:</strong> ${order.id_empresa || 'N/A'}</p>
        <p><strong>Data:</strong> ${order.data}</p>
        <p><strong>Local:</strong> ${order.local}</p>
        <p><strong>Preço Acordado:</strong> EUR ${order.preco_sugerido}</p>
        <p><strong>Status:</strong> ${order.status}</p>
        <button class="btn btn-sm btn-info">Ver Detalhes</button>
      </div>
    `;
  });
  html += '</div>';
  pedidosAceitosSection.innerHTML = html;
}

// Accept/Reject Order (stub functions)
window.acceptOrder = function(orderId) {
  alert('Funcionalidade de aceitar pedido em desenvolvimento: ' + orderId);
};

window.rejectOrder = function(orderId) {
  alert('Funcionalidade de rejeitar pedido em desenvolvimento: ' + orderId);
};

// Navigation
if (voltarBtn) {
  voltarBtn.addEventListener('click', () => {
    window.history.back();
  });
}

if (inicioBtn) {
  inicioBtn.addEventListener('click', () => {
    window.location.href = 'dashboard-musico.html';
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
