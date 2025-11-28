/* --------------------------------------
    Custom Cursor Circle
-------------------------------------- */
let cursor = null;

// Initialize cursor when DOM is ready
function initCursor() {
  cursor = document.getElementById("cursorCircle");
  if (!cursor) {
    // If cursor element doesn't exist yet, try again after a short delay
    setTimeout(initCursor, 100);
    return;
  }

  // Make sure cursor is visible
  cursor.style.display = 'block';
  cursor.style.opacity = '1';
  cursor.style.zIndex = '99999';

  // Update cursor position
  window.addEventListener("mousemove", (e) => {
    if (cursor) {
      cursor.style.top = `${e.clientY}px`;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.display = 'block';
    }
  });

  // Helper to enlarge cursor on hover
  function enableCursorHover(selector) {
    document.querySelectorAll(selector).forEach(el => {
      el.addEventListener("mouseenter", () => {
        if (cursor) cursor.classList.add("hover");
      });
      el.addEventListener("mouseleave", () => {
        if (cursor) cursor.classList.remove("hover");
      });
    });
  }

  // Enable hover on interactive elements
  enableCursorHover("button, a, .btn, .menu-button, .menu-close, .cta-button");
  enableCursorHover(".first-decade-button");
  enableCursorHover(".arrow-button-wrapper");
  enableCursorHover("[data-arrow-button]");
  
  // Also handle arrow buttons with event delegation for dynamically created elements
  document.addEventListener("mouseover", (e) => {
    const target = e.target.closest(".arrow-button-wrapper") || e.target.closest("[data-arrow-button]");
    if (target && cursor) {
      cursor.classList.add("hover");
    }
  });

  document.addEventListener("mouseout", (e) => {
    const target = e.target.closest(".arrow-button-wrapper") || e.target.closest("[data-arrow-button]");
    if (target && cursor) {
      cursor.classList.remove("hover");
    }
  });
  
  // Re-enable hover for dynamically created arrow buttons
  setTimeout(() => {
    enableCursorHover(".arrow-button-wrapper");
    enableCursorHover("[data-arrow-button]");
  }, 1000);
  
  setTimeout(() => {
    enableCursorHover(".arrow-button-wrapper");
    enableCursorHover("[data-arrow-button]");
  }, 3000);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCursor);
} else {
  initCursor();
}
