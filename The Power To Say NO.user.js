// ==UserScript==
// @name         The Power to Say NO v1.6
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Enhanced functionality for YouTube "Not Interested" button and feedback form handling.
// @author       SmokeyRGB
// @match        https://www.youtube.com/*
// @icon         https://www.youtube.com/s/desktop/3205cbb0/img/logos/favicon.ico
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Observe the video grid for changes
    function observeVideoGrid() {
        const observer = new MutationObserver(() => {
            addCustomButtons();
        });

        const targetNode = document.querySelector('ytd-rich-grid-renderer'); // Main video grid
        if (targetNode) {
            observer.observe(targetNode, {
                childList: true,
                subtree: true,
            });
            console.log('Observer attached to video grid.');
        } else {
            console.warn('Video grid not found. Retrying...');
            setTimeout(observeVideoGrid, 1000);
        }
    }

    // Add custom "Not Interested" buttons
    function addCustomButtons() {
        const videoCards = document.querySelectorAll('ytd-rich-item-renderer'); // Each video card

        if (videoCards.length === 0) {
            console.warn('Video cards not found. Retrying...');
            setTimeout(addCustomButtons, 1000);
            return;
        }
        else {
            console.log('Video cards found. Number of cards:', videoCards.length);
        }

        videoCards.forEach((card) => {
            if (!card.querySelector('.custom-not-interested')) {
                // Create the custom "✖" button
                const button = document.createElement('button');
                button.textContent = '❌';
                button.title = 'Not Interested';
                button.style = `
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
                    width: 48px;
                    height: 48px;
                    font-size: 23px;
                    font-weight: bold;
                    cursor: pointer;
                    opacity: 0.1;
                    transition: opacity 0.3s, transform 0.2s;
                    z-index: 10;
                `;
                button.classList.add('custom-not-interested');

                // Add hover effect
                button.addEventListener('mouseenter', () => {
                    button.style.opacity = '1';
                    button.style.transform = 'scale(1.4)';
                });
                button.addEventListener('mouseleave', () => {
                    button.style.opacity = '0.1';
                    button.style.transform = 'scale(1)';
                });

                // Add click event to trigger "Not Interested"
                button.addEventListener('click', () => {
                    let menuButton = card.querySelector('button.yt-spec-button-shape-next.yt-spec-button-shape-next--text.yt-spec-button-shape-next--mono.yt-spec-button-shape-next--size-m.yt-spec-button-shape-next--icon-button');
                    if (!menuButton) {menuButton = card.querySelector('button#button'); console.log("Found menu-button with second option");}

                    if (menuButton) {
                        menuButton.click(); // Open the menu
                        console.log("Menu Clicked");
                        setTimeout(() => {
                            let menuItems = document.querySelectorAll('yt-list-item-view-model');

                            if (menuItems.length === 0) {menuItems = document.querySelectorAll('tp-yt-paper-item'); console.log("Found menu-items with second option");}
                            else {console.log("Found menu-items with first option");}

                            const notInterestedItem = Array.from(menuItems).find((item) =>
                                item.textContent.includes('Kein Interesse') // Match the text for "Not Interested"
                            );


                            if (notInterestedItem) {
                                notInterestedItem.click(); // Click "Not Interested"
                                console.log('"Not Interested" clicked.');

                                button.hidden = true; // Hide the button after clicking

                                // Handle Feedback Button
                                handleFeedbackButton(card);
                            } else {
                                console.warn('"Not Interested" option not found.');
                            }
                        }, 50); // Delay to ensure menu items are loaded
                    }
                    else {
                        console.warn('Menu button not found.');
                    }


                });

                // Append the button to the top-right corner of the video card
                const dismissible = card.querySelector('#content');
                if (dismissible) {
                    dismissible.style.position = 'relative'; // Ensure relative positioning for absolute child
                    dismissible.appendChild(button);
                    console.log('Custom "Not Interested" button added.');
                }
                else {
                    console.warn('Dismissible element not found.');
                }
            }
        });
    }

// Handle Feedback "Senden" Button
    function handleFeedbackButton(card) {
        setTimeout(() => {
            const buttonContainer = document.querySelector('div#buttons');
            if (!buttonContainer) {
                console.warn('Button container not found.');
                return; // Exit early if the button container is not found
            }

            // Select the second button specifically within the container
            let feedbackButton = document.querySelector('#buttons button[aria-label="Feedback senden"]');
            let backButton = document.querySelector('#buttons button[aria-label="Rückgängig"]');

            if (feedbackButton) {
                feedbackButton.addEventListener('click', () => {
                    console.log('Feedback Button Clicked');
                    setTimeout(() => moveFeedbackForm(card), 50); // Add timeout to wait for the form
                });
            }
            else {
                console.warn('Feedback button not found.');
            }

            if (backButton) {
                backButton.addEventListener('click', () => {
                    console.log('Back Button Clicked');
                    card.querySelector('.custom-not-interested').hidden = false;
                });
            }
            else {
                console.warn('Back button not found.');
            }
        }, 50); // Wait for the feedback button to appear
    }

    function moveFeedbackForm(card) {
    const feedbackForm = document.querySelector('ytd-dismissal-follow-up-renderer');

    // Select all dismissible containers
    const dismissedContents = document.querySelectorAll('div#dismissed-content ytd-notification-multi-action-renderer');

    // Check if the backdrop exists
    const overlay = document.querySelector('tp-yt-iron-overlay-backdrop');

    // Find the correct dismissed content with "Video entfernt"
    let targetDismissedContent = null;

    if (dismissedContents) {
        dismissedContents.forEach((content) => {
            // Adjusted selector for the text container
            const span = content.querySelector('span[id="text"]');
            if (span && span.textContent.trim() === 'Video entfernt') {
                targetDismissedContent = content;
            }
        });

        if (!targetDismissedContent) {
            console.warn('Correct dismissed content not found.');
        }
    } else {
        console.warn('Dismissed contents not found.');
    }
    if (!feedbackForm) {
        console.warn('Feedback form not found.');
    }

    // Remove the overlay
    if (overlay) {
        overlay.remove();
        console.log('Overlay removed.');
    }

    if (feedbackForm && targetDismissedContent) {
        // Clear the existing content of the targetDismissedContent
        while (targetDismissedContent.firstChild) {
            targetDismissedContent.removeChild(targetDismissedContent.firstChild);
        }

        // Append the feedback form to the correct #dismissed-content
        targetDismissedContent.appendChild(feedbackForm);
        feedbackForm.style.position = 'relative'; // Ensure proper positioning
        console.log('Feedback form moved to the correct dismissed content.');

        const sendButton = feedbackForm.querySelector('button[aria-label="Senden"]');
        const cancelButton = feedbackForm.querySelector('button[aria-label="Abbrechen"]');
        feedbackForm.style.backgroundColor = "transparent";
        sendButton.hidden = true;
        cancelButton.hidden = true;

        // Automatically click the "Send" button when a checkbox is interacted with
        const checkboxes = feedbackForm.querySelectorAll('ytd-dismissal-reason-text-renderer');
        checkboxes.forEach((checkboxContainer) => {
            checkboxContainer.addEventListener('click', () => {
                setTimeout(() => {

                    if (sendButton && !sendButton.disabled) {
                        sendButton.click();
                        console.log('Feedback sent automatically.');
                        card.transform = 'scale(1.2)';
                        card.hidden = true;
                    }
                }, 100); // Add a slight delay to allow YouTube's internal state to update
            });
        });

        // Observe the feedback form for disappearance
        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.removedNodes.length > 0 && [...mutation.removedNodes].includes(feedbackForm)) {
                    console.log('Feedback form successfully submitted and removed.');
                    observer.disconnect();
                }
            }
        });

        observer.observe(targetDismissedContent, { childList: true });
    } else {
        console.warn('Feedback form or correct dismissed content not found.');
    }
}


    // Initialize the script
    window.addEventListener('load', () => {
        observeVideoGrid();
    });
})();