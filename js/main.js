// Lenis 초기화
const lenis = new Lenis({ smoothWheel: true, smoothTouch: false });
window.lenis = lenis;

// RAF 루프 (Lenis 실행)
function raf(t) {
  lenis.raf(t);
  if (window.lenisAbout) window.lenisAbout.raf(t);
  requestAnimationFrame(raf);
}
requestAnimationFrame(raf);




// 별 배경(tsParticles) 초기화
document.addEventListener("DOMContentLoaded", async () => {
  if (window.loadStarsPreset) {
    try { await loadStarsPreset(tsParticles); } catch (e) { console.warn(e); }
  }
  const options = {
    autoPlay: true,
    background: { color: { value: "transparent" } },
    fullScreen: { enable: true, zIndex: 0 },
    detectRetina: true,
    fpsLimit: 120,
    interactivity: {
      detectsOn: "window",
      events: { onHover: { enable: false }, onClick: { enable: true, mode: "repulse" }, resize: { enable: true } },
      modes: { repulse: { distance: 400, duration: 0.4 } }
    },
    particles: {
      number: { value: 160, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },
      opacity: { value: { min: 0.1, max: 1 }, animation: { enable: true, speed: 0.6, startValue: "random" } },
      size: { value: { min: 0.4, max: 1.6 } },
      move: { enable: true, direction: "none", speed: { min: 0.02, max: 0.3 }, outModes: { default: "out" } }
    },
    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    zLayers: 100
  };
  await tsParticles.load({ id: "particles-js", options });
});




// lotti 애니메이션 이미지
lottie.loadAnimation({//스크롤다운이미지
  container: document.getElementById('lottie-scroll-down'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: './assets/lottie/scroll-down-animation.json'
});
lottie.loadAnimation({//우주인이미지
  container: document.getElementById('lottie-astronaut'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: './assets/lottie/astronaut.json'
});




// 바운스 방지
document.documentElement.style.overscrollBehavior = 'none';

// 메뉴 토글
const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
const dim = document.querySelector('.nav-dim');
function openMenu() { header.classList.add('open'); menuBtn.classList.add('close'); dim.hidden = false; }
function closeMenu() { header.classList.remove('open'); menuBtn.classList.remove('close'); dim.hidden = true; }
if (menuBtn && dim) {
  menuBtn.addEventListener('click', () => header.classList.contains('open') ? closeMenu() : openMenu());
  dim.addEventListener('click', closeMenu);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('open')) closeMenu(); });
}

// 휠 델타 정규화/임계값
function normWheelDelta(e) { return e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; }
const MIN_WHEEL_ABS = 6;     // 시간창 누적 임계
const ACC_WINDOW_MS = 140;   // 누적 시간창(ms)

// 스냅 락(안착 시 해제)
let SNAP_LOCK = false;
let IS_SNAPPING = false;
function lockSnap() { SNAP_LOCK = true; IS_SNAPPING = true; }
function unlockSnap() { IS_SNAPPING = false; SNAP_LOCK = false; }

// 윈도우 스크롤이 대상 요소 top에 안착했는지 감시
function waitSettleWindow(targetEl, { tol = 1, settleFrames = 4, timeout = 2200 } = {}, onDone) {
  const targetY = targetEl.offsetTop;
  let ok = 0, stop = false, t0 = performance.now();
  function tick() {
    if (stop) return;
    const y = window.scrollY || 0;
    ok = Math.abs(y - targetY) <= tol ? ok + 1 : 0;
    if (ok >= settleFrames || performance.now() - t0 > timeout) { stop = true; onDone?.(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// 내부(.about-scroll) 패널이 래퍼 패딩 기준으로 안착했는지 감시
function waitSettleInner({ wrapper, panelEl, padTop = 0, tol = 1, settleFrames = 4, timeout = 2200 }, onDone) {
  let ok = 0, stop = false, t0 = performance.now();
  function tick() {
    if (stop) return;
    const wrapTop = wrapper.getBoundingClientRect().top + padTop;
    const diff = panelEl.getBoundingClientRect().top - wrapTop;
    ok = Math.abs(diff) <= tol ? ok + 1 : 0;
    if (ok >= settleFrames || performance.now() - t0 > timeout) { stop = true; onDone?.(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// 바깥 컨테이너 스냅
(() => {
  const containers = [...document.querySelectorAll('.container')];
  if (!containers.length) return;

  const detectIndexByCenter = () => {
    const mid = (window.scrollY || 0) + innerHeight / 2;
    let best = 0, dist = Infinity;
    containers.forEach((el, i) => {
      const c = (el.offsetTop + el.offsetTop + el.offsetHeight) / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  let activeIndex = detectIndexByCenter();

  function snapToContainer(i) {
    if (i < 0 || i >= containers.length) return;
    lockSnap();
    activeIndex = i;
    lenis.scrollTo(containers[i], { duration: 0.9 });
    waitSettleWindow(containers[i], { tol: 1, settleFrames: 4, timeout: 2200 }, () => {
      const y = window.scrollY || 0, top = containers[i].offsetTop;
      if (Math.abs(y - top) > 1) lenis.scrollTo(containers[i], { duration: 0.15 });
      unlockSnap();
    });
  }
  window.snapToContainer = snapToContainer;

  // 휠 누적(시간창)
  let outerAccAbs = 0, outerAccSigned = 0, outerFirstSign = 0, outerLastTs = 0;

  // 휠 스냅
  window.addEventListener('wheel', (e) => {
    if (e.target.closest('.about-scroll,[data-lenis-prevent]')) return;
    if (SNAP_LOCK || IS_SNAPPING) return;
    const now = performance.now(), delta = normWheelDelta(e);
    if (delta === 0) return;
    if (now - outerLastTs > ACC_WINDOW_MS) { outerAccAbs = 0; outerAccSigned = 0; outerFirstSign = 0; }
    outerLastTs = now;
    const sign = Math.sign(delta);
    if (!outerFirstSign) outerFirstSign = sign;
    outerAccAbs += Math.abs(delta);
    outerAccSigned += delta;
    if (outerAccAbs < MIN_WHEEL_ABS) return;
    e.preventDefault();
    const dir = Math.sign(outerAccSigned) || outerFirstSign;
    outerAccAbs = 0; outerAccSigned = 0; outerFirstSign = 0; outerLastTs = 0;
    const next = dir > 0 ? activeIndex + 1 : activeIndex - 1;
    if (next < 0 || next >= containers.length) return;
    snapToContainer(next);
  }, { passive: false });

  // 키보드 스냅
  window.addEventListener('keydown', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    const nextKeys = ['ArrowDown', 'PageDown', 'Space'];
    const prevKeys = ['ArrowUp', 'PageUp'];
    if (![...nextKeys, ...prevKeys].includes(e.key)) return;
    e.preventDefault();
    const next = nextKeys.includes(e.key) ? activeIndex + 1 : activeIndex - 1;
    if (next < 0 || next >= containers.length) return;
    snapToContainer(next);
  });

  // 상태 동기화
  let _sync = null;
  window.addEventListener('scroll', () => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    clearTimeout(_sync);
    _sync = setTimeout(() => { activeIndex = detectIndexByCenter(); }, 80);
  }, { passive: true });
  window.addEventListener('resize', () => { activeIndex = detectIndexByCenter(); });
  window.addEventListener('load', () => { activeIndex = detectIndexByCenter(); });
})();

// About 내부 스냅
(() => {
  const aboutWrapper = document.querySelector('.about-scroll');
  if (!aboutWrapper) return;

  // 내부 콘텐츠 래퍼 구성
  let aboutContent = aboutWrapper.querySelector('.about-scroll-content');
  if (!aboutContent) {
    aboutContent = document.createElement('div');
    aboutContent.className = 'about-scroll-content';
    while (aboutWrapper.firstChild) aboutContent.appendChild(aboutWrapper.firstChild);
    aboutWrapper.appendChild(aboutContent);
  }

  // margin 대신 gap 사용
  Object.assign(aboutContent.style, { display: 'flex', flexDirection: 'column', rowGap: '40px' });
  aboutContent.querySelectorAll('.about-panel').forEach(p => { p.style.margin = '0'; });

  const lenisAbout = new Lenis({ wrapper: aboutWrapper, content: aboutContent, smoothWheel: true, smoothTouch: true });
  window.lenisAbout = lenisAbout;

  const panels = [...aboutContent.querySelectorAll('.about-panel')];
  if (!panels.length) return;

  const getPad = () => {
    const cs = getComputedStyle(aboutWrapper);
    return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  };
  const getWrapRect = () => aboutWrapper.getBoundingClientRect();

  // 현재 뷰 중앙 기준 가장 가까운 패널
  const panelIndexByView = () => {
    const mid = getWrapRect().top + getWrapRect().height / 2;
    let best = 0, dist = Infinity;
    panels.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  // 상/하 경계
  const isAtTop = () => {
    const padTop = getPad().top;
    const firstTop = panels[0].getBoundingClientRect().top;
    const wrapTop = getWrapRect().top + padTop;
    return Math.abs(firstTop - wrapTop) <= 24 || firstTop >= wrapTop;
  };
  const isAtBottom = () => {
    const padBottom = getPad().bottom;
    const lastBottom = panels[panels.length - 1].getBoundingClientRect().bottom;
    const wrapBottom = getWrapRect().bottom - padBottom;
    return Math.abs(lastBottom - wrapBottom) <= 24 || lastBottom <= wrapBottom;
  };

  // 패널 스냅(+패딩 고려)
  function snapToPanel(i) {
    if (i < 0 || i >= panels.length) return;
    const padTop = getPad().top;
    lockSnap();
    lenisAbout.scrollTo(panels[i], { duration: 0.9, offset: -padTop });
    waitSettleInner({ wrapper: aboutWrapper, panelEl: panels[i], padTop, tol: 1, settleFrames: 4, timeout: 2200 }, () => {
      const targetTop = getWrapRect().top + padTop;
      const curTop = panels[i].getBoundingClientRect().top;
      if (Math.abs(curTop - targetTop) > 1) lenisAbout.scrollTo(panels[i], { duration: 0.12, offset: -padTop });
      unlockSnap();
    });
  }
  window.snapToAboutPanel = snapToPanel;

  // 바깥 컨테이너 인덱스
  const containerIndexByCenter = () => {
    const mid = window.scrollY + innerHeight / 2;
    const containers = [...document.querySelectorAll('.container')];
    let best = 0, dist = Infinity;
    containers.forEach((el, i) => {
      const c = (el.offsetTop + el.offsetTop + el.offsetHeight) / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  // 내부 휠 누적(시간창)
  let innerAccAbs = 0, innerAccSigned = 0, innerFirstSign = 0, innerLastTs = 0;

  // 휠 스냅
  const wheelHandler = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (SNAP_LOCK || IS_SNAPPING) return;

    const now = performance.now(), delta = normWheelDelta(e);
    if (delta === 0) return;

    if (now - innerLastTs > ACC_WINDOW_MS) { innerAccAbs = 0; innerAccSigned = 0; innerFirstSign = 0; }
    innerLastTs = now;

    const sign = Math.sign(delta);
    if (!innerFirstSign) innerFirstSign = sign;

    innerAccAbs += Math.abs(delta);
    innerAccSigned += delta;

    if (innerAccAbs < MIN_WHEEL_ABS) return;

    const dir = Math.sign(innerAccSigned) || innerFirstSign;

    innerAccAbs = 0; innerAccSigned = 0; innerFirstSign = 0; innerLastTs = 0;

    const cur = panelIndexByView();

    if (dir > 0) {
      if (isAtBottom() && cur >= panels.length - 1) {
        aboutWrapper.blur();
        const outerCur = containerIndexByCenter();
        window.snapToContainer?.(outerCur + 1);
      } else {
        snapToPanel(Math.min(cur + 1, panels.length - 1));
      }
    } else {
      if (isAtTop() && cur <= 0) {
        aboutWrapper.blur();
        const outerCur = containerIndexByCenter();
        window.snapToContainer?.(outerCur - 1);
      } else {
        snapToPanel(Math.max(cur - 1, 0));
      }
    }
  };
  aboutWrapper.addEventListener('wheel', wheelHandler, { passive: false });

  // 키보드 스냅
  aboutWrapper.addEventListener('keydown', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    const nextKeys = ['ArrowDown', 'PageDown', 'Space'];
    const prevKeys = ['ArrowUp', 'PageUp'];
    if (![...prevKeys, ...nextKeys].includes(e.key)) return;
    e.preventDefault();
    const cur = panelIndexByView();
    if (nextKeys.includes(e.key)) {
      if (isAtBottom() && cur >= panels.length - 1) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() + 1);
      } else {
        snapToPanel(Math.min(cur + 1, panels.length - 1));
      }
    } else {
      if (isAtTop() && cur <= 0) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() - 1);
      } else {
        snapToPanel(Math.max(cur - 1, 0));
      }
    }
  });

  // 내부 영역 진입 시 포커스
  const containerAbout = document.querySelector('.container-about');
  if (containerAbout) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => e.isIntersecting && aboutWrapper.focus({ preventScroll: true }));
    }, { threshold: 0.6 });
    io.observe(containerAbout);
  }
})();

// GNB & 스크롤다운 링크 → 스냅 네비게이션
(() => {
  const containers = [...document.querySelectorAll('.container')];
  const idToContainerIndex = (id) => containers.findIndex(el => el.id === id);
  const aboutPanelOrder = ['about-intro', 'about-stack', 'about-experience'];
  const isAboutPanelId = (id) => aboutPanelOrder.includes(id);
  const panelIndexById = (id) => aboutPanelOrder.indexOf(id);

  function closeMenuIfOpen() {
    const header = document.querySelector('.site-header');
    const dim = document.querySelector('.nav-dim');
    const menuBtn = document.querySelector('.menu-btn');
    if (header?.classList.contains('open')) {
      header.classList.remove('open');
      menuBtn?.classList.remove('close');
      if (dim) dim.hidden = true;
    }
  }

  function handleHashNav(ev, href) {
    const url = new URL(href, location.href);
    const hash = url.hash;
    if (!hash) return;
    const id = hash.slice(1);
    const el = document.getElementById(id);
    if (!el) return;

    ev.preventDefault();
    closeMenuIfOpen();

    // about 내부 패널
    if (isAboutPanelId(id)) {
      const aboutIdx = idToContainerIndex('about');
      if (aboutIdx === -1) return;
      window.snapToContainer?.(aboutIdx);
      waitSettleWindow(containers[aboutIdx], { tol: 1, settleFrames: 4, timeout: 2200 }, () => {
        const pIdx = panelIndexById(id);
        if (typeof window.snapToAboutPanel === 'function') window.snapToAboutPanel(pIdx);
        else document.querySelector('.about-scroll')?.focus({ preventScroll: true });
      });
      return;
    }

    // 상위 컨테이너
    const cIdx = idToContainerIndex(id);
    if (cIdx !== -1) { window.snapToContainer?.(cIdx); return; }

    // 일반 앵커(예비)
    lockSnap();
    lenis.scrollTo(el, { duration: 0.9 });
    waitSettleWindow(el, { tol: 1, settleFrames: 4, timeout: 2200 }, () => { unlockSnap(); });
  }

  // 델리게이션: GNB a, .scroll-down-link
  document.addEventListener('click', (e) => {
    const a = e.target.closest('.gnb a, .scroll-down-link');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    handleHashNav(e, href);
  });
})();



//stack tab
(function(){
  const tab    = document.querySelector('.about-stack .stack-tab');
  const ind    = tab.querySelector('.stack-tab-activebg');
  const btns   = [...tab.querySelectorAll('.stack-tab-button')];
  const badges = document.querySelector('.about-stack .stack-badges');

  const padL = parseFloat(getComputedStyle(tab).paddingLeft) || 0;

  function moveIndicator(btn){
    const x = btn.offsetLeft - padL;
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = `translateX(${x}px)`;
  }

  function setActiveButton(targetBtn){
    btns.forEach(b => b.classList.toggle('active-button', b === targetBtn));
  }
  function applyFilter(filter){ badges.setAttribute('data-filter', filter); }

  const initial = btns.find(b => b.classList.contains('active-button')) || btns[0];
  moveIndicator(initial);
  applyFilter(initial.dataset.filter);

  btns.forEach(btn => btn.addEventListener('click', () => {
    setActiveButton(btn);
    moveIndicator(btn);
    applyFilter(btn.dataset.filter);
  }));

  const recalc = () => moveIndicator(btns.find(b => b.classList.contains('active-button')) || btns[0]);
  window.addEventListener('resize', recalc);
  window.addEventListener('load', recalc);
})();
