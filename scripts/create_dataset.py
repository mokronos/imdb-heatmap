import requests
import json
import pandas as pd

VOTES_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz"
EPISODES_URL = "https://datasets.imdbws.com/title.episode.tsv.gz"
NAMES_URL = "https://datasets.imdbws.com/title.basics.tsv.gz"

DATA_DIR = "data/"

NUM_SHOWS = 2500


def gen_idtitle(parent_votes, names):

    title_ids = []
    for id in parent_votes["tconst"]:
        data = {"id": id, "title": names.loc[names["tconst"] == id, "primaryTitle"].iloc[0]}
        title_ids.append(data)

    print("generated title_ids overview")

    with open(f"{DATA_DIR}titleId.json", "w") as f:
        json.dump(title_ids, f, indent=4)

    print("saved title_ids overview to disk")

def gen_season_ratings(parent_id, ratings, episodes):

    show_ratings = []

    # get the episodes for the show
    show_seasons = episodes.loc[episodes["parentTconst"] == parent_id].astype({
        "seasonNumber": int, "episodeNumber": int})
    show_seasons = show_seasons.sort_values(by=["seasonNumber", "episodeNumber"])

    # loop through each season
    for season in show_seasons["seasonNumber"].unique():

        season_ratings = []

        # get the episodes for the season
        season_episodes = show_seasons.loc[show_seasons["seasonNumber"] == season, "tconst"]

        if ratings.loc[ratings["tconst"] == season_episodes.iloc[0], "averageRating"].empty:
            break

        # loop through each episode
        for idx, episode in enumerate(season_episodes):

            episode_number = idx + 1

            # get the ratings for the episode
            episode_rating = ratings.loc[ratings["tconst"] == episode, "averageRating"]

            if episode_rating.empty:
                continue
            else:
                episode_rating = episode_rating.iloc[0]

            data = {"episode": episode_number, "rating": episode_rating, "id": episode}
            season_ratings.append(data)

        show_ratings.append(season_ratings)

    print(f"generated ratings for {parent_id}")

    with open(f"{DATA_DIR}{parent_id}.json", "w") as f:
        json.dump(show_ratings, f, indent=4)

    print(f"saved ratings for {parent_id} to disk")
        

def main():

    names = requests.get(NAMES_URL)
    episodes = requests.get(EPISODES_URL)
    votes = requests.get(VOTES_URL)

    names = pd.read_csv(NAMES_URL,
                        header=0,
                        usecols=["tconst", "primaryTitle"],
                        compression="gzip",
                        sep="\t"
                        )
    print("loaded names dataset")

    episodes = pd.read_csv(EPISODES_URL,
                            header=0,
                            usecols=["tconst", "parentTconst", "seasonNumber", "episodeNumber"],
                            compression="gzip",
                            sep="\t"
                            )
    print("loaded episodes dataset")

    votes = pd.read_csv(VOTES_URL,
                        header=0,
                        usecols=["tconst", "averageRating", "numVotes"],
                        compression="gzip",
                        sep="\t"
                        )
    print("loaded votes dataset")

    parent_shows = episodes["parentTconst"].unique()

    # get ids of parent shows that are top 1000 in votes
    # get the votes for the shows overall
    parent_votes = votes[votes["tconst"].isin(parent_shows)]
    parent_votes = parent_votes.sort_values(by=["numVotes"], ascending=False)
    parent_votes = parent_votes[:NUM_SHOWS]
    print("generated list of shows sorted by votes")

    episodes = episodes[episodes["episodeNumber"] != "\\N"]
    print("removed episodes with no episode/season number")

    gen_idtitle(parent_votes, names)

    for idx, parent_id in enumerate(parent_votes["tconst"]):
        gen_season_ratings(parent_id, votes, episodes)
        print(f"finished generation for {parent_id} ({idx+1}/{NUM_SHOWS})")
    
    # generate tmp file to indicate that the dataset has been created successfully
    with open(f"done", "w") as f:
        f.write("done")
    print("done")


if __name__ == "__main__":
    main()
