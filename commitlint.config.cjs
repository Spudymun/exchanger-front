module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // новая функциональность
        'fix', // исправление ошибки
        'docs', // изменения в документации
        'style', // форматирование, отсутствующие точки с запятой и т.д.
        'refactor', // рефакторинг кода
        'perf', // улучшение производительности
        'test', // добавление тестов
        'chore', // изменения в сборке или вспомогательных инструментах
        'ci', // изменения в CI
        'build', // изменения сборки
        'revert', // откат коммита
      ],
    ],
    'subject-case': [2, 'never', ['start-case', 'pascal-case', 'upper-case']],
    'subject-max-length': [2, 'always', 100],
    'body-max-line-length': [2, 'always', 100],
  },
};
