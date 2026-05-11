const SERIES_URL = "./data/";
const TITLE_ID_URL = "./data/titleId.json";
const NO_CACHE_SUFFIX = getSuffix();
const IMDB_URL = "https://www.imdb.com/title/";

const targetTable = document.getElementById("ratings-table");
const search = document.getElementById("search-input");
const optionList = document.getElementById("search");
const loadStatus = document.getElementById("load-status");
const showTitleBar = document.getElementById("show-title-bar");
const showTitleEl = document.getElementById("show-title");
const imdbLink = document.getElementById("imdb-link");
const legend = document.getElementById("legend");
const tooltip = document.getElementById("tooltip");


function getSuffix(){
    const now = new Date();
    const hour = now.getUTCHours();
    let day = now.getUTCDate()
    // delay new json fetch by 8 hours after midnight UTC
    // gives github actions 8 hours to update data
    if (hour > 8) {
        day--;
    };
    const utc_time = `${now.getUTCFullYear()}${now.getUTCMonth()}${day}`;
    const test_suffix = `?nocache=${utc_time.toString(16)}`;
    return test_suffix;
}


async function loadTopSeries() {
    let promise = await fetch(TITLE_ID_URL);
    let processedData = await promise.json();
    return processedData;
}


function addOption(value) {
    let option = document.createElement("option");
    option.value = value;
    optionList.appendChild(option);
}


function addToSearch(titleIds) {
    titleIds.forEach(titleId => {
        addOption(titleId.title);
    });
}


/* ============================================
   COLOR SCALE — refined for visual clarity
   ============================================ */
function colorValue(rating) {
    let backgroundColor;
    let color;
    const cutoff = 6;
    if (rating > cutoff) {
        const normalized = (rating - cutoff) / (10 - cutoff);
        backgroundColor = `hsl(${normalized * 120}, 75%, 45%)`;
        color = "#fff";
    } else {
        const lightness = (rating / cutoff) * 40 + 10;
        backgroundColor = `hsl(0, 70%, ${lightness}%)`;
        color = "#fff";
    }
    return [backgroundColor, color];
}


/* ============================================
   TABLE RENDERING
   ============================================ */
function addTableRow(episodeRatings, seasonNumber) {
    let seasonRow = document.createElement("tr");
    seasonRow.className = `season${seasonNumber}`;
    targetTable.appendChild(seasonRow);
    let episodeCount = 0;

    episodeRatings.forEach(episodeData => {
        let episodeRating = episodeData.rating;
        let episodeNumber = episodeData.episode;
        let episodeId = episodeData.id;
        let episodeUrl = `${IMDB_URL}${episodeId}/`;

        let episodeRatingCell = document.createElement("td");
        let episodeLink = document.createElement("a");
        episodeLink.href = episodeUrl;
        episodeLink.target = "_blank";
        episodeLink.innerHTML = episodeRating;
        episodeLink.className = `s${seasonNumber}ep${episodeNumber} episodeLink`;

        // Store metadata for tooltip
        episodeLink.dataset.season = seasonNumber;
        episodeLink.dataset.episode = episodeNumber;
        episodeLink.dataset.rating = episodeRating;

        episodeLink.addEventListener("mouseover", cellHover);
        episodeLink.addEventListener("mouseout", cellUnhover);
        episodeLink.addEventListener("mousemove", moveTooltip);

        episodeRatingCell.appendChild(episodeLink);
        episodeRatingCell.className = `s${seasonNumber}ep${episodeNumber} tableCell`;

        let [backgroundColor, textColor] = colorValue(episodeRating);
        episodeRatingCell.style.backgroundColor = backgroundColor;
        episodeLink.style.color = textColor;

        seasonRow.appendChild(episodeRatingCell);
        episodeCount++;
    });
    return episodeCount;
}


/* ============================================
   TOOLTIP
   ============================================ */
function moveTooltip(event) {
    tooltip.style.left = event.clientX + 12 + "px";
    tooltip.style.top = event.clientY - 40 + "px";
}

function showTooltip(season, episode, rating) {
    tooltip.innerHTML = `S${season} E${episode} — <strong>${rating}</strong>`;
    tooltip.classList.add("visible");
}

function hideTooltip() {
    tooltip.classList.remove("visible");
}


/* ============================================
   HOVER — highlight guides + tooltip
   ============================================ */
function cellHover(event) {
    let cell = event.target;
    let season = cell.dataset.season;
    let episode = cell.dataset.episode;
    let rating = cell.dataset.rating;

    // Highlight guide cells
    let seasonGuide = document.querySelector(`.s${season}.guideColumnCell`);
    let episodeGuide = document.querySelector(`.ep${episode}.guideRowCell`);

    if (seasonGuide) seasonGuide.classList.add("highlight");
    if (episodeGuide) episodeGuide.classList.add("highlight");

    showTooltip(season, episode, rating);
}

function cellUnhover(event) {
    let cell = event.target;
    let season = cell.dataset.season;
    let episode = cell.dataset.episode;

    let seasonGuide = document.querySelector(`.s${season}.guideColumnCell`);
    let episodeGuide = document.querySelector(`.ep${episode}.guideRowCell`);

    if (seasonGuide) seasonGuide.classList.remove("highlight");
    if (episodeGuide) episodeGuide.classList.remove("highlight");

    hideTooltip();
}


function findTitleId(titleIds, titleLower) {
    let id;
    let title;
    for (let i = 0; i < titleIds.length; i++) {
        if (titleIds[i].title.toLowerCase() === titleLower) {
            id = titleIds[i].id;
            title = titleIds[i].title;
            return [id, title];
        };
    };
    return [0,0];
}


async function createTable(titleIds) {
    let searchValue = search.value;
    let searchLower = searchValue.toLowerCase();
    let [id, title] = findTitleId(titleIds, searchLower);

    if (id === 0) {
        console.log("Title not found!");
        loadStatus.innerHTML = "Title not found — try another search";
        loadStatus.className = "load-status error";
        showTitleBar.style.display = "none";
        legend.style.display = "none";
        return;
    }

    const promise = await fetch(SERIES_URL + id + ".json");
    const allRatings = await promise.json();
    let seasonNumber = 1;
    let maxEpisodes = 0;
    allRatings.forEach(seasonRatings => {
        let numEpisodes = addTableRow(seasonRatings, seasonNumber);
        if (numEpisodes > maxEpisodes) {
            maxEpisodes = numEpisodes;
        }
        seasonNumber++;
    });
    addGuide(seasonNumber - 1, maxEpisodes);

    // Update show title bar
    showTitleEl.textContent = title;
    imdbLink.href = `${IMDB_URL}${id}/`;
    showTitleBar.style.display = "flex";
    showTitleBar.style.animation = "none";
    // Trigger reflow to restart animation
    showTitleBar.offsetHeight;
    showTitleBar.style.animation = "";

    // Show legend
    legend.style.display = "flex";

    // Update load status
    loadStatus.innerHTML = `Showing ${seasonNumber - 1} seasons`;
    loadStatus.className = "load-status showing";

    document.title = `IMDb Heatmap — ${title}`;
    if (getUrl() !== title) {
        setUrl(title);
    }
    search.value = "";
}


function addGuide(maxSeasons, maxEpisodes) {
    let guideRow = document.createElement("tr");
    let guideRowCell = document.createElement("td");
    guideRowCell.className = "guideOrigin tableCell";
    guideRowCell.innerHTML = "S \\ E";
    guideRow.appendChild(guideRowCell);

    for (let i = 0; i < maxEpisodes; i++) {
        let cell = document.createElement("td");
        cell.className = `guideRowCell tableCell ep${i+1}`;
        cell.innerHTML = i + 1;
        guideRow.appendChild(cell);
    }

    guideRow.className = "guideRow";
    targetTable.insertBefore(guideRow, targetTable.firstChild);

    for (let i = 0; i < maxSeasons; i++) {
        let cell = document.createElement("td");
        cell.className = `guideColumnCell tableCell s${i+1}`;
        cell.innerHTML = i + 1;
        let seasonClass = document.querySelector(`.season${i+1}`);
        seasonClass.insertBefore(cell, seasonClass.firstChild);
    }
}


function cleanTable() {
    while (targetTable.firstChild) {
        targetTable.removeChild(targetTable.firstChild);
    }
    showTitleBar.style.display = "none";
    legend.style.display = "none";
}


async function init() {
    const titleIds = await loadTopSeries();
    addToSearch(titleIds);
    console.log("Loaded search data");
    search.disabled = false;
    search.addEventListener("change", function() {
        cleanTable();
        createTable(titleIds)
    });
    window.addEventListener("popstate", checkUrl);

    loadStatus.innerHTML = "Ready — search for a show above";
    loadStatus.className = "load-status ready";

    console.log("enabled search");
    checkUrl();
    search.focus();
}


function checkUrl() {
    let title = getUrl();
    if (title) {
        search.value = title;
        search.dispatchEvent(new Event("change"));
    }
}


function setUrl(title) {
    let url = new URL(window.location);
    url.searchParams.set("title", title);
    let newUrl = window.location.pathname + "?" + url.searchParams.toString();
    history.pushState({}, "", newUrl);
}


function getUrl() {
    let url = new URL(window.location);
    let title = url.searchParams.get("title");
    return title;
}


init();
