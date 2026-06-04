const SERIES_URL = "./data/";
const TITLE_ID_URL = "./data/titleId.json";
const NO_CACHE_SUFFIX = getSuffix();
const IMDB_URL = "https://www.imdb.com/title/";

const targetTable = document.querySelector(".ratingsTable");
const search = document.querySelector(".search");
const optionList = document.querySelector(".optionlist");
const loadStatus = document.querySelector(".loadStatus");
const showPoster = document.querySelector(".showPoster");
const fontWeightNormal = "700";
const fontWeightBig = "900";
const maxSuggestions = 8;
let selectedShowId = null;


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


function getPosterUrl(id) {
    return `https://images.metahub.space/poster/medium/${id}/img`;
}


function getDisplayTitle(titleId) {
    if (titleId.startYear && titleId.startYear !== "\\N") {
        return `${titleId.title} (${titleId.startYear})`;
    }
    return titleId.title;
}


function clearSuggestions() {
    optionList.innerHTML = "";
    optionList.hidden = true;
}


function findSuggestions(titleIds, query) {
    const queryLower = query.trim().toLowerCase();
    if (!queryLower) {
        return [];
    }

    return titleIds.filter(titleId => {
        const displayTitle = getDisplayTitle(titleId).toLowerCase();
        const id = titleId.id.toLowerCase();
        return displayTitle.includes(queryLower) || id.includes(queryLower);
    }).slice(0, maxSuggestions);
}


function renderSuggestions(titleIds) {
    const suggestions = findSuggestions(titleIds, search.value);
    optionList.innerHTML = "";

    if (!suggestions.length) {
        clearSuggestions();
        return;
    }

    suggestions.forEach(titleId => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "option";
        button.textContent = getDisplayTitle(titleId);
        button.addEventListener("mousedown", function(event) {
            event.preventDefault();
        });
        button.addEventListener("click", function() {
            selectedShowId = titleId.id;
            search.value = getDisplayTitle(titleId);
            clearSuggestions();
            search.dispatchEvent(new Event("change"));
        });
        optionList.appendChild(button);
    });

    optionList.hidden = false;
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
        episodeLink.innerHTML = episodeRating.toFixed(1);
        episodeLink.className = `s${seasonNumber}ep${episodeNumber} episodeLink`;
        episodeLink.addEventListener("mouseover", cellHover);
        episodeRatingCell.appendChild(episodeLink);
        episodeRatingCell.className = `s${seasonNumber}ep${episodeNumber} tableCell`;
        let [backgroundColor, color] = colorValue(episodeRating);
        episodeRatingCell.style.backgroundColor = backgroundColor;
        episodeLink.style.color = color;

        seasonRow.appendChild(episodeRatingCell);
        episodeCount++;
    });
    return episodeCount;
}


function colorValue(rating) {
    let backgroundColor;
    let color
    const cutoff = 6;
    if (rating > cutoff) {
        rating -= cutoff;
        backgroundColor = `hsl(${rating/(10-cutoff)*120}, 100%, 50%)`;
    } else {
        backgroundColor = `hsl(0, 100%, ${rating/cutoff*50}%)`;
        color = "white";
    }
    return [backgroundColor, color];
}


function cellHover(event) {
    // highlight season and episode from guide on hover
    let cell = event.target;
    cell.style.fontWeight = fontWeightBig;
    let classNameSplit = cell.className.split(" ")[0];
    let season = classNameSplit.split("s")[1];
    season = season.split("ep")[0];
    let episode = classNameSplit.split("ep")[1];
    let seasonClass = document.querySelector(`.s${season}`);
    let episodeClass = document.querySelector(`.ep${episode}`);
    seasonClass.style.fontWeight = fontWeightBig;
    seasonClass.style.color = "white";
    episodeClass.style.fontWeight = fontWeightBig;
    episodeClass.style.color = "white";
    cell.addEventListener("mouseout", cellUnhover);
}

function cellUnhover(event) {
    // remove highlight from season and episode on mouseout
    let cell = event.target;
    cell.style.fontWeight = fontWeightNormal;
    let classNameSplit = cell.className.split(" ")[0];
    let season = classNameSplit.split("s")[1];
    season = season.split("ep")[0];
    let episode = classNameSplit.split("ep")[1];
    let seasonClass = document.querySelector(`.s${season}`);
    let episodeClass = document.querySelector(`.ep${episode}`);
    seasonClass.style.fontWeight = fontWeightNormal;
    seasonClass.style.color = "black";
    episodeClass.style.fontWeight = fontWeightNormal;
    episodeClass.style.color = "black";
}

function findTitleId(titleIds, titleLower) {
    for (let i = 0; i < titleIds.length; i++) {
        const displayTitle = getDisplayTitle(titleIds[i]);
        const title = titleIds[i].title;
        const displayTitleWithId = titleIds[i].displayTitle;
        if (
            displayTitle.toLowerCase() === titleLower ||
            title.toLowerCase() === titleLower ||
            (displayTitleWithId && displayTitleWithId.toLowerCase() === titleLower) ||
            titleIds[i].id.toLowerCase() === titleLower
        ) {
            return titleIds[i];
        };
    };
    return null;
}


async function createTable(titleIds) {
    let searchValue = search.value;
    let searchLower = searchValue.toLowerCase();
    let show = selectedShowId
        ? findTitleId(titleIds, selectedShowId.toLowerCase())
        : findTitleId(titleIds, searchLower);
    selectedShowId = null;

    if (!show) {
        console.log("Title not found!");
        loadStatus.innerHTML = "Title not found";
        loadStatus.style.color = "red";
        showPoster.hidden = true;
        return;
    }

    const id = show.id;
    const title = getDisplayTitle(show);
    const promise = await fetch(SERIES_URL + id + ".json");
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
    loadStatus.innerHTML = title;
    loadStatus.style.color = "white";
    showPoster.src = getPosterUrl(id);
    showPoster.hidden = false;
    document.title = `Series Heatmap - ${title}`;
    if (getUrl() !== id) {
        setUrl(id);
    }
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
    console.log("Loaded search data");
    search.disabled = false;
    search.addEventListener("input", function() {
        selectedShowId = null;
        renderSuggestions(titleIds);
    });
    search.addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !findTitleId(titleIds, search.value.toLowerCase())) {
            const firstSuggestion = findSuggestions(titleIds, search.value)[0];
            if (firstSuggestion) {
                selectedShowId = firstSuggestion.id;
                search.value = getDisplayTitle(firstSuggestion);
            }
        }
    });
    search.addEventListener("change", function() {
        cleanTable();
        clearSuggestions();
        createTable(titleIds);
    });
    document.addEventListener("click", function(event) {
        if (!event.target.closest(".searchWrap")) {
            clearSuggestions();
        }
    });
    window.addEventListener("popstate", checkUrl);
    loadStatus.innerHTML = "Ready!";
    loadStatus.style.color = "green";
    console.log("enabled search");
    checkUrl();
    search.focus();
}


function checkUrl() {
    let showId = getUrl();
    if (showId) {
        search.value = showId;
        search.dispatchEvent(new Event("change"));
    }
}


function setUrl(id) {
    let url = new URL(window.location);
    url.searchParams.set("id", id);
    newUrl = window.location.pathname + "?" + url.searchParams.toString();
    history.pushState({}, "", newUrl);
}


function getUrl() {
    let url = new URL(window.location);
    return url.searchParams.get("id") ?? url.searchParams.get("title");
}


init();
