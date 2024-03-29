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

function createStickyHeader($table: string | HTMLElement, options?: clonedHeaderOptions) {
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
    const originalHeaderCells = originalHeader?.querySelectorAll($headerCell) as
        | NodeListOf<HTMLElement>
        | undefined
    const scrollableArea = $scrollableArea
        ? document.querySelector($scrollableArea) ?? window
        : window
    let clonedHeader: HTMLElement | null = null
    let clonedHeaderCells: NodeListOf<HTMLElement> | null = null
    let tableRect = getRect(null)
    let headerRect = getRect(null)
    let headerCellsRect: ElementRect[] = []
    let y = 0
    let offsetY = 0
    let sticky = false
    let initialized = false

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

    const init = () => {
        if (!originalHeader) {
            return
        }

        clonedHeader = originalHeader.cloneNode(true) as HTMLElement
        clonedHeaderCells = clonedHeader.querySelectorAll($headerCell)
        clonedHeader.style.visibility = 'hidden'

        bind()
        update(() => {
            if (!clonedHeader) {
                return
            }

            initialized = true
            originalHeader.insertAdjacentElement('afterend', clonedHeader)
        })
    }

    const bind = () => {
        scrollableArea.addEventListener('scroll', toggle)
        window.addEventListener('resize', onResize)
        table.addEventListener('scroll', scrollHeader)
    }

    const unbind = () => {
        scrollableArea.removeEventListener('scroll', toggle)
        window.removeEventListener('resize', onResize)
        table.removeEventListener('scroll', scrollHeader)
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
        if (!initialized) {
            return originalHeader
        }

        return clonedHeader
    }

    const getHeaderCells = () => {
        if (!initialized) {
            return originalHeaderCells
        }

        return clonedHeaderCells
    }

    const toggle = () => {
        if (!originalHeader) {
            return
        }

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
            }
        }

        applyTransformation()
    }

    const update = debounce(
        (callback?: Event | Function) => {
            rect()
            apply()
            toggle()
            scrollHeader()

            if (callback instanceof Function) callback()
        },
        0,
        false
    )

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
        headerCellsRect = Array.from(getHeaderCells() ?? [], (cell) => getRect(cell))
    }

    const apply = () => {
        if (!(originalHeader && originalHeaderCells)) {
            return
        }

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
        if (!originalHeader) {
            return
        }

        originalHeader.style.transform = `translate3d(${tableRect.x}px, ${y}px, 0px)`
    }

    const clear = () => {
        if (!(originalHeader && originalHeaderCells && clonedHeader)) {
            return
        }

        originalHeader.style.removeProperty('position')
        originalHeader.style.removeProperty('width')
        originalHeader.style.removeProperty('height')
        originalHeader.style.removeProperty('top')
        originalHeader.style.removeProperty('left')
        originalHeader.style.removeProperty('z-index')
        originalHeader.style.removeProperty('overflow')
        originalHeader.style.removeProperty('transform')

        for (let i = 0; i < originalHeaderCells.length; i++) {
            originalHeaderCells[i].style.removeProperty('max-width')
            originalHeaderCells[i].style.removeProperty('min-width')
            originalHeaderCells[i].style.removeProperty('max-height')
            originalHeaderCells[i].style.removeProperty('min-height')
        }
    }

    const scrollHeader = () => {
        if (!originalHeader) {
            return
        }

        originalHeader.scrollTo(table.scrollLeft, 0)
    }

    const onResize = debounce(update, 250, true)

    const dispose = () => {
        unbind()
        clear()
        clonedHeader?.remove()
    }

    init()

    return {
        update,
        dispose
    }
}

export { createStickyHeader }
