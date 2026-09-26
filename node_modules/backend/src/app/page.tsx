export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-800 p-6">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-bold mb-4 text-blue-600">StockSense API</h1>
        <p className="text-gray-600 mb-6">
          The backend API is successfully deployed and running.
        </p>
        
        <div className="flex flex-col gap-3">
          <a href="/api/kpis" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm font-medium">
            View Dashboard KPIs →
          </a>
          <a href="/api/products" className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 transition-colors text-sm font-medium">
            View Products →
          </a>
        </div>
      </div>
    </div>
  );
}
