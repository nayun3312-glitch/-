import { useState } from 'react';

export default function InputForm({ onAnalyze, loading, error }) {
  const [username, setUsername] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleaned = username.trim().replace(/^@/, '');
    if (cleaned) onAnalyze(cleaned);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-lg shadow-lg p-8 mb-8"
    >
      <div className="flex flex-col sm:flex-row gap-4">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Instagram 계정명 입력 (예: blackpink, @blackpink)"
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !username.trim()}
          className="px-8 py-3 bg-gradient-to-r from-pink-500 to-blue-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '분석 중...' : '분석'}
        </button>
      </div>
      {error && <p className="text-red-500 mt-3">❌ {error}</p>}
    </form>
  );
}
