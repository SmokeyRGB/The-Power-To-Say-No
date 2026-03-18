// ==UserScript==
// @name         The Power to Say NO v4.0
// @namespace    http://violentmonkey.net/
// @version      4.0
// @description  Enhanced YouTube "Not Interested" functionality with improved stability and multi-language support
// @author       SmokeyRGB
// @match        https://www.youtube.com/*
// @icon         https://www.youtube.com/s/desktop/3205cbb0/img/logos/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';
 
    // Configuration
    const CONFIG = {
        BUTTON_EMOJI: '❌',
        BUTTON_SIZE: '48px',
        BUTTON_FONT_SIZE: '23px',
        WAIT_TIMEOUT: 5000, // Maximum wait time for elements
        POLL_INTERVAL: 50, // Polling interval for element detection
        DEBUG: false, // Set to true for verbose logging
    };
 
    // Adaptive timing system
    const ADAPTIVE_TIMING = {
        // Default timings (medium speed)
        feedbackButtonDelay: 300,
        dialogWaitDelay: 100,
        autoClickDelay: 100,
        
        // Initialize adaptive timing based on connection and performance
        init: function() {
            const profile = this.detectSpeedProfile();
            log.info(`Speed profile detected: ${profile}`);
            this.applyProfile(profile);
        },
        
        // Detect speed profile based on connection and performance
        detectSpeedProfile: function() {
            let score = 0;
            
            // Check Network Information API (if available)
            if ('connection' in navigator) {
                const conn = navigator.connection;
                
                // Effective connection type
                if (conn.effectiveType) {
                    const typeScores = {
                        'slow-2g': -2,
                        '2g': -1,
                        '3g': 0,
                        '4g': 1
                    };
                    score += typeScores[conn.effectiveType] || 0;
                    log.info(`Connection type: ${conn.effectiveType} (score: ${typeScores[conn.effectiveType] || 0})`);
                }
                
                // Downlink speed (Mbps)
                if (conn.downlink !== undefined) {
                    if (conn.downlink > 10) score += 2; // Very fast
                    else if (conn.downlink > 5) score += 1; // Fast
                    else if (conn.downlink < 1) score -= 1; // Slow
                    log.info(`Downlink speed: ${conn.downlink} Mbps`);
                }
                
                // RTT (Round Trip Time) - lower is better
                if (conn.rtt !== undefined) {
                    if (conn.rtt < 100) score += 1; // Low latency
                    else if (conn.rtt > 300) score -= 1; // High latency
                    log.info(`RTT: ${conn.rtt}ms`);
                }
            }
            
            // Check device memory (if available)
            if ('deviceMemory' in navigator) {
                const memory = navigator.deviceMemory;
                if (memory >= 8) score += 1; // High-end device
                else if (memory <= 2) score -= 1; // Low-end device
                log.info(`Device memory: ${memory}GB`);
            }
            
            // Check hardware concurrency (CPU cores)
            if ('hardwareConcurrency' in navigator) {
                const cores = navigator.hardwareConcurrency;
                if (cores >= 8) score += 1; // High-end CPU
                else if (cores <= 2) score -= 1; // Low-end CPU
                log.info(`CPU cores: ${cores}`);
            }
            
            // Determine profile based on score
            if (score >= 3) return 'fast';
            if (score <= -2) return 'slow';
            return 'medium';
        },
        
        // Apply timing profile
        applyProfile: function(profile) {
            const profiles = {
                fast: {
                    feedbackButtonDelay: 150,  // 0.15s
                    dialogWaitDelay: 30,       // 0.03s
                    autoClickDelay: 30,        // 0.03s
                },
                medium: {
                    feedbackButtonDelay: 200,  // 0.2s
                    dialogWaitDelay: 50,      // 0.05s
                    autoClickDelay: 50,       // 0.05s
                },
                slow: {
                    feedbackButtonDelay: 500,  // 0.5s
                    dialogWaitDelay: 200,      // 0.2s
                    autoClickDelay: 150,       // 0.15s
                }
            };
            
            const selectedProfile = profiles[profile];
            Object.assign(this, selectedProfile);
            
            log.info('Adaptive timing applied:', selectedProfile);
        },
        
        // Dynamically adjust based on success/failure
        adjustOnFailure: function() {
            // If operations are failing, slow down
            this.feedbackButtonDelay = Math.min(this.feedbackButtonDelay * 1.2, 800);
            this.dialogWaitDelay = Math.min(this.dialogWaitDelay * 1.2, 300);
            log.warn('Timing adjusted slower due to failures');
        },
        
        adjustOnSuccess: function() {
            // If operations are succeeding, we can try speeding up slightly
            this.feedbackButtonDelay = Math.max(this.feedbackButtonDelay * 0.95, 150);
            this.dialogWaitDelay = Math.max(this.dialogWaitDelay * 0.95, 50);
            log.info('Timing optimized based on success');
        }
    };
    
    // Initialize adaptive timing
    ADAPTIVE_TIMING.init();
 
    // Utility: Enhanced logging
    const log = {
        info: (...args) => CONFIG.DEBUG && console.log('[NotInterested]', ...args),
        warn: (...args) => console.warn('[NotInterested]', ...args),
        error: (...args) => console.error('[NotInterested]', ...args),
    };
 
    // Utility: Wait for element with timeout
    function waitForElement(selector, parent = document, timeout = CONFIG.WAIT_TIMEOUT) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            
            const check = () => {
                const element = typeof selector === 'function' 
                    ? selector(parent) 
                    : parent.querySelector(selector);
                
                if (element) {
                    resolve(element);
                } else if (Date.now() - startTime > timeout) {
                    reject(new Error(`Timeout waiting for element: ${selector}`));
                } else {
                    setTimeout(check, CONFIG.POLL_INTERVAL);
                }
            };
            
            check();
        });
    }
 
    // Utility: Try multiple selectors
    function querySelector(selectors, parent = document) {
        const selectorArray = Array.isArray(selectors) ? selectors : [selectors];
        for (const selector of selectorArray) {
            const element = parent.querySelector(selector);
            if (element) {
                log.info('Found element with selector:', selector);
                return element;
            }
        }
        return null;
    }
 
    // Utility: Find element by text content (language-independent for common patterns)
    function findByTextPattern(elements, patterns) {
        const patternArray = Array.isArray(patterns) ? patterns : [patterns];
        return Array.from(elements).find(element => {
            const text = element.textContent.trim().toLowerCase();
            return patternArray.some(pattern => {
                if (pattern instanceof RegExp) {
                    return pattern.test(text);
                }
                return text.includes(pattern.toLowerCase());
            });
        });
    }
 
    // Get menu button with multiple fallback selectors
    function getMenuButton(card) {
        const selectors = [
            'button.yt-spec-button-shape-next--icon-button',
            'button#button.yt-icon-button',
            'ytd-menu-renderer button',
            'yt-icon-button button',
            '#menu button[aria-label]',
        ];
        return querySelector(selectors, card);
    }
 
    // Find "Not Interested" menu item with multiple strategies
    function findNotInterestedItem() {
        // CRITICAL: Only look in the currently visible popup menu
        // Try multiple selectors for the visible popup
        const popup = document.querySelector('tp-yt-iron-dropdown:not([aria-hidden="true"]) yt-sheet-view-model') ||
                      document.querySelector('tp-yt-iron-dropdown yt-sheet-view-model') ||
                      document.querySelector('ytd-menu-popup-renderer') ||
                      document.querySelector('yt-contextual-sheet-layout');
        
        if (!popup) {
            log.warn('No visible popup menu found');
            return null;
        }
        
        log.info('Found popup menu');
 
        // Strategy 1: Try new menu structure (yt-list-item-view-model)
        let menuItems = popup.querySelectorAll('yt-list-item-view-model');
        
        // Strategy 2: Try legacy structure (tp-yt-paper-item)
        if (menuItems.length === 0) {
            menuItems = popup.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer');
            log.info('Using legacy menu structure');
        }
 
        if (menuItems.length === 0) {
            log.warn('No menu items found in popup');
            return null;
        }
 
        log.info(`Found ${menuItems.length} menu items in visible popup`);
 
        // Try to find by common text patterns (multi-language)
        // Common patterns: "Not interested", "Kein Interesse", "Pas intéressé", etc.
        const notInterestedPatterns = [
            /not\s+interest/i,
            /kein\s+interesse/i,
            /pas\s+intéressé/i,
            /no\s+me\s+interesa/i,
            /non\s+mi\s+interessa/i,
            /興味なし/i, // Japanese
            /不感兴趣/i, // Chinese
        ];
 
        let item = findByTextPattern(menuItems, notInterestedPatterns);
        
        if (item) {
            log.info('Found Not Interested by text pattern');
            return item;
        }
 
        // Fallback: Find by SVG icon pattern
        // "Not Interested" has a specific circle-with-slash icon
        for (let i = 0; i < menuItems.length; i++) {
            const svg = menuItems[i].querySelector('svg');
            if (svg) {
                const pathData = svg.querySelector('path')?.getAttribute('d') || '';
                // This is the unique path for the "Not Interested" icon (circle with diagonal slash)
                // The pattern includes "8.246 12.605" or "3.754 8.393" which are unique to this icon
                if (pathData.includes('8.246 12.605') || pathData.includes('3.754 8.393')) {
                    log.info(`Found Not Interested by SVG icon pattern (index ${i})`);
                    return menuItems[i];
                }
            }
        }
 
        // Last resort: positional fallback
        // Based on the HTML, "Kein Interesse" is typically the 7th item (index 6)
        // Structure: Playlist, Watch Later, Add to Playlist, Download, Share, Not Interested, Don't Recommend, Report
        if (menuItems.length >= 7) {
            log.info('Using positional fallback for Not Interested (index 6)');
            return menuItems[6];
        }
 
        log.warn('Could not find Not Interested item');
        return null;
    }
 
    // Find feedback submit button
    function findFeedbackButton() {
        const patterns = [
            /send/i,
            /senden/i,
            /envoyer/i,
            /enviar/i,
            /inviare/i,
            /送信/i,
        ];
 
        const buttons = document.querySelectorAll('#buttons button[aria-label], ytd-button-renderer button');
        return findByTextPattern(buttons, patterns);
    }
 
    // Find undo/back button
    function findUndoButton() {
        const patterns = [
            /undo/i,
            /rückgängig/i,
            /annuler/i,
            /deshacer/i,
            /annulla/i,
            /元に戻す/i,
        ];
 
        const buttons = document.querySelectorAll('#buttons button[aria-label], ytd-button-renderer button');
        return findByTextPattern(buttons, patterns);
    }
 
    // Add custom "Not Interested" button to video card
    function addCustomButton(card) {
        // Check if button already exists
        if (card.querySelector('.custom-not-interested')) {
            return;
        }
        
        // Skip if card is already dismissed
        if (card.getAttribute('is-dismissed') === 'true' || card.style.display === 'none') {
            return;
        }
 
        const button = document.createElement('button');
        button.textContent = CONFIG.BUTTON_EMOJI;
        button.title = 'Not Interested';
        button.className = 'custom-not-interested';
        
        button.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            top: 4em;
            left: 45%;
            background-color: #000;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: ${CONFIG.BUTTON_SIZE};
            height: ${CONFIG.BUTTON_SIZE};
            font-size: ${CONFIG.BUTTON_FONT_SIZE};
            font-weight: bold;
            cursor: pointer;
            opacity: 0.1;
            transition: opacity 0.3s, transform 0.2s;
            z-index: 10;
        `;
 
        // Hover effects
        button.addEventListener('mouseenter', () => {
            button.style.opacity = '1';
            button.style.transform = 'scale(1.4)';
        });
 
        button.addEventListener('mouseleave', () => {
            button.style.opacity = '0.1';
            button.style.transform = 'scale(1)';
        });
 
        // Click handler
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleNotInterestedClick(card, button);
        });
 
        // Find container and append button
        const containers = [
            '#content',
            '#dismissible',
            'ytd-thumbnail',
        ];
        
        const container = querySelector(containers, card);
        if (container) {
            container.style.position = 'relative';
            container.appendChild(button);
            log.info('Custom button added to card');
        } else {
            log.warn('Could not find container for button');
        }
    }
 
    // Handle "Not Interested" click
    async function handleNotInterestedClick(card, button) {
        // Prevent multiple simultaneous clicks
        if (handleNotInterestedClick.isProcessing) {
            log.warn('Already processing a click, ignoring...');
            return;
        }
        
        handleNotInterestedClick.isProcessing = true;
        
        try {
            log.info('Not Interested clicked');
 
            // Close any existing open menus first
            const existingPopups = document.querySelectorAll('tp-yt-iron-dropdown');
            existingPopups.forEach(popup => {
                // Click outside or press Escape to close
                if (popup.querySelector('yt-sheet-view-model')) {
                    document.body.click(); // Click outside to close menus
                }
            });
            
            // Wait a moment for menus to close
            await new Promise(resolve => setTimeout(resolve, 150));
 
            // Step 1: Click menu button
            const menuButton = getMenuButton(card);
            if (!menuButton) {
                throw new Error('Menu button not found');
            }
 
            menuButton.click();
            log.info('Menu opened');
 
            // Step 2: Wait for the menu popup to become visible
            // The menu structure is: tp-yt-iron-dropdown > yt-sheet-view-model
            await waitForElement(
                () => {
                    const popup = document.querySelector('tp-yt-iron-dropdown yt-sheet-view-model') ||
                                  document.querySelector('ytd-menu-popup-renderer') ||
                                  document.querySelector('yt-contextual-sheet-layout');
                    return popup;
                },
                document,
                2000
            );
            
            // Small delay to ensure menu is fully rendered
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Step 3: Find and click "Not Interested"
            const notInterestedItem = findNotInterestedItem();
            if (!notInterestedItem) {
                throw new Error('Not Interested menu item not found');
            }
 
            notInterestedItem.click();
            log.info('Not Interested clicked');
 
            // Hide the custom button
            button.style.display = 'none';
 
            // Step 4: Handle feedback form
            await handleFeedbackFlow(card);
 
        } catch (error) {
            log.error('Error in handleNotInterestedClick:', error);
            // Restore button visibility on error
            button.style.opacity = '0.1';
            button.style.display = 'flex';
        } finally {
            // ALWAYS release the lock after a short delay, even on error
            setTimeout(() => {
                handleNotInterestedClick.isProcessing = false;
                log.info('Click processing lock released');
            }, 500);
        }
    }
 
    // Handle feedback form flow
    async function handleFeedbackFlow(card) {
        try {
            // Wait for the notification area with buttons to appear
            await waitForElement(
                () => card.querySelector('notification-multi-action-renderer'),
                card,
                2000
            );
 
            log.info('Dismissed notification found');
 
            // Find the feedback button (the filled button)
            const buttons = card.querySelectorAll('notification-multi-action-renderer button');
            let feedbackButton = null;
            let undoButton = null;
 
            buttons.forEach(button => {
                const text = button.textContent.toLowerCase();
                if (text.includes('feedback') || text.includes('senden')) {
                    feedbackButton = button;
                } else if (text.includes('undo') || text.includes('rückgängig')) {
                    undoButton = button;
                }
            });
 
            if (undoButton) {
                undoButton.addEventListener('click', () => {
                    log.info('Undo clicked');
                    const customButton = card.querySelector('.custom-not-interested');
                    if (customButton) {
                        customButton.style.display = 'flex';
                    }
                }, { once: true }); // Only fire once
            }
 
            if (feedbackButton) {
                // Set up the click handler first
                feedbackButton.addEventListener('click', async (e) => {
                    log.info('Feedback button clicked - intercepting to move form');
                    
                    // Use adaptive timing based on connection speed
                    await new Promise(resolve => setTimeout(resolve, ADAPTIVE_TIMING.feedbackButtonDelay));
                    
                    // Now move it to the card
                    const success = await moveFeedbackFormToCard(card);
                    
                    // If moving failed, just let YouTube handle it normally
                    if (!success) {
                        log.warn('Could not move feedback form, letting YouTube handle it');
                        ADAPTIVE_TIMING.adjustOnFailure(); // Slow down for next time
                        // Re-show the dialog if it was hidden
                        const dialog = document.querySelector('tp-yt-paper-dialog');
                        if (dialog) dialog.style.display = '';
                        const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
                        if (backdrop) backdrop.style.display = '';
                    } else {
                        ADAPTIVE_TIMING.adjustOnSuccess(); // Speed up for next time
                    }
                }, { once: true }); // Only fire once
                
                // Automatically click the feedback button to streamline the flow
                log.info('Auto-clicking feedback button');
                setTimeout(() => {
                    feedbackButton.click();
                }, ADAPTIVE_TIMING.autoClickDelay); // Use adaptive timing
            }
 
        } catch (error) {
            log.warn('Feedback flow error:', error);
        }
    }
 
    // Move feedback form from popup dialog to card location
    async function moveFeedbackFormToCard(card) {
        try {
            // Give YouTube a moment to create the dialog (adaptive timing)
            await new Promise(resolve => setTimeout(resolve, ADAPTIVE_TIMING.dialogWaitDelay));
            
            // Look for the feedback renderer - it might be in a dialog or already rendered
            let feedbackRenderer = document.querySelector('tp-yt-paper-dialog ytd-dismissal-follow-up-renderer') ||
                                   document.querySelector('ytd-dismissal-follow-up-renderer');
            
            // If not found immediately, wait for it
            if (!feedbackRenderer) {
                log.info('Waiting for feedback dialog...');
                try {
                    feedbackRenderer = await waitForElement(
                        () => document.querySelector('tp-yt-paper-dialog ytd-dismissal-follow-up-renderer') ||
                              document.querySelector('ytd-dismissal-follow-up-renderer'),
                        document,
                        2000
                    );
                } catch (error) {
                    log.warn('Feedback dialog did not appear within timeout');
                    return false;
                }
            }
 
            log.info('Feedback renderer found');
 
            // Check if it's already populated
            let checkboxes = feedbackRenderer.querySelectorAll('tp-yt-paper-checkbox');
            
            if (checkboxes.length > 0) {
                log.info(`Dialog populated with ${checkboxes.length} checkboxes`);
            } else {
                log.info('Dialog not yet populated, waiting for content...');
                
                // Wait for the dialog to be FULLY POPULATED with checkboxes
                try {
                    feedbackRenderer = await waitForElement(
                        () => {
                            const renderer = document.querySelector('tp-yt-paper-dialog ytd-dismissal-follow-up-renderer');
                            if (!renderer) return null;
                            
                            const boxes = renderer.querySelectorAll('tp-yt-paper-checkbox');
                            
                            if (boxes.length > 0) {
                                log.info(`Dialog now populated with ${boxes.length} checkboxes`);
                                return renderer;
                            }
                            return null;
                        },
                        document,
                        3000
                    );
                } catch (error) {
                    log.warn('Feedback dialog did not populate within timeout');
                    return false;
                }
            }
 
            log.info('Feedback renderer is ready');
 
            // Find the notification area in the card where we'll place the form
            const notificationArea = card.querySelector('notification-multi-action-renderer');
            
            if (!notificationArea) {
                log.warn('Notification area not found in card');
                return false;
            }
 
            // Store reference to the original parent so we can restore it later
            const originalParent = feedbackRenderer.parentElement;
            
            // Hide the backdrop overlay if present
            const backdrop = document.querySelector('tp-yt-iron-overlay-backdrop');
            if (backdrop) {
                backdrop.style.display = 'none';
                log.info('Backdrop hidden');
            }
 
            // Hide the dialog container
            const dialog = document.querySelector('tp-yt-paper-dialog');
            if (dialog) {
                dialog.style.display = 'none';
                log.info('Dialog hidden');
            }
 
            // Clear the notification area
            while (notificationArea.firstChild) {
                notificationArea.removeChild(notificationArea.firstChild);
            }
            
            // MOVE (not clone) the actual feedback renderer to the card
            notificationArea.appendChild(feedbackRenderer);
            feedbackRenderer.style.cssText = 'background: transparent; padding: 16px;';
 
            log.info('Feedback form moved to card');
 
            // Setup auto-submit on checkbox click
            setupAutoSubmitWithRestore(feedbackRenderer, card, originalParent, dialog, backdrop);
            
            return true;
 
        } catch (error) {
            log.error('Error moving feedback form to card:', error);
            return false;
        }
    }
 
    // Setup auto-submit when feedback checkbox is clicked, with element restoration
    function setupAutoSubmitWithRestore(feedbackForm, card, originalParent, dialog, backdrop) {
        // Find the buttons container
        const buttonsContainer = feedbackForm.querySelector('#buttons');
        
        log.info('Looking for send button...');
        
        // Find the submit button with multiple strategies
        let sendButton = null;
        
        // Strategy 1: Look in #submit ytd-button-renderer
        const submitRenderer = feedbackForm.querySelector('#submit, ytd-button-renderer#submit');
        if (submitRenderer) {
            sendButton = submitRenderer.querySelector('button') || 
                        submitRenderer.querySelector('yt-button-shape button');
            if (sendButton) log.info('Found send button via #submit renderer');
        }
        
        // Strategy 2: Find by aria-label
        if (!sendButton) {
            sendButton = feedbackForm.querySelector('button[aria-label*="enden"]') ||
                        feedbackForm.querySelector('button[aria-label*="end"]') ||
                        feedbackForm.querySelector('button[aria-label*="ubmit"]');
            if (sendButton) log.info('Found send button via aria-label');
        }
        
        // Strategy 3: Look for the filled button (call-to-action style)
        if (!sendButton) {
            sendButton = feedbackForm.querySelector('button.yt-spec-button-shape-next--call-to-action') ||
                        feedbackForm.querySelector('button.yt-spec-button-shape-next--filled');
            if (sendButton) log.info('Found send button via filled button style');
        }
        
        // Strategy 4: Get all buttons and find the last one (usually "Send")
        if (!sendButton) {
            const allButtons = feedbackForm.querySelectorAll('button');
            if (allButtons.length >= 2) {
                sendButton = allButtons[allButtons.length - 1];
                log.info('Found send button via position (last button)');
            }
        }
        
        if (!sendButton) {
            log.error('Could not find send button!');
        } else {
            log.info('Send button found successfully');
        }
 
        // Completely hide the buttons container
        if (buttonsContainer) {
            buttonsContainer.style.display = 'none';
            log.info('Buttons container hidden');
        }
 
        // Find all checkboxes
        const checkboxes = feedbackForm.querySelectorAll('tp-yt-paper-checkbox, ytd-dismissal-reason-text-renderer');
 
        log.info(`Found ${checkboxes.length} feedback checkboxes`);
 
        // Track if we've already submitted
        let submitted = false;
 
        checkboxes.forEach((checkbox) => {
            checkbox.addEventListener('click', () => {
                if (submitted) {
                    log.info('Already submitted, ignoring click');
                    return;
                }
                
                log.info('Checkbox clicked in moved form');
                
                setTimeout(() => {
                    if (sendButton && !sendButton.disabled) {
                        log.info('Auto-submitting feedback');
                        submitted = true;
                        sendButton.click();
                        
                        // After submission, restore the form to original dialog
                        setTimeout(() => {
                            if (originalParent && document.body.contains(originalParent)) {
                                originalParent.appendChild(feedbackForm);
                                log.info('Feedback form restored to dialog');
                            }
                            
                            // Mark and hide the card permanently
                            if (document.body.contains(card)) {
                                // Mark as dismissed so YouTube knows not to show it
                                card.setAttribute('is-dismissed', 'true');
                                card.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                                card.style.opacity = '0';
                                card.style.transform = 'scale(0.9)';
                                
                                setTimeout(() => {
                                    if (document.body.contains(card)) {
                                        // Set display none and height 0 to remove space
                                        card.style.display = 'none';
                                        card.style.height = '0';
                                        card.style.overflow = 'hidden';
                                        card.style.margin = '0';
                                        card.style.padding = '0';
                                        
                                        // Also try to actually remove it
                                        try {
                                            card.remove();
                                            log.info('Card removed from DOM');
                                        } catch (e) {
                                            log.warn('Could not remove card, but it is hidden:', e);
                                        }
                                    }
                                }, 400);
                            }
                        }, 200);
                    } else {
                        log.warn('Send button not ready');
                    }
                }, 100);
            });
        });
    }
 
    // Add buttons to all video cards
    function addCustomButtons() {
        const videoCards = document.querySelectorAll(
            'ytd-rich-item-renderer, ytd-grid-video-renderer, ytd-video-renderer'
        );
 
        if (videoCards.length === 0) {
            log.warn('No video cards found');
            return;
        }
 
        log.info(`Found ${videoCards.length} video cards`);
        videoCards.forEach(addCustomButton);
    }
 
    // Observe video grid for changes
    function observeVideoGrid() {
        // Try multiple possible grid containers
        const gridSelectors = [
            'ytd-rich-grid-renderer',
            'ytd-two-column-browse-results-renderer',
            '#contents',
            'ytd-browse',
        ];
 
        const targetNode = querySelector(gridSelectors);
 
        if (!targetNode) {
            log.warn('Video grid not found, retrying...');
            setTimeout(observeVideoGrid, 1000);
            return;
        }
 
        // Initial button addition
        addCustomButtons();
 
        // Observe for new video cards
        const observer = new MutationObserver((mutations) => {
            // Debounce to avoid excessive calls
            clearTimeout(observeVideoGrid.timeout);
            observeVideoGrid.timeout = setTimeout(() => {
                addCustomButtons();
            }, 200);
        });
 
        observer.observe(targetNode, {
            childList: true,
            subtree: true,
        });
 
        log.info('Observer attached to video grid');
    }
 
    // Initialize script
    function init() {
        log.info('Initializing...');
        
        // Wait for page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', observeVideoGrid);
        } else {
            observeVideoGrid();
        }
 
        // Also observe on navigation changes (YouTube SPA)
        let lastUrl = location.href;
        new MutationObserver(() => {
            const currentUrl = location.href;
            if (currentUrl !== lastUrl) {
                lastUrl = currentUrl;
                log.info('URL changed, reinitializing...');
                setTimeout(observeVideoGrid, 500);
            }
        }).observe(document.body, { childList: true, subtree: true });
    }
 
    // Start
    init();
})();