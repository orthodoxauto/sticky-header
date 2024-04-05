export type clonedHeaderOptions = {
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

let _uid = 0

function createStickyHeader($table: string, options?: clonedHeaderOptions) {
    _uid += 1

    const $header = options?.header ?? 'thead'
    const $headerCell = options?.headerCell ?? 'th'
    const $clonedHeader = `#oa-header-${_uid}`
    const $fixedOffset = options?.fixedOffset ?? []
    const $scrollableArea = options?.scrollableArea
    const $zIndex = options?.zIndex ?? 10

    const scrollableArea = $scrollableArea
        ? document.querySelector($scrollableArea) ?? window
        : window
    let table: HTMLElement | null = null
    let originalHeader: HTMLElement | null = null
    let originalHeaderCells: NodeListOf<HTMLElement> | null = null
    let clonedHeader: HTMLElement | null = null
    let clonedHeaderCells: NodeListOf<HTMLElement> | null = null
    let tableRect = getRect(null)
    let headerRect = getRect(null)
    let headerCellsRect: ElementRect[] = []
    let resizeObserver: ResizeObserver | null = null
    let y = 0
    let offsetY = 0
    let sticky = false

    function debounce<T extends (...args: any[]) => any>(
        func: T,
        wait: number,
        clear: boolean = true
    ): (...args: Parameters<T>) => void {
        let timeout: ReturnType<typeof setTimeout> | null = null

        return function (...args: Parameters<T>) {
            // @ts-ignore
            const context = this

            if (timeout !== null && clear) {
                clearTimeout(timeout)
            }

            timeout = setTimeout(() => func.apply(context, args), wait)
        }
    }

    const getTable = (cache = false): HTMLElement | null => {
        if (cache && table) {
            return table
        }
        return (table = document.querySelector($table))
    }

    const getOriginalHeader = (cache = false): HTMLElement | null => {
        if (cache && originalHeader) {
            return originalHeader
        }
        return (originalHeader = getTable(cache)?.querySelector($header) ?? null)
    }

    const getOriginalHeaderCells = (cache = false): NodeListOf<HTMLElement> | null => {
        if (cache && originalHeaderCells) {
            return originalHeaderCells
        }
        return (originalHeaderCells =
            getOriginalHeader(cache)?.querySelectorAll($headerCell) ?? null)
    }

    const getClonedHeader = (cache = false): HTMLElement | null => {
        if (cache && clonedHeader) {
            return clonedHeader
        }
        return (clonedHeader = getTable(cache)?.querySelector($clonedHeader) ?? null)
    }

    const getClonedHeaderCells = (cache = false): NodeListOf<HTMLElement> | null => {
        if (cache && clonedHeaderCells) {
            return clonedHeaderCells
        }
        return (clonedHeaderCells = getClonedHeader(cache)?.querySelectorAll($headerCell) ?? null)
    }

    const init = () => {
        const originalHeader = getOriginalHeader(false)
        if (!originalHeader) {
            return
        }

        bind()
        update()
    }

    const bind = () => {
        scrollableArea.addEventListener('scroll', onScroll)
        getTable(false)?.addEventListener('scroll', scrollHeader)

        const table = getTable(false)
        if (!table) {
            return
        }
        const observable = table.firstElementChild
        if (!observable) {
            return
        }

        resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                rect()
                apply()
            }
        })
        resizeObserver.observe(observable)
    }

    const unbind = () => {
        scrollableArea.removeEventListener('scroll', onScroll)
        getTable(false)?.removeEventListener('scroll', scrollHeader)
        resizeObserver?.disconnect()
        resizeObserver = null
    }

    const getScrollOffset = () => {
        if (scrollableArea instanceof Element) {
            return [scrollableArea.scrollLeft, scrollableArea.scrollTop]
        }

        return [scrollableArea.scrollX, scrollableArea.scrollY]
    }

    function getRect(element: Element | null): DOMRect {
        if (!element) {
            return DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 })
        }

        const { left, top, width, height } = element.getBoundingClientRect()
        const [$scrollX, $scrollY] = getScrollOffset()

        return DOMRect.fromRect({
            x: left + $scrollX - document.documentElement.clientLeft,
            y: top + $scrollY - document.documentElement.clientTop,
            height,
            width
        })
    }

    const getHeader = () => {
        if (!sticky) {
            return getOriginalHeader(false)
        }

        return getClonedHeader(false)
    }

    const getHeaderCells = () => {
        if (!sticky) {
            return getOriginalHeaderCells(false)
        }

        return getClonedHeaderCells(false)
    }

    const toggle = () => {
        const [$scrollX, $scrollY] = getScrollOffset()

        if ($scrollY > tableRect.bottom - offsetY - headerRect.height) {
            y = tableRect.bottom - headerRect.height - $scrollY
        } else if (tableRect.top - $scrollY < offsetY) {
            y = offsetY

            if (!sticky) {
                rect()
                sticky = true
                apply()
            }
        } else {
            y = tableRect.top - $scrollY

            if (sticky) {
                sticky = false
                apply()
            }
        }

        applyTransformation()
    }

    const update = debounce(
        () => {
            clone()

            rect()
            toggle()
            apply()
        },
        0,
        false
    )

    const clone = () => {
        getClonedHeader(false)?.remove()

        const originalHeader = getOriginalHeader(false)
        const clonedHeader = originalHeader?.cloneNode(true) as HTMLElement | undefined

        if (clonedHeader) {
            clonedHeader.id = $clonedHeader.replace('#', '')
            clear(clonedHeader, clonedHeader.querySelectorAll($headerCell))
            originalHeader?.insertAdjacentElement('afterend', clonedHeader)
        }
    }

    const rect = () => {
        offsetY = 0
        if ($fixedOffset.length) {
            const fixedOffsets = document.querySelectorAll<HTMLElement>($fixedOffset.join(','))

            for (let i = 0; i < fixedOffsets.length; i++) {
                offsetY += getRect(fixedOffsets[i]).height
            }
        }

        tableRect = getRect(getTable(false))
        headerRect = getRect(getHeader())
        headerCellsRect = Array.from(getHeaderCells() ?? [], (cell) => getRect(cell))
    }

    const apply = () => {
        const originalHeader = getOriginalHeader(false)
        const originalHeaderCells = getOriginalHeaderCells(false)
        const clonedHeader = getClonedHeader(false)

        if (!(originalHeader && originalHeaderCells && clonedHeader)) {
            return
        }

        if (!sticky) {
            clear()
            clonedHeader.style.setProperty('display', 'none', 'important')
            return
        }

        clonedHeader.style.removeProperty('display')

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
        originalHeader.style.top = '0px'
        originalHeader.style.left = '0px'
        originalHeader.style.zIndex = `${$zIndex}`
        originalHeader.style.overflow = 'hidden'

        applyTransformation()
    }

    const applyTransformation = () => {
        const originalHeader = getOriginalHeader(true)

        if (!originalHeader || !sticky) {
            return
        }

        scrollHeader()
        originalHeader.style.transform = `translate3d(${tableRect.x}px, ${y}px, 0px)`
    }

    const clear = (header?: HTMLElement | null, headerCells?: NodeListOf<HTMLElement> | null) => {
        header = header ?? getOriginalHeader(false)
        headerCells = headerCells ?? getOriginalHeaderCells(false)

        if (!(header && headerCells)) {
            return
        }

        header.style.removeProperty('position')
        header.style.removeProperty('width')
        header.style.removeProperty('height')
        header.style.removeProperty('top')
        header.style.removeProperty('left')
        header.style.removeProperty('z-index')
        header.style.removeProperty('overflow')
        header.style.removeProperty('transform')

        for (let i = 0; i < headerCells.length; i++) {
            headerCells[i].style.removeProperty('max-width')
            headerCells[i].style.removeProperty('min-width')
            headerCells[i].style.removeProperty('max-height')
            headerCells[i].style.removeProperty('min-height')
        }
    }

    const scrollHeader = () => {
        const table = getTable(true)
        const originalHeader = getOriginalHeader(true)

        if (!(table && originalHeader)) {
            return
        }

        originalHeader.scrollTo(table.scrollLeft, 0)
    }

    const onScroll = () => {
        toggle()
    }

    const dispose = () => {
        unbind()
        clear()
        getClonedHeader(false)?.remove()
    }

    init()

    return {
        update,
        dispose
    }
}

export { createStickyHeader }
