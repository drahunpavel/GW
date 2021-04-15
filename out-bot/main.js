// ==UserScript==
// @name         GW out bot
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.10
// @description  try to take over the world!
// @author       You
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/main.js
// @require      https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/activeCombatMode.js
// @match        https://www.gwars.ru/walk.op.php*
// @grant        none
// ==/UserScript==

/*
1.1.8
Подготовка к реализации перемещения по ауту
---
1.1.9
Реализовано перемещение по ауту
---
1.1.10
Реализовано перемещение по ауту и вход в заявку
---
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

    //массив с актуальным стрелками
    var arrowObj = { top: arrowTopBotton, bottom: arrowBottomBotton, left: arrowLeftBotton, right: arrowRightBotton };

    //передвижения по ауту
    moveOut(uniqBotsArray, actualActiveCells, arrowLeftBotton, arrowRightBotton, arrowTopBotton, arrowBottomBotton, arrowObj);

    function moveOut(bots, activeCells, arrowLeft, arrowRight, arrowTop, arrowBottom, arrowObj) {
        console.log('--move', arrowObj);
        //const arrowArr = [arrowLeft, arrowRight, arrowTop, arrowBottom];
        const direction = sessionStorage.getItem('direction');
        var currentDirection;
        if (!direction) {
            sessionStorage.setItem('direction', 'top');
            document.location.reload();
            return;
        };

        //получаем направление из хранилища
        if (direction) {
            //если это направление не акутально
            //выбираем актуальные направление, перезаписываем в хранилище, делаем ход
            if (!arrowObj[direction]) {
                var tempArr = [];
                for (var variable in arrowObj) {
                    if (arrowObj[variable]) {
                        tempArr.push(variable);
                    };
                };
                var tempItem = tempArr[Math.floor(Math.random() * tempArr.length)];
                sessionStorage.setItem('direction', tempItem);
                currentDirection = arrowObj[tempItem];
                document.location.reload();
                return;
            } else {
                currentDirection = arrowObj[direction];
            };
        };

        window.setTimeout(function () {

            //если нет активных клеток рядом с поками, начинается движение
            if (!actualActiveCells.length) {
                if (currentDirection) {
                    currentDirection.click();
                } else {
                    console.log('--что-то пошло не так, обновлю страницу')
                    document.location.reload();
                };
                return;
            } else {
                //получаю рандомную клетку из списка активных клеток
                var activeCell = actualActiveCells[Math.floor(Math.random() * actualActiveCells.length)];
                if (activeCell) {
                    activeCell.click();
                    console.log('--получил клетку, нажимаю не ее')
                } else {
                    console.log('--видимо уже в заявке или что-то пошло не так, обновлю страницу')
                    document.location.reload();
                };
                return;
            };


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