export default function HomePage() {
  return (
    <div className="min-h-screen p-5 font-sans">
      <h1 className="text-5xl text-center mb-5">Exchanger - Работает!</h1>
      <p className="text-lg text-center text-gray-600">
        Enterprise-ready cryptocurrency exchange platform
      </p>

      <div className="text-center mt-10">
        <button className="px-6 py-3 text-base bg-blue-600 text-white border-0 rounded-md cursor-pointer mr-5 hover:bg-blue-700">
          Начать
        </button>

        <button className="px-6 py-3 text-base bg-transparent text-blue-600 border-2 border-blue-600 rounded-md cursor-pointer hover:bg-blue-50">
          Узнать больше
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-15">
        <div className="p-6 border border-gray-200 rounded-lg text-center">
          <h3 className="text-xl mb-3 text-gray-800">Turborepo Monorepo</h3>
          <p className="text-gray-600 leading-relaxed">
            Масштабируемая архитектура монорепозитория с общими пакетами
          </p>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg text-center">
          <h3 className="text-xl mb-3 text-gray-800">tRPC API</h3>
          <p className="text-gray-600 leading-relaxed">
            End-to-end типизация API с автоматическим выводом типов
          </p>
        </div>

        <div className="p-6 border border-gray-200 rounded-lg text-center">
          <h3 className="text-xl mb-3 text-gray-800">Интернационализация</h3>
          <p className="text-gray-600 leading-relaxed">Поддержка нескольких языков с next-intl</p>
        </div>
      </div>
    </div>
  );
}
