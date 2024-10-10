// ==UserScript==
// @namespace      https://openuserjs.org/users/zzakhar
// @name           Yandex CleanSearch
// @name-ru        Yandex CleanSearch
// @version        2.8
// @description    Блокировка страниц по домену и заголовкам, рекламы и прочего дерьма в Яндекс.
// @author         zzakhar
// @match          https://yandex.ru/search/*
// @exclude        https://yandex.ru/search/?text=*&lr=*
// @grant          GM_xmlhttpRequest
// @icon           https://avatars.mds.yandex.net/i?id=6a46c4318776cd395ef17ab922147471976ebe7d-3569718-images-thumbs&n=13
// @copyright      2024, zzakhar (https://openuserjs.org/users/zzakhar)
// @license        MIT
// ==/UserScript==

// ==UserLibrary==
// @name           Yandex CleanSearch Library
// @description    Библиотека для поддержки функциональности скрипта Yandex CleanSearch
// @author         zzakhar
// @copyright      2024, zzakhar (https://openuserjs.org/users/zzakhar)
// @license        MIT
// @version        2.8.0
// ==/UserLibrary==

(function() {
    'use strict';

    // Дб локал
    let blockedSites = JSON.parse(localStorage.getItem('blockedSites')) || [];

    let blockedPropagandaCount = 0;
    let blockedAdsCount = 0;
    let blockedPropaganda = [];
    let isHidden = true;

    // счетчик
    function updateBlockCounter() {
        const resultsContainer = document.querySelector('.main__center');
        let counterCard = resultsContainer.querySelector('.blocked-counter-card');

        if (!counterCard) {
            counterCard = document.createElement('div');
            counterCard.className = 'blocked-counter-card';
            counterCard.style.backgroundColor = '#300';
            counterCard.style.color = '#ffffff';
            counterCard.style.padding = '10px';
            counterCard.style.marginBottom = '10px';
            counterCard.style.border = '1px solid #600';
            counterCard.style.borderRadius = '5px';
            counterCard.style.maxWidth = '34%';
            counterCard.style.overflow = 'auto';
            resultsContainer.prepend(counterCard);
        }

        const counterText = `Заблокировано: ${blockedPropagandaCount} пророссийской пропаганды и ${blockedAdsCount} рекламы`;
        let textElement = counterCard.querySelector('.counter-text');
        if (!textElement) {
            textElement = document.createElement('div');
            textElement.className = 'counter-text';
            counterCard.appendChild(textElement);
        }
        textElement.textContent = counterText;

        updateButtons(counterCard);
    }

    // смена кнопок
    function updateButtons(counterCard) {
        let showButton = counterCard.querySelector('.show-button');
        let removeButton = counterCard.querySelector('.remove-button');

        if (blockedPropagandaCount > 0 || blockedAdsCount > 0) {
            counterCard.style.display = 'flex';
            counterCard.style.justifyContent = 'space-between';
            counterCard.style.alignItems = 'center';

            if (isHidden) {
                if (!showButton) {
                    showButton = document.createElement('button');
                    showButton.className = 'show-button';
                    showButton.textContent = 'Показать';
                    showButton.style.backgroundColor = '#007bff';
                    showButton.style.color = '#ffffff';
                    showButton.style.border = 'none';
                    showButton.style.borderRadius = '5px';
                    showButton.style.padding = '5px 10px';
                    showButton.style.cursor = 'pointer';
                    showButton.style.marginLeft = '10px';
                    showButton.onclick = showBlockedPropaganda;

                    counterCard.appendChild(showButton);
                }

                if (removeButton) {
                    removeButton.remove();
                }
            } else {
                if (!removeButton) {
                    removeButton = document.createElement('button');
                    removeButton.className = 'remove-button';
                    removeButton.textContent = 'Убрать';
                    removeButton.style.backgroundColor = '#dc3545';
                    removeButton.style.color = '#ffffff';
                    removeButton.style.border = 'none';
                    removeButton.style.borderRadius = '5px';
                    removeButton.style.padding = '5px 10px';
                    removeButton.style.cursor = 'pointer';
                    removeButton.style.marginLeft = '10px';
                    removeButton.onclick = hideBlockedPropaganda;

                    counterCard.appendChild(removeButton);
                }

                if (showButton) {
                    showButton.remove();
                }
            }
        } else {
            if (showButton) {
                showButton.remove();
            }
            if (removeButton) {
                removeButton.remove();
            }
        }
    }
    // Мейн функция поиска
    function blockLinksAndAds() {
        const results = document.querySelectorAll('.serp-item');

        blockedPropagandaCount = 0;
        blockedAdsCount = 0;
        blockedPropaganda = [];

        results.forEach(result => {
            const isAd = checkIfAd(result);
            const link = result.querySelector('a.Link');
            const title = result.querySelector('.OrganicTitle-LinkText');

            if (link && title) {
                const href = link.href.toLowerCase();
                const titleText = title.textContent.toLowerCase();

                const isBlocked = blockedSites.some(site => href.includes(site) || titleText.includes(site));

                if (isAd) {
                    result.style.display = 'none';
                    blockedAdsCount++;
                } else if (isBlocked) {
                    result.style.display = 'none';
                    blockedPropagandaCount++;
                    blockedPropaganda.push(result);
                    console.log("Заблокирована дичь: ", result);
                }
            }
        });

        const containerToHide = document.querySelector("body > main > div > div.main__container > div > div > div.content__left > div.VanillaReact.RelatedBottom");
        if (containerToHide) {
            containerToHide.style.display = 'none';
            console.log("Рекомендациии скрыты.");
        }

        updateBlockCounter();
    }

    //
    function checkIfAd(result) {
        const adTextIndicators = ['реклама', 'баннер',"ad","advertise"];
        return adTextIndicators.some(text => result.textContent.toLowerCase().includes(text));
    }

    // Показать бтн
    function showBlockedPropaganda() {
        console.log("Показать");
        if (isHidden) {
            blockedPropaganda.forEach(prop => {
                prop.style.display = 'block';
            });
            isHidden = false;
            updateButtons(document.querySelector('.blocked-counter-card'));
        }
    }

    // Скрыть бтн
    function hideBlockedPropaganda() {
        console.log("Кнопка 'Убрать' нажата!");
        if (!isHidden) {
            blockedPropaganda.forEach(prop => {
                prop.style.display = 'none';
            });
            isHidden = true;
            updateButtons(document.querySelector('.blocked-counter-card'));
        }
    }

    // дб
     function saveBlockedSites() {
        localStorage.setItem('blockedSites', JSON.stringify(blockedSites));
    }
    window.addEventListener('load', () => {
        blockLinksAndAds();
    });
    //основной цикл
    const observer = new MutationObserver(() => {
        if (isHidden) {
            blockLinksAndAds();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    // настройки


    function resetBlockedSites() {
        blockedSites.length = 0;
        saveBlockedSites();
        updateBlockedSitesList();
        setTimeout(() => {
            location.reload(); // релоад
        }, 2000);
        showNotification('Все заблокированные сайты были очищены.');
    }
    function updateBlockedSitesList() {
        const list = document.getElementById('blockedSitesList');
        list.innerHTML = '';
        blockedSites.forEach(site => {
            const li = document.createElement('li');
            li.textContent = site;
            list.appendChild(li);
        });
    }
    function createPopup() {
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: #0e1011;
    border: 2px solid #970e05; /* Цвет рамки */
    border-radius: 10px; /* Скругленные углы */
    box-shadow: 0 0 15px #4c0803, 0 0 30px #8b0903;
    padding: 20px;
    z-index: 9999;
    display: none;
    width: 300px;
    max-width: 90%;
    transition: transform 0.3s ease, opacity 0.3s ease;
    opacity: 0;
`;

        popup.innerHTML = `
    <h3>Yandex CleanSearch</h3>
    <input type="text" id="siteInput" placeholder="Домен или заголовок (Например: rutube.ru)"
           style="width: 90%; padding: 10px; margin-bottom: 10px;">
    <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 10px;">
        <button id="blockSiteBtn" style="
            background-color: red;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease;
        ">Заблокировать</button>
        <button id="unblockSiteBtn" style="
            background-color: green;
            color: white;
            border: none;
            border-radius: 20px;
            padding: 10px 20px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.3s ease;
        ">Разблокировать</button>
    </div>
    <div style="display: flex; align-items: center; justify-content: space-between;">
        <h4 style="margin: 0;">Заблокированные сайты:</h4>
        <button id="resetBtn" style="
            background-color: orange;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 5px 10px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.3s ease;
        ">Сбросить</button>
    </div>
    <ul id="blockedSitesList" style="max-height: 80px; overflow-y: auto;"></ul>
    <span id="closePopupBtn" style="
        position: absolute;
        top: 10px;
        right: 10px;
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
    ">&times;</span>
`;


        document.body.appendChild(popup);

        document.getElementById('blockSiteBtn').addEventListener('click', blockSite);
        document.getElementById('unblockSiteBtn').addEventListener('click', unblockSite);
        document.getElementById('closePopupBtn').addEventListener('click', () => {
            popup.style.display = 'none';
        });
        document.getElementById('resetBtn').addEventListener('click', resetBlockedSites);
    }

    function showPopup() {
        const popup = document.querySelector('.custom-popup');
        popup.style.display = 'block';
        popup.style.opacity = '1';
        popup.style.transform = 'translate(-50%, -50%) scale(1.05)'; // анимация
        updateBlockedSitesList();
    }

   function showNotification(message) {
       const notification = document.createElement('div');
       notification.className = 'notification';
       notification.innerText = message;
       notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background-color: #4caf50; /* Зеленый цвет для успешного уведомления */
        color: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        z-index: 10000;
        opacity: 0;
        transform: translateY(-20px);
        transition: opacity 0.5s, transform 0.5s;
    `;

       document.body.appendChild(notification);
       setTimeout(() => {
           notification.style.opacity = '1';
           notification.style.transform = 'translateY(0)';
       }, 100);
       setTimeout(() => {
           notification.style.opacity = '0';
           notification.style.transform = 'translateY(-20px)';
           setTimeout(() => {
               document.body.removeChild(notification);
           }, 500);
       }, 3000);
   }

    function blockSite() {
        const site = document.getElementById('siteInput').value.toLowerCase();
        if (site && !blockedSites.includes(site)) {
            blockedSites.push(site);
            saveBlockedSites();
            updateBlockedSitesList();
            showNotification(`${site} has been blocked.`);
        } else {
            showNotification('Site is already blocked or input is empty.');
        }
    }

    function unblockSite() {
        const site = document.getElementById('siteInput').value.toLowerCase();
        const index = blockedSites.indexOf(site);

        if (index !== -1) {
            blockedSites.splice(index, 1);
            saveBlockedSites();
            showNotification(`${site} has been unblocked.`);
            setTimeout(() => {
            location.reload();
            }, 2000);
        } else {
            showNotification('Site not found in blocked list.');
        }
    }

    function createIcon() {
    const icon = document.createElement('img');
    icon.className = 'custom-icon';
    icon.src = 'https://avatars.mds.yandex.net/i?id=6a46c4318776cd395ef17ab922147471976ebe7d-3569718-images-thumbs&n=13';
    icon.alt = 'FREEINTERNET';
    icon.style.cssText = `
        position: fixed;
        bottom: 110px; /* Подняли иконку на 100px */
        right: 30.5px; /* Сдвинули иконку левее на 20px */
        width: 55px;
        height: 55px;
        border-radius: 50%;
        cursor: pointer;
        z-index: 9999;
    `;
    document.body.appendChild(icon);

    icon.addEventListener('click', showPopup);
}

    createPopup();
    createIcon();

})();
