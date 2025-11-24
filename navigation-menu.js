// ============================================
// NAVIGATION MENU COMPONENT - JavaScript
// Handles auto-collapse and current page highlighting
// ============================================

(function() {
  'use strict';

  // Page mapping - maps file names to menu item indices
  const pageMap = {
    'aboutPage.html': 0,
    'bookshelf.html': 1,
    'chordGraph.html': 2,
    'parallel.html': 3,
    'morph.html': 4,
    'reflectionPage.html': 5,
    'landingPage.html': 0 // Landing page can link to about
  };

  // Menu items configuration
  const menuItems = [
    { text: 'Introduction', href: 'aboutPage.html' },
    { text: 'Bookshelf', href: 'bookshelf.html' },
    { text: 'Technology Network', href: 'chordGraph.html' },
    { text: 'Fiction vs Reality', href: 'parallel.html' },
    { text: 'World Building', href: 'morph.html' },
    { text: 'Reflection', href: 'reflectionPage.html' }
  ];

  // Initialize menu when DOM is ready
  function initNavigationMenu() {
    const menuContainer = document.getElementById('navigationMenu');
    if (!menuContainer) return;

    // Get current page
    const currentPage = window.location.pathname.split('/').pop() || 'landingPage.html';
    const currentIndex = pageMap[currentPage] !== undefined ? pageMap[currentPage] : -1;

    // Create progress line
    const progressLine = document.createElement('div');
    progressLine.className = 'nav-progress-line';
    
    // Create blue dot
    const progressDot = document.createElement('div');
    progressDot.className = 'nav-progress-dot';
    
    // Position dot based on current page
    if (currentIndex >= 0 && menuItems.length > 0) {
      const totalItems = menuItems.length;
      const position = (currentIndex / (totalItems - 1)) * 100;
      progressDot.style.top = `${position}%`;
    } else {
      progressDot.style.top = '0%';
    }
    
    // Animate dot appearance
    setTimeout(() => {
      progressDot.classList.add('animate-in');
    }, 100);
    
    progressLine.appendChild(progressDot);
    
    // Create menu items
    const menuItemsList = document.createElement('ul');
    menuItemsList.className = 'nav-menu-items';
    
    menuItems.forEach((item, index) => {
      const listItem = document.createElement('li');
      listItem.className = 'nav-menu-item';
      
      if (index === currentIndex) {
        listItem.classList.add('active');
      }
      
      const link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.text;
      listItem.appendChild(link);
      menuItemsList.appendChild(listItem);
    });
    
    // Append to container
    menuContainer.appendChild(progressLine);
    menuContainer.appendChild(menuItemsList);
    
    // Auto-collapse after 5 seconds
    let collapseTimer;
    let isHovering = false;
    
    function expandMenu() {
      menuContainer.classList.remove('collapsed');
      const items = menuContainer.querySelectorAll('.nav-menu-item');
      const menuItems = menuContainer.querySelector('.nav-menu-items');
      const progressLine = menuContainer.querySelector('.nav-progress-line');
      
      // Ensure menu items container is visible
      if (menuItems) {
        menuItems.style.width = 'auto';
        menuItems.style.overflow = 'visible';
        menuItems.style.opacity = '1';
        menuItems.style.transform = 'translateX(0) scale(1)';
      }
      
      // Animate progress line sliding left when expanding
      if (progressLine) {
        progressLine.style.transition = 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        // Force reflow
        void progressLine.offsetHeight;
        progressLine.style.transform = 'translateX(-15px)';
        progressLine.style.opacity = '1';
      }
      
      // Reset all items to collapsed state first
      items.forEach((item) => {
        item.classList.remove('collapsing', 'expanding');
        item.style.opacity = '0';
        item.style.transform = 'translateX(40px) scale(0.9)';
        item.style.animation = 'none';
        item.style.animationDelay = '';
      });
      
      // Force a reflow to ensure the reset takes effect
      void menuContainer.offsetHeight;
      
      // Then animate them sliding out one by one with stagger (start after line starts)
      items.forEach((item, index) => {
        setTimeout(() => {
          item.style.animation = `itemSlideOutHover 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
          item.style.animationDelay = `${index * 0.05}s`;
        }, 100 + index * 50);
      });
    }
    
    function collapseMenu() {
      const items = menuContainer.querySelectorAll('.nav-menu-item');
      const menuItems = menuContainer.querySelector('.nav-menu-items');
      const progressLine = menuContainer.querySelector('.nav-progress-line');
      
      // Animate items sliding back in reverse order (last item first)
      items.forEach((item, index) => {
        const reverseIndex = items.length - 1 - index;
        setTimeout(() => {
          item.style.animation = `itemSlideInCollapse 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
        }, reverseIndex * 30);
      });
      
      // Animate progress line sliding out after items start collapsing
      if (progressLine) {
        setTimeout(() => {
          progressLine.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
          // Force reflow
          void progressLine.offsetHeight;
          progressLine.style.transform = 'translateX(20px)';
          progressLine.style.opacity = '0.7';
        }, items.length * 30);
      }
      
      setTimeout(() => {
        if (!isHovering) {
          menuContainer.classList.add('collapsed');
          if (menuItems) {
            menuItems.style.width = '0';
            menuItems.style.overflow = 'hidden';
          }
        }
      }, items.length * 30 + 500);
    }
    
    function scheduleCollapse() {
      clearTimeout(collapseTimer);
      expandMenu();
      
      collapseTimer = setTimeout(() => {
        // Only collapse if not hovering
        if (!isHovering) {
          collapseMenu();
        }
      }, 5000);
    }
    
    // Initial collapse schedule - menu shows on page load
    menuContainer.classList.remove('collapsed');
    scheduleCollapse();
    
    // Reset timer on mouse enter
    menuContainer.addEventListener('mouseenter', () => {
      isHovering = true;
      clearTimeout(collapseTimer);
      
      // Only trigger expand animation if menu is collapsed
      if (menuContainer.classList.contains('collapsed')) {
        expandMenu();
      }
    });
    
    // Schedule collapse on mouse leave
    menuContainer.addEventListener('mouseleave', () => {
      isHovering = false;
      scheduleCollapse();
    });
    
    // Also reset timer on page interactions (click, scroll, etc.)
    // but only if menu is not collapsed
    ['click', 'scroll', 'touchstart'].forEach(eventType => {
      document.addEventListener(eventType, () => {
        if (!menuContainer.classList.contains('collapsed')) {
          scheduleCollapse();
        }
      }, { passive: true });
    });
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNavigationMenu);
  } else {
    initNavigationMenu();
  }
})();

