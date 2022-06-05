
// ==UserScript==
// @name         SkillsForOut Modern Tactical
// @version      1.1
// @description  try to take over the world!
// @author       Paul
// @match        https://www.gwars.ru/b0/*
// @grant        none
// ==/UserScript==



(function () {
    'use strict';
    let w = window;
    if (w.self != w.top) {
        return;
    };

    //навыки для нпс менять тут!!!
    const weaponActiveSkillNPCTitle = 'Попутный ветер';
    const characterActiveSkillNPCTitle = 'Медик';




    let teamLeft = document.getElementsByClassName('greenlightbg')[0];
    let userInfoStr = teamLeft.children[0].innerText;
    let allUserHPItem = userInfoStr.match(/(?<=HP: )\d{1,4}\/\d{1,4}/g);
    let allHParr;
    let actualHP;
    let allHP;
    if(allUserHPItem){
        allHParr = allUserHPItem[0].split('/');
        actualHP = allHParr[0];
        allHP = allHParr[1];
    }


    const weaponActiveSkill = document.getElementById("aps_button");//активный навык оружия
    const characterActiveSkill = document.getElementById("apm_button");//активный навык персонажа

    const npcSkillsItems = document.getElementsByClassName('greenbutton'); //все навыки нпс
    const weaponActiveSkillNPC = npcSkillsItems[1];
    const characterActiveSkillNPC = npcSkillsItems[0];


    if(weaponActiveSkill){
        weaponActiveSkill.click();
    };

    //перевязка
    if(characterActiveSkill){
        if((+actualHP/+allHP) < 0.7){
            characterActiveSkill.click();
        }
    };

    if(weaponActiveSkillNPC && (weaponActiveSkillNPC.querySelectorAll('a > img')[0].title === weaponActiveSkillNPCTitle)){
        weaponActiveSkillNPC.click();
    };

    //медик от нпс
    if(characterActiveSkillNPC && (characterActiveSkillNPC.querySelectorAll('a > img')[0].title === characterActiveSkillNPCTitle)){
        if((+actualHP/+allHP) < 0.7){
           characterActiveSkillNPC.click();
        }
    };


})();