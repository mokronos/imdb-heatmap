const SERIES_URL = "./data/";
const TITLE_ID_URL = "./data/titleId.json";
const NO_CACHE_SUFFIX = getSuffix();

const targetTable = document.querySelector(".ratingsTable");
const search = document.querySelector(".search");
const optionList = document.getElementById("search");
const loadStatus = document.querySelector(".loadStatus");


function getSuffix(){
    const now = new Date();
    const hour = now.getUTCHours();
    let day = now.getUTCDate()
    // delay new json fetch by 6 hours after midnight UTC
    // gives github actions 6 hours to update data
    if (hour > 6) {
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
    episodeNum = 0;
    episodeRatings.forEach(episodeData => {
        let episodeRatingCell = document.createElement("td");
        let episodeRating = episodeData.rating;
        let episodeNumber = episodeData.episode;
        episodeRatingCell.className = `s${seasonNumber}ep${episodeNumber}`;
        episodeRatingCell.innerHTML = episodeRating;
        episodeRatingCell.style.backgroundColor =
            `rgb(
                ${Math.min(Math.abs(episodeRating-10) / 10 * 2, 1) * 255},
                ${Math.min(episodeRating / 10 * 2, 1) * 255},
                0)`;

        seasonRow.appendChild(episodeRatingCell);
        episodeNum++;
    });
    return episodeNum;
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
    let title = search.value.toLowerCase();
    let titleId = findTitleId(titleIds, title);

    if (titleId === 0) {
        console.log("Title not found!");
        loadStatus.innerHTML = "Title not found";
        loadStatus.style.color = "red";
        return;
    }

    const promise = await fetch(SERIES_URL + titleId + ".json");
    const allRatings = await promise.json();
    seasonNumber = 1;
    maxEpisodes = 0;
    allRatings.forEach(seasonRatings => {
        let numEpisodes = addTableRow(seasonRatings, seasonNumber);
        if (numEpisodes > maxEpisodes) {
            maxEpisodes = numEpisodes;
        }
        seasonNumber++;
    });
    addGuide(seasonNumber - 1, maxEpisodes);
}

function addGuide(maxSeasons, maxEpisodes) {
    let guideRow = document.createElement("tr");
    let guideRowCell = document.createElement("td");
    guideRowCell.className = "guideOrigin";
    // guideRowCell.innerHTML = "";
    guideRow.appendChild(guideRowCell);

    for (let i = 0; i < maxEpisodes; i++) {
        let guideRowCell = document.createElement("td");
        guideRowCell.className = "guideRowCell";
        guideRowCell.innerHTML = i + 1;
        guideRow.appendChild(guideRowCell);
    }

    guideRow.className = "guideRow";
    targetTable.insertBefore(guideRow, targetTable.firstChild);

    for (let i = 0; i < maxSeasons; i++) {
        let guideColumnCell = document.createElement("td");
        guideColumnCell.className = "guideColumnCell";
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
    console.log("enabled search");
}


init();
