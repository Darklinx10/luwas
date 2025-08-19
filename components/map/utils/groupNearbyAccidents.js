import { getDistance } from 'geolib';

export function groupNearbyAccidents(accidents, radius = 50) {
  const clusters = [];
  accidents.forEach(acc => {
    const { position } = acc;
    if (!position) return;

    const [lat, lng] = Array.isArray(position)
      ? position
      : [position.lat, position.lng];

    if (!lat || !lng) return;

    let added = false;
    for (const cluster of clusters) {
      const distance = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: cluster.lat, longitude: cluster.lng }
      );
      if (distance <= radius) {
        cluster.count += 1;
        cluster.accidents.push(acc);
        added = true;
        break;
      }
    }
    if (!added) {
      clusters.push({ lat, lng, count: 1, accidents: [acc] });
    }
  });
  return clusters;
}
