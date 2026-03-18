// ==UserScript==
// @name         The Power To Say NO
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.youtube.com/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    var output
    let buttons = [];
    let buttons_old = [];
    const UPDATE = true;

    function isHomepage() {
        var url = window.location.href;
        console.log("URL: " + url);
        if(url.search("watch") == -1){return true}
        else{return false}
    }


    //Is Adding The New Buttons to All found Videos
    var addButtons = function(buttons) {

        //Script being inserted in the buttons
        var DOMScript2 = " \
            console.log('before script'); \
            setTimeout(getUninterested,10); \
            function getUninterested() { \
            let buttons = document.querySelectorAll('ytd-menu-service-item-renderer.style-scope.ytd-menu-popup-renderer'); \
            let not_interested = buttons[4]; \
            console.log('that worked'); \
            not_interested.click(); \}"

        buttons_old = buttons;

        //Adding the buttons to each video
        for(let i = 0; i < buttons.length; i++) {
            var div = document.createElement("div");
            div.id = i;
            div.classList.add("new_NotInterested");
            div.classList.add("yt-icon.ytd-menu-service-item-renderer");
            div.innerHTML =
            '<button style="border: none; background-color: Transparent; margin-top: 12px; height: 16px; width: 16px;" onclick="' +
            DOMScript2 + '">' +
            '<img style="height: inherit; width: inherit;" src="https://www.paulbrownpaintings.com/wp-content/themes/paulsbrown/images/icon-close.png" alt="Not Interested"> \
                </button>';
            if(buttons[i].childNodes.length < 4) {
                buttons[i].insertBefore(div, buttons[i].firstChild);
            }
        }
    }


    //Is trying to fetch all Video-Content Blocks from Homepage
    var getContent = function () {
        buttons = document.querySelectorAll('yt-icon-button.dropdown-trigger.style-scope.ytd-menu-renderer');
        //var menu_div = document.querySelectorAll('div#flexible-item-buttons.style-scope.ytd-menu-renderer');

        //CALL to add new Buttons
        setTimeout(addButtons(buttons),500);

    }

  //Gets called as soon as Dropdown is unfolded
    var getUninterested = function() {
      let buttons = document.querySelectorAll('ytd-menu-service-item-renderer.style-scope.ytd-menu-popup-renderer');
      let not_interested = buttons[4]
      return not_interested;
  }


    //Is checking if youtube has finished loading by checking for the video length tags
    function pollDOM () {
      const el = document.querySelectorAll('span#text.style-scope.ytd-thumbnail-overlay-time-status-renderer');

      if (el.length) {
           console.log("Starting Script");
           setTimeout(getContent,500);
     } else {
      setTimeout(pollDOM, 500);
    }
  }



    function repeat() {
        if(isHomepage()){
            buttons = document.querySelectorAll('yt-icon-button.dropdown-trigger.style-scope.ytd-menu-renderer')
            if(buttons.length > buttons_old.length || buttons.length == 0){
                pollDOM();
            }
         }
        else{buttons = []}
        setTimeout(repeat, 5000);
    }



  window.addEventListener('load', function () {

          if(UPDATE) {
              repeat();
          }
          else{
              pollDOM();
          }
 })



})();