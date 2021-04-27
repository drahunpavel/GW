// ==UserScript==
// @name         GW out-bot-collectingLoot
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.2
// @description  try to take over the world!
// @author       https://github.com/drahunpavel
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-collectingLoot.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-collectingLoot.js
// @match        https://www.gwars.ru/walk.op.php*
// @match        https://www.gwars.ru/walk.p.php*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const lootName1 = 'Гриб';
    const lootName2 = 'Вяленая рыба';
    const lootName3 = 'Фляга с водой';

    function pickUpLoot() {
        const takeButton = document.getElementById("takebutt"); //кнопка "Взять"
        const lootDescription = document.getElementsByClassName('wb')[5];
        const loot = lootDescription.querySelectorAll('td > b')[1].innerText;

        if (takeButton && loot) {
            if (loot === lootName2 || loot === lootName3) {
                takeButton.click();
            };
        };
    };
})();