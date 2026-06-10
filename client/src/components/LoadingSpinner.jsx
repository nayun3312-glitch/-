export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-4 border-pink-200"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-pink-500 animate-spin"></div>
      </div>
      <span className="ml-4 text-gray-700">데이터 수집 및 분석 중...</span>
    </div>
  );
}
