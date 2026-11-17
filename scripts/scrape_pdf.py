#!/usr/bin/env python3
"""Extract native text or OCR from a user-provided PDF into minified JSON."""

import argparse
import csv
import hashlib
import html
import io
import json
import os
import subprocess
from pathlib import Path

import fitz


def parse_pages(selection, page_count):
    """Return sorted, one-based page numbers, accepting values like 1,3-5."""
    if selection is None:
        return list(range(1, page_count + 1))

    pages = set()
    for part in selection.split(','):
        bounds = part.strip().split('-')
        if len(bounds) > 2:
            raise ValueError('Page selections must look like 1,3-5.')
        first = int(bounds[0])
        last = int(bounds[-1])
        if not 1 <= first <= last <= page_count:
            raise ValueError(f'Page selections must be within 1-{page_count}.')
        pages.update(range(first, last + 1))
    return sorted(pages)


def sha256_file(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(chunk)
    return digest.hexdigest()


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, separators=(',', ':')),
        encoding='utf-8',
    )


def format_text(text, flags=0):
    """Escape source text and retain bold/italic when the text layer provides it."""
    formatted = html.escape(text, quote=False)
    if flags & fitz.TEXT_FONT_ITALIC:
        formatted = f'<em>{formatted}</em>'
    if flags & fitz.TEXT_FONT_BOLD:
        formatted = f'<strong>{formatted}</strong>'
    return formatted


def text_spans(page):
    # Do not decode embedded images when only font and text metadata are needed.
    flags = fitz.TEXTFLAGS_DICT & ~fitz.TEXT_PRESERVE_IMAGES
    blocks = page.get_text('dict', flags=flags)['blocks']
    return [
        span
        for block in blocks
        for line in block.get('lines', [])
        for span in line['spans']
    ]


def column_bounds(page, columns):
    width = page.rect.width / columns
    return [
        fitz.Rect(
            page.rect.x0 + column * width,
            page.rect.y0,
            page.rect.x0 + (column + 1) * width,
            page.rect.y1,
        )
        for column in range(columns)
    ]


def native_lines(page, columns):
    lines = []
    flags = fitz.TEXTFLAGS_DICT & ~fitz.TEXT_PRESERVE_IMAGES
    for column, bounds in enumerate(column_bounds(page, columns)):
        blocks = page.get_text('dict', clip=bounds, flags=flags)['blocks']
        for block in blocks:
            for line in block.get('lines', []):
                spans = line['spans']
                text = ''.join(span['text'] for span in spans)
                if not text.strip():
                    continue
                lines.append({
                    'column': column,
                    'bounds': list(line['bbox']),
                    'text': text,
                    'html': ''.join(
                        format_text(span['text'], span['flags'])
                        for span in spans
                    ),
                })
    return sort_lines(lines)


def sort_lines(lines):
    """Read columns left to right, and each column from top to bottom."""
    return sorted(lines, key=lambda line: (
        line['column'], line['bounds'][1], line['bounds'][0],
    ))


def matching_font_flags(bounds, spans):
    best_area = 0
    flags = 0
    for span in spans:
        overlap = bounds & fitz.Rect(span['bbox'])
        area = overlap.get_area()
        if area > best_area:
            best_area = area
            flags = span['flags']
    return flags


def read_ocr_lines(tsv, column, clip, scale, spans):
    """Group Tesseract words into lines and convert pixels to PDF points."""
    groups = {}
    for word in csv.DictReader(io.StringIO(tsv), delimiter='\t'):
        if word['level'] != '5' or not word['text'].strip():
            continue
        key = (word['block_num'], word['par_num'], word['line_num'])
        groups.setdefault(key, []).append(word)

    lines = []
    for words in groups.values():
        words.sort(key=lambda word: int(word['left']))
        rectangles = []
        formatted_words = []
        for word in words:
            left = clip.x0 + int(word['left']) / scale
            top = clip.y0 + int(word['top']) / scale
            bounds = fitz.Rect(
                left, top,
                left + int(word['width']) / scale,
                top + int(word['height']) / scale,
            )
            rectangles.append(bounds)
            formatted_words.append(format_text(
                word['text'], matching_font_flags(bounds, spans),
            ))
        combined = fitz.Rect(rectangles[0])
        for bounds in rectangles[1:]:
            combined |= bounds
        lines.append({
            'column': column,
            'bounds': list(combined),
            'text': ' '.join(word['text'] for word in words),
            'html': ' '.join(formatted_words),
        })
    return lines


def ocr_lines(page, page_number, fingerprint, options):
    settings = {
        'rendererVersion': 1,
        'sha256': fingerprint,
        'dpi': options.dpi,
        'columns': options.columns,
        'language': options.language,
        'pageSegmentation': options.psm,
    }
    cache_key = hashlib.sha256(
        json.dumps(settings, sort_keys=True).encode('utf-8')
    ).hexdigest()
    cache_directory = options.cache / cache_key
    cache_directory.mkdir(parents=True, exist_ok=True)

    scale = options.dpi / 72
    spans = text_spans(page)
    lines = []
    for column, clip in enumerate(column_bounds(page, options.columns)):
        cache_file = cache_directory / f'{page_number}-{column}.tsv'
        if not cache_file.exists():
            image = page.get_pixmap(
                matrix=fitz.Matrix(scale, scale), clip=clip,
            )
            result = subprocess.run(
                ['tesseract', 'stdin', 'stdout', '-l', options.language,
                 '--psm', str(options.psm), 'tsv'],
                input=image.tobytes('png'),
                capture_output=True,
                check=True,
                env={**os.environ, 'OMP_THREAD_LIMIT': '1'},
            )
            # An interrupted OCR run must not leave a reusable partial cache.
            temporary = cache_file.with_suffix('.tmp')
            temporary.write_bytes(result.stdout)
            temporary.replace(cache_file)
        lines.extend(read_ocr_lines(
            cache_file.read_text(encoding='utf-8'), column, clip, scale, spans,
        ))
    return sort_lines(lines)


def argument_parser():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('pdf', type=Path, help='User-provided source PDF')
    parser.add_argument('--output', type=Path, required=True, help='JSON destination')
    parser.add_argument('--mode', choices=['native', 'ocr'], default='native')
    parser.add_argument('--pages', help='One-based pages, for example 1,3-5; default: all')
    parser.add_argument('--columns', type=int, default=1, help='Equal-width columns per page')
    parser.add_argument('--dpi', type=int, default=200, help='OCR rendering resolution')
    parser.add_argument('--language', default='eng', help='Tesseract language code(s)')
    parser.add_argument('--psm', type=int, choices=range(3, 14), default=3,
                        help='Tesseract page segmentation mode (3-13)')
    parser.add_argument('--cache', type=Path, default=Path('.cache/pdf-ocr'))
    parser.add_argument('--source-id', help='Source identifier; default: PDF filename stem')
    parser.add_argument('--source-name', help='Source label; default: PDF filename stem')
    parser.add_argument('--revision', type=int, default=1, help='Extraction revision')
    return parser


def main():
    parser = argument_parser()
    options = parser.parse_args()
    if min(options.columns, options.dpi, options.revision) < 1:
        parser.error('--columns, --dpi, and --revision must be positive')
    if options.output.resolve() == options.pdf.resolve():
        parser.error('--output must not overwrite the source PDF')

    try:
        fingerprint = sha256_file(options.pdf)
        with fitz.open(options.pdf) as document:
            pages = parse_pages(options.pages, len(document))
            extracted_pages = []
            for number in pages:
                page = document[number - 1]
                if options.mode == 'ocr':
                    lines = ocr_lines(page, number, fingerprint, options)
                else:
                    lines = native_lines(page, options.columns)
                extracted_pages.append({
                    'number': number,
                    'width': page.rect.width,
                    'height': page.rect.height,
                    'lines': lines,
                })
        result = {
            'schemaVersion': 1,
            'revision': options.revision,
            'source': {
                'id': options.source_id or options.pdf.stem,
                'name': options.source_name or options.pdf.stem,
                'sha256': fingerprint,
            },
            'extraction': {
                'mode': options.mode,
                'columns': options.columns,
            },
            'pages': extracted_pages,
        }
        if options.mode == 'ocr':
            result['extraction'].update({
                'dpi': options.dpi,
                'language': options.language,
                'pageSegmentation': options.psm,
            })
        write_json(options.output, result)
    except subprocess.CalledProcessError as error:
        parser.exit(1, f"OCR failed: {error.stderr.decode('utf-8', errors='replace')}\n")
    except (OSError, ValueError, RuntimeError) as error:
        parser.exit(1, f'Extraction failed: {error}\n')
    print(f'Extracted {len(pages)} page(s) to {options.output}')


if __name__ == '__main__':
    main()
