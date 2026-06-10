// 아누아 협업 적합도 평가 섹션 — 종합 등급 배지 + Top 5 기준 카드 + 리스트업 체크리스트.
// 수동 체크 항목은 토글하면 서버에 저장되고 점수·등급이 즉시 재계산됩니다.

const GRADE_STYLE = {
  '적극 추천': 'from-green-500 to-emerald-600',
  '검토 추천': 'from-blue-500 to-indigo-600',
  보류: 'from-amber-400 to-orange-500',
  부적합: 'from-red-500 to-rose-600'
};

const STATUS = {
  pass: { icon: '✅', label: '통과', cls: 'bg-green-100 text-green-700' },
  warn: { icon: '⚠️', label: '부분 충족', cls: 'bg-yellow-100 text-yellow-700' },
  fail: { icon: '❌', label: '미달', cls: 'bg-red-100 text-red-700' },
  unchecked: { icon: '⬜', label: '미확인', cls: 'bg-gray-100 text-gray-500' }
};

function StatusBadge({ status }) {
  const s = STATUS[status] || STATUS.unchecked;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}

export default function AnuaScoreSection({ anua, manualChecks, onToggle }) {
  if (!anua) return null;
  const gradeBg = GRADE_STYLE[anua.grade] || GRADE_STYLE['부적합'];

  return (
    <div className="space-y-4">
      {/* 종합 등급 배지 (한눈에 판단) */}
      <div className={`bg-gradient-to-r ${gradeBg} text-white rounded-xl shadow-lg p-6 sm:p-8`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold opacity-90 mb-1">
              🌿 아누아 협업 적합도
            </p>
            <p className="text-4xl sm:text-5xl font-extrabold">{anua.grade}</p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-5xl sm:text-6xl font-extrabold">
              {anua.totalScore}
              <span className="text-2xl font-semibold opacity-80">
                /{anua.maxScore}
              </span>
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm sm:text-base bg-white/15 rounded-lg px-4 py-3 leading-relaxed">
          {anua.summary}
        </p>
      </div>

      {/* Top 5 기준 카드 (순위 순서대로) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">
          🏆 우선순위 Top 5 기준
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {anua.topCriteria.map((item) => (
            <div
              key={item.key}
              className={`border rounded-lg p-4 flex flex-col gap-2 ${
                item.status === 'pass'
                  ? 'border-green-300 bg-green-50'
                  : item.status === 'fail'
                    ? 'border-red-200 bg-red-50'
                    : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white bg-gray-700 rounded-full w-6 h-6 flex items-center justify-center">
                  {item.rank}
                </span>
                <StatusBadge status={item.status} />
              </div>
              <p className="font-bold text-gray-800">{item.label}</p>
              <p className="text-xs text-gray-500 leading-snug">{item.criteria}</p>
              <p className="text-sm font-semibold text-gray-700">{item.detail}</p>
              <div className="mt-auto flex items-center justify-between">
                <span className="text-sm font-bold text-gray-800">
                  {item.score}
                  <span className="text-gray-400 font-normal">/{item.maxScore}점</span>
                </span>
                {!item.auto && (
                  <label className="flex items-center gap-1 text-xs text-gray-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!manualChecks[item.key]}
                      onChange={() => onToggle(item.key)}
                      className="w-4 h-4 accent-green-600"
                    />
                    확인
                  </label>
                )}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          신뢰도·타겟층은 마케터가 직접 확인 후 체크하면 점수에 반영됩니다.
        </p>
      </div>

      {/* 리스트업 체크리스트 (3개 카테고리) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 리스트업 체크리스트</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {anua.checklist.map((group) => (
            <div key={group.category} className="border border-gray-200 rounded-lg p-4">
              <p className="font-bold text-gray-700 mb-3">✅ {group.category}</p>
              <ul className="space-y-3">
                {group.items.map((item) =>
                  item.auto ? (
                    <li key={item.key} className="flex items-start gap-2 text-sm">
                      <span>{(STATUS[item.status] || STATUS.unchecked).icon}</span>
                      <div>
                        <p className="text-gray-700">{item.label}</p>
                        <p className="text-xs text-gray-400">{item.detail} · 자동 판정</p>
                      </div>
                    </li>
                  ) : (
                    <li key={item.key}>
                      <label className="flex items-start gap-2 text-sm cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={!!manualChecks[item.key]}
                          onChange={() => onToggle(item.key)}
                          className="w-4 h-4 mt-0.5 accent-green-600"
                        />
                        <div>
                          <p className="text-gray-700">{item.label}</p>
                          <p className="text-xs text-gray-400">수동 체크</p>
                        </div>
                      </label>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
