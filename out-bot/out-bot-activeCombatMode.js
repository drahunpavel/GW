// ==UserScript==
// @name         GW out-bot-activeCombatMode
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.1
// @description  try to take over the world!
// @author       You
// @match        https://www.gwars.ru/b0*
// @grant        none
// ==/UserScript==

/*
---1.1.1
реализованы автоходы, без навыков
---
*/

(function () {
    'use strict';

    const minTimer = 2000;
    const maxTimer = 3000;

    const grenade = document.getElementById("bagaboom"); //чекбокс "бросить гранату"
    const comeUp = document.getElementById("walk"); //чекбокс "подоходить всегда"
    const selectedOppenent = document.getElementById('euids'); //выбор противника

    if (selectedOppenent) {
        const generalActiveSkill = document.getElementById("apmid");
        const specialActiveSkill = document.getElementById("apsid");
        const greenbuttonTags = document.getElementsByClassName('greenbutton'); //все кнопки нпса

        const tbody = document.querySelectorAll('table > tbody');
        const battleModeComponents = tbody[4].querySelectorAll('tr');
        const battleMode = battleModeComponents[1];
        const teamLeft = battleMode.children[0]; //команда игрока
        const battleСontrol = battleMode.children[1]; //панель управления

        const sendMoveButton = battleСontrol.getElementsByTagName('table') && battleСontrol.getElementsByClassName('wb') && battleСontrol.getElementsByTagName('a');

        //если есть кнопка сделать ход, кликаю по ней
        if (sendMoveButton.length) {
            window.setTimeout(function () {
                sendMoveButton[0].click();
            }, randomInteger(minTimer, maxTimer));
        };

        //гереация рандомного числа для отработки таймера ходов
        function randomInteger(min, max) {
            // получить случайное число от (min-0.5) до (max+0.5)
            let rand = min - 0.5 + Math.random() * (max - min + 1);
            return Math.round(rand);
        };
    };
})();