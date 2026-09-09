/**
 * core/batch.js — pula workerów z izolacją błędów.
 *
 * Uogólnione z runBatch()/runPeekBatch() w audycie kancelarii. Reguła, która się
 * tam sprawdziła i zostaje: błąd jednej pozycji nigdy nie przerywa paczki — jest
 * zapisywany i lecimy dalej. Przy 40 sklepach jeden padnięty CDN nie może kosztować
 * całego przebiegu.
 */

/**
 * @param {Array} items          — pozycje do przetworzenia
 * @param {Function} worker      — async (item, idx) => wynik
 * @param {Object} opts
 *   concurrency  — ile naraz (domyślnie 4; sam Playwright, bez limitu API)
 *   onStart      — (item, n, total) => void
 *   onOk         — (item, n, total, wynik) => void
 *   onError      — (item, n, total, err) => void
 * @returns {{ ok: Array, failed: Array }}
 */
async function runPool(items, worker, opts = {}) {
  const {
    concurrency = 4,
    onStart = () => {},
    onOk = () => {},
    onError = () => {},
  } = opts;

  const total = items.length;
  const queue = items.map((item, idx) => ({ item, idx }));
  const ok = [];
  const failed = [];
  let started = 0;

  async function petla() {
    while (queue.length) {
      const { item, idx } = queue.shift();
      const n = ++started;
      onStart(item, n, total);
      try {
        const wynik = await worker(item, idx);
        ok.push({ item, wynik });
        onOk(item, n, total, wynik);
      } catch (e) {
        failed.push({ item, error: e });
        onError(item, n, total, e);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, total || 1) }, () => petla())
  );

  return { ok, failed };
}

module.exports = { runPool };
