// ==UserScript==
// @name         YouTube Notification Wall
// @namespace    http://violentmonkey.github.io/
// @version      0.1
// @description  Removes the notification count from the YouTube title
// @author       SmokeyRGB
// @match        https://www.youtube.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=youtube.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    (new MutationObserver(check)).observe(document, {childList: true, subtree: true});

    function check(changes, observer) {
        if(document.querySelector('.ytSpecIconBadgeShapeBadge')) {
            //observer.disconnect();

        // Get the current website title
        const currentTitle = document.title;

        //console.log("YouTube Notification Wall - Title: " + currentTitle);

        // Use a regular expression to find and capture the pattern at the beginning of the title
        const match = currentTitle.match(/^\(\d+\)(.+)/);

        if (match) {
            console.log("YouTube Notification Wall - Found pattern: " + match[0]);
            // Extract the captured part of the title (excluding the pattern)
            const newTitle = match[1];

            // Set the website title to the extracted title
            document.title = newTitle;
}
        }
    }

})();