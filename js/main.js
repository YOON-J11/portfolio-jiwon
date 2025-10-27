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




// lotti 애니메이션 이미지
lottie.loadAnimation({
  container: document.getElementById('lottie-scroll-down'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: './assets/lottie/scroll-down-animation.json'
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

(() => {
  const aboutWrapper = document.querySelector('.about-scroll');
  if (!aboutWrapper) return;

  let aboutContent = aboutWrapper.querySelector('.about-scroll-content');
  if (!aboutContent) {
    aboutContent = document.createElement('div');
    aboutContent.className = 'about-scroll-content';
    while (aboutWrapper.firstChild) aboutContent.appendChild(aboutWrapper.firstChild);
    aboutWrapper.appendChild(aboutContent);
  }

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

  let innerAccAbs = 0, innerAccSigned = 0, innerFirstSign = 0, innerLastTs = 0;

  function canScrollMoreDown() {
    const wrap = aboutWrapper;
    return (wrap.scrollHeight - wrap.clientHeight - wrap.scrollTop) > 1;
  }
  function canScrollMoreUp() {
    const wrap = aboutWrapper;
    return wrap.scrollTop > 1;
  }

  const wheelHandler = (e) => {
    if (SNAP_LOCK || IS_SNAPPING) return;

    const now = performance.now();
    const delta = normWheelDelta(e);
    if (delta === 0) return;

    const cur = panelIndexByView();
    const isLast = (cur >= panels.length - 1);
    const isFirst = (cur <= 0);

    if (delta > 0 && isLast && canScrollMoreDown()) {
      return;
    }
    if (delta < 0 && isFirst && canScrollMoreUp()) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

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
      if (isAtBottom() && isLast) {
        aboutWrapper.blur();
        const outerCur = containerIndexByCenter();
        window.snapToContainer?.(outerCur + 1);
      } else {
        const next = Math.min(cur + 1, panels.length - 1);
        if (next !== cur) snapToPanel(next);
      }
    } else {
      if (isAtTop() && isFirst) {
        aboutWrapper.blur();
        const outerCur = containerIndexByCenter();
        window.snapToContainer?.(outerCur - 1);
      } else {
        const prev = Math.max(cur - 1, 0);
        if (prev !== cur) snapToPanel(prev);
      }
    }
  };

  aboutWrapper.addEventListener('wheel', wheelHandler, { passive: false });


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

  const cont = document.querySelector('.container-works');
  if (cont) {
    const io = new IntersectionObserver((ents) => {
      ents.forEach((e) => e.isIntersecting && worksInner.focus({ preventScroll: true }));
    }, { threshold: 0.6 });
    io.observe(cont);
  }
})();



//stack tab
(function () {
  const tab = document.querySelector('.about-stack .stack-tab');
  const ind = tab.querySelector('.stack-tab-activebg');
  const btns = [...tab.querySelectorAll('.stack-tab-button')];
  const badges = document.querySelector('.about-stack .stack-badges');

  const padL = parseFloat(getComputedStyle(tab).paddingLeft) || 0;

  function moveIndicator(btn) {
    const x = btn.offsetLeft - padL;
    ind.style.width = btn.offsetWidth + 'px';
    ind.style.transform = `translateX(${x}px)`;
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
    moveIndicator(btn);
    applyFilter(btn.dataset.filter);
  }));

  const recalc = () => moveIndicator(btns.find(b => b.classList.contains('active-button')) || btns[0]);
  window.addEventListener('resize', recalc);
  window.addEventListener('load', recalc);
})();


//slick slider
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

      if ($slide.hasClass('slick-center') || $slide.hasClass('slick-current')) {
        $a.attr({ 'tabindex': 0, 'aria-disabled': 'false' });
      } else {
        $a.attr({ 'tabindex': -1, 'aria-disabled': 'true' });
      }
    });
  }

  $slider.on('click', '.slick-slide a', function (e) {
    var $slide = $(this).closest('.slick-slide');
    if (!$slide.hasClass('slick-center') && !$slide.hasClass('slick-current')) {
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
    speed: 1000,
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
      { breakpoint: 1400, settings: { slidesToShow: 3, centerPadding: '0px' } },
      { breakpoint: 768, settings: { slidesToShow: 3, centerPadding: '0px' } },
      { breakpoint: 480, settings: { slidesToShow: 1, centerPadding: '16px' } }
    ]
  });

  $slider.on('afterChange', function (e, slick, current) {
    setCaption(slick, current);
    updateSlideLinks(slick);
  });
});



(function () {
  const form = document.getElementById('contactForm');
  const nameEl = document.getElementById('name');
  const emailEl = document.getElementById('email');
  const msgEl = document.getElementById('message');
  const btn = document.getElementById('submitBtn');
  const formStatus = document.getElementById('formStatus');

  const copyBtn = document.getElementById('copyEmailBtn'); // 있으면 복사 기능 활성
  const copyStatus = document.getElementById('copyStatus');

  // 🔗 네가 준 Formspree 엔드포인트
  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xovpjlvp';

  // 간단 검증 → 모두 채워져야 활성화
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

  // 제출 → Formspree로 JSON POST
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

  // 이메일 주소 복사(우측 버튼이 있을 때)
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