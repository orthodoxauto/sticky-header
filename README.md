# @orthodoxauto/sticky-header

By applying this plugin to the table, the column headers will stick to the top of the viewport as you scroll down.

## Installation

```
npm i @orthodoxauto/sticky-header
```

## Usage

Using the plugin is pretty straightforward:

```
import { createStickyHeader } from '@orthodoxauto/sticky-header'

createStickyHeader(table, opts)
```

## Cleanup

```
const instance = createStickyHeader(table, opts)
instance.dispose()
```

## Trigger an update manually

```
const instance = createStickyHeader(table, opts)
instance.update()
```

## Options

You can initialize the plugin with an options map to tweak the behavior. The following options are supported:

### `header`

CSS selector for table's header. Default is `thead`.

```
createStickyHeader(table, {
    header: 'thead'
})
```

### `headerCell`

CSS selector for table's header cell. Default is `th`.

```
createStickyHeader(table, {
    headerCell: 'th'
})
```

### `fixedOffset`

Specifies how much the sticky header should be offset from the top of the page.

```
createStickyHeader(table, {
    fixedOffset: ['#nav']
})
```

### `scrollableArea`

Allows you to overwrite which surrounding element is scrolling. Defaults to `window`.

```
createStickyHeader(table, {
    scrollableArea: '#scrollable'
})
```

### `zIndex`

```
createStickyHeader(table, {
    scrollableArea: '#scrollable'
})
```
