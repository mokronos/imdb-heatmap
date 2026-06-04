"""Generate the IMDb-heatmap dataset.

Downloads the IMDb non-commercial TSV dumps, picks the top NUM_SHOWS parent
shows by total votes, and writes:
  - data/titleId.json              : list of {id, title} for the shows
  - data/<parent_id>.json          : per-show season/episode ratings

Performance notes
-----------------
The previous version did an O(n) boolean-mask lookup against the votes
table for every single episode (~250k lookups * 12M rows = 3B+ compares).
This version indexes votes by tconst once and groups episodes by parent
once, so per-show work is O(eps_in_show). End-to-end runtime drops from
~3.5h to a few minutes for 2500 shows.

Set NUM_SHOWS=5 in the environment for a quick smoke test.
"""
import io
import json
import os

import pandas as pd
import requests

VOTES_URL = "https://datasets.imdbws.com/title.ratings.tsv.gz"
EPISODES_URL = "https://datasets.imdbws.com/title.episode.tsv.gz"
NAMES_URL = "https://datasets.imdbws.com/title.basics.tsv.gz"

DATA_DIR = "data/"

NUM_SHOWS = int(os.environ.get("NUM_SHOWS", 2500))


def fetch(url):
    """Download a gzipped TSV from IMDb and return raw bytes."""
    r = requests.get(url, stream=True, timeout=300)
    r.raise_for_status()
    return r.content


def load_title_lookup(title_ids):
    """Load titles for the selected shows, stopping once all are found."""
    wanted = set(title_ids)
    titles = {}

    for chunk in pd.read_csv(
        io.BytesIO(fetch(NAMES_URL)),
        header=0, usecols=["tconst", "primaryTitle"],
        compression="gzip", sep="\t", dtype=str,
        chunksize=100_000,
    ):
        matches = chunk[chunk["tconst"].isin(wanted)]
        titles.update(matches.set_index("tconst")["primaryTitle"].to_dict())
        if len(titles) == len(wanted):
            break

    return titles


def gen_season_ratings(parent_id, show_episodes, ratings):
    """Write data/<parent_id>.json from the pre-indexed ratings and episodes.

    Output format matches the original script: a list of seasons, each a
    list of {episode, rating, id} dicts. ``episode`` is the 1-based position
    of the episode within its season in the sorted list. Episodes with no
    rating are skipped, but the position counter keeps advancing (matches
    the original behaviour, so existing data files remain compatible).
    """
    if show_episodes is None or len(show_episodes) == 0:
        with open(f"{DATA_DIR}{parent_id}.json", "w") as f:
            json.dump([], f)
        return

    show_ratings = []
    for _, grp in show_episodes.groupby("seasonNumber", sort=True):
        season_ratings = []
        for idx, row in enumerate(grp.itertuples(index=False), start=1):
            ep_id = row.tconst
            try:
                rating = ratings[ep_id]
            except KeyError:
                continue
            season_ratings.append({
                "episode": idx,
                "rating": float(rating),
                "id": ep_id,
            })
        if season_ratings:
            show_ratings.append(season_ratings)

    with open(f"{DATA_DIR}{parent_id}.json", "w") as f:
        json.dump(show_ratings, f, indent=4)


def main():
    os.makedirs(DATA_DIR, exist_ok=True)

    episodes = pd.read_csv(
        io.BytesIO(fetch(EPISODES_URL)),
        header=0,
        usecols=["tconst", "parentTconst", "seasonNumber", "episodeNumber"],
        compression="gzip", sep="\t", dtype=str,
    )
    episodes = episodes[episodes["episodeNumber"] != "\\N"]
    episodes = episodes[episodes["seasonNumber"] != "\\N"]
    episodes["seasonNumber"] = episodes["seasonNumber"].astype(int)
    episodes["episodeNumber"] = episodes["episodeNumber"].astype(int)
    print(f"loaded episodes: {len(episodes)} rows (with season+episode)")

    votes = pd.read_csv(
        io.BytesIO(fetch(VOTES_URL)),
        header=0, usecols=["tconst", "averageRating", "numVotes"],
        compression="gzip", sep="\t",
        na_values=["\\N"],
        dtype={"tconst": str, "averageRating": "float32", "numVotes": "Int32"},
    )
    votes = votes.dropna(subset=["numVotes", "averageRating"])
    print(f"loaded votes: {len(votes)} rows")

    parent_shows = set(episodes["parentTconst"].unique())
    parent_votes = (
        votes[votes["tconst"].isin(parent_shows)]
        .nlargest(NUM_SHOWS, "numVotes")
    )
    top_ids = parent_votes["tconst"].tolist()
    print(f"picked top {len(top_ids)} shows by votes")

    name_lookup = load_title_lookup(top_ids)
    print(f"loaded selected names: {len(name_lookup)} rows")

    title_ids = [{"id": t, "title": name_lookup[t]} for t in top_ids]
    with open(f"{DATA_DIR}titleId.json", "w") as f:
        json.dump(title_ids, f, indent=4)
    print("wrote titleId.json")

    top_episodes = episodes[episodes["parentTconst"].isin(top_ids)].sort_values(
        ["parentTconst", "seasonNumber", "episodeNumber"]
    )
    needed_episode_ids = set(top_episodes["tconst"])
    ratings = (
        votes[votes["tconst"].isin(needed_episode_ids)]
        .drop_duplicates("tconst")
        .set_index("tconst")["averageRating"]
        .to_dict()
    )
    print(f"indexed ratings: {len(ratings)}")

    grouped = top_episodes.groupby("parentTconst")

    for idx, parent_id in enumerate(top_ids, start=1):
        try:
            show_episodes = grouped.get_group(parent_id)
        except KeyError:
            show_episodes = None
        gen_season_ratings(parent_id, show_episodes, ratings)
        if idx % 100 == 0 or idx == len(top_ids):
            print(f"finished {idx}/{len(top_ids)}")

    with open("done", "w") as f:
        f.write("done")
    print("done")


if __name__ == "__main__":
    main()
