const api_key = "k_v120oulk";
const SERIES_URL = "https://imdb-api.com/en/API/SeasonEpisodes/" + api_key + "/";
const TOP_250_URL = "https://imdb-api.com/API/AdvancedSearch/" + api_key + "?title_type=tv_series&num_votes=20000,&count=250&sort=num_votes,desc";


const targetTable = document.querySelector(".ratingsTable");
const search = document.querySelector(".search");
const optionList = document.getElementById("search");
const loadStatus = document.querySelector(".loadStatus");

async function getSeasonRatings(seriesID, seasonNumber) {
    const promise = await fetch(SERIES_URL + seriesID + "/" + seasonNumber);
    console.log("Fetching:");
    console.log(SERIES_URL + seriesID + "/" + seasonNumber);
    const processedData = await promise.json();
    if (processedData.episodes.length === 0) {
        return 0;
    }
    let allEpisodeRatings = [];
    for (let i = 0; i < processedData.episodes.length; i++) {
        allEpisodeRatings.push(processedData.episodes[i].imDbRating);
    }
    return allEpisodeRatings;
}

async function loadTop250() {
    let promise = await fetch(TOP_250_URL);
    let processedData = await promise.json();
    let titleIds = [];
    for (let i = 0; i < processedData.results.length; i++) {
        let titleId = [processedData.results[i].id, processedData.results[i].title];
        titleIds.push(titleId);
        addOption(titleId[1]);
    }
    return titleIds;
}

function addOption(value) {
    let option = document.createElement("option");
    option.value = value;
    optionList.appendChild(option);
}

function addTableRow(episodeRatings, seasonNumber) {
    let seasonRow = document.createElement("tr");
    seasonRow.className = `season${seasonNumber}`;
    targetTable.appendChild(seasonRow);
    for (let i = 0; i < episodeRatings.length; i++) {
        let episodeRating = document.createElement("td");
        episodeRating.className = `season${seasonNumber}episode${i}`;
        episodeRating.innerHTML = episodeRatings[i];
        seasonRow.appendChild(episodeRating);
    }
}

function findTitleId(titleIds, title) {
    for (let i = 0; i < titleIds.length; i++) {
        if (titleIds[i][1].toLowerCase() === title) {
            return titleIds[i][0];
        };
    };
}

async function createTable(titleIds) {
    console.log(titleIds);
    let title = search.value.toLowerCase();
    let titleId = findTitleId(titleIds, title);
    let seasonNumber = 1;

    while (seasonNumber < 10) {
        let seasonRatings = await getSeasonRatings(titleId, seasonNumber);
        if (seasonRatings === 0) {
            break;
        };
        addTableRow(seasonRatings, seasonNumber);
        seasonNumber++;
}
}

async function init() {
    const titleIds = await loadTop250();
    console.log("Loaded top 250");
    console.log(titleIds);
    search.disabled = false;
    search.addEventListener("change", function() {
        createTable(titleIds)
    });
    loadStatus.innerHTML = "Ready!";
    loadStatus.style.color = "green";
    console.log("enabled search");
}

init();
