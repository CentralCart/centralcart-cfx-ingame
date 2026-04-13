window.StoreTemplates = window.StoreTemplates || {};

const C = window.StoreComponents.default;

window.StoreTemplates.default = {
  ...C.errors,
  ...C.store,
  ...C.product,
  ...C.cart,
  ...C.checkout,
  ...C.fields,
  ...C.pix,
};
