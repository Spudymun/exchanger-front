import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';

import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  // ✅ MODULAR LOADING: Load domain-specific translation files
  const [
    homePage,
    layout,
    advancedExchange,
    serverErrors,
    notifications,
    exchangeTrading,
    commonUi,
    dashboardNav,
  ] = await Promise.all([
    import(`../../messages/${locale}/home-page.json`),
    import(`../../messages/${locale}/layout.json`),
    import(`../../messages/${locale}/advanced-exchange.json`),
    import(`../../messages/${locale}/server-errors.json`),
    import(`../../messages/${locale}/notifications.json`),
    import(`../../messages/${locale}/exchange-trading.json`),
    import(`../../messages/${locale}/common-ui.json`),
    import(`../../messages/${locale}/dashboard-nav.json`),
  ]);

  return {
    locale,
    messages: {
      // ✅ PRESERVE TOP-LEVEL NAMESPACES: Critical for component compatibility
      HomePage: homePage.default.HomePage,
      Layout: layout.default.Layout,
      AdvancedExchangeForm: advancedExchange.default.AdvancedExchangeForm,
      server: serverErrors.default.server,
      notifications: notifications.default.notifications,
      exchange: exchangeTrading.default.exchange,
      trading: exchangeTrading.default.trading,
      portfolio: exchangeTrading.default.portfolio,
      common: commonUi.default.common,
      theme: commonUi.default.theme,
      NotFound: commonUi.default.NotFound,
      Error: commonUi.default.Error,
      dashboard: dashboardNav.default.dashboard,
      navigation: dashboardNav.default.navigation,
    },
  };
});
