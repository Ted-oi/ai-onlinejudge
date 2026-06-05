"""Fix empty categories for Luogu problems by re-scraping tags."""
import sys, json, time, re, psycopg2
sys.stdout.reconfigure(encoding='utf-8')
from DrissionPage import ChromiumPage, ChromiumOptions

DB_CONFIG = {'host': 'localhost', 'port': 5432, 'database': 'onlinejudge', 'user': 'postgres'}

def create_browser():
    co = ChromiumOptions()
    co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    co.headless()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_argument('--lang=zh-CN')
    return ChromiumPage(co)

def fetch_tags(page, pid):
    page.get(f'https://www.luogu.com.cn/problem/{pid}')
    time.sleep(3)
    html = page.html
    match = re.search(r'<script id="lentille-context" type="application/json">(.*?)</script>', html, re.DOTALL)
    if not match:
        return None
    try:
        data = json.loads(match.group(1))
        prob = data.get('data', {}).get('problem', {})
        content = prob.get('content', {})
        if not content.get('description'):
            return None
    except:
        return None

    # Try scraping tag links from the page
    tags = []
    tag_elems = page.eles('css:a[href*="tag"]')
    for te in tag_elems:
        tag_text = (te.text or '').strip()
        if tag_text and 2 <= len(tag_text) <= 30 and not tag_text.isdigit():
            tags.append(tag_text)
    tags = list(dict.fromkeys(tags))

    # Fallback: extract from body text
    if not tags:
        body = page.ele('tag:body')
        if body:
            body_text = body.text or ''
            # Click show tags button if exists
            try:
                btn = page.ele('text:显示算法标签')
                if btn:
                    btn.click()
                    time.sleep(1)
            except:
                pass
            tag_elems = page.eles('css:a[href*="tag"]')
            for te in tag_elems:
                tag_text = (te.text or '').strip()
                if tag_text and 2 <= len(tag_text) <= 30 and not tag_text.isdigit():
                    tags.append(tag_text)
            tags = list(dict.fromkeys(tags))

    return tags

conn = psycopg2.connect(**DB_CONFIG)
conn.autocommit = False
cur = conn.cursor()

cur.execute(r"""
    SELECT id, title FROM problems
    WHERE title ~ '\[P\d+\]' AND (categories = '[]'::jsonb OR categories IS NULL)
    ORDER BY id
""")
empty_problems = cur.fetchall()
print(f'Found {len(empty_problems)} problems with empty categories')

# Deduplicate by extracting P-number
seen = {}
for db_id, title in empty_problems:
    m = re.search(r'\[P(\d+)\]', title)
    if m:
        pnum = int(m.group(1))
        if pnum not in seen:
            seen[pnum] = []
        seen[pnum].append(db_id)

print(f'Unique problems: {len(seen)}')
print('Starting browser...')
page = create_browser()
page.get('https://www.luogu.com.cn/')
time.sleep(3)
print('Browser ready\n')

success = fail = 0
for i, (pnum, db_ids) in enumerate(sorted(seen.items())):
    pid = f'P{pnum}'
    print(f'[{i+1}/{len(seen)}] {pid} (DB:{",".join(map(str,db_ids))})...', end=' ', flush=True)
    try:
        tags = fetch_tags(page, pid)
        if tags is None:
            print('SKIP (page not found)')
            fail += 1
            continue
        category = tags[0] if tags else '洛谷'
        for db_id in db_ids:
            cur.execute('UPDATE problems SET categories = %s, category = %s WHERE id = %s',
                        (json.dumps(tags, ensure_ascii=False), category, db_id))
        conn.commit()
        print(f'OK ({len(tags)} tags: {", ".join(tags[:3])})')
        success += 1
    except Exception as e:
        conn.rollback()
        print(f'ERROR: {str(e)[:60]}')
        fail += 1
    time.sleep(2)

cur.close()
conn.close()
page.quit()
print(f'\nDone! Success: {success}, Failed: {fail}')
