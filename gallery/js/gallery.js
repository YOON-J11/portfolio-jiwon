// tab
(function () {
  const tab = document.querySelector('.tab');
  const ind = tab?.querySelector('.tab-activebg');
  const btns = tab ? [...tab.querySelectorAll('.tab-button')] : [];
  const list = document.querySelector('.list');
  const items = list ? [...list.querySelectorAll('.gallery-item')] : [];

  if (!tab || !ind || !btns.length || !list || !items.length) return;

  function moveIndicator(btn) {
    const tabRect = tab.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    const cs = getComputedStyle(tab);
    const padL = parseFloat(cs.paddingLeft) || 0;
    const padT = parseFloat(cs.paddingTop) || 0;

    const x = (btnRect.left - tabRect.left) - padL + tab.scrollLeft;
    const y = (btnRect.top - tabRect.top) - padT + tab.scrollTop;

    ind.style.width = btn.offsetWidth + 'px';
    ind.style.height = btn.offsetHeight + 'px';
    ind.style.transform = `translate(${x}px, ${y}px)`;
  }

  function setActiveButton(targetBtn) {
    btns.forEach(b => b.classList.toggle('active-button', b === targetBtn));
  }

  function applyFilter(filter) {
    list.setAttribute('data-filter', filter);

    items.forEach(item => {
      const cats = (item.dataset.category || '').split(' ');
      const match = filter === 'all' || cats.includes(filter);
      item.style.display = match ? '' : 'none';
    });
  }

  const initial = btns.find(b => b.classList.contains('active-button')) || btns[0];
  moveIndicator(initial);
  applyFilter(initial.dataset.filter);

  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      setActiveButton(btn);
      applyFilter(btn.dataset.filter);
      moveIndicator(btn);

      const targetX = btn.offsetLeft - (tab.clientWidth - btn.offsetWidth) / 2;
      const targetY = btn.offsetTop - (tab.clientHeight - btn.offsetHeight) / 2;
      tab.scrollTo({ left: targetX, top: targetY, behavior: 'smooth' });
    });
  });

  const recalc = () => moveIndicator(
    btns.find(b => b.classList.contains('active-button')) || btns[0]
  );

  window.addEventListener('resize', recalc);
  window.addEventListener('load', recalc);
  tab.addEventListener('scroll', recalc, { passive: true });
})();
