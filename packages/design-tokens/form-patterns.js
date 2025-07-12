// ExchangeGO Design System v2.1 - Enhanced Dark Theme Support
// Улучшенная семантическая система с лучшей иерархией для темной темы
// Обновлено: 12 июля 2025

// === SEMANTIC COLOR TOKENS v2.1 ===
// Улучшенные семантические токены с правильной иерархией для темной темы

export const semanticTokens = {
  // Поверхности с четкой иерархией для темной темы
  surfaces: {
    // Основная поверхность страницы (самый темный)
    page: 'bg-background text-foreground',
    // Поверхность карточек (светлее фона)
    elevated: 'bg-card text-card-foreground border border-border',
    // Поверхность для акцентов (еще светлее)
    accent: 'bg-accent text-accent-foreground border border-border/60',
    // Поверхность для второстепенных элементов
    muted: 'bg-muted text-muted-foreground border border-border/40',
    // Поверхность для интерактивных элементов (самая светлая)
    interactive:
      'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
    // Поверхность для выделений и важных элементов
    prominent: 'bg-primary/10 text-foreground border border-primary/30',
  },

  // Границы с улучшенной видимостью в обеих темах
  borders: {
    // Стандартная граница (более заметная в светлой теме)
    default: 'border-border',
    // Мягкая граница для тонких разделений
    subtle: 'border-border/50 dark:border-border/40',
    // Четкая граница для важных разделений
    strong: 'border-border/80 dark:border-border shadow-sm',
    // Цветная граница для акцентов - адаптивная
    accent: 'border-primary/50 dark:border-primary/40 shadow-primary/5 dark:shadow-primary/10',
    // Граница для интерактивных элементов
    interactive: 'border-input hover:border-ring focus:border-ring',
    // Контрастная граница для выделения
    contrast: 'border-border/70 dark:border-border/60',
  },

  // Тени с улучшенной видимостью для обеих тем
  elevation: {
    // Тонкая тень для группировки - адаптивная для обеих тем
    subtle: 'shadow-sm shadow-black/5 dark:shadow-black/40',
    // Стандартная тень для карточек - заметная в светлой теме
    standard: 'shadow-md shadow-black/8 dark:shadow-black/30',
    // Усиленная тень для модальных окон
    floating: 'shadow-lg shadow-black/12 dark:shadow-black/50',
    // Внутренняя тень для углублений
    inset: 'shadow-inner shadow-black/10 dark:shadow-black/40',
    // Выраженная тень для важных элементов
    prominent: 'shadow-xl shadow-black/15 dark:shadow-black/60',
    // Цветные тени для акцентов
    coloredBlue: 'shadow-lg shadow-blue-500/20 dark:shadow-blue-400/30',
    coloredGreen: 'shadow-lg shadow-green-500/20 dark:shadow-green-400/30',
  },
};

// === ENHANCED FORM CONTAINERS v2.1 ===
// Улучшенные контейнеры с четкой визуальной иерархией для обеих тем

export const formContainers = {
  // Основной контейнер для exchange формы
  exchangeForm: {
    base: 'bg-card text-card-foreground border border-border/70 dark:border-border rounded-2xl shadow-standard p-6 space-y-6',
    variants: {
      // Компактная версия для hero секции - выделяется на фоне
      compact:
        'bg-card backdrop-blur-sm text-card-foreground border border-border/80 dark:border-border/80 rounded-xl shadow-standard p-6 space-y-6',
      // Полная версия для страницы exchange
      full: 'bg-card text-card-foreground border border-border/70 dark:border-border rounded-2xl shadow-floating p-8 space-y-8',
      // Мобильная версия
      mobile:
        'bg-card text-card-foreground border border-border/70 dark:border-border/70 rounded-lg shadow-standard p-4 space-y-4',
      // Версия с акцентом - выраженная в обеих темах
      featured:
        'bg-card text-card-foreground border border-primary/50 dark:border-primary/40 rounded-2xl shadow-prominent shadow-primary/10 dark:shadow-primary/10 p-6 space-y-6',
      // Приглушенная версия для вторичных элементов
      subtle:
        'bg-muted text-muted-foreground border border-border/60 dark:border-border/50 rounded-xl shadow-subtle p-6 space-y-6',
    },
  },

  // Контейнер для пары связанных карточек
  cardPair: {
    base: 'space-y-4',
    variants: {
      // Горизонтальная группировка с улучшенным разделением
      horizontal: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start',
      // Вертикальная группировка с четкими отступами
      vertical: 'space-y-6',
      // Компактная версия для мобильных
      compact: 'grid grid-cols-1 gap-6',
      // С визуальной связью между элементами
      connected: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative',
    },
  },

  // Контейнер для action кнопок с улучшенным разделением
  actionArea: {
    base: 'flex flex-col gap-3 pt-6 border-t border-border/70 dark:border-border/60 mt-6',
    variants: {
      // Центрированная кнопка без разделителя
      simple: 'flex justify-center pt-6',
      // Центрированная кнопка с четким разделителем
      separated:
        'flex justify-center pt-6 border-t border-border/70 dark:border-border/60 mt-6 shadow-subtle',
      // Полноширинная кнопка
      full: 'w-full pt-6',
      // Группа кнопок с улучшенным разделением
      group:
        'flex flex-col sm:flex-row gap-4 pt-6 border-t border-border/70 dark:border-border/60 mt-6',
      // Встроенные в форму действия
      inline: 'flex justify-center pt-6',
      // Выделенная область действий
      prominent:
        'bg-accent/30 dark:bg-accent/20 rounded-lg p-4 mt-6 border border-border/50 dark:border-border/40',
    },
  },
};

// === ENHANCED CARD PATTERNS v2.1 ===
// Улучшенные паттерны карточек с четкой визуальной иерархией для обеих тем

export const enhancedCards = {
  // Карточка с улучшенным контрастом
  groupedCard: {
    base: 'bg-card text-card-foreground border border-border/70 dark:border-border rounded-xl p-5 transition-all duration-200 hover:bg-accent/50 hover:border-border/80 dark:hover:border-border shadow-standard',
    states: {
      default: 'bg-card text-card-foreground border border-border/70 dark:border-border',
      active:
        'bg-accent text-accent-foreground border border-primary/70 dark:border-primary/60 shadow-prominent shadow-primary/10',
      error:
        'bg-destructive/15 text-card-foreground border border-destructive/70 dark:border-destructive/60 shadow-standard',
      success:
        'bg-green-500/10 text-card-foreground border border-green-500/50 dark:border-green-500/40 shadow-standard',
      disabled:
        'bg-muted/30 text-muted-foreground border border-border/40 dark:border-border/30 opacity-60',
      // Новое состояние для выделения
      highlighted:
        'bg-prominent text-foreground border border-primary/60 dark:border-primary/50 shadow-prominent',
    },
  },

  // Карточка для exchange формы с улучшенными цветовыми акцентами
  exchangeCard: {
    base: 'bg-card text-card-foreground border border-border/70 dark:border-border rounded-xl p-5 shadow-standard hover:shadow-floating transition-all duration-200',
    variants: {
      // Синий акцент для отправки - заметный в обеих темах
      sending:
        'border-l-4 border-l-blue-500 dark:border-l-blue-400 shadow-md shadow-blue-500/15 dark:shadow-blue-400/20',
      // Зеленый акцент для получения - заметный в обеих темах
      receiving:
        'border-l-4 border-l-green-500 dark:border-l-green-400 shadow-md shadow-green-500/15 dark:shadow-green-400/20',
      // Нейтральная версия
      neutral: 'border border-border/70 dark:border-border shadow-standard',
      // Выделенная версия
      featured:
        'border-2 border-primary/50 dark:border-primary/40 shadow-prominent shadow-primary/10',
    },
  },

  // Новые паттерны для лучшего разделения
  sectionCard: {
    // Карточка секции с четкими границами
    base: 'bg-accent/40 dark:bg-accent/30 text-accent-foreground border border-border/70 dark:border-border/60 rounded-lg p-4 shadow-subtle',
    variants: {
      subtle:
        'bg-muted/60 dark:bg-muted/50 text-muted-foreground border border-border/50 dark:border-border/40',
      prominent:
        'bg-primary/8 dark:bg-primary/5 text-foreground border border-primary/40 dark:border-primary/30',
      interactive:
        'bg-secondary/60 dark:bg-secondary/50 text-secondary-foreground border border-border/60 dark:border-border/50 hover:bg-secondary/80 dark:hover:bg-secondary/70',
    },
  },
};

// === VISUAL CONNECTORS V2 ===
// Улучшенные визуальные соединители с семантическими токенами

export const visualConnectors = {
  // Иконка обмена между карточками - семантически правильная
  exchangeIcon: {
    base: 'absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10',
    background: 'bg-background border-2 border-border rounded-full p-2 shadow-sm',
    variants: {
      primary: 'bg-primary/10 dark:bg-primary/20 border-primary/30 text-primary',
      minimal: 'bg-card border-border text-muted-foreground',
      accent: 'bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 shadow-lg',
      subtle: 'bg-muted border-muted-foreground/20 text-muted-foreground',
    },
  },

  // Линия соединения - правильная для темной темы
  connectionLine: {
    base: 'absolute left-1/2 transform -translate-x-1/2 w-0.5 bg-border',
    variants: {
      dashed: 'border-l-2 border-dashed border-border w-0',
      gradient: 'bg-gradient-to-b from-primary/20 to-accent/20',
      subtle: 'bg-muted-foreground/20',
    },
  },
};

// === COMPONENT GROUPING UTILITIES V2 ===
// Улучшенные утилиты для группировки компонентов с семантическими токенами

export const componentGroups = {
  // Группа форм с заголовком - семантически правильная
  formGroup: {
    container: 'space-y-6',
    header: 'text-center mb-6',
    title: 'text-2xl font-bold text-foreground',
    subtitle: 'text-muted-foreground mt-2',
    content: 'space-y-6',
  },

  // Группа карточек - улучшенная
  cardGroup: {
    container: 'space-y-6 relative',
    grid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    connector: 'flex items-center justify-center -my-2 relative z-10',
  },

  // Группа действий - семантически правильная
  actionGroup: {
    container: 'border-t border-border/30 pt-6 mt-6',
    primary: 'space-y-3',
    secondary: 'flex justify-center mt-4',
    inline: 'pt-4',
  },
};

// === LAYOUT IMPROVEMENTS v2.1 ===
// Улучшения лэйаута с четкой визуальной иерархией

export const layoutPatterns = {
  // Контейнер с четкими границами и улучшенным контрастом
  boundedContainer: {
    base: 'bg-card text-card-foreground border border-border/80 rounded-2xl shadow-standard overflow-hidden',
    header: 'bg-accent/20 px-6 py-4 border-b border-border/60',
    content: 'p-6 space-y-6',
    footer: 'bg-muted/30 px-6 py-4 border-t border-border/60',
  },

  // Секционированный лэйаут с улучшенными разделителями
  sectionedLayout: {
    section: 'space-y-6',
    divider: 'border-t border-border/60 my-8 shadow-subtle',
    group: 'bg-accent/15 rounded-lg p-5 space-y-4 border border-border/40',
    // Новые паттерны для лучшего разделения
    prominentSection: 'bg-primary/5 rounded-xl p-6 border border-primary/30 space-y-6',
    subtleSection: 'bg-muted/20 rounded-lg p-5 border border-border/30 space-y-4',
  },

  // Специальные паттерны для complex компонентов
  complexComponent: {
    // Основной wrapper с улучшенным контрастом
    wrapper: 'bg-card text-card-foreground border border-border/80 rounded-xl shadow-standard',
    // Внутренний контент с padding
    content: 'p-6 space-y-6',
    // Секция действий с четким разделением
    actions: 'pt-6 border-t border-border/60 mt-6 bg-accent/10 rounded-b-xl',
    // Горизонтальная группировка элементов с увеличенными отступами
    horizontalGroup: 'grid grid-cols-1 md:grid-cols-2 gap-8 items-start',
    // Панель с боковым содержимым
    sidePanel: 'bg-muted/30 border-l border-border/60 pl-6 ml-6',
  },

  // Новые паттерны для улучшения визуального разделения
  visualSeparation: {
    // Карточка с выраженным разделением
    elevatedCard: 'bg-card border-2 border-border/50 rounded-xl shadow-floating p-6',
    // Встроенная панель
    insetPanel: 'bg-muted/40 border border-border/40 rounded-lg p-4 shadow-inset',
    // Выделенная область
    highlightedArea: 'bg-primary/10 border border-primary/30 rounded-lg p-5 shadow-standard',
    // Секция с градиентом для лучшего разделения
    gradientSection:
      'bg-gradient-to-br from-card to-accent/20 border border-border/60 rounded-xl p-6',
  },
};

// === SEMANTIC SPACING FOR FORMS V2 ===
// Улучшенные семантические отступы

export const formSpacing = {
  // Между элементами одной группы
  withinGroup: 'space-y-3',
  // Между группами элементов
  betweenGroups: 'space-y-6',
  // Между основными секциями
  betweenSections: 'space-y-8',
  // Вокруг action кнопок - улучшенное
  aroundActions: 'pt-4',
  // Разделитель между секциями
  sectionDivider: 'pt-6 mt-6 border-t border-border/30',
};

// === INTERACTION STATES ===
// Состояния интерактивности для правильной работы с темами

const TRANSITION_BASE = 'transition-all duration-200 ease-in-out';

export const interactionStates = {
  // Состояния для кнопок и интерактивных элементов
  button: {
    default: TRANSITION_BASE,
    hover: 'hover:shadow-md hover:scale-[1.02]',
    active: 'active:scale-[0.98]',
    focus: 'focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background',
    disabled: 'disabled:opacity-50 disabled:pointer-events-none',
  },

  // Состояния для карточек
  card: {
    default: TRANSITION_BASE,
    hover: 'hover:shadow-md hover:border-border',
    selected: 'ring-2 ring-ring ring-offset-2 ring-offset-background',
    error: 'border-destructive/50 bg-destructive/5',
  },

  // Состояния для форм
  input: {
    default: TRANSITION_BASE,
    focus: 'focus:border-ring focus:ring-2 focus:ring-ring/20',
    error: 'border-destructive focus:border-destructive focus:ring-destructive/20',
    valid: 'border-green-500 dark:border-green-400',
  },
};

export default {
  semanticTokens,
  formContainers,
  enhancedCards,
  visualConnectors,
  componentGroups,
  layoutPatterns,
  formSpacing,
  interactionStates,
};
