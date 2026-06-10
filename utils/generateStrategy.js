function generateStrategy(metrics, contentAnalysis) {
  const avgViewRate = metrics.averageViewRate;
  const avgEngagementRate = metrics.averageEngagementRate;
  const strategy = [];

  // 1. 현황 분석
  let performanceLevel = '낮음';
  if (avgViewRate >= 15) performanceLevel = '매우 높음';
  else if (avgViewRate >= 10) performanceLevel = '높음';
  else if (avgViewRate >= 5) performanceLevel = '중간';

  strategy.push({
    title: '📊 현황 분석',
    content: `평균 조회율 ${avgViewRate}%, 참여율 ${avgEngagementRate}%로 ${performanceLevel} 수준입니다.`
  });

  // 2. 강점
  const topCategory = contentAnalysis.topCategories[0];
  if (topCategory) {
    strategy.push({
      title: '💪 강점',
      content: `${topCategory.category} 콘텐츠가 가장 강점입니다(${topCategory.percentage}%). 이 주제의 게시 빈도를 높이세요.`
    });
  } else {
    strategy.push({
      title: '💪 강점',
      content: '뚜렷한 주력 카테고리가 보이지 않습니다. 콘텐츠 주제를 명확히 잡으면 성과가 개선될 수 있습니다.'
    });
  }

  // 3. 개선 사항
  if (avgEngagementRate < 1) {
    strategy.push({
      title: '⬆️ 개선 제안',
      content: '상호작용을 유도하는 질문형 캡션을 추가하고, 댓글·DM 응답 시간을 단축하세요.'
    });
  }

  if (metrics.postMetrics.some((p) => p.viewRate < avgViewRate / 2)) {
    strategy.push({
      title: '⚠️ 성과 편차 개선',
      content: '게시물별 성과 편차가 큽니다. 상위·하위 게시물의 차이를 분석해 일관된 콘텐츠 스타일을 유지하세요.'
    });
  }

  // 4. 협력 제안
  let collaborationTier = '성장형';
  if (avgViewRate >= 15) collaborationTier = '프리미엄';
  else if (avgViewRate >= 10) collaborationTier = '중상';
  else if (avgViewRate >= 5) collaborationTier = '중간';

  strategy.push({
    title: '🤝 협력 제안',
    content: `${collaborationTier} 협력 대상으로 추천됩니다. 성과 기반 마케팅 협력을 제안하세요.`
  });

  return strategy;
}

module.exports = { generateStrategy };
