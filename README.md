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

# How to run

## Website (frontend)

The frontend is pure vanilla HTML/CSS/JS with no build step. Just serve the root directory with any static file server:

```bash
# Using Python
python3 -m http.server 8000

# Using Node.js (npx)
npx -y serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

> **Note:** The `data/` directory must contain the JSON files for the site to work. These are already included in the repo and get updated daily via GitHub Actions.

## Data generation (Python scripts)

If you want to regenerate the dataset locally:

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Run the dataset generation script
python scripts/create_dataset.py
```

This will download IMDb datasets and generate JSON files in the `data/` directory. **Warning:** this takes a long time (~1h48min for 2500 shows).

## App (SolidJS - WIP)

There is also an alternative frontend in `app/` built with SolidJS + Vite:

```bash
cd app
npm install   # or pnpm install
npm run dev
```

# Issues
Dataset generation used to take multiple hours in GitHub Actions. The current script indexes ratings and groups episodes up front, so the remaining runtime should mostly be IMDb download/parsing time.

Series "Married... with Children" doesn't get generated.
Probably because of the first unrated pilot episode.

Duplicate titles are disambiguated in search metadata with year and IMDb ID.
