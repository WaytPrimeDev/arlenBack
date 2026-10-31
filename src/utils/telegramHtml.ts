/**
 * Подготовка текста поста к отправке в Telegram с parse_mode: "HTML".
 *
 * Текст приходит с клиента уже собранным шаблоном — в нём есть разметка
 * (<b>, <a href="...">), а между тегами лежит то, что ввёл человек: имя,
 * описание, цена. В описании спокойно встречаются "&" или "<", и для Telegram
 * это битый HTML — пост просто не уйдёт. Поэтому разбираем строку сами:
 * разрешённые теги пропускаем как есть, всё остальное экранируем.
 */

// Telegram понимает только этот набор тегов, остальные считает ошибкой
const ALLOWED_TAGS = new Set([
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ins",
  "s",
  "strike",
  "del",
  "a",
  "code",
  "pre",
  "blockquote",
  "tg-spoiler",
]);

// Открывающий или закрывающий тег: </?имя атрибуты>
const TAG_RE = /<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:\s[^<>]*)?)>/g;

const escapeText = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/**
 * У <a> оставляем только href: остальные атрибуты Telegram не примет.
 * Ссылку пропускаем лишь http/https/tg — иначе тег выкидываем целиком.
 */
const buildAnchor = (rawAttrs: string): string | null => {
  const href = rawAttrs.match(/\bhref\s*=\s*("([^"]*)"|'([^']*)')/i);
  const url = href?.[2] ?? href?.[3];

  if (!url || !/^(https?:\/\/|tg:\/\/)/i.test(url.trim())) return null;

  return `<a href="${escapeText(url.trim())}">`;
};

/**
 * Оставляет разрешённые Telegram теги и экранирует весь остальной текст.
 * Неподдерживаемый тег не роняет пост: он просто исчезает, содержимое внутри
 * остаётся. Непарные теги Telegram тоже считает ошибкой, поэтому ведём стек:
 * закрывающий без своего открывающего выбрасываем, незакрытые дописываем в конец.
 */
export const sanitizeTelegramHtml = (input: string): string => {
  let result = "";
  let lastIndex = 0;
  const open: string[] = [];

  for (const match of input.matchAll(TAG_RE)) {
    const [raw, slash, name, attrs] = match;
    const index = match.index ?? 0;

    result += escapeText(input.slice(lastIndex, index));
    lastIndex = index + raw.length;

    const tag = name.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) continue;

    if (slash) {
      // Закрывающий тег имеет смысл, только если он закрывает последний открытый
      if (open[open.length - 1] !== tag) continue;

      open.pop();
      result += `</${tag}>`;
      continue;
    }

    if (tag === "a") {
      const anchor = buildAnchor(attrs);
      // Ссылку не распознали — тег выкидываем вместе с его закрывающим
      if (!anchor) continue;

      open.push(tag);
      result += anchor;
      continue;
    }

    open.push(tag);
    result += `<${tag}>`;
  }

  result += escapeText(input.slice(lastIndex));

  // То, что клиент забыл закрыть, закрываем сами — иначе Telegram не примет текст
  while (open.length) result += `</${open.pop()}>`;

  return result;
};

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

/**
 * Видимая длина текста: Telegram считает свой лимит по символам без разметки,
 * поэтому теги и сущности в подсчёт не идут.
 */
export const htmlVisibleLength = (html: string): number =>
  html
    .replace(TAG_RE, "")
    .replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, (entity) => ENTITIES[entity])
    .length;
