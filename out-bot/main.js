// ==UserScript==
// @name         GW out bot
// @namespace    http://tampermonkey.net/
// @version      1.1.6-4
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
    var walkActiveCellsArr = []; //все активные клетки вокруг покемонов
    var allBotsArr = [];

    //получаю массив ботов с точками
    Array.from(walkTableTrArr).filter((item, index) => {
        const imgArr_1 = item.querySelectorAll('tr > td > a > img');
        const imgArr_2 = item.querySelectorAll('tr > td > img');

        getAllBotsAndActiveCells(imgArr_1, imgArr_2);
    });

    var uniqBotsArray = unique(allBotsArr);
    var unicActiveCallsArray = unique(walkActiveCellsArr);
    var actualActiveCalls = bindСellsToBots(uniqBotsArray, unicActiveCallsArray);

    console.log('--actualActiveCalls', actualActiveCalls);

    function bindСellsToBots(botsArr, cellsArr) {
        var resActiveCalls = [];
        botsArr.filter(item => {
            var strSplitArr = item.getAttribute("id").split('_');
            var params_1 = strSplitArr[1];
            var params_2 = strSplitArr[2];

            cellsArr.filter(item => {
                if (item.getAttribute("id").indexOf(params_1) > 0 || item.getAttribute("id").indexOf(params_2) > 0) {
                    resActiveCalls.push(item);
                };
            })
        })
        var uniqActiveCalls = unique(resActiveCalls);
        return uniqActiveCalls;
    };

    function getAllBotsAndActiveCells(nodeList1, nodeList2) {
        Array.from(nodeList2).filter((itemImg, index) => {

            if (itemImg.getAttribute("src") === 'https://images.gwars.ru/q-new/bot100.gif') {
                allBotsArr.push(itemImg)
            };

            if (itemImg.getAttribute("src") === 'https://images.gwars.ru/q-new/t_a.gif') {
                walkActiveCellsArr.push(itemImg);
            };
        });
        Array.from(nodeList1).filter((itemImg, index) => {
            if (itemImg.getAttribute("src") === 'https://images.gwars.ru/q-new/bot100.gif') {
                allBotsArr.push(itemImg)
            };

            if (itemImg.getAttribute("src") === 'https://images.gwars.ru/q-new/t_a.gif') {
                walkActiveCellsArr.push(itemImg);
            };
        });
    };

    //оставляет в массиве лишь уникальные значения
    function unique(arr) {
        let result = [];
        for (let str of arr) {
            if (!result.includes(str)) {
                result.push(str);
            }
        }
        return result;
    };
})();