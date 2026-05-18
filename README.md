# Imdb-Heatmap
[Website](https://mokronos.github.io/imdb-heatmap) that shows heatmaps of ratings of tv show episodes.

# Idea
The idea for the site come from this [Website](https://vallandingham.me/seriesheat/#/). My main issues with the site were speed (its annoying to search) and that its not up to date.

# How it works
The python script downloads the data from imdb and saves the top 2500 shows(for now) as one {title, id} json file.
It then generates json files for every one of those IDs, containing the ratings of every episode for every season.

The scripts run every 24h via a cronjob through github actions. The json files are then pushed to the repo.

The website is pretty much pure vanilla js. It loads the {title, id} json file and lets the user search through it. Then loads the other jsons according to the search/selection.

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
Dataset generation takes way too long (1h48min) for 1000 shows. Currently using pandas to combine the databases. Takes a while to figure out which of the IDs are actually shows, and to collect all the IDs of the episodes. Probably can be optimized.

Series "Married... with Children" doesn't get generated.
Probably because of the first unrated pilot episode.

Need to manage duplicates in the dataset. Currently there are 2 "The Office" series, one can't be accessed.
Could add year and/or force selection.
