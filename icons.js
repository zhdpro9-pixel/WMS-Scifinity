'use strict';

/** Render inline SVG icon from sprite (#ico-{name}) */
function icon(name, extraClass) {
  const cls = extraClass ? `ico ${extraClass}` : 'ico';
  return `<svg class="${cls}" aria-hidden="true"><use href="#ico-${name}"/></svg>`;
}

function prodLabelHtml(type, short) {
  const isP = type === 'perempuan' || type === 'p';
  const dot = isP ? 'prod-dot-f' : 'prod-dot-l';
  const text = short
    ? (isP ? 'Perempuan' : 'Laki-laki')
    : (isP ? 'Parfum Perempuan' : 'Parfum Laki-laki');
  return `<span class="prod-label"><span class="prod-dot ${dot}" aria-hidden="true"></span>${text}</span>`;
}

function channelBadgeHtml(channel) {
  const isShopee = channel === 'Shopee';
  const cls   = isShopee ? 'ch-shopee ch-badge' : 'ch-ebay ch-badge';
  const ico   = isShopee ? 'shop' : 'globe';
  const label = isShopee ? 'Shopee' : 'eBay';
  return `<span class="${cls}">${icon(ico, 'ico ico-xs')}${label}</span>`;
}

function logTypeIcon(type) {
  const map = { inbound: 'inbound', production: 'production', outbound: 'outbound' };
  return icon(map[type] || 'list', 'ico ico-sm');
}

function matIconName(key) {
  return {
    biang: 'flask', botolP: 'bottle-f', botolL: 'bottle-m',
    box: 'box', kardus: 'carton', bubble: 'wrap'
  }[key] || 'box';
}

function matLabelHtml(key, text) {
  return `<span class="label-with-icon">${icon(matIconName(key), 'ico ico-xs')}${text}</span>`;
}

function titleWithIcon(icoName, text) {
  return `<span class="title-with-icon">${icon(icoName, 'ico ico-title')}${text}</span>`;
}
