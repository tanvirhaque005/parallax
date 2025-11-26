// introMessage.js

(async function insertIntroMessage() {
    try {
      const response = await fetch("introMessage.html");
      const html = await response.text();
  
      const wrapper = document.createElement("div");
      wrapper.innerHTML = html.trim();
      const component = wrapper.firstChild;
  
      document.body.appendChild(component);
  
      startTypingAnimation();
    }
    catch (err) {
      console.error("Failed to load introMessage.html:", err);
    }
  })();
  
  /* ============================
     GET CUSTOM TEXT FROM HTML
  ============================ */
  
  function getIntroMessageText() {
    const holder = document.getElementById("introMessage");
    if (!holder) return null;
  
    const txt = holder.getAttribute("data-text");
    return (txt && txt.trim() !== "") ? txt : null;
  }
  
  /* ============================
     TYPING ANIMATION
  ============================ */
  
  function startTypingAnimation() {
    const element = document.getElementById("introText");
  
    // Pull text from parallel.html
    let fullText = getIntroMessageText();
  
    // Fallback
    if (!fullText) {
      fullText = "Welcome. Scroll to explore the timeline.";
    }
  
    element.textContent = "";
    element.classList.add('typing');
  
    let i = 0;
    const SPEED = 80;
    const INITIAL_DELAY = 600;
  
    setTimeout(() => {
      function typeChar() {
        if (i < fullText.length) {
          element.textContent += fullText[i];
          i++;
          requestAnimationFrame(() => setTimeout(typeChar, SPEED));
        } else {
          setTimeout(() => {
            element.classList.remove('typing');
          }, 500);
        }
      }
      typeChar();
    }, INITIAL_DELAY);
  }
  