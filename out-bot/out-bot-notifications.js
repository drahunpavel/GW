// ==UserScript==
// @name         GW out-bot-notifications
// @namespace    https://github.com/drahunpavel/GW/tree/main/out-bot
// @version      1.1.2
// @description  try to take over the world!
// @author       https://github.com/drahunpavel
// @updateURL    https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-notifications.js
// @downloadURL  https://raw.githubusercontent.com/drahunpavel/GW/main/out-bot/out-bot-notifications.js
// @match        *
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const captcha = document.getElementById("robotable");

    if (captcha) {
        console.log('--У нас капча!', captcha)
        fetchData('<b>Срочно ввести капчу</b>')
    };

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
})();