// ==UserScript==
// @name         GW out bot
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.8
// @description  try to take over the world!
// @author       You
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @require      https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/test.js
// @match        https://www.gwars.ru/walk.op.php*
// @grant        none
// ==/UserScript==

/*
1.1.8
Подготовка к реализации перемещения по ауту
*/

(function () {
    'use strict';

    const timerMinMove = 1000;
    const timerMaxMove = 3000;

    const walk_table = document.getElementById('walk_table');
    const walkTableTrArr = walk_table.querySelectorAll('table > tbody > tr > td > table > tbody > tr');
    var walkActiveCellsArr = []; //все активные клетки вокруг покемонов
    var allBotsArr = [];

    //Кнопки направления движения
    var arrowTopBotton = null;
    var arrowBottomBotton = null;
    var arrowLeftBotton = null;
    var arrowRightBotton = null;


    //получаю массив ботов с точками
    Array.from(walkTableTrArr).filter((item, index) => {
        const imgArr_1 = item.querySelectorAll('tr > td > a > img');
        const imgArr_2 = item.querySelectorAll('tr > td > img');
        const imgArr_3 = item.querySelectorAll('tr > td > a');

        getAllBotsAndActiveCells(imgArr_1, imgArr_2);
        getDirectionButtons(imgArr_3);
    });

    var uniqBotsArray = unique(allBotsArr);
    var unicActiveCellsArray = unique(walkActiveCellsArr);
    var actualActiveCells = bindСellsToBots(uniqBotsArray, unicActiveCellsArray);

    //передвижения по ауту
    moveOut(uniqBotsArray, actualActiveCells, arrowLeftBotton, arrowRightBotton, arrowTopBotton, arrowBottomBotton);

    function moveOut(bots, activeCells, arrowLeft, arrowRight, arrowTop, arrowBottom) {
        console.log('--move', bots, activeCells, arrowLeft, arrowRight, arrowTop, arrowBottom);

        window.setTimeout(function () {
            console.log('--temir')
            arrowLeft.click();
        }, randomInteger(timerMinMove, timerMaxMove));
    };

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

    function getDirectionButtons(nodeList) {
        Array.from(nodeList).filter((itemImg, index) => {
            if (itemImg.getElementsByTagName('img')[0].getAttribute("src") === 'https://images.gwars.ru/i/arrow_top.png') {
                arrowTopBotton = itemImg;
            }
            if (itemImg.getElementsByTagName('img')[0].getAttribute("src") === 'https://images.gwars.ru/i/arrow_bottom.png') {
                arrowBottomBotton = itemImg;
            }
            if (itemImg.getElementsByTagName('img')[0].getAttribute("src") === 'https://images.gwars.ru/i/arrow_left.png') {
                arrowLeftBotton = itemImg;
            }
            if (itemImg.getElementsByTagName('img')[0].getAttribute("src") === 'https://images.gwars.ru/i/arrow_right.png') {
                arrowRightBotton = itemImg;
            }
        });
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

    //гереация рандомного числа для отработки таймера ходов
    function randomInteger(min, max) {
        // получить случайное число от (min-0.5) до (max+0.5)
        let rand = min - 0.5 + Math.random() * (max - min + 1);
        return Math.round(rand);
    };

})();