(() => {
  const CFG = window.XILLOW_CONFIG;
  const sb = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
  const $ = (id) => document.getElementById(id);

  const PANELS = {
    followers: { title: 'Panel des Followers', hint: 'Pour tous les followers de la chaîne', rank: 'rare' },
    subs: { title: 'Panel des Abonnés', hint: 'Réservé aux abonnés', rank: 'epic' },
    gifters: { title: 'Panel des Gifters', hint: '1 sub offert = 240 X-Coins', rank: 'legend' },
  };
  const STATUS = { pending: 'vérification…', queued: 'en file', running: 'en cours', done: 'joué', refunded: 'remboursé' };

  const state = { session: null, wallet: null, catalog: [], settings: null, feed: [], mine: [], armed: null };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    return s >= 60 ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}` : `${s}s`;
  };
  const dur = (sec) => (sec ? (sec >= 60 ? `${Math.round((sec / 60) * 10) / 10} min` : `${sec} s`) : 'défi');
  const catById = (id) => state.catalog.find((c) => c.id === id);

  function toast(msg, err = false) {
    const t = $('toast');
    t.textContent = msg;
    t.className = `toast show${err ? ' err' : ''}`;
    clearTimeout(toast.t);
    toast.t = setTimeout(() => (t.className = 'toast'), 3800);
  }

  function shopOpen() {
    const s = state.settings;
    if (!s || !s.shop_open || !s.heartbeat) return false;
    return Date.now() - Date.parse(s.heartbeat) < 95_000;
  }

  // ------------------------------------------------------------ rendu
  function renderHeader() {
    const open = shopOpen();
    const shop = $('shop');
    shop.className = `shop ${open ? 'open' : 'closed'}`;
    shop.querySelector('span').textContent = open ? 'Boutique ouverte' : state.settings?.paused ? 'Malus en pause' : 'Boutique fermée';

    const me = $('me');
    if (!state.session) {
      me.innerHTML = '<button class="btn twitch" id="login">Se connecter avec Twitch</button>';
      return;
    }
    const m = state.session.user.user_metadata || {};
    const name = m.nickname || m.name || m.preferred_username || m.full_name || 'Viewer';
    me.innerHTML = `${m.avatar_url ? `<img src="${esc(m.avatar_url)}" alt="">` : ''}<span class="name">${esc(name)}</span><button class="btn ghost" id="logout">Déconnexion</button>`;
  }

  function renderWallet() {
    const w = state.wallet;
    $('balance').textContent = state.session ? (w ? w.balance.toLocaleString('fr-FR') : '0') : '—';
    const ranks = [];
    if (state.session && w) {
      ranks.push(`<span class="rank rare ${w.is_follower !== false ? 'yes' : ''}">Follower${w.is_follower === null ? ' ?' : ''}</span>`);
      ranks.push(`<span class="rank epic ${w.is_sub ? 'yes' : ''}">Abonné${w.is_sub === null ? ' ?' : ''}</span>`);
      ranks.push(`<span class="rank legend ${w.is_gifter ? 'yes' : ''}">Gifter</span>`);
    } else if (!state.session) {
      ranks.push('<span class="rank">Connecte-toi pour voir ton solde</span>');
    }
    $('ranks').innerHTML = ranks.join('');
  }

  function lockFor(panel) {
    const w = state.wallet;
    if (!state.session) return null;
    if (panel === 'followers' && w?.is_follower === false) return 'Follow requis';
    if (panel === 'subs' && w?.is_sub === false) return 'Sub requis';
    if (panel === 'gifters' && !w?.is_gifter) return 'Offre 1 sub pour débloquer';
    return null;
  }

  function renderPanels() {
    const open = shopOpen();
    const balance = state.wallet?.balance ?? 0;
    $('panels').innerHTML = Object.entries(PANELS)
      .map(([key, p]) => {
        const items = state.catalog.filter((c) => c.panel === key && c.enabled);
        const lock = lockFor(key);
        const lockHtml = state.session ? `<span class="lock ${lock ? '' : 'ok'}">${lock ? '🔒 ' + lock : '✔ débloqué'}</span>` : '';
        return `<article class="panel ${key}">
          <div class="panel-head"><h3>${p.title}</h3><p>${p.hint}</p>${lockHtml}</div>
          ${items
            .map((c) => {
              let label = 'Acheter';
              let disabled = false;
              if (!state.session) label = 'Connexion';
              else if (!open) (label = 'Fermé'), (disabled = true);
              else if (lock) (label = 'Verrouillé'), (disabled = true);
              else if (balance < c.cost) (label = 'Trop cher'), (disabled = true);
              const armed = state.armed === c.id;
              return `<div class="item">
                <div class="ico">${window.xicon(c.id, 26)}</div>
                <div class="info"><b>${esc(c.name)}</b><small>${esc(c.description)}</small>
                  <div class="meta"><span class="dur">${dur(c.duration_sec)}</span></div></div>
                <div class="price"><div class="cost">${c.cost} <small>X-Coins</small></div>
                  <button class="btn ${armed ? 'confirm' : ''}" data-buy="${c.id}" ${disabled ? 'disabled' : ''}>${armed ? 'Confirmer ?' : label}</button></div>
              </div>`;
            })
            .join('')}
        </article>`;
      })
      .join('');
  }

  function renderLive() {
    const live = state.feed.filter((p) => ['pending', 'queued', 'running'].includes(p.status));
    if (!live.length) {
      $('liveList').innerHTML = '<p class="live-empty">Aucun malus en cours… pour l\'instant.</p>';
      return;
    }
    $('liveList').innerHTML = live
      .map((p) => {
        const c = catById(p.effect_id);
        const panel = c?.panel || 'followers';
        const q = { followers: 'var(--rare)', subs: 'var(--epic)', gifters: 'var(--legend)' }[panel];
        let t = STATUS[p.status];
        if (p.status === 'running') t = p.ends_at ? fmt(Date.parse(p.ends_at) - Date.now()) : 'à faire';
        return `<div class="live-item ${p.status === 'running' ? '' : 'queued'}" style="--q:${q}">
          <div class="ico">${window.xicon(p.effect_id, 22)}</div>
          <div><b>${esc(c?.name || p.effect_id)}</b><small>par ${esc(p.display_name || 'un viewer')}</small></div>
          <span class="t" data-ends="${p.status === 'running' && p.ends_at ? p.ends_at : ''}">${t}</span>
        </div>`;
      })
      .join('');
  }

  function renderHistory() {
    const box = $('historyBox');
    if (!state.session || !state.mine.length) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    $('history').innerHTML = state.mine
      .map((p) => {
        const c = catById(p.effect_id);
        const when = new Date(p.created_at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
        const note = p.status === 'refunded' && p.note ? ` — ${esc(p.note)}` : '';
        return `<li><span>${esc(c?.name || p.effect_id)} · ${p.cost} X-Coins</span><span class="st-${p.status}">${STATUS[p.status]}${note} · ${when}</span></li>`;
      })
      .join('');
  }

  function renderAll() {
    renderHeader();
    renderWallet();
    renderPanels();
    renderLive();
    renderHistory();
  }

  // ------------------------------------------------------------ données
  async function loadCatalog() {
    const { data } = await sb.from('catalog').select('*').order('sort');
    state.catalog = data || [];
  }
  async function loadSettings() {
    const { data } = await sb.from('settings').select('*').eq('id', 1).maybeSingle();
    state.settings = data;
  }
  async function loadFeed() {
    const { data } = await sb
      .from('purchases')
      .select('id,effect_id,display_name,status,created_at,ends_at')
      .in('status', ['pending', 'queued', 'running'])
      .order('created_at')
      .limit(40);
    state.feed = data || [];
  }
  async function loadWallet() {
    if (!state.session) {
      state.wallet = null;
      state.mine = [];
      return;
    }
    const { data, error } = await sb.rpc('my_wallet');
    if (!error) state.wallet = data;
    if (state.wallet?.twitch_id) {
      const { data: mine } = await sb
        .from('purchases')
        .select('id,effect_id,cost,status,note,created_at')
        .eq('twitch_id', state.wallet.twitch_id)
        .order('created_at', { ascending: false })
        .limit(10);
      state.mine = mine || [];
    }
  }

  // ------------------------------------------------------------ actions
  async function buy(id) {
    if (!state.session) return login();
    if (state.armed !== id) {
      state.armed = id;
      renderPanels();
      clearTimeout(buy.t);
      buy.t = setTimeout(() => {
        state.armed = null;
        renderPanels();
      }, 4000);
      return;
    }
    state.armed = null;
    const c = catById(id);
    const { data, error } = await sb.rpc('buy', { p_effect: id });
    if (error) {
      toast(error.message, true);
    } else {
      toast(`${c.name} acheté ! Il te reste ${data.balance} X-Coins.`);
    }
    await loadWallet();
    renderAll();
  }

  function login() {
    sb.auth.signInWithOAuth({ provider: 'twitch', options: { redirectTo: location.origin + location.pathname } });
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.id === 'login') login();
    else if (b.id === 'logout') sb.auth.signOut();
    else if (b.dataset.buy) buy(b.dataset.buy);
  });

  // ------------------------------------------------------------ temps réel
  let feedTimer;
  function scheduleFeed() {
    clearTimeout(feedTimer);
    feedTimer = setTimeout(async () => {
      await Promise.all([loadFeed(), loadWallet()]);
      renderAll();
    }, 300);
  }

  sb.channel('panel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'purchases' }, scheduleFeed)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, (payload) => {
      state.settings = payload.new;
      renderAll();
    })
    .subscribe();

  // Comptes à rebours
  setInterval(() => {
    document.querySelectorAll('[data-ends]').forEach((el) => {
      if (el.dataset.ends) el.textContent = fmt(Date.parse(el.dataset.ends) - Date.now());
    });
  }, 1000);
  // Filets de sécurité (si le temps réel saute)
  setInterval(async () => {
    await Promise.all([loadSettings(), loadFeed(), loadWallet()]);
    renderAll();
  }, 20_000);

  sb.auth.onAuthStateChange((_event, session) => {
    const changed = (state.session?.user?.id || null) !== (session?.user?.id || null);
    state.session = session;
    // setTimeout : ne jamais appeler Supabase directement dans ce callback
    if (changed) setTimeout(async () => {
      await loadWallet();
      renderAll();
    }, 0);
  });

  (async () => {
    const { data } = await sb.auth.getSession();
    state.session = data.session;
    await Promise.all([loadCatalog(), loadSettings(), loadFeed(), loadWallet()]);
    renderAll();
  })();
})();
