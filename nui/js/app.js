const DEV_MODE = false;

let storeCategories = [];
let storePackages = [];
let activeFilter = 'all';
let activeParent = null;
let searchQuery = '';
let storeLogo = '';
const API_BASE = 'https://api.centralcart.io/v1';
let storeStoreDomain = '';
let storePlayerId = null;
let storeDiscord = null;
let storeRequiresDiscord = false;
let pendingProductId = null;
let activeTemplate = 'default';

let selectedGateway = 'PIX';
let storeGateways = [];
let storeRequireDocument = false;
let storeRequirePhone = false;
let appliedCoupon = '';
let couponData = null;
let couponError = '';

const cart = [];

function getTemplate() {
  return window.StoreTemplates[activeTemplate] || window.StoreTemplates.default;
}

function maskCPF(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, '$1.$2.$3-$4');
  else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
  else if (v.length > 3) v = v.replace(/(\d{3})(\d{1,3})/, '$1.$2');
  input.value = v;
}

function maskPhone(input) {
  let v = input.value.replace(/\D/g, '').slice(0, 11);
  if (v.length > 6) v = v.replace(/(\d{2})(\d{5})(\d{1,4})/, '($1) $2-$3');
  else if (v.length > 2) v = v.replace(/(\d{2})(\d{1,5})/, '($1) $2');
  input.value = v;
}

function cleanDomain(domain) {
  if (!domain) return '';
  return domain.replace(/^https?:\/\//, '').replace(/\/+$/, '');
}

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r} ${g} ${b}`;
}

function formatPrice(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getPrimaryContrastColor() {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim();
  const [r, g, b] = raw.split(' ').map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

function applyColors(colors) {
  const root = document.documentElement;
  for (const [name, hex] of Object.entries(colors)) {
    if (hex && hex !== '') {
      root.style.setProperty(`--color-${name}`, hexToRgb(hex));
    }
  }
}

async function loadConfigFromLua() {
  const res = await fetch('../config.lua?t=' + Date.now());
  const text = await res.text();
  const colors = {};
  const matches = text.matchAll(/(\w+)\s*=\s*'(#[0-9a-fA-F]{6})'/g);
  for (const m of matches) {
    colors[m[1]] = m[2];
  }

  const storeMatch = text.match(/store\s*=\s*["']([^"']+)["']/m);
  const templateMatch = text.match(/template\s*=\s*["']([^"']+)["']/m);

  return {
    colors,
    baseURL: 'https://api.centralcart.io/v1',
    storeDomain: storeMatch ? cleanDomain(storeMatch[1]) : '',
    template: templateMatch ? templateMatch[1] : 'default',
  };
}

const App = {
  container: document.getElementById('app'),
  visible: false,

  render(id, html) {
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      this.container.appendChild(el);
    }
    el.innerHTML = html;
  },

  remove(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  },

  clear() {
    this.container.innerHTML = '';
  },

  show() {
    this.visible = true;
    this.container.classList.remove('hidden', 'hide');
    this.container.classList.add('show');
    const backdrop = document.getElementById('app-backdrop');
    if (backdrop) {
      backdrop.classList.remove('closing');
      backdrop.classList.add('active');
    }
  },

  hide() {
    this.visible = false;
    this.container.classList.add('hide');
    const backdrop = document.getElementById('app-backdrop');
    if (backdrop) {
      backdrop.classList.remove('active');
      backdrop.classList.add('closing');
    }
    setTimeout(() => {
      this.container.classList.remove('show');
      this.container.classList.add('hidden');
      this.clear();
      if (backdrop) backdrop.classList.remove('closing');
      cart.length = 0;
      selectedGateway = storeGateways.length > 0 ? storeGateways[0].id : 'PIX';
      appliedCoupon = '';
      couponData = null;
      couponError = '';
      searchQuery = '';
      activeFilter = 'all';
      activeParent = null;
      pendingProductId = null;
      checkoutFormName = '';
      checkoutFormEmail = '';
      checkoutFormCoupon = '';
      checkoutFormDocument = '';
      checkoutFormPhone = '';
    }, 300);
  },

  toggle() {
    this.visible ? this.hide() : this.show();
  }
};

if (!DEV_MODE) {
  window.addEventListener('message', (event) => {
    const data = event.data;
    switch (data.action) {
      case 'open':
        if (data.colors) applyColors(data.colors);
        if (data.template) activeTemplate = data.template;
        if (data.storeDomain) storeStoreDomain = cleanDomain(data.storeDomain);
        if (data.playerId) storePlayerId = data.playerId;
        if (data.discord) storeDiscord = data.discord;
        App.show();
        renderStore();
        break;
      case 'openProduct':
        if (data.colors) applyColors(data.colors);
        if (data.template) activeTemplate = data.template;
        if (data.storeDomain) storeStoreDomain = cleanDomain(data.storeDomain);
        if (data.playerId) storePlayerId = data.playerId;
        if (data.discord) storeDiscord = data.discord;
        pendingProductId = data.packageId;
        App.show();
        renderStore();
        break;
      case 'close':
        App.hide();
        break;
      case 'storeData':
        storeCategories = data.categories || [];
        if (data.storeInfo) {
          if (data.storeInfo.store?.active_domain) {
            storeStoreDomain = cleanDomain(data.storeInfo.store.active_domain);
          }
          if (data.storeInfo.theme?.primary_color) {
            const configPrimary = '';
            if (!configPrimary) {
              document.documentElement.style.setProperty('--color-primary', hexToRgb(data.storeInfo.theme.primary_color));
            }
          }
          if (data.storeInfo.theme?.logo) storeLogo = data.storeInfo.theme.logo;
          if (data.storeInfo.store?.require_document) storeRequireDocument = true;
          if (data.storeInfo.store?.require_phone) storeRequirePhone = true;
          if (data.storeInfo.store?.discord_mode === 'REQUIRED' || data.storeInfo.store?.auth) storeRequiresDiscord = true;
        }
        if (data.gateways && data.gateways.length > 0) {
          const gatewayMeta = {
            PIX: { desc: 'Aprovação imediata', badge: 'Mais rápido', badgeIcon: 'zap', badgeColor: 'primary' },
            MERCADOPAGO: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
            PAYPAL: { desc: 'Aprovação imediata', badge: 'Crédito e débito', badgeIcon: 'credit-card', badgeColor: 'purple' },
            STRIPE: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
            PICPAY: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
          };
          storeGateways = data.gateways.map(gw => {
            const meta = gatewayMeta[gw.gateway] || { desc: '', badge: '', badgeIcon: '', badgeColor: '' };
            return {
              id: gw.gateway,
              label: gw.display,
              desc: meta.desc,
              badge: meta.badge,
              badgeIcon: meta.badgeIcon,
              badgeColor: meta.badgeColor,
              icon: `https://cdn.centralcart.io/public/gateway-icons/icon-${gw.name.toLowerCase()}.svg`,
              fee: gw.fee,
              is_percentage_fee: gw.is_percentage_fee,
            };
          });
          selectedGateway = storeGateways[0].id;
        }
        renderStore();
        break;
      case 'playerId':
        if (data.playerId) storePlayerId = data.playerId;
        if (data.discord) storeDiscord = data.discord;
        break;
      case 'categoryPackages':
        const catPkgs = (data.packages || [])
          .filter(p => !p.parent_id)
          .map(pkg => {
            const hasVariations = Array.isArray(pkg.variations) && pkg.variations.length > 0;
            if (pkg.pricing) {
              const basePrice = hasVariations ? (pkg.pricing.min ?? pkg.pricing.price) : pkg.pricing.price;
              pkg.price = basePrice ?? pkg.price;
              pkg.compare_at_price = pkg.pricing.compare_at ?? pkg.compare_at_price;
              pkg.price_min = pkg.pricing.min ?? null;
              pkg.price_max = pkg.pricing.max ?? null;
            }
            pkg.has_variations = hasVariations;
            if (pkg.stock) {
              pkg.inventory_amount = pkg.stock.quantity ?? pkg.inventory_amount;
              if (pkg.stock.available === false && pkg.inventory_amount === null) pkg.inventory_amount = 0;
            }
            return pkg;
          });
        storePackages.push(...catPkgs.filter(p => !storePackages.some(sp => sp.id === p.id)));
        const pendingSection = pendingSectionLoads[data.categoryId];
        if (pendingSection) {
          const catIds = pendingSection.dataset.catIds.split(',').map(Number);
          const filtered = storePackages.filter(p => catIds.includes(p.category_id) && p.enabled !== false);
          renderSectionContent(pendingSection, filtered);
          delete pendingSectionLoads[data.categoryId];
        }
        break;
      case 'orderStatus':
        if (data.status && data.status !== 'PENDING') {
          showPixSuccess();
        }
        break;
      case 'checkoutResult':
        if (data.success && data.data) {
          cart.length = 0;
          renderCart();
          if (data.data.pix_code && data.data.qr_code) {
            renderPixPayment(data.data);
          } else if (data.data.checkout_url) {
            window.invokeNative('openUrl', data.data.checkout_url);
            closeStore();
          }
        }
        break;
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const productDetail = document.getElementById('product-detail-overlay');
      const fieldsDialog = document.getElementById('fields-dialog-overlay');
      if (productDetail) {
        closeProductDetail();
        return;
      }
      if (fieldsDialog) {
        closeFieldsDialog();
        return;
      }
      App.hide();
      fetch(`https://${GetParentResourceName()}/close`, {
        method: 'POST',
        body: JSON.stringify({})
      }).catch(() => { });
    }
  });
}

function buildCategoryTree() {
  const topCats = storeCategories.filter(c => !c.parent_id);
  topCats.forEach(cat => {
    if (!cat.sub_categories || cat.sub_categories.length === 0) {
      cat.sub_categories = storeCategories.filter(c => c.parent_id == cat.id);
    }
  });
  return topCats;
}

function getTopCategories() {
  return buildCategoryTree();
}

function findCategoryOrSub(id) {
  const topCats = buildCategoryTree();
  for (const cat of topCats) {
    if (cat.id == id) return { cat, isSub: false };
    const subs = cat.sub_categories || [];
    for (const sub of subs) {
      if (sub.id == id) return { cat: sub, isSub: true, parent: cat };
    }
  }
  return null;
}

let allSectionsQueue = [];

function getPackagesForCategoryId(catId) {
  return storePackages.filter(p => p.category_id == catId && p.enabled !== false);
}

const pendingSectionLoads = {};

async function loadAndFillSection(section) {
  const catIds = section.dataset.catIds.split(',').map(Number);
  const catId = catIds[0];

  const cached = storePackages.filter(p => catIds.includes(p.category_id) && p.enabled !== false);
  if (cached.length > 0) {
    renderSectionContent(section, cached);
    return;
  }

  if (DEV_MODE) {
    const config = await loadConfigFromLua();
    const pkgs = await CentralCart.fetchPackagesByCategory(API_BASE, cleanDomain(config.storeDomain), catId);
    storePackages.push(...pkgs.filter(p => !storePackages.some(sp => sp.id === p.id)));
    const filtered = storePackages.filter(p => catIds.includes(p.category_id) && p.enabled !== false);
    renderSectionContent(section, filtered);
  } else {
    pendingSectionLoads[catId] = section;
    fetch(`https://${GetParentResourceName()}/requestCategoryPackages`, {
      method: 'POST',
      body: JSON.stringify({ categoryId: catId })
    }).catch(() => {});
  }
}

function renderSectionContent(section, pkgs) {
  const T = getTemplate();
  const grid = section.querySelector('.section-grid');
  const spinner = section.querySelector('.section-spinner');
  if (!grid) return;

  if (searchQuery) {
    pkgs = pkgs.filter(p => (p.name || '').toLowerCase().includes(searchQuery));
  }

  if (pkgs.length > 0) {
    pkgs.sort((a, b) => (b.highlighted ? 1 : 0) - (a.highlighted ? 1 : 0));
    grid.innerHTML = pkgs.map(pkg => T.renderProductCard(pkg)).join('');
    section.dataset.loaded = 'true';
    if (spinner) spinner.remove();
    if (typeof lucide !== 'undefined') lucide.createIcons();
    observeCardsIn(grid);

    if (activeFilter === 'all') addScrollSentinel();

    if (pendingProductId) {
      const pkg = pkgs.find(p => p.id === pendingProductId);
      if (pkg) {
        pendingProductId = null;
        setTimeout(() => openProductDetail(pkg.id), 300);
      }
    }
  } else {
    section.remove();
    if (activeFilter === 'all') addScrollSentinel();
  }
}

function addScrollSentinel() {
  const container = document.getElementById('products-scroll');
  if (!container) return;
  if (document.getElementById('next-section-sentinel')) return;

  const nextIdx = allSectionsQueue.findIndex(s => !s.rendered);
  if (nextIdx === -1) return;

  const sentinel = document.createElement('div');
  sentinel.id = 'next-section-sentinel';
  sentinel.className = 'w-full h-1';
  container.appendChild(sentinel);

  const observer = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    observer.unobserve(sentinel);
    sentinel.remove();
    appendNextSection();
  }, { root: container, rootMargin: '300px' });

  observer.observe(sentinel);
}

function appendNextSection() {
  if (activeFilter !== 'all' || allSectionsQueue.length === 0) return;

  const container = document.getElementById('products-scroll');
  if (!container) return;

  const nextIdx = allSectionsQueue.findIndex(s => !s.rendered);
  if (nextIdx === -1) return;

  const next = allSectionsQueue[nextIdx];
  const isFirst = container.querySelectorAll('.category-section').length === 0;
  const html = renderLazySection(next.name, next.catId, next.catIds, isFirst, next.expectedCount);
  container.insertAdjacentHTML('beforeend', html);
  next.rendered = true;

  if (typeof lucide !== 'undefined') lucide.createIcons();

  const newSection = container.querySelector(`.category-section[data-cat-id="${next.catId}"]`);
  if (newSection) {
    loadAndFillSection(newSection);
  }
}

function renderProducts() {
  const T = getTemplate();
  const container = document.getElementById('products-scroll');
  if (!container) return;
  const tabsContainer = document.getElementById('tabs-container');
  if (tabsContainer) {
    tabsContainer.innerHTML = T.renderTabs({ categories: getTopCategories() || [], activeFilter, activeParent });
  }

  let html = '';

  if (activeFilter === 'all') {
    const topCats = getTopCategories() || [];
    if (topCats.length === 0) {
      container.innerHTML = `<div class="w-full h-full flex items-center justify-center"><div class="loading-spinner"></div></div>`;
      return;
    }

    if (searchQuery && storePackages.length > 0) {
      const T2 = getTemplate();
      let isFirst = true;
      let hasResults = false;
      topCats.forEach(cat => {
        const subs = cat.sub_categories || [];
        if (subs.length > 0) {
          subs.forEach(sub => {
            const pkgs = storePackages.filter(p => p.category_id == sub.id && p.enabled !== false && (p.name || '').toLowerCase().includes(searchQuery));
            if (pkgs.length > 0) {
              html += T2.renderCategorySection(sub.name, pkgs, isFirst);
              isFirst = false;
              hasResults = true;
            }
          });
        } else {
          const pkgs = storePackages.filter(p => p.category_id == cat.id && p.enabled !== false && (p.name || '').toLowerCase().includes(searchQuery));
          if (pkgs.length > 0) {
            html += T2.renderCategorySection(cat.name, pkgs, isFirst);
            isFirst = false;
            hasResults = true;
          }
        }
      });
      if (!hasResults) {
        container.innerHTML = T2.renderEmptyState();
        lucide.createIcons();
        return;
      }
      container.innerHTML = html;
      lucide.createIcons();
      observeCards();
      setTimeout(() => updateTabArrows(), 100);
      return;
    }

    allSectionsQueue = [];
    topCats.forEach(cat => {
      const subs = cat.sub_categories || [];

      if (subs.length > 0) {
        subs.forEach(sub => {
          allSectionsQueue.push({ name: sub.name, catId: sub.id, catIds: [sub.id], expectedCount: sub.packages_count || 0 });
        });
      } else if (cat.packages_count > 0) {
        allSectionsQueue.push({ name: cat.name, catId: cat.id, catIds: [cat.id], expectedCount: cat.packages_count });
      }
    });

    if (allSectionsQueue.length > 0) {
      html = renderLazySection(allSectionsQueue[0].name, allSectionsQueue[0].catId, allSectionsQueue[0].catIds, true, allSectionsQueue[0].expectedCount);
      allSectionsQueue[0].rendered = true;
    }
  } else {
    const found = findCategoryOrSub(activeFilter);
    if (found) {
      let isFirst = true;
      if (found.isSub) {
        html += renderLazySection(found.cat.name, found.cat.id, [found.cat.id], true, found.cat.packages_count);
      } else {
        if (found.cat.packages_count > 0) {
          html += renderLazySection(found.cat.name, found.cat.id, [found.cat.id], isFirst, found.cat.packages_count);
          isFirst = false;
        }
        (found.cat.sub_categories || []).forEach(sub => {
          if (sub.packages_count > 0) {
            html += renderLazySection(sub.name, sub.id, [sub.id], isFirst, sub.packages_count);
            isFirst = false;
          }
        });
      }
    }
  }

  container.innerHTML = html || getTemplate().renderEmptyState();
  lucide.createIcons();
  setTimeout(() => updateTabArrows(), 100);

  const firstSection = container.querySelector('.category-section[data-loaded="false"]');
  if (firstSection) {
    loadAndFillSection(firstSection);
  }
}

function renderLazySection(name, catId, catIds, isFirst, expectedCount) {
  const marginTop = isFirst ? '' : 'mt-10';
  return `
    <div class="category-section ${marginTop}" data-cat-id="${catId}" data-cat-ids="${catIds.join(',')}" data-loaded="false" data-expected-count="${expectedCount || 0}">
      <div class="inline-block mb-4 px-1">
        <h2 class="text-white font-extrabold text-sm uppercase">${name}</h2>
        <div class="h-[2px] mt-1" style="background: linear-gradient(to right, rgb(var(--color-primary) / 0.5), transparent)"></div>
      </div>
      <div class="section-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"></div>
      <div class="section-spinner w-full flex justify-center py-6"><div class="loading-spinner" style="width:24px;height:24px;border-width:2px"></div></div>
    </div>`;
}


function observeCardsIn(container) {
  const scrollContainer = document.getElementById('products-scroll');
  if (!scrollContainer || !container) return;
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) % 5;
        setTimeout(() => entry.target.classList.add('reveal'), delay * 80);
        observer.unobserve(entry.target);
      }
    });
  }, { root: scrollContainer, threshold: 0.1 });
  container.querySelectorAll('.product-card').forEach(card => observer.observe(card));
}

function observeCards() {
  const scrollContainer = document.getElementById('products-scroll');
  if (!scrollContainer) return;
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const delay = Array.from(entry.target.parentElement.children).indexOf(entry.target) % 4;
      setTimeout(() => {
        entry.target.classList.add('reveal');
      }, delay * 80);
      observer.unobserve(entry.target);
    }
  }), { root: scrollContainer, threshold: 0.1 });
  scrollContainer.querySelectorAll('.product-card').forEach(card => {
    observer.observe(card);
  });
}

let dropdownTimeout = null;

function showDropdown(btn) {
  clearTimeout(dropdownTimeout);
  hideDropdown();
  const subs = JSON.parse(decodeURIComponent(btn.dataset.subs));
  const rect = btn.getBoundingClientRect();
  const catId = btn.dataset.catId;
  const menu = document.createElement('div');
  menu.id = 'floating-dropdown';
  menu.className = 'tab-dropdown-menu';
  menu.style.cssText = `
        position: fixed;
        top: ${rect.bottom + 4}px;
        left: ${rect.left}px;
        z-index: 9999;
        min-width: 160px;
        max-width: 220px;
        max-height: 240px;
        overflow-y: auto;
        padding: 4px;
        background: rgb(var(--color-muted));
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    `;
  let html = '';
  subs.forEach(sub => {
    const isSubActive = activeFilter == sub.id;
    html += `
        <button class="w-full text-left px-3 py-1.5 text-xs ${isSubActive ? 'text-primary font-semibold' : 'text-white/70'} hover:text-white hover:bg-white/5 transition-all rounded" onclick="filterSubcategory(${sub.id}, ${catId})">
            ${sub.name}
        </button>`;
  });
  menu.innerHTML = html;
  menu.onmouseenter = () => clearTimeout(dropdownTimeout);
  menu.onmouseleave = () => { dropdownTimeout = setTimeout(hideDropdown, 150); };
  btn.onmouseleave = () => { dropdownTimeout = setTimeout(hideDropdown, 150); };
  document.body.appendChild(menu);
}

function hideDropdown() {
  const existing = document.getElementById('floating-dropdown');
  if (existing) existing.remove();
}

function filterSubcategory(subId, parentId) {
  if (activeFilter === subId) return;
  activeFilter = subId;
  activeParent = parentId;
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  hideDropdown();
  renderProducts();
}

function scrollTabs(direction) {
  const container = document.getElementById('tabs-container');
  if (!container) return;
  container.scrollBy({ left: direction * 200, behavior: 'smooth' });
  setTimeout(() => updateTabArrows(), 300);
}

function updateTabArrows() {
  const container = document.getElementById('tabs-container');
  if (!container) return;
  const leftBtn = document.getElementById('tab-arrow-left');
  const rightBtn = document.getElementById('tab-arrow-right');
  if (!leftBtn || !rightBtn) return;

  const hasOverflow = container.scrollWidth > container.clientWidth + 1;
  const atStart = container.scrollLeft <= 0;
  const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 1;

  if (!hasOverflow) {
    leftBtn.style.display = 'none';
    rightBtn.style.display = 'none';
    return;
  }

  leftBtn.style.display = 'flex';
  rightBtn.style.display = 'flex';

  leftBtn.disabled = atStart;
  leftBtn.style.opacity = atStart ? '0.25' : '1';
  leftBtn.style.pointerEvents = atStart ? 'none' : 'auto';

  rightBtn.disabled = atEnd;
  rightBtn.style.opacity = atEnd ? '0.25' : '1';
  rightBtn.style.pointerEvents = atEnd ? 'none' : 'auto';
}

window.addEventListener('resize', () => setTimeout(updateTabArrows, 100));

function filterCategory(categoryId) {
  if (activeFilter === categoryId) return;
  activeFilter = categoryId;
  activeParent = (categoryId === 'all') ? null : categoryId;
  searchQuery = '';
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  hideDropdown();
  renderProducts();
}

function openProductDetail(pkgId) {
  const pkg = storePackages.find(p => p.id === pkgId);
  if (!pkg) return;
  selectedVariation = null;
  const T = getTemplate();
  const overlay = document.createElement('div');
  overlay.id = 'product-detail-overlay';
  overlay.className = 'product-detail-overlay';
  overlay.innerHTML = T.renderProductDetail(pkg);
  document.body.appendChild(overlay);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  requestAnimationFrame(() => overlay.classList.add('show'));

  const hasVariations = pkg.has_variations || (Array.isArray(pkg.variations) && pkg.variations.length > 0);
  if (hasVariations) {
    const firstOpt = overlay.querySelector('.variation-option');
    if (firstOpt) selectVariation(firstOpt);
  }
}

function adjustProductDetailHeight() {
  const img = document.getElementById('product-detail-img');
  const info = document.getElementById('product-detail-info');
  if (!img || !info) return;
  const maxH = window.innerHeight * 0.8;
  const imgHeight = img.offsetHeight;
  const targetHeight = Math.min(Math.max(imgHeight + 80, 400), maxH);
  info.style.height = targetHeight + 'px';
}

function closeProductDetail() {
  const overlay = document.getElementById('product-detail-overlay');
  if (!overlay) return;
  overlay.classList.remove('show');
  overlay.classList.add('hide');
  setTimeout(() => overlay.remove(), 200);
  selectedVariation = null;
}

function showLoading() {
  const T = getTemplate();
  App.render('store', T.renderLoading());
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function searchProducts() {
  const input = document.getElementById('search-input');
  searchQuery = (input?.value || '').trim().toLowerCase();
  renderProducts();
}

function renderStore() {
  const T = getTemplate();
  const tabs = T.renderTabs({ categories: getTopCategories(), activeFilter, activeParent });
  const contrastColor = getPrimaryContrastColor();

  App.render('store', T.renderStore({ tabs, storeLogo, emptyState: T.renderEmptyState(), contrastColor }));

  lucide.createIcons();
  renderProducts();
  renderCart();
  setTimeout(() => updateTabArrows(), 100);

  const tabsContainer = document.getElementById('tabs-container');
  if (tabsContainer) {
    tabsContainer.addEventListener('scroll', () => updateTabArrows());
  }
}

function closeStore() {
  App.hide();
  if (!DEV_MODE) {
    fetch(`https://${GetParentResourceName()}/close`, {
      method: 'POST',
      body: JSON.stringify({})
    }).catch(() => { });
  }
}

function updateProductButton(id, inCart) {
  const btn = document.getElementById(`btn-add-${id}`);
  if (!btn) return;
  if (inCart) {
    btn.innerHTML = `<i data-lucide="shopping-basket" class="w-3.5 h-3.5"></i> No carrinho`;
  } else {
    btn.innerHTML = `<i data-lucide="shopping-cart" class="w-3.5 h-3.5"></i> Adicionar`;
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function isInCart(id) {
  return cart.some(item => item.id === id);
}

function addToCart(id, name, price, image) {
  const pkg = storePackages.find(p => p.id === id);
  const fields = pkg?.fields || [];

  if (fields.length > 0) {
    showFieldsDialog(id, name, price, image, fields);
    return;
  }

  doAddToCart(id, name, price, image, {});
}

let selectedVariation = null;

function toggleVariationSelect(btn) {
  const container = btn.closest('.custom-select');
  const dropdown = container?.querySelector('.variation-select-dropdown');
  const arrow = btn.querySelector('.variation-select-arrow');
  if (!dropdown) return;
  const isOpen = !dropdown.classList.contains('hidden');
  if (isOpen) {
    dropdown.classList.add('hidden');
    if (arrow) arrow.style.removeProperty('transform');
  } else {
    dropdown.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
  }
}

function selectVariation(optEl) {
  selectedVariation = {
    id: Number(optEl.dataset.variationId),
    name: optEl.dataset.variationName,
    price: Number(optEl.dataset.variationPrice),
    image: optEl.dataset.variationImage,
  };

  const container = optEl.closest('.custom-select');
  if (container) {
    const label = container.querySelector('.variation-select-label');
    if (label) {
      label.textContent = `${selectedVariation.name} — R$ ${formatPrice(selectedVariation.price)}`;
      label.classList.remove('text-white/60');
      label.classList.add('text-white');
    }
    const dropdown = container.querySelector('.variation-select-dropdown');
    if (dropdown) dropdown.classList.add('hidden');
    const arrow = container.querySelector('.variation-select-arrow');
    if (arrow) arrow.style.removeProperty('transform');
    container.querySelectorAll('.variation-option').forEach(el => {
      el.classList.remove('text-white', 'font-semibold', 'bg-white/[0.04]');
      el.classList.add('text-white/70');
    });
    optEl.classList.remove('text-white/70');
    optEl.classList.add('text-white', 'font-semibold', 'bg-white/[0.04]');
  }

  const priceEl = document.getElementById('product-detail-price');
  if (priceEl) priceEl.textContent = `R$ ${formatPrice(selectedVariation.price)}`;
  const priceLabelEl = document.getElementById('product-detail-price-label');
  if (priceLabelEl) priceLabelEl.textContent = 'por';
  const imgEl = document.getElementById('product-detail-img');
  if (imgEl && selectedVariation.image) imgEl.src = selectedVariation.image;

  const addBtn = document.getElementById('product-detail-add-btn');
  if (addBtn) {
    addBtn.disabled = false;
    addBtn.classList.remove('bg-white/10', 'text-white/30', 'cursor-not-allowed');
    addBtn.classList.add('bg-primary', 'hover:bg-primary/80', 'cursor-pointer');
    addBtn.innerHTML = `<i data-lucide="shopping-cart" class="w-4 h-4"></i> Adicionar ao carrinho`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
  }
}

function addSelectedVariation() {
  if (!selectedVariation) return;
  const v = selectedVariation;
  closeProductDetail();
  addToCart(v.id, v.name, v.price, v.image);
  selectedVariation = null;
}

function doAddToCart(id, name, price, image, fieldValues) {
  const existingIndex = cart.findIndex(item => item.id === id);
  if (existingIndex !== -1) {
    cart[existingIndex].qty = Math.min(cart[existingIndex].qty + 1, 999);
    if (Object.keys(fieldValues).length > 0) {
      cart[existingIndex].fields = fieldValues;
    }
    updateCartItemUI(existingIndex);
    updateCartTotal();
  } else {
    cart.push({ id, name, price, qty: 1, image: image || 'images/no-image.png', fields: fieldValues });
    renderCart();
    updateProductButton(id, true);
  }
}

function showFieldsDialog(id, name, price, image, fields) {
  const T = getTemplate();
  const overlay = document.createElement('div');
  overlay.id = 'fields-dialog-overlay';
  overlay.innerHTML = T.renderFieldsDialog(id, name, price, image, fields);
  document.body.appendChild(overlay);
  if (typeof lucide !== 'undefined') lucide.createIcons();
  requestAnimationFrame(() => {
    overlay.querySelector('.fields-dialog-overlay')?.classList.add('show');
  });
}

function toggleCustomSelect(btn) {
  const dropdown = btn.nextElementSibling;
  const arrow = btn.querySelector('.custom-select-arrow');
  const isOpen = !dropdown.classList.contains('hidden');

  document.querySelectorAll('.custom-select-dropdown').forEach(d => {
    d.classList.add('hidden');
    d.previousElementSibling?.querySelector('.custom-select-arrow')?.style.removeProperty('transform');
  });

  if (!isOpen) {
    dropdown.classList.remove('hidden');
    if (arrow) arrow.style.transform = 'rotate(180deg)';

    dropdown.querySelectorAll('.custom-select-option').forEach(opt => {
      opt.onclick = () => {
        const hidden = btn.closest('.custom-select').parentElement.querySelector('input[type="hidden"]');
        if (hidden) hidden.value = opt.dataset.value;
        btn.querySelector('.custom-select-label').textContent = opt.textContent;
        dropdown.querySelectorAll('.custom-select-option').forEach(o => {
          o.classList.remove('text-white', 'font-semibold');
          o.classList.add('text-white/50');
          const check = o.querySelector('.select-check');
          if (check) check.classList.add('hidden');
        });
        opt.classList.remove('text-white/50');
        opt.classList.add('text-white', 'font-semibold');
        const check = opt.querySelector('.select-check');
        if (check) check.classList.remove('hidden');
        dropdown.classList.add('hidden');
        if (arrow) arrow.style.removeProperty('transform');
      };
    });
  }
}

document.addEventListener('click', (e) => {
  if (!e.target.closest('.custom-select')) {
    document.querySelectorAll('.custom-select-dropdown').forEach(d => {
      d.classList.add('hidden');
      d.previousElementSibling?.querySelector('.custom-select-arrow')?.style.removeProperty('transform');
    });
    document.querySelectorAll('.variation-select-dropdown').forEach(d => {
      d.classList.add('hidden');
      d.previousElementSibling?.querySelector('.variation-select-arrow')?.style.removeProperty('transform');
    });
  }
});

function closeFieldsDialog() {
  const overlay = document.getElementById('fields-dialog-overlay');
  if (!overlay) return;
  const dialog = overlay.querySelector('.fields-dialog-overlay');
  if (dialog) {
    dialog.classList.remove('show');
    dialog.classList.add('hide');
    setTimeout(() => overlay.remove(), 200);
  } else {
    overlay.remove();
  }
}

function submitFieldsDialog(id, name, price, image) {
  const overlay = document.getElementById('fields-dialog-overlay');
  if (!overlay) return;

  const inputs = overlay.querySelectorAll('[data-field-id]');
  const fieldValues = {};
  let valid = true;

  inputs.forEach(input => {
    const val = input.value.trim();
    if (!val) {
      input.style.borderColor = 'rgba(239,68,68,0.5)';
      valid = false;
    } else {
      input.style.borderColor = '';
      fieldValues[input.dataset.fieldId] = { name: input.dataset.fieldName, value: val };
    }
  });

  if (!valid) return;
  closeFieldsDialog();
  doAddToCart(id, name, price, image, fieldValues);
}

function removeFromCart(index) {
  const itemId = cart[index]?.id;
  cart.splice(index, 1);
  renderCart();
  if (itemId && !isInCart(itemId)) updateProductButton(itemId, false);
}

function updateCartQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty > 999) { item.qty = 999; return; }
  if (item.qty <= 0) {
    cart.splice(index, 1);
    renderCart();
    return;
  }
  updateCartItemUI(index);
}

function setCartQty(index, value) {
  const item = cart[index];
  if (!item) return;
  const qty = Math.min(parseInt(value) || 0, 999);
  if (qty <= 0) {
    cart.splice(index, 1);
    renderCart();
    return;
  }
  item.qty = qty;
  updateCartItemUI(index);
}

function updateCartItemUI(index) {
  const item = cart[index];
  if (!item) return;
  const qtyInput = document.querySelector(`#cart-qty-${index}`);
  if (qtyInput) qtyInput.value = item.qty;
  const subtotalEl = document.querySelector(`#cart-subtotal-${index}`);
  if (subtotalEl) subtotalEl.textContent = `R$ ${formatPrice(item.price * item.qty)}`;
  updateCartTotal();
}

function updateCartTotal() {
  const totalEl = document.getElementById('cart-total');
  if (!totalEl) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  totalEl.textContent = `R$ ${formatPrice(total)}`;
}

function renderCart() {
  const T = getTemplate();
  const container = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');
  const footer = document.getElementById('cart-footer');
  if (!container || !totalEl) return;

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  container.innerHTML = T.renderCart({ cart, total });
  totalEl.textContent = `R$ ${formatPrice(total)}`;

  if (cart.length === 0) {
    if (footer) { footer.classList.add('hidden'); footer.classList.remove('flex'); }
    totalEl.textContent = 'R$ 0';
  } else {
    if (footer) { footer.classList.remove('hidden'); footer.classList.add('flex'); }
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function getCheckoutData() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  let discount = 0;
  if (couponData && appliedCoupon) {
    if (couponData.type === 'PERCENTAGE') {
      discount = subtotal * (couponData.value / 100);
    } else {
      discount = couponData.value || 0;
    }
    discount = Math.min(discount, subtotal);
  }
  const total = subtotal - discount;
  const contrastColor = getPrimaryContrastColor();

  const gateways = storeGateways;

  return { cart, subtotal, discount, total, contrastColor, selectedGateway, appliedCoupon, couponData, couponError, gateways, requireDocument: storeRequireDocument, requirePhone: storeRequirePhone };
}

function checkout() {
  if (cart.length === 0) return;
  renderCheckoutForm();
}

function renderCheckoutForm() {
  saveCheckoutFormValues();
  const T = getTemplate();
  const data = getCheckoutData();

  App.render('store', T.renderCheckout(data));
  if (typeof lucide !== 'undefined') lucide.createIcons();
  restoreCheckoutFormValues();
  updateCheckoutButton();

  document.getElementById('checkout-name')?.addEventListener('input', updateCheckoutButton);
  document.getElementById('checkout-email')?.addEventListener('input', updateCheckoutButton);
  document.getElementById('checkout-document')?.addEventListener('input', updateCheckoutButton);
  document.getElementById('checkout-phone')?.addEventListener('input', updateCheckoutButton);
}

function checkoutUpdateQty(index, delta) {
  const item = cart[index];
  if (!item) return;
  item.qty += delta;
  if (item.qty > 999) item.qty = 999;
  if (item.qty <= 0) {
    cart.splice(index, 1);
    if (cart.length === 0) { closeCheckoutPage(); return; }
  }
  renderCheckoutForm();
}

function checkoutRemoveItem(index) {
  cart.splice(index, 1);
  if (cart.length === 0) { closeCheckoutPage(); return; }
  renderCheckoutForm();
}

async function applyCoupon() {
  const input = document.getElementById('checkout-coupon');
  const code = (input?.value || '').trim();
  if (!code) return;

  let storeDomain = storeStoreDomain;

  if (DEV_MODE && !storeDomain) {
    const config = await loadConfigFromLua();
    storeDomain = cleanDomain(config.storeDomain || '');
  }

  if (!storeDomain) return;

  try {
    const data = await CentralCart.validateCoupon(API_BASE, storeDomain, code);

    const appliesTo = data.applies_to || [];
    if (appliesTo.length > 0 && !appliesTo.includes(-1)) {
      const cartIds = cart.map(item => item.id);
      const valid = cartIds.some(id => appliesTo.includes(id));
      if (!valid) {
        throw new Error('Este cupom não é válido para os produtos no seu carrinho.');
      }
    }

    appliedCoupon = code.toUpperCase();
    couponData = data;
    couponError = '';
  } catch (err) {
    appliedCoupon = '';
    couponData = null;
    couponError = err.message || 'Cupom inválido ou expirado.';
    setTimeout(() => {
      couponError = '';
      const el = document.getElementById('coupon-error');
      if (el) el.remove();
    }, 5000);
  }

  renderCheckoutForm();
}

function removeCoupon() {
  appliedCoupon = '';
  couponData = null;
  couponError = '';
  renderCheckoutForm();
}

let checkoutFormName = '';
let checkoutFormEmail = '';
let checkoutFormCoupon = '';
let checkoutFormDocument = '';
let checkoutFormPhone = '';

function selectGateway(id) {
  selectedGateway = id;
  renderCheckoutForm();
}

function saveCheckoutFormValues() {
  const nameEl = document.getElementById('checkout-name');
  const emailEl = document.getElementById('checkout-email');
  const couponEl = document.getElementById('checkout-coupon');
  const docEl = document.getElementById('checkout-document');
  const phoneEl = document.getElementById('checkout-phone');
  if (nameEl) checkoutFormName = nameEl.value;
  if (emailEl) checkoutFormEmail = emailEl.value;
  if (couponEl) checkoutFormCoupon = couponEl.value;
  if (docEl) checkoutFormDocument = docEl.value;
  if (phoneEl) checkoutFormPhone = phoneEl.value;
}

function restoreCheckoutFormValues() {
  const nameEl = document.getElementById('checkout-name');
  const emailEl = document.getElementById('checkout-email');
  const couponEl = document.getElementById('checkout-coupon');
  const docEl = document.getElementById('checkout-document');
  const phoneEl = document.getElementById('checkout-phone');
  if (nameEl) nameEl.value = checkoutFormName;
  if (emailEl) emailEl.value = checkoutFormEmail;
  if (couponEl) couponEl.value = checkoutFormCoupon;
  if (docEl) docEl.value = checkoutFormDocument;
  if (phoneEl) phoneEl.value = checkoutFormPhone;
}

function updateCheckoutButton() {
  const btn = document.getElementById('checkout-submit-btn');
  if (!btn) return;
  const name = document.getElementById('checkout-name')?.value.trim();
  const email = document.getElementById('checkout-email')?.value.trim();
  const doc = document.getElementById('checkout-document')?.value.trim();
  const phone = document.getElementById('checkout-phone')?.value.trim();
  let ready = selectedGateway && name && email;
  if (storeRequireDocument && !doc) ready = false;
  if (storeRequirePhone && !phone) ready = false;

  if (ready) {
    btn.innerHTML = `<i data-lucide="shopping-basket" class="w-4 h-4"></i> Finalizar compra`;
    btn.style.opacity = '1';
  } else {
    btn.innerHTML = `<i data-lucide="lock" class="w-4 h-4"></i> Preencha seus dados`;
    btn.style.opacity = '0.5';
  }
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function submitCheckout() {
  const name = document.getElementById('checkout-name')?.value.trim();
  const email = document.getElementById('checkout-email')?.value.trim();

  const clientDocumentRaw = window.document.getElementById('checkout-document')?.value.trim() || '';
  const clientDocument = clientDocumentRaw.replace(/\D/g, '');
  const clientPhoneRaw = window.document.getElementById('checkout-phone')?.value.trim() || '';
  let clientPhone = clientPhoneRaw.replace(/\D/g, '');
  if (clientPhone && !clientPhone.startsWith('+')) clientPhone = '+55' + (clientPhone.startsWith('55') ? clientPhone.slice(2) : clientPhone);

  if (!selectedGateway || !name || !email) return;
  if (storeRequireDocument && !clientDocument) return;
  if (storeRequirePhone && !clientPhone) return;

  const allFields = {};
  cart.forEach(item => {
    if (item.fields) {
      for (const [id, data] of Object.entries(item.fields)) {
        allFields[data.name] = data.value;
      }
    }
  });

  const checkoutPayload = {
    cart: cart.map(item => {
      const entry = { package_id: item.id, quantity: item.qty };
      if (item.fields && Object.keys(item.fields).length > 0) {
        entry.fields = {};
        for (const [id, data] of Object.entries(item.fields)) {
          entry.fields[data.name] = data.value;
        }
      }
      return entry;
    }),
    fields: Object.keys(allFields).length > 0 ? allFields : undefined,
    gateway: selectedGateway,
    client_name: name,
    client_email: email,
    coupon: appliedCoupon || undefined,
    client_document: clientDocument || undefined,
    client_phone: clientPhone || undefined,
    terms: true,
    user_id: DEV_MODE ? '1' : (storePlayerId || undefined),
    client_identifier: DEV_MODE ? '1' : (storePlayerId || undefined),
    client_discord: storeDiscord || undefined,
  };


  if (DEV_MODE) {
    devSubmitCheckout(checkoutPayload);
  } else {
    fivemSubmitCheckout(checkoutPayload);
  }
}

async function fivemSubmitCheckout(checkoutData) {
  const btn = document.getElementById('checkout-submit-btn');
  const contrastColor = getPrimaryContrastColor();
  if (btn) {
    btn.innerHTML = `<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;border-color:${contrastColor === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};border-top-color:${contrastColor}"></div>`;
    btn.style.pointerEvents = 'none';
  }

  if (storePlayerId) {
    checkoutData.user_id = storePlayerId;
    checkoutData.client_identifier = storePlayerId;
  }
  if (storeDiscord) {
    checkoutData.client_discord = storeDiscord;
  }

  if (storeRequiresDiscord && !storeDiscord) {
    if (btn) {
      btn.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4"></i> ID do Discord não encontrado. Entre em contato com a equipe!`;
      btn.style.pointerEvents = 'auto';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => updateCheckoutButton(), 5000);
    }
    return;
  }

  try {
    const data = await CentralCart.createWebstoreCheckout(API_BASE, storeStoreDomain, checkoutData);

    cart.length = 0;
    if (data.pix_code && data.qr_code) {
      renderPixPayment(data);
    } else if (data.status === 'APPROVED') {
      showPixSuccess();
    } else if (data.checkout_url || data.return_url) {
      const url = data.checkout_url || data.return_url;
      try {
        window.invokeNative('openUrl', url);
      } catch (e) {
        window.open(url, '_blank');
      }
      closeStore();
    }
  } catch (err) {
    if (btn) {
      btn.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4"></i> ${err.message}`;
      btn.style.pointerEvents = 'auto';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => updateCheckoutButton(), 3000);
    }
  }
}

function openCheckoutPage(url) {
  const T = getTemplate();
  App.render('store', T.renderCheckoutPage(url));
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function renderPixPayment(data) {
  const T = getTemplate();
  App.render('store', T.renderPixPayment(data));
  if (typeof lucide !== 'undefined') lucide.createIcons();

  const checkFn = async (orderId) => {
    if (DEV_MODE) {
      const config = await loadConfigFromLua();
      const res = await CentralCart.getOrderStatus(API_BASE, config.storeDomain, orderId);
      return res?.status || res?.order?.status || res?.data?.status || null;
    } else {
      fetch(`https://${GetParentResourceName()}/checkOrderStatus`, {
        method: 'POST',
        body: JSON.stringify({ orderId })
      }).catch(() => {});
      return null;
    }
  };

  CentralCart.startOrderPolling(data.order_id, checkFn, () => showPixSuccess());
}

function showPixSuccess() {
  CentralCart.stopOrderPolling();
  closeStore();
}

function copyPixCode() {
  const code = document.getElementById('pix-code-text')?.textContent || '';
  if (!code) return;

  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);

  const btn = document.getElementById('copy-btn-text');
  if (btn) {
    btn.textContent = 'Copiado!';
    setTimeout(() => { if (btn) btn.textContent = 'Copiar'; }, 3000);
  }
}

function closeCheckoutPage() {
  renderStore();
}

async function devSubmitCheckout(checkoutData) {
  const config = await loadConfigFromLua();
  if (!config.storeDomain) return;

  const btn = document.getElementById('checkout-submit-btn');
  const cc = getPrimaryContrastColor();
  if (btn) {
    btn.innerHTML = `<div class="loading-spinner" style="width:20px;height:20px;border-width:2px;border-color:${cc === '#ffffff' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};border-top-color:${cc}"></div>`;
    btn.style.pointerEvents = 'none';
  }

  try {
    const data = await CentralCart.createWebstoreCheckout(API_BASE, config.storeDomain, checkoutData);
    cart.length = 0;
    if (data.pix_code && data.qr_code) {
      renderPixPayment(data);
    } else if (data.checkout_url) {
      window.open(data.checkout_url, '_blank');
      closeStore();
    }
  } catch (err) {
    if (btn) {
      btn.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4"></i> ${err.message}`;
      btn.style.pointerEvents = 'auto';
      if (typeof lucide !== 'undefined') lucide.createIcons();
      setTimeout(() => updateCheckoutButton(), 3000);
    }
  }
}

if (DEV_MODE) {
  loadConfigFromLua().then(async (config) => {
    applyColors(config.colors);
    if (config.template) activeTemplate = config.template;
    App.show();
    showLoading();

    const minDelay = new Promise(r => setTimeout(r, 1000));

    if (!config.storeDomain) {
      await minDelay;
      return;
    }

    const [result] = await Promise.all([
      CentralCart.fetchStoreData(API_BASE, config.storeDomain).then(res => {
        if (res.ok) {
          storeCategories = res.categories;
          if (res.gateways && res.gateways.length > 0) {
            const gatewayMeta = {
              PIX: { desc: 'Aprovação imediata', badge: 'Mais rápido', badgeIcon: 'zap', badgeColor: 'primary' },
              MERCADOPAGO: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
              PAYPAL: { desc: 'Aprovação imediata', badge: 'Crédito e débito', badgeIcon: 'credit-card', badgeColor: 'purple' },
              STRIPE: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
              PICPAY: { desc: 'Aprovação imediata', badge: '', badgeIcon: '', badgeColor: '' },
            };
            storeGateways = res.gateways.map(gw => {
              const meta = gatewayMeta[gw.gateway] || { desc: '', badge: '' };
              return {
                id: gw.gateway,
                label: gw.display,
                desc: meta.desc,
                badge: meta.badge,
                badgeIcon: meta.badgeIcon,
                badgeColor: meta.badgeColor,
                icon: `https://cdn.centralcart.io/public/gateway-icons/icon-${gw.name.toLowerCase()}.svg`,
                fee: gw.fee,
                is_percentage_fee: gw.is_percentage_fee,
              };
            });
            selectedGateway = storeGateways[0].id;
          }
          if (res.storeInfo) {
            if (res.storeInfo.store?.maintenance) {
              const T = getTemplate();
              App.render('store', T.renderMaintenance());
              if (typeof lucide !== 'undefined') lucide.createIcons();
              return { ok: false };
            }
            const apiColor = res.storeInfo.theme?.primary_color || null;
            if (apiColor) {
              const configPrimary = config.colors?.primary || '';
              if (!configPrimary || configPrimary === '') {
                document.documentElement.style.setProperty('--color-primary', hexToRgb(apiColor));
              }
            }
            if (res.storeInfo.theme?.logo) storeLogo = res.storeInfo.theme.logo;
            if (res.storeInfo.store?.require_document) storeRequireDocument = true;
            if (res.storeInfo.store?.require_phone) storeRequirePhone = true;
          }
        }
        return res;
      }),
      minDelay,
    ]);

    if (!result?.ok) return;

    renderStore();
  });
}
