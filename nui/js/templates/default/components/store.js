window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.store = {

  renderLoading() {
    return `
    <div class="w-screen h-screen flex items-center justify-center">
      <div class="relative flex flex-col items-center justify-center rounded-2xl bg-background w-[90vw] h-[90vh] gap-4">
        <button type="button" onclick="closeStore()" class="absolute top-6 right-6 z-10 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
            <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
        </button>
        <div class="loading-spinner"></div>
        <p class="text-white/60 text-sm font-medium">Aguarde, estamos carregando a loja...</p>
      </div>
    </div>`;
  },

  renderEmptyState() {
    return `
    <div class="w-full h-full flex flex-col items-center justify-center gap-3">
        <i data-lucide="package-x" class="w-14 h-14" style="color: rgb(var(--color-primary) / 0.4)"></i>
        <p class="text-white/30 text-sm font-medium">Nenhum produto disponível</p>
        <p class="text-white/15 text-xs">Selecione outra categoria para ver os produtos</p>
    </div>`;
  },

  renderCategorySection(name, packages, isFirst) {
    if (!packages || packages.length === 0) return '';
    const marginTop = isFirst ? '' : 'mt-10';
    const cards = packages.map(pkg => window.StoreTemplates.default.renderProductCard(pkg)).join('');
    return `
    <div class="${marginTop}">
        <div class="inline-block mb-4 px-1">
            <h2 class="text-white font-extrabold text-sm uppercase">${name}</h2>
            <div class="h-[2px] mt-1" style="background: linear-gradient(to right, rgb(var(--color-primary) / 0.5), transparent)"></div>
        </div>
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            ${cards}
        </div>
    </div>`;
  },

  renderTabs(data) {
    const { categories, activeFilter, activeParent } = data;
    const isAllActive = activeFilter === 'all';
    const tabBase = 'uppercase text-xs font-bold tracking-wide transition-colors duration-200 cursor-pointer py-1';
    let tabsHtml = `
    <button type="button" class="${isAllActive ? 'tab-active' : 'tab-inactive'} ${tabBase}" onclick="filterCategory('all', this)">
        Todos
    </button>`;
    categories.forEach(cat => {
      const subs = cat.sub_categories || [];
      const hasSubs = subs.length > 0;
      const isActive = activeFilter == cat.id || activeParent == cat.id;
      const label = (cat.name || '').toUpperCase();
      if (hasSubs) {
        const subsData = encodeURIComponent(JSON.stringify(subs.map(s => ({ id: s.id, name: s.name }))));
        tabsHtml += `
        <button type="button" class="${isActive ? 'tab-active' : 'tab-inactive'} tab-has-sub ${tabBase} inline-flex items-center gap-1"
                data-cat-id="${cat.id}" data-cat-name="${cat.name}" data-subs="${subsData}"
                onmouseenter="showDropdown(this)">
            ${label}
            <svg class="w-3 h-3 flex-shrink-0 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg>
        </button>`;
      } else {
        tabsHtml += `
        <button type="button" class="${isActive ? 'tab-active' : 'tab-inactive'} ${tabBase}" onclick="filterCategory(${cat.id}, this)">
            ${label}
        </button>`;
      }
    });
    return tabsHtml;
  },

  renderStore(data) {
    const { tabs, storeLogo, emptyState, contrastColor } = data;
    return `
    <div class="w-screen h-screen flex items-center justify-center">
    <div class="relative flex flex-col rounded-2xl p-6 bg-background border-2 border-white/[0.1] shadow-lg gap-4 w-[90vw] h-[90vh]">
        <div class="flex items-center gap-2" style="width: calc(100% - 316px)">
            <div class="h-9 rounded-lg flex-shrink-0 flex items-center justify-center mr-2">
                <img src="images/logo.png" alt="Logo" class="h-full object-contain pointer-events-none select-none" draggable="false" oncontextmenu="return false" onerror="if('${storeLogo}'){this.src='${storeLogo}';this.onerror=null;}" />
            </div>

            <button id="tab-arrow-left" onclick="scrollTabs(-1)" class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.07] text-white/50 hover:text-white transition-all cursor-pointer z-10">
                <i data-lucide="chevron-left" class="w-4 h-4"></i>
            </button>

            <div class="flex-1 min-w-0">
                <div id="tabs-container" class="flex items-center gap-6 md:gap-8 overflow-x-auto flex-1 min-w-0 px-1">
                    ${tabs}
                </div>
            </div>

            <button id="tab-arrow-right" onclick="scrollTabs(1)" class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/[0.07] text-white/50 hover:text-white transition-all cursor-pointer z-10">
                <i data-lucide="chevron-right" class="w-4 h-4"></i>
            </button>

        </div>

        <div class="flex-1 min-h-0 pr-[316px]">
            <div class="h-full overflow-hidden">
                <div class="h-full px-2 py-4 overflow-y-auto" id="products-scroll">
                    ${emptyState}
                </div>
            </div>
        </div>

        <div class="absolute right-6 bottom-6 w-[300px] flex flex-col gap-3" style="top: 1.5rem">
            <div class="flex items-center gap-10">
                <div class="group flex items-center bg-white/5 border border-white/[0.07] hover:border-primary focus-within:border-primary rounded-lg overflow-hidden flex-1 min-w-0 transition-colors">
                    <input id="search-input" type="text" placeholder="Pesquisar..." autocomplete="off"
                        class="bg-transparent text-white text-xs px-3 py-1.5 w-full min-w-0 outline-none placeholder-white/30"
                        onkeydown="if(event.key==='Enter') searchProducts()" />
                    <button onclick="searchProducts()" class="px-2 py-1.5 transition-all cursor-pointer">
                        <i data-lucide="search" class="w-3.5 h-3.5 text-white/50 group-hover:text-primary group-focus-within:text-primary transition-colors"></i>
                    </button>
                </div>
                <button onclick="closeStore()" class="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md bg-red-500/15 hover:bg-red-500/25 transition-all cursor-pointer">
                    <i data-lucide="x" class="w-3.5 h-3.5 text-red-400"></i>
                </button>
            </div>
            <div class="flex-1 bg-muted rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                <div class="px-5 py-4 border-b border-white/[0.07]">
                    <h2 class="text-white font-bold text-sm">Itens no carrinho</h2>
                </div>

            <div class="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2" id="cart-items">
                <div class="flex-1 flex flex-col items-center justify-center gap-3">
                    <i data-lucide="shopping-cart" class="w-10 h-10 text-primary"></i>
                    <div class="text-center">
                        <p class="text-white/60 text-sm font-semibold">Seu carrinho está vazio.</p>
                        <p class="text-white/30 text-xs mt-1">Assim que você escolher um produto, ele aparecerá aqui!</p>
                    </div>
                </div>
            </div>

            <div id="cart-footer" class="p-4 border-t border-white/[0.07] flex-col gap-3 hidden">
                <div class="flex items-center justify-between bg-white/[0.03] border border-white/[0.07] rounded-xl px-4 py-2.5">
                    <span class="text-white/50 text-xs">Total:</span>
                    <span class="text-white font-bold text-sm" id="cart-total">R$ 0</span>
                </div>
                <button onclick="checkout()" class="w-full py-2.5 bg-[rgb(var(--color-primary))] hover:bg-[rgb(var(--color-primary)/0.8)] text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2" style="color: ${contrastColor}">
                    <i data-lucide="shopping-basket" class="w-4 h-4"></i>
                    Finalizar compra
                </button>
            </div>
            </div>
        </div>

    </div>
    </div>`;
  },

};
