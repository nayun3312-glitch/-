// 인플루언서 비교 뷰 — 이력에서 선택한 2~4명을 나란히 비교.
// 각 지표에서 가장 우수한 인플루언서를 👑 하이라이트로 표시합니다.

const GRADE_CLS = {
  '적극 추천': 'bg-green-100 text-green-700',
  '검토 추천': 'bg-blue-100 text-blue-700',
  보류: 'bg-amber-100 text-amber-700',
  부적합: 'bg-red-100 text-red-700'
};

const STATUS_ICON = { pass: '✅', warn: '⚠️', fail: '❌', unchecked: '⬜' };

const METRIC_ROWS = [
  {
    label: '팔로워 수',
    get: (r) => r.accountInfo.followers,
    fmt: (v) => `${v.toLocaleString()}명`
  },
  {
    label: '3개월 평균 ER',
    get: (r) => (r.metrics.recentER ? r.metrics.recentER.value : 0),
    fmt: (v) => `${v}%`
  },
  {
    label: '주간 업로드 빈도',
    get: (r) => r.metrics.weeklyUploadFrequency || 0,
    fmt: (v) => `주 ${v}회`
  },
  {
    label: '스킨케어 비중',
    get: (r) => (r.anua && r.anua.derived ? r.anua.derived.skincareRatio : 0),
    fmt: (v) => `${v}%`
  },
  {
    label: '아누아 적합도 점수',
    get: (r) => (r.anua ? r.anua.totalScore : 0),
    fmt: (v) => `${v}점`
  }
];

export default function CompareView({ records, onBack }) {
  const criteriaKeys = records[0] && records[0].anua ? records[0].anua.topCriteria : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">⚖️ 인플루언서 비교</h2>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-gray-400 text-white rounded-lg text-sm font-semibold hover:bg-gray-500"
        >
          ← 이력으로
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-6 overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="border-b-2">
              <th className="text-left px-3 py-3 text-gray-500 w-40">항목</th>
              {records.map((r) => (
                <th key={r.id} className="px-3 py-3 text-center">
                  <p className="font-bold text-gray-800">@{r.username}</p>
                  <p className="text-xs text-gray-400 font-normal">
                    {new Date(r.analyzedAt).toLocaleDateString('ko-KR')} 분석
                  </p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 종합 등급 */}
            <tr className="border-b bg-gray-50">
              <td className="px-3 py-3 font-semibold text-gray-700">종합 등급</td>
              {records.map((r) => (
                <td key={r.id} className="px-3 py-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      GRADE_CLS[r.anua ? r.anua.grade : ''] || 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {r.anua ? r.anua.grade : '-'}
                  </span>
                </td>
              ))}
            </tr>

            {/* 수치 지표 — 최고값 하이라이트 */}
            {METRIC_ROWS.map((row) => {
              const values = records.map(row.get);
              const best = Math.max(...values);
              return (
                <tr key={row.label} className="border-b">
                  <td className="px-3 py-3 font-semibold text-gray-700">{row.label}</td>
                  {records.map((r, i) => (
                    <td
                      key={r.id}
                      className={`px-3 py-3 text-center ${
                        values[i] === best
                          ? 'bg-yellow-50 font-bold text-pink-600'
                          : 'text-gray-700'
                      }`}
                    >
                      {values[i] === best && '👑 '}
                      {row.fmt(values[i])}
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* 아누아 Top 5 기준 통과 여부 */}
            {criteriaKeys.map((c) => (
              <tr key={c.key} className="border-b">
                <td className="px-3 py-3 text-gray-600">
                  <span className="text-xs text-gray-400 mr-1">{c.rank}순위</span>
                  {c.label}
                </td>
                {records.map((r) => {
                  const item =
                    r.anua && r.anua.topCriteria.find((x) => x.key === c.key);
                  return (
                    <td key={r.id} className="px-3 py-3 text-center text-lg" title={item ? item.detail : ''}>
                      {item ? STATUS_ICON[item.status] || '⬜' : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-gray-400 mt-3">
          ✅ 통과 · ⚠️ 부분 충족 · ❌ 미달 · ⬜ 수동 미확인 — 아이콘에 마우스를 올리면 상세 수치가 보입니다.
        </p>
      </div>
    </div>
  );
}
