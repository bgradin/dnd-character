"""Exercise extraction with synthetic content, without distributing source data."""

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch

import fitz

# Support unittest discovery when the tests directory is the import root.
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
import scrape_pdf


class ScrapePdfTests(unittest.TestCase):
    def test_page_selection_rejects_invalid_ranges(self):
        self.assertEqual(scrape_pdf.parse_pages('3,1-2,2', 4), [1, 2, 3])
        self.assertEqual(scrape_pdf.parse_pages(None, 2), [1, 2])
        for selection in ['0', '5', '3-1', '1-2-3', '']:
            with self.subTest(selection=selection), self.assertRaises(ValueError):
                scrape_pdf.parse_pages(selection, 4)

    def test_native_cli_extracts_selected_page_and_escapes_html(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / 'synthetic.pdf'
            output = Path(directory) / 'output.json'
            with fitz.open() as document:
                document.new_page().insert_text((40, 40), 'Skipped page')
                page = document.new_page()
                page.insert_text((40, 40), 'Synthetic <sample>', fontname='hebo')
                document.save(source)

            subprocess.run([
                sys.executable, str(ROOT / 'scripts/scrape_pdf.py'), str(source),
                '--pages', '2', '--output', str(output),
                '--source-id', 'synthetic', '--source-name', 'Test source',
            ], check=True, capture_output=True)
            raw = output.read_text(encoding='utf-8')
            data = json.loads(raw)
            self.assertNotIn('\n', raw)
            self.assertNotIn(str(source), raw)
            self.assertEqual(data['source']['name'], 'Test source')
            self.assertEqual(data['source']['sha256'], scrape_pdf.sha256_file(source))
            self.assertEqual([page['number'] for page in data['pages']], [2])
            self.assertEqual(data['pages'][0]['lines'][0]['text'], 'Synthetic <sample>')
            self.assertEqual(data['pages'][0]['lines'][0]['html'],
                             '<strong>Synthetic &lt;sample&gt;</strong>')

    def test_ocr_converts_coordinates_and_caches_by_settings(self):
        tsv = (
            'level\tpage_num\tblock_num\tpar_num\tline_num\tword_num\t'
            'left\ttop\twidth\theight\tconf\ttext\n'
            '5\t1\t1\t1\t1\t1\t20\t40\t60\t20\t95\tSynthetic\n'
        )
        with tempfile.TemporaryDirectory() as directory, fitz.open() as document:
            page = document.new_page(width=300, height=400)
            options = SimpleNamespace(
                cache=Path(directory), dpi=144, columns=1, language='eng', psm=3,
            )
            with patch.object(scrape_pdf.subprocess, 'run') as run:
                run.return_value.stdout = tsv.encode('utf-8')
                first = scrape_pdf.ocr_lines(page, 1, 'source-a', options)
                second = scrape_pdf.ocr_lines(page, 1, 'source-a', options)
                self.assertEqual(run.call_count, 1)
                self.assertEqual(first, second)
                self.assertEqual(first[0]['bounds'], [10, 20, 40, 30])
                self.assertEqual(first[0]['text'], 'Synthetic')
                scrape_pdf.ocr_lines(page, 1, 'source-b', options)
                options.dpi = 200
                scrape_pdf.ocr_lines(page, 1, 'source-b', options)
                self.assertEqual(run.call_count, 3)


if __name__ == '__main__':
    unittest.main()
