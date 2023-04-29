import csv
import requests
import gzip

ratings = requests.get("https://datasets.imdbws.com/title.ratings.tsv.gz")
# episodes = requests.get("https://datasets.imdbws.com/title.episode.tsv.gz")

ratings = gzip.decompress(ratings.content)
# episodes = gzip.decompress(episodes.content)

ratings = csv.reader(ratings.decode("utf-8").splitlines(), delimiter="\t")
for row in ratings:
    print(row)
