// ==UserScript==
// @name         GW out bot
// @namespace    http://tampermonkey.net/
// @version      1.1.1
// @description  try to take over the world!
// @author       You
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @match        https://www.gwars.ru/walk.op.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const walk_table = document.getElementById('walk_table');
    console.log('walk_table', walk_table)
})();