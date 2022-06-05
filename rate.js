// ==UserScript==
// @name         Conquering the rating
// @namespace    http://tampermonkey.net/
// @version      1.3.6
// @description  try to take over the world!
// @author       You
// @match        https://www.gwars.ru/wargroup.php*
// @match        https://www.gwars.ru/b0*
// @match        https://www.gwars.ru/warlog.php*
// @match        https://www.gwars.ru/warlock.php*
// @match        https://www.gwars.ru/items.php*
// @grant        none
// ==/UserScript==


/*
---1.1
основной функционал
---1.2
добавлена рассылка в телеграмм-бот
---1.3
Добавлены счетчики в sissionStorage
Добавлен счетчие на отхил
Добавлен счетчик ходов + сон
---1.3.4
Небольшое обновление
---1.3.5
Добавлен функционал по автопоеданию нужного лута (в моем случае стимпы бессмертия и караси)
---1.3.6
Доработка для дробов:
активный навык длиинные руки работает после броска гранаты
если есть кто-то на 0, то убивается ноль, если никого нет - бросается граната
не спит
кушает всегда фул грибы


- поправить работу ХП в бою
- понимать, когда закончились гранаты
*/

(function () {
    'use strict';

    //console.log('Im here', window.location)
    const minTimer = 2000;
    const maxTimer = 5000;

    /*
         0 - быстрый режим: персонаж ходит в максимальное кол-во заявок, умирает после 5го хода, быстро восстанавливает хп
         1 - медленный режим: персонаж старается попасть на начальные места в заявке, живет весь бой
    */
    const combatMode = 0;
    console.log('--combatMode', combatMode)
    const countOfMoves = +checkSessionStorage('countOfMoves'); //количество ходов  влоге боя
    const countOfUpdates = +checkSessionStorage('countOfUpdates'); //количество обновлений страницы, пока мало хп

    //const activeTemporarySkill = 'Авиаудар' || 'Выстрел правши' || 'Длинные руки';
    const activeTemporarySkill = 'Авиаудар';

    const isShotgun = false;
    const isCombatExperience = true;
    //-----------------------------------------------------------------------------Действия выполняются на роуте wargroup
    if (window.location.search === '?war=armed') {
        counterForSessionStorage('countOfUpdates');
        clearSessionStorage('countOfMoves');

        const timerEnterReload = randomInteger(5000, 5500);
        window.setTimeout(function () {
            document.location.reload();
        }, timerEnterReload);

        const panelfloat = document.getElementsByClassName('panelfloat');
        const notEnoughHPInfo = panelfloat[2]; //блок с информацией, что недостаточно ХП

        //если появился блок с информацией о ХП и этот блок больше 1го обновления
        //значит делаем переход в вооружение персонажа
        if (notEnoughHPInfo && countOfUpdates > 0 && combatMode === 0) {
            //редирект на рюкзак
            const timerRedirectBackpack = randomInteger(minTimer, maxTimer);
            console.log('--Редирект в рюкзак', timerRedirectBackpack);
            window.setTimeout(function () {
                window.location.replace("https://www.gwars.ru/items.php?nid=2315762");
            }, timerRedirectBackpack);
            return;
        };

        const wargroup_list_div = document.getElementById('wargroup_list_div'); //общий компонент списка боев
        let list_of_wargroup_node = wargroup_list_div.querySelectorAll('div > table > tbody > tr');
        let activeApplicationsArr = []; //массив активных заявок"

        Array.prototype.map.call(list_of_wargroup_node, enterTheBunker);

        function enterTheBunker(item) {
            //если item.querySelectorAll('tr > td')[1] === undefined
            //значит активных заявок нет
            if (item.querySelectorAll('tr > td')[1]) {
                let str = item.querySelectorAll('tr > td')[1].innerText;
                const resZLands = /бункер Z-Lands/i.test(str);

                //если есть активные заявки на бункеры
                if (resZLands) {
                    const applicationList = item.querySelectorAll('tr > td')[4].getElementsByTagName('a');
                    //сама кнопка вступить, если она есть, то производим действите по вступлению в любую заявку из активных
                    const isToEnterButton = item.querySelectorAll('tr > td')[4].querySelectorAll('a > u').length;
                    if (isToEnterButton) {
                        var resFilterApplicationList = Array.from(applicationList).filter(item => {
                            return item.className === 'r';
                        })
                    }
                    activeApplicationsArr.push(resFilterApplicationList);
                };
            };
        };

        function selectApplicationAndJoin(battlesArr) {
            //если есть активные заявки на бой, провожу анализ и вступаю
            //приоритет - вступление в начало заявки

            //когда внутри заявки - battlesArr[0] === undefined
            if (battlesArr.length && battlesArr[0] != undefined) {
                const sortedArrBattles = sortBattleRequest(battlesArr);
                const actionToEnterButton = sortedArrBattles[0][sortedArrBattles[0].length - 1]; //берет первую заявку сортированого\не сортированного массивов

                const timerEnter = randomInteger(minTimer, maxTimer);
                console.log('--Нажимаю кнопку Вступить', timerEnter);
                window.setTimeout(function () {
                    //если в заявке меньше 5 человек, то заходим
                    if (sortedArrBattles[0].length < 6) {
                        actionToEnterButton.click();
                    }
                }, 200);
            };
        };

        selectApplicationAndJoin(activeApplicationsArr);
    }
    //-----------------------------------------------------------------------------Действия выполняются на роуте wargroup


    //-----------------------------------------------------------------------------Действия выполняются на роуте pathname: "/b0/b.php"
    if (window.location.pathname === "/b0/b.php") {
        counterForSessionStorage('countOfMoves');
        clearSessionStorage('countOfUpdates');

        const grenade = document.getElementById("bagaboom"); //чекбокс "бросить гранату"
        const comeUp = document.getElementById("walk"); //чекбокс "подоходить всегда"
        const selectedOppenent = document.getElementById('euids');


        if (selectedOppenent) {
            let skillFirst = document.getElementById("apmid");
            let skillSecond = document.getElementById("apsid");//второй навык
            const selectedOppenentList = selectedOppenent.querySelectorAll('select > option');
            let allRangesArr = []; // записываю в массив всю дальность противника (на всякий случай)

            let tbody = document.querySelectorAll('table > tbody');
            let battleModeComponents = tbody[4].querySelectorAll('tr');
            let battleMode = battleModeComponents[1];

            let teamLeft = battleMode.children[0]; //команда игрока
            var battleСontrol = battleMode.children[1]; //панель управления

            let userInfoStr = teamLeft.children[0].innerText;
            let userHP = userInfoStr.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g)[0];
            let allHParr = userHP.split('/');
            let actualHP = allHParr[0];
            let allHP = allHParr[1];

            let greenbuttonTags = document.getElementsByClassName('greenbutton'); //все кнопки нпса
            let activeNPCskill = greenbuttonTags[1]; //первый активный навык НПС, в моем случае - медик

            var resFilterApplicationList = Array.from(selectedOppenentList).filter(item => {
                let strOpponentsRange = item.innerText.split(' - ')[1];
                //проверяю регуляркой на наличие 17"!" дальности, если она есть, значит ! нужно обрезать и оставить чистое число расстояния
                if (strOpponentsRange) {
                    const resIsLongRange = /!/i.test(strOpponentsRange);
                    if (resIsLongRange) {
                        const netRange = strOpponentsRange.substr(0, strOpponentsRange.length - 1)
                        allRangesArr.push(+netRange);
                        return item;
                    } else {
                        allRangesArr.push(+strOpponentsRange);
                    };
                };
            });

            if (activeNPCskill && activeNPCskill.querySelectorAll('a > img')[0].title === activeTemporarySkill) {
                activeNPCskill.click();
            };

            if (comeUp) {
                comeUp.checked = true; //Подходить всегда
            };

            //если массив не пустой, значит можно бросить гранату в даль
            //устанавливаю в селект первое вернувшиееся значение по дальности
            //сразу устанавливаю чекбокс на бросок гранаты, если это не дробовик
            if (resFilterApplicationList.length && grenade && !isShotgun) {
                console.log('Есть дальность, есть граната, бросаю!')
                selectedOppenent.value = resFilterApplicationList[0].attributes[0].value;
                grenade.checked = true;
                if (skillSecond) {
                    skillSecond.checked = true;
                }
            } else if (isShotgun) {
                var resSearchForZero = allRangesArr.filter((item) => {
                    return item < 3;
                });

                if (resSearchForZero.length) {
                    //console.log('--есть боты на нуле, убиваем их')
                } else {
                    //console.log('--ноль чистый, нужно бросить гранату или включить руки')
                    selectedOppenent.value = resFilterApplicationList[0].attributes[0].value;
                    if (grenade) {
                        //console.log('Есть дальность, есть граната, бросаю!')
                        //есть грана, брсоаем в даль
                        grenade.checked = true;
                    } else {
                        //console.log('Есть дальность, нет гранаты, стреляю!')
                        //гранаты нет, стреляем в даль
                        if (skillSecond) {
                            skillSecond.checked = true;
                        }
                    }
                };
            }

            //запускается перевязка, если хп меньше 70% от общего здоровья
            //запускается медик от НПС по аналогичному условию
            if (+actualHP / +allHP < 0.7) {
                let count = 0;
                if (skillFirst) {
                    skillFirst.checked = true;
                }
            };

            const sendMoveButton = battleСontrol.getElementsByTagName('table') && battleСontrol.getElementsByClassName('wb') && battleСontrol.getElementsByTagName('a');
            //если есть кнопка сделать ход, кликаю по ней
            if (sendMoveButton.length) {
                const timerSend = randomInteger(minTimer, maxTimer);
                console.log('--Нажимаю кнопку Сделать ход', timerSend);
                window.setTimeout(function () {
                    if (combatMode === 1 || combatMode === 0) {
                        sendMoveButton[0].click();
                    }
                    //пропуски хода, если быстрый режим
                    //if (combatMode === 0 && countOfMoves < 12) {
                    //    sendMoveButton[0].click();
                    //}
                    //условие для пропуска ходов, пока пропускаем
                    //if(combatMode === 0 && countOfMoves > 12 && !isShotgun){
                    //    document.location.reload();
                    //}else{
                    //    sendMoveButton[0].click();
                    //};
                }, timerSend);
            };
        } else {
            //Страница обновлена
            const timerReload = randomInteger(minTimer, maxTimer);
            console.log('--Нажимаю кнопку Обновить страницу', timerReload);
            window.setTimeout(function () {
                window.location.replace("https://www.gwars.ru/wargroup.php?war=armed");
            }, timerReload);
        };
    };


    //-----------------------------------------------------------------------------Действия выполняются на роуте /warlog.php


    //-----------------------------------------------------------------------------Действия выполняются на роуте /warlog.php
    if (window.location.pathname === "/warlog.php") {
        clearSessionStorage('countOfUpdates');
        clearSessionStorage('countOfMoves');

        console.log('--Финальная страничка')
        let finaleTable = document.getElementById("finaltable");//таблица с результатом
        if (finaleTable) {
            let finaleTableList = finaleTable.getElementsByClassName('panelfloat') && finaleTable.getElementsByTagName('tbody')[0].children;
            var resfinaleTableList = Array.from(finaleTableList).filter(item => {
                if (item.querySelectorAll('tr > td')[0].innerText === 'clark666[50]') {

                    var _res = Array.from(item.querySelectorAll('tr > td')).filter(data => {
                        if (data.querySelectorAll('td > nobr')[0] && data.querySelectorAll('td > nobr')[0].outerText) {
                            return data.querySelectorAll('td > nobr')[0].outerText;
                        } else {
                            return null;
                        }
                    });
                    return _res;
                }
            });

            if (resfinaleTableList.length) {
                //fetchData('Результат боя: ' + resfinaleTableList[0].outerText)
            } else {
                //fetchData('Результат боя: Техническая ошибка')
            }
        };

        //редирект на активные бои
        const timerRedirect = randomInteger(minTimer, maxTimer);
        console.log('--Редирект на страницу боев', timerRedirect);
        window.setTimeout(function () {
            window.location.replace("https://www.gwars.ru/wargroup.php?war=armed");
        }, timerRedirect);
    };
    //-----------------------------------------------------------------------------Действия выполняются на роуте /warlog.php


    //-----------------------------------------------------------------------------Действия при капче
    const captcha = document.getElementById("robotable");

    if (captcha) {
        console.log('--У нас капча!', captcha)
        fetchData('<b>Срочно ввести капчу</b>')
    };
    //-----------------------------------------------------------------------------Действия при капче


    //-----------------------------------------------------------------------------Действия внутри рюкзака
    if (window.location.pathname === "/items.php") {
        const itemsbody = document.getElementById('itemsbody');
        const LinkPerson = itemsbody.getElementsByClassName('greengraybg_block whitehover nul');
        //переход на основного персонажа
        if (LinkPerson) {
            LinkPerson[0].click();
        };


        window.setTimeout(function () {

            var allList = itemsbody.querySelectorAll('table > tbody > tr'); //весь список инвентаря
            //addTemporaryBonus('Стимпак бессмертия', sessionStorage.getItem('iseffect_Стимпак бессмертия'), allList);
            addTemporaryBonus('Карась', sessionStorage.getItem('iseffect_Карась'), allList);

            const strHP = itemsbody.getElementsByTagName('nobr')[0]; //строка состояния здоровья
            //todo получение ХП вынести в отдельную функцию
            if (strHP) {
                let userHP = strHP.innerText.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g)[0];
                let allHParr = userHP.split('/');
                let actualHP = +allHParr[0];
                let allHP = +allHParr[1];
                const allHP80 = allHP * 0.8;

                if (actualHP < allHP80 && combatMode === 0) {
                    restoreHealth(actualHP, allHP80, itemsbody);
                };
            }
        }, 500);
    };
    //-----------------------------------------------------------------------------Действия внутри рюкзака


    //-----------------------------------------------------------------------------Дополнительная логика для бонусов
    checkSessionStorageTime('effect_Стимпак бессмертия');
    checkSessionStorageTime('effect_Карась');
    //-----------------------------------------------------------------------------Дополнительная логика для бонусов


    //-----------------------------------------------------------------------------Ост функционал
    function fetchData(text) {
        var chatid = "-1001303709234";
        var token = "1798988669:AAFyw4E4m8yrLmaQM7OjQTCPQh-vmWxfHwI";
        //var text = "<div>Текст</div> для <b>нашего</b> <strong>бота</strong>";
        var data = "parse_mode=HTML&text=" + encodeURIComponent(text);

        //------------
        var http = new XMLHttpRequest();
        var url = "https://api.telegram.org/bot1798988669:AAFyw4E4m8yrLmaQM7OjQTCPQh-vmWxfHwI/sendMessage?chat_id=@GW_management";
        var params = `parse_mode=HTML&text=${text}`;
        http.open('POST', url, true);

        //Send the proper header information along with the request
        http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

        http.onreadystatechange = function () {//Call a function when the state changes.
            if (http.readyState == 4 && http.status == 200) {
                //console.log(http.responseText);
            }
        }
        http.send(params);
    };



    function checkSessionStorageTime(item) {
        const actDate = new Date();
        const actDateMS = Date.parse(actDate); //актуальная дата в миллисекундах
        if (!sessionStorage.getItem(item)) {
            //console.log(item, ' - такого эффекта нет')
            sessionStorage.setItem('is' + item, true);
            return;
        } else {
            let difference = actDateMS - sessionStorage.getItem(item);
            if (item === 'effect_Стимпак бессмертия' && difference >= 810000) {
                //console.log('--Нужен ' + item)
                sessionStorage.setItem('is' + item, true);
                return;
            } else {
                sessionStorage.setItem('is' + item, false);
                //console.log('--еще работает', item)
                return;
            };

            if (item === 'effect_Карась' && difference >= 2100000) {
                //console.log('--Нужен ' + item)
                sessionStorage.setItem('is' + item, true);
                return;
            } else {
                sessionStorage.setItem('is' + item, false);
                //console.log('--еще работает', item)
                return;
            };
        };
    };

    function checkSessionStorage(item) {
        if (!sessionStorage.getItem(item)) {
            sessionStorage.setItem(item, 0)
            return 0;
        } else {
            return sessionStorage.getItem(item);
        };
    };

    function counterForSessionStorage(item) {
        if (sessionStorage.getItem(item)) {
            var count = +sessionStorage.getItem(item);
            count++;
            sessionStorage.setItem(item, count)
        };
    };

    function clearSessionStorage(item) {
        if (sessionStorage.getItem(item)) {
            sessionStorage.setItem(item, 0);
        };
    };


    function restoreHealth(actHP, allHP, itemsbody) {
        var allList = itemsbody.querySelectorAll('table > tbody > tr');
        var resAllListItem = Array.from(allList).filter(item => {
            if (item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1]) {
                return item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1].innerText === 'Вяленая рыба';
            } else {
                return null;
            }
        });

        var resAllListFungus = Array.from(allList).filter(item => {
            if (item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1]) {
                return item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1].innerText === 'Грибы';
            } else {
                return null;
            }
        });

        if (resAllListItem[0]) {
            //20 - хилка от рыбы, пока харкод
            const countOfRecoveries = (allHP - actHP) / 20;
            var count = 0;
            if (countOfRecoveries) {
                window.setInterval(function () {
                    if (count < countOfRecoveries) {
                        count++;
                        console.log('--Употребление рыбы, кол-во: ' + countOfRecoveries);
                        //употребление рыбы
                        resAllListItem[0].querySelectorAll('tr > td > div > a')[1].click();

                        //упортебление грибов
                        if (isShotgun && resAllListFungus[0].querySelectorAll('tr > td > div > a')[1]) {
                            console.log('--У нас дробовик и есть возможность скушать грибы')
                            //resAllListFungus[0].querySelectorAll('tr > td > div > a')[1].click();
                        }
                    } else {
                        window.location.replace("https://www.gwars.ru/wargroup.php?war=armed");
                    }
                }, 500);
            }
        };
    };

    function addTemporaryBonus(title, need, allList) {
        var resTitleArr = Array.from(allList).filter(item => {
            if (item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1]) {
                return item.querySelectorAll('tr > td > table > tbody > tr > td > a')[1].innerText === title;
            } else {
                return null;
            }
        });

        //если находим нужный лот и в нем есть необходимость, используем его, указываем время использывания

        if (resTitleArr[0] && need) {
            const actDate = new Date();
            const actDateMS = Date.parse(actDate);
            if (resTitleArr[0].querySelectorAll('tr > td > div > a')[2]) {
                console.log('--Используем лут ' + title);
                resTitleArr[0].querySelectorAll('tr > td > div > a')[2].click();
                sessionStorage.setItem('effect_' + title, actDateMS);
            } else {
                console.log('--Видимо, вышел срок годности лута');
            }
        };
        return;
    };
})();