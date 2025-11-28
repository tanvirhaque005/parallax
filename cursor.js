/* --------------------------------------
    Custom Cursor Circle
-------------------------------------- */
const cursor = document.getElementById("cursorCircle");

// Update cursor position
window.addEventListener("mousemove", (e) => {
  cursor.style.top = `${e.clientY}px`;
  cursor.style.left = `${e.clientX}px`;
});

// Helper to enlarge cursor on hover
function enableCursorHover(selector) {
  document.querySelectorAll(selector).forEach(el => {
    el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
    el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
  });
}

// Enable hover on interactive elements
enableCursorHover("button, a, .btn, .menu-button, .menu-close, .cta-button");
enableCursorHover(".first-decade-button");
document.addEventListener("mouseover", (e) => {
  const target = e.target.closest(".arrow-button-wrapper");
  if (target) {
    cursor.classList.add("hover");
  }
});

document.addEventListener("mouseout", (e) => {
  const target = e.target.closest(".arrow-button-wrapper");
  if (target) {
    cursor.classList.remove("hover");
  }
});

// Optional: Add selectors unique to this page
// enableCursorHover(".myClickableThing");
