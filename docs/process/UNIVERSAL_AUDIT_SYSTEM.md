# 🔍 Универсальная система аудита архитектурных уровней

**Дата создания:** 5 июля 2025  
**Версия:** 1.0  
**Назначение:** Унифицированная система проверки для любого уровня архитектуры любого размера

**Основа:** CODE_REVIEW_PROTOCOLS.md + реальные ограничения инструментов + честная оценка возможностей

---

## 🎯 Принципы универсальной системы

### Честная самооценка возможностей:

- 🤖 **Автоматические проверки:** структурные проверки, импорты, размеры, точные дубликаты (90-100% точность)
- 🧠 **AI-assisted через чтение:** семантические нарушения, контекстуальная логика, архитектурные решения (80-95% точность)
- 👨‍💼 **Экспертная верификация:** стратегические решения, безопасность, доменная специфика (95-100% точность)
- 🎯 **Комбинированный подход:** теоретически 100% покрытие через трехуровневую систему

### Ключевые гарантии:

1. **Трехуровневая система покрытия** - автоматика + AI-assisted + экспертиза = теоретически 100%
2. **Все критерии из CODE_REVIEW_PROTOCOLS.md учитываются** через AI-assisted чтение контекста
3. **Архитектурный контекст не теряется** - AI читает всю кодовую базу для понимания связей
4. **Адаптивная стратегия** - от 100% автоматики до 100% экспертизы в зависимости от проекта

---

## 🔧 Универсальный алгоритм проверки уровня

### Фаза 1: Подготовка и анализ размера

```typescript
interface LevelAuditConfig {
  levelNumber: 1 | 2 | 3 | 4 | 5 | 6;
  files: string[];
  maxGroupSize: number; // Лимит файлов в группе для детального анализа
  criteria: LevelCriteria; // Критерии из CODE_REVIEW_PROTOCOLS.md
  dependencies: {
    imports: string[]; // Разрешенные источники импортов
    exports: string[]; // Куда может экспортировать
    forbidden: string[]; // Запрещенные зависимости
  };
}

// Определение размера уровня и стратегии
function determineAuditStrategy(config: LevelAuditConfig): AuditStrategy {
  const totalFiles = config.files.length;

  if (totalFiles <= config.maxGroupSize) {
    return { type: 'full', groups: [config.files] };
  }

  return {
    type: 'grouped',
    groups: createLogicalGroups(config.files, config.maxGroupSize),
    requiresIntegration: true,
  };
}
```

### Фаза 2: Создание логических групп с учетом размеров (если нужно)

````typescript
interface FileMetrics {
  path: string;
  linesOfCode: number;
  complexity: number;
  dependencies: string[];
  logicalDomain: string;
  criticalityLevel: 'critical' | 'important' | 'standard';
}

interface GroupLimits {
  maxFiles: number;
  maxTotalLines: number;
  maxComplexity: number;
  maxDependencies: number;
}

// ЧЕСТНЫЕ лимиты основанные на реальных возможностях AI
const AI_CONTEXT_LIMITS: GroupLimits = {
  maxFiles: 12, // Реальный лимит для качественного анализа
  maxTotalLines: 3000, // Максимум строк для сохранения качества
  maxComplexity: 100, // Суммарная сложность группы
  maxDependencies: 50, // Максимум связей для отслеживания
};

function createLogicalGroups(
  files: string[],
  levelConfig: LevelAuditConfig
): Promise<FileGroup[]> {
  return analyzeAndGroup(files, levelConfig);
}

async function analyzeAndGroup(
  files: string[],
  config: LevelAuditConfig
): Promise<FileGroup[]> {
  // 1. ОБЯЗАТЕЛЬНЫЙ анализ каждого файла
  const fileMetrics: FileMetrics[] = [];

  for (const file of files) {
    const metrics = await analyzeFileMetrics(file, config.levelNumber);
    fileMetrics.push(metrics);
  }

  // 2. Логическая группировка с учетом размеров
  const logicalGroups = groupByLogicalDomains(fileMetrics, config.levelNumber);

  // 3. Разбивка переполненных групп
  const finalGroups = await splitOversizedGroups(logicalGroups, AI_CONTEXT_LIMITS);

  // 4. Валидация качества группировки
  validateGrouping(finalGroups, fileMetrics);

  return finalGroups;
}

async function analyzeFileMetrics(filePath: string, level: number): Promise<FileMetrics> {
  const content = await readFile(filePath);

  return {
    path: filePath,
    linesOfCode: countEffectiveLines(content),
    complexity: calculateComplexity(content, level),
    dependencies: extractDependencies(content),
    logicalDomain: determineLogicalDomain(filePath, content, level),
    criticalityLevel: assessCriticality(filePath, content, level),
  };
}

function groupByLogicalDomains(
  metrics: FileMetrics[],
  level: number
): Map<string, FileMetrics[]> {
  const groups = new Map<string, FileMetrics[]>();

  // Специфичные для уровня логические домены
  const domainRules = LEVEL_DOMAIN_RULES[level];

  for (const metric of metrics) {
    const domain = metric.logicalDomain;
    if (!groups.has(domain)) {
      groups.set(domain, []);
    }
    groups.get(domain)!.push(metric);
  }

  return groups;
}

async function splitOversizedGroups(
  logicalGroups: Map<string, FileMetrics[]>,
  limits: GroupLimits
): Promise<FileGroup[]> {
  const finalGroups: FileGroup[] = [];

  for (const [domain, files] of logicalGroups) {
    const groupMetrics = calculateGroupMetrics(files);

    if (isWithinLimits(groupMetrics, limits)) {
      // Группа помещается в лимиты
      finalGroups.push({
        name: domain,
        files: files.map(f => f.path),
        metrics: groupMetrics,
        splitStrategy: 'none',
      });
    } else {
      // Группа превышает лимиты - нужно разбить
      const splitGroups = await intelligentSplit(files, limits, domain);
      finalGroups.push(...splitGroups);
    }
  }

  return finalGroups;
}

async function intelligentSplit(
  files: FileMetrics[],
  limits: GroupLimits,
  baseDomain: string
): Promise<FileGroup[]> {
  const groups: FileGroup[] = [];

  // Приоритет критичным файлам
  const sorted = files.sort((a, b) => {
    const priorityOrder = { critical: 0, important: 1, standard: 2 };
    return priorityOrder[a.criticalityLevel] - priorityOrder[b.criticalityLevel];
  });

  let currentGroup: FileMetrics[] = [];
  let currentMetrics = initializeGroupMetrics();

  for (const file of sorted) {
    const wouldExceedLimits = wouldExceedGroupLimits(
      currentMetrics,
      file,
      limits
    );

    if (wouldExceedLimits && currentGroup.length > 0) {
      // Завершаем текущую группу
      groups.push({
        name: `${baseDomain}_part_${groups.length + 1}`,
        files: currentGroup.map(f => f.path),
        metrics: currentMetrics,
        splitStrategy: 'by_complexity',
      });

      // Начинаем новую группу
      currentGroup = [file];
      currentMetrics = fileToGroupMetrics(file);
    } else {
      currentGroup.push(file);
      currentMetrics = mergeMetrics(currentMetrics, file);
    }
  }

  // Добавляем последнюю группу
  if (currentGroup.length > 0) {
    groups.push({
      name: `${baseDomain}_part_${groups.length + 1}`,
      files: currentGroup.map(f => f.path),
      metrics: currentMetrics,
      splitStrategy: groups.length === 0 ? 'none' : 'by_complexity',
    });
  }

  return groups;
}
// Специфичные правила доменов для каждого уровня
const LEVEL_DOMAIN_RULES = {
  1: { // Константы и типы
    domains: {
      'core-constants': ['constants/core', 'constants/business'],
      'ui-constants': ['constants/ui', 'constants/themes'],
      'api-constants': ['constants/api', 'constants/endpoints'],
      'core-types': ['types/core', 'types/business'],
      'api-types': ['types/api', 'types/dto'],
      'ui-types': ['types/ui', 'types/components'],
    },
    maxFilesPerDomain: 8, // Критичный уровень - малые группы
    complexityWeights: { constant: 1, type: 2, enum: 1.5 },
  },

  2: { // Утилиты и core логика
    domains: {
      'data-utils': ['utils/data', 'utils/transform'],
      'validation-utils': ['utils/validation', 'validators'],
      'format-utils': ['utils/format', 'formatters'],
      'business-logic': ['core/business', 'core/calculations'],
      'data-managers': ['core/managers', 'core/services'],
    },
    maxFilesPerDomain: 10,
    complexityWeights: { function: 1, class: 3, method: 1.5 },
  },

  3: { // API слой
    domains: {
      'auth-api': ['routers/auth', 'procedures/auth'],
      'business-api': ['routers/business', 'procedures/business'],
      'admin-api': ['routers/admin', 'procedures/admin'],
      'middleware': ['middleware', 'guards'],
      'schemas': ['schemas', 'validation'],
    },
    maxFilesPerDomain: 6, // Сложная логика - очень малые группы
    complexityWeights: { procedure: 2, middleware: 3, schema: 1 },
  },

  4: { // Хуки и состояние
    domains: {
      'stores': ['stores/auth', 'stores/business', 'stores/ui'],
      'enhanced-hooks': ['hooks/enhanced', 'hooks/business'],
      'selectors': ['selectors', 'derived'],
      'state-utils': ['hooks/utils', 'state/utils'],
    },
    maxFilesPerDomain: 8,
    complexityWeights: { store: 4, hook: 2, selector: 1 },
  },

  5: { // Компоненты
    domains: {
      'ui-primitives': ['ui/primitives', 'ui/atoms'],
      'ui-molecules': ['ui/molecules', 'ui/compounds'],
      'business-components': ['components/business', 'components/features'],
      'layout-components': ['components/layout', 'components/structure'],
      'page-components': ['components/pages', 'app/'],
    },
    maxFilesPerDomain: 5, // Очень сложный анализ
    complexityWeights: { component: 3, hook: 2, style: 1 },
  },

  6: { // Конфигурация
    domains: {
      'build-config': ['webpack', 'vite', 'rollup', 'tsconfig'],
      'dev-config': ['eslint', 'prettier', 'jest', 'playwright'],
      'package-config': ['package.json', 'turbo.json'],
      'deployment-config': ['docker', 'nginx', 'vercel'],
    },
    maxFilesPerDomain: 4, // Критичные файлы
    complexityWeights: { config: 2, script: 1.5, dockerfile: 3 },
  },
};

function determineLogicalDomain(
  filePath: string,
  content: string,
  level: number
): string {
  const rules = LEVEL_DOMAIN_RULES[level];

  // Анализ пути файла
  for (const [domain, patterns] of Object.entries(rules.domains)) {
    if (patterns.some(pattern => filePath.includes(pattern))) {
      return domain;
    }
  }

  // Анализ содержимого для определения домена
  return analyzeContentDomain(content, level);
}

function calculateComplexity(content: string, level: number): number {
  const rules = LEVEL_DOMAIN_RULES[level];
  let complexity = 0;

  // Подсчет элементов разных типов
  const elements = analyzeCodeElements(content);

  for (const [type, count] of Object.entries(elements)) {
    const weight = rules.complexityWeights[type] || 1;
    complexity += count * weight;
  }

  return complexity;
}

function assessCriticality(
  filePath: string,
  content: string,
  level: number
): 'critical' | 'important' | 'standard' {
  // Критичные паттерны по уровням
  const criticalPatterns = {
    1: ['constants/core', 'types/core', 'API_ENDPOINTS'],
    2: ['validation', 'core/business', 'security'],
    3: ['auth', 'middleware', 'security'],
    4: ['stores/auth', 'stores/core'],
    5: ['layout', 'error-boundary'],
    6: ['package.json', 'tsconfig', 'webpack'],
  };

  const levelPatterns = criticalPatterns[level] || [];

  if (levelPatterns.some(pattern =>
    filePath.includes(pattern) || content.includes(pattern)
  )) {
    return 'critical';
  }

  // Дополнительные критерии важности
  if (content.length > 1000 || filePath.includes('index.')) {
    return 'important';
  }

  return 'standard';
}

### Фаза 3: Интенсивная проверка избыточности в каждой группе

```typescript
async function auditGroup(group: FileGroup, config: LevelAuditConfig): Promise<GroupAuditResult> {
  const results: GroupAuditResult = {
    groupName: group.name,
    files: group.files,
    violations: [],
    metrics: {},
    dependencies: [],
    redundancyReport: null, // НОВОЕ: детальный отчет по избыточности
  };

  // 1. ПРИОРИТЕТ: Поиск избыточности (Rule 20)
  const redundancyChecks = await runRedundancyAnalysis(group, config);
  results.violations.push(...redundancyChecks.violations);
  results.redundancyReport = redundancyChecks.report;

  // 2. Автоматизированные проверки
  const automatedChecks = await runAutomatedChecks(group, config);
  results.violations.push(...automatedChecks.violations);

  // 3. Структурные проверки
  const structuralChecks = await runStructuralChecks(group, config);
  results.violations.push(...structuralChecks.violations);

  // 4. Проверки зависимостей
  const dependencyChecks = await runDependencyChecks(group, config);
  results.violations.push(...dependencyChecks.violations);
  results.dependencies = dependencyChecks.dependencies;

  // 5. AI-assisted верификация (новый основной метод)
  const aiAssistedChecks = await runAIAssistedVerification(group, config);
  results.violations.push(...aiAssistedChecks.violations);
  results.contextualInsights = aiAssistedChecks.insights;

  return results;
}

// НОВАЯ система интенсивного поиска избыточности
async function runRedundancyAnalysis(
  group: FileGroup,
  config: LevelAuditConfig
): Promise<RedundancyAnalysisResult> {
  const violations: Violation[] = [];
  const report: RedundancyReport = {
    exactDuplicates: [],
    semanticSimilarities: [],
    functionalOverlaps: [],
    structuralRedundancies: [],
    centralizationOpportunities: [],
  };

  // 1. Поиск точных дубликатов
  const exactDuplicates = await findExactDuplicates(group.files);
  report.exactDuplicates = exactDuplicates;
  violations.push(...exactDuplicates.map(d => ({
    type: 'exact-duplicate',
    severity: 'critical',
    files: d.files,
    message: `Exact duplicate code found: ${d.codeFragment}`,
    redundancyLevel: 1.0,
  })));

  // 2. Семантический анализ похожести
  const semanticSimilarities = await findSemanticSimilarities(group.files, config.levelNumber);
  report.semanticSimilarities = semanticSimilarities;
  violations.push(...semanticSimilarities
    .filter(s => s.similarity > 0.8)
    .map(s => ({
      type: 'semantic-similarity',
      severity: s.similarity > 0.9 ? 'critical' : 'important',
      files: s.files,
      message: `High semantic similarity (${(s.similarity * 100).toFixed(1)}%): ${s.description}`,
      redundancyLevel: s.similarity,
    })));

  // 3. Функциональные перекрытия
  const functionalOverlaps = await findFunctionalOverlaps(group.files, config.levelNumber);
  report.functionalOverlaps = functionalOverlaps;
  violations.push(...functionalOverlaps.map(o => ({
    type: 'functional-overlap',
    severity: 'important',
    files: o.files,
    message: `Functional overlap detected: ${o.description}`,
    redundancyLevel: o.overlapPercentage,
  })));

  // 4. Структурные избыточности
  const structuralRedundancies = await findStructuralRedundancies(group.files);
  report.structuralRedунности = structuralRedунности;
  violations.push(...structuralRedундности.map(r => ({
    type: 'structural-redundancy',
    severity: 'recommended',
    files: r.files,
    message: `Structural redundancy: ${r.pattern}`,
    redundancyLevel: r.redundancyLevel,
  })));

  // 5. Возможности централизации
  const centralizationOpportunities = await findCentralizationOpportunities(
    group.files,
    config.levelNumber
  );
  report.centralizationOpportunities = centralizationOpportunities;
  violations.push(...centralizationOpportunities.map(c => ({
    type: 'centralization-opportunity',
    severity: 'important',
    files: c.files,
    message: `Centralization opportunity: ${c.description}`,
    redundancyLevel: c.potentialSavings,
    recommendation: c.suggestion,
  })));

  return { violations, report };
}

// Алгоритмы поиска избыточности по типам

async function findExactDuplicates(files: string[]): Promise<ExactDuplicate[]> {
  const duplicates: ExactDuplicate[] = [];
  const codeBlocks = new Map<string, string[]>(); // код -> файлы

  for (const file of files) {
    const content = await readFile(file);
    const blocks = extractCodeBlocks(content);

    for (const block of blocks) {
      const normalizedBlock = normalizeCode(block);
      if (normalizedBlock.length > 50) { // Минимальный размер для дубликата
        if (!codeBlocks.has(normalizedBlock)) {
          codeBlocks.set(normalizedBlock, []);
        }
        codeBlocks.get(normalizedBlock)!.push(file);
      }
    }
  }

  // Находим дубликаты
  for (const [code, filesList] of codeBlocks) {
    if (filesList.length > 1) {
      duplicates.push({
        codeFragment: code.substring(0, 100) + '...',
        files: filesList,
        linesCount: code.split('\n').length,
      });
    }
  }

  return duplicates;
}

async function findSemanticSimilarities(
  files: string[],
  level: number
): Promise<SemanticSimilarity[]> {
  const similarities: SemanticSimilarity[] = [];
  const analyzers = LEVEL_SEMANTIC_ANALYZERS[level];

  for (let i = 0; i < files.length; i++) {
    for (let j = i + 1; j < files.length; j++) {
      const file1 = files[i];
      const file2 = files[j];

      for (const analyzer of analyzers) {
        const similarity = await analyzer.compare(file1, file2);
        if (similarity.score > 0.7) { // Порог семантической схожести
          similarities.push({
            files: [file1, file2],
            similarity: similarity.score,
            description: similarity.description,
            analyzer: analyzer.name,
            elements: similarity.matchingElements,
          });
        }
      }
    }
  }

  return similarities;
}

async function findFunctionalOverlaps(
  files: string[],
  level: number
): Promise<FunctionalOverlap[]> {
  const overlaps: FunctionalOverlap[] = [];

  // Специфичные для уровня анализаторы функционального перекрытия
  const analyzers = LEVEL_FUNCTIONAL_ANALYZERS[level];

  for (const analyzer of analyzers) {
    const foundOverlaps = await analyzer.findOverlaps(files);
    overlaps.push(...foundOverlaps);
  }

  return overlaps;
}

// Специализированные анализаторы для каждого уровня
const LEVEL_SEMANTIC_ANALYZERS = {
  1: [ // Константы и типы
    new ConstantSemanticAnalyzer(),
    new TypeStructureAnalyzer(),
    new EnumValueAnalyzer(),
  ],
  2: [ // Утилиты
    new FunctionSignatureAnalyzer(),
    new BusinessLogicAnalyzer(),
    new ValidationLogicAnalyzer(),
  ],
  3: [ // API
    new ProcedureAnalyzer(),
    new MiddlewareAnalyzer(),
    new SchemaAnalyzer(),
  ],
  4: [ // Хуки и состояние
    new StoreStructureAnalyzer(),
    new HookLogicAnalyzer(),
    new SelectorAnalyzer(),
  ],
  5: [ // Компоненты
    new ComponentStructureAnalyzer(),
    new PropsAnalyzer(),
    new UILogicAnalyzer(),
  ],
  6: [ // Конфигурация
    new ConfigStructureAnalyzer(),
    new ScriptAnalyzer(),
    new DependencyAnalyzer(),
  ],
};

const LEVEL_FUNCTIONAL_ANALYZERS = {
  1: [
    new ConstantFunctionalAnalyzer(), // Ищет константы с одинаковыми значениями
    new TypeFunctionalAnalyzer(),     // Ищет типы с одинаковой структурой
  ],
  2: [
    new UtilityFunctionalAnalyzer(),  // Ищет функции, решающие одну задачу
    new ValidationFunctionalAnalyzer(), // Ищет одинаковые валидации
  ],
  3: [
    new APIFunctionalAnalyzer(),      // Ищет процедуры с одинаковой логикой
    new MiddlewareFunctionalAnalyzer(), // Ищет дублирующиеся middleware
  ],
  4: [
    new StateFunctionalAnalyzer(),    // Ищет store с похожей логикой
    new HookFunctionalAnalyzer(),     // Ищет хуки с одинаковой функциональностью
  ],
  5: [
    new ComponentFunctionalAnalyzer(), // Ищет компоненты с одинаковым поведением
    new UIFunctionalAnalyzer(),       // Ищет дублирующуюся UI логику
  ],
  6: [
    new ConfigFunctionalAnalyzer(),   // Ищет одинаковые конфигурации
  ],
};
````

### Фаза 4.5: 🧠 ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ НАЙДЕННЫХ ДУБЛИКАТОВ

**ПРОБЛЕМА:** Система находит технические дубликаты, но не анализирует их с точки зрения архитектурной целесообразности.

**РЕШЕНИЕ:** Обязательная фаза качественной оценки каждого найденного дубликата.

```typescript
interface DuplicateAnalysisResult {
  duplicate: DetectedDuplicate;
  classification: DuplicateClassification;
  actionRecommendation: ActionRecommendation;
  costBenefitAnalysis: CostBenefitAnalysis;
  engineeringRisk: OverEngineeringRisk;
}

enum DuplicateClassification {
  // ДЕЙСТВИЕ ТРЕБУЕТСЯ - вредная избыточность
  HARMFUL_REDUNDANCY = 'harmful_redundancy', // Дублирование утилит, функций, логики
  ARCHITECTURAL_VIOLATION = 'architectural_violation', // Нарушение принципов архитектуры
  MAINTENANCE_BURDEN = 'maintenance_burden', // Усложнение поддержки

  // ДЕЙСТВИЕ НЕ ТРЕБУЕТСЯ - естественные паттерны
  NATURAL_PATTERN = 'natural_pattern', // Естественные повторения в архитектуре
  COMPONENT_STRUCTURE = 'component_structure', // Структурные паттерны компонентов
  DOMAIN_SEPARATION = 'domain_separation', // Разделение по доменам
  ABSTRACTION_APPROPRIATE = 'abstraction_appropriate', // Подходящий уровень абстракции

  // ТРЕБУЕТ ЭКСПЕРТИЗЫ - неоднозначные случаи
  EXPERT_DECISION_REQUIRED = 'expert_decision_required',
}

enum ActionRecommendation {
  CENTRALIZE_IMMEDIATELY = 'centralize_immediately', // Срочно централизовать
  REFACTOR_PLANNED = 'refactor_planned', // Запланировать рефакторинг
  MONITOR_GROWTH = 'monitor_growth', // Отслеживать рост дубликатов
  ACCEPT_AS_PATTERN = 'accept_as_pattern', // Принять как архитектурный паттерн
  NO_ACTION_REQUIRED = 'no_action_required', // Никаких действий не нужно
  EXPERT_CONSULTATION = 'expert_consultation', // Требуется экспертное мнение
}

async function intelligentDuplicateAnalysis(
  detectedDuplicates: DetectedDuplicate[],
  context: ArchitecturalContext
): Promise<DuplicateAnalysisResult[]> {
  const results: DuplicateAnalysisResult[] = [];

  for (const duplicate of detectedDuplicates) {
    const analysis = await analyzeDuplicateInContext(duplicate, context);
    results.push(analysis);
  }

  return results;
}

async function analyzeDuplicateInContext(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<DuplicateAnalysisResult> {
  // 1. КЛАССИФИКАЦИЯ: определяем тип дубликата
  const classification = await classifyDuplicate(duplicate, context);

  // 2. COST/BENEFIT АНАЛИЗ: стоимость рефакторинга vs польза
  const costBenefit = await analyzeCostBenefit(duplicate, classification, context);

  // 3. РИСК OVER-ENGINEERING: может ли рефакторинг навредить
  const engineeringRisk = await assessOverEngineeringRisk(duplicate, costBenefit, context);

  // 4. ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ: что делать с дубликатом
  const recommendation = await generateActionRecommendation(
    classification,
    costBenefit,
    engineeringRisk
  );

  return {
    duplicate,
    classification,
    actionRecommendation: recommendation,
    costBenefitAnalysis: costBenefit,
    engineeringRisk,
  };
}

async function classifyDuplicate(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<DuplicateClassification> {
  // ВРЕДНАЯ ИЗБЫТОЧНОСТЬ - требует действий
  if (await isHarmfulRedundancy(duplicate, context)) {
    return DuplicateClassification.HARMFUL_REDUNDANCY;
  }

  if (await violatesArchitecture(duplicate, context)) {
    return DuplicateClassification.ARCHITECTURAL_VIOLATION;
  }

  if (await createMaintenanceBurden(duplicate, context)) {
    return DuplicateClassification.MAINTENANCE_BURDEN;
  }

  // ЕСТЕСТВЕННЫЕ ПАТТЕРНЫ - действий не требуют
  if (await isNaturalPattern(duplicate, context)) {
    return DuplicateClassification.NATURAL_PATTERN;
  }

  if (await isComponentStructure(duplicate, context)) {
    return DuplicateClassification.COMPONENT_STRUCTURE;
  }

  if (await isDomainSeparation(duplicate, context)) {
    return DuplicateClassification.DOMAIN_SEPARATION;
  }

  if (await isAppropriateAbstraction(duplicate, context)) {
    return DuplicateClassification.ABSTRACTION_APPROPRIATE;
  }

  // НЕОДНОЗНАЧНЫЕ СЛУЧАИ - требуют экспертизы
  return DuplicateClassification.EXPERT_DECISION_REQUIRED;
}

// КРИТИЧЕСКИЕ ДЕТЕКТОРЫ: определяют вредную избыточность

async function isHarmfulRedundancy(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<boolean> {
  // Дублирующиеся utility функции
  if (await isDuplicateUtility(duplicate)) return true;

  // Одинаковые бизнес-логические функции
  if (await isDuplicateBusinessLogic(duplicate)) return true;

  // Повторяющиеся валидации
  if (await isDuplicateValidation(duplicate)) return true;

  // Одинаковые API handlers
  if (await isDuplicateAPIHandler(duplicate)) return true;

  // Дублирующиеся constants с одинаковыми значениями
  if (await isDuplicateConstants(duplicate)) return true;

  return false;
}

async function violatesArchitecture(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<boolean> {
  // Нарушение Single Responsibility Principle
  if (await violatesSRP(duplicate, context)) return true;

  // Нарушение DRY principle в критических местах
  if (await violatesDRYCritically(duplicate, context)) return true;

  // Создание циклических зависимостей
  if (await createsCyclicDependencies(duplicate, context)) return true;

  // Нарушение уровневой архитектуры
  if (await violatesLayeredArchitecture(duplicate, context)) return true;

  return false;
}

// ПАТТЕРН ДЕТЕКТОРЫ: определяют естественные паттерны

async function isNaturalPattern(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<boolean> {
  // React компонентные паттерны
  if (await isReactComponentPattern(duplicate)) return true;

  // Стандартные архитектурные паттерны (MVC, Repository, etc.)
  if (await isStandardArchitecturalPattern(duplicate)) return true;

  // Естественные повторения в UI (FormField, Button patterns)
  if (await isUIPattern(duplicate)) return true;

  // Стандартные паттерны форм
  if (await isFormPattern(duplicate)) return true;

  return false;
}

async function isComponentStructure(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<boolean> {
  // Структура React компонентов
  if (duplicate.type === 'structural' && (await isReactComponentStructure(duplicate))) {
    return true;
  }

  // Стандартные паттерны props/state
  if (await isPropsStatePattern(duplicate)) return true;

  // Стандартные lifecycle методы
  if (await isLifecyclePattern(duplicate)) return true;

  return false;
}

async function isDomainSeparation(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<boolean> {
  // Разные бизнес-домены решают похожие задачи по-разному
  if (await isDifferentDomainsSimilarLogic(duplicate, context)) return true;

  // Специфичная логика для разных контекстов
  if (await isContextSpecificLogic(duplicate, context)) return true;

  return false;
}

// COST/BENEFIT АНАЛИЗ

interface CostBenefitAnalysis {
  refactoringCost: RefactoringCost;
  expectedBenefit: RefactoringBenefit;
  riskLevel: RiskLevel;
  netValue: 'positive' | 'negative' | 'neutral';
  recommendation: string;
}

async function analyzeCostBenefit(
  duplicate: DetectedDuplicate,
  classification: DuplicateClassification,
  context: ArchitecturalContext
): Promise<CostBenefitAnalysis> {
  const cost = await calculateRefactoringCost(duplicate, context);
  const benefit = await calculateExpectedBenefit(duplicate, classification, context);
  const risk = await assessOverEngineeringRisk(duplicate, costBenefit, context);

  const netValue = determineNetValue(cost, benefit, risk);

  return {
    refactoringCost: cost,
    expectedBenefit: benefit,
    riskLevel: risk,
    netValue,
    recommendation: generateCostBenefitRecommendation(cost, benefit, risk, netValue),
  };
}

async function calculateRefactoringCost(
  duplicate: DetectedDuplicate,
  context: ArchitecturalContext
): Promise<RefactoringCost> {
  return {
    timeEstimate: await estimateTimeRequired(duplicate),
    complexityLevel: await assessRefactoringComplexity(duplicate),
    breakingChangesRisk: await assessBreakingChangesRisk(duplicate, context),
    testingRequired: await estimateTestingEffort(duplicate),
    documentationUpdates: await estimateDocumentationWork(duplicate),
  };
}

async function calculateExpectedBenefit(
  duplicate: DetectedDuplicate,
  classification: DuplicateClassification,
  context: ArchitecturalContext
): Promise<RefactoringBenefit> {
  return {
    maintenanceImprovement: await assessMaintenanceImprovement(duplicate, classification),
    codeQualityImprovement: await assessQualityImprovement(duplicate, classification),
    performanceGain: await assessPerformanceGain(duplicate),
    futureFlexibility: await assessFlexibilityGain(duplicate, context),
    teamProductivity: await assessProductivityGain(duplicate, classification),
  };
}

// РИСК OVER-ENGINEERING

interface OverEngineeringRisk {
  abstractionComplexity: 'low' | 'medium' | 'high';
  maintainabilityImpact: 'positive' | 'neutral' | 'negative';
  readabilityImpact: 'positive' | 'neutral' | 'negative';
  teamAdoptionDifficulty: 'easy' | 'medium' | 'difficult';
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  warnings: string[];
}

async function assessOverEngineeringRisk(
  duplicate: DetectedDuplicate,
  costBenefit: CostBenefitAnalysis,
  context: ArchitecturalContext
): Promise<OverEngineeringRisk> {
  const abstractionComplexity = await assessAbstractionComplexity(duplicate);
  const maintainabilityImpact = await assessMaintainabilityImpact(duplicate, costBenefit);
  const readabilityImpact = await assessReadabilityImpact(duplicate);
  const adoptionDifficulty = await assessTeamAdoptionDifficulty(duplicate, context);

  const overallRisk = calculateOverallRisk(
    abstractionComplexity,
    maintainabilityImpact,
    readabilityImpact,
    adoptionDifficulty
  );

  const warnings = generateOverEngineeringWarnings(
    duplicate,
    abstractionComplexity,
    maintainabilityImpact,
    readabilityImpact,
    adoptionDifficulty
  );

  return {
    abstractionComplexity,
    maintainabilityImpact,
    readabilityImpact,
    teamAdoptionDifficulty: adoptionDifficulty,
    overallRisk,
    warnings,
  };
}

function generateOverEngineeringWarnings(
  duplicate: DetectedDuplicate,
  abstractionComplexity: string,
  maintainabilityImpact: string,
  readabilityImpact: string,
  adoptionDifficulty: string
): string[] {
  const warnings: string[] = [];

  if (abstractionComplexity === 'high') {
    warnings.push('⚠️ Высокая сложность абстракции может затруднить понимание кода');
  }

  if (maintainabilityImpact === 'negative') {
    warnings.push('⚠️ Рефакторинг может ухудшить поддерживаемость кода');
  }

  if (readabilityImpact === 'negative') {
    warnings.push('⚠️ Абстракция может снизить читаемость кода');
  }

  if (adoptionDifficulty === 'difficult') {
    warnings.push('⚠️ Команде будет сложно адаптироваться к новой абстракции');
  }

  if (duplicate.similarity < 0.7) {
    warnings.push('⚠️ Низкое сходство - возможно это не настоящий дубликат');
  }

  return warnings;
}

// ГЕНЕРАЦИЯ ФИНАЛЬНЫХ РЕКОМЕНДАЦИЙ

async function generateActionRecommendation(
  classification: DuplicateClassification,
  costBenefit: CostBenefitAnalysis,
  engineeringRisk: OverEngineeringRisk
): Promise<ActionRecommendation> {
  // ВРЕДНАЯ ИЗБЫТОЧНОСТЬ - действие обязательно
  if (classification === DuplicateClassification.HARMFUL_REDUNDANCY) {
    if (engineeringRisk.overallRisk === 'low' && costBenefit.netValue === 'positive') {
      return ActionRecommendation.CENTRALIZE_IMMEDIATELY;
    } else {
      return ActionRecommendation.REFACTOR_PLANNED;
    }
  }

  if (classification === DuplicateClassification.ARCHITECTURAL_VIOLATION) {
    return ActionRecommendation.CENTRALIZE_IMMEDIATELY; // Архитектурные нарушения критичны
  }

  if (classification === DuplicateClassification.MAINTENANCE_BURDEN) {
    if (costBenefit.netValue === 'positive') {
      return ActionRecommendation.REFACTOR_PLANNED;
    } else {
      return ActionRecommendation.MONITOR_GROWTH;
    }
  }

  // ЕСТЕСТВЕННЫЕ ПАТТЕРНЫ - действий не требуют
  if (
    classification === DuplicateClassification.NATURAL_PATTERN ||
    classification === DuplicateClassification.COMPONENT_STRUCTURE ||
    classification === DuplicateClassification.DOMAIN_SEPARATION ||
    classification === DuplicateClassification.ABSTRACTION_APPROPRIATE
  ) {
    return ActionRecommendation.ACCEPT_AS_PATTERN;
  }

  // НЕОДНОЗНАЧНЫЕ СЛУЧАИ
  if (classification === DuplicateClassification.EXPERT_DECISION_REQUIRED) {
    return ActionRecommendation.EXPERT_CONSULTATION;
  }

  // ВЫСОКИЙ РИСК OVER-ENGINEERING
  if (engineeringRisk.overallRisk === 'high' || engineeringRisk.overallRisk === 'critical') {
    return ActionRecommendation.NO_ACTION_REQUIRED;
  }

  // DEFAULT: требуется экспертное решение
  return ActionRecommendation.EXPERT_CONSULTATION;
}
```

---

## 📚 ПРАКТИЧЕСКИЕ ПРИМЕРЫ КЛАССИФИКАЦИИ ДУБЛИКАТОВ

### ❌ ВРЕДНАЯ ИЗБЫТОЧНОСТЬ - требует действий

**ПРИМЕР: Дублирующиеся utility функции**

```typescript
// ЦЕНТРАЛИЗОВАТЬ НЕМЕДЛЕННО
// File 1: formatCurrency() и File 2: formatMoney() - одинаковая логика
// КЛАССИФИКАЦИЯ: HARMFUL_REDUNDANCY → CENTRALIZE_IMMEDIATELY
```

**ПРИМЕР: Дублирующиеся валидации**

```typescript
// ЦЕНТРАЛИЗОВАТЬ НЕМЕДЛЕННО
// validateEmail() в LoginForm и isValidEmail() в RegisterForm
// КЛАССИФИКАЦИЯ: HARMFUL_REDUNDANCY → CENTRALIZE_IMMEDIATELY
```

### ✅ ЕСТЕСТВЕННЫЕ ПАТТЕРНЫ - оставить как есть

**ПРИМЕР: React компонентная структура**

```typescript
// ПРИНЯТЬ КАК ПАТТЕРН
// LoginForm и RegisterForm имеют похожую структуру, но разную логику
// КЛАССИФИКАЦИЯ: NATURAL_PATTERN → ACCEPT_AS_PATTERN
// ОБОСНОВАНИЕ: Стандартная React форма, централизация навредит читаемости
```

**ПРИМЕР: Доменное разделение**

```typescript
// ПРИНЯТЬ КАК ПАТТЕРН
// validateAuthToken() и validateAPIToken() - разные домены, разные секреты
// КЛАССИФИКАЦИЯ: DOMAIN_SEPARATION → ACCEPT_AS_PATTERN
```

### 🔍 АЛГОРИТМ БЫСТРОЙ КЛАССИФИКАЦИИ

```typescript
const CLASSIFICATION_RULES = {
  CENTRALIZE_IMMEDIATELY: [
    'Одинаковые функции с разными именами',
    'Идентичные utility функции',
    'Дублирующиеся валидации',
  ],

  ACCEPT_AS_PATTERN: [
    'React компонентная структура',
    'Стандартные архитектурные паттерны',
    'Повторяющиеся паттерны форм',
    'CRUD operations в разных доменах',
  ],

  EXPERT_CONSULTATION: ['Похожие, но не идентичные функции', 'Возможные кандидаты на abstraction'],
};
```

### 🚨 ПРИЗНАКИ OVER-ENGINEERING

**КРАСНЫЕ ФЛАГИ:**

- Централизация приведет к сложной конфигурации
- Абстракция скрывает важные детали реализации
- Похожесть кода < 80%
- Создание abstraction ради abstraction

**ЗОЛОТОЕ ПРАВИЛО:** Лучше оставить естественный паттерн, чем создать вредную абстракцию.

---

## 🚨 ОБЯЗАТЕЛЬНОЕ ПРАВИЛО: ИНТЕЛЛЕКТУАЛЬНЫЙ АНАЛИЗ РЕЗУЛЬТАТОВ

### Критическое требование к использованию системы аудита

**ПРОБЛЕМА:** Механическое применение результатов аудита без анализа приводит к over-engineering и ухудшению архитектуры.

**РЕШЕНИЕ:** ОБЯЗАТЕЛЬНАЯ фаза интеллектуального анализа каждого найденного дубликата.

### 🔒 Обязательный workflow

```typescript
// ЗАПРЕЩЕНО: Механическое применение результатов
const auditResults = await runAudit();
// ❌ Сразу рефакторить все найденные дубликаты - НЕПРАВИЛЬНО!

// ОБЯЗАТЕЛЬНО: Интеллектуальный анализ
const auditResults = await runAudit();
const intelligentAnalysis = await intelligentDuplicateAnalysis(auditResults.duplicates, context);

// Фильтруем только actionable дубликаты
const actionableViolations = intelligentAnalysis.filter(
  analysis =>
    analysis.actionRecommendation === ActionRecommendation.CENTRALIZE_IMMEDIATELY ||
    analysis.actionRecommendation === ActionRecommendation.REFACTOR_PLANNED
);

// Выделяем принятые паттерны
const acceptedPatterns = intelligentAnalysis.filter(
  analysis => analysis.actionRecommendation === ActionRecommendation.ACCEPT_AS_PATTERN
);
```

### 🎯 Обязательные проверки перед действием

Перед рефакторингом любого найденного дубликата ОБЯЗАТЕЛЬНО ответить:

1. **Это вредная избыточность или естественный паттерн?**
2. **Улучшит ли централизация архитектуру или ухудшит?**
3. **Не приведет ли рефакторинг к over-engineering?**
4. **Сохранится ли читаемость и понятность кода?**
5. **Стоит ли cost/benefit рефакторинга?**

### ⚠️ Предупреждения о неправильном использовании

**НЕПРАВИЛЬНО:**

- Механически централизовать все найденные дубликаты
- Считать любое повторение избыточностью
- Игнорировать архитектурный контекст
- Применять рефакторинг без cost/benefit анализа

**ПРАВИЛЬНО:**

- Анализировать каждый дубликат в контексте архитектуры
- Различать вредную избыточность от естественных паттернов
- Применять принцип "лучше оставить естественный паттерн, чем создать вредную абстракцию"
- Учитывать impact на читаемость и поддерживаемость

### 🔑 Ключевые принципы

1. **Аудит находит технические дубликаты, а не архитектурные проблемы**
2. **Не все дубликаты требуют устранения**
3. **Естественные паттерны не являются проблемой**
4. **Over-engineering хуже дублирования**
5. **Читаемость важнее абстракции**

---

**ИТОГ:** Данная система аудита является инструментом ОБНАРУЖЕНИЯ потенциальных проблем, а не источником прямых указаний к действию. Каждый результат требует интеллектуального анализа с учетом архитектурного контекста и best practices.
