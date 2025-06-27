"use client";

import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <div className="max-w-2xl mx-auto p-8 text-center">
                <div className="mb-8">
                    <div className="text-8xl font-bold text-primary-600 mb-4">
                        404
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Страница не найдена
                    </h1>
                    <p className="text-lg text-neutral-600 mb-8">
                        Извините, но запрашиваемая страница не существует или была перемещена.
                    </p>
                </div>

                <div className="flex gap-4 justify-center">
                    <Link
                        href="/"
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        На главную
                    </Link>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        Назад
                    </button>
                </div>
            </div>
        </div>
    );
}
