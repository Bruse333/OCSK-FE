/**
 * 时段主题工具
 * 按当前小时返回视觉主题与配套问候语/图标：
 *   morning 清晨 05:00-11:00（明亮太阳）
 *   day     白日 11:00-17:00（明亮太阳）
 *   dusk    傍晚 17:00-19:00（黄昏太阳）
 *   night   夜晚 19:00-05:00（弯月）
 * 组件在根元素上添加 `theme-{name}` class 即可自动换肤（变量定义在 theme.css）。
 */

export function getTimeTheme(date = new Date()) {
  const h = date.getHours()
  if (h >= 5 && h < 11) return 'morning'
  if (h >= 11 && h < 17) return 'day'
  if (h >= 17 && h < 19) return 'dusk'
  return 'night'
}

export function getGreeting(date = new Date()) {
  const h = date.getHours()
  if (h < 5) return '夜深了'
  if (h < 8) return '早上好'
  if (h < 11) return '上午好'
  if (h < 13) return '中午好'
  if (h < 17) return '下午好'
  if (h < 19) return '傍晚好'
  return '晚上好'
}

/** 问候语旁的季节图标：sun / sunset / moon */
export function getGreetingIcon(theme) {
  if (theme === 'dusk') return 'sunset'
  if (theme === 'night') return 'moon'
  return 'sun'
}
