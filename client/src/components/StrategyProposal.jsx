export default function StrategyProposal({ strategy }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">💡 마케팅 전략 제안</h3>
      <div className="space-y-4">
        {strategy.map((item, idx) => (
          <div key={idx} className="border-l-4 border-pink-500 pl-4 py-2">
            <h4 className="font-semibold text-gray-800">{item.title}</h4>
            <p className="text-gray-600 mt-1">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
