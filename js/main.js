// Initialize Lenis
const lenis = new Lenis({
  autoRaf: true,
});

// Listen for the scroll event and log the event data
lenis.on('scroll', (e) => {
  console.log(e);
});

const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
const gnb = document.querySelector('.gnb');
const dim = document.querySelector('.nav-dim');

function openMenu() {
    header.classList.add('open');
    menuBtn.classList.add('close');
    dim.hidden = false;
}

function closeMenu() {
    header.classList.remove('open');
    menuBtn.classList.remove('close');
    dim.hidden = true;
}

menuBtn.addEventListener('click', () => {
    if (header.classList.contains('open')) {
        closeMenu();
    } else {
        openMenu();
    }
});

dim.addEventListener('click', closeMenu);
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('open')) closeMenu();
});

// 링크 클릭 시 닫기 + 부드럽게 이동(선택)
document.querySelectorAll('.gnb a[href^="#"]').forEach(a=>{
  a.addEventListener('click', (e)=>{
    const target = document.querySelector(a.getAttribute('href'));
    if (target) {
      e.preventDefault();
      closeMenu();
      if (window.lenis?.scrollTo) window.lenis.scrollTo(target, { duration: 1 });
      else target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});