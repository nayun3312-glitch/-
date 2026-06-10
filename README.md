# 📊 Instagram 인플루언서 분석기

계정명만 입력하면 3개월 평균 ER, 아누아 협업 적합도, 콘텐츠 분석, 마케팅 전략을 자동 분석하는 도구입니다.
분석 이력 저장, 인플루언서 비교 뷰를 지원합니다.

- 백엔드: Express (`server.js`) + Apify 크롤링
- 프론트: React + Vite + Tailwind (`client/`)
- `APIFY_API_KEY`가 없으면 자동으로 **MOCK(목업) 모드**로 동작 — 키 없이 바로 체험 가능

## 로컬 실행

```bash
npm run setup      # 처음 한 번: 서버 + 클라이언트 의존성 설치
npm run dev        # 개발 모드 (백엔드 3000 + 프론트 5173)
```

개발 모드 접속: 터미널에 표시되는 `http://localhost:5173` (사용 중이면 5174 등으로 변경됨)

실제 크롤링을 쓰려면 `.env`에 키를 넣으세요 (`.env.example` 참고):

```
APIFY_API_KEY=apify_api_xxxx
```

## 프로덕션 빌드 (배포와 동일한 방식)

```bash
npm run build      # client/dist 생성
npm start          # http://localhost:3000 에서 빌드된 사이트 서빙
```

## 인터넷 배포 (Render 무료 플랜)

이 저장소는 [Render](https://render.com) 배포 설정(`render.yaml`)이 포함되어 있습니다.

1. 코드를 GitHub 저장소에 push
2. [render.com](https://render.com) 가입 (GitHub 계정으로 로그인)
3. **New → Blueprint** 선택 → 이 저장소 연결 → `render.yaml`이 자동 인식됨 → **Apply**
4. 몇 분 뒤 `https://instagram-analyzer-xxxx.onrender.com` 형태의 공개 주소가 생성됩니다

### 배포 시 알아둘 점

- **환경변수**: `APIFY_API_KEY`를 Render 대시보드(Environment 탭)에 넣으면 실제 크롤링(LIVE),
  넣지 않으면 목업(MOCK) 모드로 동작합니다. 공개 데모라면 비워두는 걸 추천 (크레딧 보호).
- **분석 이력**: `data/history.json` 파일에 저장되는데, 무료 플랜은 디스크가 영구적이지 않아
  **재배포/재시작 시 이력이 초기화**됩니다. 이력을 영구 보관하려면 Render 유료 Disk를 붙이고
  환경변수 `DATA_DIR`을 디스크 마운트 경로로 지정하세요.
- **콜드 스타트**: 무료 플랜은 15분간 접속이 없으면 잠들었다가 첫 접속 시 30초~1분 정도 걸립니다.

## API

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | `/api/analyze` | 계정 분석 (`{"username":"..."}`), 결과는 이력에 자동 저장 |
| GET | `/api/history` | 분석 이력 전체 (최신순) |
| GET | `/api/history/:username` | 특정 계정 이력 (ER 추이) |
| PATCH | `/api/history/:id` | 수동 체크 업데이트 → 적합도 점수 재계산 |
| DELETE | `/api/history/:id` | 이력 삭제 |
| GET | `/api/health` | 상태 확인 (`mock` 여부 포함) |
