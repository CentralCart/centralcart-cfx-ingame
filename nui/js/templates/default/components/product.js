window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.product = {

  renderProductCard(pkg) {
    const price = pkg.price || 0;
    const oldPrice = pkg.compare_at_price && pkg.compare_at_price > price ? pkg.compare_at_price : null;
    const name = pkg.name || 'Produto';
    const imgSrc = pkg.image || 'images/no-image.png';
    const highlighted = pkg.highlighted || false;
    const outOfStock = pkg.inventory_amount !== null && pkg.inventory_amount !== undefined && pkg.inventory_amount <= 0;

    const oldPriceHtml = oldPrice
      ? `<span class="text-white/30 text-[11px] line-through">R$ ${formatPrice(oldPrice)}</span>
         <span class="text-primary text-[10px] font-semibold bg-primary/10 px-1.5 py-0.5 rounded">${Math.round((1 - price / oldPrice) * 100)}% OFF</span>`
      : '';
    const hasStock = pkg.inventory_amount !== null && pkg.inventory_amount !== undefined && pkg.inventory_amount > 0;
    const badgeHtml = highlighted ? `<span class="absolute top-2 left-2 bg-[rgb(var(--color-primary))] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 z-10" style="color: ${getPrimaryContrastColor()}"><i data-lucide="star" class="w-3 h-3"></i> Destaque</span>` : '';
    const stockBadgeHtml = hasStock ? `<span class="absolute top-2 right-2 bg-black/50 text-[10px] font-semibold px-2 py-0.5 rounded-md text-white/80 z-10 flex items-center gap-1"><i data-lucide="package" class="w-3 h-3"></i> ${pkg.inventory_amount} un.</span>` : '';
    const outOfStockOverlay = outOfStock ? `<div class="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><span class="text-white font-extrabold text-sm uppercase tracking-wider">Estoque Esgotado</span></div>` : '';

    return `
    <div class="product-card bg-white/5 rounded-xl border ${highlighted ? 'border-[rgb(var(--color-primary)/0.4)]' : 'border-white/[0.07]'} flex flex-col overflow-hidden relative ${outOfStock ? 'opacity-70' : ''} cursor-pointer" onclick="openProductDetail(${pkg.id})">
        <div class="w-full bg-muted rounded-t-xl overflow-hidden flex-shrink-0 relative">
            ${badgeHtml}
            ${stockBadgeHtml}
            ${outOfStockOverlay}
            <img src="${imgSrc}" alt="${name}" class="w-full h-auto object-contain" draggable="false" onerror="this.src='images/no-image.png'; this.onerror=null;" />
        </div>
        <div class="p-3 flex flex-col gap-2 flex-1">
            <h3 class="text-white font-semibold text-xs">${name}</h3>
            <div class="flex items-center gap-2 flex-wrap">
                ${oldPriceHtml}
            </div>
            <span class="text-white font-bold text-sm">R$ ${formatPrice(price)}</span>
            ${outOfStock
              ? `<button disabled class="mt-auto w-full py-2 bg-white/10 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 text-white/30 cursor-not-allowed">Esgotado</button>`
              : `<button id="btn-add-${pkg.id}" onclick="event.stopPropagation(); addToCart(${pkg.id}, '${name.replace(/'/g, "\\'")}', ${price}, '${imgSrc.replace(/'/g, "\\'")}')" class="mt-auto w-full py-2 bg-primary hover:bg-primary/80 text-xs font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center gap-1.5" style="color: ${getPrimaryContrastColor()}">
                    <i data-lucide="${isInCart(pkg.id) ? 'shopping-basket' : 'shopping-cart'}" class="w-3.5 h-3.5"></i>
                    ${isInCart(pkg.id) ? 'No carrinho' : 'Adicionar'}
                </button>`}
        </div>
    </div>`;
  },

  renderProductDetail(pkg) {
    const price = pkg.price || pkg.pricing?.price || 0;
    const oldPrice = pkg.compare_at_price || pkg.pricing?.compare_at || null;
    const name = pkg.name || 'Produto';
    const image = pkg.image || 'images/no-image.png';
    const description = pkg.description || '';
    const outOfStock = pkg.inventory_amount !== null && pkg.inventory_amount !== undefined && pkg.inventory_amount <= 0;
    const hasStock = pkg.inventory_amount !== null && pkg.inventory_amount !== undefined && pkg.inventory_amount > 0;
    const contrastColor = getPrimaryContrastColor();

    const stockHtml = hasStock ? `<span class="text-white/50 text-xs flex items-center gap-1"><i data-lucide="package" class="w-3.5 h-3.5"></i> ${pkg.inventory_amount} un. disponíveis</span>` : '';

    const oldPriceHtml = oldPrice && oldPrice > price
      ? `<div class="text-white/30 text-sm line-through">R$ ${formatPrice(oldPrice)}</div>`
      : '';

    return `
      <div class="fixed inset-0 z-[9999] flex items-center justify-center" onclick="if(event.target===this) closeProductDetail()">
        <div class="flex max-h-[80vh] gap-5 items-start">

          <div class="w-[300px] rounded-2xl ring-2 ring-white/15 ring-offset-4 ring-offset-background bg-muted overflow-hidden flex-shrink-0 shadow-xl">
            <img id="product-detail-img" src="${image}" alt="${name}" class="w-full object-contain" draggable="false" onload="adjustProductDetailHeight()" />
          </div>

          <div id="product-detail-info" class="w-[520px] bg-background rounded-2xl ring-2 ring-white/15 ring-offset-4 ring-offset-background flex flex-col overflow-hidden shadow-xl">
            <div class="flex items-start justify-between p-5 pb-0">
              <h2 class="text-white font-bold text-lg flex-1 pr-4">${name}</h2>
              <button onclick="closeProductDetail()" class="w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 transition-all cursor-pointer flex-shrink-0">
                <i data-lucide="x" class="w-4 h-4 text-white/50"></i>
              </button>
            </div>

            <div class="text-white/50 text-sm leading-relaxed product-description p-5 overflow-y-auto flex-1">${description}</div>

            <div class="flex items-end justify-between p-5 pt-4 border-t border-white/[0.07]">
              <div class="flex flex-col">
                <span class="text-white/40 text-xs">por</span>
                ${oldPriceHtml}
                <span class="text-white font-bold text-xl">R$ ${formatPrice(price)}</span>
                ${stockHtml}
              </div>

              <div class="flex items-center gap-2">
                <button onclick="closeProductDetail()" class="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/[0.07] text-white/70 text-sm font-medium transition-all cursor-pointer">
                  Fechar
                </button>
                ${outOfStock
                  ? `<button disabled class="px-5 py-2.5 rounded-xl bg-white/10 text-white/30 text-sm font-medium flex items-center gap-2 cursor-not-allowed">
                      <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                      Sem estoque
                    </button>`
                  : isInCart(pkg.id)
                    ? `<button onclick="closeProductDetail()" class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer" style="color: ${contrastColor}">
                        <i data-lucide="shopping-basket" class="w-4 h-4"></i>
                        No carrinho
                      </button>`
                    : `<button onclick="closeProductDetail(); addToCart(${pkg.id}, '${name.replace(/'/g, "\\'")}', ${price}, '${image.replace(/'/g, "\\'")}')" class="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/80 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer" style="color: ${contrastColor}">
                        <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                        Adicionar ao carrinho
                      </button>`
                }
              </div>
            </div>
          </div>

        </div>
      </div>`;
  },

};
