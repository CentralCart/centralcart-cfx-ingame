window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.pix = {

  renderPixSuccess() {
    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col rounded-2xl bg-background border-2 border-white/[0.1] shadow-lg w-[90vw] h-[90vh] overflow-hidden p-8">
        <button onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
          <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>
        <div class="flex-1 flex flex-col items-center justify-center gap-5">
          <div class="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <i data-lucide="check-circle" class="w-8 h-8 text-emerald-400"></i>
          </div>
          <h1 class="text-white font-extrabold text-2xl">Pagamento confirmado!</h1>
          <p class="text-white/40 text-sm text-center max-w-[400px]">Seu pagamento foi processado com sucesso. Seu pedido está sendo preparado e será entregue em breve.</p>
          <button onclick="closeStore()" class="mt-4 px-8 py-3 bg-primary hover:bg-primary/80 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer" style="color: ${getPrimaryContrastColor()}">
            <i data-lucide="check" class="w-4 h-4"></i>
            Fechar
          </button>
        </div>
      </div>
    </div>`;
  },

  renderPixPayment(data) {
    const pixCode = data.pix_code || '';
    const qrCode = data.qr_code || '';
    const formattedPrice = data.formatted_price || '';
    const orderId = data.order_id || '';

    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col rounded-2xl bg-background border-2 border-white/[0.1] shadow-lg w-[90vw] h-[90vh] overflow-hidden p-8">
        <button onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
          <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>

        <div class="flex-1 flex flex-col items-center justify-center gap-6">
          <div class="flex flex-col items-center gap-2">
            <div class="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <i data-lucide="qr-code" class="w-5 h-5 text-primary"></i>
            </div>
            <h1 class="text-white font-extrabold text-xl">Concluir pagamento</h1>
            <p class="text-white/40 text-sm">Use a câmera do seu celular para escanear o QR Code.</p>
          </div>

          <div class="bg-white rounded-2xl p-4">
            <img src="data:image/png;base64,${qrCode}" alt="QR Code PIX" class="w-56 h-56" draggable="false" />
          </div>

          <div class="flex flex-col items-center gap-3 w-full max-w-[420px]">
            <p class="text-white/30 text-xs">Ou use o copia e cola</p>
            <div class="flex items-center gap-2 w-full bg-muted rounded-xl border border-white/[0.07] px-4 py-2.5">
              <span id="pix-code-text" class="text-white/60 text-xs truncate flex-1">${pixCode}</span>
              <button onclick="copyPixCode()" class="flex-shrink-0 px-4 py-1.5 rounded-lg bg-primary hover:bg-primary/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer" style="color: ${getPrimaryContrastColor()}">
                <i data-lucide="copy" class="w-3.5 h-3.5"></i>
                <span id="copy-btn-text">Copiar</span>
              </button>
            </div>
          </div>

          <div class="flex items-center gap-2 text-white/40 text-sm">
            <div class="loading-spinner" style="width:16px;height:16px;border-width:2px"></div>
            <span>Aguardando confirmação do banco...</span>
          </div>
        </div>

      </div>
    </div>`;
  },

};
