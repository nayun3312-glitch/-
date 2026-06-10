const axios = require('axios');

function apiError(message, statusCode = 502) {
  const e = new Error(message);
  e.userMessage = message;
  e.statusCode = statusCode;
  return e;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// Apify "run-sync-get-dataset-items" 엔드포인트: 실행 + 결과 수신을 한 번에 처리
// (스펙의 수동 폴링 루프보다 안정적)
async function fetchInstagramData(username) {
  const token = process.env.APIFY_API_KEY;
  const actorId = (process.env.APIFY_ACTOR_ID || 'apify/instagram-profile-scraper').replace('/', '~');
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  let items;
  try {
    const resp = await axios.post(
      url,
      // 3개월 평균 ER 계산을 위해 3개월치 게시글이 확보되도록 넉넉히 수집
      { usernames: [username], resultsLimit: 60 },
      { headers: { 'Content-Type': 'application/json' }, timeout: 150000 }
    );
    items = resp.data;
  } catch (e) {
    if (e.response && e.response.status === 404) {
      throw apiError(`계정을 찾을 수 없습니다: @${username}`, 404);
    }
    throw apiError('Apify 크롤링 요청에 실패했습니다. 잠시 후 다시 시도해주세요.', 502);
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw apiError(`데이터를 가져오지 못했습니다: @${username}`, 404);
  }

  return cleanApifyData(items[0]);
}

function cleanApifyData(raw) {
  const accountInfo = {
    username: raw.username || raw.name || 'Unknown',
    fullName: raw.fullName || '',
    followers: num(raw.followersCount),
    following: num(raw.followsCount ?? raw.followingCount),
    totalPosts: num(raw.postsCount),
    bio: raw.biography || '',
    profilePictureUrl: raw.profilePicUrlHD || raw.profilePicUrl || raw.profilePictureUrl || ''
  };

  const rawPosts = Array.isArray(raw.latestPosts) ? raw.latestPosts : [];
  const posts = rawPosts.slice(0, 60).map((p, i) => ({
    id: p.id || p.shortCode || `post_${i}`,
    caption: p.caption || '(캡션 없음)',
    // Reels 정기 업로드 판정용 게시글 타입 (clips/Video → Reel)
    type:
      p.productType === 'clips' || p.type === 'Video'
        ? 'Reel'
        : p.type === 'Sidecar'
          ? 'Sidecar'
          : 'Image',
    timestamp: p.timestamp || new Date().toISOString(),
    likesCount: num(p.likesCount),
    commentsCount: num(p.commentsCount),
    // 영상은 videoViewCount/videoPlayCount, 이미지는 조회수 없음(0)
    viewsCount: num(p.videoViewCount ?? p.videoPlayCount ?? p.viewsCount),
    savesCount: num(p.savesCount),
    sharesCount: num(p.sharesCount)
  }));

  return { accountInfo, posts };
}

module.exports = { fetchInstagramData, cleanApifyData };
