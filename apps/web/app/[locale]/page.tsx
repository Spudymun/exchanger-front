export default function HomePage() {
    return (
        <div style={{ minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ fontSize: '48px', textAlign: 'center', marginBottom: '20px' }}>
                Exchanger - Работает!
            </h1>
            <p style={{ fontSize: '18px', textAlign: 'center', color: '#666' }}>
                Enterprise-ready cryptocurrency exchange platform
            </p>

            <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: '#0070f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    marginRight: '20px'
                }}>
                    Начать
                </button>

                <button style={{
                    padding: '12px 24px',
                    fontSize: '16px',
                    backgroundColor: 'transparent',
                    color: '#0070f3',
                    border: '2px solid #0070f3',
                    borderRadius: '6px',
                    cursor: 'pointer'
                }}>
                    Узнать больше
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginTop: '60px'
            }}>
                <div style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#333' }}>
                        Turborepo Monorepo
                    </h3>
                    <p style={{ color: '#666', lineHeight: '1.5' }}>
                        Масштабируемая архитектура монорепозитория с общими пакетами
                    </p>
                </div>

                <div style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#333' }}>
                        tRPC API
                    </h3>
                    <p style={{ color: '#666', lineHeight: '1.5' }}>
                        End-to-end типизация API с автоматическим выводом типов
                    </p>
                </div>

                <div style={{
                    padding: '24px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ fontSize: '20px', marginBottom: '12px', color: '#333' }}>
                        Интернационализация
                    </h3>
                    <p style={{ color: '#666', lineHeight: '1.5' }}>
                        Поддержка нескольких языков с next-intl
                    </p>
                </div>
            </div>
        </div>
    )
}
