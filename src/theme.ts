import { reactive } from '@thi.ng/rstream';

// 1 - ?theme= wins for the current page load, but is never persisted
// 2 - ...otherwise the stored preference, if the user has ever cycled the theme
// 3 - ...otherwise 'system'

export type Theme = 'system' | 'dark' | 'light';

// what actually gets painted ('system' resolves to one of these)
export type ResolvedTheme = 'dark' | 'light';

export const themeKey = 'theme';

const cycleOrder: Theme[] = ['system', 'dark', 'light'];

export const isTheme = (x: unknown): x is Theme =>
  typeof x === 'string' && cycleOrder.includes(x as Theme);

// system -> dark -> light -> system ...
export const nextTheme = (theme: Theme): Theme =>
  cycleOrder[(cycleOrder.indexOf(theme) + 1) % cycleOrder.length];

// an unrecognized ?theme=whatever is ignored rather than treated as an override
export const themeFromSearch = (search: string): Theme | null => {
  const value = new URLSearchParams(search).get(themeKey);
  return isTheme(value) ? value : null;
};

export const initialTheme = (search: string, stored: string | null): Theme =>
  themeFromSearch(search) ?? (isTheme(stored) ? stored : 'system');

export const searchWithoutTheme = (search: string): string => {
  const params = new URLSearchParams(search);
  params.delete(themeKey);
  const rest = params.toString();
  return rest ? `?${rest}` : '';
};

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

export const resolveTheme = (theme: Theme): ResolvedTheme =>
  theme === 'system' ? (darkQuery().matches ? 'dark' : 'light') : theme;

const readStored = (): string | null => {
  try {
    return localStorage.getItem(themeKey);
  } catch {
    return null;
  }
};

const writeStored = (theme: Theme) => {
  try {
    localStorage.setItem(themeKey, theme);
  } catch {
    // ignore (theme will still apply)
  }
};

export const createTheme = () => {
  let current = initialTheme(window.location.search, readStored());
  const theme = reactive(current);

  const paint = () => {
    document.documentElement.dataset.theme = resolveTheme(current);
  };
  paint();

  const cycleTheme = () => {
    current = nextTheme(current);
    writeStored(current);
    const { pathname, search, hash } = window.location;
    window.history.replaceState(
      null,
      '',
      `${pathname}${searchWithoutTheme(search)}${hash}`,
    );
    paint();
    theme.next(current);
  };

  darkQuery().addEventListener('change', () => {
    if (current === 'system') paint();
  });

  return { theme, cycleTheme };
};
