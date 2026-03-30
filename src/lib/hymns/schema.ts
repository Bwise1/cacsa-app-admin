/** Hymns bundle — schema v1 (matches Flutter `lib/models/hymn_bundle.dart`). */

export const HYMN_SCHEMA_VERSION = 1;

export const BOOK_IDS = {
  main: "cacsa_main",
  various: "cacsa_various",
} as const;

export const LOCALE_CODES = ["en", "yo"] as const;

export type HymnVerse = { label: string; lines: string[] };

export type HymnLocaleContent = {
  title: string;
  theme?: string | null;
  scripture?: string | null;
  meter?: string | null;
  tune?: string | null;
  verses: HymnVerse[];
  closingAmen?: boolean | null;
};

export type HymnEntry = {
  id: string;
  bookId: string;
  number: number;
  categoryIds: string[];
  sourcePage?: number | null;
  locales: Record<string, HymnLocaleContent>;
};

export type HymnCategoryDef = {
  id: string;
  sortOrder: number;
  labels: Record<string, string>;
};

export type HymnBookDef = {
  id: string;
  defaultLocale: string;
  title: Record<string, string>;
};

export type HymnBundle = {
  schemaVersion: number;
  contentRevision: number;
  updatedAt?: string | null;
  defaultLocale: string;
  supportedLocales: string[];
  categories: HymnCategoryDef[];
  books: HymnBookDef[];
  hymns: HymnEntry[];
};

export type HymnManifest = {
  schemaVersion: number;
  contentRevision: number;
  bundleUrl: string;
  bundleSha256?: string | null;
  minAppVersion?: string | null;
};

export function emptyBundle(): HymnBundle {
  return {
    schemaVersion: HYMN_SCHEMA_VERSION,
    contentRevision: 1,
    updatedAt: new Date().toISOString(),
    defaultLocale: "en",
    supportedLocales: ["en", "yo"],
    categories: [
      {
        id: "general",
        sortOrder: 0,
        labels: { en: "Hymns", yo: "Orin" },
      },
      {
        id: "oniruuru",
        sortOrder: 1,
        labels: { en: "Various", yo: "Oniruuru" },
      },
    ],
    books: [
      {
        id: BOOK_IDS.main,
        defaultLocale: "en",
        title: { en: "CACSA Hymnal", yo: "Iwe Orin CACSA" },
      },
      {
        id: BOOK_IDS.various,
        defaultLocale: "en",
        title: { en: "Various Hymns", yo: "Orin Oniruuru" },
      },
    ],
    hymns: [],
  };
}
