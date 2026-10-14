// Snapshots the public catalogue from a running backend into frontend/src/mock/fixtures.json.
import { writeFileSync } from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:8080';
const get = async (p) => {
  const r = await fetch(BASE + p);
  if (!r.ok) throw new Error(`${p} ${r.status}`);
  return (await r.json()).data;
};
const salons = [];
for (let page = 0; ; page++) {
  const d = await get(`/api/salons/search?size=48&sort=name&page=${page}`);
  salons.push(...d.items);
  if (!d.hasNext) break;
}
const services = [], categories = [], reviews = [];
for (const s of salons) {
  services.push(...(await get(`/api/service-offerings/salon/${s.id}`)));
  categories.push(...(await get(`/api/categories/salon/${s.id}`)));
  reviews.push(...(await get(`/api/reviews/salon/${s.id}`)));
}
const strip = (s) => {
  const { distanceKm, averageRating, reviewCount, serviceCount, minPrice, ...rest } = s;
  return rest;
};
const out = {
  version: new Date().toISOString().slice(0, 10) + '-' + salons.length,
  salons: salons.map(strip),
  services,
  categories: categories.map(({ image, ...c }) => c),
  reviews: reviews.map(({ salonName, salonCity, ...r }) => r),
};
writeFileSync(process.argv[3], JSON.stringify(out));
console.log('salons', salons.length, 'services', services.length, 'categories', categories.length, 'reviews', reviews.length);
