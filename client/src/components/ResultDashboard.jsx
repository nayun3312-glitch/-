import { useEffect, useState } from 'react';
import AnuaScoreSection from './AnuaScoreSection';
import StrategyProposal from './StrategyProposal';

export default function ResultDashboard({ result, onReset, backLabel = '🔄 새로운 분석' }) {
  const { accountInfo, metrics, contentAnalysis, strategy } = result;
  const recentER = metrics.recentER;

  // 아누아 평가·수동 체크는 토글 시 서버 재계산 결과로 갱신되므로 로컬 상태로 관리
  const [anua, setAnua] = useState(result.anua);
  const [manualChecks, setManualChecks] = useState(result.manualChecks || {});

  useEffect(() => {
    setAnua(result.anua);
    setManualChecks(result.manualChecks || {});
  }, [result]);

  const toggleCheck = async (key) => {
    const next = { ...manualChecks, [key]: !manualChecks[key] };
    setManualChecks(next);
    if (!result.historyId) return;
    try {
      const res = await fetch(`/api/history/${result.historyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manualChecks: next })
      });
      const data = await res.json();
      if (res.ok) {
        setAnua(data.anua);
        setManualChecks(data.manualChecks);
      }
    } catch {
      // 저장 실패 시에도 화면 체크 상태는 유지 (다음 토글에서 재시도)
    }
  };

  const downloadCSV = () => {
    let csv =
      '게시물 번호,타입,캡션,조회수,좋아요,댓글,저장,공유,조회율(%),참여율(%),참여도\n';
    metrics.postMetrics.forEach((post) => {
      const caption = (post.caption || '').replace(/"/g, '""').replace(/\n/g, ' ');
      csv += `${post.postNumber},${post.type || ''},"${caption}",${post.views},${post.likes},${post.comments},${post.saves},${post.shares},${post.viewRate},${post.engagementRate},${post.engagementGrade}\n`;
    });
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${accountInfo.username}_analysis.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const gradeClass = (grade) =>
    grade === '높음'
      ? 'bg-green-100 text-green-700'
      : grade === '중간'
        ? 'bg-yellow-100 text-yellow-700'
        : 'bg-red-100 text-red-700';

  return (
    <div className="space-y-6">
      {/* 아누아 협업 적합도 평가 (최상단 — 한눈에 판단) */}
      <AnuaScoreSection anua={anua} manualChecks={manualChecks} onToggle={toggleCheck} />

      {/* 계정 정보 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800">@{accountInfo.username}</h2>
        {accountInfo.bio && <p className="text-gray-600 mt-1">{accountInfo.bio}</p>}
        <div className="flex gap-8 mt-4 text-gray-700">
          <div>
            <p className="text-2xl font-bold text-pink-500">
              {accountInfo.followers.toLocaleString()}
            </p>
            <p className="text-sm">팔로워</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-500">
              {accountInfo.totalPosts.toLocaleString()}
            </p>
            <p className="text-sm">게시물</p>
          </div>
        </div>
      </div>

      {/* 데이터 부족 경고 */}
      {recentER && recentER.insufficientData && (
        <div className="bg-orange-100 border border-orange-300 text-orange-800 px-4 py-3 rounded-lg text-sm">
          ⚠️ {recentER.warning}
        </div>
      )}

      {/* 핵심 지표 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">3개월 평균 ER ⭐</p>
          <p className="text-4xl font-bold">{recentER ? recentER.value : '-'}%</p>
          <p className="text-xs opacity-80 mt-1">
            (좋아요+댓글)÷팔로워 · 최근 {recentER ? recentER.postCount : 0}개 게시글
          </p>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">평균 조회율</p>
          <p className="text-4xl font-bold">{metrics.averageViewRate}%</p>
        </div>
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">평균 참여율</p>
          <p className="text-4xl font-bold">{metrics.averageEngagementRate}%</p>
          <p className="text-xs opacity-80 mt-1">좋아요+댓글+저장+공유 기준</p>
        </div>
        <div className="bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-lg p-6">
          <p className="text-sm opacity-90">주간 업로드 빈도</p>
          <p className="text-4xl font-bold">
            {metrics.weeklyUploadFrequency != null ? metrics.weeklyUploadFrequency : '-'}
            <span className="text-xl font-semibold">회</span>
          </p>
        </div>
      </div>

      {/* 콘텐츠 분석 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📝 콘텐츠 분석</h3>
        <p className="text-lg font-semibold text-gray-700 mb-4">
          "{contentAnalysis.oneLiner}"
        </p>

        {contentAnalysis.topCategories.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold text-gray-700 mb-2">상위 카테고리</p>
            <div className="flex gap-2 flex-wrap">
              {contentAnalysis.topCategories.map((cat, idx) => (
                <span
                  key={idx}
                  className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm"
                >
                  {cat.category} ({cat.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <p className="font-semibold text-gray-700 mb-2">톤앤매너</p>
          <div className="flex gap-2 flex-wrap">
            {contentAnalysis.toneAndManner.map((tone, idx) => (
              <span
                key={idx}
                className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
              >
                {tone}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 게시물별 상세 */}
      <div className="bg-white rounded-lg shadow-lg p-6 overflow-x-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-4">📋 게시물별 상세 분석</h3>
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b-2">
            <tr>
              <th className="text-left px-4 py-2">#</th>
              <th className="text-left px-4 py-2">타입</th>
              <th className="text-left px-4 py-2">캡션</th>
              <th className="text-right px-4 py-2">조회수</th>
              <th className="text-right px-4 py-2">조회율</th>
              <th className="text-right px-4 py-2">참여율</th>
              <th className="text-right px-4 py-2">참여도</th>
            </tr>
          </thead>
          <tbody>
            {metrics.postMetrics.map((post, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3">{post.postNumber}</td>
                <td className="px-4 py-3">
                  {post.type === 'Reel' ? '🎬 Reel' : post.type || '-'}
                </td>
                <td className="px-4 py-3 truncate max-w-xs">{post.caption}</td>
                <td className="text-right px-4 py-3">
                  {post.views.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3 font-semibold">
                  {post.viewRate}%
                </td>
                <td className="text-right px-4 py-3 font-semibold">
                  {post.engagementRate}%
                </td>
                <td className="text-right px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${gradeClass(
                      post.engagementGrade
                    )}`}
                  >
                    {post.engagementGrade}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 마케팅 전략 */}
      <StrategyProposal strategy={strategy} />

      {/* 액션 버튼 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={downloadCSV}
          className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600"
        >
          📥 CSV 다운로드
        </button>
        <button
          onClick={onReset}
          className="flex-1 px-6 py-3 bg-gray-400 text-white rounded-lg font-semibold hover:bg-gray-500"
        >
          {backLabel}
        </button>
      </div>
    </div>
  );
}
