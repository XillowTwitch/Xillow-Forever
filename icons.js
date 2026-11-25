// Icônes des malus (SVG 24×24, trait)
window.XICONS = {
  flashbang: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/>',
  smoke: '<path d="M4.5 15.5a4 4 0 0 1 3.6-4 5 5 0 0 1 9.5-1.6 3.4 3.4 0 1 1 .4 6.8H6.5"/><path d="M3 19.5h11M8 22h9"/>',
  webcam_zoom: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5.5 5.5M10.5 7.5v6M7.5 10.5h6"/>',
  tunnel: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="2.5"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4z"/><path d="m16 9 5 6M21 9l-5 6"/>',
  invert: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  pvp: '<path d="M14.5 17.5 3 6V3h3l11.5 11.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><path d="M9.5 6.5 13 3h3v3l-3.5 3.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
  mob_farm: '<path d="M12 3a8 8 0 0 0-5 14.2V20h10v-2.8A8 8 0 0 0 12 3z"/><circle cx="9" cy="11" r="1.6"/><circle cx="15" cy="11" r="1.6"/><path d="M10 20v-2.5M14 20v-2.5"/>',
  rez_sickness: '<path d="M6 21V10a6 6 0 0 1 12 0v11l-2-1.5-2 1.5-2-1.5-2 1.5-2-1.5z"/><circle cx="10" cy="10" r="1"/><circle cx="14" cy="10" r="1"/>',
  qwerty: '<rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  upside_down: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15.5 6.2L3 16"/><path d="M3 21v-5h5"/>',
  pixelate: '<rect x="3" y="3" width="6" height="6"/><rect x="15" y="3" width="6" height="6"/><rect x="9" y="9" width="6" height="6"/><rect x="3" y="15" width="6" height="6"/><rect x="15" y="15" width="6" height="6"/>',
  unequip: '<path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m4 4 16 16"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M8.5 8.5 15.5 15.5M15.5 8.5l-7 7"/>',
};

window.xicon = (id, size = 24) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${
    window.XICONS[id] || window.XICONS.coin
  }</svg>`;
