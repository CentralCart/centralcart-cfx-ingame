window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.errors = {

  renderUnsupportedStore(storeType) {
    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col items-center justify-center rounded-2xl bg-background border-2 border-white/[0.1] shadow-lg w-[90vw] h-[90vh] gap-4">
        <button type="button" onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
            <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>
        <div class="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
          <i data-lucide="alert-triangle" class="w-7 h-7 text-red-400"></i>
        </div>
        <h2 class="text-white font-bold text-lg">Ops... algo não está certo!</h2>
        <p class="text-white/40 text-sm text-center max-w-[400px]">Este script só é compatível com lojas de servidores no FiveM. Por favor, verifique seu tipo de loja e tente novamente.</p>
      </div>
    </div>`;
  },

  renderMaintenance() {
    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col items-center justify-center rounded-2xl bg-background border-2 border-white/[0.1] shadow-lg w-[90vw] h-[90vh] gap-4">
        <button type="button" onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
            <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>
        <div class="w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center">
          <i data-lucide="hard-hat" class="w-7 h-7 text-amber-400"></i>
        </div>
        <h2 class="text-white font-bold text-lg">Estamos em manutenção</h2>
        <p class="text-white/40 text-sm text-center max-w-[400px]">Nossa loja está temporariamente indisponível para melhorias. Volte em breve!</p>
      </div>
    </div>`;
  },

};
