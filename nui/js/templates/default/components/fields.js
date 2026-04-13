window.StoreComponents = window.StoreComponents || {};
window.StoreComponents.default = window.StoreComponents.default || {};
window.StoreComponents.default.fields = {

  renderFieldsDialog(id, name, price, image, fields) {
    const inputClass = 'w-full px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.07] text-white text-sm outline-none placeholder-white/30 focus:border-primary/50 transition-colors';

    let fieldsHtml = '';
    fields.forEach(field => {
      const label = field.description || field.name;
      const required = field.required ? '*' : '';
      let inputHtml = '';

      if (field.type === 'SELECT' && field.options && field.options.length > 0) {
        const optionsHtml = field.options.map((opt, idx) =>
          `<div class="custom-select-option px-4 py-2.5 text-sm cursor-pointer transition-colors flex items-center justify-between ${idx === 0 ? 'text-white font-semibold' : 'text-white/50'} hover:bg-white/[0.06] hover:text-white" data-value="${opt.id}">
            <span>${opt.name}</span>
            <i data-lucide="check" class="w-4 h-4 text-primary select-check ${idx === 0 ? '' : 'hidden'}"></i>
          </div>`
        ).join('');
        inputHtml = `
          <input type="hidden" data-field-id="${field.id}" data-field-name="${field.name}" data-field-type="SELECT" value="${field.options[0].id}" />
          <div class="custom-select relative">
            <button type="button" onclick="toggleCustomSelect(this)" class="${inputClass} cursor-pointer flex items-center justify-between gap-2 text-left">
              <span class="custom-select-label truncate">${field.options[0].name}</span>
              <i data-lucide="chevron-down" class="w-4 h-4 text-white/40 flex-shrink-0 custom-select-arrow transition-transform"></i>
            </button>
            <div class="custom-select-dropdown hidden absolute top-full left-0 right-0 mt-1 z-50 bg-muted border border-white/[0.07] rounded-xl overflow-hidden shadow-2xl max-h-[200px] overflow-y-auto">
              ${optionsHtml}
            </div>
          </div>`;
      } else if (field.type === 'NUMBER') {
        inputHtml = `
          <input type="number" data-field-id="${field.id}" data-field-name="${field.name}" data-field-type="NUMBER" placeholder="${field.name}" autocomplete="off"
            class="${inputClass}" />`;
      } else {
        inputHtml = `
          <input type="text" data-field-id="${field.id}" data-field-name="${field.name}" data-field-type="TEXT" placeholder="${field.name}" autocomplete="off"
            ${field.regex ? `pattern="${field.regex}"` : ''}
            class="${inputClass}" />`;
      }

      fieldsHtml += `
        <div class="flex flex-col gap-1.5">
          <label class="text-white/60 text-xs font-medium">${label}${required ? ' <span class="text-red-400">*</span>' : ''}</label>
          ${inputHtml}
        </div>`;
    });

    return `
      <div class="fields-dialog-overlay fixed inset-0 z-[9999] flex items-center justify-center bg-black/60" onclick="if(event.target===this) closeFieldsDialog()">
        <div class="fields-dialog-content bg-background border border-white/[0.07] rounded-2xl p-6 w-[400px] flex flex-col gap-5 shadow-2xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-white/[0.08]">
              <img src="${image || 'images/no-image.png'}" class="w-full h-full object-cover" draggable="false" />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-white font-bold text-sm truncate">${name}</h3>
              <p class="text-white/40 text-xs">R$ ${formatPrice(price)}</p>
            </div>
            <button onclick="closeFieldsDialog()" class="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md bg-white/5 hover:bg-white/10 transition-all cursor-pointer">
              <i data-lucide="x" class="w-4 h-4 text-white/50"></i>
            </button>
          </div>

          <div class="flex flex-col gap-3">
            ${fieldsHtml}
          </div>

          <button onclick="submitFieldsDialog(${id}, '${name.replace(/'/g, "\\'")}', ${price}, '${(image || '').replace(/'/g, "\\'")}')" class="w-full py-2.5 bg-primary hover:bg-primary/80 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer" style="color: ${getPrimaryContrastColor()}">
            <i data-lucide="shopping-cart" class="w-4 h-4"></i>
            Adicionar ao carrinho
          </button>
        </div>
      </div>`;
  },
};
