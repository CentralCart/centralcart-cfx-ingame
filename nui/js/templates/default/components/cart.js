window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.cart = {

  renderCart(data) {
    const { cart, total } = data;
    if (cart.length === 0) {
      return `
      <div class="flex-1 flex flex-col items-center justify-center gap-3">
          <i data-lucide="shopping-cart" class="w-10 h-10 text-primary"></i>
          <div class="text-center">
              <p class="text-white/60 text-sm font-semibold">Seu carrinho está vazio.</p>
              <p class="text-white/30 text-xs mt-1">Assim que você escolher um produto, ele aparecerá aqui!</p>
          </div>
      </div>`;
    }

    let html = '';
    cart.forEach((item, i) => {
      const subtotal = item.price * item.qty;
      html += `
      <div class="cart-item flex gap-2.5 bg-white/5 rounded-lg px-3 py-2.5">
          <div class="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-white/[0.08]">
              <img src="${item.image}" alt="${item.name}" class="w-full h-full object-cover" draggable="false" onerror="this.src='images/no-image.png'; this.onerror=null;" />
          </div>
          <div class="flex flex-col gap-1.5 flex-1 min-w-0">
              <div class="flex flex-col">
                  <p class="text-white text-xs font-medium leading-tight min-w-0" style="display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${item.name}</p>
                  <span id="cart-subtotal-${i}" class="text-white/50 text-[11px] font-semibold mt-0.5">R$ ${formatPrice(subtotal)}</span>
              </div>
              <div class="flex items-center gap-1.5">
                  <button onclick="updateCartQty(${i}, -1)" class="w-6 h-6 flex items-center justify-center rounded bg-red-500/15 hover:bg-red-500/25 text-red-400 transition-colors">
                      <i data-lucide="minus" class="w-3 h-3"></i>
                  </button>
                  <input id="cart-qty-${i}" type="number" min="1" max="999" value="${item.qty}" oninput="setCartQty(${i}, this.value)" class="cart-qty-input w-8 h-6 text-center text-white text-xs font-semibold bg-white/5 border border-white/10 rounded outline-none transition-colors" />
                  <button onclick="updateCartQty(${i}, 1)" class="w-6 h-6 flex items-center justify-center rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-colors">
                      <i data-lucide="plus" class="w-3 h-3"></i>
                  </button>
                  <button onclick="removeFromCart(${i})" class="text-red-400/60 hover:text-red-400 transition-colors ml-auto">
                      <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                  </button>
              </div>
          </div>
      </div>`;
    });
    return html;
  },

};
