export type StickyHeaderOptions = {
    header?: string
    headerCell?: string
    fixedOffset?: string[]
    scrollableArea?: string
    zIndex?: number
    onShow?: () => void
    onHide?: () => void
}

type ElementRect = {
    width: number
    height: number
    x: number
    y: number
}

function createStickyHeader($table: string | HTMLElement, options?: StickyHeaderOptions) {
    const $header = options?.header ?? 'thead'
    const $headerCell = options?.headerCell ?? 'th'
    const $fixedOffset = options?.fixedOffset ?? []
    const $scrollableArea = options?.scrollableArea
    const $zIndex = options?.zIndex ?? 10
    const $onShow = options?.onShow
    const $onHide = options?.onHide

    const table =
        $table instanceof HTMLElement ? $table : document.querySelector<HTMLElement>($table)
    if (!table) {
        throw new Error('specified table not found')
    }

    const originalHeader = table.querySelector<HTMLElement>($header)
    const originalHeaderCells = originalHeader?.querySelectorAll($headerCell) as
        | NodeListOf<HTMLElement>
        | undefined
    const scrollableArea = $scrollableArea
        ? document.querySelector($scrollableArea) ?? window
        : window
    let stickyHeader: HTMLElement | null = null
    let stickyHeaderCells: NodeListOf<HTMLElement> | null = null
    let lastCell: HTMLElement | null = null
    let tableRect = getRect(null)
    let headerRect = getRect(null)
    let headerCellsRect: ElementRect[] = []
    let lastCellRect = getRect(null)
    let offsetY = 0
    let isSticky = false

    function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number
    ): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null

        return function (...args: Parameters<T>) {
            // @ts-ignore
            const context = this

            if (timeout !== null) {
                clearTimeout(timeout)
            }

            timeout = setTimeout(() => func.apply(context, args), wait)
        }
    }

    const init = () => {
        if (!originalHeader) {
            return
        }

        stickyHeader = originalHeader.cloneNode(true) as HTMLElement
        stickyHeaderCells = stickyHeader.querySelectorAll($headerCell)
        stickyHeader.style.setProperty('display', 'none', 'important')

        originalHeader.insertAdjacentElement('afterend', stickyHeader)

        lastCell =
            table.querySelector('tfoot') ??
            table.querySelector('tbody tr:last-child') ??
            table.querySelector('.d-table-row:last-child')

        update()
        bind()
    }

    const bind = () => {
        scrollableArea.addEventListener('scroll', toggle)
        window.addEventListener('load', update)
        window.addEventListener('resize', onResize)
        table.addEventListener('scroll', scrollHeader)
    }

    const unbind = () => {
        scrollableArea.removeEventListener('scroll', toggle)
        window.removeEventListener('load', update)
        window.removeEventListener('resize', onResize)
        table.removeEventListener('scroll', scrollHeader)
    }

    const getHeader = () => {
        if (isSticky) {
            return stickyHeader
        }

        return originalHeader
    }

    const getHeaderCells = () => {
        if (isSticky) {
            return stickyHeaderCells
        }

        return originalHeaderCells
    }

    const getScrollOffset = () => {
        if (scrollableArea instanceof Element) {
            return [scrollableArea.scrollLeft, scrollableArea.scrollTop]
        }

        return [scrollableArea.scrollX, scrollableArea.scrollY]
    }

    function getRect(element: Element | null): ElementRect {
        if (!element) {
            return { x: 0, y: 0, width: 0, height: 0 }
        }

        const { left, top, width, height } = element.getBoundingClientRect()
        const [$scrollX, $scrollY] = getScrollOffset()

        return {
            x: left + $scrollX - document.documentElement.clientLeft,
            y: top + $scrollY - document.documentElement.clientTop,
            height,
            width
        }
    }

    const toggle = () => {
        const [$scrollX, $scrollY] = getScrollOffset()

        if (
            $scrollY + offsetY > headerRect.y &&
            $scrollY + offsetY < tableRect.y + tableRect.height - lastCellRect.height
        ) {
            if (!isSticky) {
                rect()
                isSticky = true
                apply()
                if ($onShow) $onShow()
            }

            scrollHeader()
        } else {
            if (isSticky) {
                isSticky = false
                clear()
                if ($onHide) $onHide()
            }
        }
    }

    const update = debounce(() => {
        rect()
        toggle()
    }, 0)

    const rect = () => {
        offsetY = 0
        if ($fixedOffset.length) {
            const fixedOffsets = document.querySelectorAll<HTMLElement>($fixedOffset.join(','))

            for (let i = 0; i < fixedOffsets.length; i++) {
                offsetY += getRect(fixedOffsets[i]).height
            }
        }

        tableRect = getRect(table)
        headerRect = getRect(getHeader())
        lastCellRect = getRect(lastCell)
        headerCellsRect = Array.from(getHeaderCells() ?? [], (cell) => getRect(cell))
    }

    const apply = () => {
        if (!(originalHeader && originalHeaderCells && stickyHeader)) {
            return
        }

        stickyHeader.style.removeProperty('display')

        for (let i = 0; i < headerCellsRect.length; i++) {
            const { width, height } = headerCellsRect[i]

            originalHeaderCells[i].style.maxWidth = width + 'px'
            originalHeaderCells[i].style.minWidth = width + 'px'
            originalHeaderCells[i].style.maxHeight = height + 'px'
            originalHeaderCells[i].style.minHeight = height + 'px'
        }

        originalHeader.style.position = 'fixed'
        originalHeader.style.width = tableRect.width + 'px'
        originalHeader.style.height = headerRect.height + 'px'
        originalHeader.style.top = offsetY + 'px'
        originalHeader.style.left = tableRect.x + 'px'
        originalHeader.style.zIndex = `${$zIndex}`
        originalHeader.style.overflow = 'hidden'
    }

    const clear = () => {
        if (!(originalHeader && originalHeaderCells && stickyHeader)) {
            return
        }

        originalHeader.style.removeProperty('position')
        originalHeader.style.removeProperty('width')
        originalHeader.style.removeProperty('height')
        originalHeader.style.removeProperty('top')
        originalHeader.style.removeProperty('left')
        originalHeader.style.removeProperty('z-index')
        originalHeader.style.removeProperty('overflow')

        stickyHeader.style.setProperty('display', 'none', 'important')

        for (let i = 0; i < originalHeaderCells.length; i++) {
            originalHeaderCells[i].style.removeProperty('max-width')
            originalHeaderCells[i].style.removeProperty('min-width')
            originalHeaderCells[i].style.removeProperty('max-height')
            originalHeaderCells[i].style.removeProperty('min-height')
            originalHeaderCells[i].style.removeProperty('opacity')
        }
    }

    const scrollHeader = () => {
        if (!originalHeader) {
            return
        }

        originalHeader.scrollTo(table.scrollLeft, 0)
    }

    const onResize = debounce(update, 250)

    const dispose = () => {
        unbind()
        clear()
        stickyHeader?.remove()
    }

    init()

    return {
        update,
        dispose
    }
}

export { createStickyHeader }
