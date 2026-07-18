declare const PxMarker: unique symbol;

/**
 * A length in CSS pixels.
 *
 * `Px` is a *nominal* (branded) number: it behaves exactly like a
 * `number` at runtime and in arithmetic, but the type system refuses
 * plain numbers where a `Px` is expected. That single distinction
 * keeps raw event coordinates, ratios, and pixel lengths from mixing
 * silently inside geometry math.
 *
 * Every value entering the library from the outside world — event
 * coordinates, measured rects, user-supplied steps — is branded at
 * the boundary via {@link px}. Everything past the boundary can then
 * trust its units.
 *
 * @example Branding at the boundary
 * ```ts
 * import { px, type Px } from "draggavue";
 *
 * const step: Px = px(10);
 * const fromEvent: Px = px(event.clientX);
 *
 * // @ts-expect-error — a bare number is not a Px
 * const wrong: Px = 10;
 * ```
 *
 * @example Arithmetic stays ordinary
 * ```ts
 * // compute as numbers, re-brand the result
 * const doubled: Px = px(step * 2);
 * ```
 *
 * @see {@link px} for constructing values.
 */
export type Px = number & { readonly [PxMarker]: never };

/**
 * Brand a raw number as a pixel length.
 *
 * A zero-cost cast — no rounding, no validation — because
 * {@link Px} exists purely for compile-time unit discipline.
 *
 * @example
 * ```ts
 * const gutter = px(16);
 * const half = px(gutter / 2);
 * ```
 */
export type px = (value: number) => Px;
export const px: px = (value) => value as Px;
