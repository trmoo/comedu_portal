/*!
 * 선생님용 복사 안내 그림을 PNG 로 뽑는다 — © 2026 티쳐무 · 모든 권리 보유
 *
 * 실행 (comedu_portal 폴더에서):  node tools/export-guide-images.mjs
 * 결과는 guide/ 폴더에 2배 해상도 PNG 로 나온다.
 *   common-2-2-auth.png     권한 승인 (모든 앱 공통)
 *   common-3-1-editor.png   확장 프로그램 → Apps Script → 배포 → 새 배포
 *   common-3-2-deploy.png   새 배포 창 (웹 앱 · 나 · 모든 사용자)
 *   common-3-3-url.png      웹 앱 URL 복사 → 학생에게
 *   <key>-2-1-menu.png      앱 메뉴 → 시트 준비 (앱마다 메뉴 이름이 달라서 따로)
 *   <key>-guide.png         한 장짜리 전체 안내 — 사본 링크가 준비된 앱만 (메신저로 보내기 좋게)
 *
 * 그림은 guide-figures.js, 앱 이름·메뉴·사본 링크는 index.html 의 DATA 에서 그대로 읽는다.
 * 같은 값을 여기에 또 적지 않는다 — 메뉴 이름을 고칠 곳은 index.html 한 곳뿐이다.
 * 찍는 도구는 이 PC 의 Edge(없으면 Chrome) 헤드리스 모드다. 따로 설치할 것이 없다.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'guide');
fs.mkdirSync(OUT, { recursive: true });

// ① 그림 부품 — 브라우저용 파일을 node 에서 그대로 돌린다
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(ROOT, 'guide-figures.js'), 'utf8'), ctx);
const GF = ctx.GuideFigures;

// ② 앱 목록 — index.html 의 DATA 배열을 꺼내 읽는다 (DATA 는 값만 있는 배열이라 그대로 계산해도 된다)
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const found = html.match(/const DATA = (\[[\s\S]*?\n\]);/);
if (!found) throw new Error('index.html 에서 DATA 배열을 찾지 못했습니다');
const DATA = new Function('return ' + found[1])();
const APPS = DATA.flatMap(g => g.items).filter(it => it.teacher);

function sheetId(s) {
  if (!s) return '';
  const m = String(s).match(/\/d\/([A-Za-z0-9_-]{20,})/);
  if (m) return m[1];
  return /^[A-Za-z0-9_-]{20,}$/.test(s) ? s : '';
}
const copyUrl = t => (sheetId(t.sheet) ? `https://docs.google.com/spreadsheets/d/${sheetId(t.sheet)}/copy` : '');

// ③ 찍는 도구
const BROWSERS = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
];
const BROWSER = BROWSERS.find(p => fs.existsSync(p));
if (!BROWSER) throw new Error('Edge 나 Chrome 을 찾지 못했습니다');
// 열려 있는 선생님 브라우저와 섞이지 않게 빈 프로필로 띄운다
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-fig-'));

function sizeOf(svg) {
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  return { w: Number(m[1]), h: Number(m[2]) };
}
function shoot(svg, file) {
  const { w, h } = sizeOf(svg);
  const page = path.join(TMP, 'page.html');
  fs.writeFileSync(page, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;background:#fff;overflow:hidden}svg{display:block}</style>${svg}`);
  const out = path.join(OUT, file);
  execFileSync(BROWSER, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    `--user-data-dir=${path.join(TMP, 'profile')}`, '--force-device-scale-factor=2',
    `--window-size=${w},${h}`, `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: 'ignore', timeout: 60000 });
  const png = fs.readFileSync(out);
  const pw = png.readUInt32BE(16), ph = png.readUInt32BE(20);
  console.log(`  ${file}  ${pw}×${ph}  ${(png.length / 1024).toFixed(0)}KB`);
  if (pw !== w * 2 || ph !== h * 2) console.warn(`  ⚠ 크기가 예상(${w * 2}×${h * 2})과 다릅니다`);
}

// ④ 한 장짜리 전체 안내 — 그림 SVG 를 한 장 안에 차곡차곡 넣는다
function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function text(x, y, s, o = {}) {
  return `<text x="${x}" y="${y}" font-size="${o.size || 15}" font-weight="${o.weight || 400}" fill="${o.fill || '#1f2a44'}"` +
    (o.anchor ? ` text-anchor="${o.anchor}"` : '') + (o.mono ? ` font-family="Consolas,monospace"` : '') + `>${esc(s)}</text>`;
}
function poster(app) {
  const t = app.teacher, url = copyUrl(t);
  const W = 800, M = 20, IW = W - M * 2;
  let s = '', y = 0;
  const place = svg => {                       // 그림 한 장을 가로 IW 에 맞춰 넣는다
    const { w, h } = sizeOf(svg);
    const hh = Math.round(h * IW / w);
    s += svg.replace(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 (\d+) (\d+)" width="\d+" height="\d+"/,
      `<svg x="${M}" y="${y}" viewBox="0 0 $1 $2" width="${IW}" height="${hh}"`);
    y += hh + 12;
  };
  const step = (n, title) => {
    y += 14;
    s += `<circle cx="${M + 18}" cy="${y + 16}" r="17" fill="#047857"/>` + text(M + 18, y + 22, n, { size: 17, weight: 800, fill: '#fff', anchor: 'middle' });
    s += text(M + 46, y + 23, title, { size: 19, weight: 800 });
    y += 46;
  };

  s += `<rect x="${M}" y="16" width="${IW}" height="108" rx="18" fill="#047857"/>`;
  s += text(M + 26, 62, `${app.icon} ${app.title}`, { size: 27, weight: 800, fill: '#fff' });
  s += text(M + 26, 96, '선생님 드라이브에 복사해 쓰는 법 · 5분이면 끝나요', { size: 16.5, weight: 600, fill: '#d1fae5' });
  y = 132;

  step('1', '사본 만들기 링크를 열고 [사본 만들기]를 누릅니다');
  s += `<rect x="${M}" y="${y}" width="${IW}" height="42" rx="10" fill="#fff" stroke="#cfd6e3"/>` +
    text(M + 14, y + 27, url, { size: 13, mono: true, fill: '#1a73e8' });
  y += 52;
  s += text(M + 4, y + 8, '구글에 로그인한 상태에서 여세요. 시트에 붙은 Apps Script 도 함께 복사됩니다.', { size: 14, fill: '#5b6785' });
  y += 16;

  step('2', '사본 시트의 앱 메뉴에서 시트를 준비하고 권한을 승인합니다');
  place(GF.menu({ title: app.title, menu: t.menu, setup: t.setup }));
  place(GF.auth());
  s += text(M + 4, y + 4, '파란 「안전한 페이지로 돌아가기」를 누르면 승인이 멈춰요. 체크 상자가 없으면 [허용]을 누르세요.', { size: 14, weight: 700, fill: '#dc2626' });
  y += 14;

  step('3', 'Apps Script 편집기에서 웹 앱으로 배포하고 주소를 학생에게');
  place(GF.editor());
  place(GF.deploy());
  place(GF.url());

  // 끝 상자
  y += 4;
  const lines = [
    ['✅ 확인: 시크릿 창(Ctrl+Shift+N)에서 그 주소를 열어 학번 화면이 뜨면 성공입니다.', 700, '#047857'],
    ['· 학생 답은 선생님 시트에만 저장됩니다. 비밀번호는 해시로만 저장되어 선생님도 볼 수 없어요.', 400, '#1f2a44'],
    ['· 사본은 만든 날의 버전 그대로예요. 새 학기에는 사본을 새로 만들어 쓰세요.', 400, '#1f2a44'],
    ['· 학교 계정에 「모든 사용자」가 없으면 개인 Gmail 계정으로 처음부터 다시 하세요.', 400, '#1f2a44'],
  ];
  const bh = 30 + lines.length * 28;
  s += `<rect x="${M}" y="${y}" width="${IW}" height="${bh}" rx="16" fill="#e3f7ef" stroke="#10b981" stroke-width="1.5"/>`;
  lines.forEach(([l, wgt, fill], i) => { s += text(M + 20, y + 34 + i * 28, l, { size: 14.5, weight: wgt, fill }); });
  y += bh + 18;
  s += text(W / 2, y + 6, '© 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로 이용해 주세요 · 그림은 실제 화면을 단순하게 다시 그린 안내도입니다', { size: 12, fill: '#5b6785', anchor: 'middle' });
  y += 26;

  const FONT = "Pretendard,'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${y}" width="${W}" height="${y}" font-family="${FONT}">` +
    `<rect width="${W}" height="${y}" fill="#f6f8fc"/>` + s + `</svg>`;
}

console.log('안내 그림을 뽑습니다 →', path.relative(process.cwd(), OUT) || OUT);
shoot(GF.auth(), 'common-2-2-auth.png');
shoot(GF.editor(), 'common-3-1-editor.png');
shoot(GF.deploy(), 'common-3-2-deploy.png');
shoot(GF.url(), 'common-3-3-url.png');
for (const app of APPS) {
  const t = app.teacher;
  shoot(GF.menu({ title: app.title, menu: t.menu, setup: t.setup }), `${t.key}-2-1-menu.png`);
  if (copyUrl(t)) shoot(poster(app), `${t.key}-guide.png`);
  else console.log(`  (${t.key}: 사본 링크가 아직 없어 한 장짜리 안내는 건너뜁니다)`);
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log('끝.');
