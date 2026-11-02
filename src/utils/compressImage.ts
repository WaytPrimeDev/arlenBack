import sharp from "sharp";
import createHttpError from "http-errors";

// Длинная сторона итогового фото и качество WebP.
// 2560px покрывает полноэкранный просмотр на retina-экранах, q92 убирает
// размывание шерсти и усов, которое давал q80 на мелких деталях.
export const MAX_DIMENSION = 2560;
export const WEBP_QUALITY = 92;

// Инстанс App Engine F1 — 256 МБ и одно ядро (app.yaml), а за один запрос
// приходит до MAX_IMAGES фото. Поэтому: libvips не поднимает пул потоков
// и не держит кэш декодированных картинок (каждый файл обрабатывается
// ровно один раз, кэш всё равно бесполезен).
sharp.concurrency(1);
sharp.cache(false);

// Одновременно сжимаем не больше двух фото. uploadImages вызывает нас на все
// файлы сразу через Promise.allSettled; без этой очереди десять параллельных
// декодов выбивают инстанс по памяти.
const MAX_PARALLEL = 2;
let active = 0;
const waiting: Array<() => void> = [];

const acquire = (): Promise<void> =>
  new Promise((resolve) => {
    if (active < MAX_PARALLEL) {
      active += 1;
      resolve();
      return;
    }
    waiting.push(() => {
      active += 1;
      resolve();
    });
  });

const release = () => {
  active -= 1;
  waiting.shift()?.();
};

/**
 * Сжимает изображение и конвертирует его в WebP локально, до загрузки
 * в Cloudinary: в хранилище попадает уже готовый файл, а не исходник на 10 МБ.
 *
 * - { animated: true } обязателен: .gif разрешён фильтром multer, без этого
 *   флага от анимации останется только первый кадр;
 * - .rotate() идёт до resize и применяет EXIF-ориентацию — при конвертации
 *   EXIF-блок не переносится, и без него фото с телефона лежат набок;
 * - withoutEnlargement не даёт растянуть фото, которое меньше лимита.
 */
export const compressToWebp = async (
  filePath: string,
  originalName?: string,
): Promise<Buffer> => {
  await acquire();

  try {
    return await sharp(filePath, { animated: true })
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
        // Lanczos3 держит резкость при уменьшении лучше, чем дефолтный lanczos2
        kernel: "lanczos3",
      })
      .webp({
        quality: WEBP_QUALITY,
        // Без этого WebP прореживает цветность 4:2:0 и съедает мелкие
        // цветные детали (глаза, узор на шерсти)
        smartSubsample: true,
        // effort 5 вместо дефолтных 4: тот же вес при чуть лучшей картинке,
        // дальше рост цены по CPU на F1 уже не оправдан
        effort: 5,
      })
      .toBuffer();
  } catch (error) {
    // fileFilter проверяет только заголовок mime и расширение, без magic-byte,
    // так что сюда доходят и подделанные файлы — это ошибка клиента, не 500.
    console.error(`Image processing failed for ${filePath}:`, error);
    throw createHttpError(
      400,
      `Failed to process image: ${originalName ?? "unsupported or corrupted file"}`,
    );
  } finally {
    release();
  }
};
