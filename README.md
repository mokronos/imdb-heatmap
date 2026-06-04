# Imdb-Heatmap
[Website](https://mokronos.github.io/imdb-heatmap) that shows heatmaps of ratings of tv show episodes.

# Idea
The idea for the site come from this [Website](https://vallandingham.me/seriesheat/#/). My main issues with the site were speed (its annoying to search) and that its not up to date.

# How it works
The python script downloads the data from imdb and saves the top 2500 shows(for now) as one metadata json file.
It then generates json files for every one of those IDs, containing the ratings of every episode for every season.

The scripts run every 24h via a cronjob through github actions. The json files are then pushed to the repo.

The website is pretty much pure vanilla js. It loads the metadata json file and lets the user search through it. Then loads the other jsons according to the search/selection.

# Regenerate dataset locally
Full dataset generation overwrites `data/` and creates a `done` file when successful:

```bash
uv run --python 3.11 --with-requirements requirements.txt python scripts/create_dataset.py
```

For a quick smoke test with fewer shows:

```bash
NUM_SHOWS=20 uv run --python 3.11 --with-requirements requirements.txt python scripts/create_dataset.py
```

To measure runtime:

```bash
/usr/bin/time -p uv run --python 3.11 --with-requirements requirements.txt python scripts/create_dataset.py
```

# Issues
Dataset generation used to take multiple hours in GitHub Actions. The current script indexes ratings and groups episodes up front, so the remaining runtime should mostly be IMDb download/parsing time.

Series "Married... with Children" doesn't get generated.
Probably because of the first unrated pilot episode.

Duplicate titles are disambiguated in search metadata with year and IMDb ID.
