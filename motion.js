/*
 * TEAM BRO 공통 모션 (motion.js) — 디자인·색·배치는 그대로 두고 움직임만 더함
 *  1. 스크롤 등장: 섹션 제목·카드가 아래에서 살짝 올라오며 순서대로 나타남
 *  2. 숫자 카운트업: 150+, 1,818 같은 숫자가 화면에 보일 때 0부터 올라감
 *  3. 버튼: 주요 버튼에 빛이 지나가고, 누를 때 살짝 눌림
 *  4. 라이더 모집 페이지: 지점 카드 순차 등장, '가까운 지점' 결과 박스 강조
 * 움직임 줄이기(접근성) 설정을 켠 기기에서는 전부 꺼짐. 스크립트가 실패해도 내용은 그대로 보임.
 */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var css = ''
    // 버튼 (움직임 줄이기와 상관없이 눌림 피드백은 유지)
    + '.btn,.nav-cta,.mobile-nav-cta{-webkit-tap-highlight-color:transparent}'
    + '.btn:active,.nav-cta:active,.mobile-nav-cta:active{transform:scale(.97)!important}';
  if (!reduce) {
    css += ''
      // 스크롤 등장
      + '.tb-r{opacity:0;transform:translateY(28px)}'
      + '.tb-r.tb-in{opacity:1;transform:none;transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1);transition-delay:var(--tb-d,0s)}'
      // 버튼 빛 지나가기
      + '.tb-shine{position:relative;overflow:hidden;isolation:isolate}'
      + '.tb-shine::after{content:"";position:absolute;top:0;left:-75%;width:50%;height:100%;pointer-events:none;z-index:1;'
      + 'background:linear-gradient(100deg,transparent,rgba(255,255,255,.55),transparent);transform:skewX(-20deg);animation:tbShine 4.5s ease-in-out infinite}'
      + '.tb-shine:hover::after{animation-duration:1.2s}'
      + '@keyframes tbShine{0%,70%{left:-75%}100%{left:130%}}'
      // 라이더 페이지 결과 박스
      + '.match-box{animation:tbPop .55s cubic-bezier(.2,1.4,.4,1) both}'
      + '.match-box .btn-primary{animation:tbGlow 2s ease-in-out .6s 3}'
      + '@keyframes tbPop{0%{opacity:0;transform:translateY(14px) scale(.96)}100%{opacity:1;transform:none}}'
      + '@keyframes tbGlow{0%,100%{box-shadow:0 0 0 0 rgba(45,212,191,.0)}50%{box-shadow:0 0 0 8px rgba(45,212,191,.25)}}';
  }
  var st = document.createElement('style'); st.id = 'tb-motion'; st.textContent = css; document.head.appendChild(st);
  if (reduce) return;

  // ---------- 1. 스크롤 등장 ----------
  var GROUPS = [
    // [부모 선택자, 자식 선택자] — 같은 부모 안의 자식들은 순서대로 0.08초씩 늦게
    ['section:not(.hero) .container', ':scope > .section-header, :scope > .section-cta'],
    ['.service-grid', ':scope > *'],
    ['.process-steps-visual', ':scope > *'],
    ['.target-cards', ':scope > *'],
    ['.benefit-cards', ':scope > *'],
    ['.channel-cards', ':scope > *'],
    ['.contact-grid', ':scope > *'],
    ['.rp-grid', ':scope > *'],
    ['.cta-section .container', ':scope > *'],
    ['footer .container', ':scope > *'],
    // 라이더 모집 페이지
    ['#rSec', ':scope > .sec-h'],
    ['main.container', ':scope > .sec-h'],
    ['#grid', ':scope > .card'],
    ['#bGrid', ':scope > .card']
  ];
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      var el = e.target; io.unobserve(el);
      el.classList.add('tb-in');
      // 등장 후에는 원래 hover 효과가 그대로 동작하도록 정리
      var done = function () { el.classList.remove('tb-r', 'tb-in'); el.style.removeProperty('--tb-d'); el.removeEventListener('transitionend', done); };
      el.addEventListener('transitionend', done);
      setTimeout(done, 1600);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }) : null;

  function mark(el, i) {
    if (!io || el.dataset.tbSeen) return;
    el.dataset.tbSeen = '1';
    var r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92 && r.bottom > 0 && !mark.later) return; // 처음 화면에 이미 보이는 건 건드리지 않음
    el.style.setProperty('--tb-d', Math.min(i, 8) * 0.08 + 's');
    el.classList.add('tb-r');
    io.observe(el);
  }
  function scan() {
    GROUPS.forEach(function (g) {
      document.querySelectorAll(g[0]).forEach(function (p) {
        var kids; try { kids = p.querySelectorAll(g[1]); } catch (e) { return; }
        Array.prototype.forEach.call(kids, function (k, i) { mark(k, i); });
      });
    });
  }

  // ---------- 2. 숫자 카운트업 ----------
  function countUp(el) {
    var raw = el.textContent, m = raw.match(/\d[\d,]*/);
    if (!m) return;
    var target = parseInt(m[0].replace(/,/g, ''), 10);
    if (!(target >= 10)) return;
    var pre = raw.slice(0, m.index), post = raw.slice(m.index + m[0].length), comma = m[0].indexOf(',') >= 0;
    var t0 = null, dur = Math.min(1800, 900 + target / 3);
    var fmt = function (n) { return comma ? n.toLocaleString('ko-KR') : String(n); };
    el.textContent = pre + fmt(0) + post;
    (function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur), e = 1 - Math.pow(1 - p, 3);
      el.textContent = pre + fmt(Math.round(target * e)) + post;
      if (p < 1) requestAnimationFrame(step); else el.textContent = raw;
    })(performance.now());
  }
  function setupCounters() {
    var els = document.querySelectorAll('.stat-value, .social-proof strong, .avatar.more, .story-likes');
    if (!els.length || !('IntersectionObserver' in window)) return;
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { co.unobserve(e.target); countUp(e.target); } });
    }, { threshold: 0.6 });
    els.forEach(function (el) { if (/\d{2,}/.test(el.textContent)) co.observe(el); });
  }

  // ---------- 3. 버튼 빛 ----------
  function setupShine() {
    document.querySelectorAll('.hero .btn-primary, .nav-cta, .section-cta .btn-primary, .cta-section .btn-dark, #gpsBtn, .contact-section button[type=submit], .contact-section .btn-primary')
      .forEach(function (b) { b.classList.add('tb-shine'); });
  }

  function init() {
    scan(); mark.later = true; // 이후 새로 그려지는 카드(라이더 지점 목록 등)는 화면 안이어도 등장 효과
    setupCounters(); setupShine();
    // 라이더 페이지처럼 나중에 그려지는 카드
    ['grid', 'bGrid', 'rp-grid'].forEach(function (id) {
      var g = document.getElementById(id) || document.querySelector('.' + id);
      if (g && 'MutationObserver' in window) new MutationObserver(scan).observe(g, { childList: true });
    });
    var rp = document.getElementById('recruit-preview');
    if (rp && 'MutationObserver' in window) new MutationObserver(scan).observe(rp, { attributes: true, attributeFilter: ['hidden'] });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
