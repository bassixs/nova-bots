// Public settings only. Never put API tokens or recipient credentials here.
export default {
  name: 'NOVA lab',
  origin: 'https://nova-bots.ru',
  path: '/',
  title: 'Разработка чат-ботов в MAX для бизнеса и организаций — NOVA lab',
  description: 'Разрабатываем чат-ботов в MAX для бизнеса и организаций: заявки, запись, обращения, внутренние процессы и интеграции. Проектирование, разработка и сопровождение.',
  indexable: true,
  ogTitle: 'Разработка чат-ботов в MAX — NOVA lab',
  ogDescription: 'Чат-боты для заявок, записи, обращений и автоматизации рабочих процессов.',
  ogImage: '/assets/nova-og.png',
  sitemapPaths: ['/'],
  metricaId: process.env.NOVA_METRICA_ID?.trim() || '',
  contacts: { email: '', phone: '', maxUrl: 'https://max.ru/join/DNu998Er0LL5Dia4npjuIV6KUdLfnPAlYZ50se8j5jk', telegramUrl: 'https://t.me/aoexem', vkUrl: 'https://vk.ru/aoexem' }, // Public contact links.
  legalName: '',
  legalDetails: '',
};
