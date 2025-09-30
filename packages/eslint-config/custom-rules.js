/**
 * ESLint Custom Rules for Translation Link Markers
 * Проверяет корректность маркеров ссылок в JSON файлах переводов
 */

/**
 * Правило для проверки сбалансированности маркеров ссылок в JSON переводах
 */
const linkMarkersValidation = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Validate link markers balance in translation JSON files',
      category: 'Possible Errors',
      recommended: true,
    },
    fixable: null,
    schema: [],
    messages: {
      mismatchedMarkers:
        'Mismatched link markers: {{startCount}} start markers, {{endCount}} end markers for {{type}}',
      invalidMarkerFormat:
        'Invalid marker format: {{marker}}. Use standard format like [LINK_TYPE_START] and [LINK_TYPE_END]',
      emptyLinkText: 'Empty link text between markers: {{startMarker}} and {{endMarker}}',
    },
  },

  create(context) {
    // Определяем поддерживаемые маркеры (синхронизированы с link-parsing.ts)
    const SUPPORTED_MARKERS = {
      RULES: { start: '[LINK_RULES_START]', end: '[LINK_RULES_END]' },
      AML: { start: '[LINK_AML_START]', end: '[LINK_AML_END]' },
      PRIVACY: { start: '[LINK_PRIVACY_START]', end: '[LINK_PRIVACY_END]' },
      RETURNS: { start: '[LINK_RETURNS_START]', end: '[LINK_RETURNS_END]' },
    };

    function checkEmptyLinkText(text, start, end, node) {
      const errors = [];
      // eslint-disable-next-line security/detect-non-literal-regexp
      const pattern = new RegExp(`${escapeRegex(start)}(.*?)${escapeRegex(end)}`, 'g');
      let match;

      while ((match = pattern.exec(text)) !== null) {
        const linkText = match[1].trim();
        if (!linkText) {
          errors.push({
            messageId: 'emptyLinkText',
            data: { startMarker: start, endMarker: end },
            node,
          });
        }
      }

      return errors;
    }

    function validateLinkMarkers(text, node) {
      const errors = [];

      // Проверяем каждый тип маркеров
      for (const [type, { start, end }] of Object.entries(SUPPORTED_MARKERS)) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        const startCount = (text.match(new RegExp(escapeRegex(start), 'g')) || []).length;
        // eslint-disable-next-line security/detect-non-literal-regexp
        const endCount = (text.match(new RegExp(escapeRegex(end), 'g')) || []).length;

        if (startCount !== endCount) {
          errors.push({
            messageId: 'mismatchedMarkers',
            data: { type, startCount, endCount },
            node,
          });
        }

        // Проверяем, что между маркерами есть текст
        if (startCount > 0) {
          errors.push(...checkEmptyLinkText(text, start, end, node));
        }
      }

      return errors;
    }

    function escapeRegex(str) {
      return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    return {
      Property(node) {
        // Проверяем только строковые значения в JSON
        if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
          const text = node.value.value;

          // Проверяем наличие любых маркеров
          const hasMarkers = Object.values(SUPPORTED_MARKERS).some(
            ({ start, end }) => text.includes(start) || text.includes(end)
          );

          if (!hasMarkers) return;

          const errors = validateLinkMarkers(text, node.value);
          for (const error of errors) {
            context.report(error);
          }
        }
      },
    };
  },
};

/**
 * Правило для проверки формата маркеров ссылок
 */
const linkMarkersFormat = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Enforce standard format for link markers in translations',
      category: 'Stylistic Issues',
      recommended: true,
    },
    fixable: 'code',
    schema: [],
    messages: {
      nonStandardMarker:
        'Non-standard link marker format: {{marker}}. Use [LINK_TYPE_START] and [LINK_TYPE_END] format',
      deprecatedMarker: 'Deprecated marker format: {{marker}}. Use new standard format',
    },
  },

  create(context) {
    const STANDARD_PATTERN = /^\[LINK_[A-Z_]+_(START|END)\]$/;
    const LINK_MARKER_PATTERN = /\[LINK_[^\]]*\]/g;

    function processMarker(marker, text, node, context) {
      // Простое автоисправление для некоторых распространенных случаев
      let fixedMarker = marker;

      // Исправляем распространенные ошибки
      if (marker.includes('_begin') || marker.includes('_BEGIN')) {
        fixedMarker = marker.replace(/_(begin|BEGIN)/g, '_START');
      }
      if (marker.includes('_finish') || marker.includes('_FINISH')) {
        fixedMarker = marker.replace(/_(finish|FINISH)/g, '_END');
      }

      const fix =
        fixedMarker !== marker
          ? fixer => fixer.replaceText(node, `"${text.replace(marker, fixedMarker)}"`)
          : null;

      context.report({
        messageId: 'nonStandardMarker',
        data: { marker },
        node,
        fix,
      });
    }

    function processMarkers(text, node, context) {
      let match;

      while ((match = LINK_MARKER_PATTERN.exec(text)) !== null) {
        const marker = match[0];

        if (!STANDARD_PATTERN.test(marker)) {
          processMarker(marker, text, node, context);
        }
      }
    }

    return {
      Property(node) {
        if (node.value && node.value.type === 'Literal' && typeof node.value.value === 'string') {
          processMarkers(node.value.value, node.value, context);
        }
      },
    };
  },
};

module.exports = {
  'link-markers-validation': linkMarkersValidation,
  'link-markers-format': linkMarkersFormat,
};
