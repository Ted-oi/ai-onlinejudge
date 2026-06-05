"""
Fix Luogu problem descriptions by re-fetching proper Markdown from Luogu.
The original scraper lost formatting (code blocks, bold, math, lists, etc.)
because it used elem.text which strips all HTML formatting.

This script:
1. Connects to PostgreSQL to get all Luogu problems
2. Uses DrissionPage to fetch proper Markdown from Luogu pages
3. Updates only the description and examples in the database

Usage: python fix_luogu_markdown.py [--dry-run] [--start 1000] [--end 1213]
"""

import sys
import json
import time
import re
import argparse
import psycopg2

sys.stdout.reconfigure(encoding='utf-8')

from DrissionPage import ChromiumPage, ChromiumOptions

DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'onlinejudge',
    'user': 'postgres',
}


def create_browser():
    co = ChromiumOptions()
    co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    co.headless()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_argument('--lang=zh-CN')
    return ChromiumPage(co)


def fetch_problem_markdown(page, pid):
    """Fetch problem data from Luogu and return proper Markdown content."""
    url = f'https://www.luogu.com.cn/problem/{pid}'
    page.get(url)
    time.sleep(3)

    html = page.html
    if '页面未找到' in html or '出错了' in html:
        return None

    match = re.search(
        r'<script id="lentille-context" type="application/json">(.*?)</script>',
        html, re.DOTALL
    )
    if not match:
        return None

    try:
        data = json.loads(match.group(1))
    except json.JSONDecodeError:
        return None

    prob = data.get('data', {}).get('problem', {})
    content = prob.get('content', {})

    if not content.get('description'):
        return None

    # Build description from sections
    desc_parts = []
    bg = (content.get('background') or '').strip()
    if bg:
        desc_parts.append(f'## 题目背景\n\n{bg}')
    desc = (content.get('description') or '').strip()
    if desc:
        desc_parts.append(f'## 题目描述\n\n{desc}')
    fmt_i = (content.get('formatI') or '').strip()
    if fmt_i:
        desc_parts.append(f'## 输入格式\n\n{fmt_i}')
    fmt_o = (content.get('formatO') or '').strip()
    if fmt_o:
        desc_parts.append(f'## 输出格式\n\n{fmt_o}')
    hint = (content.get('hint') or '').strip()
    if hint:
        desc_parts.append(f'## 说明/提示\n\n{hint}')

    full_desc = '\n\n'.join(desc_parts)

    # Extract samples
    raw_samples = prob.get('samples', [])
    examples = []
    for s in raw_samples:
        if isinstance(s, (list, tuple)) and len(s) >= 2:
            inp = s[0] if isinstance(s[0], str) else str(s[0])
            out = s[1] if isinstance(s[1], str) else str(s[1])
            examples.append({'input': inp, 'output': out})

    return {
        'description': full_desc,
        'examples': examples,
    }


def get_luogu_problems(conn):
    """Get all Luogu problems from the database, grouped by luogu_no."""
    cur = conn.cursor()
    cur.execute(r"""
        SELECT id, title
        FROM problems
        WHERE title ~ '\[P\d+\]'
        ORDER BY id
    """)
    rows = cur.fetchall()
    cur.close()

    problems = []
    for row in rows:
        db_id, title = row
        m = re.search(r'\[P(\d+)\]', title)
        if not m:
            continue
        luogu_no = int(m.group(1))
        problems.append({
            'db_id': db_id,
            'luogu_no': luogu_no,
            'pid': f'P{luogu_no}',
        })
    return problems


def update_problem(conn, db_id, data):
    """Update a single problem's description and examples."""
    cur = conn.cursor()
    cur.execute("""
        UPDATE problems SET
            description = %s,
            examples = %s,
            updated_at = NOW()
        WHERE id = %s
    """, (
        data['description'],
        json.dumps(data['examples'], ensure_ascii=False),
        db_id,
    ))
    cur.close()


def main():
    parser = argparse.ArgumentParser(description='Fix Luogu problem Markdown')
    parser.add_argument('--dry-run', action='store_true', help='Only show what would change')
    parser.add_argument('--start', type=int, default=1000, help='Start problem number')
    parser.add_argument('--end', type=int, default=1213, help='End problem number')
    parser.add_argument('--delay', type=float, default=2.0, help='Delay between requests')
    parser.add_argument('--skip-existing', action='store_true', help='Skip if already has code blocks')
    args = parser.parse_args()

    print('=' * 60)
    print('  Luogu Markdown Fix Script')
    print('=' * 60)
    print(f'  Range: P{args.start} - P{args.end}')
    print(f'  Dry run: {args.dry_run}')
    print()

    conn = psycopg2.connect(**DB_CONFIG)
    conn.autocommit = False

    all_problems = get_luogu_problems(conn)
    print(f'Found {len(all_problems)} Luogu problem records in database')

    # Filter by range
    problems = [p for p in all_problems if args.start <= p['luogu_no'] <= args.end]

    # Deduplicate: group by luogu_no, update all copies
    unique_pids = {}
    for p in problems:
        if p['luogu_no'] not in unique_pids:
            unique_pids[p['luogu_no']] = []
        unique_pids[p['luogu_no']].append(p['db_id'])

    if args.skip_existing:
        # Remove problems that already have code blocks
        skip_ids = set()
        cur = conn.cursor()
        for p in problems:
            cur.execute("SELECT description FROM problems WHERE id = %s", (p['db_id'],))
            row = cur.fetchone()
            if row and '```' in (row[0] or ''):
                skip_ids.add(p['db_id'])
        cur.close()
        unique_pids = {
            k: [db_id for db_id in v if db_id not in skip_ids]
            for k, v in unique_pids.items()
            if any(db_id not in skip_ids for db_id in v)
        }

    sorted_pids = sorted(unique_pids.keys())
    print(f'Will process {len(sorted_pids)} unique problems ({sum(len(v) for v in unique_pids.values())} DB records)')
    print()

    print('Starting browser...')
    page = create_browser()
    page.get('https://www.luogu.com.cn/')
    time.sleep(3)
    print('Browser ready\n')

    success = 0
    fail = 0
    skip = 0

    try:
        for i, luogu_no in enumerate(sorted_pids):
            pid = f'P{luogu_no}'
            db_ids = unique_pids[luogu_no]

            print(f'[{i+1}/{len(sorted_pids)}] {pid} (DB:{",".join(map(str, db_ids))})...', end=' ', flush=True)

            try:
                result = fetch_problem_markdown(page, pid)

                if result is None:
                    print('SKIP (no data)')
                    skip += 1
                    continue

                desc_len = len(result['description'])
                has_code = '```' in result['description']
                n_samples = len(result['examples'])
                tag = f'desc:{desc_len}ch, code:{has_code}, samples:{n_samples}'

                if args.dry_run:
                    print(f'DRY-RUN ({tag})')
                else:
                    for db_id in db_ids:
                        update_problem(conn, db_id, result)
                    conn.commit()
                    print(f'OK ({tag})')

                success += 1

            except Exception as e:
                conn.rollback()
                print(f'ERROR: {str(e)[:80]}')
                fail += 1

            time.sleep(args.delay)

    except KeyboardInterrupt:
        print('\n\nInterrupted.')
    finally:
        page.quit()
        conn.close()

    print(f'\n{"=" * 60}')
    print(f'  Done! Success: {success}, Failed: {fail}, Skipped: {skip}')
    if args.dry_run:
        print(f'  (DRY RUN - no changes were made)')
    print(f'{"=" * 60}')


if __name__ == '__main__':
    main()
