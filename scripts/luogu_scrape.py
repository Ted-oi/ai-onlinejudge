"""
Luogu Problem Scraper - extracts problems from luogu.com.cn and imports into AI OnlineJudge
Usage: python luogu_scrape.py [start_id] [end_id] [api_base]
  start_id: first problem number (default: 1000)
  end_id: last problem number (default: 1100)
  api_base: OJ API base URL (default: http://localhost:5000)

Supports resume: progress is saved to luogu_progress.json
"""
import sys, json, time, re, os, requests
sys.stdout.reconfigure(encoding='utf-8')

from DrissionPage import ChromiumPage, ChromiumOptions

DIFFICULTY_MAP = {
    '入门': 'easy',
    '普及−': 'easy',
    '普及/提高−': 'medium',
    '普及+/提高': 'medium',
    '提高+/省选−': 'hard',
    '省选/NOI−': 'hard',
    'NOI/NOI+': 'hard',
    'NOI': 'hard',
    'NOI+': 'hard',
    'CTSC': 'hard',
    '提高': 'hard',
    '普及': 'easy',
}


def create_browser():
    co = ChromiumOptions()
    co.set_browser_path(r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe')
    co.headless()
    co.set_argument('--no-sandbox')
    co.set_argument('--disable-gpu')
    co.set_argument('--lang=zh-CN')
    return ChromiumPage(co)


def elem_to_markdown(elem):
    """Convert a rendered HTML element to markdown, preserving images."""
    parts = []
    tag = elem.tag

    if tag == 'img':
        src = elem.attr('src') or ''
        alt = elem.attr('alt') or ''
        if src and 'luogu.com.cn/upload/image' in src:
            parts.append(f'\n![{alt}]({src})\n')
        return parts

    # Get inner HTML to find inline images
    try:
        inner_html = elem.html or ''
    except:
        inner_html = ''

    # Check for child images in the HTML
    has_imgs = '<img' in inner_html and 'luogu.com.cn/upload/image' in inner_html

    if has_imgs:
        # Parse the HTML to build markdown with images
        # Split HTML by <img> tags
        segments = re.split(r'(<img\s[^>]*>)', inner_html)
        for seg in segments:
            img_match = re.match(r'<img\s[^>]*src=["\']([^"\']+)["\'](?:\s[^>]*alt=["\']([^"\']*)["\'])?', seg)
            if img_match:
                src = img_match.group(1)
                alt = img_match.group(2) or ''
                if 'luogu.com.cn/upload/image' in src:
                    parts.append(f'\n![{alt}]({src})\n')
            else:
                # Text segment - strip HTML tags and get plain text
                text = re.sub(r'<[^>]+>', '', seg).strip()
                if text:
                    parts.append(text)
    else:
        text = elem.text or ''
        if text:
            parts.append(text)

    return parts


def parse_samples_from_text(text):
    """Parse sample input/output from section text."""
    samples = []
    if not text:
        return samples
    input_blocks = re.split(r'输入\s*#\d+\s*(?:复制)?\s*\n', text)
    for block in input_blocks[1:]:
        output_match = re.search(r'输出\s*#\d+\s*(?:复制)?\s*\n(.*?)(?:\n输入\s*#\d+|$)', block, re.DOTALL)
        inp = block.split('\n输出')[0].strip() if '输出' in block else block.strip()
        out = output_match.group(1).strip() if output_match else ''
        samples.append({'input': inp, 'output': out})
    return samples


def scrape_problem(page, pid):
    """Scrape a single problem from Luogu."""
    url = f'https://www.luogu.com.cn/problem/{pid}'
    page.get(url)
    time.sleep(3)

    body = page.ele('tag:body')
    if not body:
        return None
    body_text = body.text or ''

    if '页面未找到' in body_text or '出错了' in body_text:
        return None

    # Title
    title = ''
    title_elem = page.ele('css:h1')
    if title_elem:
        raw_title = title_elem.text or ''
        title = re.sub(r'^P\d+\s*', '', raw_title).strip()
    if not title:
        return None

    # Difficulty
    difficulty = 'medium'
    diff_found = False
    diff_elems = page.eles('css:span[class*="difficulty"], css:[class*=difficulty]')
    for de in diff_elems:
        dt = (de.text or '').strip()
        if dt in DIFFICULTY_MAP:
            difficulty = DIFFICULTY_MAP[dt]
            diff_found = True
            break
    if not diff_found:
        for diff_label, diff_val in DIFFICULTY_MAP.items():
            if diff_label in body_text:
                difficulty = diff_val
                break

    # Time & memory limits
    time_limit = 1000
    memory_limit = 256
    time_match = re.search(r'时间限制[：:]\s*([\d.]+)\s*s', body_text)
    if time_match:
        time_limit = max(1000, int(float(time_match.group(1)) * 1000))
    mem_match = re.search(r'内存限制[：:]\s*([\d.]+)\s*(MB|GB)', body_text)
    if mem_match:
        val = float(mem_match.group(1))
        memory_limit = int(val) if mem_match.group(2) == 'MB' else int(val * 1024)

    # Tags - click to reveal algorithm tags
    tags = []
    try:
        show_tag_btn = page.ele('text:显示算法标签')
        if show_tag_btn:
            show_tag_btn.click()
            time.sleep(1)
    except:
        pass
    tag_elems = page.eles('css:a[href*="tag"]')
    for te in tag_elems:
        tag_text = (te.text or '').strip()
        if tag_text and 2 <= len(tag_text) <= 20 and not tag_text.isdigit():
            tags.append(tag_text)
    tags = list(dict.fromkeys(tags))

    result = {
        'pid': pid,
        'title': title,
        'difficulty': difficulty,
        'time_limit': time_limit,
        'memory_limit': memory_limit,
        'tags': tags,
        'background': '',
        'description': '',
        'input_format': '',
        'output_format': '',
        'samples': [],
        'hint': '',
    }

    # Extract sections with image support
    sections = page.eles('css:h2')
    for s in sections:
        h2_text = s.text or ''
        if '背景' in h2_text:
            key = 'background'
        elif '描述' in h2_text:
            key = 'description'
        elif '输入格式' in h2_text:
            key = 'input_format'
        elif '输出格式' in h2_text:
            key = 'output_format'
        elif '样例' in h2_text:
            key = '_samples_text'
        elif '说明' in h2_text or '提示' in h2_text:
            key = 'hint'
        else:
            continue

        # Collect content between h2 elements, preserving images
        content_parts = []
        elem = s
        for _ in range(40):
            try:
                elem = elem.next()
                if elem is None or elem.tag == 'h2':
                    break
                md_parts = elem_to_markdown(elem)
                content_parts.extend(md_parts)
            except:
                break

        content = '\n'.join(p for p in content_parts if p).strip()

        if key == '_samples_text':
            result['samples'] = parse_samples_from_text(content)
        elif key in result:
            result[key] = content

    return result


def insert_problem(problem, api_base, token):
    """Insert problem into the OJ database via API."""
    session = requests.Session()
    headers = {'Authorization': f'Bearer {token}'}

    desc_parts = []
    if problem.get('background'):
        desc_parts.append(f'## 题目背景\n\n{problem["background"]}')
    if problem.get('description'):
        desc_parts.append(f'## 题目描述\n\n{problem["description"]}')
    if problem.get('input_format'):
        desc_parts.append(f'## 输入格式\n\n{problem["input_format"]}')
    if problem.get('output_format'):
        desc_parts.append(f'## 输出格式\n\n{problem["output_format"]}')

    examples = []
    for sample in problem.get('samples', []):
        examples.append({
            'input': sample.get('input', ''),
            'output': sample.get('output', ''),
        })

    desc = '\n\n'.join(desc_parts)
    if problem.get('hint'):
        desc += f'\n\n## 说明/提示\n\n{problem["hint"]}'

    category = problem['tags'][0] if problem.get('tags') else '洛谷'

    payload = {
        'title': f'[{problem["pid"]}] {problem["title"]}',
        'description': desc,
        'difficulty': problem['difficulty'],
        'category': category,
        'categories': problem.get('tags', []),
        'time_limit': problem.get('time_limit', 1000),
        'memory_limit': problem.get('memory_limit', 256),
        'examples': examples,
        'problem_type': 'coding',
    }

    resp = session.post(f'{api_base}/api/problems', json=payload, headers=headers)
    if resp.status_code in [200, 201]:
        data = resp.json()
        problem_id = data.get('data', {}).get('problem', {}).get('id')
        return problem_id
    else:
        print(f'\n  Insert failed ({resp.status_code}): {resp.text[:200]}')
        return False


def main():
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    end = int(sys.argv[2]) if len(sys.argv) > 2 else 1100
    api_base = sys.argv[3] if len(sys.argv) > 3 else 'http://localhost:5000'
    delay = 2

    print('=' * 50)
    print('  Luogu Problem Scraper v2')
    print('=' * 50)
    print(f'  Range: P{start} - P{end} ({end - start + 1} problems)')
    print(f'  API: {api_base}')
    print()

    # Login to OJ API
    print('Logging into OJ API...')
    try:
        login_resp = requests.post(f'{api_base}/api/auth/login', json={
            'account': 'admin', 'password': 'admin123'
        }, timeout=10)
        token = login_resp.json().get('data', {}).get('token')
        if not token:
            print(f'Login failed: {login_resp.text[:200]}')
            return
    except Exception as e:
        print(f'API connection failed: {e}')
        return
    print('API login OK')

    # Load progress
    progress_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'luogu_progress.json')
    progress = {}
    if os.path.exists(progress_file):
        with open(progress_file, 'r', encoding='utf-8') as f:
            progress = json.load(f)
        done = sum(1 for v in progress.values() if v.get('status') == 'ok')
        print(f'Progress: {done} problems already imported')

    # Start browser
    print('Starting browser...')
    page = create_browser()
    page.get('https://www.luogu.com.cn/')
    time.sleep(3)
    print('Browser ready\n')

    success = 0
    fail = 0
    skip = 0

    try:
        for i in range(start, end + 1):
            pid = f'P{i}'

            if pid in progress and progress[pid].get('status') == 'ok':
                skip += 1
                continue

            print(f'[{i - start + 1}/{end - start + 1}] {pid}...', end=' ')

            try:
                problem = scrape_problem(page, pid)

                if problem is None:
                    print('SKIP (not found)')
                    progress[pid] = {'status': 'skip', 'reason': 'not_found'}
                    fail += 1
                elif not problem.get('description'):
                    print('SKIP (no description)')
                    progress[pid] = {'status': 'skip', 'reason': 'no_desc'}
                    fail += 1
                else:
                    problem_id = insert_problem(problem, api_base, token)
                    if problem_id:
                        sc = len(problem.get('samples', []))
                        ts = ', '.join(problem.get('tags', []))
                        has_img = '![' in problem.get('description', '') or '![' in problem.get('hint', '')
                        img_flag = ' [IMG]' if has_img else ''
                        print(f'OK (ID:{problem_id}, {problem["difficulty"]}, s:{sc}, t:[{ts}]){img_flag}')
                        progress[pid] = {
                            'status': 'ok', 'oj_id': problem_id,
                            'title': problem['title'],
                            'difficulty': problem['difficulty'],
                        }
                        success += 1
                    else:
                        progress[pid] = {'status': 'fail', 'reason': 'insert_failed'}
                        fail += 1
            except Exception as e:
                print(f'ERROR: {str(e)[:80]}')
                progress[pid] = {'status': 'error', 'reason': str(e)[:100]}
                fail += 1

            with open(progress_file, 'w', encoding='utf-8') as f:
                json.dump(progress, f, ensure_ascii=False)

            time.sleep(delay)

    except KeyboardInterrupt:
        print('\n\nInterrupted. Progress saved.')
    finally:
        page.quit()

    print(f'\n{"=" * 50}')
    print(f'  Done! Success: {success}, Failed: {fail}, Skipped: {skip}')
    print(f'{"=" * 50}')


if __name__ == '__main__':
    main()
