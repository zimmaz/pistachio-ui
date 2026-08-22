/** The supplied pixel-art lockup. Used as-is; never redrawn, never smoothed. */
export const BANNER_SRC = '/pistachio-logo.png'

/** Exposed to CSS so `.pxMark` can crop the nut out of the full lockup. */
export const BANNER_CSS_VAR = `url(${BANNER_SRC})`
