const RECENT_DAYS = 90; // 최근 3개월
const MIN_RECENT_POSTS = 5; // 이보다 적으면 "데이터 부족" 경고

function avgBy(arr, key) {
  if (arr.length === 0) return 0;
  return Number((arr.reduce((s, p) => s + p[key], 0) / arr.length).toFixed(2));
}

// 최근 3개월 평균 ER: 게시글별 ER(%) = (좋아요+댓글) ÷ 팔로워 × 100 을 구한 뒤 평균
function calcRecentER(posts, followers, now = Date.now()) {
  const cutoff = now - RECENT_DAYS * 86400000;
  const recent = posts.filter((p) => {
    const t = new Date(p.timestamp).getTime();
    return Number.isFinite(t) && t >= cutoff;
  });

  const ers = recent.map(
    (p) => ((p.likesCount + p.commentsCount) / followers) * 100
  );
  const value =
    ers.length > 0
      ? Number((ers.reduce((s, v) => s + v, 0) / ers.length).toFixed(2))
      : 0;

  const insufficientData = recent.length < MIN_RECENT_POSTS;

  return {
    value,
    postCount: recent.length,
    periodDays: RECENT_DAYS,
    insufficientData,
    warning: insufficientData
      ? `최근 3개월 게시글이 ${recent.length}개뿐이라 데이터가 부족합니다. ER 수치의 신뢰도가 낮을 수 있어요.`
      : null,
    // 주간 평균 업로드 빈도 = 최근 3개월 게시글 수 ÷ (90일/7일)
    weeklyUploadFrequency: Number((recent.length / (RECENT_DAYS / 7)).toFixed(1))
  };
}

function calculateMetrics(cleanedData) {
  const { accountInfo, posts } = cleanedData;
  const followers = accountInfo.followers;
  if (!followers || !posts || posts.length === 0) return null;

  const postMetrics = posts.map((post, index) => {
    const totalEng =
      post.likesCount + post.commentsCount + post.savesCount + post.sharesCount;

    // 조회율(%) = 조회수 ÷ 팔로워 × 100
    const viewRate = Number(((post.viewsCount / followers) * 100).toFixed(2));
    // 참여율(%) = (좋아요+댓글+저장+공유) ÷ 팔로워 × 100
    const engagementRate = Number(((totalEng / followers) * 100).toFixed(2));

    let engagementGrade = '낮음';
    if (engagementRate >= 1) engagementGrade = '높음';
    else if (engagementRate >= 0.5) engagementGrade = '중간';

    return {
      postNumber: index + 1,
      caption: post.caption,
      type: post.type || 'Image',
      timestamp: post.timestamp,
      views: post.viewsCount,
      likes: post.likesCount,
      comments: post.commentsCount,
      saves: post.savesCount,
      shares: post.sharesCount,
      viewRate,
      engagementRate,
      engagementGrade
    };
  });

  const pickBy = (key, dir) =>
    postMetrics.reduce((best, cur) =>
      (dir === 'max' ? cur[key] > best[key] : cur[key] < best[key]) ? cur : best
    );

  const recentER = calcRecentER(posts, followers);

  return {
    accountInfo,
    postMetrics,
    recentER, // 새 핵심 지표: 3개월 평균 ER (좋아요+댓글 기준)
    weeklyUploadFrequency: recentER.weeklyUploadFrequency,
    averageViewRate: avgBy(postMetrics, 'viewRate'),
    // 기존 참여율(좋아요+댓글+저장+공유 기준)은 별도 지표로 유지
    averageEngagementRate: avgBy(postMetrics, 'engagementRate'),
    bestViewPost: pickBy('viewRate', 'max'),
    bestEngagementPost: pickBy('engagementRate', 'max'),
    worstViewPost: pickBy('viewRate', 'min'),
    totalEngagement: postMetrics.reduce(
      (s, p) => s + p.likes + p.comments + p.saves + p.shares,
      0
    )
  };
}

module.exports = { calculateMetrics, RECENT_DAYS, MIN_RECENT_POSTS };
