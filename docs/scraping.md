# Scraping local PDFs

This repository provides extraction tools. It does not distribute
copyrighted source documents or extracted reference content. Users are
responsible for ensuring that their access to source material, extraction,
storage, use, and any redistribution comply with applicable law and licenses.
The tools do not grant permission to use any source material.

Generated data belongs in `public/data/`, which is ignored by Git. OCR caches
belong in `.cache/`, which is also ignored. Keep source documents outside the
repository. Git ignore rules do not prevent a hosting or deployment tool from
publishing files: check what you deploy before distributing local data.

## Setup

Install Python 3.8+ and the PDF dependency:

```sh
python3 -m pip install -r scripts/requirements-scraping.txt
```

For OCR, also install Tesseract and the trained language data you need, and make
`tesseract` available on your `PATH`. The default language is English (`eng`).
Native text extraction does not require Tesseract.

## Extract text

For a PDF with a usable text layer:

```sh
python3 scripts/scrape_pdf.py "PATH_TO_SOURCE.pdf" \
  --output public/data/extracted.json \
  --source-id local-reference --source-name "Local reference"
```

For a scanned PDF or an unreliable text layer:

```sh
python3 scripts/scrape_pdf.py "PATH_TO_SOURCE.pdf" \
  --mode ocr --pages 1,3-5 --columns 2 --dpi 200 --language eng \
  --cache .cache/pdf-ocr --output public/data/extracted.json
```

All input paths are parameters. The tool has no book-specific page ranges,
source fingerprints, content catalogs, correction lists, or transcribed rules.
Run `python3 scripts/scrape_pdf.py --help` for all options.

- `--pages` selects one-based PDF pages; omitting it processes the whole file.
- `--columns` splits every selected page into equal-width columns. Use separate
  runs for documents with mixed layouts. Lines are ordered by column, then by
  position within that column.
- `--dpi`, `--language`, and `--psm` configure OCR resolution, language, and
  Tesseract page segmentation. They have no effect in native mode.
- `--revision` identifies the extraction revision; it defaults to 1. Increase it
  when producing a corrected extraction.

The OCR cache is keyed by the source PDF's SHA-256 and rendering settings.
Repeated runs reuse completed TSV files. Remove the cache after changing the
Tesseract version or language models if you want fresh recognition results.
Images are passed directly to Tesseract and are not saved as repository assets.

## Output and review

The minified JSON contains `schemaVersion`, `revision`, `source`, `extraction`,
and `pages`. Source metadata includes the supplied ID/name and PDF SHA-256.
Absolute input paths are not included in the output.

Each page contains its one-based PDF `number`, `width`, `height`, and `lines`.
Each line has:

- `text`: extracted plain text.
- `html`: escaped text, with `strong` and `em` when the text layer provides font
  metadata. For image-only PDFs, OCR cannot recover those styles.
- `bounds`: `[left, top, right, bottom]` in PDF points (72 points per inch).
- `column`: a zero-based column index.

This is an intermediate extraction, not a parser for any particular book or
application schema. It does not infer entities, convert tables into structured
records, or assign game-specific enums. Review OCR accuracy, reading order,
formatting, and page boundaries before using the output to build application
data. For scanned pages, font recovery and word positions are approximate.

## Data manifest

`public/data/manifest.json` indexes every file under `public/data/` (including
subfolders), except the manifest itself and the `public/data/audit/` directory.
It is generated locally and ignored by
Git along with the data. Run `npm run data:manifest` after adding, changing, or
removing data files. `npm run build` and `npm run dev` also refresh it before
starting; regenerate it manually if data changes while the dev server is running.

The manifest has `schemaVersion: 1` and a `files` object keyed by paths relative
to `/data/`. Each entry contains `sha256` (the SHA-256 of the exact file bytes)
and `size` (bytes). Unchanged files retain the same hash across generations.

Clients should fetch `/data/manifest.json` with `cache: 'no-store'`, compare each
entry's hash with the hash saved alongside their cached file, and download new
or changed files with `cache: 'reload'`. Save the new hash only after a successful
download. Remove cached entries absent from the manifest. Encode each path
segment when constructing download URLs.

## Validate the tools

Tests create synthetic documents and do not require source books or generated
reference datasets:

```sh
python3 -m unittest discover -s tests -p 'test_scrape_pdf.py'
```
