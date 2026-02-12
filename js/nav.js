// js/nav.js
// Função para inicializar botões de navegação (Voltar e Início)

export function initNavigation() {
  document.addEventListener("DOMContentLoaded", () => {
    // Botão Voltar
    const btnVoltar = document.getElementById("btnVoltar");
    if (btnVoltar) {
      btnVoltar.addEventListener("click", () => {
        history.back();
      });
    }

    // Botão Início (voltar ao topo do dashboard)
    const btnInicio = document.getElementById("btnInicio");
    if (btnInicio) {
      btnInicio.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Botão Início (topo da página) - para páginas como Serviços, Sobre, Contato
    const btnInicioTopo = document.getElementById("btnInicioTopo");
    if (btnInicioTopo) {
      btnInicioTopo.addEventListener("click", (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  });
}

// Iniciar ao carregar o script
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNavigation);
} else {
  initNavigation();
}
