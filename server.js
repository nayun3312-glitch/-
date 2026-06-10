const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { fetchInstagramData } = require('./utils/apifyClient');
const { getMockData } = require('./utils/mockData');
const { calculateMetrics } = require('./utils/calculateMetrics');
const { analyzeContent } = require('./utils/analyzeContent');
const { generateStrategy } = require('./utils/generateStrategy');
const { evaluateAnua, DEFAULT_MANUAL_CHECKS } = require('./utils/anuaScore');
const historyStore = require('./utils/historyStore');

const app = express();
app.use(cors());
app.use(express.json());

// 키가 없거나 MOCK_MODE=true면 목업 데이터로 동작 (키 없이도 바로 실행 가능)
const USE_MOCK = !process.env.APIFY_API_KEY || process.env.MOCK_MODE === 'true';

app.post('/api/analyze', async (req, res) => {
  try {
    const raw = (req.body && req.body.username) || '';
    const username = String(raw).trim().replace(/^@/, '');
    if (!username) {
      return res.status(400).json({ error: '계정명을 입력해주세요.' });
    }

    const cleaned = USE_MOCK
      ? getMockData(username)
      : await fetchInstagramData(username);

    if (!cleaned || !cleaned.posts || cleaned.posts.length === 0) {
      return res.status(404).json({
        error: `데이터를 찾을 수 없습니다: @${username} (비공개/삭제 계정일 수 있어요)`
      });
    }

    const metrics = calculateMetrics(cleaned);
    if (!metrics) {
      return res.status(422).json({
        error: '팔로워 또는 게시물 데이터가 부족해 계산할 수 없습니다.'
      });
    }

    const contentAnalysis = analyzeContent(cleaned.posts);
    const strategy = generateStrategy(metrics, contentAnalysis);

    // 아누아 적합도 평가 (수동 체크는 기본 미확인 상태로 시작)
    const manualChecks = { ...DEFAULT_MANUAL_CHECKS };
    const anua = evaluateAnua(metrics, manualChecks);

    // 분석할 때마다 이력에 자동 저장 (재분석 시 새 기록으로 누적)
    const record = historyStore.addRecord({
      username: cleaned.accountInfo.username,
      mock: USE_MOCK,
      accountInfo: cleaned.accountInfo,
      metrics,
      contentAnalysis,
      strategy,
      anua,
      manualChecks
    });

    res.json({
      mock: USE_MOCK,
      historyId: record.id,
      accountInfo: cleaned.accountInfo,
      metrics,
      contentAnalysis,
      strategy,
      anua,
      manualChecks,
      timestamp: record.analyzedAt
    });
  } catch (err) {
    console.error('분석 오류:', err.message);
    res.status(err.statusCode || 500).json({
      error: err.userMessage || '분석 중 오류가 발생했습니다. 다시 시도해주세요.'
    });
  }
});

// 분석 이력 목록 (최신순, 전체 레코드 — 프론트에서 계정별 그룹핑/비교에 사용)
app.get('/api/history', (req, res) => {
  res.json({ records: historyStore.getAll() });
});

// 특정 계정의 분석 이력 (최신순 — ER 변화 추이 확인용)
app.get('/api/history/:username', (req, res) => {
  const records = historyStore.getByUsername(req.params.username);
  if (records.length === 0) {
    return res.status(404).json({ error: `저장된 이력이 없습니다: @${req.params.username}` });
  }
  res.json({ records });
});

// 수동 체크 업데이트 → 아누아 점수·등급 재계산 후 저장
app.patch('/api/history/:id', (req, res) => {
  const manualChecks = (req.body && req.body.manualChecks) || {};
  const updated = historyStore.updateRecord(req.params.id, (record) => {
    const merged = { ...DEFAULT_MANUAL_CHECKS, ...record.manualChecks, ...manualChecks };
    return { ...record, manualChecks: merged, anua: evaluateAnua(record.metrics, merged) };
  });
  if (!updated) {
    return res.status(404).json({ error: '해당 이력을 찾을 수 없습니다.' });
  }
  res.json(updated);
});

app.delete('/api/history/:id', (req, res) => {
  if (!historyStore.deleteRecord(req.params.id)) {
    return res.status(404).json({ error: '해당 이력을 찾을 수 없습니다.' });
  }
  res.json({ ok: true });
});

app.get('/api/health', (req, res) => res.json({ ok: true, mock: USE_MOCK }));

// 프로덕션 빌드(client/dist)가 있으면 정적 서빙 (npm run build 후 npm start)
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(clientDist, 'index.html'), (e) => {
    if (e) next();
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ 서버 실행: http://localhost:${PORT}`);
  console.log(
    `🔑 Apify: ${process.env.APIFY_API_KEY ? '설정됨' : '미설정'} | 모드: ${
      USE_MOCK ? 'MOCK(목업 데이터)' : 'LIVE(실제 크롤링)'
    }`
  );
});

module.exports = app;
