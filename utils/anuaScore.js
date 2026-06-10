// 아누아 협업 적합도 평가 모듈.
// 자동 판정 항목(ER, 콘텐츠 방향, 규모)과 수동 체크 항목(신뢰도, 타겟층 등)을 합쳐
// Top 5 가중치 기반 100점 만점 점수 + 4단계 등급을 산출합니다.
// status: 'pass'(✅) | 'warn'(⚠️ 부분 충족) | 'fail'(❌) | 'unchecked'(⚠️ 수동 미확인)

const RECENT_DAYS = 90;

const SKINCARE_KEYWORDS = [
  '스킨케어', '스킨', '피부', '앰플', '세럼', '토너', '선크림', '클렌징',
  '보습', '수분', '진정', '미백', '마스크팩', '에센스', '모공', '여드름',
  'skincare', 'serum', 'toner', 'ampoule'
];

// 수동 체크 항목 기본값 (false = 미확인)
const DEFAULT_MANUAL_CHECKS = {
  trust: false, // Top5 3순위: 정직한 리뷰, 과장 없는 톤
  target: false, // Top5 5순위: Z세대 + 25~30대 타겟
  commentSentiment: false, // 체크리스트: 댓글 성향 긍정·신뢰감
  brandFit: false, // 체크리스트: 브랜드 철학 일치도
  beautyCollab: false, // 체크리스트: 이전 뷰티 브랜드 협업 경험
  multilingual: false, // 체크리스트: 다국어 능력
  expertProof: false // 체크리스트: 피부과 의사·약사 증명
};

function isSkincarePost(caption) {
  const c = (caption || '').toLowerCase();
  return SKINCARE_KEYWORDS.some((kw) => c.includes(kw));
}

function recentPostsOf(postMetrics, now = Date.now()) {
  const cutoff = now - RECENT_DAYS * 86400000;
  const recent = postMetrics.filter((p) => {
    const t = new Date(p.timestamp).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });
  // 타임스탬프가 모두 깨져 있으면 전체 게시글로 대체
  return recent.length > 0 ? recent : postMetrics;
}

function scoreOf(status, max) {
  if (status === 'pass') return max;
  if (status === 'warn') return Math.round(max * 0.5);
  return 0; // fail, unchecked
}

function evaluateAnua(metrics, manualChecks = {}) {
  const checks = { ...DEFAULT_MANUAL_CHECKS, ...manualChecks };
  const followers = metrics.accountInfo.followers;
  const recent = recentPostsOf(metrics.postMetrics);

  // 파생 지표 (비교 뷰에서도 재사용)
  const skincareCount = recent.filter((p) => isSkincarePost(p.caption)).length;
  const skincareRatio = Number(((skincareCount / recent.length) * 100).toFixed(1));
  const reelCount = recent.filter((p) => p.type === 'Reel').length;
  const reelsPerWeek = Number((reelCount / (RECENT_DAYS / 7)).toFixed(1));
  const reelsRegular = reelsPerWeek >= 0.5; // 2주에 1개 이상이면 정기 업로드로 간주
  // 체크리스트용 ER = (좋아요+댓글+공유) ÷ 팔로워 × 100
  const altER = Number(
    (
      recent.reduce(
        (s, p) => s + (p.likes + p.comments + p.shares) / followers,
        0
      ) / recent.length * 100
    ).toFixed(2)
  );

  const erValue = metrics.recentER.value;

  // ── Top 5 (순위별 가중치: 30/25/20/15/10 = 100점) ──
  const erStatus = erValue >= 3 ? 'pass' : erValue >= 2 ? 'warn' : 'fail';

  const skincareOk = skincareRatio >= 50;
  const contentStatus =
    skincareOk && reelsRegular ? 'pass' : skincareOk || reelsRegular ? 'warn' : 'fail';

  const sizeStatus =
    followers >= 10000 && followers <= 300000
      ? 'pass'
      : (followers >= 5000 && followers < 10000) ||
          (followers > 300000 && followers <= 400000)
        ? 'warn'
        : 'fail';

  const topCriteria = [
    {
      rank: 1,
      key: 'er',
      label: 'ER (참여율)',
      criteria: '3개월 평균 ER 3% 이상 (매우 중요)',
      auto: true,
      status: erStatus,
      maxScore: 30,
      detail: `3개월 평균 ER ${erValue}%${metrics.recentER.insufficientData ? ' (데이터 부족)' : ''}`
    },
    {
      rank: 2,
      key: 'content',
      label: '콘텐츠 방향',
      criteria: '스킨케어 50% 이상 + Reels 정기 업로드',
      auto: true,
      status: contentStatus,
      maxScore: 25,
      detail: `스킨케어 비중 ${skincareRatio}% · 주 평균 릴스 ${reelsPerWeek}개`
    },
    {
      rank: 3,
      key: 'trust',
      label: '신뢰도',
      criteria: '정직한 리뷰, 과장 없는 톤',
      auto: false,
      status: checks.trust ? 'pass' : 'unchecked',
      maxScore: 20,
      detail: checks.trust ? '마케터 확인 완료' : '수동 확인 필요'
    },
    {
      rank: 4,
      key: 'size',
      label: '규모',
      criteria: '팔로워 10K~300K 마이크로 인플루언서',
      auto: true,
      status: sizeStatus,
      maxScore: 15,
      detail: `팔로워 ${followers.toLocaleString()}명`
    },
    {
      rank: 5,
      key: 'target',
      label: '타겟층',
      criteria: 'Z세대(16~25) + 구매력 있는 25~30대',
      auto: false,
      status: checks.target ? 'pass' : 'unchecked',
      maxScore: 10,
      detail: checks.target ? '마케터 확인 완료' : '수동 확인 필요'
    }
  ].map((item) => ({ ...item, score: scoreOf(item.status, item.maxScore) }));

  const totalScore = topCriteria.reduce((s, c) => s + c.score, 0);

  let grade = '부적합';
  if (totalScore >= 80) grade = '적극 추천';
  else if (totalScore >= 60) grade = '검토 추천';
  else if (totalScore >= 40) grade = '보류';

  // ── 리스트업 체크리스트 (3개 카테고리) ──
  const manualItem = (key, label) => ({
    key,
    label,
    auto: false,
    status: checks[key] ? 'pass' : 'unchecked',
    detail: checks[key] ? '확인 완료' : '미확인'
  });

  const checklist = [
    {
      category: '정량 지표',
      items: [
        {
          key: 'followers10k',
          label: '팔로워 10K 이상',
          auto: true,
          status: followers >= 10000 ? 'pass' : 'fail',
          detail: `${followers.toLocaleString()}명`
        },
        {
          key: 'altER',
          label: 'ER = (좋아요+댓글+공유)÷팔로워×100 ≥ 3%',
          auto: true,
          status: altER >= 3 ? 'pass' : 'fail',
          detail: `${altER}%`
        },
        {
          key: 'uploadFreq',
          label: '주간 평균 업로드 1회 이상',
          auto: true,
          status: metrics.weeklyUploadFrequency >= 1 ? 'pass' : 'fail',
          detail: `주 ${metrics.weeklyUploadFrequency}회`
        }
      ]
    },
    {
      category: '정성 지표',
      items: [
        {
          key: 'skincareRatio',
          label: '스킨케어 콘텐츠 비중 50% 이상',
          auto: true,
          status: skincareOk ? 'pass' : 'fail',
          detail: `${skincareRatio}%`
        },
        manualItem('commentSentiment', '댓글 성향 긍정·신뢰감'),
        manualItem('brandFit', '브랜드 철학 일치도')
      ]
    },
    {
      category: '협업 가능성',
      items: [
        manualItem('beautyCollab', '이전 뷰티 브랜드 협업 경험'),
        manualItem('multilingual', '다국어 능력 (글로벌 협업)'),
        manualItem('expertProof', '피부과 의사·약사 증명 (신뢰도 극대)')
      ]
    }
  ];

  // ── 판단 근거 요약 문장 ──
  const passed = topCriteria.filter((c) => c.status === 'pass');
  const failed = topCriteria.filter((c) => c.status === 'fail');
  const unchecked = topCriteria.filter((c) => c.status === 'unchecked');

  const parts = [];
  parts.push(
    passed.length > 0
      ? `${passed.map((c) => c.label).join(', ')} 기준을 충족합니다.`
      : '충족한 핵심 기준이 없습니다.'
  );
  if (failed.length > 0) {
    parts.push(`${failed.map((c) => c.label).join(', ')} 기준에 미달합니다.`);
  }
  if (unchecked.length > 0) {
    parts.push(
      `${unchecked.map((c) => c.label).join(', ')}은(는) 수동 확인 시 최대 ${unchecked.reduce((s, c) => s + c.maxScore, 0)}점이 추가됩니다.`
    );
  }
  if (metrics.recentER.insufficientData) {
    parts.push('최근 3개월 게시글이 적어 ER 신뢰도가 낮습니다.');
  }

  return {
    totalScore,
    maxScore: 100,
    grade,
    summary: parts.join(' '),
    topCriteria,
    checklist,
    derived: { skincareRatio, reelsPerWeek, reelsRegular, altER }
  };
}

module.exports = { evaluateAnua, DEFAULT_MANUAL_CHECKS };
