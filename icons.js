'use strict';

/** Render inline SVG icon from sprite (#ico-{name}) */
function icon(name, extraClass) {
  const cls = extraClass ? `ico ${extraClass}` : 'ico';
  return `<svg class="${cls}" aria-hidden="true"><use href="#ico-${name}"/></svg>`;
}

function prodLabelHtml(type, short) {
  const meta = typeof FINISHED_GOODS !== 'undefined' ? FINISHED_GOODS[type] : null;
  const isP = type.includes('parfumP') || type === 'perempuan' || type === 'p' || type.includes('Wanita');
  const dot = isP ? 'prod-dot-f' : 'prod-dot-l';
  let text = meta ? meta.label : type;
  if (short && meta) text = text.replace('Parfum ', ''); // simplified short label
  return `<span class="prod-label"><span class="prod-dot ${dot}" aria-hidden="true"></span>${text}</span>`;
}

function channelBadgeHtml(channel) {
  const isShopee = channel === 'Shopee';
  const cls = isShopee ? 'ch-shopee ch-badge' : 'ch-ebay ch-badge';
  const ico = isShopee ? 'shop' : 'globe';
  const label = isShopee ? 'Shopee' : 'eBay';
  return `<span class="${cls}">${icon(ico, 'ico ico-xs')}${label}</span>`;
}

function logTypeIcon(type) {
  const map = { inbound: 'inbound', production: 'production', outbound: 'outbound' };
  return icon(map[type] || 'list', 'ico ico-sm');
}

function matIconName(key) {
  return {
    biangP: 'flask', biangL: 'flask',
    botolP: 'bottle-f', botolL: 'bottle-m',
    boxParfumP: 'box', boxParfumL: 'box',
    cairanDeoP: 'flask', cairanDeoL: 'flask', botolDeoP: 'bottle-f', botolDeoL: 'bottle-m', boxDeoP: 'box', boxDeoL: 'box',
    cairanHMP: 'flask', cairanHML: 'flask', botolHMP: 'bottle-f', botolHML: 'bottle-m',
    boxExclusive: 'box', boxBundlingP: 'box', boxBundlingW: 'box',
    boxLuar: 'carton', bubbleWrap: 'wrap'
  }[key] || 'box';
}

function matLabelHtml(key, text) {
  return `<span class="label-with-icon">${icon(matIconName(key), 'ico ico-xs')}${text}</span>`;
}

function titleWithIcon(icoName, text) {
  return `<span class="title-with-icon">${icon(icoName, 'ico ico-title')}${text}</span>`;
}
