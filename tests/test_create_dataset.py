"""Smoke tests for create_dataset.gen_season_ratings.

Run with: python3 tests/test_create_dataset.py
"""
import json
import os
import sys
import tempfile

import pandas as pd

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "scripts"))
import create_dataset as cd


def test_basic():
    show = pd.DataFrame({
        "tconst": ["tt_e1", "tt_e2", "tt_e3", "tt_e4"],
        "parentTconst": ["tt_show"] * 4,
        "seasonNumber": [1, 1, 1, 2],
        "episodeNumber": [1, 2, 3, 1],
    })
    ratings = pd.Series(
        [8.5, 7.2, 9.0, 8.0],
        index=["tt_e1", "tt_e2", "tt_e3", "tt_e4"],
        name="averageRating",
    )
    with tempfile.TemporaryDirectory() as tmp:
        cd.DATA_DIR = tmp + "/"
        cd.gen_season_ratings("tt_show", show, ratings)
        with open(f"{tmp}/tt_show.json") as f:
            result = json.load(f)
    expected = [
        [
            {"episode": 1, "rating": 8.5, "id": "tt_e1"},
            {"episode": 2, "rating": 7.2, "id": "tt_e2"},
            {"episode": 3, "rating": 9.0, "id": "tt_e3"},
        ],
        [
            {"episode": 1, "rating": 8.0, "id": "tt_e4"},
        ],
    ]
    assert result == expected, f"got {result}"
    print("test_basic passed")


def test_missing_rating():
    show = pd.DataFrame({
        "tconst": ["tt_e1", "tt_e2", "tt_e3"],
        "parentTconst": ["tt_show"] * 3,
        "seasonNumber": [1, 1, 1],
        "episodeNumber": [1, 2, 3],
    })
    ratings = pd.Series(
        [8.5, 9.0],
        index=["tt_e1", "tt_e3"],
        name="averageRating",
    )
    with tempfile.TemporaryDirectory() as tmp:
        cd.DATA_DIR = tmp + "/"
        cd.gen_season_ratings("tt_show", show, ratings)
        with open(f"{tmp}/tt_show.json") as f:
            result = json.load(f)
    expected = [
        [
            {"episode": 1, "rating": 8.5, "id": "tt_e1"},
            {"episode": 3, "rating": 9.0, "id": "tt_e3"},
        ],
    ]
    assert result == expected, f"got {result}"
    print("test_missing_rating passed")


def test_empty_show_none():
    with tempfile.TemporaryDirectory() as tmp:
        cd.DATA_DIR = tmp + "/"
        cd.gen_season_ratings("tt_show", None, pd.Series(dtype="float32"))
        with open(f"{tmp}/tt_show.json") as f:
            result = json.load(f)
    assert result == []
    print("test_empty_show_none passed")


def test_empty_show_dataframe():
    show = pd.DataFrame(columns=["tconst", "parentTconst", "seasonNumber", "episodeNumber"])
    with tempfile.TemporaryDirectory() as tmp:
        cd.DATA_DIR = tmp + "/"
        cd.gen_season_ratings("tt_show", show, pd.Series(dtype="float32"))
        with open(f"{tmp}/tt_show.json") as f:
            result = json.load(f)
    assert result == []
    print("test_empty_show_dataframe passed")


def test_format_display_title_with_year_and_id():
    result = cd.format_display_title("tt1234567", {"primaryTitle": "Example", "startYear": "1999"})
    assert result == "Example (1999) [tt1234567]"
    print("test_format_display_title_with_year_and_id passed")


def test_format_display_title_without_year():
    result = cd.format_display_title("tt1234567", {"primaryTitle": "Example", "startYear": "\\N"})
    assert result == "Example [tt1234567]"
    print("test_format_display_title_without_year passed")


def test_matches_existing_data_format():
    with open("data/tt0118273.json") as f:
        existing = json.load(f)
    assert isinstance(existing, list)
    for season in existing:
        assert isinstance(season, list)
        for ep in season:
            assert set(ep.keys()) == {"episode", "rating", "id"}
            assert isinstance(ep["episode"], int)
            assert isinstance(ep["rating"], (int, float))
            assert isinstance(ep["id"], str)
    print("test_matches_existing_data_format passed")


if __name__ == "__main__":
    test_basic()
    test_missing_rating()
    test_empty_show_none()
    test_empty_show_dataframe()
    test_format_display_title_with_year_and_id()
    test_format_display_title_without_year()
    test_matches_existing_data_format()
    print("all tests passed")
