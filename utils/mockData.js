// Apify 키 없이도 앱 전체 흐름을 확인할 수 있는 목업 데이터 생성기.
// 계정명을 시드로 사용해 매번 같은 결과를 재현합니다.
// 3개월(90일) 이상 기간의 게시글을 생성해 3개월 평균 ER, 주간 업로드 빈도,
// 아누아 적합도 평가, 비교 뷰까지 MOCK 모드에서 모두 동작합니다.
// 계정명마다 팔로워 규모·스킨케어 비중·릴스 비중이 달라져 비교 테스트가 가능합니다.

const SKINCARE_CAPTIONS = [
  '스킨케어 추천템 언박싱 🧴 민감성 피부에 좋은 진정 세럼 솔직 리뷰 #스킨케어 #리뷰',
  '아침 스킨케어 루틴 공개 ✨ 수분 크림으로 마무리하면 하루종일 촉촉해요 #스킨케어 #루틴',
  '여드름 피부 진정 토너 2주 사용 후기 🌿 장단점 다 말씀드려요 #스킨케어 #피부관리',
  '선크림 5종 비교 ☀️ 백탁 없는 제품 드디어 찾았어요 #선크림 #스킨케어',
  '클렌징 제대로 하는 법 🫧 더블 클렌징 순서 정리해봤어요 #클렌징 #스킨케어',
  '수분 앰플 신상 리뷰 💧 속건조 피부 필수템인 이유 #앰플 #스킨케어',
  '피부과 다녀온 후기 + 집에서 하는 진정 케어 팁 🏥 #피부관리 #스킨케어',
  '나이트 스킨케어 루틴 🌙 미백 세럼 한 달 사용기 공유 #스킨케어 #미백',
  '마스크팩 일주일 챌린지 결과 공개 🧖‍♀️ 어떤가요? #마스크팩 #스킨케어',
  '보습 크림 끝판왕 찾기 🧴 건성 피부라면 저장 필수 #보습 #스킨케어'
];

const OTHER_CAPTIONS = [
  '오늘의 데일리 메이크업 ✨ 봄 신상 립 발색 후기! 여러분은 어떤 톤 좋아하세요? #뷰티 #메이크업',
  '주말 카페 투어 ☕️ 분위기 너무 좋았던 곳 추천! #카페 #일상',
  '새로 산 봄 코디 룩북 👗 데일리 패션 참고하세요 #패션 #코디',
  '제주도 여행 브이로그 🌊 꼭 가봐야 할 여행지 정리했어요 #여행',
  '홈트 루틴 공개 💪 30분 전신 운동 같이 해요 #운동 #피트니스',
  '인생 맛집 발견 🍜 이 집 레시피 따라 만들어봤는데 대박 #맛집 #음식',
  '평범한 하루 일상 브이로그 🎬 #일상 #브이로그',
  '봄에 어울리는 향수 추천 🌸 #뷰티',
  '오늘 입은 옷 어때요? 👀 스타일링 팁 공유해요 #패션 #코디'
];

function makeRng(seed) {
  let x = 0;
  for (const ch of String(seed)) x = (x * 31 + ch.charCodeAt(0)) % 100000;
  return () => {
    x = (x * 1103515245 + 12345) % 2147483648;
    return x / 2147483648;
  };
}

function getMockData(username) {
  const rng = makeRng(username || 'demo');

  // 계정별 성격(시드 고정): 규모, 스킨케어 비중, 릴스 비중, 기본 참여 수준
  const followers = Math.round(8000 + rng() * 472000); // 8K ~ 480K (마이크로 기준 통과/미달 모두 발생)
  const skincareBias = 0.25 + rng() * 0.6; // 캡션 중 스킨케어 비율 25~85%
  const reelBias = 0.25 + rng() * 0.55; // 릴스 비율 25~80%
  const baseEngagement = 0.012 + rng() * 0.045; // 게시글당 ER 약 1.2~5.7%
  const sparse = rng() < 0.12; // 일부 계정은 업로드가 뜸해 "데이터 부족" 케이스 재현

  const postCount = sparse ? 10 + Math.floor(rng() * 4) : 38 + Math.floor(rng() * 8);
  const posts = [];
  let dayOffset = rng() * 2; // 가장 최근 게시글: 0~2일 전

  for (let i = 0; i < postCount; i++) {
    const isSkincare = rng() < skincareBias;
    const pool = isSkincare ? SKINCARE_CAPTIONS : OTHER_CAPTIONS;
    const caption = pool[Math.floor(rng() * pool.length)];
    const isReel = rng() < reelBias;

    const engagement = followers * baseEngagement * (0.7 + rng() * 0.6);
    const likes = Math.round(engagement * (0.93 + rng() * 0.04));
    const comments = Math.round(engagement * (0.02 + rng() * 0.05));
    const saves = Math.round(likes * (0.02 + rng() * 0.04));
    const shares = Math.round(likes * (0.01 + rng() * 0.02));
    // 릴스는 도달이 높고, 이미지 게시글은 조회수가 낮게 잡힘
    const views = isReel
      ? Math.round(followers * (0.4 + rng() * 1.1))
      : Math.round(followers * (0.15 + rng() * 0.35));

    posts.push({
      id: `mock_${i}`,
      caption,
      type: isReel ? 'Reel' : rng() < 0.5 ? 'Image' : 'Sidecar',
      timestamp: new Date(Date.now() - dayOffset * 86400000).toISOString(),
      likesCount: likes,
      commentsCount: comments,
      viewsCount: views,
      savesCount: saves,
      sharesCount: shares
    });

    // 다음(더 오래된) 게시글과의 간격 — 뜸한 계정은 10~25일, 일반 계정은 1~4일
    dayOffset += sparse ? 10 + rng() * 15 : 1 + rng() * 3;
  }

  return {
    accountInfo: {
      username: username || 'demo_creator',
      fullName: 'Demo Creator',
      followers,
      following: 870,
      totalPosts: 342,
      bio: '뷰티 · 스킨케어 · 일상 크리에이터 ✨ (목업 데이터)',
      profilePictureUrl: ''
    },
    posts
  };
}

module.exports = { getMockData };
