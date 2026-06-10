import { useState } from 'react';
import InputForm from './components/InputForm';
import LoadingSpinner from './components/LoadingSpinner';
import ResultDashboard from './components/ResultDashboard';
import HistoryTab from './components/HistoryTab';

export default function App() {
  const [tab, setTab] = useState('analyze'); // 'analyze' | 'history'
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async (username) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '분석에 실패했습니다.');
      setResult(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
  };

  const tabClass = (name) =>
    `px-5 py-2.5 rounded-full text-sm font-semibold transition ${
      tab === name
        ? 'bg-gradient-to-r from-pink-500 to-blue-500 text-white shadow'
        : 'bg-white text-gray-600 hover:bg-gray-100'
    }`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📊 Instagram 인플루언서 분석기
          </h1>
          <p className="text-gray-600">
            계정명만 입력하면 3개월 ER·아누아 협업 적합도·마케팅 전략을 자동 분석합니다
          </p>
        </header>

        {/* 탭 */}
        <nav className="flex justify-center gap-3 mb-8">
          <button className={tabClass('analyze')} onClick={() => setTab('analyze')}>
            🔍 분석
          </button>
          <button className={tabClass('history')} onClick={() => setTab('history')}>
            🗂 분석 이력
          </button>
        </nav>

        {tab === 'analyze' && (
          <>
            {!result && (
              <InputForm onAnalyze={handleAnalyze} loading={loading} error={error} />
            )}

            {loading && <LoadingSpinner />}

            {result && (
              <>
                {result.mock && (
                  <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg mb-4 text-sm">
                    ⚠️ 현재 <b>목업(데모) 데이터</b>로 표시 중입니다. 백엔드{' '}
                    <code>.env</code>에 <code>APIFY_API_KEY</code>를 넣으면 실제
                    크롤링으로 전환됩니다.
                  </div>
                )}
                <ResultDashboard result={result} onReset={handleReset} />
              </>
            )}
          </>
        )}

        {tab === 'history' && <HistoryTab />}
      </div>
    </div>
  );
}
