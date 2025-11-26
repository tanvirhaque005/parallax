(function () {

    let defaultPromise = null;
    let overlayPromise = null;
    let typingCancelToken = { cancel: false };

    async function injectInto(containerId, promiseHolder) {

        // If already injected → reuse
        const existing = document.querySelector(`#${containerId} .timeline-intro`);
        if (existing) return existing;

        // If injection is already ongoing → wait for it
        if (promiseHolder.current) {
            return promiseHolder.current;
        }

        // Create the new injection promise
        promiseHolder.current = (async () => {
            const container = document.getElementById(containerId);
            if (!container) return null;

            const response = await fetch("introMessage.html");
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
       SHOW / HIDE DEFAULT INTRO
    ====================================================== */

    window.showDefaultIntro = async function showDefaultIntro() {
        const component = await injectInto("introMessageDefault",
                          (defaultPromise ||= { current: null }));

        const text = document.getElementById("introMessageDefault").dataset.text;

        resetText(component);
        component.style.display = "flex";

        startTypingAnimation(
            component.querySelector("#introText"),
            text
        );
    };

    window.hideDefaultIntro = function hideDefaultIntro() {
        const component = document.querySelector("#introMessageDefault .timeline-intro");
        if (!component) return;

        cancelTyping();
        resetText(component);
        component.style.display = "none";
    };


    /* ======================================================
       SHOW / HIDE OVERLAY INTRO
    ====================================================== */

    window.showOverlayIntro = async function showOverlayIntro() {
        const component = await injectInto("introMessageOverlay",
                          (overlayPromise ||= { current: null }));

        const text = document.getElementById("introMessageOverlay").dataset.text;

        resetText(component);
        component.style.display = "flex";

        startTypingAnimation(
            component.querySelector("#introText"),
            text
        );
    };

    window.hideOverlayIntro = function hideOverlayIntro() {
        const component = document.querySelector("#introMessageOverlay .timeline-intro");
        if (!component) return;

        cancelTyping();
        resetText(component);
        component.style.display = "none";
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

})();
