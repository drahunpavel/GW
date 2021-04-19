// ==UserScript==
// @name         GW out-bot-activeCombatMode
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.2
// @description  try to take over the world!
// @author       https://github.com/drahunpavel
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-activeCombatMode.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-activeCombatMode.js
// @match        https://www.gwars.ru/b0*
// @grant        none
// ==/UserScript==

/*
---1.1.1
реализованы автоходы, без навыков
---1.1.2
Доработано получание и использование навыков персонажа
---
*/

(function () {
    'use strict';

    const minTimer = 2000;
    const maxTimer = 3000;

    const minHPforFinishing = 200;

    const grenade = document.getElementById("bagaboom"); //чекбокс "бросить гранату"
    const comeUp = document.getElementById("walk"); //чекбокс "подоходить всегда"
    const selectedOppenent = document.getElementById('euids'); //выбор противника
    const nickname = 'clark666';

    if (selectedOppenent) {
        const generalActiveSkill = document.getElementById("apmid");
        const specialActiveSkill = document.getElementById("apsid");

        const nameGeneralSkill = getSkillName('apmid'); // название общего навыка
        const nameSpecialSkill = getSkillName('apsid'); //название навыка под оружие

        const tbody = document.querySelectorAll('table > tbody');
        const battleModeComponents = tbody[4].querySelectorAll('tr');
        const battleMode = battleModeComponents[1];
        const teamLeft = battleMode.children[0]; //команда игрока
        const teamRight = battleMode.children[2]; //команда противников
        const battleСontrol = battleMode.children[1]; //панель управления

        const botName = getNickBotName(selectedOppenent.querySelectorAll('select > option')[0].innerText); //никнейм выбранного противника
        const userName = nickname; //никнейм персонажа
        const botItem = getInformationAboutParticipantOfBattle(teamRight, botName); // полная информация о персонаже
        const userItem = getInformationAboutParticipantOfBattle(teamLeft, userName); //полная информация о выбранной цели

        const greenbuttonTags = document.getElementsByClassName('greenbutton'); //все кнопки нпса
        const generalNPCskill = greenbuttonTags[0]; //общий навык нпс, в моем случае - медик
        const specialNPCskill = greenbuttonTags[1]; //навык на оружие, в моем случае ава

        const sendMoveButton = battleСontrol.getElementsByTagName('table') && battleСontrol.getElementsByClassName('wb') && battleСontrol.getElementsByTagName('a');

        //если есть кнопка сделать ход, кликаю по ней
        if (sendMoveButton.length) {
            enableSpecialActiveSkillUser(userItem, botItem, nameGeneralSkill, nameSpecialSkill);
            window.setTimeout(function () {
                sendMoveButton[0].click();
            }, randomInteger(minTimer, maxTimer));
        };

        function enableSpecialActiveSkillUser(userItem, botItem, nameGeneralSkill, nameSpecialSkill) {
            switch (nameSpecialSkill) {
                case 'Авиаудар':
                case 'Попутный ветер':
                case 'Выстрел правши':
                    var allBotHPItem = botItem[0].innerText.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g);
                    var allHParr = allBotHPItem[0].split('/');
                    var actualBotHP = allHParr[0];
                    var allBotHP = allHParr[1];
                    if (+actualBotHP < minHPforFinishing) {
                        console.log('--Включаем навык на оружие: Добивание хп')
                        specialActiveSkill.checked = true;

                        if (specialNPCskill && specialNPCskill.querySelectorAll('a > img')[0].title === 'Авиаудар') {
                            specialNPCskill.click();
                        };
                    };
            };
            switch (nameGeneralSkill) {
                case 'Перевязка':
                    var allUserHPItem = userItem[0].innerText.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g);
                    var allHPUserArr = allUserHPItem[0].split('/');
                    var actualUserHP = allHPUserArr[0];
                    var allUserHP = allHPUserArr[1];
                    if (+actualUserHP / +allUserHP < 0.7) {
                        console.log('--Включаем общий навык: Восстановление здоровья')
                        generalActiveSkill.checked = true;

                        if (generalNPCskill && generalNPCskill.querySelectorAll('a > img')[0].title === 'Медик') {
                            generalNPCskill.click();
                        };
                    };
            };
        };

        function getInformationAboutParticipantOfBattle(team, nickName) {
            const items = team.querySelectorAll('td > div');
            const res = Array.from(items).filter((item, index) => {
                return item.getElementsByTagName('b')[0].innerText.includes(nickName);
            });
            if (!res.length) {
                return null
            } else {
                return res;
            };
        };

        function getNickBotName(str) {
            let arr = str.split(' ');
            return arr[1];
        };

        function getSkillName(idTitle) {
            const allLabels = document.getElementsByTagName('label'); //все label

            //находит название активного навыка
            for (var i = 0; i < allLabels.length; i++) {
                if (allLabels[i].htmlFor === idTitle) {
                    return allLabels[i].innerText;
                };
                if (allLabels[i].htmlFor === idTitle) {
                    return allLabels[i].innerText;
                };
            };
        };

        //гереация рандомного числа для отработки таймера ходов
        function randomInteger(min, max) {
            // получить случайное число от (min-0.5) до (max+0.5)
            let rand = min - 0.5 + Math.random() * (max - min + 1);
            return Math.round(rand);
        };
    };
})();