// ==UserScript==
// @name         [GW] BacklightPoks
// @namespace
// @version      1.1
// @description  try to take over the world!
// @author       clark666
// @match        https://www.gwars.ru/walk.op.php*
// @match        https://www.gwars.ru/walk.p.php*
// @match        https://www.gwars.ru/walk.ep.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const elements = document.getElementsByClassName('floatdiv');

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].innerText.length != 0) {
            const newString = elements[i].innerText.split(',');

            elements[i].style.fontSize = '15px';
            elements[i].style.opacity = '1';
            elements[i].style.fontWeight = "bold";

            if (elements[i].innerText[0] === '1') {
                elements[i].style.color = 'green';
            }
            if (newString[0] === '2' || newString[0] === '>=2') {
                elements[i].style.color = '#ff821f';
            }
            if (newString[0] === '3' || newString[0] === '>=3') {
                elements[i].style.color = 'red';
            }
        }
    }
})();