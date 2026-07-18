declare const PxMarker: unique symbol;

/**
 * A length in CSS pixels.
 *
 * Nominal typing prevents accidentally mixing raw numbers,
 * ratios, and pixel lengths in geometry math.
 */
export type Px = number & { readonly [PxMarker]: never };

export type px = (value: number) => Px;
export const px: px = (value) => value as Px;
