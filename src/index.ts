export type StickyHeaderOptions = {
    containerSelector: string
    headerSelector: string
    headerCellSelector: string
    bottomOffsetY: number
}

type ElementRect = {
    width: number
    height: number
    x: number
    y: number
}

function createStickyHeader(table: HTMLElement, options?: StickyHeaderOptions) {
    table =
        table.closest<HTMLElement>(options?.containerSelector ?? '[data-scroll-container]') ?? table
    const headerSelector = options?.headerSelector ?? 'thead'
    const headerCellSelector = options?.headerCellSelector ?? 'th'
    const bottomOffsetY = options?.bottomOffsetY ?? 75

    const originalHeader = table.querySelector<HTMLElement>(headerSelector)
    const originalHeaderCells = originalHeader?.querySelectorAll(headerCellSelector)
    let stickyHeader: HTMLElement | null = null
    let stickyHeaderCells: NodeListOf<HTMLElement> | null = null
    let tableRect: ElementRect | null = null
    let originalHeaderRect: ElementRect | null = null
    let isSticky = false

    const init = () => {
        if (!originalHeader) {
            return
        }

        stickyHeader = originalHeader.cloneNode(true) as HTMLElement
        stickyHeader.style.display = 'none'

        stickyHeaderCells = stickyHeader.querySelectorAll(headerCellSelector)

        originalHeader.insertAdjacentElement('afterend', stickyHeader)

        update()
        bind()
    }

    const bind = () => {
        window.addEventListener('scroll', toggle)
        window.addEventListener('resize', onResize)
        table.addEventListener('scroll', scrollStickyHeader)
    }

    const unbind = () => {
        window.removeEventListener('scroll', toggle)
        window.removeEventListener('resize', onResize)
        table.removeEventListener('scroll', scrollStickyHeader)
    }

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

    const getX = (element: HTMLElement | null) => {
        if (!element) {
            return 0
        }

        const rect = element.getBoundingClientRect()
        return rect.left + window.scrollX - document.documentElement.clientLeft
    }

    const getY = (element: HTMLElement | null) => {
        if (!element) {
            return 0
        }

        const rect = element.getBoundingClientRect()
        return rect.top + window.scrollY - document.documentElement.clientTop
    }

    const toggle = () => {
        if (!(originalHeader && stickyHeader && tableRect && originalHeaderRect)) {
            return
        }

        if (
            window.scrollY >= originalHeaderRect.y &&
            window.scrollY < tableRect.y + tableRect.height - bottomOffsetY
        ) {
            stickyHeader.style.removeProperty('display')
            if (!isSticky) {
                isSticky = true
                scrollStickyHeader()
            }
        } else {
            stickyHeader.style.setProperty('display', 'none', 'important')
            isSticky = false
        }
    }

    const update = () => {
        if (!(originalHeader && originalHeaderCells && stickyHeader && stickyHeaderCells)) {
            return
        }

        tableRect = {
            x: getX(table),
            y: getY(table),
            width: table.offsetWidth,
            height: table.offsetHeight
        }
        originalHeaderRect = {
            x: getX(originalHeader),
            y: getY(originalHeader),
            width: originalHeader.offsetWidth,
            height: originalHeader.offsetHeight
        }

        stickyHeader.style.position = 'fixed'
        stickyHeader.style.width = tableRect.width + 'px'
        stickyHeader.style.height = originalHeaderRect.height + 'px'
        stickyHeader.style.top = '0px'
        stickyHeader.style.left = tableRect.x + 'px'
        stickyHeader.style.zIndex = '10'
        stickyHeader.style.overflow = 'hidden'

        for (let i = 0; i < originalHeaderCells.length; i++) {
            const { width, height } = originalHeaderCells[i].getBoundingClientRect()

            stickyHeaderCells[i].style.maxWidth = width + 'px'
            stickyHeaderCells[i].style.minWidth = width + 'px'
            stickyHeaderCells[i].style.maxHeight = height + 'px'
            stickyHeaderCells[i].style.minHeight = height + 'px'
        }

        toggle()
    }

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
