// 분석 이력 탭 — 계정별 최신 결과 목록 + 과거 기록 펼쳐보기(ER 추이) + 상세 다시 보기 + 비교 선택.
import { useEffect, useState, useCallback } from 'react';
import ResultDashboard from './ResultDashboard';
import CompareView from './CompareView';

const GRADE_CLS = {
  '적극 추천': 'bg-green-100 text-green-700',
  '검토 추천': 'bg-blue-100 text-blue-700',
  보류: 'bg-amber-100 text-amber-700',
  부적합: 'bg-red-100 text-red-700'
};

function gradeBadge(record) {
  const grade = record.anua ? record.anua.grade : '-';
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
        GRADE_CLS[grade] || 'bg-gray-100 text-gray-500'
      }`}
    >
      {grade}
    </span>
  );
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function HistoryTab() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState({}); // username → bool
  const [selected, setSelected] = useState([]); // 비교용 record id 목록 (2~4개)
  const [view, setView] = useState({ mode: 'list', record: null });

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/history');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '이력을 불러오지 못했습니다.');
      setRecords(data.records);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleDelete = async (id) => {
    if (!window.confirm('이 분석 기록을 삭제할까요?')) return;
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    setSelected((prev) => prev.filter((s) => s !== id));
    fetchRecords();
  };

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : prev.length >= 4
          ? prev // 최대 4명
          : [...prev, id]
    );
  };

  // 상세 보기 / 비교 뷰
  if (view.mode === 'detail' && view.record) {
    const r = view.record;
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          🗂 {fmtDate(r.analyzedAt)} 분석 기록을 다시 보는 중입니다.
        </p>
        <ResultDashboard
          result={{ ...r, historyId: r.id }}
          backLabel="← 이력 목록으로"
          onReset={() => {
            setView({ mode: 'list', record: null });
            fetchRecords(); // 수동 체크 변경분 반영
          }}
        />
      </div>
    );
  }

  if (view.mode === 'compare') {
    const compareRecords = selected
      .map((id) => records.find((r) => r.id === id))
      .filter(Boolean);
    return (
      <CompareView
        records={compareRecords}
        onBack={() => setView({ mode: 'list', record: null })}
      />
    );
  }

  // 계정별 그룹핑 (최신 기록이 대표)
  const groups = [];
  const byUser = {};
  records.forEach((r) => {
    const key = r.username.toLowerCase();
    if (!byUser[key]) {
      byUser[key] = { username: r.username, latest: r, history: [] };
      groups.push(byUser[key]);
    } else {
      byUser[key].history.push(r);
    }
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-2xl font-bold text-gray-800">🗂 분석 이력</h2>
        <button
          onClick={() => setView({ mode: 'compare', record: null })}
          disabled={selected.length < 2}
          className="px-5 py-2 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ⚖️ 선택한 {selected.length}명 비교하기 (2~4명)
        </button>
      </div>

      {loading && <p className="text-gray-500 py-8 text-center">이력을 불러오는 중...</p>}
      {error && <p className="text-red-500">❌ {error}</p>}

      {!loading && !error && groups.length === 0 && (
        <div className="bg-white rounded-lg shadow-lg p-10 text-center text-gray-500">
          아직 저장된 분석 이력이 없습니다. 분석 탭에서 계정을 분석하면 자동으로 저장돼요.
        </div>
      )}

      {groups.map((g) => {
        const r = g.latest;
        const isOpen = !!expanded[g.username];
        return (
          <div key={g.username} className="bg-white rounded-lg shadow-lg p-4 sm:p-5">
            {/* 최신 기록 (대표 행) */}
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="checkbox"
                checked={selected.includes(r.id)}
                onChange={() => toggleSelect(r.id)}
                className="w-5 h-5 accent-pink-500"
                title="비교 대상으로 선택"
              />
              <div className="flex-1 min-w-[140px]">
                <p className="font-bold text-gray-800">@{g.username}</p>
                <p className="text-xs text-gray-400">{fmtDate(r.analyzedAt)} (최신)</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-purple-600">
                  ER {r.metrics.recentER ? r.metrics.recentER.value : '-'}%
                </p>
                <p className="text-xs text-gray-400">
                  팔로워 {r.accountInfo.followers.toLocaleString()}
                </p>
              </div>
              {gradeBadge(r)}
              <span className="text-sm font-bold text-gray-700 w-12 text-right">
                {r.anua ? r.anua.totalScore : '-'}점
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setView({ mode: 'detail', record: r })}
                  className="px-3 py-1.5 bg-blue-500 text-white rounded text-xs font-semibold hover:bg-blue-600"
                >
                  상세 보기
                </button>
                <button
                  onClick={() => handleDelete(r.id)}
                  className="px-3 py-1.5 bg-red-400 text-white rounded text-xs font-semibold hover:bg-red-500"
                >
                  삭제
                </button>
                {g.history.length > 0 && (
                  <button
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [g.username]: !isOpen }))
                    }
                    className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded text-xs font-semibold hover:bg-gray-300"
                  >
                    {isOpen ? '▲ 접기' : `▼ 과거 ${g.history.length}건`}
                  </button>
                )}
              </div>
            </div>

            {/* 과거 기록 (ER 변화 추이 확인) */}
            {isOpen && (
              <div className="mt-3 border-t pt-3 space-y-2">
                {g.history.map((h) => (
                  <div
                    key={h.id}
                    className="flex flex-wrap items-center gap-3 text-sm text-gray-600 pl-2 sm:pl-8"
                  >
                    <span className="text-xs text-gray-400 w-32">{fmtDate(h.analyzedAt)}</span>
                    <span className="font-semibold text-purple-500">
                      ER {h.metrics.recentER ? h.metrics.recentER.value : '-'}%
                    </span>
                    {gradeBadge(h)}
                    <span className="font-semibold">{h.anua ? h.anua.totalScore : '-'}점</span>
                    <button
                      onClick={() => setView({ mode: 'detail', record: h })}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold hover:bg-blue-200"
                    >
                      보기
                    </button>
                    <button
                      onClick={() => handleDelete(h.id)}
                      className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-semibold hover:bg-red-200"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
