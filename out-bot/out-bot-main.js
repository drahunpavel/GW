// ==UserScript==
// @name         GW out-bot-main
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.16
// @description  try to take over the world!
// @author       https://github.com/drahunpavel
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-main.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-main.js
// @match        https://www.gwars.ru/walk.op.php*
// @match        https://www.gwars.ru/walk.p.php*
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
1.1.15
Реализовано перемещение персонажа в рамках "хороших секторо"
И возраст из "плохих секторов
---
1.1.16
пофишены updateURL, downloadURL
*/

(function () {
    'use strict';

    const timerMinMove = 1000;
    const timerMaxMove = 3000;

    const badSectors = ['South Normand', 'Alpha Three'];

    const body = document.getElementsByClassName('txt');
    const sectorName = body[1].querySelectorAll('td > nobr > b')[0].innerText;
    console.log('--sectorName', sectorName)
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
            //Проверяю, подходит ли сектр в список плохих секторов
            const resIsBadSectors = badSectors.some(item => item === sectorName);

            //если "хороший" сектор, работаем в прежнем режиме
            if (!resIsBadSectors) {
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
                    //если есть кнопка для покемона и это не "плохой сектор"
                    if (activeCell && !resIsBadSectors) {
                        activeCell.click();
                        console.log('--получил клетку, нажимаю не ее')
                    } else {
                        console.log('--видимо уже в заявке или что-то пошло не так, обновлю страницу', currentDirection)
                        document.location.reload();
                    };
                    return;
                };
            } else {
                const direction = sessionStorage.getItem('direction');
                if (direction === 'top') {
                    sessionStorage.setItem('direction', "bottom");
                    arrowObj["bottom"].click();
                    return;
                } else if (direction === 'bottom') {
                    sessionStorage.setItem('direction', "top");
                    arrowObj["top"].click();
                    return;
                } else if (direction === 'left') {
                    sessionStorage.setItem('direction', "right");
                    arrowObj["right"].click();
                    return;
                } else if (direction === 'right') {
                    //костыль для одного места
                    if (sectorName === 'Alpha Three') {
                        sessionStorage.setItem('direction', "right");
                        arrowObj["right"].click();
                        return;
                    };
                    sessionStorage.setItem('direction', "left");
                    arrowObj["left"].click();
                    return;
                } else {
                    console.log('Непонятный маршрут в плохом сектор, я заблудился')
                }
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