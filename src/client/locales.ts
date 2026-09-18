/**
 * Dictionaries for the Tool Stats page.
 *
 * `zh` is the key-set source of truth, as in the official client plugins, and `en` is
 * typed against it: a key translated in one language but not the other fails the build
 * instead of silently rendering the raw key.
 *
 * @module client/locales
 */

/** Dictionary namespace owned by this plugin. */
export const NS = 'toolStats'

/** Simplified Chinese dictionary (the key-set source of truth). */
export const zh = {
  'nav': '工具统计',
  'title': '工具统计',
  'tool': '工具',
  'calls': '调用次数',
  'failRate': '失败率',
  'deadTools': '从未调用的工具',
  'failingTools': '高失败率工具',
  'recommendations': '建议',
  'empty': '还没有记录到工具调用。',
  'refresh': '刷新',
  'loading': '正在加载…',
  'failed': '加载失败',
  'retry': '重试',
}

/** English dictionary, checked complete against the zh key set. */
export const en: typeof zh = {
  'nav': 'Tool Stats',
  'title': 'Tool Stats',
  'tool': 'Tool',
  'calls': 'Calls',
  'failRate': 'Failure',
  'deadTools': 'Dead tools',
  'failingTools': 'Failing tools',
  'recommendations': 'Recommendations',
  'empty': 'No tool calls recorded yet.',
  'refresh': 'Refresh',
  'loading': 'Loading…',
  'failed': 'Failed to load',
  'retry': 'Retry',
}
