"""Exercise the shipped CSS against representative desktop and mobile feed trees."""
import re
import unittest
from pathlib import Path

from bs4 import BeautifulSoup

CSS = Path("extension/filters.css").read_text()
SELECTORS = re.findall(r'(html\[data-mytube[^{}]+)\s*\{\s*display: none !important;', CSS)
CASES = {
    "ads": "<ytm-rich-item-renderer><ytm-ad-slot-renderer></ytm-ad-slot-renderer></ytm-rich-item-renderer>",
    "shorts": '<ytd-rich-item-renderer><a href="/shorts/one"></a></ytd-rich-item-renderer>',
    "community": "<ytm-rich-item-renderer><ytm-poll-renderer></ytm-poll-renderer></ytm-rich-item-renderer>",
    "comments": "<ytd-comments></ytd-comments>",
    "explore": '<ytd-guide-entry-renderer><a href="/feed/explore"></a></ytd-guide-entry-renderer>',
    "more": '<ytd-guide-section-renderer><a href="https://music.youtube.com"></a><a href="https://studio.youtube.com"></a></ytd-guide-section-renderer>',
    "annotations": '<button class="ytp-cards-button"></button>',
    "sidebar": '<ytd-watch-flexy><div id="secondary"></div></ytd-watch-flexy>',
    "home": '<ytd-browse page-subtype="home"><div id="primary"></div></ytd-browse>',
    "endFeed": '<div class="ytp-videowall-still"></div>',
    "endCards": '<div class="ytp-ce-element"></div>',
    "mixes": '<yt-lockup-view-model><a href="/watch?v=1&amp;list=RD123"></a></yt-lockup-view-model>',
    "info": '<ytm-slim-video-metadata-section-renderer></ytm-slim-video-metadata-section-renderer>',
    "merch": '<ytd-merch-shelf-renderer></ytd-merch-shelf-renderer>',
}


class Filters(unittest.TestCase):
    def test_toggles(self):
        for key, target in CASES.items():
            with self.subTest(key=key):
                route = "home" if key == "home" else "watch"
                tree = BeautifulSoup(f'<html data-mytube="{key}" data-mytube-route="{route}"><body>{target}'
                                     '<ytd-rich-item-renderer id="keep"><a href="/watch?v=OK"></a>'
                                     '</ytd-rich-item-renderer></body></html>', "html.parser")
                hidden = [node for selector in SELECTORS for node in tree.select(selector)]
                self.assertTrue(hidden)
                self.assertFalse(any(node.get("id") == "keep" for node in hidden))
                if key in ("shorts", "community", "ads", "mixes"):
                    self.assertIn(tree.body.find(), hidden)
                tree.html["data-mytube"] = ""
                self.assertFalse(any(tree.select(selector) for selector in SELECTORS))

    def test_home_is_route_specific(self):
        tree = BeautifulSoup('<html data-mytube="home" data-mytube-route="other"><ytm-browse>'
                             '<ytm-rich-grid-renderer></ytm-rich-grid-renderer></ytm-browse></html>', "html.parser")
        self.assertFalse(any(tree.select(selector) for selector in SELECTORS))


if __name__ == "__main__":
    unittest.main()
