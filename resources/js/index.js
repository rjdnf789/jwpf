document.documentElement.classList.add('js'); // (head의 인라인 스크립트가 먼저 처리하지만 안전망)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// 1. 스크롤 등장 효과: 화면에 들어오면 한 번만 나타남
const aniTargets = [...document.querySelectorAll('.ani')];
aniTargets.forEach((el) => {
    // 같은 부모 안에서 순서대로 조금씩 늦게 나타나도록 (최대 5단계)
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains('ani'));
    el.style.setProperty('--i', Math.min(siblings.indexOf(el), 5));
});
if (reduceMotion || !('IntersectionObserver' in window)) {
    aniTargets.forEach((el) => el.classList.add('on'));
} else {
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('on');
            revealObserver.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    aniTargets.forEach((el) => revealObserver.observe(el));
}

// 2. 핵심 수치 카운트업
function countUp(el) {
    const target = Number(el.dataset.count);
    if (reduceMotion || Number.isNaN(target)) return;
    const duration = 900;
    const start = performance.now();
    el.textContent = '0';
    function tick(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}
document.querySelectorAll('[data-count]').forEach(countUp);

// 3. 헤더: 스크롤하면 그림자 표시
const header = document.querySelector('.siteHeader');
function onScroll() {
    header.classList.toggle('scrolled', window.scrollY > 8);
}
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// 3-1. 모바일 메뉴 (햄버거)
const menuBtn = document.querySelector('.menuBtn');
const mobileMenu = document.getElementById('mobileMenu');
function setMenu(open) {
    mobileMenu.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
}
menuBtn.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
mobileMenu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', (e) => { if (!header.contains(e.target)) setMenu(false); });
window.addEventListener('resize', () => { if (window.innerWidth > 768) setMenu(false); });

// 4. 헤더 메뉴: 현재 보고 있는 섹션 표시
const navLinks = [...document.querySelectorAll('.gnb a')];
const navSections = navLinks
    .map((a) => document.querySelector(a.getAttribute('href')))
    .filter(Boolean);
if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            navLinks.forEach((a) => {
                a.classList.toggle('active', a.getAttribute('href') === `#${entry.target.id}`);
            });
        });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navSections.forEach((section) => navObserver.observe(section));
}

// 5. 이메일 복사 버튼
document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.dataset.label = btn.textContent;
    btn.addEventListener('click', async () => {
        let ok = false;
        try {
            await navigator.clipboard.writeText(btn.dataset.copy);
            ok = true;
        } catch (err) {
            // clipboard API를 못 쓰는 환경(file:// 등)을 위한 대체 방법
            const ta = document.createElement('textarea');
            ta.value = btn.dataset.copy;
            ta.style.cssText = 'position:fixed;opacity:0;';
            document.body.appendChild(ta);
            ta.select();
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            ta.remove();
        }
        btn.textContent = ok ? '복사됨' : '복사 실패';
        btn.classList.toggle('done', ok);
        clearTimeout(btn.resetTimer);
        btn.resetTimer = setTimeout(() => {
            btn.textContent = btn.dataset.label;
            btn.classList.remove('done');
        }, 1600);
    });
});

// 6. 프로젝트 상세 모달
// 내용은 이력서(경력기술서·자소서)에 적힌 내용만 사용. 수치·성과를 새로 지어내지 않음.
const projectData = {
    daegu: {
        title: '대구산업경제동향 온라인시스템',
        period: '2023.07 ~ 현재',
        category: '공공 데이터',
        overview: '대구지역 산업경제 디지털 데이터 플랫폼입니다. 2023년 시스템 개편·기능 보강부터 참여해 약 3년째 프로젝트 관리와 기능 개선을 이어가고 있습니다.',
        roles: [
            '2023년 시스템 개편·기능 보강',
            '프로젝트 관리 및 기능 개선 (약 3년째 지속 수행)',
            '외부 API(통계청·한국은행) 연계 데이터 모니터링 페이지 개발'
        ],
        tech: ['Spring Framework', '외부 API 연동'],
        url: 'https://distat.daegu.go.kr/main.do'
    },
    etri: {
        title: 'ETRI 첨단메카닉고분자 기술교류시스템',
        period: '2023.06 ~ 2023.11',
        category: '검색엔진',
        overview: '지역 연구장비와 기술 정보를 연결하는 기술교류 플랫폼입니다. 대구 연구장비시스템의 장비 정보를 연동하고, 장비 검색엔진을 구축했습니다.',
        roles: [
            '대구 연구장비시스템 장비목록 API 연동',
            '스케줄러 기반 데이터 현행화',
            'Elasticsearch 기반 장비 검색엔진 구축: 장비명 색인, 자동완성, 검색 순위 로직, ELK 스택 구성',
            '분석기술 지원정보 등록·수정 기능 개발'
        ],
        tech: ['API 연동', '스케줄러', 'Elasticsearch', 'ELK Stack'],
        url: 'https://tes.dris.or.kr/'
    },
    fire: {
        title: '소방예방정보시스템 기능 고도화',
        period: '2025.06 ~ 2025.12',
        category: '폐쇄망 · DB',
        overview: '소방예방정보시스템 온라인민원포털(소방민원센터)의 기능 고도화 사업입니다. 외부 인터넷이 완전히 차단된 보안이 엄격한 폐쇄망 환경에서 대국민 서비스를 개발했습니다.',
        roles: [
            '신규 민원 30종 추가 개발',
            '신규 민원 추가에 따른 데이터베이스 설계 주도',
            '조회 성능이 떨어지는 쿼리를 직접 찾아 수정',
            '배포 자동화 스크립트 구현 (폐쇄망에서도 원클릭 배포 가능)'
        ],
        tech: ['Spring Boot', 'PostgreSQL', '배포 자동화', '폐쇄망'],
        url: 'https://safeland.go.kr/somin/index.do'
    },
    disaster: {
        title: '재난현장 영상정보 공유시스템',
        period: '2022.11 / 2024.07 ~ 2025.01',
        category: '지도 · 권한',
        overview: '재난현장 영상정보 공유와 담당자 승인 기능을 제공하는 시스템입니다. 2022년 시범구축에 참여한 뒤 2024~2025년 고도화·운영을 맡았습니다.',
        roles: [
            '시범구축: 재난현장 영상정보 공유 및 담당자 승인 기능 개발',
            '고도화: 지도 API(KakaoMap, Vworld) 변경 대응 및 시스템 고도화·유지보수',
            '전파 대상 기관 지정, 영상 첨부 등 복잡한 로직과 사용자 권한별 데이터 접근 제어가 필요한 메인 화면 지도 영역 개발'
        ],
        tech: ['KakaoMap API', 'Vworld API', '권한 제어'],
        note: '공공 시스템이라 접속 링크와 화면은 공개하지 않습니다.',
        url: ''
    },
    asset: {
        title: '내부 자산관리 시스템',
        period: '2026.03 ~ 2026.08',
        category: '사내 프로젝트',
        overview: '사내 자산관리를 위한 내부 시스템입니다. 프로젝트 기획 단계부터 맡아 AI 코딩 도구를 활용해 개발까지 진행했습니다.',
        roles: [
            '프로젝트 기획 및 화면·기능 설계',
            'AI 코딩 도구를 활용한 개발 진행 (Spring Boot, React)',
            '빠르게 변화하는 개발 방식을 실무에 적용하는 경험'
        ],
        tech: ['Spring Boot', 'React', 'AI 코딩 도구'],
        note: '사내 시스템이라 접속 링크는 공개하지 않습니다. (현재 디자인 개편 중)',
        url: ''
    }
};

const modal = document.getElementById('projectModal');
const modalBody = document.getElementById('modalBody');
const modalBadges = document.getElementById('modalBadges');
const modalLink = document.getElementById('modalLink');
let lastFocused = null;

function makeEl(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}
function makeSection(title, content) {
    const section = makeEl('div', 'modalSection');
    section.appendChild(makeEl('h4', '', title));
    section.appendChild(content);
    return section;
}

function openProject(id) {
    const d = projectData[id];
    if (!d) return;
    lastFocused = document.activeElement;

    modalBadges.replaceChildren(
        makeEl('span', 'badge', d.period),
        makeEl('span', 'badge badgeAccent', d.category)
    );
    document.getElementById('modalTitle').textContent = d.title;

    modalBody.replaceChildren();
    modalBody.appendChild(makeSection('개요', makeEl('p', '', d.overview)));

    const roleList = makeEl('ul', 'modalList');
    d.roles.forEach((r) => roleList.appendChild(makeEl('li', '', r)));
    modalBody.appendChild(makeSection('담당 업무', roleList));

    const chips = makeEl('ul', 'chips');
    d.tech.forEach((t) => chips.appendChild(makeEl('li', '', t)));
    modalBody.appendChild(makeSection('적용 기술', chips));

    if (d.note) {
        const noteSection = makeEl('div', 'modalSection');
        noteSection.appendChild(makeEl('p', 'modalNote', d.note));
        modalBody.appendChild(noteSection);
    }

    if (d.url) {
        modalLink.href = d.url;
        modalLink.style.display = '';
    } else {
        modalLink.removeAttribute('href');
        modalLink.style.display = 'none';
    }

    modalBody.scrollTop = 0;
    modal.showModal();
    document.documentElement.classList.add('modalOpen'); // 뒤 화면 스크롤 잠금
}

document.querySelectorAll('[data-project]').forEach((btn) => {
    btn.addEventListener('click', () => openProject(btn.dataset.project));
});
// 닫을 때 정리 (스크롤 잠금 해제, 열기 전 버튼으로 포커스 복귀). 여러 번 호출돼도 안전
function cleanupModal() {
    document.documentElement.classList.remove('modalOpen');
    if (lastFocused) {
        lastFocused.focus();
        lastFocused = null;
    }
}
function closeProject() {
    if (modal.open) modal.close();
    cleanupModal();
}
modal.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', closeProject);
});
// 바깥(어두운 배경)을 눌러도 닫히지 않음. 닫기는 ×·닫기 버튼 또는 Esc 키로만.
// 바깥 영역에서 휠·터치로 뒤 화면이 스크롤되는 것도 막음 (팝업 안쪽 스크롤은 그대로 동작)
modal.addEventListener('wheel', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });
modal.addEventListener('touchmove', (e) => { if (e.target === modal) e.preventDefault(); }, { passive: false });
// Esc 키로 닫힐 때도 같은 정리를 실행
modal.addEventListener('cancel', cleanupModal);
modal.addEventListener('close', cleanupModal);
