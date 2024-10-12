// ==UserScript==
// @name         Yandex Wikipedia Info
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Добавляет дополнительную информацию из Wikipedia в боковую панель поиска Yandex.
// @author       zzakhar
// @match        *://yandex.ru/*
// @grant        GM_xmlhttpRequest
// @connect      ru.wikipedia.org
// ==/UserScript==

(function() {
    'use strict';

    function CreateRightBox() {
        const searchResultAside = document.querySelector('#search-result-aside');
        const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

        if (searchResultAside && (searchResultAside.innerHTML.trim() === '' || !searchResultAside.querySelector('div[role="complementary"]'))) {
            const queryText = new URLSearchParams(window.location.search).get('text');

            if (queryText && queryText.length < 30) {
                const wikiUrl = `https://ru.wikipedia.org/wiki/${encodeURIComponent(queryText)}`;

                GM_xmlhttpRequest({
                    method: "GET",
                    url: wikiUrl,
                    onload: function(response) {
                        if (response.status === 200) {
                            const doc = new DOMParser().parseFromString(response.responseText, 'text/html');
                            const toc = doc.getElementById('toc');
                            const infobox = doc.querySelector('#mw-content-text .infobox');

                            if (toc || infobox) {
                                const infoDiv = document.createElement('div');
                                infoDiv.setAttribute('role', 'complementary');
                                infoDiv.setAttribute('aria-label', 'Дополнительная информация по запросу');
                                infoDiv.className = 'serp-list serp-list_right_yes serp-list_complementary_yes';
                                infoDiv.style.cssText = `
                                    padding: 15px;
                                    border-radius: 10px;
                                    margin-top: 10px;
                                    display: block;
                                    max-width: 90%;
                                    opacity: 0;
                                    transition: opacity 0.5s ease;
                                    ${isDarkMode ? `
                                        background-color: #0e1011;
                                        border: 2px solid #970e05;
                                        color: white;
                                    ` : `
                                        background-color: #f9f9f9;
                                        border: 2px solid #007BFF;
                                        color: black;
                                    `}
                                `;

                                const title = doc.querySelector('h1').textContent;
                                const titleElement = document.createElement('h2');
                                titleElement.textContent = title;
                                titleElement.style.cssText = `
                                    margin: 0 0 20px;
                                    font-size: 18px;
                                    font-weight: bold;
                                    transition: color 0.3s ease;
                                    ${isDarkMode ? `color: #ffcccc;` : `color: #007BFF;`}
                                `;
                                infoDiv.appendChild(titleElement);

                                const contentDiv = document.createElement('div');
                                contentDiv.style.cssText = `
                                    margin-top: 10px;
                                    max-height: 600px;
                                    overflow-y: auto;
                                    transition: color 0.3s ease;
                                    ${isDarkMode ? `color: #e5e5e5;` : `color: #333;`}
                                    scrollbar-width: thin;
                                    scrollbar-color: ${isDarkMode ? '#333 #222' : '#ccc #f0f0f0'};
                                `;
                                contentDiv.style.cssText += `
                                    ::-webkit-scrollbar { width: 6px; }
                                    ::-webkit-scrollbar-thumb { background-color: ${isDarkMode ? '#555' : '#ccc'}; border-radius: 10px; }
                                    ::-webkit-scrollbar-track { background-color: ${isDarkMode ? '#222' : '#f0f0f0'}; }
                                `;

                                const logo = doc.querySelector('.infobox img');
                                if (logo) {
                                    const logoImg = document.createElement('img');
                                    logoImg.src = logo.src;
                                    logoImg.alt = title;
                                    logoImg.style.cssText = `
                                        max-width: 100px;
                                        border-radius: 10px;
                                        margin-left: 10px;
                                        float: right;
                                        transition: box-shadow 0.3s ease;
                                    `;
                                    contentDiv.appendChild(logoImg);
                                }

                                doc.querySelectorAll('.mw-heading').forEach(element => element.remove());

                                const contentElements = doc.querySelectorAll('#mw-content-text p, #mw-content-text ul, #mw-content-text h2');
                                let wordCount = 0, stopAdding = false;

                                contentElements.forEach(element => {
                                    if (element.closest('#toc')) return;

                                    const spanToRemove = element.querySelector('span.mw-editsection');
                                    if (spanToRemove) spanToRemove.style.display = 'none';

                                    const links = element.querySelectorAll('a');
                                    links.forEach(link => {
                                        const parent = link.parentNode;
                                        parent.insertBefore(document.createTextNode(link.textContent), link);
                                        parent.removeChild(link);
                                    });

                                    if ((element.tagName === 'H2' && (element.id === 'Примечания' || element.textContent.trim() === 'Примечания')) ||
                                        (element.tagName === 'DIV' && element.classList.contains('mw-heading') && element.textContent.trim().includes('Примечания'))) {
                                        stopAdding = true;
                                    }
                                    if (stopAdding) return;

                                    const elementText = element.textContent.trim();
                                    const elementWordCount = elementText.split(/\s+/).length;

                                    if (wordCount + elementWordCount > 400) {
                                        const remainingWords = 400 - wordCount;
                                        const trimmedText = elementText.split(/\s+/).slice(0, remainingWords).join(' ');
                                        const trimmedElement = document.createElement(element.tagName);
                                        trimmedElement.textContent = `${trimmedText}...`;
                                        contentDiv.appendChild(trimmedElement);
                                        stopAdding = true;
                                        return;
                                    }

                                    const clone = element.cloneNode(true);
                                    contentDiv.appendChild(clone);
                                    wordCount += elementWordCount;
                                });

                                const sourceText = document.createElement('p');
                                sourceText.textContent = "Источник: Wikipedia";
                                sourceText.style.cssText = `
                                    margin-top: 10px;
                                    font-size: 12px;
                                    text-align: right;
                                    ${isDarkMode ? 'color: #e5e5e5;' : 'color: #333;'}
                                `;
                                infoDiv.appendChild(contentDiv);
                                infoDiv.appendChild(sourceText);
                                searchResultAside.appendChild(infoDiv);

                                setTimeout(() => {
                                    infoDiv.style.opacity = '1';
                                }, 100);
                            }
                        } else if (response.status === 429) {
                            console.error("Слишком много запросов, попробуйте позже.");
                        }
                    },
                    onerror: function() {
                        console.error("Ошибка при запросе к Википедии.");
                    }
                });
            }
        }
    }

    window.addEventListener('load', () => {
        setTimeout(CreateRightBox, 1000);
    });
})();
