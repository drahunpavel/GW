export default function pickUpLoot() {
    const takeButton = document.getElementById("takebutt"); //кнопка "Взять"
    const lootDescription = document.getElementsByClassName('wb')[5];
    const loot = lootDescription.querySelectorAll('td > b')[1].innerText;

    if (takeButton && loot) {
        if (loot === lootName2 || loot === lootName3) {
            takeButton.click();
        };
    };
};