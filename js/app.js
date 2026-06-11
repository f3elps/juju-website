/* ============================================================
   Para a Juju — interações & animações
   ============================================================ */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------------- Reveal on scroll ---------------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        if (e.target.dataset.count !== undefined) animateCount(e.target);
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
  $$('.reveal, .reveal-scale').forEach((el) => io.observe(el));

  /* ---------------- Count-up numbers ---------------- */
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dur = 1600;
    const start = performance.now();
    const fmt = el.dataset.format === 'comma';
    function tick(now) {
      const t = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const val = Math.round(target * eased);
      el.textContent = fmt ? val.toLocaleString('pt-BR') : val;
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  $$('[data-count]').forEach((el) => io.observe(el));

  /* ---------------- Live "tempo juntos" counter ---------------- */
  // Pedido em namoro: 20 de setembro de 2024
  const since = new Date('2024-09-20T00:00:00');
  const elD = $('#cDays'), elH = $('#cHours'), elM = $('#cMin'), elS = $('#cSec');
  function tickTogether() {
    if (!elD) return;
    const now = new Date();
    let diff = Math.floor((now - since) / 1000);
    const days = Math.floor(diff / 86400); diff -= days * 86400;
    const hrs = Math.floor(diff / 3600); diff -= hrs * 3600;
    const min = Math.floor(diff / 60); const sec = diff - min * 60;
    elD.textContent = days.toLocaleString('pt-BR');
    elH.textContent = String(hrs).padStart(2, '0');
    elM.textContent = String(min).padStart(2, '0');
    elS.textContent = String(sec).padStart(2, '0');
  }
  tickTogether();
  setInterval(tickTogether, 1000);

  /* ---------------- Cartinhas (envelopes + modal) ---------------- */
  const letters = {
    1: {
      title: 'Minha vida,',
      body: `Estou escrevendo essa cartinha para te lembrar de algumas coisas:

Quando te conheci, você sempre dizia como era uma ótima amiga — e isso só foi se comprovando ao longo do tempo. Você é uma ótima amiga para a Amanda, sua irmã, e para mim. Me impressiona como você se preocupa tanto com quem ama.

Posso dizer com propriedade que eu não poderia pedir uma parceira mais atenciosa, empática e amorosa que você, meu amor.

Vários desentendimentos acontecem — com todos. Essas pequenas discussões sempre demonstram o quanto nos importamos um com o outro.

Eu te amo muito e tenho muita fé em você, meu bem.`,
      sign: 'Com amor, Felipe',
    },
    2: {
      title: 'Pra você, meu amor',
      body: `Não sou o melhor em escrever cartinhas, mas isso foi muito especial e eu não poderia deixar passar.

Além de toda a conexão e química que temos, nós demos um passo a mais. Conhecer seus pais e sua casa demonstra muita confiança. Esse ato, além de todos os outros, me fez sentir seguro, confiante e amado. Me fez sentir que quero seguir a vida ao seu lado.

Com você, me sinto pertencente a algo maior. Sem você, sinto que estou perdendo tempo — e não quero mais isso. Quero fazer parte dos seus momentos em família, dos seus ciclos de amizades, e quero te apoiar em tudo que você passar.

Não prometo demais, mas com você é impossível não sonhar.`,
      sign: 'Sempre seu, Felipe',
    },
  };

  const modal = $('#letterModal');
  const mTitle = $('#lmTitle'), mBody = $('#lmBody'), mSign = $('#lmSign');
  $$('.envelope').forEach((env) => {
    env.addEventListener('click', () => {
      const id = env.dataset.letter;
      env.classList.add('open');
      setTimeout(() => {
        const L = letters[id];
        if (!L) return;
        mTitle.textContent = L.title;
        mBody.textContent = L.body;
        mSign.textContent = L.sign;
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
      }, 420);
    });
  });
  function closeModal() {
    modal.classList.remove('show');
    document.body.style.overflow = '';
    $$('.envelope.open').forEach((e) => setTimeout(() => e.classList.remove('open'), 300));
  }
  $('#lmClose').addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  /* ---------------- Music player (local MP3 first, else YouTube) ---------------- */
  const audio = $('#bgMusic');
  const mBtn = $('#musicBtn');
  const mLabel = $('#musicLabel');
  const YT_ID = 'dTvgQ7-jPYk'; // I Want to Write You a Song — One Direction (official audio)
  let musicOn = false;
  let mode = null;          // 'audio' | 'yt'
  let ytPlayer = null, ytReady = false, ytWantPlay = false;

  function setBtn(on, label) {
    musicOn = on;
    mBtn.classList.toggle('playing', on);
    if (label) mLabel.textContent = label;
  }

  // Load the YouTube IFrame API once and build a hidden audio-only player.
  window.onYouTubeIframeAPIReady = function () {
    ytPlayer = new YT.Player('ytplayer', {
      height: '0', width: '0', videoId: YT_ID,
      playerVars: { playsinline: 1, controls: 0, disablekb: 1 },
      events: {
        onReady: () => {
          ytReady = true;
          if (ytWantPlay) { ytPlayer.playVideo(); }
          else if (!musicOn) { mLabel.textContent = 'Tocar nossa música'; }
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) setBtn(true, 'I Want to Write You a Song ♪');
          else if (e.data === YT.PlayerState.PAUSED || e.data === YT.PlayerState.ENDED) setBtn(false, 'Tocar nossa música');
        },
      },
    });
  };
  function loadYT() {
    if (window.YT || document.getElementById('yt-api')) return;
    const t = document.createElement('script');
    t.id = 'yt-api'; t.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(t);
  }

  async function pickMode() {
    if (mode) return;
    try {
      const r = await fetch('music/our-song.mp3', { method: 'HEAD' });
      if (r.ok) { mode = 'audio'; audio.src = 'music/our-song.mp3'; return; }
    } catch (e) { /* no local file */ }
    mode = 'yt';
    loadYT();
  }

  mBtn.addEventListener('click', async () => {
    await pickMode();
    if (mode === 'audio') {
      if (musicOn) { audio.pause(); setBtn(false, 'Tocar nossa música'); }
      else { audio.play().then(() => setBtn(true, 'Oceano — Djavan ♪')).catch(() => setBtn(false, 'Toque outra vez ▶')); }
      return;
    }
    // YouTube mode
    if (!ytReady) {
      ytWantPlay = !ytWantPlay;
      mLabel.textContent = ytWantPlay ? 'Carregando música… ♪' : 'Tocar nossa música';
      return;
    }
    if (musicOn) { ytPlayer.pauseVideo(); }
    else { ytPlayer.playVideo(); }
  });

  // Preload the right source on load so the first click plays in-gesture.
  pickMode();

  /* ---------------- Background floating hearts canvas ---------------- */
  const canvas = $('#heartsCanvas');
  if (canvas && !reduce) {
    const ctx = canvas.getContext('2d');
    let W, H, hearts = [];
    const COLORS = ['#FFC9DA', '#FF8FAB', '#FFD9E4', '#F06A92', '#FFE3EC'];
    function resize() {
      W = canvas.width = window.innerWidth * devicePixelRatio;
      H = canvas.height = window.innerHeight * devicePixelRatio;
    }
    resize();
    window.addEventListener('resize', resize);
    function makeHeart() {
      return {
        x: Math.random() * W,
        y: H + Math.random() * H * 0.5,
        size: (6 + Math.random() * 14) * devicePixelRatio,
        speed: (0.15 + Math.random() * 0.5) * devicePixelRatio,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: 0.005 + Math.random() * 0.012,
        swayAmp: (8 + Math.random() * 22) * devicePixelRatio,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 0.25 + Math.random() * 0.45,
        rot: Math.random() * Math.PI,
      };
    }
    const COUNT = Math.min(34, Math.floor(window.innerWidth / 38));
    for (let i = 0; i < COUNT; i++) { const h = makeHeart(); h.y = Math.random() * H; hearts.push(h); }
    function drawHeart(x, y, s, color, alpha, rot) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 16, s / 16);
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.bezierCurveTo(0, -2, -8, -2, -8, 4);
      ctx.bezierCurveTo(-8, 9, -2, 12, 0, 16);
      ctx.bezierCurveTo(2, 12, 8, 9, 8, 4);
      ctx.bezierCurveTo(8, -2, 0, -2, 0, 4);
      ctx.fill();
      ctx.restore();
    }
    let scrollY = window.scrollY;
    window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });
    function loop() {
      ctx.clearRect(0, 0, W, H);
      hearts.forEach((h) => {
        h.y -= h.speed;
        h.sway += h.swaySpeed;
        const x = h.x + Math.sin(h.sway) * h.swayAmp;
        if (h.y < -20 * devicePixelRatio) { h.y = H + 20; h.x = Math.random() * W; }
        drawHeart(x, h.y, h.size, h.color, h.alpha, h.rot + Math.sin(h.sway) * 0.2);
      });
      requestAnimationFrame(loop);
    }
    loop();
  }

  /* ---------------- Hero parallax ---------------- */
  if (!reduce) {
    const heroName = $('.hero .name');
    const heroSub = $('.hero .sub');
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight) {
        if (heroName) heroName.style.transform = `translateY(${y * 0.18}px)`;
        if (heroSub) heroSub.style.transform = `translateY(${y * 0.30}px)`;
      }
    }, { passive: true });
  }

  /* ---------------- Floating decorative hearts in hero ---------------- */
  const heroDeco = $('#heroDeco');
  if (heroDeco) {
    const spots = [
      { l: '8%', t: '22%', s: 30, d: 0 }, { l: '86%', t: '18%', s: 40, d: 1.2 },
      { l: '16%', t: '70%', s: 24, d: 0.6 }, { l: '78%', t: '64%', s: 34, d: 1.8 },
      { l: '50%', t: '12%', s: 20, d: 0.3 }, { l: '92%', t: '46%', s: 22, d: 2.2 },
      { l: '4%', t: '48%', s: 26, d: 1.5 },
    ];
    spots.forEach((p) => {
      const span = document.createElement('span');
      span.className = 'floating-heart';
      span.textContent = '♥';
      span.style.left = p.l; span.style.top = p.t;
      span.style.fontSize = p.s + 'px';
      span.style.animationDelay = p.d + 's';
      span.style.animationDuration = (5 + Math.random() * 3) + 's';
      heroDeco.appendChild(span);
    });
  }

  /* ---------------- Valentine: No runs away, Yes confetti ---------------- */
  const btnNo = $('#btnNo');
  const btnYes = $('#btnYes');
  const askScreen = $('#askScreen');
  const yesScreen = $('#yesScreen');
  const noLines = ['Tem certeza? 🥺', 'Pensa de novo...', 'Não vale fugir!', 'Meu coração...', 'Por favorzinho?', 'Juju, por favor 💗', 'Você não consegue 😏'];
  let noCount = 0;
  if (btnNo) {
    const moveNo = () => {
      noCount++;
      const row = btnNo.closest('.btn-row');
      const rb = row.getBoundingClientRect();
      const maxX = Math.min(window.innerWidth * 0.7, 260);
      const x = (Math.random() - 0.5) * maxX;
      const y = (Math.random() - 0.5) * 120;
      btnNo.style.transform = `translate(${x}px, ${y}px)`;
      btnNo.textContent = noLines[Math.min(noCount, noLines.length - 1)];
      // grow the yes button a bit each time
      btnYes.style.transform = `scale(${Math.min(1 + noCount * 0.08, 1.6)})`;
    };
    btnNo.addEventListener('mouseenter', moveNo);
    btnNo.addEventListener('click', (e) => { e.preventDefault(); moveNo(); });
  }
  if (btnYes) {
    btnYes.addEventListener('click', () => {
      askScreen.style.display = 'none';
      yesScreen.classList.add('show');
      fireConfetti();
      setTimeout(fireConfetti, 600);
      setTimeout(fireConfetti, 1200);
    });
  }

  /* ---------------- Confetti hearts ---------------- */
  const cCanvas = $('#confettiCanvas');
  let cctx, cW, cH, parts = [], rafC;
  if (cCanvas) {
    cctx = cCanvas.getContext('2d');
    const cResize = () => { cW = cCanvas.width = window.innerWidth; cH = cCanvas.height = window.innerHeight; };
    cResize(); window.addEventListener('resize', cResize);
  }
  function fireConfetti() {
    if (!cctx) return;
    const colors = ['#FF8FAB', '#F06A92', '#FFC9DA', '#D94F77', '#FFD9E4'];
    for (let i = 0; i < 80; i++) {
      parts.push({
        x: cW / 2 + (Math.random() - 0.5) * 120,
        y: cH * 0.55,
        vx: (Math.random() - 0.5) * 14,
        vy: -8 - Math.random() * 12,
        g: 0.28 + Math.random() * 0.15,
        size: 8 + Math.random() * 12,
        color: colors[(Math.random() * colors.length) | 0],
        rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
        life: 1,
      });
    }
    if (!rafC) loopConfetti();
  }
  function heartPath(ctx, x, y, s, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s / 16, s / 16);
    ctx.beginPath();
    ctx.moveTo(0, 4);
    ctx.bezierCurveTo(0, -2, -8, -2, -8, 4);
    ctx.bezierCurveTo(-8, 9, -2, 12, 0, 16);
    ctx.bezierCurveTo(2, 12, 8, 9, 8, 4);
    ctx.bezierCurveTo(8, -2, 0, -2, 0, 4);
    ctx.fill(); ctx.restore();
  }
  function loopConfetti() {
    cctx.clearRect(0, 0, cW, cH);
    parts.forEach((p) => {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= 0.99;
      if (p.y > cH * 0.7) p.life -= 0.015;
      cctx.globalAlpha = Math.max(p.life, 0);
      cctx.fillStyle = p.color;
      heartPath(cctx, p.x, p.y, p.size, p.rot);
    });
    parts = parts.filter((p) => p.life > 0 && p.y < cH + 40);
    if (parts.length) { rafC = requestAnimationFrame(loopConfetti); }
    else { cctx.clearRect(0, 0, cW, cH); rafC = null; }
  }

  /* ---------------- Sparkle cursor trail (desktop only) ---------------- */
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    let last = 0;
    window.addEventListener('mousemove', (e) => {
      const now = Date.now();
      if (now - last < 60) return;
      last = now;
      const s = document.createElement('span');
      s.textContent = Math.random() > 0.5 ? '♥' : '✦';
      s.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;z-index:70;pointer-events:none;
        color:${Math.random() > 0.5 ? '#FF8FAB' : '#FFC9DA'};font-size:${10 + Math.random() * 10}px;
        transform:translate(-50%,-50%);transition:all .8s ease-out;opacity:.9;`;
      document.body.appendChild(s);
      requestAnimationFrame(() => {
        s.style.top = (e.clientY - 26 - Math.random() * 20) + 'px';
        s.style.opacity = '0';
        s.style.transform = 'translate(-50%,-50%) scale(0.4)';
      });
      setTimeout(() => s.remove(), 850);
    }, { passive: true });
  }
})();
