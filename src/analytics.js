// The counter ID is emitted once by the build from NOVA_METRICA_ID.
const rawId = document.querySelector('meta[name="nova-metrica-id"]')?.content || '';
const counterId = /^\d+$/.test(rawId) ? Number(rawId) : 0;
const goalNames = new Set([
  'hero_cta_click', 'scenario_change', 'scenario_6_reached', 'scenario_final_cta',
  'contact_max', 'contact_telegram', 'contact_vk', 'faq_open',
]);
let initialized = false;

export function initAnalytics() {
  if (!counterId || initialized) return;
  initialized = true;
  try {
    window.ym = window.ym || function (...args) {
      (window.ym.a = window.ym.a || []).push(args);
    };
    window.ym.l = Date.now();
    window.ym(counterId, 'init', {
      clickmap: true,
      trackLinks: false,
      accurateTrackBounce: true,
      webvisor: false,
    });
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://mc.yandex.ru/metrika/tag.js';
    document.head.append(script);
  } catch {
    // Analytics must never prevent the site from working.
  }
}

export function trackGoal(goalName, params = {}) {
  if (!counterId || !goalNames.has(goalName) || typeof window.ym !== 'function') return;
  // Only anonymous, bounded numeric identifiers are accepted as event parameters.
  const safeParams = {};
  if (goalName === 'scenario_change' && Number.isInteger(params.scenario_id) && params.scenario_id >= 1 && params.scenario_id <= 6) {
    safeParams.scenario_id = params.scenario_id;
  }
  if (goalName === 'faq_open' && Number.isInteger(params.faq_id) && params.faq_id >= 1 && params.faq_id <= 4) {
    safeParams.faq_id = params.faq_id;
  }
  try {
    window.ym(counterId, 'reachGoal', goalName, safeParams);
  } catch {
    // Blocked or unavailable counters are intentionally ignored.
  }
}
