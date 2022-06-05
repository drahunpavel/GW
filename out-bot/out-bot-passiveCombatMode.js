// ==UserScript==
// @name         GW out-bot-passiveCombatMode
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.5
// @description  try to take over the world!
// @author       https://github.com/drahunpavel
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-passiveCombatMode.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-passiveCombatMode.js
// @match        https://www.gwars.io/b0*
// @grant        none
// ==/UserScript==

/*
---1.1.2

*/

(function () {
    'use strict';

    const minTimer = 800;
    const maxTimer = 1500;

    const selectedOppenent = document.getElementById('euids'); //выбор противника

    if (!selectedOppenent) {
        window.setTimeout(function () {
            document.location.reload();
        }, randomInteger(minTimer, maxTimer));
    };

    //гереация рандомного числа для отработки таймера ходов
    function randomInteger(min, max) {
        // получить случайное число от (min-0.5) до (max+0.5)
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
    };
})();