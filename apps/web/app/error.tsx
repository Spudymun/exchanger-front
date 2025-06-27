"use client";

import Link from 'next/link';

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
    return (
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
            <div className="max-w-2xl mx-auto p-8 text-center">
                <div className="mb-8">
                    <div className="w-16 h-16 bg-error-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.298 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                        Произошла ошибка
                    </h1>
                    <p className="text-lg text-neutral-600 mb-6">
                        Что-то пошло не так. Пожалуйста, попробуйте еще раз.
                    </p>
                    {error.message && (
                        <div className="bg-error-50 border border-error-200 rounded-lg p-4 mb-6">
                            <p className="text-sm text-error-700 font-mono">
                                {error.message}
                            </p>
                        </div>
                    )}
                </div>

                <div className="flex gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        Попробовать снова
                    </button>
                    <Link
                        href="/"
                        className="bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                    >
                        На главную
                    </Link>
                </div>
            </div>
        </div>
    );
}
