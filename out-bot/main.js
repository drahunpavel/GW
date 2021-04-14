// ==UserScript==
// @name         GW out bot
// @namespace    http://tampermonkey.net/
// @version      1.1.3
// @description  try to take over the world!
// @author       You
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @require      https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/test.js
// @match        https://www.gwars.ru/walk.op.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const walk_table = document.getElementById('walk_table');
    const walkTableTrArr = walk_table.querySelectorAll('table > tbody > tr > td > table > tbody > tr');
    console.log('walkTableTrArr', walkTableTrArr)
})();