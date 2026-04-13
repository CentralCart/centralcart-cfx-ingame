window.CentralCart = {
  async fetchStoreData(baseURL, storeDomain) {
    if (!storeDomain) {
      return { ok: false, categories: [], packages: [], storeInfo: null };
    }

    const webstoreHeaders = {
      'x-store-domain': storeDomain,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    try {
      const [catRes, gatewaysRes, storeRes] = await Promise.all([
        fetch(`${baseURL}/webstore/category?include_sub_categories=true`, { headers: webstoreHeaders }),
        fetch(`${baseURL}/webstore/gateway`, { headers: webstoreHeaders }).catch(() => null),
        fetch(`${baseURL}/webstore`, { headers: webstoreHeaders }).catch(() => null),
      ]);

      let storeInfo = null;
      if (storeRes && storeRes.ok) {
        storeInfo = await storeRes.json();
      }

      let gateways = [];
      if (gatewaysRes && gatewaysRes.ok) {
        gateways = await gatewaysRes.json();
      }

      if (!catRes.ok) {
        return { ok: false, categories: [], packages: [], gateways: [], storeInfo };
      }

      const catData = await catRes.json();
      const categories = Array.isArray(catData) ? catData : (catData.data || []);

      return { ok: true, categories, gateways, storeInfo };
    } catch (err) {
      console.error('[CentralCart] fetchStoreData error:', err);
      return { ok: false, categories: [], packages: [], storeInfo: null };
    }
  },

  _normalizePackage(pkg) {
    if (pkg.pricing) {
      pkg.price = pkg.pricing.price ?? pkg.price;
      pkg.compare_at_price = pkg.pricing.compare_at ?? pkg.compare_at_price;
    }
    if (pkg.stock) {
      pkg.inventory_amount = pkg.stock.quantity ?? pkg.inventory_amount;
      if (pkg.stock.available === false && pkg.inventory_amount === null) {
        pkg.inventory_amount = 0;
      }
    }
    return pkg;
  },

  async fetchPackagesByCategory(baseURL, storeDomain, categoryId) {
    const headers = {
      'x-store-domain': storeDomain,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    const res = await fetch(`${baseURL}/webstore/package?category_id=${categoryId}&limit=999`, { headers });
    if (!res.ok) return [];

    const data = await res.json();
    const rawPkgs = Array.isArray(data) ? data : (data.data || []);
    return rawPkgs.map(pkg => this._normalizePackage(pkg));
  },

  async fetchGateways(baseURL, storeDomain) {
    const res = await fetch(`${baseURL}/webstore/gateway`, {
      method: 'GET',
      headers: {
        'x-store-domain': storeDomain,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return [];
    return await res.json();
  },

  async validateCoupon(baseURL, storeDomain, code) {
    const res = await fetch(`${baseURL}/webstore/discount/${encodeURIComponent(code)}`, {
      method: 'GET',
      headers: { 'x-store-domain': storeDomain },
    });

    if (!res.ok) {
      throw new Error('Cupom inválido ou expirado.');
    }

    return await res.json();
  },

  async getOrderStatus(baseURL, storeDomain, orderId) {
    const res = await fetch(`${baseURL}/webstore/order_status/${encodeURIComponent(orderId)}`, {
      method: 'GET',
      headers: {
        'x-store-domain': storeDomain,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!res.ok) return null;
    return await res.json();
  },

  _pollingInterval: null,

  startOrderPolling(orderId, checkFn, onConfirmed) {
    this.stopOrderPolling();
    if (!orderId) return;

    const poll = async () => {
      try {
        const status = await checkFn(orderId);
        if (status && status !== 'PENDING') {
          this.stopOrderPolling();
          onConfirmed(status);
        }
      } catch (e) {}
    };

    poll();
    this._pollingInterval = setInterval(poll, 5000);
  },

  stopOrderPolling() {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  },

  async createCheckout(baseURL, token, checkoutData) {
    const res = await fetch(`${baseURL}/app/checkout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors?.[0]?.message || data.message || 'Erro ao processar checkout';
      throw new Error(msg);
    }

    return data;
  },

  async createWebstoreCheckout(baseURL, storeDomain, checkoutData) {
    const res = await fetch(`${baseURL}/webstore/checkout`, {
      method: 'POST',
      headers: {
        'x-store-domain': storeDomain,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data.errors?.[0]?.message || data.message || 'Erro ao processar checkout';
      throw new Error(msg);
    }

    return data;
  },
};
