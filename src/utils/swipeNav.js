/**
 * useSwipeNav — 全局空白区域滑动翻页
 * 在卡片/按钮/交互元素上滑动时放行，不影响原有交互
 */
export function useSwipeNav(currentPage) {
  let startX = 0
  let startY = 0
  let tracking = false

  // 交互元素选择器（匹配所有可交互区域）
  const INTERACTIVE = ['.diary-entry', '.card-inner', '.entry-tape',
    '.todo-line', '.line-check', '.line-del', '.cat-head',
    '.strip-body', '.slip-check', '.todo-strip',
    '.nav-col', '.tab-col', '.bookmark', '.hd-add',
    '.btn-solid', '.btn-ghost', '.compose-overlay', '.compose-sheet',
    '.detail-overlay', '.detail-sheet', '.ms-input-wrap',
    '.add-line', '.add-dot', '.breathe-label', '.date-arrow',
    '.fab-create', '.fab-new', '.detail-btn', '.detail-close']

  const pageOrder = uni.$pageOrder || ['home', 'todos', 'stats', 'breathe']

  function onTouchStart(e) {
    const el = e.target
    if (el && el.closest) {
      for (const sel of INTERACTIVE) {
        if (el.closest(sel)) {
          tracking = false
          return
        }
      }
    }
    tracking = true
    const t = e.changedTouches?.[0] || e.touches?.[0]
    startX = t?.clientX || e.clientX || 0
    startY = t?.clientY || e.clientY || 0
  }

  function onTouchEnd(e) {
    if (!tracking) return
    tracking = false

    const t = e.changedTouches?.[0] || e.touches?.[0]
    const endX = t?.clientX || 0
    const dx = endX - startX

    if (Math.abs(dx) < 50) return

    const idx = pageOrder.indexOf(currentPage)
    if (dx > 0 && idx > 0) {
      // 右滑 → 上一页
      uni.$flipDirection = 'prev'
      uni.reLaunch({ url: '/pages/' + pageOrder[idx - 1] + '/index', animationType: 'none' })
    } else if (dx < 0 && idx < pageOrder.length - 1) {
      // 左滑 → 下一页
      uni.$flipDirection = 'next'
      uni.reLaunch({ url: '/pages/' + pageOrder[idx + 1] + '/index', animationType: 'none' })
    }
  }

  return { onTouchStart, onTouchEnd }
}
