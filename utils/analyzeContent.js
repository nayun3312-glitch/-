const KEYWORDS = {
  뷰티: ['뷰티', '메이크업', '스킨케어', '뷰티팁', '화장품', '스킨', '향수'],
  패션: ['패션', '스타일', '룩', '의류', '옷', '코디', '룩북'],
  여행: ['여행', '여행팁', '여행지', '관광', '해외', '제주'],
  음식: ['음식', '맛집', '레시피', '푸드', '맛있는'],
  카페: ['카페', '커피', '디저트'],
  일상: ['일상', '브이로그', '홈루틴', '루틴', '하루'],
  운동: ['운동', '피트니스', '헬스', '요가', '필라테스', '홈트'],
  음악: ['음악', '노래', '콘서트', '뮤직'],
  제품리뷰: ['리뷰', '언박싱', '제품', '추천템'],
  기술: ['기술', '앱', '전자제품', 'IT']
};

function analyzeContent(posts) {
  if (!posts || posts.length === 0) {
    return { topCategories: [], toneAndManner: ['데이터 부족'], oneLiner: '분석할 게시물이 없습니다.' };
  }

  const categoryCount = {};
  Object.keys(KEYWORDS).forEach((c) => (categoryCount[c] = 0));

  posts.forEach((post) => {
    const caption = (post.caption || '').toLowerCase();
    Object.entries(KEYWORDS).forEach(([category, list]) => {
      if (list.some((kw) => caption.includes(kw))) categoryCount[category]++;
    });
  });

  const topCategories = Object.entries(categoryCount)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, count]) => ({
      category,
      count,
      percentage: Number(((count / posts.length) * 100).toFixed(1))
    }));

  const avgCaptionLength =
    posts.reduce((s, p) => s + (p.caption || '').length, 0) / posts.length;

  const toneAndManner = [];
  if (avgCaptionLength > 150) toneAndManner.push('정보 제공형');
  else if (avgCaptionLength < 50) toneAndManner.push('캐주얼형');

  const emojiRegex = /[\u{1F300}-\u{1F9FF}]/gu;
  const emojiCount = posts.reduce(
    (s, p) => s + ((p.caption || '').match(emojiRegex) || []).length,
    0
  );
  if (emojiCount > posts.length * 2) toneAndManner.push('감정 표현형');

  if (posts.some((p) => (p.caption || '').includes('?'))) {
    toneAndManner.push('상호작용 유도형');
  }

  const mainCategory = topCategories.length > 0 ? topCategories[0].category : '일반';
  const oneLiner = `${mainCategory} 콘텐츠 중심의 ${
    toneAndManner.length > 0 ? toneAndManner[0] : '크리에이터'
  }`;

  return {
    topCategories,
    toneAndManner: toneAndManner.length > 0 ? toneAndManner : ['균형형'],
    oneLiner
  };
}

module.exports = { analyzeContent };
