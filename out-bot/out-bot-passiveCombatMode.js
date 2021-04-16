// ==UserScript==
// @name         GW out-bot-fightResult
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.1
// @description  try to take over the world!
// @author       You
// @match        https://www.gwars.ru/warlog.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const minTimer = 1000;
    const maxTimer = 2000;

    const finaleTable = document.getElementById("finaltable");//таблица с результатом

    if (finaleTable) {
        window.setTimeout(function () {
            window.location.replace("https://www.gwars.ru/walk.op.php");
        }, randomInteger(minTimer, maxTimer));
    }

    //гереация рандомного числа для отработки таймера ходов
    function randomInteger(min, max) {
        // получить случайное число от (min-0.5) до (max+0.5)
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
    };
})();