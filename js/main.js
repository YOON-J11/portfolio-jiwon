// Lenis 초기화
const lenis = new Lenis({ smoothWheel: true, smoothTouch: false });
window.lenis = lenis;



// RAF 루프 (Lenis 실행)
function raf(t) {
  lenis.raf(t);
  if (window.lenisAbout) window.lenisAbout.raf(t);
  if (window.lenisWorks) window.lenisWorks.raf(t);
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




// lottie 애니메이션 이미지
document.querySelectorAll('.lottie-scroll-down').forEach((el) => {
  lottie.loadAnimation({
    container: el,
    renderer: 'svg',
    loop: true,
    autoplay: true,
    path: './assets/lottie/scroll-down-animation.json'
  });
});

lottie.loadAnimation({
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



function normWheelDelta(e) { return e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY; }
const MIN_WHEEL_ABS = 6;
const ACC_WINDOW_MS = 140;

let SNAP_LOCK = false;
let IS_SNAPPING = false;
function lockSnap() { SNAP_LOCK = true; IS_SNAPPING = true; }
function unlockSnap() { IS_SNAPPING = false; SNAP_LOCK = false; }

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




/* =======================
   바깥 컨테이너 스냅 (커버/섹션 간)
======================= */
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

  let outerAccAbs = 0, outerAccSigned = 0, outerFirstSign = 0, outerLastTs = 0;

  // 바깥 섹션: 휠 스냅
  window.addEventListener('wheel', (e) => {
    if (e.target.closest('.about-scroll,[data-lenis-prevent],.works-inner')) return;
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

  // 모바일 터치 스와이프 → 바깥 컨테이너 스냅
  const OUTER_TOUCH_EXCLUDE_SELECTOR = '.about-scroll,[data-lenis-prevent],.works-inner';
  const TOUCH_MIN_ABS = 40;   // 최소 이동 픽셀
  const TOUCH_MAX_TIME = 500; // 최대 제스처 시간

  let touchStartY = 0;
  let touchLastY = 0;
  let touchAccumY = 0;
  let touchStartT = 0;
  let outerTouchActive = false;

  function isInInnerScrollable(target, eventPath) {
    const sel = OUTER_TOUCH_EXCLUDE_SELECTOR;
    if (eventPath && Array.isArray(eventPath)) {
      return eventPath.some(el => el instanceof Element && el.closest && el.closest(sel));
    }
    return !!target.closest(sel);
  }

  function detectContainerIndex() {
    const mid = (window.scrollY || 0) + innerHeight / 2;
    let best = 0, dist = Infinity;
    containers.forEach((el, i) => {
      const c = (el.offsetTop + el.offsetTop + el.offsetHeight) / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  }

  window.addEventListener('touchstart', (e) => {
    const t = e.target;
    const path = e.composedPath?.();
    if (isInInnerScrollable(t, path)) { outerTouchActive = false; return; }
    if (SNAP_LOCK || IS_SNAPPING) return;

    outerTouchActive = true;
    touchStartY = touchLastY = e.touches[0].clientY;
    touchAccumY = 0;
    touchStartT = performance.now();
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    // 도중에 내부 스크롤러로 진입하면 즉시 handoff (바깥 스냅 포기
    if (outerTouchActive && isInInnerScrollable(e.target, e.composedPath?.())) {
      outerTouchActive = false;
      return;
    }
    if (!outerTouchActive || SNAP_LOCK || IS_SNAPPING) return;
    const y = e.touches[0].clientY;
    touchAccumY += (touchLastY - y);
    touchLastY = y;
  }, { passive: true });

  window.addEventListener('touchend', (e) => {
    if (!outerTouchActive || SNAP_LOCK || IS_SNAPPING) return;

    const dt = performance.now() - touchStartT;
    const abs = Math.abs(touchAccumY);

    outerTouchActive = false;

    if (abs < TOUCH_MIN_ABS || dt > TOUCH_MAX_TIME) return;

    e.preventDefault();

    const dir = Math.sign(touchAccumY);
    const cur = detectContainerIndex();
    const next = dir > 0 ? cur + 1 : cur - 1;

    if (typeof window.snapToContainer === 'function') {
      window.snapToContainer(next);
    }
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

  let _sync = null;
  window.addEventListener('scroll', () => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    clearTimeout(_sync);
    _sync = setTimeout(() => { activeIndex = detectIndexByCenter(); }, 80);
  }, { passive: true });
  window.addEventListener('resize', () => { activeIndex = detectIndexByCenter(); });
  window.addEventListener('load', () => { activeIndex = detectIndexByCenter(); });
})();

/* =======================
   #about 내부 스냅 (패널/탈출)
======================= */

(() => {
  const aboutWrapper = document.querySelector('.about-scroll');
  if (!aboutWrapper) return;

  // 내부 컨텐츠 래핑 (이미 있으면 그대로 사용)
  let aboutContent = aboutWrapper.querySelector('.about-scroll-content');
  if (!aboutContent) {
    aboutContent = document.createElement('div');
    aboutContent.className = 'about-scroll-content';
    while (aboutWrapper.firstChild) aboutContent.appendChild(aboutWrapper.firstChild);
    aboutWrapper.appendChild(aboutContent);
  }
  Object.assign(aboutContent.style, { display: 'flex', flexDirection: 'column', rowGap: '40px' });
  aboutContent.querySelectorAll('.about-panel').forEach(p => { p.style.margin = '0'; });

  // Lenis (내부)
  const lenisAbout = new Lenis({ wrapper: aboutWrapper, content: aboutContent, smoothWheel: true, smoothTouch: true });
  window.lenisAbout = lenisAbout;

  const panels = [...aboutContent.querySelectorAll('.about-panel')];
  if (!panels.length) return;

  // 내부 스크롤 컨텍스트 확보
  aboutWrapper.style.overflow = aboutWrapper.style.overflow || 'auto';
  aboutWrapper.style.height = aboutWrapper.style.height || '100dvh';
  aboutWrapper.style.webkitOverflowScrolling = 'touch';

  // 유틸
  const getPad = () => {
    const cs = getComputedStyle(aboutWrapper);
    return { top: parseFloat(cs.paddingTop) || 0, bottom: parseFloat(cs.paddingBottom) || 0 };
  };
  const wrapRect = () => aboutWrapper.getBoundingClientRect();
  const wrapTopPx = () => wrapRect().top + getPad().top;
  const wrapBottomPx = () => wrapRect().bottom - getPad().bottom;

  const currentPanelIndex = () => {
    const mid = wrapRect().top + wrapRect().height / 2;
    let best = 0, dist = Infinity;
    panels.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const c = r.top + r.height / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  // 패널 기준 "시작/끝에 도달" 판정 (wrapper 뷰포트 기준)
  const atPanelStart = (panel, eps = 2) => panel.getBoundingClientRect().top >= wrapTopPx() - eps;
  const atPanelEnd   = (panel, eps = 2) => panel.getBoundingClientRect().bottom <= wrapBottomPx() + eps;

  // 내부 스크롤 여유(전체 래퍼 기준) — 패널 내용이 래퍼보다 길 때 true
  const canScrollDown = () => (aboutWrapper.scrollHeight - aboutWrapper.clientHeight - aboutWrapper.scrollTop) > 1;
  const canScrollUp   = () => aboutWrapper.scrollTop > 1;

  // 패널 스냅
  function snapToPanel(i) {
    if (i < 0 || i >= panels.length) return;
    const padTop = getPad().top;
    lockSnap();
    lenisAbout.scrollTo(panels[i], { duration: 0.9, offset: -padTop });
    waitSettleInner({ wrapper: aboutWrapper, panelEl: panels[i], padTop, tol: 1, settleFrames: 4, timeout: 2200 }, () => {
      const targetTop = wrapTopPx();
      const curTop = panels[i].getBoundingClientRect().top;
      if (Math.abs(curTop - targetTop) > 1) lenisAbout.scrollTo(panels[i], { duration: 0.12, offset: -padTop });
      unlockSnap();
    });
  }
  window.snapToAboutPanel = snapToPanel;

  // 바깥 컨테이너 인덱스
  const containerIndexByCenter = () => {
    const mid = (window.scrollY || 0) + innerHeight / 2;
    const containers = [...document.querySelectorAll('.container')];
    let best = 0, dist = Infinity;
    containers.forEach((el, i) => {
      const c = (el.offsetTop + el.offsetTop + el.offsetHeight) / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };

  // ===== Wheel: 내부 스크롤 우선, 패널 경계에서만 스냅 =====
  let innerAccAbs = 0, innerAccSigned = 0, innerFirstSign = 0, innerLastTs = 0;
  const ACC_WINDOW_MS = 140, MIN_WHEEL_ABS = 6;
  const normWheelDelta = (e) => (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);

  const wheelHandler = (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;

    const delta = normWheelDelta(e);
    if (delta === 0) return;

    const curIdx = currentPanelIndex();
    const curPanel = panels[curIdx];
    const isFirst = curIdx === 0;
    const isLast  = curIdx === panels.length - 1;

    // 1) 방향에 여유 스크롤이 있고, 아직 패널 경계(시작/끝)에 도달하지 않았다 → 내부 스크롤 허용(리턴)
    if (delta > 0) {
      if (canScrollDown() && !atPanelEnd(curPanel)) return;   // 아래로: 끝에 아직 안 닿음 → 그냥 스크롤
    } else {
      if (canScrollUp() && !atPanelStart(curPanel)) return;   // 위로: 시작에 아직 안 닿음 → 그냥 스크롤
    }

    // 2) 패널 경계에 닿았고 계속 스크롤 → 스냅 동작
    e.preventDefault();
    e.stopPropagation();

    const now = performance.now();
    if (now - innerLastTs > ACC_WINDOW_MS) { innerAccAbs = 0; innerAccSigned = 0; innerFirstSign = 0; }
    innerLastTs = now;

    const sign = Math.sign(delta);
    if (!innerFirstSign) innerFirstSign = sign;

    innerAccAbs += Math.abs(delta);
    innerAccSigned += delta;
    if (innerAccAbs < MIN_WHEEL_ABS) return;

    const dir = Math.sign(innerAccSigned) || innerFirstSign;
    innerAccAbs = 0; innerAccSigned = 0; innerFirstSign = 0; innerLastTs = 0;

    if (dir > 0) {
      // 아래로: 패널 끝에서 다음으로
      if (isLast) {
        // 마지막 패널(experience) 끝 → 다음 컨테이너로 탈출
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() + 1);
      } else {
        snapToPanel(curIdx + 1); // intro → stack (요구사항)
      }
    } else {
      // 위로: 패널 시작에서 이전으로
      if (isFirst) {
        // 첫 패널(intro) 시작 → 이전 컨테이너로
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() - 1);
      } else {
        snapToPanel(curIdx - 1);
      }
    }
  };
  aboutWrapper.addEventListener('wheel', wheelHandler, { passive: false });

  // ===== Touch: 내부 스크롤 우선, 경계에서만 스냅 =====
  const TOUCH_MIN_ABS = 32, TOUCH_MAX_TIME = 700;
  let tStartY = 0, tLastY = 0, tAccumY = 0, tStartT = 0, tMoved = false, tActive = false;

  aboutWrapper.addEventListener('touchstart', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    tActive = true; tMoved = false;
    tStartY = tLastY = e.touches[0].clientY;
    tAccumY = 0;
    tStartT = performance.now();
  }, { passive: true });

  aboutWrapper.addEventListener('touchmove', (e) => {
    if (!tActive || SNAP_LOCK || IS_SNAPPING) return;
    const y = e.touches[0].clientY;
    const dy = tLastY - y; // 위로 스와이프: +
    tAccumY += dy;
    tLastY = y;
    if (Math.abs(tAccumY) > 2) tMoved = true;

    // 터치에서는 기본 스크롤을 막지 않는다(내부 스크롤 우선 허용)
    // 다만 iOS에서 바깥으로 튀는걸 막고 싶다면 overscroll-behavior로 제어
  }, { passive: true });

  aboutWrapper.addEventListener('touchend', (e) => {
    if (!tActive || SNAP_LOCK || IS_SNAPPING) return;
    tActive = false;

    const dt = performance.now() - tStartT;
    const abs = Math.abs(tAccumY);
    if (!tMoved || abs < TOUCH_MIN_ABS || dt > TOUCH_MAX_TIME) return;

    const dir = Math.sign(tAccumY); // +: 아래(다음), -: 위(이전)
    const curIdx = currentPanelIndex();
    const curPanel = panels[curIdx];
    const isFirst = curIdx === 0;
    const isLast  = curIdx === panels.length - 1;

    if (dir > 0) {
      // 아래로: 끝에 안 닿았으면 내부 스크롤로 종료
      if (canScrollDown() && !atPanelEnd(curPanel)) return;
      if (isLast) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() + 1);
      } else {
        snapToPanel(curIdx + 1);
      }
    } else {
      // 위로: 시작에 안 닿았으면 내부 스크롤로 종료
      if (canScrollUp() && !atPanelStart(curPanel)) return;
      if (isFirst) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() - 1);
      } else {
        snapToPanel(curIdx - 1);
      }
    }
  }, { passive: true });

  // 키보드(그대로 유지, 패널 경계 기준 스냅)
  aboutWrapper.addEventListener('keydown', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    const nextKeys = ['ArrowDown', 'PageDown', 'Space'];
    const prevKeys = ['ArrowUp', 'PageUp'];
    if (![...prevKeys, ...nextKeys].includes(e.key)) return;
    e.preventDefault();

    const curIdx = currentPanelIndex();
    const curPanel = panels[curIdx];
    const isFirst = curIdx === 0;
    const isLast  = curIdx === panels.length - 1;

    if (nextKeys.includes(e.key)) {
      if (canScrollDown() && !atPanelEnd(curPanel)) return; // 내부 여유 먼저 허용
      if (isLast) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() + 1);
      } else {
        snapToPanel(curIdx + 1);
      }
    } else {
      if (canScrollUp() && !atPanelStart(curPanel)) return; // 내부 여유 먼저 허용
      if (isFirst) {
        aboutWrapper.blur();
        window.snapToContainer?.(containerIndexByCenter() - 1);
      } else {
        snapToPanel(curIdx - 1);
      }
    }
  });

  // 포커스 핸들링
  const containerAbout = document.querySelector('.container-about');
  if (containerAbout) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => e.isIntersecting && aboutWrapper.focus({ preventScroll: true }));
    }, { threshold: 0.6 });
    io.observe(containerAbout);
  }
})();





/* =======================
   GNB & 스크롤다운 링크 → 스냅 네비게이션
======================= */
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

    const cIdx = idToContainerIndex(id);
    if (cIdx !== -1) { window.snapToContainer?.(cIdx); return; }

    lockSnap();
    lenis.scrollTo(el, { duration: 0.9 });
    waitSettleWindow(el, { tol: 1, settleFrames: 4, timeout: 2200 }, () => { unlockSnap(); });
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('.gnb a, .scroll-down-link');
    if (!a) return;
    const href = a.getAttribute('href');
    if (!href || href.charAt(0) !== '#') return;
    handleHashNav(e, href);
  });
})();




/* =======================
   #works 내부 스크롤 + 끝단에서 컨테이너 스냅
======================= */
(() => {
  const worksInner = document.querySelector('.container-works .works-inner');
  if (!worksInner) return;

  const lenisWorks = new Lenis({
    wrapper: worksInner,
    content: worksInner,
    smoothWheel: true,
    smoothTouch: true,
    lerp: 0.08
  });
  window.lenisWorks = lenisWorks;

  const containers = [...document.querySelectorAll('.container')];
  const detectContainerIndex = () => {
    const mid = (window.scrollY || 0) + innerHeight / 2;
    let best = 0, dist = Infinity;
    containers.forEach((el, i) => {
      const c = (el.offsetTop + el.offsetTop + el.offsetHeight) / 2;
      const d = Math.abs(c - mid);
      if (d < dist) { dist = d; best = i; }
    });
    return best;
  };





  // wheel: 끝단에서만 바깥 스냅
  worksInner.addEventListener('wheel', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;

    const delta = (e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY);
    const canDown = worksInner.scrollTop + worksInner.clientHeight < worksInner.scrollHeight - 1;
    const canUp = worksInner.scrollTop > 1;

    if ((delta > 0 && canDown) || (delta < 0 && canUp)) {
      e.stopPropagation();
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const idx = detectContainerIndex();
    if (delta > 0) window.snapToContainer?.(idx + 1);
    else window.snapToContainer?.(idx - 1);
  }, { passive: false });

  const TOUCH_MIN_ABS_WORKS = 32;
  const TOUCH_MAX_TIME_WORKS = 700;
  let wStartY = 0, wLastY = 0, wAccumY = 0, wStartT = 0, wMoved = false, wActive = false;

  const canWorksDown = () =>
    worksInner.scrollTop + worksInner.clientHeight < worksInner.scrollHeight - 1;
  const canWorksUp = () => worksInner.scrollTop > 1;

  worksInner.addEventListener('touchstart', (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;
    wActive = true; wMoved = false;
    wStartY = wLastY = e.touches[0].clientY;
    wAccumY = 0;
    wStartT = performance.now();
  }, { passive: true });

  worksInner.addEventListener('touchmove', (e) => {
    if (!wActive || SNAP_LOCK || IS_SNAPPING) return;
    const y = e.touches[0].clientY;
    const dy = wLastY - y;
    wAccumY += dy;
    wLastY = y;
    if (Math.abs(wAccumY) > 2) wMoved = true;
  }, { passive: true });

  worksInner.addEventListener('touchend', (e) => {
    if (!wActive || SNAP_LOCK || IS_SNAPPING) return;
    wActive = false;

    const dt  = performance.now() - wStartT;
    const abs = Math.abs(wAccumY);
    if (!wMoved || abs < TOUCH_MIN_ABS_WORKS || dt > TOUCH_MAX_TIME_WORKS) return;

    const dir = Math.sign(wAccumY);

    if (dir > 0 && canWorksDown()) return;
    if (dir < 0 && canWorksUp())   return;

    e.preventDefault();
    const idx = detectContainerIndex();
    if (dir > 0) window.snapToContainer?.(idx + 1);
    else         window.snapToContainer?.(idx - 1);
  }, { passive: false });

  const cont = document.querySelector('.container-works');
  if (cont) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => e.isIntersecting && worksInner.focus({ preventScroll: true }));
    }, { threshold: 0.6 });
    io.observe(cont);
  }
})();






/* =======================
   stack tab
======================= */
/* =======================
   stack tab (wrap 대응)
======================= */
(function () {
  const tab = document.querySelector('.about-stack .stack-tab');
  const ind = tab?.querySelector('.stack-tab-activebg');
  const btns = tab ? [...tab.querySelectorAll('.stack-tab-button')] : [];
  const badges = document.querySelector('.about-stack .stack-badges');
  if (!tab || !ind || !btns.length || !badges) return;

  function moveIndicator(btn) {
    const tabRect = tab.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const cs = getComputedStyle(tab);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padT = parseFloat(cs.paddingTop)  || 0;

    // 버튼 화면좌표 -> 탭 내부좌표로 변환
    const x = (btnRect.left - tabRect.left) - padL + tab.scrollLeft;
    const y = (btnRect.top  - tabRect.top)  - padT  + tab.scrollTop;

    ind.style.width  = btn.offsetWidth  + 'px';
    ind.style.height = btn.offsetHeight + 'px';
    ind.style.transform = `translate(${x}px, ${y}px)`;
  }

  function setActiveButton(targetBtn) {
    btns.forEach(b => b.classList.toggle('active-button', b === targetBtn));
  }
  function applyFilter(filter) { badges.setAttribute('data-filter', filter); }

  const initial = btns.find(b => b.classList.contains('active-button')) || btns[0];
  moveIndicator(initial);
  applyFilter(initial.dataset.filter);

  btns.forEach(btn => btn.addEventListener('click', () => {
    setActiveButton(btn);
    applyFilter(btn.dataset.filter);
    moveIndicator(btn);

    // 작은 화면에서 활성 버튼이 가려지면 탭 내부 스크롤로 중앙에 보이게
    const targetX = btn.offsetLeft - (tab.clientWidth  - btn.offsetWidth) / 2;
    const targetY = btn.offsetTop  - (tab.clientHeight - btn.offsetHeight) / 2;
    tab.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
  }));

  const recalc = () => moveIndicator(
    btns.find(b => b.classList.contains('active-button')) || btns[0]
  );

  // 줄바꿈/리플로우, 스크롤, 리사이즈 모두에서 위치 재계산
  window.addEventListener('resize', recalc);
  window.addEventListener('load', recalc);
  tab.addEventListener('scroll', recalc, { passive: true });
})();





/* =======================
   slick slider
======================= */
$(function () {
  var $slider = $('.js-publishing-slick');
  var $tag = $('.slide-caption .caption-tag');
  var $title = $('.slide-caption .caption-title');
  var $meta = $('.slide-caption .caption-meta');

  function setCaption(slick, index) {
    var $slide = $(slick.$slides[index]);
    var tag = $slide.data('tag') || '';
    var title = $slide.data('title') || '';
    var date = $slide.data('date') || '';

    $tag.css('opacity', 0);
    $title.css('opacity', 0);
    $meta.css('opacity', 0);

    setTimeout(function () {
      $tag.text(tag).css('opacity', 1);
      $title.text(title).css('opacity', 1);
      $meta.text(date).css('opacity', 1);
    }, 150);
  }

  function updateSlideLinks(slick) {
    var $slides = $(slick.$slides);
    $slides.each(function () {
      var $slide = $(this);
      var $a = $slide.find('a');

      // 깜빡임/중간 강조 방지를 위해 'slick-current'만 신뢰
      if ($slide.hasClass('slick-current')) {
        $a.attr({ tabindex: 0, 'aria-disabled': 'false' });
      } else {
        $a.attr({ tabindex: -1, 'aria-disabled': 'true' });
      }
    });
  }

  $slider.on('click', '.slick-slide a', function (e) {
    var $slide = $(this).closest('.slick-slide');
    if (!$slide.hasClass('slick-current')) {
      e.preventDefault();
      var idx = parseInt($slide.attr('data-slick-index'), 10);
      if (!isNaN(idx)) $slider.slick('slickGoTo', idx);
    }
  });

  $slider.on('init', function (e, slick) {
    setCaption(slick, slick.currentSlide);
    updateSlideLinks(slick);
  });

  $slider.slick({
    slidesToShow: 3,
    centerMode: true,
    centerPadding: '0px',
    infinite: true,
    arrows: false,
    dots: false,
    speed: 800,
    cssEase: 'ease',
    focusOnSelect: true,
    draggable: true,
    swipe: true,
    touchMove: true,
    swipeToSlide: true,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: false,

    
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 3, centerMode: true, centerPadding: '0px' } },
      // ★ 854px 이하: 한 장만, 페이드, 화살표 표시
      { breakpoint: 854,  settings: { 
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: false,
          fade: true,
          arrows: true,
          dots: false,
          focusOnSelect: false,
          swipeToSlide: false
        } 
      },
      { breakpoint: 480, settings: { 
          slidesToShow: 1,
          slidesToScroll: 1,
          centerMode: false,
          fade: true,
          arrows: true,
          dots: false
        } 
      }
    ]
  });

  $slider.on('afterChange', function (e, slick, current) {
    setCaption(slick, current);
    updateSlideLinks(slick);
  });
});


/* =======================
   연락처 폼 & 복사
======================= */
(function () {
  const form = document.getElementById('contactForm');
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const msgEl = document.getElementById('message');
  const btn = document.getElementById('submitBtn');
  const formStatus = document.getElementById('formStatus');

  const copyBtn = document.getElementById('copyEmailBtn');
  const copyStatus = document.getElementById('copyStatus');

  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xovpjlvp';

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  function validate() {
    const nameOk = nameEl.value.trim().length >= 2;
    const emailOk = emailRegex.test(emailEl.value.trim());
    const msgOk = msgEl.value.trim().length >= 5;
    const ok = nameOk && emailOk && msgOk;

    btn.disabled = !ok;
    btn.classList.toggle('is-disabled', !ok);
    btn.setAttribute('aria-disabled', String(!ok));
  }
  ['input', 'change', 'blur'].forEach(ev => {
    nameEl.addEventListener(ev, validate);
    emailEl.addEventListener(ev, validate);
    msgEl.addEventListener(ev, validate);
  });
  validate();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (btn.disabled) return;

    btn.disabled = true;
    btn.classList.add('is-disabled');
    formStatus.textContent = '전송 중입니다...';

    const payload = {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      message: msgEl.value.trim(),
      _subject: `[Portfolio] ${nameEl.value.trim()}님 문의`,
      _format: 'json'
    };

    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        formStatus.textContent = '메시지가 전송되었습니다. 곧 연락드릴게요!';
        form.reset();
        validate();
      } else {
        const data = await res.json().catch(() => ({}));
        formStatus.textContent = data?.error || '전송에 실패했어요. 잠시 후 다시 시도해주세요.';
        btn.disabled = false;
        btn.classList.remove('is-disabled');
        btn.setAttribute('aria-disabled', 'false');
      }
    } catch (err) {
      console.error(err);
      formStatus.textContent = '네트워크 오류가 발생했어요. 인터넷 연결을 확인해주세요.';
      btn.disabled = false;
      btn.classList.remove('is-disabled');
      btn.setAttribute('aria-disabled', 'false');
    }
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const email = copyBtn.dataset.email || 'yjw5619@gmail.com';
      try {
        await navigator.clipboard.writeText(email);
        if (copyStatus) {
          copyStatus.textContent = '이메일 주소가 복사되었습니다.';
          setTimeout(() => (copyStatus.textContent = ''), 2000);
        }
      } catch {
        if (copyStatus) {
          copyStatus.textContent = '복사 실패. 길게 눌러 직접 복사해주세요.';
          setTimeout(() => (copyStatus.textContent = ''), 2000);
        }
      }
    });
  }
})();
