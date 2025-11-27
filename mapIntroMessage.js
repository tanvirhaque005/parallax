(function () {

    let introPromise = null;
    let typingCancelToken = { cancel: false };
    let isIntroActive = true;

    async function injectIntro(containerId, promiseHolder) {

        // If already injected → reuse
        const existing = document.querySelector(`#${containerId} .map-intro`);
        if (existing) return existing;

        // If injection is already ongoing → wait for it
        if (promiseHolder.current) {
            return promiseHolder.current;
        }

        // Create the new injection promise
        promiseHolder.current = (async () => {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const response = await fetch("mapIntroMessage.html");
            const html = await response.text();

            const wrap = document.createElement("div");
            wrap.innerHTML = html.trim();

            const component = wrap.firstChild;
            container.appendChild(component);

            return component;
        })();

        return promiseHolder.current;
    }


    /* ======================================================
       SHOW / HIDE MAP INTRO
    ====================================================== */

    window.showMapIntro = async function showMapIntro(showText = false) {
        const component = await injectIntro("mapIntroContainer",
                          (introPromise ||= { current: null }));

        const text = document.getElementById("mapIntroContainer").dataset.text;

        resetText(component);
        component.style.display = "flex";
        component.classList.remove('hidden');
        isIntroActive = true;

        // Only show text if explicitly requested
        if (showText) {
            component.classList.add('show-text');
            startTypingAnimation(
                component.querySelector("#introText"),
                text
            );
        }
    };

    window.hideMapIntro = function hideMapIntro() {
        const component = document.querySelector("#mapIntroContainer .map-intro");
        if (!component) return;

        cancelTyping();
        component.classList.add('hidden');
        isIntroActive = false;

        // Fully hide after transition
        setTimeout(() => {
            if (!isIntroActive) {
                component.style.display = "none";
                resetText(component);
            }
        }, 500);
    };

    window.isMapIntroActive = function() {
        return isIntroActive;
    };


    /* ======================================================
       CLEAR TEXT + CANCEL TYPING
    ====================================================== */

    function resetText(component) {
        const el = component?.querySelector("#introText");
        if (el) el.textContent = "";
    }

    function cancelTyping() {
        typingCancelToken.cancel = true;
        typingCancelToken = { cancel: false };   // reset token
    }


    /* ======================================================
       TYPING ANIMATION (with cancel support)
    ====================================================== */

    function startTypingAnimation(el, fullText) {

        cancelTyping(); // make sure previous animation stops

        let i = 0;
        const SPEED = 20;
        const token = typingCancelToken;

        function step() {
            if (token.cancel) return; // typing was cancelled

            if (i < fullText.length) {
                el.textContent += fullText[i++];
                requestAnimationFrame(() =>
                    setTimeout(step, SPEED)
                );
            }
        }

        step();
    }


    /* ======================================================
       ARROW KEY AND SCROLL NAVIGATION
    ====================================================== */

    window.addEventListener('keydown', (e) => {
        // Only handle right arrow when intro is active
        if (e.key === 'ArrowRight' && isIntroActive) {
            e.preventDefault();
            hideMapIntro();
        }
    });

    // Also trigger on first scroll
    let hasScrolled = false;
    window.addEventListener('wheel', (e) => {
        if (!hasScrolled && isIntroActive) {
            hasScrolled = true;
            hideMapIntro();
        }
    }, { passive: true });

})();
