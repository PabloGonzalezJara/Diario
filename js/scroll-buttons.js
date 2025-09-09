export function initScrollButtons() {
    const scrollUpBtn = document.getElementById('scrollUpBtn');
    const scrollDownBtn = document.getElementById('scrollDownBtn');
    const scrollAmount = 300;

    // Check scroll position and update buttons
    function checkScrollPosition() {
        const scrollTop = window.scrollY;
        const windowHeight = window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        const scrollPercentage = (scrollTop / (documentHeight - windowHeight)) * 100;

        // Hide/show buttons based on position
        if (scrollPercentage < 10) {
            // Near top
            scrollUpBtn.style.opacity = '0.3';
            scrollDownBtn.style.opacity = '1';
        } else if (scrollPercentage > 90) {
            // Near bottom
            scrollUpBtn.style.opacity = '1';
            scrollDownBtn.style.opacity = '0.3';
        } else {
            // Middle
            scrollUpBtn.style.opacity = '1';
            scrollDownBtn.style.opacity = '1';
        }
    }

    // Add scroll event listener
    window.addEventListener('scroll', checkScrollPosition);

    // Click handlers
    scrollUpBtn.addEventListener('click', () => {
        window.scrollBy({
            top: -scrollAmount,
            behavior: 'smooth'
        });
    });

    scrollDownBtn.addEventListener('click', () => {
        window.scrollBy({
            top: scrollAmount,
            behavior: 'smooth'
        });
    });

    // Check position on load and after a small delay
    document.addEventListener('DOMContentLoaded', () => {
        checkScrollPosition();
        // Additional check after images and other resources load
        window.addEventListener('load', checkScrollPosition);
        // Backup check after a short delay
        setTimeout(checkScrollPosition, 100);
    });
}