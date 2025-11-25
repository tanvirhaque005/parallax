document.addEventListener("DOMContentLoaded", () => {
    const placeholders = document.querySelectorAll("[data-arrow-button]");
  
    placeholders.forEach(ph => {
      const text = ph.getAttribute("text") || "CLICK";
      const href = ph.getAttribute("href") || "#";
      const delay = parseFloat(ph.getAttribute("delay") || "0");  // seconds
  
      // Build the button wrapper (hidden initially)
      const wrapper = document.createElement("a");
      wrapper.classList.add("arrow-button-wrapper");
      wrapper.style.opacity = "0";         // start invisible
      wrapper.style.pointerEvents = "none"; // disable clicks until shown
  
      wrapper.href = href;
  
      wrapper.innerHTML = `
        <div class="arrow-button-text">${text}</div>
        <div class="arrow-button-circle">
          <span>→</span>
        </div>
      `;
  
      // Insert into DOM
      ph.replaceWith(wrapper);
  
      // Show after delay
      setTimeout(() => {
        wrapper.style.opacity = "1";
        wrapper.style.pointerEvents = "auto";
      }, delay * 1000);
    });
  });
  