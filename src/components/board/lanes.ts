/**
 * Beeswarm packing for the axis panels.
 *
 * Family guesses cluster hard — everyone lands within a few hundred grams of
 * "average" — so without this the avatars sit on top of each other and the
 * panel reads as one blob. Items are placed in ascending order and each takes
 * the lowest lane that has room, which keeps the pile short and stable: adding
 * a guess doesn't reshuffle everyone else.
 */
export function packLanes(
  positionsPercent: number[],
  minGapPercent: number,
): number[] {
  const lastInLane: number[] = [];
  const lanes: number[] = [];

  const order = positionsPercent
    .map((position, index) => ({ position, index }))
    .sort((a, b) => a.position - b.position);

  for (const { position, index } of order) {
    let lane = lastInLane.findIndex(
      (last) => position - last >= minGapPercent,
    );
    if (lane === -1) {
      lane = lastInLane.length;
      lastInLane.push(position);
    } else {
      lastInLane[lane] = position;
    }
    lanes[index] = lane;
  }

  return lanes;
}
