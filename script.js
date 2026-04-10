  // On load, convert ?p=necrorder to a clean /necrorder in the address bar
  const params = new URLSearchParams(window.location.search);
  const pathCard = params.get('p');
  if (pathCard) {
    history.replaceState(null, '', '/' + pathCard);
  }

  const header = document.querySelector(".header-sections");
  const grid = document.querySelector(".grid");
  const cards = document.querySelectorAll(".card");
  const MARGIN = window.innerWidth < 500 ? 10 : 40;

  cards.forEach(card => {
    const closeBtn = card.querySelector(".close-btn");

  card.addEventListener("click", (e) => {
    //if (e.currentTarget !== e.target) return;
    if (card.classList.contains("fullscreen")) return;
    try { history.pushState(null, '', '/' + card.id); } catch (e) {}
    expandCard(card);
  });

    // Close button
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      try { history.pushState(null, '', '/'); } catch (e) {}
      collapseCard(card);
    });
  });

let isAnimating = false; // block rapid clicks

function expandCard(card) {
  if (isAnimating || card.classList.contains("fullscreen")) return;
  isAnimating = true;

  // Remove any existing placeholders
  document.querySelectorAll('.card-placeholder').forEach(p => p.remove());

  const rect = card.getBoundingClientRect();

  // Create placeholder
  const placeholder = document.createElement("div");
  placeholder.style.width = rect.width + "px";
  placeholder.style.height = rect.height + "px";
  placeholder.classList.add("card-placeholder");
  card.parentNode.insertBefore(placeholder, card);
  card.dataset.placeholderId = Date.now();
  placeholder.dataset.id = card.dataset.placeholderId;

  // Save original size
  card.dataset.originalWidth = rect.width;
  card.dataset.originalHeight = rect.height;

  // Move card to fixed position
  card.style.position = "fixed";
  card.style.top = rect.top + "px";
  card.style.left = rect.left + "px";
  card.style.width = rect.width + "px";
  card.style.height = rect.height + "px";

  card.classList.add("expanding");
  header.classList.add("blurred");
  grid.classList.add("blurred");
  document.body.style.overflow = "hidden";

  card.getBoundingClientRect(); // force reflow

  requestAnimationFrame(() => {
    card.style.top = "40px";
    card.style.left = "40px";
    card.style.width = `calc(100vw - 80px)`;
    card.style.height = `calc(100vh - 80px)`;
  });

  const onTransitionEnd = (e) => {
    if (["top","left","width","height"].includes(e.propertyName)) {
      card.classList.add("fullscreen");
      card.removeEventListener("transitionend", onTransitionEnd);
      isAnimating = false;
    }
  };

  card.addEventListener("transitionend", onTransitionEnd);
}

function collapseCard(card) {
  if (!card.classList.contains("fullscreen") && !card.classList.contains("expanding")) return;

  grid.classList.remove("blurred");
  header.classList.remove("blurred");
  card.classList.remove("fullscreen");

  card.scrollTop = 0;

  const placeholder = document.querySelector(
    `.card-placeholder[data-id="${card.dataset.placeholderId}"]`
  );

  // If placeholder is gone for some reason, just reset style and return
  if (!placeholder) {
    card.classList.remove("expanding");
    card.removeAttribute("style");
    document.body.style.overflow = "";
    return;
  }

  const rect = placeholder.getBoundingClientRect();

  requestAnimationFrame(() => {
    card.style.top = rect.top + "px";
    card.style.left = rect.left + "px";
    card.style.width = rect.width + "px";
    card.style.height = rect.height + "px";
  });

  const onTransitionEnd = (e) => {
    if (["top","left","width","height"].includes(e.propertyName)) {
      card.classList.remove("expanding");
      card.removeAttribute("style");
      document.body.style.overflow = "";
      placeholder.remove();
      card.removeEventListener("transitionend", onTransitionEnd);
    }
  };

  card.addEventListener("transitionend", onTransitionEnd);
}

  document.addEventListener("click", (e) => {
    const expandedCard = document.querySelector(".card.fullscreen");
    if (!expandedCard) return;

    // If clicking a link, do nothing
    if (e.target.closest("a")) return;

    // If click is NOT inside the expanded card
    if (!expandedCard.contains(e.target)) {
      try { history.pushState(null, '', '/'); } catch (e) {}
      collapseCard(expandedCard);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const expandedCard = document.querySelector(".card.fullscreen");
      if (expandedCard) {
        try { history.pushState(null, '', '/'); } catch (e) {}
        collapseCard(expandedCard);
      }
    }
  });

  window.addEventListener('popstate', () => {
    const id = window.location.pathname.slice(1);
    const currentlyOpen = document.querySelector('.card.fullscreen, .card.expanding');
    if (currentlyOpen) collapseCard(currentlyOpen);
    if (id) {
      const target = document.getElementById(id);
      if (target) setTimeout(() => expandCard(target), 500);
    }
  });

  const initialSlug = pathCard || window.location.pathname.slice(1);
  if (initialSlug) {
    const target = document.getElementById(initialSlug);
    if (target) expandCard(target);
  }

cards.forEach(card => {
  let pendingReset = null;

  card.addEventListener('mouseenter', () => {
    if (pendingReset) {
      card.removeEventListener('transitionend', pendingReset);
      pendingReset = null;
    }
    card.style.setProperty('--icon-scale', '1.1');
    card.style.setProperty('--icon-opacity', '0.6');
    card.classList.add('icon-pulsing');
  });

  card.addEventListener('mouseleave', () => {
    card.classList.remove('icon-pulsing');
    card.style.setProperty('--icon-opacity', '0');
    pendingReset = () => {
      card.style.setProperty('--icon-scale', '1');
      pendingReset = null;
    };
    card.addEventListener('transitionend', pendingReset, { once: true });
  });
});

const scrollHint = document.querySelector('.scroll-hint');

window.addEventListener('scroll', () => {
  scrollHint.classList.add('hidden');
}, { once: true });