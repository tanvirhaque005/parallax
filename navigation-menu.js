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
    'landingPage.html': 0
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

    // Create white progress line
    const progressLine = document.createElement('div');
    progressLine.className = 'nav-progress-line';
    
    // Create blue square indicator
    const progressDot = document.createElement('div');
    progressDot.className = 'nav-progress-dot';
    progressDot.dataset.currentIndex = currentIndex;
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
    
    // Set initial state - menu should be visible on page load
    menuContainer.classList.remove('collapsed');
    const items = menuContainer.querySelectorAll('.nav-menu-item');
    const menuItemsEl = menuContainer.querySelector('.nav-menu-items');
    
    // Set initial visible state without animation to prevent flicker
    if (menuItemsEl) {
      menuItemsEl.style.opacity = '1';
      menuItemsEl.style.transform = 'translateX(0)';
      menuItemsEl.style.width = 'auto';
      menuItemsEl.style.overflow = 'visible';
    }
    
    // Set items to visible state immediately
    items.forEach((item) => {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
      item.style.transition = 'none'; // No transition on initial load
    });
    
    // Set line to visible state
    if (progressLine) {
      progressLine.style.transform = 'translateX(0)';
      progressLine.style.opacity = '1';
      progressLine.style.transition = 'none'; // No transition on initial load
    }
    
    // Re-enable transitions after a brief delay
    setTimeout(() => {
      items.forEach((item) => {
        item.style.transition = '';
      });
      if (progressLine) {
        progressLine.style.transition = '';
      }
    }, 100);
    
    // Update line height and dot position to match menu items after layout
    function updateLineHeightAndDot() {
      if (menuItemsList && progressLine && progressDot) {
        requestAnimationFrame(() => {
          const itemsHeight = menuItemsList.offsetHeight;
          if (itemsHeight > 0) {
            progressLine.style.height = `${itemsHeight}px`;
          }
          
          // Position blue dot based on active menu item's blue bar position
          const currentIdx = parseInt(progressDot.dataset.currentIndex) || 0;
          const items = menuItemsList.querySelectorAll('.nav-menu-item');
          
          if (items.length > 0 && currentIdx >= 0 && currentIdx < items.length) {
            const activeItem = items[currentIdx];
            const activeLink = activeItem.querySelector('a');
            
            // Get the position of the blue bar (::before element)
            // The blue bar is at left: 0, so we need the center Y of the link element
            const activeLinkRect = activeLink.getBoundingClientRect();
            const progressLineRect = progressLine.getBoundingClientRect();
            
            // Calculate position relative to the progress line
            // The blue bar is centered vertically on the link, so use link center
            // Move it slightly lower by using a smaller offset
            const offsetPixels = 2; // Smaller value (was 4) moves dot slightly lower
            const linkCenterY = activeLinkRect.top + activeLinkRect.height / 2;
            const adjustedY = linkCenterY - offsetPixels;
            const lineTop = progressLineRect.top;
            const lineHeight = progressLineRect.height || itemsHeight;
            
            // Position dot to align with the center of the active menu item's link
            const relativePosition = ((adjustedY - lineTop) / lineHeight) * 100;
            const clampedPosition = Math.max(0, Math.min(100, relativePosition));
            progressDot.style.top = `${clampedPosition}%`;
          } else if (items.length > 0) {
            // Fallback: use percentage calculation with slight downward offset
            const totalItems = items.length;
            if (totalItems > 1) {
              const basePosition = (currentIdx / (totalItems - 1)) * 100;
              // Move down by about 1% to make it slightly lower
              const adjustedPosition = Math.max(0, basePosition - 1.5);
              progressDot.style.top = `${adjustedPosition}%`;
            } else {
              progressDot.style.top = '49%'; // Slightly lower than center
            }
          }
        });
      }
    }
    
    // Update line height and dot position after items are rendered
    setTimeout(updateLineHeightAndDot, 300);
    setTimeout(updateLineHeightAndDot, 600);
    window.addEventListener('resize', updateLineHeightAndDot);
    
    // Store update function for use when menu expands
    menuContainer.updateLineHeightAndDot = updateLineHeightAndDot;
    
    // Auto-collapse after 5 seconds
    let collapseTimer;
    let collapseAnimationTimeout = null;
    let isHovering = false;
    let isAnimating = false;
    
    function expandMenu() {
      if (isAnimating) return;
      isAnimating = true;
      menuContainer.classList.add('animating');
      menuContainer.classList.remove('collapsed');
      
      const items = menuContainer.querySelectorAll('.nav-menu-item');
      const menuItemsEl = menuContainer.querySelector('.nav-menu-items');
      const progressLineEl = menuContainer.querySelector('.nav-progress-line');
      
      // Animate progress line sliding left at the same pace as menu items
      if (progressLineEl) {
        // Start line animation at the same time as first item (50ms delay)
        setTimeout(() => {
          progressLineEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          void progressLineEl.offsetHeight;
          progressLineEl.style.transform = 'translateX(0)';
          progressLineEl.style.opacity = '1';
        }, 50);
      }
      
      // Ensure menu items container is visible
      if (menuItemsEl) {
        menuItemsEl.style.width = 'auto';
        menuItemsEl.style.overflow = 'visible';
        menuItemsEl.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        void menuItemsEl.offsetHeight;
        menuItemsEl.style.opacity = '1';
        menuItemsEl.style.transform = 'translateX(0)';
      }
      
      // Animate items sliding out one by one with smooth stagger
      items.forEach((item, index) => {
        item.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        item.style.opacity = '0';
        item.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
          void item.offsetHeight;
          item.style.opacity = '1';
          item.style.transform = 'translateX(0)';
        }, 50 + index * 40);
      });
      
      // Remove animating class after animation completes and update dot position
      setTimeout(() => {
        menuContainer.classList.remove('animating');
        isAnimating = false;
        // Update dot position after menu expands to ensure alignment
        if (menuContainer.updateLineHeightAndDot) {
          menuContainer.updateLineHeightAndDot();
        }
      }, 50 + items.length * 40 + 400);
    }
    
    function collapseMenu() {
      if (isAnimating) return;
      
      // Clear any existing collapse timeout
      if (collapseAnimationTimeout) {
        clearTimeout(collapseAnimationTimeout);
        collapseAnimationTimeout = null;
      }
      
      isAnimating = true;
      menuContainer.classList.add('animating');
      
      const items = menuContainer.querySelectorAll('.nav-menu-item');
      const menuItemsEl = menuContainer.querySelector('.nav-menu-items');
      const progressLineEl = menuContainer.querySelector('.nav-progress-line');
      
      // Animate items sliding back in reverse order (last item first) with same smooth timing as expand
      items.forEach((item, index) => {
        const reverseIndex = items.length - 1 - index;
        item.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
        
        setTimeout(() => {
          // Check if user hovered - cancel collapse if so
          if (isHovering) {
            isAnimating = false;
            menuContainer.classList.remove('animating');
            expandMenu();
            return;
          }
          void item.offsetHeight;
          item.style.opacity = '0';
          item.style.transform = 'translateX(20px)';
        }, 50 + reverseIndex * 40); // Same timing as expand but in reverse
      });
      
      // Animate progress line sliding right with same smooth glide as expand
      if (progressLineEl) {
        // Start line animation at the same time as the first item to collapse (last item)
        // This creates the same smooth glide effect as expand
        setTimeout(() => {
          // Check if user hovered - cancel collapse if so
          if (isHovering) {
            isAnimating = false;
            menuContainer.classList.remove('animating');
            expandMenu();
            return;
          }
          progressLineEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          void progressLineEl.offsetHeight;
          progressLineEl.style.transform = 'translateX(20px)';
          progressLineEl.style.opacity = '0.8';
        }, 50); // Start at same time as first collapsing item
      }
      
      setTimeout(() => {
        // Check if user hovered during collapse - if so, don't mark as collapsed
        if (!isHovering) {
          menuContainer.classList.add('collapsed');
          if (menuItemsEl) {
            menuItemsEl.style.width = '0';
            menuItemsEl.style.overflow = 'hidden';
          }
          menuContainer.classList.remove('animating');
          isAnimating = false;
        } else {
          // User hovered, cancel collapse and expand
          isAnimating = false;
          menuContainer.classList.remove('animating');
          expandMenu();
        }
      }, 50 + items.length * 40 + 400);
    }
    
    function scheduleCollapse() {
      clearTimeout(collapseTimer);
      // Don't call expandMenu if menu is already visible and not collapsed
      if (menuContainer.classList.contains('collapsed')) {
        expandMenu();
      }
      
      collapseTimer = setTimeout(() => {
        // Only collapse if not hovering
        if (!isHovering) {
          collapseMenu();
        }
      }, 5000);
    }
    
    // Initial collapse schedule - menu shows on page load, start timer after a delay
    setTimeout(() => {
      scheduleCollapse();
    }, 100);
    
    // Reset timer on mouse enter
    menuContainer.addEventListener('mouseenter', () => {
      isHovering = true;
      clearTimeout(collapseTimer);
      
      // If menu is collapsing, cancel it and expand immediately
      if (isAnimating && !menuContainer.classList.contains('collapsed')) {
        // Cancel collapse animation
        if (collapseAnimationTimeout) {
          clearTimeout(collapseAnimationTimeout);
          collapseAnimationTimeout = null;
        }
        // Reset animation state and expand
        isAnimating = false;
        expandMenu();
      } else if (menuContainer.classList.contains('collapsed') && !isAnimating) {
        // Menu is already collapsed, expand it
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

