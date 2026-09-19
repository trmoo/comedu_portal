/*!
 * 선생님용 복사 안내 그림 — © 2026 티쳐무 · 모든 권리 보유
 *
 * 실제 화면을 찍은 것이 아니라 단순하게 다시 그린 안내도(SVG)다.
 * 단추·메뉴 이름은 2026년 9월의 한국어 화면을 따랐다. 구글이 화면을 바꾸면 모양이 조금 달라질 수 있다.
 *
 * 브라우저에서는 window.GuideFigures, node 에서는 globalThis.GuideFigures 로 쓴다.
 * (tools/export-guide-images.mjs 가 이 파일을 그대로 읽어 PNG 로 뽑는다 — DOM 을 쓰지 말 것)
 */
(function (root) {
  'use strict';

  var C = {
    ink: '#1f2a44', soft: '#5b6785', faint: '#e7ebf2', grid: '#eef1f6',
    line: '#cfd6e3', bar: '#f1f4f9',
    hl: '#f97316', blue: '#1a73e8', green: '#047857', greenSoft: '#e3f7ef',
    red: '#dc2626', amber: '#f59e0b'
  };
  var FONT = "Pretendard,'Malgun Gothic','Apple SD Gothic Neo','Noto Sans KR',sans-serif";

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 글자 폭 어림 — 강조 테두리를 글자 길이에 맞추려고 쓴다 (조금 넉넉하게 잡는다)
  function tw(s, size) {
    var w = 0;
    Array.from(String(s)).forEach(function (ch) {
      var c = ch.codePointAt(0);
      if (c >= 0xAC00 && c <= 0xD7A3) w += size * 0.97;   // 한글
      else if (c >= 0x1F000) w += size * 1.25;             // 그림 글자(이모지)
      else if (c >= 0x2000) w += size * 1.0;               // ① › … 같은 기호
      else if (ch === ' ') w += size * 0.3;
      else if (/[A-Z]/.test(ch)) w += size * 0.66;
      else w += size * 0.56;
    });
    return Math.round(w);
  }

  // ── 그리기 부품 ───────────────────────────────────────────
  function T(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" font-size="' + (o.size || 14) + '" font-weight="' + (o.weight || 400) +
      '" fill="' + (o.fill || C.ink) + '"' + (o.anchor ? ' text-anchor="' + o.anchor + '"' : '') +
      (o.mono ? ' font-family="Consolas,\'D2Coding\',monospace"' : '') + '>' + esc(s) + '</text>';
  }
  function R(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r == null ? 6 : o.r) +
      '" fill="' + (o.fill || '#fff') + '" stroke="' + (o.stroke || 'none') + '" stroke-width="' + (o.sw || 1) + '"' +
      (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + '/>';
  }
  function LINE(x1, y1, x2, y2, color) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (color || C.faint) + '"/>';
  }
  // 누를 곳을 두르는 주황 테두리
  function HL(x, y, w, h) { return R(x - 5, y - 5, w + 10, h + 10, { fill: 'none', stroke: C.hl, sw: 3, r: 9 }); }
  // 누르는 차례 번호
  function N(n, x, y) {
    return '<circle cx="' + x + '" cy="' + y + '" r="13" fill="' + C.hl + '" stroke="#fff" stroke-width="2"/>' +
      T(x, y + 5, n, { size: 14, weight: 800, fill: '#fff', anchor: 'middle' });
  }
  // 테두리 + 번호. 번호는 테두리 모서리보다 조금 바깥에 달아 글자를 가리지 않게 한다.
  // pos: 'tl' 왼쪽 위(기본) · 'tr' 오른쪽 위 — 바로 위에 이름표가 있는 넓은 칸은 'tr' 로 단다
  function HLN(x, y, w, h, n, pos) {
    var cx = pos === 'tr' ? x + w + 9 : x - 9;
    return HL(x, y, w, h) + N(n, cx, y - 9);
  }
  // 글자 대신 쓰는 회색 막대 (읽을 필요 없는 글)
  function BAR(x, y, w, h) { h = h || 8; return R(x, y, w, h, { fill: C.faint, r: h / 2 }); }
  function SHADOW(x, y, w, h, r) { return R(x + 3, y + 5, w, h, { fill: 'rgba(20,30,60,.12)', r: r || 10 }); }
  function PANEL(x, y, w, h) { return SHADOW(x, y, w, h, 14) + R(x, y, w, h, { fill: '#fff', stroke: C.line, r: 14 }); }
  function WIN(x, y, w, h) {
    return SHADOW(x, y, w, h, 12) + R(x, y, w, h, { fill: '#fff', stroke: C.line, r: 12 }) +
      '<path d="M' + x + ' ' + (y + 12) + 'a12 12 0 0 1 12-12h' + (w - 24) + 'a12 12 0 0 1 12 12v22h' + (-w) + 'z" fill="' + C.bar + '"/>' +
      LINE(x, y + 34, x + w, y + 34, C.line) +
      '<circle cx="' + (x + 18) + '" cy="' + (y + 17) + '" r="5" fill="#f87171"/>' +
      '<circle cx="' + (x + 34) + '" cy="' + (y + 17) + '" r="5" fill="#fbbf24"/>' +
      '<circle cx="' + (x + 50) + '" cy="' + (y + 17) + '" r="5" fill="#34d399"/>';
  }
  function MENU(x, y, w, h) { return SHADOW(x, y, w, h, 8) + R(x, y, w, h, { fill: '#fff', stroke: C.line, r: 8 }); }
  // 펼친 목록에서 고를 한 줄
  function PICK(x, y, w, label, n) {
    return R(x, y, w, 32, { fill: C.greenSoft, r: 6 }) + T(x + 12, y + 21, label, { size: 14, weight: 700 }) +
      HLN(x, y, w, 32, n);
  }
  function BTN(x, y, w, label, primary) {
    return R(x, y, w, 36, { fill: primary ? C.blue : '#fff', stroke: primary ? 'none' : C.line, r: 18 }) +
      T(x + w / 2, y + 23, label, { size: 13.5, weight: 700, fill: primary ? '#fff' : C.blue, anchor: 'middle' });
  }
  function CHECK(x, y) {
    return R(x, y, 18, 18, { fill: C.blue, r: 3 }) +
      '<path d="M' + (x + 4) + ' ' + (y + 9.5) + 'l3.5 3.5l6.5-7" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function SHEETICON(x, y) {
    return R(x, y, 24, 30, { fill: '#1e8e3e', r: 4 }) + R(x + 5, y + 10, 14, 14, { fill: '#fff', r: 1 }) +
      '<path d="M' + (x + 5) + ' ' + (y + 17) + 'h14M' + (x + 12) + ' ' + (y + 10) + 'v14" stroke="#1e8e3e" stroke-width="1.6"/>';
  }
  // 시트 칸(격자) 흉내 — letters: 열 이름(A, B, …)을 몇 개까지 적을지 (펼친 목록에 반쯤 가리는 글자가 없게)
  function GRID(x0, y0, x1, y1, letters) {
    var s = R(x0, y0, x1 - x0, 22, { fill: C.bar, r: 0 });
    for (var yy = y0 + 22; yy < y1; yy += 24) s += LINE(x0, yy, x1, yy, C.grid);
    for (var xx = x0 + 40, i = 0; xx < x1; xx += 96, i++) {
      s += LINE(xx, y0, xx, y1, C.grid);
      if (i < letters && xx + 48 < x1) s += T(xx + 48, y0 + 16, 'ABCDEFGH'.charAt(i), { size: 11, fill: C.soft, anchor: 'middle' });
    }
    return s;
  }
  function SVG(w, h, label, inner) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + w + ' ' + h + '" width="' + w + '" height="' + h +
      '" role="img" aria-label="' + esc(label) + '" font-family="' + FONT + '">' +
      R(0, 0, w, h, { fill: '#fbfcfe', r: 14 }) + inner + '</svg>';
  }

  // ── 그림 2-1 · 사본 시트의 앱 메뉴 → 시트 준비 ─────────────────
  // o = { title, menu, setup } — menu·setup 은 그 앱 Code.gs 의 메뉴 글자 그대로
  function menu(o) {
    var s = WIN(16, 14, 688, 352);
    s += SHEETICON(34, 58);
    s += T(70, 72, (o.title || '활동지') + '의 사본', { size: 15, weight: 700 });
    s += BAR(70, 82, 120, 7);

    // 메뉴 줄 — 앱 메뉴는 「도움말」 바로 오른쪽에 생긴다
    var y = 122, x = 70;
    ['파일', '수정', '보기', '삽입', '서식', '데이터', '도구', '확장 프로그램', '도움말'].forEach(function (it) {
      s += T(x, y, it, { size: 13.5, fill: C.soft });
      x += tw(it, 13.5) + 16;
    });
    s += GRID(24, 140, 696, 358, 4);

    var mw = tw(o.menu, 13.5);
    s += R(x - 6, y - 17, mw + 12, 24, { fill: C.greenSoft, r: 6 }) + T(x, y, o.menu, { size: 13.5, weight: 700 });
    s += HLN(x - 6, y - 17, mw + 12, 24, '1');

    var dw = Math.max(250, tw(o.setup, 14) + 64);
    var dx = Math.min(x - 6, 704 - 16 - dw), dy = y + 16;
    s += MENU(dx, dy, dw, 150);
    s += PICK(dx + 6, dy + 8, dw - 12, o.setup, '2');
    s += LINE(dx + 10, dy + 52, dx + dw - 10, dy + 52);
    [0.62, 0.48, 0.7].forEach(function (f, i) { s += BAR(dx + 18, dy + 68 + i * 26, Math.round((dw - 40) * f)); });
    return SVG(720, 380, '사본 시트 위쪽 메뉴 줄 끝의 「' + o.menu + '」 메뉴에서 「' + o.setup + '」 누르기', s);
  }

  // ── 그림 2-2 · 권한 승인 (확인하지 않은 앱 → 권한 고르기) ──────────
  function auth() {
    var s = '';
    // 왼쪽: 확인하지 않은 앱 경고
    var lx = 16, ly = 14, lw = 340, lh = 372;
    s += PANEL(lx, ly, lw, lh);
    s += '<path d="M' + (lx + 36) + ' ' + (ly + 58) + 'l15-27l15 27z" fill="' + C.amber + '"/>' +
      T(lx + 51, ly + 54, '!', { size: 15, weight: 800, fill: '#fff', anchor: 'middle' });
    s += T(lx + 24, ly + 92, 'Google에서 확인하지 않은 앱', { size: 17, weight: 800 });
    s += BAR(lx + 24, ly + 108, 290) + BAR(lx + 24, ly + 124, 262) + BAR(lx + 24, ly + 140, 200);

    s += T(lx + 24, ly + 190, '고급', { size: 14, weight: 700, fill: C.blue });
    s += HLN(lx + 24, ly + 175, tw('고급', 14), 20, '1');

    var bw = 164, bx = lx + lw - 24 - bw, by = ly + 168;
    s += BTN(bx, by, bw, '안전한 페이지로 돌아가기', true);
    s += '<circle cx="' + (bx + bw - 6) + '" cy="' + (by - 2) + '" r="11" fill="' + C.red + '" stroke="#fff" stroke-width="2"/>' +
      '<path d="M' + (bx + bw - 11) + ' ' + (by - 7) + 'l10 10M' + (bx + bw - 1) + ' ' + (by - 7) + 'l-10 10" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>';
    s += T(bx + bw / 2, by + 56, '이 단추는 누르지 마세요', { size: 12.5, weight: 800, fill: C.red, anchor: 'middle' });

    // 「고급」을 누르면 아래로 펼쳐지는 부분
    s += LINE(lx + 24, ly + 250, lx + lw - 24, ly + 250);
    s += BAR(lx + 24, ly + 266, 280) + BAR(lx + 24, ly + 282, 230);
    var go = '○○(으)로 이동(안전하지 않음)';
    s += T(lx + 24, ly + 322, go, { size: 13.5, weight: 700, fill: C.blue });
    s += LINE(lx + 24, ly + 326, lx + 24 + tw(go, 13.5), ly + 326, C.blue);
    s += HLN(lx + 24, ly + 307, tw(go, 13.5), 20, '2');
    s += T(lx + 24, ly + 354, '○○ 자리에는 앱(프로젝트) 이름이 나옵니다', { size: 11.5, fill: C.soft });

    // 오른쪽: 권한 고르기
    var rx = 372, ry = 14, rw = 332, rh = 372;
    s += PANEL(rx, ry, rw, rh);
    s += BAR(rx + 24, ry + 32, 230, 12) + BAR(rx + 24, ry + 52, 170, 12);
    s += CHECK(rx + 24, ry + 96) + T(rx + 52, ry + 110, '모두 선택', { size: 14, weight: 800 });
    s += HLN(rx + 24, ry + 96, 28 + tw('모두 선택', 14), 18, '3');
    s += LINE(rx + 24, ry + 132, rx + rw - 24, ry + 132);
    for (var i = 0; i < 3; i++) {
      var yy = ry + 150 + i * 44;
      s += CHECK(rx + 24, yy) + BAR(rx + 54, yy + 1, 200 - i * 30) + BAR(rx + 54, yy + 15, 150 - i * 20, 6);
    }
    var cy = ry + rh - 58;
    s += BTN(rx + rw - 24 - 78 - 12 - 72, cy, 72, '취소', false);
    s += BTN(rx + rw - 24 - 78, cy, 78, '계속', true);
    s += HLN(rx + rw - 24 - 78, cy, 78, 36, '4', 'tr');
    return SVG(720, 400, '권한 승인: 고급, 이동(안전하지 않음), 모두 선택, 계속 순서로 누르기', s);
  }

  // ── 그림 3-1 · 확장 프로그램 → Apps Script → 배포 → 새 배포 ───────────
  function editor() {
    var s = '';
    // 왼쪽: 사본 시트
    s += WIN(16, 14, 340, 332);
    var my = 72, mx = 34;
    ['데이터', '도구'].forEach(function (it) { s += T(mx, my, it, { size: 13.5, fill: C.soft }); mx += tw(it, 13.5) + 16; });
    var ex = mx, ew = tw('확장 프로그램', 13.5);
    s += T(ex + ew + 16, my, '도움말', { size: 13.5, fill: C.soft });
    s += GRID(24, 90, 348, 338, 1);
    s += R(ex - 6, my - 17, ew + 12, 24, { fill: C.greenSoft, r: 6 }) + T(ex, my, '확장 프로그램', { size: 13.5, weight: 700 });
    s += HLN(ex - 6, my - 17, ew + 12, 24, '1');
    var dx = ex - 6, dy = my + 16, dw = 200;
    s += MENU(dx, dy, dw, 128);
    s += T(dx + 18, dy + 30, '부가기능', { size: 13.5 }) + T(dx + dw - 18, dy + 30, '›', { size: 16, fill: C.soft, anchor: 'end' });
    s += T(dx + 18, dy + 62, '매크로', { size: 13.5 }) + T(dx + dw - 18, dy + 62, '›', { size: 16, fill: C.soft, anchor: 'end' });
    s += PICK(dx + 6, dy + 80, dw - 12, 'Apps Script', '2');

    // 가운데 화살표 — 편집기는 새 탭으로 열린다
    s += '<circle cx="366" cy="190" r="15" fill="' + C.hl + '"/>' +
      '<path d="M360 183l8 7l-8 7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

    // 오른쪽: Apps Script 편집기
    var x0 = 376, y0 = 14, w0 = 328, h0 = 332;
    s += WIN(x0, y0, w0, h0);
    s += R(x0 + 14, y0 + 46, 26, 26, { fill: '#e8f0fe', r: 6 }) +
      T(x0 + 27, y0 + 63, '</>', { size: 10.5, weight: 800, fill: C.blue, anchor: 'middle' });
    s += T(x0 + 48, y0 + 57, 'Apps Script', { size: 11, fill: C.soft }) + BAR(x0 + 48, y0 + 63, 90, 7);
    // 편집기 본문 흉내 — 왼쪽 파일 목록 + 코드 줄
    for (var i = 0; i < 6; i++) s += BAR(x0 + 14, y0 + 100 + i * 24, 58 - (i % 3) * 8, 8);
    for (var j = 0; j < 8; j++) s += BAR(x0 + 96 + (j % 3) * 14, y0 + 100 + j * 26, 190 - (j % 4) * 34, 8);
    var bw = 86, bx = x0 + w0 - 14 - bw, by = y0 + 42;
    s += R(bx, by, bw, 32, { fill: C.blue, r: 16 }) + T(bx + 36, by + 21, '배포', { size: 13.5, weight: 700, fill: '#fff', anchor: 'middle' }) +
      '<path d="M' + (bx + 60) + ' ' + (by + 13) + 'l5 6l5-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
    s += HLN(bx, by, bw, 32, '3');
    var lw2 = 170, lx2 = x0 + w0 - 14 - lw2, ly2 = by + 46;
    s += MENU(lx2, ly2, lw2, 118);
    s += PICK(lx2 + 6, ly2 + 8, lw2 - 12, '새 배포', '4');
    s += T(lx2 + 18, ly2 + 70, '배포 테스트', { size: 13.5, fill: C.soft }) + T(lx2 + 18, ly2 + 100, '배포 관리', { size: 13.5, fill: C.soft });
    return SVG(720, 360, '확장 프로그램, Apps Script, 배포, 새 배포 순서로 누르기', s);
  }

  // ── 그림 3-2 · 새 배포 창 ───────────────────────────────────
  function SELECT(x, y, w, v) {
    return R(x, y, w, 36, { fill: '#fff', stroke: C.line, r: 6 }) + T(x + 12, y + 23, v, { size: 14, weight: 700 }) +
      '<path d="M' + (x + w - 24) + ' ' + (y + 15) + 'l6 7l6-7" fill="none" stroke="' + C.soft + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
  }
  function deploy() {
    var s = '';
    var x0 = 16, y0 = 14, w0 = 688, h0 = 440;
    s += PANEL(x0, y0, w0, h0);
    s += T(x0 + 24, y0 + 40, '새 배포', { size: 18, weight: 800 });
    s += T(x0 + w0 - 28, y0 + 40, '✕', { size: 16, fill: C.soft, anchor: 'middle' });
    s += LINE(x0, y0 + 60, x0 + w0, y0 + 60);

    // 왼쪽: 유형 선택
    var lx = x0 + 24, ly = y0 + 96;
    s += T(lx, ly, '유형 선택', { size: 14, weight: 700 });
    var gx = lx + tw('유형 선택', 14) + 24, gy = ly - 5;
    s += '<circle cx="' + gx + '" cy="' + gy + '" r="14" fill="' + C.bar + '"/>' + T(gx, gy + 5, '⚙', { size: 15, fill: C.soft, anchor: 'middle' });
    s += HLN(gx - 14, gy - 14, 28, 28, '1');
    var px = lx, py = ly + 24, pw = 184;
    s += MENU(px, py, pw, 150);
    s += PICK(px + 6, py + 8, pw - 12, '웹 앱', '2');
    ['API 실행 파일', '부가기능', '라이브러리'].forEach(function (t, i) { s += T(px + 18, py + 70 + i * 28, t, { size: 13, fill: C.soft }); });

    s += LINE(x0 + 236, y0 + 60, x0 + 236, y0 + h0 - 64);

    // 오른쪽: 구성
    var rx = x0 + 260, w = 404, ry = y0 + 96;
    s += T(rx, ry, '구성', { size: 14, weight: 700, fill: C.soft });
    ry += 30;
    s += T(rx, ry, '설명', { size: 12.5, fill: C.soft });
    s += R(rx, ry + 8, w, 34, { fill: '#fff', stroke: C.line, r: 6 }) + T(rx + 12, ry + 30, '예: 2026 2학기 (안 적어도 됩니다)', { size: 13, fill: '#9aa4bd' });
    ry += 72;
    s += T(rx, ry, '웹 앱', { size: 14, weight: 800 });
    ry += 26;
    s += T(rx, ry, '다음 사용자 인증 정보로 실행', { size: 12.5, fill: C.soft });
    s += SELECT(rx, ry + 8, w, '나 (선생님 이메일)') + HLN(rx, ry + 8, w, 36, '3', 'tr');
    ry += 68;
    s += T(rx, ry, '액세스 권한이 있는 사용자', { size: 12.5, fill: C.soft });
    s += SELECT(rx, ry + 8, w, '모든 사용자') + HLN(rx, ry + 8, w, 36, '4', 'tr');
    s += T(rx, ry + 66, '✕ 「Google 계정이 있는 모든 사용자」가 아닙니다', { size: 12.5, weight: 800, fill: C.red });

    var by = y0 + h0 - 52;
    s += LINE(x0, by - 12, x0 + w0, by - 12);
    s += BTN(x0 + w0 - 24 - 86 - 12 - 76, by, 76, '취소', false);
    s += BTN(x0 + w0 - 24 - 86, by, 86, '배포', true);
    s += HLN(x0 + w0 - 24 - 86, by, 86, 36, '5', 'tr');
    return SVG(720, 470, '새 배포 창: 톱니바퀴, 웹 앱, 실행은 나, 액세스는 모든 사용자, 배포', s);
  }

  // ── 그림 3-3 · 웹 앱 URL 복사 → 학생에게 ─────────────────────────
  function url() {
    var s = '';
    var x0 = 16, y0 = 14, w0 = 450, h0 = 312;
    s += PANEL(x0, y0, w0, h0);
    s += T(x0 + 24, y0 + 40, '새 배포', { size: 18, weight: 800 });
    s += LINE(x0, y0 + 60, x0 + w0, y0 + 60);
    s += '<circle cx="' + (x0 + 35) + '" cy="' + (y0 + 88) + '" r="11" fill="' + C.green + '"/>' +
      '<path d="M' + (x0 + 30) + ' ' + (y0 + 88) + 'l4 4l7-8" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
    s += BAR(x0 + 56, y0 + 83, 170, 10);

    s += T(x0 + 24, y0 + 128, '배포 ID', { size: 12.5, fill: C.soft });
    s += BAR(x0 + 24, y0 + 138, 320, 10) + T(x0 + w0 - 24, y0 + 147, '복사', { size: 13, weight: 700, fill: C.soft, anchor: 'end' });

    s += T(x0 + 24, y0 + 182, '웹 앱', { size: 14, weight: 800 });
    s += T(x0 + 24, y0 + 224, 'https://script.google.com/macros/s/…/exec', { size: 13, mono: true });
    s += T(x0 + w0 - 24, y0 + 224, '복사', { size: 13.5, weight: 800, fill: C.blue, anchor: 'end' });
    s += HLN(x0 + 20, y0 + 208, w0 - 40, 24, '1');
    s += BTN(x0 + w0 - 24 - 78, y0 + h0 - 52, 78, '완료', true);

    // 화살표 → 학생 화면
    var ax = x0 + w0 + 10, ay = y0 + 220;
    s += '<path d="M' + ax + ' ' + ay + 'C' + (ax + 36) + ' ' + ay + ',' + (ax + 30) + ' ' + (ay - 60) + ',' + (ax + 62) + ' ' + (ay - 60) +
      '" fill="none" stroke="' + C.hl + '" stroke-width="3" stroke-dasharray="6 5"/>' +
      '<path d="M' + (ax + 54) + ' ' + (ay - 68) + 'l10 8l-10 8" fill="none" stroke="' + C.hl + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
    s += T(ax + 2, ay + 30, '클래스룸·', { size: 12, weight: 800, fill: C.hl }) +
      T(ax + 2, ay + 47, 'QR 코드로', { size: 12, weight: 800, fill: C.hl });

    var px = 580, py = 26, pw = 124, ph = 262;
    s += R(px, py, pw, ph, { fill: C.ink, r: 22 }) + R(px + 7, py + 14, pw - 14, ph - 28, { fill: '#fff', r: 14 });
    s += R(px + 7, py + 14, pw - 14, 44, { fill: C.green, r: 14 }) + R(px + 7, py + 44, pw - 14, 14, { fill: C.green, r: 0 });
    s += R(px + 20, py + 30, 70, 8, { fill: 'rgba(255,255,255,.75)', r: 4 });
    s += T(px + 20, py + 90, '학번', { size: 12, weight: 700 });
    s += R(px + 18, py + 98, pw - 36, 28, { fill: '#fff', stroke: C.line, r: 6 }) + T(px + 26, py + 117, '20101', { size: 12, fill: '#9aa4bd' });
    s += R(px + 18, py + 138, pw - 36, 30, { fill: C.green, r: 8 }) + T(px + pw / 2, py + 158, '다음', { size: 12.5, weight: 700, fill: '#fff', anchor: 'middle' });
    s += BAR(px + 18, py + 186, pw - 50, 7) + BAR(px + 18, py + 200, pw - 70, 7);
    s += N('2', px - 4, py + 4);
    s += T(px + pw / 2, py + ph + 24, '학생 화면', { size: 12.5, weight: 700, fill: C.soft, anchor: 'middle' });
    return SVG(720, 340, '웹 앱 URL 을 복사해 학생에게 주기', s);
  }

  root.GuideFigures = { menu: menu, auth: auth, editor: editor, deploy: deploy, url: url };
})(typeof window !== 'undefined' ? window : globalThis);
