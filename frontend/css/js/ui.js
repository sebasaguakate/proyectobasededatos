// Shared UI helpers (ripple effect)
(function(){
    function createRipple(e) {
        const target = e.target.closest('.btn');
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const ripple = document.createElement('span');
        ripple.className = 'ripple';

        const size = Math.max(rect.width, rect.height) * 1.2;
        ripple.style.width = ripple.style.height = size + 'px';

        const x = e.clientX - rect.left - size/2;
        const y = e.clientY - rect.top - size/2;
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';

        target.appendChild(ripple);

        window.setTimeout(() => {
            ripple.remove();
        }, 700);
    }

    document.addEventListener('pointerdown', createRipple, {passive: true});
})();
