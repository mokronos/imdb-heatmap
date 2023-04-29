const api_key = "k_v120oulk";
const SERIES_URL = "./data/";
const TITLE_ID_URL = "./data/titleId.json";


const targetTable = document.querySelector(".ratingsTable");
const search = document.querySelector(".search");
const optionList = document.getElementById("search");
const loadStatus = document.querySelector(".loadStatus");

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
    });
}

function findTitleId(titleIds, title) {
    for (let i = 0; i < titleIds.length; i++) {
        if (titleIds[i].title.toLowerCase() === title) {
            return titleIds[i].id;
        };
    };
}

async function createTable(titleIds) {
    let title = search.value.toLowerCase();
    let titleId = findTitleId(titleIds, title);
    console.log(titleId);
    console.log(SERIES_URL + titleId + ".json");
    const promise = await fetch(SERIES_URL + titleId + ".json");
    const allRatings = await promise.json();
    console.log(allRatings);
    seasonNumber = 1;
    allRatings.forEach(seasonRatings => {
        addTableRow(seasonRatings, seasonNumber);
        seasonNumber++;
    });
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
    console.log(titleIds);
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
