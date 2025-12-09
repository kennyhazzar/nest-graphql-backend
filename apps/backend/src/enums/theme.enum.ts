import { registerEnumType } from '@nestjs/graphql';

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  SYSTEM = 'system',
}

registerEnumType(Theme, {
  name: 'Theme',
  description: 'User interface theme',
  valuesMap: {
    LIGHT: { description: 'Light theme' },
    DARK: { description: 'Dark theme' },
    AUTO: { description: 'Auto theme' },
    SYSTEM: { description: 'System theme' },
  },
});
