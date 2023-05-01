# showheatmap
Website that shows heatmaps of ratings of tv show episodes.

# How it works
The python script downloads the data from imdb and saves the top 1000 shows(for now) as one {title, id} array.
It then generates json files for every one of those IDs, containing the ratings of every episode for every season.

The scripts get ran every 24h by a cronjob through github actions. The json files are then pushed to the repo.

The website is pretty much pure vanilla js. It loads the {title, id} json file and lets the user search through it. Then loads the other jsons according to the search.

# Issues

Dataset generation takes way too long (1h48min) for 1000 shows. Currently using pandas to combine the databases. Takes a while to figure out which of the IDs are actually shows, and to collect all the IDs of the episodes. Probably can be optimized.

Series "Married... with Children" doesn't get generated.
Probably because of the first unrated pilot episode.
