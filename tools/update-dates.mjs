/*
 * 카드마다 「처음 만든 날」과 「최종 업데이트」 날짜를 모아 updated.js 로 적는다.
 * © 2026 티쳐무
 *
 * 쓰는 법:  node tools/update-dates.mjs
 *   - 앱을 고쳐 푸시한 뒤 한 번 돌리고, 바뀐 updated.js 를 함께 커밋한다.
 *
 * 어디서 날짜를 가져오나:
 *   - 깃허브 저장소의 기본 브랜치 마지막 커밋 날짜(한국 시각).
 *   - 저장소 이름은 카드의 url(https://trmoo.github.io/<저장소>/) 에서 읽고,
 *     제출형 활동지는 teacher.repo 에 적어 둔 이름을 쓴다.
 *   - 저장소가 없는 카드는 made·updated(제출형은 teacher.made·teacher.updated)에 "2026-11-05" 처럼 손으로 적는다.
 *     손으로 적은 값이 있으면 그것이 이긴다.
 *
 * 화면이 깃허브 API 를 직접 부르지 않는 까닭:
 *   로그인 없이 부르면 한 사람(IP)당 한 시간에 60번뿐이라, 카드가 40장인 이 포털은
 *   한 번 열기만 해도 한도를 거의 다 쓴다. 그래서 미리 모아 두는 파일로 만든다.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'index.html'), 'utf8');
const found = html.match(/const DATA = (\[[\s\S]*?\n\]);/);
if (!found) throw new Error('index.html 에서 DATA 배열을 찾지 못했습니다');
const DATA = new Function('return ' + found[1])();

// 카드 → 저장소 이름
function repoOf(it) {
  if (it.teacher) return it.teacher.repo || '';
  const m = (it.url || '').match(/^https:\/\/trmoo\.github\.io\/([^/]+)\/?/);
  return m ? m[1] : '';
}

const OWNER = 'trmoo';
const headers = { 'User-Agent': 'comedu-portal-dates', Accept: 'application/vnd.github+json' };

// 로그인 없이 부르면 한 시간에 60번이라 금세 막힌다(403).
// 환경 변수 GITHUB_TOKEN 이 없으면 푸시할 때 쓰는 깃 자격 증명을 빌린다(화면에 찍지 않는다).
let token = process.env.GITHUB_TOKEN || '';
if (!token) {
  try {
    const out = execSync('git credential fill', {
      input: 'protocol=https\nhost=github.com\n\n', encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'],
    });
    token = (out.match(/^password=(.*)$/m) || [])[1] || '';
  } catch { /* 없으면 로그인 없이 부른다 */ }
}
if (token) headers.Authorization = `Bearer ${token}`;

// 못 읽은 저장소는 지난번 날짜를 그대로 둔다 (옛 판의 "저장소": "날짜" 꼴도 읽는다)
const prevFile = join(root, 'updated.js');
let prev = {};
if (existsSync(prevFile)) {
  const w = {};
  try { new Function('window', readFileSync(prevFile, 'utf8'))(w); } catch { /* 깨졌으면 새로 만든다 */ }
  for (const [k, v] of Object.entries(w.UPDATED || {})) prev[k] = typeof v === 'string' ? { updated: v } : v;
}

// 한국 시각(UTC+9)의 날짜 YYYY-MM-DD
function kstDate(iso) {
  const d = new Date(new Date(iso).getTime() + 9 * 3600 * 1000);
  return d.toISOString().slice(0, 10);
}

// 날짜로 치지 않는 커밋 (첫 줄 기준) — 개발 기록 파일 정리
const SKIP = /^[^\n]*CLAUDE\.md/;

const api = (path) => fetch(`https://api.github.com/repos/${OWNER}/${path}`, { headers });

// 처음 만든 날 = 가장 오래된 커밋. 커밋 목록은 최신부터라 Link 머리글의 마지막 쪽을 한 번 더 부른다.
async function firstCommitDate(repo) {
  const res = await api(`${repo}/commits?per_page=1`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const last = /<([^>]+)>;\s*rel="last"/.exec(res.headers.get('link') || '');
  const list = last ? await (await fetch(last[1], { headers })).json() : await res.json();
  const c = list[list.length - 1];
  return c ? kstDate(c.commit.committer.date) : '';
}

const repos = [...new Set(DATA.flatMap(g => g.items).map(repoOf).filter(Boolean))].sort();
const dates = {};
const failed = [];
for (const repo of repos) {
  try {
    const res = await api(`${repo}/commits?per_page=20`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const list = await res.json();
    // 앱 내용과 상관없는 정리 커밋은 건너뛴다 — 2026-10-22 에 35개 저장소에서 한꺼번에
    // 「CLAUDE.md 를 저장소에서 뺀다」 커밋을 했는데, 이것을 세면 거의 모든 카드가 같은 날짜가 된다.
    const c = list.find(x => !SKIP.test(x.commit.message)) || list[0];
    if (!c) throw new Error('커밋 없음');
    dates[repo] = { made: await firstCommitDate(repo), updated: kstDate(c.commit.committer.date) };
  } catch (e) {
    failed.push(`${repo} (${e.message}${prev[repo] ? ' — 지난번 날짜를 그대로 둠' : ''})`);
    if (prev[repo]) dates[repo] = prev[repo];
  }
}

const body = Object.entries(dates)
  .map(([k, v]) => `  ${JSON.stringify(k)}: { made: "${v.made || ''}", updated: "${v.updated || ''}" },`).join('\n');
writeFileSync(join(root, 'updated.js'),
`/* 카드의 「처음 만든 날」·「최종 업데이트」 날짜 — node tools/update-dates.mjs 가 만든다. 손으로 고치지 말 것.
 * 열쇠는 깃허브 저장소 이름. made = 첫 커밋, updated = 마지막 커밋(CLAUDE.md 정리 커밋 제외), 모두 한국 시각.
 * © 2026 티쳐무 */
window.UPDATED = {
${body}
};
`);

console.log(`저장소 ${repos.length}곳 중 ${Object.keys(dates).length}곳의 날짜를 updated.js 에 적었습니다.`);
const noRepo = DATA.flatMap(g => g.items).filter(it => !repoOf(it) && !(it.updated || it.teacher?.updated || it.made || it.teacher?.made));
if (noRepo.length) console.log('저장소도 손으로 적은 날짜도 없어 날짜를 안 보이는 카드:\n  ' + noRepo.map(it => it.title).join('\n  '));
if (failed.length) { console.log('못 읽은 저장소:\n  ' + failed.join('\n  ')); process.exitCode = 1; }
