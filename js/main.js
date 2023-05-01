const SERIES_URL = "./data/";
const TITLE_ID_URL = "./data/titleId.json";
const NO_CACHE_SUFFIX = getSuffix();
const IMDB_URL = "https://www.imdb.com/title/";

const targetTable = document.querySelector(".ratingsTable");
const search = document.querySelector(".search");
const optionList = document.getElementById("search");
const loadStatus = document.querySelector(".loadStatus");


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


function addTableRow(episodeRatings, seasonNumber) {
    let seasonRow = document.createElement("tr");
    seasonRow.className = `season${seasonNumber}`;
    targetTable.appendChild(seasonRow);
    episodeCount = 0;
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
        episodeLink.addEventListener("mouseover", cellHover);
        episodeRatingCell.appendChild(episodeLink);
        episodeRatingCell.className = `s${seasonNumber}ep${episodeNumber} tableCell`;
        let colors = colorValue(episodeRating);
        episodeRatingCell.style.backgroundColor = colors.backgroundcolor;
        episodeLink.style.color = colors.color;

        seasonRow.appendChild(episodeRatingCell);
        episodeCount++;
    });
    return episodeCount;
}


function colorValue(rating) {
    let backgroundcolor;
    let color
    const cutoff = 6;
    if (rating > cutoff) {
        rating -= cutoff;
        backgroundcolor = `hsl(${rating/(10-cutoff)*120}, 100%, 50%)`;
    } else {
        backgroundcolor = `hsl(0, 100%, ${rating/cutoff*50}%)`;
        color = "white";
    }
    return {backgroundcolor, color};
}


function cellHover(event) {
    // highlight season and episode from guide on hover
    let cell = event.target;
    cell.style.fontWeight = "bold";
    let classNameSplit = cell.className.split(" ")[0];
    let season = classNameSplit.split("s")[1];
    season = season.split("ep")[0];
    let episode = classNameSplit.split("ep")[1];
    let seasonClass = document.querySelector(`.s${season}`);
    let episodeClass = document.querySelector(`.ep${episode}`);
    seasonClass.style.fontWeight = "bold";
    seasonClass.style.color = "white";
    episodeClass.style.fontWeight = "bold";
    episodeClass.style.color = "white";
    cell.addEventListener("mouseout", cellUnhover);
}

function cellUnhover(event) {
    // remove highlight from season and episode on mouseout
    let cell = event.target;
    cell.style.fontWeight = "normal";
    let classNameSplit = cell.className.split(" ")[0];
    let season = classNameSplit.split("s")[1];
    season = season.split("ep")[0];
    let episode = classNameSplit.split("ep")[1];
    let seasonClass = document.querySelector(`.s${season}`);
    let episodeClass = document.querySelector(`.ep${episode}`);
    seasonClass.style.fontWeight = "normal";
    seasonClass.style.color = "black";
    episodeClass.style.fontWeight = "normal";
    episodeClass.style.color = "black";
}

function findTitleId(titleIds, title) {
    for (let i = 0; i < titleIds.length; i++) {
        if (titleIds[i].title.toLowerCase() === title) {
            return titleIds[i].id;
        };
    };
    return 0;
}


async function createTable(titleIds) {
    let title = search.value;
    let titleLower = title.toLowerCase();
    let titleId = findTitleId(titleIds, titleLower);

    if (titleId === 0) {
        console.log("Title not found!");
        loadStatus.innerHTML = "Title not found";
        loadStatus.style.color = "red";
        return;
    }

    const promise = await fetch(SERIES_URL + titleId + ".json");
    const allRatings = await promise.json();
    seasonNumber = 1;
    let maxEpisodes = 0;
    allRatings.forEach(seasonRatings => {
        let numEpisodes = addTableRow(seasonRatings, seasonNumber);
        if (numEpisodes > maxEpisodes) {
            maxEpisodes = numEpisodes;
        }
        seasonNumber++;
    });
    addGuide(seasonNumber - 1, maxEpisodes);
    loadStatus.innerHTML = search.value;
    loadStatus.style.color = "white";
    document.title = `Series Heatmap - ${title}`;
    setUrl(title);
    search.value = "";

}

function addGuide(maxSeasons, maxEpisodes) {
    let guideRow = document.createElement("tr");
    let guideRowCell = document.createElement("td");
    guideRowCell.className = "guideOrigin";
    guideRowCell.innerHTML = "S\\E";
    guideRow.appendChild(guideRowCell);

    for (let i = 0; i < maxEpisodes; i++) {
        let guideRowCell = document.createElement("td");
        guideRowCell.className = `guideRowCell tableCell ep${i+1}`;
        guideRowCell.innerHTML = i + 1;
        guideRow.appendChild(guideRowCell);
    }

    guideRow.className = "guideRow";
    targetTable.insertBefore(guideRow, targetTable.firstChild);

    for (let i = 0; i < maxSeasons; i++) {
        let guideColumnCell = document.createElement("td");
        guideColumnCell.className = `guideColumnCell tableCell s${i+1}`;
        guideColumnCell.innerHTML = i + 1;
        let seasonClass = document.querySelector(`.season${i+1}`);
        seasonClass.insertBefore(guideColumnCell, seasonClass.firstChild);
    }
        
}


function cleanTable() {
    while (targetTable.firstChild) {
        targetTable.removeChild(targetTable.firstChild);
    }
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
    loadStatus.innerHTML = "Ready!";
    loadStatus.style.color = "green";
    checkUrl();
    search.focus();
    console.log("enabled search");
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
    newUrl = window.location.pathname + "?" + url.searchParams.toString();
    history.pushState({}, "", newUrl);
}


function getUrl() {
    let url = new URL(window.location);
    let title = url.searchParams.get("title");
    return title;
}


init();
