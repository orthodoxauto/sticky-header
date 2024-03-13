export type StickyHeaderOptions = {
    header?: string
    headerCell?: string
    fixedOffset?: string[]
    scrollableArea?: string
    zIndex?: number
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

    const table =
        $table instanceof HTMLElement ? $table : document.querySelector<HTMLElement>($table)
    if (!table) {
        throw new Error('specified table not found')
    }

    const originalHeader = table.querySelector<HTMLElement>($header)
    const originalHeaderCells = originalHeader?.querySelectorAll($headerCell)
    const scrollableArea = $scrollableArea
        ? document.querySelector($scrollableArea) ?? window
        : window
    let stickyHeader: HTMLElement | null = null
    let stickyHeaderCells: NodeListOf<HTMLElement> | null = null
    let lastCell: HTMLElement | null = null
    let tableRect = getRect(null)
    let originalHeaderRect = getRect(null)
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
        stickyHeader.style.setProperty('display', 'none', 'important')

        stickyHeaderCells = stickyHeader.querySelectorAll($headerCell)

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
        table.addEventListener('scroll', scrollStickyHeader)
    }

    const unbind = () => {
        scrollableArea.removeEventListener('scroll', toggle)
        window.removeEventListener('load', update)
        window.removeEventListener('resize', onResize)
        table.removeEventListener('scroll', scrollStickyHeader)
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

    const toggle = debounce(() => {
        if (!(originalHeader && stickyHeader)) {
            return
        }

        const [$scrollX, $scrollY] = getScrollOffset()

        if (
            $scrollY + offsetY >= originalHeaderRect.y &&
            $scrollY + offsetY < tableRect.y + tableRect.height - lastCellRect.height
        ) {
            if (!isSticky) {
                isSticky = true
                update()
            }

            stickyHeader!.style.removeProperty('display')
            scrollStickyHeader()
        } else {
            stickyHeader.style.setProperty('display', 'none', 'important')
            isSticky = false
        }
    }, 0)

    const update = debounce(() => {
        if (!(originalHeader && originalHeaderCells && stickyHeader && stickyHeaderCells)) {
            return
        }

        offsetY = 0
        if ($fixedOffset.length) {
            const fixedOffsets = document.querySelectorAll<HTMLElement>($fixedOffset.join(','))

            for (let i = 0; i < fixedOffsets.length; i++) {
                offsetY += getRect(fixedOffsets[i]).height
            }
        }

        tableRect = getRect(table)
        originalHeaderRect = getRect(originalHeader)
        lastCellRect = getRect(lastCell)

        stickyHeader.style.position = 'fixed'
        stickyHeader.style.width = tableRect.width + 'px'
        stickyHeader.style.height = originalHeaderRect.height + 'px'
        stickyHeader.style.top = offsetY + 'px'
        stickyHeader.style.left = tableRect.x + 'px'
        stickyHeader.style.zIndex = `${$zIndex}`
        stickyHeader.style.overflow = 'hidden'

        for (let i = 0; i < originalHeaderCells.length; i++) {
            const { width, height } = getRect(originalHeaderCells[i])

            stickyHeaderCells[i].style.maxWidth = width + 'px'
            stickyHeaderCells[i].style.minWidth = width + 'px'
            stickyHeaderCells[i].style.maxHeight = height + 'px'
            stickyHeaderCells[i].style.minHeight = height + 'px'
        }

        toggle()
    }, 0)

    const scrollStickyHeader = () => {
        if (!stickyHeader) {
            return
        }

        stickyHeader.scrollTo(table.scrollLeft, 0)
    }

    const onResize = debounce(update, 250)

    const dispose = () => {
        unbind()
        stickyHeader?.remove()
    }

    init()

    return {
        update,
        dispose
    }
}

export { createStickyHeader }
