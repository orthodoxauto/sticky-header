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

### `containerSelector`

CSS selector for scrollable container of a table. Default is `[data-scroll-container]`.

```
createStickyHeader(table, {
    containerSelector: '[data-scroll-container]'
})
```

### `headerSelector`

CSS selector for table's header. Default is `thead`.

```
createStickyHeader(table, {
    headerSelector: 'thead'
})
```

### `headerCellSelector`

CSS selector for table's header cell. Default is `th`.

```
createStickyHeader(table, {
    headerCellSelector: 'th'
})
```
