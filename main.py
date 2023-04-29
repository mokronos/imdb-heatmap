import requests
from bs4 import BeautifulSoup
import json

BASE_URL = "https://www.imdb.com/"
TOP_SEARCH = "search/title/?title_type=tv_series&num_votes=20000,&sort=num_votes,desc&count=250"
NAME_SELECTOR = ".lister-item-header a"
EPISODE_SELECTOR = "div.ipl-rating-star.small > span.ipl-rating-star__rating"
DATA_DIR = "data/"

def get_top_series(amount=10):

    headers = {"Accept-Language": "en-US,en;q=0.5"}
    url = BASE_URL + TOP_SEARCH

    res = requests.get(url, headers=headers)

    soup = BeautifulSoup(res.text, "html.parser")
    series = soup.select(NAME_SELECTOR)
    series = series[:amount]

    titleIds = []

    for title in series:
        id = title["href"].split("/")[-2]
        entry = {"title": title.text, "id": id}
        titleIds.append(entry)

    with open(f"{DATA_DIR}titleId.json", "w") as f:
        json.dump(titleIds, f, indent=4)

    for title in titleIds:
        print(f"Getting episodes for {title['title']}")
        series_ratings = get_episodes(title["id"])
        with open(f"{DATA_DIR}{title['id']}.json", "w") as f:
            json.dump(series_ratings, f, indent=4)

    return 


def get_number_seasons(titleId):

    url = f"{BASE_URL}title/{titleId}/episodes?season="
    season = 1
    seasonUrl = f"{url}{season}"

    res = requests.get(seasonUrl)

    soup = BeautifulSoup(res.text, "html.parser")
    options = soup.select("#bySeason option")

    return len(options)


def get_episodes(titleId):

    url = f"{BASE_URL}title/{titleId}/episodes?season="
    num_seasons = get_number_seasons(titleId)
    series_ratings = []

    for season in range(1, num_seasons+1):
        season_ratings = []
        seasonUrl = f"{url}{season}"
        res = requests.get(seasonUrl)
        soup = BeautifulSoup(res.text, "html.parser")
        episodes = soup.select(EPISODE_SELECTOR)

        if len(episodes) == 0:
            break

        for idx, episode in enumerate(episodes):
            data = {"episode": idx+1, "rating": float(episode.text)}
            season_ratings.append(data)

        series_ratings.append(season_ratings)

    return series_ratings


if __name__ == "__main__":
    get_top_series()
