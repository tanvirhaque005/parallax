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
    
    // Hide dot initially to prevent flicker, will be positioned and shown by updateLineHeightAndDot
    progressDot.style.opacity = '0';
    progressDot.style.visibility = 'hidden';
    
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
      menuItemsEl.style.pointerEvents = 'auto';
    }
    
    // Set items to visible state immediately
    items.forEach((item) => {
      item.style.opacity = '1';
      item.style.transform = 'translateX(0)';
      item.style.transition = 'none'; // No transition on initial load
      item.style.pointerEvents = 'auto';
    });
    
    // Set line height IMMEDIATELY - calculate and set synchronously before first paint
    // Calculate height synchronously after items are in DOM
    if (progressLine && menuItemsList) {
      // Disable transitions FIRST to prevent any animation
      progressLine.style.transition = 'none';
      
      // Ensure items are fully visible and laid out
      menuItemsList.style.opacity = '1';
      menuItemsList.style.transform = 'translateX(0)';
      menuItemsList.style.width = 'auto';
      menuItemsList.style.overflow = 'visible';
      menuItemsList.style.pointerEvents = 'auto';
      
      // Force reflow to ensure layout is calculated
      void menuItemsList.offsetHeight;
      
      // Calculate height immediately in one synchronous operation
      let itemsHeight = menuItemsList.offsetHeight;
      
      // If height is still 0 or too small, calculate from individual items
      if (itemsHeight <= 0 || itemsHeight < 100) {
        let totalHeight = 0;
        items.forEach((item) => {
          const itemRect = item.getBoundingClientRect();
          totalHeight += itemRect.height;
        });
        // Add gap between items (6px per gap, n-1 gaps for n items)
        const gap = 6;
        totalHeight += (items.length - 1) * gap;
        if (totalHeight > 0) {
          itemsHeight = totalHeight;
        }
      }
      
      // Set height IMMEDIATELY to calculated value - all in one operation
      // This ensures the line is always at full size from the very first render
      if (itemsHeight > 0) {
        // Set height with !important to override any CSS
        progressLine.style.setProperty('height', `${itemsHeight}px`, 'important');
        progressLine.style.setProperty('min-height', `${itemsHeight}px`, 'important');
        // Also set it as a regular style property
        progressLine.style.height = `${itemsHeight}px`;
        progressLine.style.minHeight = `${itemsHeight}px`;
        // Force multiple reflows to ensure it's applied before paint
        void progressLine.offsetHeight;
        void progressLine.offsetWidth;
        void progressLine.offsetHeight;
        // Store the height so we can reference it later
        progressLine.dataset.fullHeight = `${itemsHeight}px`;
      }
      
      progressLine.style.transform = 'translateX(0)';
      progressLine.style.opacity = '1';
      progressLine.style.transition = 'none'; // No transition on initial load
      
      // Re-enable transition after a delay to prevent glitches
      setTimeout(() => {
        progressLine.style.transition = '';
      }, 300);
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
        // Use double requestAnimationFrame to ensure layout is complete
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Force menu items to be visible to get accurate height measurement
            const wasCollapsed = menuContainer.classList.contains('collapsed');
            const originalOpacity = menuItemsList.style.opacity;
            const originalTransform = menuItemsList.style.transform;
            const originalWidth = menuItemsList.style.width;
            const originalOverflow = menuItemsList.style.overflow;
            const originalPointerEvents = menuItemsList.style.pointerEvents;
            
            // Temporarily make items fully visible to measure accurately
            menuItemsList.style.opacity = '1';
            menuItemsList.style.transform = 'translateX(0)';
            menuItemsList.style.width = 'auto';
            menuItemsList.style.overflow = 'visible';
            menuItemsList.style.pointerEvents = 'auto';
            
            // Force a reflow to ensure accurate measurement
            void menuItemsList.offsetHeight;
            
            const itemsHeight = menuItemsList.offsetHeight;
            if (itemsHeight > 0) {
              // Get current height to check if it needs updating
              const currentHeight = progressLine.style.height || getComputedStyle(progressLine).height;
              const currentHeightNum = parseInt(currentHeight) || 0;
              const newHeightNum = parseInt(itemsHeight) || 0;
              
              // Only update if the height is significantly different (more than 10px)
              // This prevents the line from shrinking if it's already at the correct size
              if (Math.abs(currentHeightNum - newHeightNum) > 10 || currentHeightNum < 200) {
                // Set height without transition to prevent glitches
                const currentTransition = progressLine.style.transition;
                progressLine.style.transition = 'none';
                progressLine.style.height = `${itemsHeight}px`;
                progressLine.style.minHeight = `${itemsHeight}px`;
                // Force a reflow
                void progressLine.offsetHeight;
                // Restore transition after height is set
                progressLine.style.transition = currentTransition || '';
              }
            }
            
            // Restore original styles
            if (wasCollapsed) {
              menuContainer.classList.add('collapsed');
            }
            menuItemsList.style.opacity = originalOpacity;
            menuItemsList.style.transform = originalTransform;
            menuItemsList.style.width = originalWidth;
            menuItemsList.style.overflow = originalOverflow;
            menuItemsList.style.pointerEvents = originalPointerEvents;
            
            // Position blue dot based on active menu item's blue bar position
            const currentIdx = parseInt(progressDot.dataset.currentIndex) || 0;
            const items = menuItemsList.querySelectorAll('.nav-menu-item');
            
            if (items.length > 0 && currentIdx >= 0 && currentIdx < items.length) {
              const activeItem = items[currentIdx];
              const activeLink = activeItem.querySelector('a');
              
              if (activeLink) {
                // Get the position of the blue bar (::before element)
                // The blue bar is at left: 0, so we need the center Y of the link element
                const activeLinkRect = activeLink.getBoundingClientRect();
                const progressLineRect = progressLine.getBoundingClientRect();
                
                // Ensure we have valid rects
                if (activeLinkRect.height > 0 && progressLineRect.height > 0) {
                  // Calculate position relative to the progress line
                  // The blue bar is centered vertically on the link, so use link center
                  // Move it slightly higher by using a positive offset
                  const offsetPixels = 3; // Positive value moves dot higher
                  const linkCenterY = activeLinkRect.top + activeLinkRect.height / 2;
                  const adjustedY = linkCenterY - offsetPixels;
                  const lineTop = progressLineRect.top;
                  const lineHeight = progressLineRect.height || itemsHeight;
                  
                  // Position dot to align with the center of the active menu item's link
                  const relativePosition = ((adjustedY - lineTop) / lineHeight) * 100;
                  const clampedPosition = Math.max(0, Math.min(100, relativePosition));
                  
                  // Set position and show dot at the same time to prevent flicker
                  progressDot.style.top = `${clampedPosition}%`;
                  progressDot.style.opacity = '1';
                  progressDot.style.visibility = 'visible';
                  return; // Successfully positioned, exit early
                }
              }
            }
            
            // Fallback: use percentage calculation with slight upward offset
            if (items.length > 0) {
              const totalItems = items.length;
              if (totalItems > 1) {
                const basePosition = (currentIdx / (totalItems - 1)) * 100;
                // Move up by about 2% to make it slightly higher
                const adjustedPosition = Math.max(0, basePosition - 3);
                progressDot.style.top = `${adjustedPosition}%`;
                // Show dot once positioned
                progressDot.style.opacity = '1';
                progressDot.style.visibility = 'visible';
              } else {
                progressDot.style.top = '47%'; // Slightly higher than center
                progressDot.style.opacity = '1';
                progressDot.style.visibility = 'visible';
              }
            }
          });
        });
      }
    }
    
    // Update line height and dot position after items are rendered
    // Multiple timeouts to ensure it works even if menu is collapsed/expanded
    setTimeout(updateLineHeightAndDot, 100);
    setTimeout(updateLineHeightAndDot, 300);
    setTimeout(updateLineHeightAndDot, 600);
    setTimeout(updateLineHeightAndDot, 1000);
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
      
      // Ensure menu items container is visible first (before any animations)
      if (menuItemsEl) {
        menuItemsEl.style.width = 'auto';
        menuItemsEl.style.overflow = 'visible';
        // Don't reset opacity/transform if already visible to prevent flicker
        const currentOpacity = window.getComputedStyle(menuItemsEl).opacity;
        const currentTransform = window.getComputedStyle(menuItemsEl).transform;
        if (currentOpacity !== '1' || currentTransform !== 'none' && currentTransform !== 'matrix(1, 0, 0, 1, 0, 0)') {
          menuItemsEl.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          void menuItemsEl.offsetHeight;
          menuItemsEl.style.opacity = '1';
          menuItemsEl.style.transform = 'translateX(0)';
        }
      }
      
      // Animate progress line sliding left at the same pace as menu items
      if (progressLineEl) {
        // Preserve the full height - use stored value or current calculated height
        const storedHeight = progressLineEl.dataset.fullHeight;
        const currentHeight = storedHeight || progressLineEl.style.height || getComputedStyle(progressLineEl).height;
        if (currentHeight && currentHeight !== '150px') {
          progressLineEl.style.setProperty('height', currentHeight, 'important');
          progressLineEl.style.setProperty('min-height', currentHeight, 'important');
          progressLineEl.style.height = currentHeight;
          progressLineEl.style.minHeight = currentHeight;
        }
        
        // Start line animation at the same time as first item (50ms delay)
        setTimeout(() => {
          // Only transition transform and opacity - NEVER height
          progressLineEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          // Ensure height is preserved with !important - ALWAYS maintain full height
          if (currentHeight && currentHeight !== '150px') {
            progressLineEl.style.setProperty('height', currentHeight, 'important');
            progressLineEl.style.setProperty('min-height', currentHeight, 'important');
            progressLineEl.style.height = currentHeight;
            progressLineEl.style.minHeight = currentHeight;
          }
          void progressLineEl.offsetHeight;
          progressLineEl.style.transform = 'translateX(0)';
          progressLineEl.style.opacity = '1';
        }, 50);
      }
      
      // Animate items sliding out one by one with smooth stagger
      // Only animate items that are not already visible to prevent flicker
      items.forEach((item, index) => {
        const currentOpacity = window.getComputedStyle(item).opacity;
        const currentTransform = window.getComputedStyle(item).transform;
        const isAlreadyVisible = currentOpacity === '1' && 
          (currentTransform === 'none' || currentTransform === 'matrix(1, 0, 0, 1, 0, 0)');
        
        if (!isAlreadyVisible) {
          item.style.transition = 'opacity 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
          // Start from current state, not reset to 0
          item.style.opacity = currentOpacity || '0';
          item.style.transform = currentTransform || 'translateX(20px)';
          
          setTimeout(() => {
            void item.offsetHeight;
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
          }, 50 + index * 40);
        }
      });
      
      // Remove animating class after animation completes and update dot position
      setTimeout(() => {
        menuContainer.classList.remove('animating');
        isAnimating = false;
        // Update dot position after menu expands to ensure alignment
        // Use multiple attempts to ensure it works
        if (menuContainer.updateLineHeightAndDot) {
          menuContainer.updateLineHeightAndDot();
          setTimeout(() => {
            menuContainer.updateLineHeightAndDot();
          }, 100);
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
        // Preserve the full height - use stored value or current calculated height
        const storedHeight = progressLineEl.dataset.fullHeight;
        const currentHeight = storedHeight || progressLineEl.style.height || getComputedStyle(progressLineEl).height;
        if (currentHeight && currentHeight !== '150px') {
          progressLineEl.style.setProperty('height', currentHeight, 'important');
          progressLineEl.style.setProperty('min-height', currentHeight, 'important');
          progressLineEl.style.height = currentHeight;
          progressLineEl.style.minHeight = currentHeight;
        }
        
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
          // Only transition transform and opacity - NEVER height
          progressLineEl.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)';
          // Ensure height is preserved
          if (currentHeight && currentHeight !== '150px') {
            progressLineEl.style.height = currentHeight;
            progressLineEl.style.minHeight = currentHeight;
          }
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
        // Use requestAnimationFrame to ensure smooth transition
        requestAnimationFrame(() => {
          expandMenu();
        });
      } else if (menuContainer.classList.contains('collapsed') && !isAnimating) {
        // Menu is already collapsed, expand it
        requestAnimationFrame(() => {
          expandMenu();
        });
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

