// Lenis 초기화
const lenis = new Lenis({ autoRaf: true });
lenis.on('scroll', (e) => console.log(e));


document.addEventListener("DOMContentLoaded", async () => {
  if (window.loadStarsPreset) {
    try { await loadStarsPreset(tsParticles); } catch (e) { console.warn(e); }
  }

  const options = {
    autoPlay: true,
    background: {
      color: { value: "transparent" },
      image: "",
      opacity: 1
    },
    fullScreen: { enable: true, zIndex: 0 },
    detectRetina: true,
    fpsLimit: 120,

    interactivity: {
      detectsOn: "window",
      events: {
        onHover: { enable: false },
        onClick: { enable: true, mode: "repulse" },
        resize: { enable: true, delay: 0.5 }
      },
      modes: {
        repulse: { distance: 400, duration: 0.4, factor: 100, speed: 1, maxSpeed: 50, easing: "ease-out-quad" }
      }
    },

    particles: {
      number: { value: 160, density: { enable: true, width: 1920, height: 1080 } },
      color: { value: "#ffffff" },
      shape: { type: "circle" },

      opacity: {
        value: { min: 0.1, max: 1 },
        animation: { enable: true, speed: 0.6, startValue: "random", sync: false }
      },

      size: { value: { min: 0.4, max: 1.6 } },

      move: {
        enable: true,
        direction: "none",
        speed: { min: 0.02, max: 0.3 },
        outModes: { default: "out" }
      },

    },

    pauseOnBlur: true,
    pauseOnOutsideViewport: true,
    zLayers: 100
  };

  await tsParticles.load({ id: "particles-js", options });

});



// ====== 메뉴 토글 ======
const header = document.querySelector('.site-header');
const menuBtn = document.querySelector('.menu-btn');
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
menuBtn.addEventListener('click', () => header.classList.contains('open') ? closeMenu() : openMenu());
dim.addEventListener('click', closeMenu);
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && header.classList.contains('open')) closeMenu(); });




// ====== 앵커 스크롤 ======
document.querySelectorAll('.gnb a[href^="#"]').forEach(a => {
  a.addEventListener('click', (e) => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    if (window.lenis?.scrollTo) window.lenis.scrollTo(target, { duration: 1 });
    else target.scrollIntoView({ behavior: 'smooth' });
  });
});
