import {
  layoutStyles,
  pageStyles,
  buttonStyles,
  gridStyles,
  cardStyles,
  textStyles,
  combineStyles,
} from '@repo/ui';

// Константы стилей для устранения дублирования
const FEATURE_CARD_STYLES = combineStyles(cardStyles.base, 'text-center');
const FEATURE_DESCRIPTION_STYLES = combineStyles(textStyles.body.lg, 'leading-relaxed');
const FEATURE_TITLE_STYLES = combineStyles(textStyles.heading.lg, 'mb-3');

export default function HomePage() {
  return (
    <div className={combineStyles(layoutStyles.fullHeight, 'p-5 font-sans')}>
      <h1 className={pageStyles.title.hero}>Exchanger - Работает!</h1>
      <p className={pageStyles.description.hero}>
        Enterprise-ready cryptocurrency exchange platform
      </p>

      <div className={buttonStyles.center}>
        <button className={buttonStyles.primary}>Начать</button>

        <button className={buttonStyles.secondary}>Узнать больше</button>
      </div>

      <div className={combineStyles(gridStyles.cards, 'gap-5 mt-15')}>
        <div className={FEATURE_CARD_STYLES}>
          <h3 className={FEATURE_TITLE_STYLES}>Turborepo Monorepo</h3>
          <p className={FEATURE_DESCRIPTION_STYLES}>
            Масштабируемая архитектура монорепозитория с общими пакетами
          </p>
        </div>

        <div className={FEATURE_CARD_STYLES}>
          <h3 className={FEATURE_TITLE_STYLES}>tRPC API</h3>
          <p className={FEATURE_DESCRIPTION_STYLES}>
            End-to-end типизация API с автоматическим выводом типов
          </p>
        </div>

        <div className={FEATURE_CARD_STYLES}>
          <h3 className={FEATURE_TITLE_STYLES}>Интернационализация</h3>
          <p className={FEATURE_DESCRIPTION_STYLES}>Поддержка нескольких языков с next-intl</p>
        </div>
      </div>
    </div>
  );
}
