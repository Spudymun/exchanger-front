export default function Loading() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                <h2 className="text-xl font-semibold text-neutral-700">
                    Загрузка панели администратора...
                </h2>
                <p className="text-neutral-500 mt-2">
                    Пожалуйста, подождите
                </p>
            </div>
        </div>
    );
}
