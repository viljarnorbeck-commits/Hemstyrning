/** RealityScan exports Z-up; the dashboard uses Y-up. Display units are not surveyed metres. */
export function modelPlacement(min, max, span = 80) {
  const extent = max.map((value, i) => value - min[i]);
  if (!extent.every(Number.isFinite) || Math.max(...extent) <= 0) {
    throw new Error('Modellen saknar giltig utsträckning');
  }
  const scale = span / Math.max(extent[0], extent[2]);
  return { scale, offset: [-(min[0] + max[0]) * scale / 2, -min[1] * scale, -(min[2] + max[2]) * scale / 2] };
}
