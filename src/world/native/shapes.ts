/** Keep the carved eave profile finite, including a tile seam just past the lip. */
export function roofProfile(x: number, z: number, width: number, rise: number) {
  const fraction = Math.min(1, Math.abs(x / (width / 2)))
  return rise * Math.pow(Math.max(0, 1 - fraction), 1.13) + Math.pow(fraction, 8) * .18 + Math.sin(z * .6) * .025
}
