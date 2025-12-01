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
    requestAnimationFrame(() => menuContainer.updateLineHeightAndDot());
setTimeout(() => menuContainer.updateLineHeightAndDot(), 200);


    // Initial positioning (frame 1)
requestAnimationFrame(() => {
  menuContainer.updateLineHeightAndDot();
});

// Frame 2 (after layout settles)
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    menuContainer.updateLineHeightAndDot();
  });
});

// Extra safety for pages with heavy JS layout shifts (parallel/morph)
setTimeout(() => menuContainer.updateLineHeightAndDot(), 300);
setTimeout(() => menuContainer.updateLineHeightAndDot(), 800);


    requestAnimationFrame(() => {
      menuContainer.updateLineHeightAndDot();
    });
    setTimeout(() => {
      menuContainer.updateLineHeightAndDot();
    }, 50);
    
    
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
    // if (progressLine && menuItemsList) {
    //   // Disable transitions FIRST to prevent any animation
    //   progressLine.style.transition = 'none';
      
    //   // Ensure items are fully visible and laid out
    //   menuItemsList.style.opacity = '1';
    //   menuItemsList.style.transform = 'translateX(0)';
    //   menuItemsList.style.width = 'auto';
    //   menuItemsList.style.overflow = 'visible';
    //   menuItemsList.style.pointerEvents = 'auto';
      
    //   // Force reflow to ensure layout is calculated
    //   void menuItemsList.offsetHeight;
      
    //   // Calculate height immediately in one synchronous operation
    //   let itemsHeight = menuItemsList.offsetHeight;
      
    //   // If height is still 0 or too small, calculate from individual items
    //   if (itemsHeight <= 0 || itemsHeight < 100) {
    //     let totalHeight = 0;
    //     items.forEach((item) => {
    //       const itemRect = item.getBoundingClientRect();
    //       totalHeight += itemRect.height;
    //     });
    //     // Add gap between items (6px per gap, n-1 gaps for n items)
    //     const gap = 6;
    //     totalHeight += (items.length - 1) * gap;
    //     if (totalHeight > 0) {
    //       itemsHeight = totalHeight;
    //     }
    //   }
      
    //   // Set height IMMEDIATELY to calculated value - all in one operation
    //   // This ensures the line is always at full size from the very first render
    //   if (itemsHeight > 0) {
    //     // Set height with !important to override any CSS
    //     progressLine.style.setProperty('height', `${itemsHeight}px`, 'important');
    //     progressLine.style.setProperty('min-height', `${itemsHeight}px`, 'important');
    //     // Also set it as a regular style property
    //     progressLine.style.height = `${itemsHeight}px`;
    //     progressLine.style.minHeight = `${itemsHeight}px`;
    //     // Force multiple reflows to ensure it's applied before paint
    //     void progressLine.offsetHeight;
    //     void progressLine.offsetWidth;
    //     void progressLine.offsetHeight;
    //     // Store the height so we can reference it later
    //     progressLine.dataset.fullHeight = `${itemsHeight}px`;
    //   }
      
    //   progressLine.style.transform = 'translateX(0)';
    //   progressLine.style.opacity = '1';
    //   progressLine.style.transition = 'none'; // No transition on initial load
      
    //   // Re-enable transition after a delay to prevent glitches
    //   setTimeout(() => {
    //     progressLine.style.transition = '';
    //   }, 300);
    // }
    
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
    // setTimeout(updateLineHeightAndDot, 100);
    // setTimeout(updateLineHeightAndDot, 300);
    // setTimeout(updateLineHeightAndDot, 600);
    // setTimeout(updateLineHeightAndDot, 1000);
    // window.addEventListener('resize', updateLineHeightAndDot);
    window.addEventListener('load', () => {
  menuContainer.updateLineHeightAndDot();
});

    
    // Store update function for use when menu expands
    // menuContainer.updateLineHeightAndDot = updateLineHeightAndDot;
    // Disable all dynamic height calculations
// menuContainer.updateLineHeightAndDot = function () {};
// Keep static height but allow dot placement
// Correct dot positioning (keeps static 150px height)
menuContainer.updateLineHeightAndDot = function () {
  const active = menuContainer.querySelector('.nav-menu-item.active');
  const dot = menuContainer.querySelector('.nav-progress-dot');
  const line = menuContainer.querySelector('.nav-progress-line');

  if (!active || !dot || !line) return;

  const link = active.querySelector('a');
  const rect = link.getBoundingClientRect();
  const lineRect = line.getBoundingClientRect();

  // vertical center of active item
  const linkCenterY = rect.top + rect.height / 2;
  const relative = ((linkCenterY - lineRect.top) / lineRect.height) * 100;

  dot.style.top = `${relative}%`;
  dot.style.opacity = '1';
  dot.style.visibility = 'visible';
};


    
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
      
      // Calculate timing: line slides in first, then text appears
      const lineSlideDuration = 1000; // 1s for line to slide smoothly
      const textFadeDuration = 600; // 0.6s for text to fade in
      const textStaggerDelay = 50; // Small stagger between items
      const textStartDelay = lineSlideDuration * 0.3; // Start text animation partway through line slide
      
      // Ensure menu items container is visible first (before any animations)
      if (menuItemsEl) {
        // Reset width override and ensure it's auto
        menuItemsEl.style.width = 'auto';
        menuItemsEl.style.removeProperty('width');
        menuItemsEl.style.setProperty('width', 'auto', 'important');
        menuItemsEl.style.overflow = 'visible';
        menuItemsEl.style.pointerEvents = 'auto';
        // Don't reset opacity/transform if already visible to prevent flicker
        const currentOpacity = window.getComputedStyle(menuItemsEl).opacity;
        const currentTransform = window.getComputedStyle(menuItemsEl).transform;
        if (currentOpacity !== '1' || currentTransform !== 'none' && currentTransform !== 'matrix(1, 0, 0, 1, 0, 0)') {
          menuItemsEl.style.transition = `opacity ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), transform ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
          void menuItemsEl.offsetHeight;
          menuItemsEl.style.opacity = '1';
          menuItemsEl.style.transform = 'translateX(0)';
        }
      }
      
      // Animate progress line sliding left first - slower and smoother
      if (progressLineEl) {
        // Preserve the full height - use stored value or current calculated height
        const storedHeight = progressLineEl.dataset.fullHeight;
        const currentHeight = storedHeight || progressLineEl.style.height || getComputedStyle(progressLineEl).height;
        if (currentHeight && currentHeight !== '150px') {
          // progressLineEl.style.setProperty('height', currentHeight, 'important');
          // progressLineEl.style.setProperty('min-height', currentHeight, 'important');
          // progressLineEl.style.height = currentHeight;
          // progressLineEl.style.minHeight = currentHeight;
        }
        
        // Start line animation first
        setTimeout(() => {
          // Use slower, smoother easing for line slide
          progressLineEl.style.transition = `transform ${lineSlideDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${lineSlideDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
          // Ensure height is preserved with !important - ALWAYS maintain full height
          if (currentHeight && currentHeight !== '150px') {
            // progressLineEl.style.setProperty('height', currentHeight, 'important');
            // progressLineEl.style.setProperty('min-height', currentHeight, 'important');
            // progressLineEl.style.height = currentHeight;
            // progressLineEl.style.minHeight = currentHeight;
          }
          void progressLineEl.offsetHeight;
          progressLineEl.style.transform = 'translateX(0)';
          progressLineEl.style.opacity = '1';
        }, 50);
      }
      
      // Animate items (text) sliding out one by one AFTER line starts moving - slower and smoother
      // Only animate items that are not already visible to prevent flicker
      items.forEach((item, index) => {
        const currentOpacity = window.getComputedStyle(item).opacity;
        const currentTransform = window.getComputedStyle(item).transform;
        const isAlreadyVisible = currentOpacity === '1' && 
          (currentTransform === 'none' || currentTransform === 'matrix(1, 0, 0, 1, 0, 0)');
        
        if (!isAlreadyVisible) {
          // Use slower, smoother easing for text fade
          item.style.transition = `opacity ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), transform ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
          // Start from current state, not reset to 0
          item.style.opacity = currentOpacity || '0';
          item.style.transform = currentTransform || 'translateX(20px)';
          
          setTimeout(() => {
            void item.offsetHeight;
            item.style.opacity = '1';
            item.style.transform = 'translateX(0)';
          }, textStartDelay + index * textStaggerDelay);
        }
      });
      
      // Remove animating class after animation completes and update dot position
      const totalAnimationTime = textStartDelay + items.length * textStaggerDelay + textFadeDuration;
      setTimeout(() => {
        menuContainer.classList.remove('animating');
        isAnimating = false;
      
        // Update dot position after menu expands to ensure alignment
        if (menuContainer.updateLineHeightAndDot) {
          menuContainer.updateLineHeightAndDot();
      
          // Frame 2 fix
          setTimeout(() => {
            menuContainer.updateLineHeightAndDot();
          }, 100);
      
          // Frame 3 fix (for heavy pages like parallel.html & morph.html)
          setTimeout(() => {
            menuContainer.updateLineHeightAndDot();
          }, 300);   // <<<<< ADD THIS RIGHT HERE
        }
      }, totalAnimationTime + 50);
      
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
      
      // Calculate timing: text disappears first, then line slides
      const textFadeDuration = 600; // 0.6s for text to fade out
      const textStaggerDelay = 50; // Small stagger between items
      const lineSlideDuration = 1000; // 1s for line to slide smoothly
      const lineSlideDelay = textFadeDuration + 100; // Start line animation after text is gone
      
      // Animate items (text) disappearing first - slower and smoother
      items.forEach((item, index) => {
        const reverseIndex = items.length - 1 - index;
        // Use slower, smoother easing for text fade
        item.style.transition = `opacity ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), transform ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        
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
        }, reverseIndex * textStaggerDelay);
      });
      
      // Animate menu items container - only fade opacity, don't collapse width yet (to keep line in place)
      if (menuItemsEl) {
        // Only animate opacity during text fade - don't change width or transform yet
        menuItemsEl.style.transition = `opacity ${textFadeDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
        // Start opacity fade with text
        setTimeout(() => {
          if (!isHovering) {
            void menuItemsEl.offsetHeight;
            menuItemsEl.style.opacity = '0';
            // Don't change width or transform yet - keep line in place
          }
        }, 0);
      }
      
      // Animate progress line sliding right AFTER text has disappeared - slower and smoother
      if (progressLineEl) {
        // Preserve the full height - use stored value or current calculated height
        const storedHeight = progressLineEl.dataset.fullHeight;
        const currentHeight = storedHeight || progressLineEl.style.height || getComputedStyle(progressLineEl).height;
        if (currentHeight && currentHeight !== '150px') {
          // progressLineEl.style.setProperty('height', currentHeight, 'important');
          // progressLineEl.style.setProperty('min-height', currentHeight, 'important');
          // progressLineEl.style.height = currentHeight;
          // progressLineEl.style.minHeight = currentHeight;
        }
        
        // Calculate distance to move line to right edge of screen with padding
        // Navigation menu is at right: 40px, so we need to move by:
        // menu items width + gap (12px) + (40px - rightPadding) to leave padding from edge
        let distanceToRightEdge = 0;
        const rightPadding = 20; // Padding from right edge of screen
        if (menuItemsEl) {
          // Get the actual width of the menu items container before it fades
          const menuItemsRect = menuItemsEl.getBoundingClientRect();
          const menuItemsWidth = menuItemsRect.width;
          const gap = 12; // CSS gap between line and menu items
          const menuRightOffset = 40; // Navigation menu is positioned at right: 40px
          // Move to right edge minus padding
          distanceToRightEdge = menuItemsWidth + gap + (menuRightOffset - rightPadding);
        } else {
          // Fallback if menu items container not found
          distanceToRightEdge = 180; // Approximate fallback (200 - 20 padding)
        }
        
        // Start line animation AFTER text has finished disappearing
        setTimeout(() => {
          // Check if user hovered - cancel collapse if so
          if (isHovering) {
            isAnimating = false;
            menuContainer.classList.remove('animating');
            expandMenu();
            return;
          }
          // Use slower, smoother easing for line slide
          progressLineEl.style.transition = `transform ${lineSlideDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${lineSlideDuration}ms cubic-bezier(0.25, 0.1, 0.25, 1)`;
          // Ensure height is preserved
          if (currentHeight && currentHeight !== '150px') {
            // progressLineEl.style.height = currentHeight;
            // progressLineEl.style.minHeight = currentHeight;
          }
          void progressLineEl.offsetHeight;
          // Move line to right edge of screen
          progressLineEl.style.transform = `translateX(${distanceToRightEdge}px)`;
          progressLineEl.style.opacity = '0.8';
        }, lineSlideDelay);
      }
      
      // Wait for both text fade and line slide to complete
      const totalAnimationTime = lineSlideDelay + lineSlideDuration;
      setTimeout(() => {
        // Check if user hovered during collapse - if so, don't mark as collapsed
        if (!isHovering) {
          // Don't collapse width - keep it to maintain line position
          // Override CSS collapsed state width: 0 to keep line in place
          if (menuItemsEl) {
            menuItemsEl.style.opacity = '0';
            menuItemsEl.style.pointerEvents = 'none';
            menuItemsEl.style.overflow = 'hidden';
            // Override CSS width: 0 to keep line position stable
            menuItemsEl.style.width = 'auto';
            menuItemsEl.style.setProperty('width', 'auto', 'important');
          }
          if (progressLineEl) {
            // Calculate final position (same as during animation)
            let distanceToRightEdge = 0;
            const rightPadding = 20; // Padding from right edge of screen
            if (menuItemsEl) {
              // Get stored width or calculate
              const menuItemsRect = menuItemsEl.getBoundingClientRect();
              const menuItemsWidth = menuItemsRect.width || 0;
              const gap = 12;
              const menuRightOffset = 40;
              // Move to right edge minus padding
              distanceToRightEdge = menuItemsWidth + gap + (menuRightOffset - rightPadding);
            } else {
              distanceToRightEdge = 180; // Fallback (200 - 20 padding)
            }
            progressLineEl.style.transform = `translateX(${distanceToRightEdge}px)`;
            progressLineEl.style.opacity = '0.8';
          }
          // Small delay to ensure styles are applied before class change
          requestAnimationFrame(() => {
            menuContainer.classList.add('collapsed');
            menuContainer.classList.remove('animating');
            isAnimating = false;
          });
        } else {
          // User hovered, cancel collapse and expand
          isAnimating = false;
          menuContainer.classList.remove('animating');
          expandMenu();
        }
      }, totalAnimationTime + 50);
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

