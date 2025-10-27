// DOM ready
$(function () {
  var $root = $('html');
  var $btn = $('.menu-btn');
  var $menu = $('#mobileMenu');
  var BREAKPOINT = 740;
  var LOCK_SCROLL = true;

  if ($btn.length === 0 || $menu.length === 0) return;

  // 초기 상태 정리(모바일일 때 메뉴 닫기)
  function ensureInitial() {
    if (window.innerWidth < BREAKPOINT) {
      $menu.hide();
      $root.removeClass('is-menu-open');
      $btn.attr({ 'aria-expanded': 'false', 'aria-label': '메뉴 열기' });
      if (LOCK_SCROLL) $('body').css('overflow', '');
    }
  }

  // 메뉴 열기
  function openMenu() {
    $menu.stop(true, true).slideDown(220);
    $root.addClass('is-menu-open');
    $btn.attr({ 'aria-expanded': 'true', 'aria-label': '메뉴 닫기' });
  }

  // 메뉴 닫기
  function closeMenu() {
    $menu.stop(true, true).slideUp(200);
    $root.removeClass('is-menu-open');
    $btn.attr({ 'aria-expanded': 'false', 'aria-label': '메뉴 열기' });
    if (LOCK_SCROLL) $('body').css('overflow', '');
  }

  // 메뉴 토글 핸들러
  function toggleMenu(e) {
    e.preventDefault();
    $root.hasClass('is-menu-open') ? closeMenu() : openMenu();
  }

  // 버튼 클릭 시 토글
  $btn.on('click', toggleMenu);

  // 모바일 메뉴 링크 클릭 시 닫기
  $('#mobileMenu a').on('click', closeMenu);

  // 바깥 클릭 시 닫기
  $(document).on('click', function (e) {
    if (!$root.hasClass('is-menu-open')) return;
    if ($(e.target).closest('#mobileMenu, .menu-btn, .mobile-top').length) return;
    closeMenu();
  });

  // ESC 키로 닫기
  $(document).on('keydown', function (e) {
    if (e.key === 'Escape' && $root.hasClass('is-menu-open')) closeMenu();
  });

  // 리사이즈 시 상태 정리(데스크톱 전환 시 강제 닫기)
  $(window).on('resize', function () {
    if (window.innerWidth >= BREAKPOINT && $root.hasClass('is-menu-open')) closeMenu();
  });

  // 초기 실행
  ensureInitial();

  // 스크롤다운
  $(document).on('click', '.scroll-down-btn', function (e) {
    e.preventDefault();
    var href = $(this).attr('href') || '#container2';
    var id = href.replace(/^#/, '');
    var $t = $('#' + id);
    if (!$t.length) return;

    var headerH = $('header').outerHeight() || 0;
    var y = $t.offset().top - headerH;

    $('html, body').stop(true).animate({ scrollTop: y }, 500, 'swing');
  });
});



// lottie 애니메이션
lottie.loadAnimation({
  container: document.getElementById('lottie-container'),
  renderer: 'svg',
  loop: true,
  autoplay: true,
  path: './loan-ui.json'
});


//content8 커버 애니메이션
document.addEventListener('DOMContentLoaded', function () {
  const BREAKPOINT = 740;
  if (window.innerWidth <= BREAKPOINT) return; //  모바일이면 바로 종료

  const section = document.querySelector('.container8');
  const left    = document.querySelector('.cover-left');
  const right   = document.querySelector('.cover-right');
  if (!section || !left || !right) return;

  const COMPLETE_AT = 0.5;
  const clamp = (n,a,b)=>Math.max(a,Math.min(b,n));
  let ticking = false;

  function progressByViewport() {
    const r  = section.getBoundingClientRect();
    const vh = window.innerHeight;
    const total = vh + r.height;
    const seen  = vh - r.top;
    return clamp(seen / total, 0, 1);
  }

  function update() {
    const t  = clamp(progressByViewport() / COMPLETE_AT, 0, 1);
    const p  = 50 + 50 * t; // 50% → 100%

    const leftClip  = `inset(0 ${p}% 0 0)`;
    const rightClip = `inset(0 0 0 ${p}%)`;
    left.style.clipPath = leftClip;
    right.style.clipPath = rightClip;
    left.style.webkitClipPath = leftClip;
    right.style.webkitClipPath = rightClip;

    ticking = false;
  }

  function onScrollOrResize(){
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  window.addEventListener('scroll', onScrollOrResize, {passive:true});
  window.addEventListener('resize', onScrollOrResize, {passive:true});
  update();
});

// content9 스크롤 애니메이션
document.addEventListener('DOMContentLoaded', () => {
  const targets = Array.from(document.querySelectorAll('.container9 [data-fade]'));
  if (targets.length === 0) return;

  const MIN_OPACITY = 0.15;
  const MAX_SHIFT_FALLOFF = 1.0;
  const ENTER_OFFSET = 0.70;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const easeOutCubic = t => 1 - Math.pow(1 - t, 2.2);

  targets.forEach(el => {
    const shift = parseFloat(el.dataset.shift || '20');
    el.style.setProperty('--o', '0');
    el.style.setProperty('--ty', `${shift}px`);
  });

  let ticking = false;
  function update() {
  const vh = window.innerHeight || document.documentElement.clientHeight;
  const center = vh * 0.5;

  targets.forEach(el => {
    const rect = el.getBoundingClientRect();
    const shift = parseFloat(el.dataset.shift || '20');

    const start = vh * ENTER_OFFSET;
    const end   = vh * (1 - (1-ENTER_OFFSET));
    const elCenter = rect.top + rect.height / 2;

    const raw = clamp((start - (elCenter - center)) / (vh * MAX_SHIFT_FALLOFF), 0, 1);
    const t = easeOutCubic(raw);

    const opacity = MIN_OPACITY + (1 - MIN_OPACITY) * t;
    const ty = (1 - t) * shift;

    el.style.setProperty('--o', opacity.toFixed(3));
    el.style.setProperty('--ty', `${ty.toFixed(1)}px`);
  });

  ticking = false;
}


  function onScrollOrResize(){
    if (!ticking){
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  update();
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
});

