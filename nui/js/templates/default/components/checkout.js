window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.checkout = {

  renderCheckout(data) {
    const { cart, subtotal, discount, total, contrastColor, selectedGateway, appliedCoupon, couponData, couponError, gateways, requireDocument, requirePhone } = data;

    let itemsHtml = '';
    cart.forEach((item, i) => {
      const subtotal = item.price * item.qty;
      itemsHtml += `
      <div class="flex items-center gap-3 py-3 ${i > 0 ? 'border-t border-white/[0.05]' : ''}">
        <div class="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.08]">
          <img src="${item.image}" class="w-full h-full object-cover" draggable="false" onerror="this.src='images/no-image.png'; this.onerror=null;" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-white text-sm font-semibold truncate">${item.name}</p>
        </div>
        <div class="flex items-center gap-1.5">
          <button onclick="checkoutUpdateQty(${i}, -1)" class="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white/60 transition-colors">
            <i data-lucide="minus" class="w-3 h-3"></i>
          </button>
          <span class="text-white text-xs font-bold w-6 text-center">${item.qty}</span>
          <button onclick="checkoutUpdateQty(${i}, 1)" class="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white/60 transition-colors">
            <i data-lucide="plus" class="w-3 h-3"></i>
          </button>
        </div>
        <button onclick="checkoutRemoveItem(${i})" class="text-red-400/50 hover:text-red-400 transition-colors ml-1">
          <i data-lucide="trash-2" class="w-4 h-4"></i>
        </button>
        <span class="text-white font-bold text-sm text-right flex-shrink-0 whitespace-nowrap">R$ ${formatPrice(subtotal)}</span>
      </div>`;
    });

    let gatewaysHtml = '';
    gateways.forEach(gw => {
      const isSelected = selectedGateway === gw.id;
      const iconUrl = gw.icon || `https://cdn.centralcart.io/public/gateway-icons/icon-${gw.id.toLowerCase()}.svg`;
      let badgeHtml = '';
      if (gw.badge) {
        const color = gw.badgeColor || 'primary';
        const colorMap = {
          primary: 'bg-primary/20 text-primary',
          purple: 'bg-purple-500/20 text-purple-400',
          blue: 'bg-blue-500/20 text-blue-400',
          green: 'bg-emerald-500/20 text-emerald-400',
        };
        const colorClass = colorMap[color] || colorMap.primary;
        const iconHtml = gw.badgeIcon ? `<i data-lucide="${gw.badgeIcon}" class="w-3 h-3"></i>` : '';
        badgeHtml = `<span class="text-[9px] font-bold px-1.5 py-0.5 rounded ${colorClass} flex items-center gap-1">${iconHtml}${gw.badge}</span>`;
      }
      gatewaysHtml += `
      <button type="button" onclick="selectGateway('${gw.id}')" class="w-full flex items-center gap-3 px-4 py-3 rounded-xl border ${isSelected ? 'border-primary bg-primary/5' : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.05]'} transition-all cursor-pointer">
        <div class="w-9 h-9 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0">
          <img src="${iconUrl}" alt="${gw.label}" class="w-5 h-5" draggable="false" onerror="this.style.display='none'" />
        </div>
        <div class="flex flex-col items-start flex-1">
          <div class="flex items-center gap-2">
            <span class="text-white text-sm font-semibold">${gw.label}</span>
            ${badgeHtml}
          </div>
          ${gw.desc ? `<span class="text-white/40 text-[11px]">${gw.desc}</span>` : ''}
        </div>
        <div class="w-4 h-4 rounded-full border-2 ${isSelected ? 'border-primary' : 'border-white/20'} flex items-center justify-center">
          ${isSelected ? '<div class="w-2 h-2 rounded-full bg-primary"></div>' : ''}
        </div>
      </button>`;
    });

    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col rounded-2xl bg-background border-2 border-white/[0.1] shadow-lg w-[90vw] h-[90vh] overflow-hidden p-8">
        <button onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
          <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>

        <div class="flex flex-col flex-1 min-h-0 overflow-y-auto">
          <div class="mb-5 w-full">
            <h1 class="text-white font-extrabold text-xl">Checkout</h1>
            <div class="flex items-center gap-2 mt-1">
              <button onclick="closeCheckoutPage()" class="text-white/50 hover:text-white text-xs font-medium transition-colors cursor-pointer">Início</button>
              <span class="text-white/30 text-xs">›</span>
              <span class="text-white/50 text-xs">Checkout</span>
            </div>
          </div>
          <div class="flex gap-6 items-start flex-1">
            <div class="flex flex-col gap-3 flex-1 min-w-0">
              <div class="rounded-2xl border border-white/[0.07] p-5">
                <h2 class="text-white font-bold text-sm mb-3">Formas de pagamento</h2>
                <div class="flex flex-col gap-2">
                  ${gatewaysHtml}
                </div>
              </div>

              <div class="rounded-2xl border border-white/[0.07] p-5">
                <h2 class="text-white font-bold text-sm mb-3">Informações de contato</h2>
                <div class="flex flex-col gap-3">
                  <input id="checkout-name" type="text" placeholder="Nome completo" autocomplete="off"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white text-sm outline-none placeholder-white/30 focus:border-primary/50 transition-colors" />
                  <input id="checkout-email" type="email" placeholder="Email" autocomplete="off"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white text-sm outline-none placeholder-white/30 focus:border-primary/50 transition-colors" />
                  ${requireDocument ? `<input id="checkout-document" type="text" placeholder="CPF" autocomplete="off" maxlength="14"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white text-sm outline-none placeholder-white/30 focus:border-primary/50 transition-colors"
                    oninput="maskCPF(this)" />` : ''}
                  ${requirePhone ? `<input id="checkout-phone" type="text" placeholder="Telefone" autocomplete="off" maxlength="15"
                    class="w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white text-sm outline-none placeholder-white/30 focus:border-primary/50 transition-colors"
                    oninput="maskPhone(this)" />` : ''}
                </div>
              </div>

              <div class="flex items-center gap-2 text-white/30 text-[11px] mt-2">
                <i data-lucide="shield-check" class="w-4 h-4 flex-shrink-0"></i>
                <span>Ao finalizar, você será redirecionado para uma página de pagamento segura.</span>
              </div>
            </div>

          <div class="w-[38%] flex-shrink-0">
            <div class="rounded-2xl border border-white/[0.07] bg-muted overflow-hidden flex flex-col">
              <div class="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
                <h2 class="text-white font-bold text-sm">Resumo do pedido</h2>
                <span class="text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                  <i data-lucide="shield-check" class="w-3 h-3"></i>
                  Pagamento seguro
                </span>
              </div>

              <div class="px-5 py-2 max-h-[200px] overflow-y-auto">
                ${itemsHtml}
              </div>

              <div class="px-5 py-3 border-t border-white/[0.07]">
                ${appliedCoupon ? `
                <div class="flex items-center gap-2">
                  <div class="flex items-center gap-2 flex-1 min-w-0 px-4 py-2 rounded-xl bg-white/[0.03] border border-primary/30">
                    <i data-lucide="ticket" class="w-3.5 h-3.5 text-primary flex-shrink-0"></i>
                    <span class="text-primary text-xs font-bold">${appliedCoupon}</span>
                    ${couponData ? `<span class="text-emerald-400/70 text-[10px]">${couponData.type === 'PERCENTAGE' ? couponData.value + '% OFF' : 'R$ ' + formatPrice(couponData.value) + ' OFF'}</span>` : ''}
                  </div>
                  <button onclick="removeCoupon()" class="px-4 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0 text-red-400">
                    <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    Remover
                  </button>
                </div>
                ` : `
                <div class="flex items-center gap-2">
                  <input id="checkout-coupon" type="text" placeholder="Digite seu cupom de desconto" autocomplete="off"
                    class="flex-1 px-4 py-2 rounded-xl bg-white/[0.03] border ${couponError ? 'border-red-500/50' : 'border-white/[0.07]'} text-white text-xs outline-none placeholder-white/30 focus:border-primary/50 transition-colors"
                    onkeydown="if(event.key==='Enter') applyCoupon()" />
                  <button onclick="applyCoupon()" class="px-4 py-2 rounded-xl bg-primary hover:bg-primary/80 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer flex-shrink-0" style="color: ${contrastColor}">
                    <i data-lucide="ticket" class="w-3.5 h-3.5"></i>
                    Aplicar
                  </button>
                </div>
                ${couponError ? `<p id="coupon-error" class="text-red-400 text-[11px] mt-1.5">${couponError}</p>` : ''}
                `}
              </div>

              <div class="px-5 py-4 border-t border-white/[0.07] flex flex-col gap-1.5">
                <div class="flex items-center justify-between">
                  <span class="text-white/50 text-sm">Subtotal</span>
                  <span class="text-white/70 text-sm">R$ ${formatPrice(subtotal)}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-white/50 text-sm">Descontos</span>
                  <span class="${discount > 0 ? 'text-emerald-400' : 'text-white/70'} text-sm">${discount > 0 ? '- ' : ''}R$ ${formatPrice(discount)}</span>
                </div>
                <div class="flex items-center justify-between pt-2 border-t border-white/[0.07] mt-1">
                  <span class="text-white font-bold text-sm">Total</span>
                  <span class="text-white font-bold text-base">R$ ${formatPrice(total)}</span>
                </div>
              </div>

              <div class="px-5 pb-5">
                <button id="checkout-submit-btn" onclick="submitCheckout()" class="w-full py-3 bg-primary hover:bg-primary/80 text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer" style="color: ${contrastColor}">
                  <i data-lucide="lock" class="w-4 h-4"></i>
                  Preencha seus dados
                </button>
              </div>
            </div>
          </div>
          </div>

        </div>

      </div>
    </div>`;
  },

  renderCheckoutPage(url) {
    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col rounded-2xl bg-background w-[90vw] h-[90vh] overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
          <button onclick="closeCheckoutPage()" class="flex items-center gap-2 text-white/60 hover:text-white text-xs font-medium transition-colors cursor-pointer">
            <i data-lucide="arrow-left" class="w-4 h-4"></i>
            Voltar à loja
          </button>
          <button onclick="closeStore()" class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
            <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
          </button>
        </div>
        <iframe src="${url}" class="flex-1 w-full border-0 rounded-b-2xl" allow="payment" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"></iframe>
      </div>
    </div>`;
  },

};
