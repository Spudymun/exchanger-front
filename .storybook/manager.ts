import { addons } from 'storybook/internal/manager-api';
import { themes } from 'storybook/internal/theming';

addons.setConfig({
  theme: themes.light,
  panelPosition: 'bottom',
  sidebar: {
    showRoots: false,
    collapsedRoots: ['design-tokens'],
  },
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
  },
});
