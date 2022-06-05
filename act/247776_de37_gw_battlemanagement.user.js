// ==UserScript==
// @name         GW_BattleManagement
// @version      10.00
// @author       262490
// @match        https://www.gwars.io/b0*
// @match        http://www.gwars.io/b0*
// @match         https://www.gwars.io/warlog.php*
// @match         http://www.gwars.io/warlog.php*
// ==/UserScript==
/*
    Possible battle types. It is required to determine battle type before starting to figure out how to position widget, etc
    Initial version of script will focus on type 2 (outside battle, full graphic disabled)
    It is planned and desired to support all possible types as parts of one script

    9.92 - personal npc fix
    9.93 - serial killer support
    9.94 - podstvol
    9.95 - layout fix (18.03.2021)
    9.96 - new grenades support
*/

/*
Settings
*/

// Initial lineups to use later
var startersRed = [];
var startersBlue = [];

// Link to full battle log to use from inside battle in non-JS mode
var fullLogLink = "";

// Battle constants
var insideBattle = 1; // URL: https://www.gwars.io/b0/b.php?bid=1404273159
var insideBattleName = "Inside Battle";
var outsideBattle = 2; // Outside is the same for JS and non-JS URL: https://www.gwars.io/warlog.php?bid=1404273068&rev=1
var outsideBattleName = "Outside Battle";
var insideBattleJavascript = 3; // URL: https://www.gwars.io/b0/btl.php?bid=1404273068
var insideBattleJavascriptName = "Inside JS Battle";
var insideBattleFullGraphic = 4; // URL: https://www.gwars.io/b0/b.php?bid=1404272848
var insideBattleFullGraphicName = "Inside Full Graphic JS Battle";
var outsideBattleFullGraphic = 5; // URL: https://www.gwars.io/warlog.php?bid=1404272848&rev=1
var outsideBattleFullGraphicName = "Outside Full Graphic JS Battle";
var unknown = 6; // Something went wrong, investigation required
var unknownName = "Unknown";

var currentBattleType = 0;
var currentBattleTypeName = "";

/*
    Regexes
*/
var insideBattleRegex = /https?:\/\/www\.gwars\.io\/b0\/b\.php.*/g;
var outsideBattleRegex = /https?:\/\/www\.gwars\.io\/warlog\.php\?bid=\d{1,20}.*/g;
var insideBattleJavascriptRegex = /https?:\/\/www\.gwars\.io\/b0\/btl\.php.*/g;
var insideBattleJavascriptRegex2 = /https?:\/\/www\.gwars\.io\/b0\/btk\.php.*/g;
var insideBattleJavascriptRegex3 = /https?:\/\/www\.gwars\.io\/b0\/bmove\.php.*/g;
var insideBattleTickerRegex = /https?:\/\/www\.gwars\.io\/b0\/bticker\.php\?.*/g;

var currentUrl = window.location.href;
var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;

var grenades = ['ДГ-1', 'EMP-S', 'EMP-IRS', 'ОР-2C', 'L83 A1 HG', 'M84', 'ОР-1С', 'ОР-2C', 'R10 HG'];
var guns_range = new Map([
    ['Remington MSR', 35],
    ['Mossberg 590', 12],
    ['UTAS XTR-12', 32],
    ['KAC M110', 34],
    ['SIG MSX', 34]
]);

// Getting BID from current URL to use as unique identifier for battle related data later
function getBidFromUrl(url) {
    var bidRegex = /(?<=bid=)\d{1,20}(?=.*)/g;
    return url.match(bidRegex)[0];
}

function getBidFromCurrentUrl() {
    var bidRegex = /(?<=bid=)\d{1,20}(?=.*)/g;
    return currentUrl.match(bidRegex)[0];
}

function log(string) {
    console.log(string);
}

function fillStartersHtml(color) {
    var battleLogSpan = document.querySelectorAll('span.txt')[0];
    var font = battleLogSpan.querySelectorAll("font[class=" + color + "]");
    var teamString = font[font.length - 1].innerText;
    var teamList = teamString.split(",");
    for (var r = 0; r < teamList.length; r++) {
        teamList[r] = teamList[r].trim().match(/.*(?=\[)/g)[0];
    }
    switch(color) {
        case "red":
            startersRed = teamList;
            break;
        case "blue":
            startersBlue = teamList;
            break;
    }

    var now = new Date();
    var time = now.getTime();
    var expireTime = time + 1000*60*60;
    now.setTime(expireTime);

    root.window.localStorage.setItem("gw_" + getBidFromCurrentUrl() + "_starters_" + color, teamList.join(","));
}

function putStarAndFocusToMessageText() {
    var input;
    switch(currentBattleType) {
        case 1:
            input = document.getElementsByName("newmessage")[0];
            input.value = "!*";
            input.focus();
            break;
        case 2:
            input = document.getElementsByName("msg")[0];
            input.value = "!*";
            input.focus();
            break;
    }
}

function deleteAllBasicCookies() {
    var allCookies = document.cookie.split(/; */);
    for (var d = 0; d < allCookies.length; d++) {
        if (allCookies[d].includes("gwbattleman_")) {
            var date = new Date();
            date.setTime(date.getTime() - (24*60*60*1000)); // past time
            var expires = "expires=" + date.toUTCString();
            document.cookie = allCookies[d] + "=; expires="+ date.toUTCString() + "; path=/;";
        }
    }
}

// Logic is based on the fact that red team is child of very first cell of parent table, so if div's parent node has no previous sibling then it's a red team div
function populateTeams(leftTeamDivs, rightTeamDivs, root) {
    var playerDivs = [];

    var links = root.document.getElementsByTagName("a");
    for(var a = 0; a < links.length; a++) {
        if (links[a].id.match(/userheader.*/g)) {
            playerDivs.push(links[a].parentElement.parentElement);
        }
    }

    for (var b = 0; b < playerDivs.length; b++) {
        if(playerDivs[b].parentNode.previousSibling === null) {
            leftTeamDivs.push(playerDivs[b]);
        } else {
            rightTeamDivs.push(playerDivs[b]);
        }
    }
}

function analyzeTeams(leftTeamDivs, rightTeamDivs, redTeam, blueTeam, battleId) {
    var dis1 = analyzeSingleTeam(leftTeamDivs, battleId, redTeam);
    var dis2 = analyzeSingleTeam(rightTeamDivs, battleId, blueTeam);
    return [dis1[0], dis2[1]];
}

function getGunType(img) {
    switch(img) {
        case "https://images.gwars.io/i/wargroup/skill_combat_sgun.gif":
            return "shotgun";
        case "https://images.gwars.io/i/wargroup/skill_combat_snipe.gif":
            return "sniper";
        case "https://images.gwars.io/i/wargroup/skill_combat_explosives.gif":
            return "rocketlauncher";
        case "https://images.gwars.io/i/wargroup/skill_combat_pistols.gif":
            return "pistols";
        case "https://images.gwars.io/i/wargroup/skill_combat_heavy.gif":
            return "heavy";
        case "https://images.gwars.io/i/wargroup/skill_combat_auto.gif":
            return "auto";
        default:
            return "WTF?!";
    }
}

function getGunRange(gun) {
    var bracket = gun.indexOf("[");
    var tmpGun = gun;
    if (bracket > -1) {
        tmpGun = gun.substring(0, bracket - 1);
    }

    var initial = guns_range.get(tmpGun);
    if (gun.includes('[D+D]') || gun.includes('[JL]') || gun.includes('[LB]') || gun.includes('[FG]') || gun.includes('[HO]')) {
        initial += 2;
    }
    if (gun.includes('[D]')) {
        initial += 1;
    }
    if (gun.includes('[D+]')) {
        initial += 1;
    }
    if (gun.includes('[P+D]') || gun.includes('[S+D]')) {
        initial += 1;
    }

    return initial === undefined ? -100 : initial;
}

function isGrenade(text) {
    if (text == undefined) return false;
    return new RegExp(grenades.join("|")).test(text)
}

function analyzeSingleTeam(teamDiv, battleId, teamInfo) {
    var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
    var visibilities = [];
    var maxDis = -1000;
    var minDis = 1000;
    for (var c = 0; c < teamDiv.length; c++) {
        var battleTag = parseInt(teamDiv[c].previousSibling.innerText);
        var aTags = teamDiv[c].querySelectorAll('a:not(.greenbutton)');
        var aTagBasic = aTags[0];
        var name = aTagBasic.innerText;
        var link = aTagBasic.href;
        var id = aTagBasic.id.match(/(?<=userheader)\d{1,10}/g)[0];
        var gun = aTags[1].innerText;
        var grenade = (aTags[2] !== undefined && isGrenade(aTags[2].innerText)) ? aTags[2].innerText : ((aTags[3] !== undefined && isGrenade(aTags[3].innerText)) ? aTags[3].innerText : ""); // Covering the case with 2 guns
        var distance = teamDiv[c].innerText.match(/(?<=Расстояние: ).*\d{1,2}/g)[0].replace("–", "-");
        if (parseInt(distance) < minDis) minDis = parseInt(distance);
        if (parseInt(distance) > maxDis) maxDis = parseInt(distance);
        var visibility = teamDiv[c].innerText.match(/(?<=Видимость: )\d{1,2}/g)[0];
        var hp = teamDiv[c].innerText.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g)[0];
        var gunType = teamDiv[c].querySelectorAll("img[src*=wargroup]")[0] !== undefined ? getGunType(teamDiv[c].querySelectorAll("img[src*=wargroup]")[0].src) : "pistols";
        var skill = ""; // teamDiv[c].getElementsByTagName("font")[0].innerText;
        var kills = 0;
        var gunRange = getGunRange(gun);

        /*
        var now = new Date();
        var time = now.getTime();
        var expireTime = time + 1000*60*60;
        now.setTime(expireTime);

        root.document.cookie = "gw_" + battleId + "_" + name + "_guntype=" + gunType + ";expires=" + now.toGMTString() + ";path=/";
        */
        teamInfo.push([name, link, id, gun, gunType, skill, grenade, distance, visibility, hp, battleTag, kills, gunRange]);
        log([name, link, id, gun, gunType, skill, grenade, distance, visibility, hp, battleTag, kills, gunRange]);
        visibilities.push(parseInt(visibility));
    }
    // Calculating average visibility
    setTeamVisibility(teamInfo, visibilities);
    return [maxDis, minDis];
}

function analyzeSingleTeamAdvanced(teamDiv, team) {
    // get all players names
    // get links from team by name (team[1])
    // async call links and run analyzeSinglePlayer for response
    // in a loop check for cookies player_{bid}_{name}_done = true and underscore players for which cookie exists
    var links = [];
    var bid = getBidFromUrl(window.location.href);

    for (var p = 0; p < team.length; p++) {
        if (getCookie("gw_" + bid + "_" + escapeSpacesInNames(team[p][0]) + "_info") == null) {
            links.push(team[p][1]);
        }
    }

    for(var b = 0; b < links.length; b++) {
        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function() {
            if (this.readyState == 4 && this.status == 200) {
                var text = this.responseText;

                var now = new Date();
                var time = now.getTime();
                var expireTime = time + 1000*60*60;
                now.setTime(expireTime);

                var battleId = getBidFromUrl(window.location.href);

                var name = text.match(/(?<=title>).*(?=\s:: Информация)/g)[0];

                var chip_regex = /(?<=Чипсет:&nbsp;<\/td><td valign=top><a href=\/item\.php\?item_id=).*(?= style)/g;
                var chip = text.match(chip_regex) !== null ? text.match(chip_regex)[0].split(" ")[0].trim() : "";

                var metka_regex = /(?<=Меткость:<\/div><\/td><td align=left  style='color:#000099;font-weight:bold;'>)\d{1,3}(?=<\/td>)/g;
                var metka = text.match(metka_regex)[0];

                var vynos_regex = /(?<=Выносливость:<\/div><\/td><td align=left  style='color:#660066;font-weight:bold;'>)\d{1,3}(?=<\/td>)/g;
                var vynos = text.match(vynos_regex)[0];

                /* Бонусы */
                var zhk_regex = /(?<=Жажда крови:<\/td><td align=left style='font-size:10px'><b>)\d{1,2}(?=<\/b)/g;
                var zhk = text.match(zhk_regex) !== null ? "ЖК" + text.match(zhk_regex)[0] : "";

                var uron_regex = /(?<=Бонус урона \(%\):<\/td><td align=left style='font-size:10px'><b>)\d{1,3}(?=<\/b)/g;
                var uron = text.match(uron_regex) !== null ? "У" + text.match(uron_regex)[0] : "";

                var saper_regex = /(?<=Бонус сапёра:<\/td><td align=left style='font-size:10px'><b>)\d{1,2}(?=<\/b)/g;
                var saper = text.match(saper_regex) !== null ? "БС" + text.match(saper_regex)[0] : "";

                var bz_regex = /(?<=Бонус защиты \(%\):<\/td><td align=left style='font-size:10px'><b>)\d{1,2}(?=<\/b)/g;
                var bz = text.match(bz_regex) !== null ? text.match(bz_regex)[0] : 0;

                var ubz = parseInt(bz) + Math.floor((parseInt(vynos) - 15) / 4);

                var cookieText = [chip, metka, "[" + ubz + "]"].join(",");

                //root.document.cookie = "gw_" + battleId + "_" + escapeSpacesInNames(name) + "_info=" + cookieText + ";expires=" + now.toGMTString() + ";path=/";
                root.localStorage.setItem("gw_" + battleId + "_" + escapeSpacesInNames(name) + "_info", cookieText);
            }
        };
        xhttp.open("GET", links[b], true);
        xhttp.send();
    }
}

function escapeSpacesInNames(name) {
    return name.replace(" ", "%").replace(" ", "%").replace(" ", "%").replace(" ", "%");
}

function drawTheWidget(redTeam, blueTeam, battleLogSpan, dc) {
    var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;

    var r_table = document.createElement("table");
    var r_tbody = document.createElement("tbody");
    var r_row = document.createElement("tr");
    var r_cell1 = document.createElement("td");
    r_cell1.style.width = "35.0%";
    var r_cell2 = document.createElement("td");
    r_cell2.style.width = "30.0%";
    var r_cell3 = document.createElement("td");
    r_cell3.style.width = "35.0%";
    r_row.appendChild(r_cell3);
    r_row.appendChild(r_cell2);
    r_row.appendChild(r_cell1);
    r_tbody.appendChild(r_row);
    r_table.appendChild(r_tbody);

    var divLeft = document.createElement("div");
    var divRight = document.createElement("div");

    createSeparators(redTeam, blueTeam, battleLogSpan, divLeft, divRight);
    createStatLines(redTeam, blueTeam, divLeft, divRight, battleLogSpan, dc);

    r_cell1.appendChild(divRight);
    r_cell3.appendChild(divLeft);
    root.document.getElementsByTagName("table")[5].rows[0].cells[1]
        .insertBefore(r_table, root.document.getElementsByTagName("table")[5].rows[0].cells[1].getElementsByTagName("table")[3]);

    // Buttons
    getButton(divLeft, redTeam);
    getButton(divRight, blueTeam);

    return r_table;
}

function drawDCTable(table, redTeam, blueTeam, dc1) {

    var r_table_dc = document.createElement("table");
    var r_tbody_dc = document.createElement("tbody");
    var r_row_dc_header = document.createElement("tr");
    var r_row_dc_data = document.createElement("tr");

    r_tbody_dc.appendChild(r_row_dc_header);
    r_tbody_dc.appendChild(r_row_dc_data);
    r_table_dc.appendChild(r_tbody_dc);

    root.document.getElementsByTagName("table")[5].rows[0].cells[1].insertBefore(r_table_dc, root.document.getElementsByTagName("table")[5].rows[0].cells[1].getElementsByTagName("table")[4]);

    var maxRed = 1, minRed = -1000, maxBlue = 0, minBlue = 1000;

    for(var r = 0; r < redTeam.length; r++) {
        if (Math.abs(redTeam[r][7]) > Math.abs(maxRed)) maxRed = redTeam[r][7];
        if (Math.abs(redTeam[r][7]) < Math.abs(minRed)) minRed = redTeam[r][7];
    }

    for(var b = 0; b < blueTeam.length; b++) {
        if (blueTeam[b][7] > maxBlue) maxBlue = blueTeam[b][7];
        if (blueTeam[b][7] < minBlue) minBlue = blueTeam[b][7];
    }

    var maxDistance = Math.abs(maxRed) + Math.abs(maxBlue);
    var cellsCount = maxDistance
        + 2 // double 0
        + 10; // additional space

    var dc = 0;
    if (Math.abs(minRed) > Math.abs(minBlue)) {
        dc = Math.abs(minRed) - ((-1) * parseInt(Math.abs(minRed) + Math.abs(minBlue) / 2));
    } else if (Math.abs(minRed) < Math.abs(minBlue)) {
        dc = Math.abs(minBlue) - (parseInt(Math.abs(minRed) + Math.abs(minBlue) / 2));
    }


    log(maxRed + " " + minRed + " " + maxBlue + " " + minBlue + " " + cellsCount + " " + dc);

    return r_table_dc;
}

function getButton(div, team) {
    var button = document.createElement('input');
    button.type = "button";
    button.className = "btn";
    button.value = "Load Stats";
    button.addEventListener('click', function(){
        analyzeSingleTeamAdvanced(div, team);
    });

    div.insertBefore(button, div.firstChild);
}

function createSeparators(redTeam, blueTeam, battleLogSpan, divLeft, divRight) {
    setPlayerListSeparators("redfont", redTeam, battleLogSpan, divLeft);
    setPlayerListSeparators("bluefont", blueTeam, battleLogSpan, divRight);
}

function setPlayerListSeparators(color, team, battleLogSpan, div) {

    var font = battleLogSpan.querySelectorAll("font[class=" + color + "]");
    var teamInitialNumber = (font[font.length - 1].innerText.match(new RegExp(",", "g")) || []).length + 1;

    var teamFirstSub = 9999999;
    var subsCount = 0;
    if (team[0][10] > teamInitialNumber) {
        // есть замены
        for (var j = 0; j < team.length; j++) {
            subsCount++;
            if (team[j][10] <= teamInitialNumber && j > 0) {
                teamFirstSub = team[j - 1][2];
                subsCount--;
                break;
            } else if (team[j][10] <= teamInitialNumber && j == 0) {
                teamFirstSub = team[j][2];
                subsCount--;
                break;
            }
            teamFirstSub = 0;
        }
    }
    var osnCount = team.length - subsCount;

    for (var f = 0; f < team.length; f++) {
        if (team[f][2] == teamFirstSub || teamFirstSub == 9999999) {
            var start = f;
            if (team[f][2] == teamFirstSub) {
                div.insertBefore(getPlayerString(team[f], battleLogSpan), div.firstChild);
                start = f + 1;
            }

            var shotguns = [];
            var auto = [];
            var sniper = [];
            var other = [];
            for (var w = start; w < team.length; w++) {
                switch(team[w][4]) {
                    case "shotgun":
                        shotguns.push(team[w]);
                        break;
                    case "sniper":
                        sniper.push(team[w]);
                        break;
                    case "auto":
                        auto.push(team[w]);
                        break;
                    default:
                        other.push(team[w]);
                        break;
                }
            }
            if (other.length > 0) {
                for (var u = 0; u < other.length; u++) {
                    div.insertBefore(getPlayerString(other[u], battleLogSpan), div.firstChild);
                }
                div.insertBefore(document.createElement("br"), div.firstChild);

            }
            if (sniper.length > 0) {
                for (var z = 0; z < sniper.length; z++) {
                    div.insertBefore(getPlayerString(sniper[z], battleLogSpan), div.firstChild);
                }
                div.insertBefore(document.createElement("br"), div.firstChild);
            }
            if (auto.length > 0) {
                for (var x = 0; x < auto.length; x++) {
                    div.insertBefore(getPlayerString(auto[x], battleLogSpan), div.firstChild);
                }
                div.insertBefore(document.createElement("br"), div.firstChild);
            }
            if (shotguns.length > 0) {
                for (var c = 0; c < shotguns.length; c++) {
                    div.insertBefore(getPlayerString(shotguns[c], battleLogSpan), div.firstChild);
                }
            }
            break;
        } else {
            div.insertBefore(getPlayerString(team[f], battleLogSpan), div.firstChild);
        }
    }

    var separator = document.createElement("b");
    var separator_text = document.createTextNode("====== ЗАМЕНЫ (" + subsCount + ") =======");
    separator.appendChild(separator_text);

    if (teamFirstSub == 0) {
        // Все замены, вставляем сепаратор в начало
        div.insertBefore(separator, div.firstChild);
        div.insertBefore(document.createElement("br"), div.firstChild);
    } else if (teamFirstSub == 9999999) {
        // Нет замен, сепаратор не нужен
    } else {
        // Есть и основа и замены
        div.insertBefore(document.createElement("br"), div.querySelector("div.id" + teamFirstSub));
        div.insertBefore(separator, div.querySelector("div.id" + teamFirstSub));
    }

    var separator_osn = document.createElement("b");
    var separator_text_osn = document.createTextNode("====== ОСНОВА (" + osnCount + ") =======");
    separator_osn.appendChild(separator_text_osn);

    div.insertBefore(separator_osn, div.firstChild);
    div.insertBefore(document.createElement("br"), div.firstChild);

}

function createStatLines(redTeam, blueTeam, divLeft, divRight, battleLogSpan, dc) {
    createStatLine(redTeam, blueTeam, divLeft, battleLogSpan, "red", dc);
    createStatLine(blueTeam, redTeam, divRight, battleLogSpan, "blue", dc);
}

function createStatLine(team1, team2, div, battleLogSpan, color, dc) {
    var teamStatDiv = document.createElement("div");
    teamStatDiv.classList.add(color + "TeamStat");

    var dcSpan = document.createElement("span");
    var dcSpanText = document.createTextNode(", ДЦ " + dc);
    dcSpan.appendChild(dcSpanText);
    teamStatDiv.insertBefore(dcSpan, teamStatDiv.firstChild);
    teamStatDiv.insertBefore(getMedicsForTeam(team1), teamStatDiv.firstChild);
    teamStatDiv.insertBefore(getVisForTeam(team1), teamStatDiv.firstChild);
    teamStatDiv.insertBefore(getAaAtForTeam(team2, color == "red" ? "blue" : "red", battleLogSpan), teamStatDiv.firstChild);

    div.insertBefore(teamStatDiv, div.firstChild);
}

function getAaAtForTeam(team, color, battleLogSpan) {
    var turnsData = getTurnsDataLastTwo(battleLogSpan);

    var starterTeam = [];
    switch(color) {
        case "red":
            starterTeam = startersRed;
            break;
        case "blue":
            starterTeam = startersBlue;
            break;
    }

    for (var k = 0; k < team.length; k++) {
        starterTeam.push(team[k][0]);
    }

    starterTeam = starterTeam.sort().filter(function(item, pos, ary) {
        return !pos || item != ary[pos - 1];
    });

    var aaEffect = 0;
    var atEffect = 0;

    var aaAtEffect1 = [0, 0];
    var aaAtEffect2 = [0, 0];

    if (turnsData.length > 1) {
        aaAtEffect1 = getAaAtForTurn(starterTeam, turnsData[0]);
        aaAtEffect2 = getAaAtForTurn(starterTeam, turnsData[1]);
    } else if (turnsData.length == 1) {
        aaAtEffect1 = getAaAtForTurn(starterTeam, turnsData[0]);
    } else {
        return document.createElement("span"); // returning empty span
    }

    var aaTeam = aaAtEffect1[0]/2 + aaAtEffect2[0]/4;
    var atTeam = aaAtEffect1[1]/2 + aaAtEffect2[1]/4;

    var aaAtDiv = document.createElement("span");
    var aaAtDiv_text = document.createTextNode("AA: " + aaTeam + " AT: " + atTeam + "; ");
    aaAtDiv.appendChild(aaAtDiv_text);

    return aaAtDiv;
}

function getAaAtForTurn(team, turn) {

    var aaAtRegExp = /.* активирует (EMP-S|EMP-IRS|M84|EMP-IR)/g;

    var aa = 0;
    var at = 0;

    var grenades = [];
    for (var t = 0; t < turn.length; t++) {
        var lines = turn[t].match(aaAtRegExp);
        if (lines !== null) {
            for (var r = 0; r < team.length; r++) {
                if (lines[0].includes(team[r])) {
                    grenades.push(lines[0]);
                }
            }
        }
    }

    for (var p = 0; p < grenades.length; p++) {
        if (grenades[p].includes("EMP-IRS")) {
            aa += 15;
            at += 15;
            continue;
        }

        if (grenades[p].includes("EMP-IR")) {
            at += 20;
            continue;
        }

        if (grenades[p].includes("EMP-S")) {
            aa += 20;
            continue;
        }

        if (grenades[p].includes("M84")) {
            at += 15;
            continue;
        }
    }
    return [aa, at];
}

function getVisForTeam(team) {

    var teamVis = document.createElement("span");
    var teamVisText = document.createTextNode("Видимость: ");
    var teamVisValue = document.createTextNode(team[0][8] + "%; ");

    if (team[0][8] > 70) teamVis.style.color = 'red';

    teamVis.appendChild(teamVisText);
    teamVis.appendChild(teamVisValue);
    return teamVis;
}

function getMedicsForTeam(team) {
    var teamMedics = document.createElement("span");
    var teamMedicsText = document.createTextNode(getMedics(team));
    teamMedics.appendChild(teamMedicsText);
    return teamMedics;
}

function getMedics(team) {
    var pedics = 0;
    var bid = getBidFromUrl(window.location.href);
    for (var r = 0; r < team.length; r++) {
        var chip_cookie = getCookie("gw_" + bid + "_" + escapeSpacesInNames(team[r][0]) + "_info");
        if (chip_cookie !== null && chip_cookie.split(",")[0].includes("chip_medic")) {
            pedics += 1;
        }
    }
    return "Медиков: " + pedics;
}

function setTeamVisibility(teamInfo, visArray) {
    if (visArray.length > 1) {
        var visSum = 0;
        var visMax = 0;
        for (var p = 0; p < visArray.length; p++) {
            if (visArray[p] > visMax) {
                visMax = visArray[p];
            }
        }

        for (var q = 0; q < visArray.length; q++) {
            visSum += visArray[q];
        }

        visSum -= visMax;

        for (var e = 0; e < teamInfo.length; e++) {
            teamInfo[e][8] = parseInt(visSum / (visArray.length - 1));
        }
    } else if (visArray.length == 1) {
        teamInfo[0][8] = visArray[0]
    }
}

function getPlayerString(player, battleLogSpan) {

    // 0 name, 1 link, 2 id, 3 gun, 4 gunType, 5 skill, 6 grenade, 7 distance, 8 visibility, 9 hp, 10 battletag, 11 kills
    var name = player[0];
    var kills = "";
    if (player[4] == "shotgun" && parseInt(player[11]) > 0) {
        kills = " x" + player[11];
    }
    var gun = player[3];
    var gunType = player[4];
    var grenade = player[6];
    var distance = player[7];
    var visibility = player[8];
    var hp = player[9];

    var div = document.createElement("div");
    div.classList.add("id" + player[2]); // setting class to id
    div.style.textAlign = "left";

    div.appendChild(getNameAndHp(name, hp));
    div.appendChild(getKills(kills));
    div.appendChild(getBlood(name, battleLogSpan));
    div.appendChild(getStatsAndBonuses(name, gunType));
    div.appendChild(getGun(gun, name, battleLogSpan));
    div.appendChild(getGrenade(grenade, name, battleLogSpan));
    //div.appendChild(getVisibility(visibility)); // deprecated, visibility moved to stat line
    div.appendChild(getDistance(distance));
    div.appendChild(getUsedPerks(name, battleLogSpan));

    div.style.fontSize = "x-small";

    return div;
}

function getUsedPerks(name, battleLogSpan) {
    var bolds = battleLogSpan.getElementsByTagName("b");
    var perksNode = document.createElement("strike");
    var text = "";

    for (var g = 0; g < bolds.length; g++) {
        if (bolds[g].innerText == name) {
            var title = bolds[g].parentNode.title;
            if (title !== "") {
                if (title.includes("+")) {
                    var perks = title.split(" + ");
                    text = text.includes(getShortPerk(perks[0])) ? text : " " + text + " " + getShortPerk(perks[0]);
                    text = text.includes(getShortPerk(perks[1])) ? text : " " + text + " " + getShortPerk(perks[1]);
                } else {
                    text = text.includes(getShortPerk(title)) ? text : " " + text + " " + getShortPerk(title);
                }
            }
        }
    }

    var logText = battleLogSpan.innerText;

    var missRegex = /Снаряд, выпущенный .*, никого не задел \(M6.*\)/g;
    var hitRegex = /.* \(M6.*\) .* в .*/g;
    if (logText.match(missRegex) !== null) {
        for (var i = 0; i < logText.match(missRegex).length; i++) {
            if (logText.match(missRegex)[i].includes(name + ", никого")) {
                text = "ПОДСТВОЛ " + text;
            }
        }
    }

    if (logText.match(hitRegex) !== null) {
        for (var i = 0; i < logText.match(hitRegex).length; i++) {
            if (logText.match(hitRegex)[i].includes(": " + name)) {
                text = "ПОДСТВОЛ " + text;
            }
        }
    }

    var perksNodeText = document.createTextNode(text);

    perksNode.appendChild(perksNodeText);
    perksNode.style.fontSize = "x-small";
    return perksNode;
}

function getShortPerk(perk) {
    switch(perk) {
        case "Авиаудар":
            return "АВА";
        case "Силовое поле":
            return "ПОЛЕ";
        case "Попутный ветер":
            return "ВЕТЕР";
        case "Свинцовый ливень":
            return "ЛИВЕНЬ";
        case "Длинные руки":
            return "РУКИ";
        case "Точный залп":
            return "ТОЧНЫЙ";
        case "Рокетджамп":
            return "РОКЕТ";
        case "Дымовой залп":
            return "ДЫМЗАЛП";
        case "Выстрел правши":
            return "ПРАВША";
        case "Рывок вперед":
            return "РЫВОК";
        default:
            return perk.toUpperCase();
    }

}

function getStatsAndBonuses(name, gunType) {
    var statsBonuses = document.createElement("span");
    var metkaB = document.createElement("span");
    var bonusB = document.createElement("span");

    var bid = getBidFromUrl(window.location.href);

    var cookie = getCookie("gw_" + bid + "_" + escapeSpacesInNames(name) + "_info");
    if (gunType == "auto" || gunType == "sniper" ) {
        var metka = cookie !== null ? cookie.split(",")[1] : "";

        var metka_text = document.createElement("span");
        if (metka.length > 0) {
            metka_text = document.createTextNode(" {" + metka + "}");
        }

        if(parseInt(metka) > 59) {
            metkaB.style.color = 'green';
        }
        metkaB.appendChild(metka_text);
        metkaB.style.fontWeight = '900';
    }

    var bonus = cookie !== null ? cookie.split(",")[2] : "";

    var bonus_text = document.createElement("span");
    if (bonus.length > 0) {
        bonus_text = document.createTextNode(" " + bonus + " ");
    }

    bonusB.appendChild(bonus_text);
    bonusB.style.fontWeight = '900';
    statsBonuses.appendChild(metkaB)
    statsBonuses.appendChild(bonusB)

    return statsBonuses;
}

function getKills(kills) {
    var killsSpan = document.createElement("span");
    killsSpan.style.fontWeight = '900';
    var kills_text = document.createTextNode(kills);
    killsSpan.appendChild(kills_text);
    killsSpan.style.color = 'red';
    return killsSpan;

}

function getNameAndHp(name, hp) {
    var nick = document.createElement("span");
    var nickb = document.createElement("span");
    var nick_text = document.createTextNode(name);
    var hpb = document.createElement("span");
    var hp_text = document.createTextNode(hp);
    var bracketb = document.createElement("span");
    var bracketb_text = document.createTextNode(")");
    var bracketb2 = document.createElement("span");
    var bracketb2_text = document.createTextNode(" (");
    hpb.appendChild(hp_text);
    bracketb.appendChild(bracketb_text);
    bracketb2.appendChild(bracketb2_text);

    var currentHp = hp.split("/")[0];
    var maxHp = hp.split("/")[1];
    if ((maxHp / currentHp) > 2) {
        hpb.style.color = 'orange';
        hpb.style.fontWeight = '900';
    }
    if (currentHp <= 200) {
        hpb.style.color = 'red';
        hpb.style.fontWeight = '900';
    }

    var bid = getBidFromUrl(window.location.href);
    var cookie = getCookie("gw_" + bid + "_" + escapeSpacesInNames(name) + "_info");
    var chip = cookie !== null ? cookie.split(",")[0] : undefined;

    switch(chip) {
        case("chip_attack3"):
            nickb.style.color = 'green';
            break;
        case("chip_explosives"):
            nickb.style.color = 'green';
            break;
        case("chip_attack"):
            nickb.style.color = 'green';
            break;
        case("chip_attack2"):
            nickb.style.color = 'green';
            break;
        case("chip_assault"):
            nickb.style.color = 'green';
            break;
        case("chip_medic4"):
            nickb.style.color = 'green';
            break;
        case("chip_medic3"):
            nickb.style.color = 'green';
            break;
        case(""):
            nickb.style.color = 'green';
            break;
    }

    // Adding listener to copy nickname to new message box on click
    nick.addEventListener("click", function(){
        var text = this.textContent;
        var input = document.getElementsByName("msg")[0];
        var nick = text.substring(0, text.lastIndexOf("("));
        nick.includes("Хулуд") ? nick.replace("у", "y") : nick;
        input.value = input.value + nick + " ";
        input.focus();
    });
    nickb.appendChild(nick_text);
    nick.appendChild(nickb);
    nick.appendChild(bracketb2);
    nick.appendChild(hpb);
    nick.appendChild(bracketb);
    return nick;
}

function getCookie(name) {
    return root.window.localStorage.getItem(name);
    //var value = "; " + document.cookie;
    //var parts = value.split("; " + name + "=");
    //if (parts.length == 2) return parts.pop().split(";").shift();
}

function getBlood(name, battleLogSpan) {
    var blood = document.createElement("b");
    blood.style.color = 'red';
    blood.style.fontWeight = "900";

    var currentTurn = getCurrentTurn();
    var turnsData = getTurnsDataLastTwo(battleLogSpan);
    var bloodEffect = 0;
    var actionsForPlayer = [];
    for (var p = 0; p < turnsData.length; p++) {
        for (var q = 0; q < turnsData[p].length; q++) {
            if (turnsData[p][q].includes(name)) {
                actionsForPlayer.push(turnsData[p][q]);
            }
        }
    }

    if (actionsForPlayer.length > 0) {
        bloodEffect += hasBeenHitByAutoWithCriticals(name, actionsForPlayer);
    }

    if (bloodEffect > 0) {
        var blood_text = document.createTextNode(" (" + bloodEffect + ")");
        blood.appendChild(blood_text);
        return blood;
    } else {
        return document.createElement("b");
    }
}

function hasBeenHitByAutoWithCriticals(name, actionsForPlayer) {
    var hits = [];
    for (var y = 0; y < actionsForPlayer.length; y++) {
        if(isHit(name, actionsForPlayer[y])) {
            hits.push(actionsForPlayer[y]);
        }
    }
    return isBlood(hits);
}

function isBlood(hits) {
    var hasBlood = false;
    var bloodCounter = 0;
    var bid = getBidFromUrl(window.location.href);
    for (var p = 0; p < hits.length; p++) {
        var autoReg = /\(.*(SIG MCX|Barrett REC7|\[А\d{1,2}\+]|Thales|Ambush).*(голову|лоб|репу|пах|шею|висок|ухо).*\)/g;
        if(hits[p].match(autoReg) !== null) {
            var who_regex = /\d{2}:\d{2}, #\d{1,3} : .* (?=стрелял[а]?|метил[а]?|целился|целилась|палил[а]?)/g;
            var who = hits[p].match(who_regex)[0].trim().split(":")[2].trim();
            var metka_cookie = getCookie("gw_" + bid + "_" + escapeSpacesInNames(who) + "_info");
            var metka = metka_cookie !== null ? metka_cookie.split(",")[1] : 30;

            bloodCounter += metka / 2;
        }
    }
    return bloodCounter;
}

function isHit(name, string) {
    return string.includes("в " + name) ? string : "";
}

function getGun(gunName, name, battleLogSpan) {
    var gun = document.createElement("span");
    var gun_text = document.createTextNode(" | " + gunName + " | ");
    gun.appendChild(gun_text);

    var hasSlept = sleptOnPreviousTurn(name, battleLogSpan);
    if (hasSlept !== null) {
        if (hasSlept.includes("(2)") || hasSlept.includes("(3)")) {
            gun.style.color = 'magenta';
        } else if (hasSlept.includes("(4)")) {
            gun.style.color = 'red';
        } else {
            gun.style.color = 'green';
        }
    }
    gun.style.fontSize = "x-small";

    if (gunName.includes("UTAS XTR") || gunName.includes("Origin-12S")) {
        gun.style.fontWeight = "900";
    }

    gun.addEventListener("click", function(){
        var text = this.textContent;
        var input = document.getElementsByName("msg")[0];
        input.value = input.value + "без наемников";
    });

    return gun;
}

function sleptOnPreviousTurn(name, battleLogSpan) {
    var turnsData = getTurnsData(battleLogSpan);
    var currentTurn = getCurrentTurn();

    if ( currentTurn > 1) {
        var lastTurn = turnsData[currentTurn - 1];

        var sleepers = [];
        for (var y = 0; y < lastTurn.length; y++) {
            if (lastTurn[y].includes("пропускает ход")) {
                sleepers.push(lastTurn[y]);
            }
        }

        for (var z = 0; z < sleepers.length; z++) {
            if (sleepers[z].includes(name)) {
                return sleepers[z];
            }
        }
    }

    return null;
}

function getGrenade(grenade, name, battleLogSpan) {
    var gren;

    if(grenade === "") { gren = document.createElement("span"); }
    else { gren = document.createElement("b"); }

    if (hasThrownGrenade(name, battleLogSpan)) {
        if (grenade !== "") {
            grenade += " (ТУЗ)";
        }
    }

    var gren_text = document.createTextNode(grenade);

    gren.appendChild(gren_text);
    // Adding listener to copy "грену" to new message box on click
    gren.addEventListener("click", function(){
        var input = document.getElementsByName("msg")[0];
        input.value = input.value + " - грену ";
        input.focus();
    });

    if(gren.innerText.includes("ДГ-1") || gren.innerText.includes("L83 A1 HG")) {
        gren.style.color = 'violet';
        gren.style.fontWeight = "900";
    }
    if(gren.innerText.includes("ОР-2C") || gren.innerText.includes("ОР-1C")) {
        gren.style.color = 'blue';
        gren.style.fontWeight = "900";
    }
    if(gren.innerText.includes("R10 HG")) {
        gren.style.color = 'red';
        gren.style.fontWeight = "900";
    }

    return gren;
}

function hasThrownGrenade(name, span) {
    var text = span.innerText;
    return text.includes(name + " запустил") || text.includes(name + " взорвал") || text.includes(name + " активировал") || text.includes("Взрыв от гранаты " + name);
}

/* Deprecated */
function getVisibility(visibility) {
    var vis = document.createElement("b");
    var vis_text = document.createTextNode(" | " + visibility + "%");
    vis.appendChild(vis_text);
    return vis;
}

function getDistance(distance) {
    var dis = document.createElement("b");
    var dis_text = document.createTextNode(" | " + distance + " | ");
    dis.appendChild(dis_text);
    return dis;
}

function getSinglePlayerDivFromWidgetByName(playerName, widgetTable) {
    var allDivs = [widgetTable.rows[0].cells[0].getElementsByTagName("div")[0].getElementsByTagName("div"),
                   widgetTable.rows[0].cells[2].getElementsByTagName("div")[0].getElementsByTagName("div")];

    for (var l = 0; l < allDivs.length; l++) {
        for (var k = 0; k < allDivs[l].length; k++) {
            if (allDivs[l][k].innerText.includes(playerName)) {
                return allDivs[l][k];
            }
        }
    }
}

function getCurrentTurn() {
    var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
    var span = root.document.querySelectorAll('span.txt')[0];
    if (span.innerText.match(/\d{2}:\d{2}, #\d{1,2}/g) !== null) {
        return parseInt(span.innerText.match(/(?<=#)\d{1,3}/g)[0]) + 1;
    } else {
        return 1;
    }
}

function getTurnsData(span) {
    var textLines = span.innerText.match(/.*\n/g);

    var turnsDataMap = {};
    var currentTurn = getCurrentTurn();

    if (currentTurn > 1) {
        for (var m = 1; m < currentTurn; m++) {
            var linesForTurn = [];
            var regex = "#" + m + " .*";
            var re = new RegExp(regex, "g");
            for (var n = 0; n < textLines.length; n++) {
                if (textLines[n].match(re)) {
                    linesForTurn.push(textLines[n]);
                }
            }
            turnsDataMap[m] = linesForTurn;
        }
    }

    return turnsDataMap;
}

function getTurnsDataLastTwo(span) {
    return getTurnsDataLastN(span, 2);
}

function getTurnsDataLastThree(span) {
    return getTurnsDataLastN(span, 3);
}

function getTurnsDataLastN(span, n) {
    // Gets last N turns
    var turnsData = getTurnsData(span);
    var currentTurn = getCurrentTurn();

    var lastN = [];
    if (currentTurn > 1) {
        if (currentTurn > n) {
            for (var z = 1; z < (n + 1); z++) {
                lastN.push(turnsData[currentTurn - z]);
            }
        } else {
            for (var y = 1; y < currentTurn; y++) {
                lastN.push(turnsData[currentTurn - y]);
            }
        }
    }
    return lastN;
}

// =========================================
// = Main function to create battle widget =
// =========================================
function createBattleWidget(battleType, battleTypeName, battleId) {
    console.log(`BattleTypeId ${battleType}, BattleTypeName ${battleTypeName}, BID ${battleId}`);
    switch(battleType) {
        case 1:
            createBattleWidgetInside(battleType, battleId);
            break;
        case 2:
            createBattleWidgetOutside(battleType, battleId);
            break;
        default:
            createBattleWidgetOutside(battleType, battleId);
    }
}

function createBattleWidgetInside(battleType, battleId) {
    createBattleWidgetOutside(battleType, battleId);
}

function createBattleWidgetOutside(battleType, battleId) {
    var root = typeof unsafeWindow != 'undefined' ? unsafeWindow : window;
    var leftTeamDivs = [];
    var rightTeamDivs = [];
    populateTeams(leftTeamDivs, rightTeamDivs, root);

    var redTeam = [];
    var blueTeam = [];
    var dc = analyzeTeams(leftTeamDivs, rightTeamDivs, redTeam, blueTeam, battleId, root);
    var dc1 = dc[1] - (dc[1] - dc[0]) / 2;

    redTeam.reverse();
    blueTeam.reverse();

    var battleLogSpan = root.document.querySelectorAll('span.txt')[0];
    var widgetTable = drawTheWidget(redTeam, blueTeam, battleLogSpan, dc1);
    var dcTable = drawDCTable(widgetTable, redTeam, blueTeam, battleLogSpan, dc1);

    var turnsDataMap = getTurnsData(battleLogSpan);
}

// ==================================

deleteAllBasicCookies();
if (currentUrl.match(insideBattleRegex) || currentUrl.match(insideBattleTickerRegex)) {
    if (root.document.getElementById("userinfo_1")) {
        currentBattleType = insideBattleFullGraphic;
        currentBattleTypeName = insideBattleFullGraphicName;
    } else {
        currentBattleType = insideBattle;
        currentBattleTypeName = insideBattleName;

        var red_starters_cookie = getCookie( "gw_" + getBidFromCurrentUrl() + "_starters_red");
        startersRed = red_starters_cookie !== null ? red_starters_cookie.split(",") : [];

        var blue_starters_cookie = getCookie( "gw_" + getBidFromCurrentUrl() + "_starters_blue");
        startersBlue = blue_starters_cookie !== null ? blue_starters_cookie.split(",") : [];

        var anchors = document.getElementsByTagName("a");
        for (var a = 0; a < anchors.length; a++) {
            if (a.innerText === "запись всех ходов >") {
                fullLogLink = a.href;
            }
        }
    }
} else if (currentUrl.match(outsideBattleRegex)) {
    currentBattleType = outsideBattle;
    currentBattleTypeName = outsideBattleName;
    fillStartersHtml("redfont");
    fillStartersHtml("bluefont");
    if (root.document.getElementById("battle_area_block0")) {
        currentBattleType = outsideBattleFullGraphic;
        currentBattleTypeName = outsideBattleFullGraphicName;
    }
} else if (currentUrl.match(insideBattleJavascriptRegex) || currentUrl.match(insideBattleJavascriptRegex2) || currentUrl.match(insideBattleJavascriptRegex3)) {
    currentBattleType = insideBattleJavascript;
    currentBattleTypeName = insideBattleJavascriptName;
} else {
    // Something went wrong, investigation required
    console.log("WTF?");
    currentBattleType = unknown;
    currentBattleTypeName = unknownName;
}

putStarAndFocusToMessageText();
createBattleWidget(currentBattleType, currentBattleTypeName, getBidFromUrl(currentUrl));
