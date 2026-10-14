/**
 * Demo-mode API. Each handler mirrors a real endpoint's path, payload and response
 * shape (see the Spring controllers), so pages can't tell the difference — and the
 * real backend can replace this file without page changes.
 *
 * Handlers return { status, data, message } and throw HttpError for failures.
 */
import { DEMO_PASSWORD, db, localIso, nextId, nowIso, save } from './db';
import { bus } from './realtime';

export class HttpError extends Error {
  constructor(status, error) {
    super(error);
    this.status = status;
    this.error = error;
  }
}

const ok = (data, message = null) => ({ status: 200, data, message });
const notFound = (what = 'Not found') => {
  throw new HttpError(404, what);
};
const badRequest = (msg) => {
  throw new HttpError(400, msg);
};

// ---------------------------------------------------------------- auth helpers

const sha256 = async (text) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`bms-demo:${text}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
};

const issueToken = (userId) => {
  const token = `demo.${userId}.${crypto.getRandomValues(new Uint32Array(2)).join('')}`;
  db.sessions[token] = userId;
  save();
  return token;
};

const currentUser = (req, required = true) => {
  const id = db.sessions[req.token];
  const user = db.users.find((u) => u.id === id);
  if (!user && required) throw new HttpError(401, 'Invalid or expired session');
  return user || null;
};

const userDto = (u) => ({
  id: u.id,
  fullName: u.fullName,
  username: u.username,
  email: u.email,
  phone: u.phone || null,
  roles: [`ROLE_${u.role}`],
  role: u.role,
});

const authResponse = (u, message) => ({
  token: issueToken(u.id),
  refreshToken: issueToken(u.id),
  id: u.id,
  name: u.fullName,
  username: u.username,
  email: u.email,
  role: u.role,
  message,
});

const publicName = (full) => {
  const parts = String(full || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'Guest';
  return parts.length === 1 ? parts[0] : `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
};

// ---------------------------------------------------------------- salon helpers

const PRIOR_MEAN = 4.0;
const PRIOR_WEIGHT = 5;
const MAIN_SERVICE_FLOOR = 99;

const salonStats = (salonId) => {
  const reviews = db.reviews.filter((r) => r.salonId === salonId);
  const services = db.services.filter((s) => s.salonId === salonId);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const main = services.filter((s) => s.price >= MAIN_SERVICE_FLOOR).map((s) => s.price);
  const all = services.map((s) => s.price);
  return {
    averageRating: Math.round(avg * 10) / 10,
    reviewCount: reviews.length,
    serviceCount: services.length,
    minPrice: main.length ? Math.min(...main) : all.length ? Math.min(...all) : null,
    rankScore: (PRIOR_WEIGHT * PRIOR_MEAN + avg * reviews.length) / (PRIOR_WEIGHT + reviews.length),
  };
};

const salonDto = (s, extra = {}) => {
  const stats = salonStats(s.id);
  delete stats.rankScore; // internal sort key, not part of the API
  return { ...s, distanceKm: null, ...stats, ...extra };
};

const findSalon = (id) => db.salons.find((s) => s.id === Number(id)) || notFound('Salon not found');

const minuteOf = (hhmmss) => {
  const [h, m] = String(hhmmss || '0:0').split(':').map(Number);
  return h * 60 + m;
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (x) => (x * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// ---------------------------------------------------------------- booking helpers

const bookingDto = (b) => {
  const salon = db.salons.find((s) => s.id === b.salonId);
  const customer = db.users.find((u) => u.id === b.customerId);
  return {
    ...b,
    salonName: salon?.name || null,
    salonCity: salon?.city || null,
    salonOwnerId: salon?.ownerId || null,
    customerName: customer?.fullName || 'Customer',
    serviceNames: b.serviceOfferingIds.map((id) => db.services.find((s) => s.id === id)?.name).filter(Boolean),
  };
};

const notify = (userId, type, description, extra = {}) => {
  const n = { id: nextId(), type, description, wasRead: false, userId, createdAt: nowIso(), ...extra };
  db.notifications.push(n);
  bus.emitNotification(userId, n);
};

const overlaps = (salonId, start, end, ignoreId) =>
  db.bookings.some(
    (b) =>
      b.salonId === salonId &&
      b.id !== ignoreId &&
      (b.status === 'PENDING' || b.status === 'CONFIRMED') &&
      new Date(b.startTime) < end &&
      new Date(b.endTime) > start
  );

const ownsSalon = (user, salon) => user.role === 'ADMIN' || salon.ownerId === user.id;

// ---------------------------------------------------------------- analytics

const trendFor = (bookings, days) => {
  const out = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    const key = localIso(d).slice(0, 10);
    const dayBookings = bookings.filter((b) => b.startTime.slice(0, 10) === key && b.status !== 'CANCELLED');
    out.push({ date: key, revenue: dayBookings.reduce((s, b) => s + b.totalPrice, 0), bookings: dayBookings.length });
  }
  return out;
};

const byStatus = (bookings) =>
  ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].reduce(
    (acc, k) => ({ ...acc, [k]: bookings.filter((b) => b.status === k).length }),
    {}
  );

const popular = (bookings) => {
  const counts = new Map();
  bookings.forEach((b) => b.serviceOfferingIds.forEach((id) => counts.set(id, (counts.get(id) || 0) + 1)));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([serviceId, count]) => ({ serviceId, serviceName: db.services.find((s) => s.id === serviceId)?.name || 'Service', count }));
};

// ---------------------------------------------------------------- routes

/** [method, pattern, handler(req, params)] — first match wins. */
export const routes = [
  ['GET', /^\/api\/auth\/health$/, () => ok({ status: 'demo' })],

  ['POST', /^\/api\/auth\/login$/, async (req) => {
    const id = String(req.body?.usernameOrEmail || req.body?.email || '').trim().toLowerCase();
    const user = db.users.find((u) => u.email.toLowerCase() === id || u.username.toLowerCase() === id);
    const password = String(req.body?.password || '');
    const valid =
      user && !user.sample && (user.passwordHash ? user.passwordHash === (await sha256(password)) : password === DEMO_PASSWORD);
    if (!valid) throw new HttpError(401, 'Invalid username/email or password');
    return ok(authResponse(user, 'Login successful'), 'Login successful');
  }],

  ['POST', /^\/api\/auth\/register$/, async (req) => {
    const { name, email, password, phone } = req.body || {};
    const role = req.body?.role === 'SALON_OWNER' ? 'SALON_OWNER' : 'CUSTOMER';
    if (!name || !email || !password) badRequest('All required fields must be filled');
    if (String(password).length < 8) badRequest('Password must be at least 8 characters');
    if (db.users.some((u) => u.email.toLowerCase() === String(email).toLowerCase())) throw new HttpError(409, 'Email already exists');
    const user = {
      id: nextId(),
      fullName: String(name).trim(),
      username: String(email).split('@')[0],
      email: String(email).trim().toLowerCase(),
      phone: phone || '',
      role,
      passwordHash: await sha256(password),
    };
    db.users.push(user);
    save();
    return ok(authResponse(user, 'Registration successful'), 'Registration successful');
  }],

  ['POST', /^\/api\/auth\/forgot-password$/, () =>
    ok(null, 'If an account exists for that email, a reset link has been sent.')],
  ['POST', /^\/api\/auth\/reset-password$/, () => badRequest('Password reset links are not sent in demo mode.')],
  ['POST', /^\/api\/auth\/oauth\/exchange$/, () => badRequest('Google sign-in is not available in demo mode.')],
  ['POST', /^\/api\/auth\/signup\//, () => badRequest('Phone verification is not available in demo mode.')],

  // -------- user
  ['GET', /^\/api\/user\/me$/, (req) => ok(userDto(currentUser(req)), 'Authenticated user details')],
  ['PUT', /^\/api\/user\/me$/, (req) => {
    const user = currentUser(req);
    if (req.body?.fullName != null) {
      if (!String(req.body.fullName).trim()) badRequest('Name is required');
      user.fullName = String(req.body.fullName).trim();
    }
    if (req.body?.phone != null) user.phone = String(req.body.phone).trim();
    save();
    return ok(userDto(user), 'Profile updated');
  }],
  ['PUT', /^\/api\/user\/me\/password$/, async (req) => {
    const user = currentUser(req);
    const { currentPassword, newPassword } = req.body || {};
    const current = user.passwordHash ? user.passwordHash === (await sha256(currentPassword)) : currentPassword === DEMO_PASSWORD;
    if (!current) badRequest('Current password is incorrect');
    if (String(newPassword || '').length < 8) badRequest('New password must be at least 8 characters');
    user.passwordHash = await sha256(newPassword);
    Object.keys(db.sessions).forEach((t) => db.sessions[t] === user.id && delete db.sessions[t]);
    save();
    return ok(null, 'Password updated');
  }],
  ['DELETE', /^\/api\/user\/me$/, (req) => {
    const user = currentUser(req);
    if (db.salons.some((s) => s.ownerId === user.id)) badRequest('Delete or transfer your salon profile first.');
    db.users = db.users.filter((u) => u.id !== user.id);
    save();
    return ok(null, 'Account deleted');
  }],

  // -------- salons (public browse)
  ['GET', /^\/api\/salons\/search$/, (req) => {
    const p = req.params;
    const q = String(p.q || '').trim().toLowerCase();
    const city = String(p.city || '').trim().toLowerCase();
    const minRating = Number(p.minRating) || 0;
    const maxPrice = Number(p.maxPrice) || 0;
    const sort = String(p.sort || 'rating');
    const size = Math.max(1, Math.min(Number(p.size) || 12, 48));
    const page = Math.max(0, Number(p.page) || 0);
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();

    let rows = db.salons.map((s) => ({ s, st: salonStats(s.id) }));
    rows = rows.filter(({ s, st }) => {
      if (city && s.city.toLowerCase() !== city) return false;
      if (minRating && st.averageRating < minRating) return false;
      if (maxPrice && !(st.minPrice != null && st.minPrice <= maxPrice)) return false;
      if (sort === 'price' && st.minPrice == null) return false;
      if (String(p.openNow) === 'true' && !(minuteOf(s.openTime) <= nowMin && nowMin < minuteOf(s.closeTime))) return false;
      if (!q) return true;
      return (
        [s.name, s.address, s.city].some((v) => String(v || '').toLowerCase().includes(q)) ||
        db.services.some((o) => o.salonId === s.id && o.name.toLowerCase().includes(q))
      );
    });
    const cmp = {
      reviews: (a, b) => b.st.reviewCount - a.st.reviewCount || b.st.averageRating - a.st.averageRating,
      price: (a, b) => a.st.minPrice - b.st.minPrice || b.st.rankScore - a.st.rankScore,
      newest: (a, b) => String(b.s.createdAt || '').localeCompare(String(a.s.createdAt || '')) || b.s.id - a.s.id,
      name: (a, b) => a.s.name.localeCompare(b.s.name),
      rating: (a, b) => b.st.rankScore - a.st.rankScore || b.st.reviewCount - a.st.reviewCount,
    }[sort] || ((a, b) => b.st.rankScore - a.st.rankScore);
    rows.sort((a, b) => cmp(a, b) || a.s.id - b.s.id);
    const items = rows.slice(page * size, page * size + size).map(({ s }) => salonDto(s));
    const totalPages = Math.ceil(rows.length / size);
    return ok({ items, page, size, totalItems: rows.length, totalPages, hasNext: page + 1 < totalPages });
  }],

  ['GET', /^\/api\/salons\/insights$/, () => {
    const counts = new Map();
    db.salons.forEach((s) => counts.set(s.city, (counts.get(s.city) || 0) + 1));
    const topCities = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([city, salons]) => ({ city, salons }));
    const avg = db.reviews.length ? db.reviews.reduce((s, r) => s + r.rating, 0) / db.reviews.length : 0;
    return ok({ salons: db.salons.length, cities: counts.size, reviews: db.reviews.length, averageRating: Math.round(avg * 10) / 10, topCities });
  }],

  ['GET', /^\/api\/salons\/nearby$/, (req) => {
    const lat = Number(req.params.lat);
    const lng = Number(req.params.lng);
    const radius = Number(req.params.radius) || 10;
    return ok(
      db.salons
        .filter((s) => s.latitude != null)
        .map((s) => ({ s, d: haversineKm(lat, lng, s.latitude, s.longitude) }))
        .filter(({ d }) => d <= radius)
        .sort((a, b) => a.d - b.d)
        .map(({ s, d }) => salonDto(s, { distanceKm: Math.round(d * 100) / 100 }))
    );
  }],

  ['GET', /^\/api\/salons\/me$/, (req) => {
    const user = currentUser(req);
    return ok(db.salons.filter((s) => s.ownerId === user.id).map((s) => salonDto(s)));
  }],
  ['POST', /^\/api\/salons\/me$/, (req) => {
    const user = currentUser(req);
    if (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN') throw new HttpError(403, 'Only salon owners can create salons');
    const b = req.body || {};
    if (!b.name || !b.city || !b.phoneNumber || !b.email) badRequest('Name, city, phone and email are required');
    if (db.salons.some((s) => s.email.toLowerCase() === String(b.email).toLowerCase())) badRequest('This salon email is already in use. Use a different email.');
    const salon = {
      id: nextId(),
      name: String(b.name).trim(),
      images: Array.isArray(b.images) ? b.images : [],
      address: String(b.address || '').trim(),
      latitude: b.latitude,
      longitude: b.longitude,
      phoneNumber: String(b.phoneNumber).trim(),
      email: String(b.email).trim().toLowerCase(),
      city: String(b.city).trim(),
      ownerId: user.id,
      openTime: `${String(b.openTime || '09:00').slice(0, 5)}:00`,
      closeTime: `${String(b.closeTime || '18:00').slice(0, 5)}:00`,
      description: b.description || null,
      createdAt: nowIso(),
    };
    db.salons.push(salon);
    save();
    return ok(salonDto(salon), 'Salon created successfully');
  }],
  ['GET', /^\/api\/salons\/(\d+)$/, (req, [id]) => ok(salonDto(findSalon(id)))],
  ['PUT', /^\/api\/salons\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    const salon = findSalon(id);
    if (!ownsSalon(user, salon)) throw new HttpError(403, 'You are not allowed to manage this salon');
    const b = req.body || {};
    ['name', 'address', 'city', 'phoneNumber', 'email', 'description', 'latitude', 'longitude', 'images'].forEach((k) => {
      if (b[k] !== undefined && b[k] !== null) salon[k] = typeof b[k] === 'string' ? b[k].trim() : b[k];
    });
    if (b.openTime) salon.openTime = `${String(b.openTime).slice(0, 5)}:00`;
    if (b.closeTime) salon.closeTime = `${String(b.closeTime).slice(0, 5)}:00`;
    save();
    return ok(salonDto(salon), 'Salon updated successfully');
  }],

  // -------- menu
  ['GET', /^\/api\/service-offerings\/salon\/(\d+)$/, (req, [id]) => ok(db.services.filter((s) => s.salonId === Number(id)))],
  ['GET', /^\/api\/categories\/salon\/(\d+)$/, (req, [id]) => ok(db.categories.filter((c) => c.salonId === Number(id)))],
  ['POST', /^\/api\/categories$/, (req) => {
    const user = currentUser(req);
    const salon = findSalon(req.body?.salonId);
    if (!ownsSalon(user, salon)) throw new HttpError(403, 'Not your salon');
    const category = { id: nextId(), name: String(req.body?.name || '').trim() || 'Services', salonId: salon.id };
    db.categories.push(category);
    save();
    return ok(category);
  }],
  ['POST', /^\/api\/service-offerings$/, (req) => {
    const user = currentUser(req);
    const salon = findSalon(req.body?.salonId);
    if (!ownsSalon(user, salon)) throw new HttpError(403, 'Not your salon');
    const b = req.body;
    if (!b.name || !(b.price > 0) || !(b.duration > 0)) badRequest('Name, price and duration are required');
    const offering = { id: nextId(), name: b.name, description: b.description || '', price: Number(b.price), duration: Number(b.duration), salonId: salon.id, categoryId: Number(b.categoryId) };
    db.services.push(offering);
    save();
    return ok(offering);
  }],
  ['PUT', /^\/api\/service-offerings\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    const offering = db.services.find((s) => s.id === Number(id)) || notFound('Service not found');
    if (!ownsSalon(user, findSalon(offering.salonId))) throw new HttpError(403, 'Not your salon');
    ['name', 'description', 'price', 'duration', 'categoryId'].forEach((k) => {
      if (req.body?.[k] != null) offering[k] = ['price', 'duration', 'categoryId'].includes(k) ? Number(req.body[k]) : req.body[k];
    });
    save();
    return ok(offering);
  }],
  ['DELETE', /^\/api\/service-offerings\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    const offering = db.services.find((s) => s.id === Number(id)) || notFound('Service not found');
    if (!ownsSalon(user, findSalon(offering.salonId))) throw new HttpError(403, 'Not your salon');
    db.services = db.services.filter((s) => s.id !== offering.id);
    save();
    return ok(null, 'Service deleted');
  }],

  // -------- reviews
  ['GET', /^\/api\/reviews\/recent$/, (req) => {
    const limit = Math.min(Number(req.params.limit) || 6, 24);
    return ok(
      [...db.reviews]
        .filter((r) => r.rating >= 4)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit)
        .map((r) => {
          const s = db.salons.find((x) => x.id === r.salonId);
          return { ...r, salonName: s?.name, salonCity: s?.city };
        })
    );
  }],
  ['GET', /^\/api\/reviews\/salon\/(\d+)$/, (req, [id]) =>
    ok(db.reviews.filter((r) => r.salonId === Number(id)).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))))],
  ['POST', /^\/api\/reviews\/(\d+)$/, (req) => {
    const user = currentUser(req);
    const { salonId, rating, text } = req.body || {};
    findSalon(salonId);
    if (!(rating >= 1 && rating <= 5)) badRequest('Rating must be between 1 and 5');
    if (String(text || '').trim().length < 10) badRequest('Review text must be at least 10 characters long');
    if (db.reviews.some((r) => r.salonId === Number(salonId) && r.userId === user.id)) {
      throw new HttpError(409, 'You have already reviewed this salon. Edit your existing review instead.');
    }
    const review = { id: nextId(), text: String(text).trim(), rating: Number(rating), salonId: Number(salonId), userId: user.id, reviewerName: publicName(user.fullName), createdAt: nowIso() };
    db.reviews.push(review);
    save();
    return ok(review);
  }],

  // -------- bookings
  ['POST', /^\/api\/bookings\/me$/, (req) => {
    const user = currentUser(req);
    if (user.role !== 'CUSTOMER') throw new HttpError(403, 'Only customers can book');
    const { salonId, startTime, endTime, serviceOfferingIds = [] } = req.body || {};
    const salon = findSalon(salonId);
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (!(start < end) || start < new Date()) badRequest('Choose a time in the future.');
    if (minuteOf(salon.openTime) > start.getHours() * 60 + start.getMinutes() || minuteOf(salon.closeTime) < end.getHours() * 60 + end.getMinutes()) {
      badRequest('That time is outside the salon’s opening hours.');
    }
    if (overlaps(salon.id, start, end)) throw new HttpError(409, 'That slot is already booked');
    const items = db.services.filter((s) => s.salonId === salon.id && serviceOfferingIds.includes(s.id));
    if (!items.length) badRequest('Choose at least one service');
    const booking = {
      id: nextId(),
      salonId: salon.id,
      customerId: user.id,
      startTime,
      endTime,
      serviceOfferingIds: items.map((s) => s.id),
      status: 'PENDING',
      totalPrice: items.reduce((sum, s) => sum + s.price, 0),
      createdAt: nowIso(),
    };
    db.bookings.push(booking);
    notify(salon.ownerId, 'BOOKING_CONFIRMATION', `New booking request #${booking.id} from ${user.fullName}`, { bookingId: booking.id, salonId: salon.id });
    save();
    return ok(bookingDto(booking), 'Booking created');
  }],
  ['GET', /^\/api\/bookings\/salon\/(\d+)\/busy$/, (req, [id]) => {
    const day = String(req.params.date || '').slice(0, 10);
    return ok(
      db.bookings
        .filter((b) => b.salonId === Number(id) && (b.status === 'PENDING' || b.status === 'CONFIRMED'))
        .filter((b) => b.startTime.slice(0, 10) === day || b.endTime.slice(0, 10) === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((b) => ({ start: b.startTime, end: b.endTime }))
    );
  }],
  ['GET', /^\/api\/bookings\/user\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    if (user.id !== Number(id) && user.role !== 'ADMIN') throw new HttpError(403, 'Not allowed');
    return ok(db.bookings.filter((b) => b.customerId === Number(id)).sort((a, b) => b.startTime.localeCompare(a.startTime)).map(bookingDto));
  }],
  ['GET', /^\/api\/bookings\/salon\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    if (!ownsSalon(user, findSalon(id))) throw new HttpError(403, 'Not your salon');
    return ok(db.bookings.filter((b) => b.salonId === Number(id)).sort((a, b) => b.startTime.localeCompare(a.startTime)).map(bookingDto));
  }],
  ['PUT', /^\/api\/bookings\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    const booking = db.bookings.find((b) => b.id === Number(id)) || notFound('Booking not found');
    const salon = findSalon(booking.salonId);
    const isOwner = ownsSalon(user, salon);
    if (!isOwner && booking.customerId !== user.id) throw new HttpError(403, 'Not allowed');
    const { status, startTime, endTime } = req.body || {};
    if (status) {
      const allowed = { PENDING: ['CONFIRMED', 'CANCELLED'], CONFIRMED: ['COMPLETED', 'CANCELLED'] }[booking.status] || [];
      if (!isOwner || !allowed.includes(status)) throw new HttpError(409, `Cannot change a ${booking.status.toLowerCase()} booking to ${status.toLowerCase()}`);
      booking.status = status;
      if (status === 'CONFIRMED') notify(booking.customerId, 'BOOKING_CONFIRMATION', `Booking #${booking.id} has been confirmed`, { bookingId: booking.id });
      if (status === 'CANCELLED') notify(booking.customerId, 'BOOKING_CANCELLATION', `Booking #${booking.id} was cancelled by the salon`, { bookingId: booking.id });
    }
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      if (start < new Date()) badRequest('Choose a time in the future.');
      if (overlaps(booking.salonId, start, end, booking.id)) throw new HttpError(409, 'That slot is already booked');
      booking.startTime = startTime;
      booking.endTime = endTime;
      booking.status = 'PENDING';
    }
    save();
    return ok(bookingDto(booking));
  }],
  ['DELETE', /^\/api\/bookings\/(\d+)$/, (req, [id]) => {
    const user = currentUser(req);
    const booking = db.bookings.find((b) => b.id === Number(id)) || notFound('Booking not found');
    if (booking.customerId !== user.id && !ownsSalon(user, findSalon(booking.salonId))) throw new HttpError(403, 'Not allowed');
    if (booking.status === 'CANCELLED' || booking.status === 'COMPLETED') throw new HttpError(409, 'This booking can no longer be cancelled');
    booking.status = 'CANCELLED';
    const salon = findSalon(booking.salonId);
    notify(salon.ownerId, 'BOOKING_CANCELLATION', `Booking #${booking.id} was cancelled by the customer`, { bookingId: booking.id });
    save();
    return ok(null, 'Booking cancelled');
  }],

  // -------- payments: never simulated as real money
  ['GET', /^\/api\/payments\/config$/, () => ok({ enabled: false })],
  ['GET', /^\/api\/payments\/booking\/(\d+)$/, () => ok([])],
  ['POST', /^\/api\/payments\//, () => badRequest('Online payments are not available in demo mode.')],

  // -------- chat
  ['GET', /^\/api\/chat\/conversations$/, (req) => {
    const user = currentUser(req);
    const mine = db.conversations.filter((c) => c.customerId === user.id || c.salonOwnerId === user.id);
    return ok(
      mine
        .map((c) => {
          const msgs = db.messages.filter((m) => m.conversationId === c.id);
          return { ...conversationNames(c), lastMessage: msgs[msgs.length - 1] || null };
        })
        .sort((a, b) => String(b.lastMessage?.createdAt || '').localeCompare(String(a.lastMessage?.createdAt || '')))
    );
  }],
  ['POST', /^\/api\/chat\/conversations\/with\/(\d+)$/, (req, [otherId]) => {
    const user = currentUser(req);
    const other = Number(otherId);
    const customerId = user.role === 'CUSTOMER' ? user.id : other;
    const ownerId = user.role === 'CUSTOMER' ? other : user.id;
    let convo = db.conversations.find((c) => c.customerId === customerId && c.salonOwnerId === ownerId);
    if (!convo) {
      convo = { id: nextId(), customerId, salonOwnerId: ownerId, createdAt: nowIso() };
      db.conversations.push(convo);
      save();
    }
    return ok(conversationNames(convo));
  }],
  ['GET', /^\/api\/chat\/conversations\/(\d+)\/messages$/, (req, [id]) => {
    const user = currentUser(req);
    const convo = db.conversations.find((c) => c.id === Number(id)) || notFound('Conversation not found');
    if (convo.customerId !== user.id && convo.salonOwnerId !== user.id) throw new HttpError(403, 'Not allowed');
    return ok(db.messages.filter((m) => m.conversationId === convo.id));
  }],
  ['PUT', /^\/api\/chat\/conversations\/(\d+)\/read$/, (req, [id]) => {
    const user = currentUser(req);
    db.messages.forEach((m) => {
      if (m.conversationId === Number(id) && m.receiverId === user.id) m.status = 'READ';
    });
    save();
    return ok(null);
  }],
  ['GET', /^\/api\/chat\/unread-count$/, (req) => {
    const user = currentUser(req);
    return ok({
      unreadMessages: db.messages.filter((m) => m.receiverId === user.id && m.status !== 'READ').length,
      unreadNotifications: db.notifications.filter((n) => n.userId === user.id && !n.wasRead).length,
    });
  }],
  ['GET', /^\/api\/chat\/notifications$/, (req) => {
    const user = currentUser(req);
    const limit = Number(req.params.limit) || 20;
    return ok(db.notifications.filter((n) => n.userId === user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit));
  }],
  ['PUT', /^\/api\/chat\/notifications\/(\d+)\/read$/, (req, [id]) => {
    const user = currentUser(req);
    const n = db.notifications.find((x) => x.id === Number(id) && x.userId === user.id);
    if (n) n.wasRead = true;
    save();
    return ok(null);
  }],

  // -------- analytics
  ['GET', /^\/api\/analytics\/admin\/overview$/, (req) => {
    const user = currentUser(req);
    if (user.role !== 'ADMIN') throw new HttpError(403, 'Admins only');
    const days = Number(req.params.days) || 30;
    const all = db.bookings;
    const customers = new Set(all.map((b) => b.customerId));
    const repeat = [...customers].filter((c) => all.filter((b) => b.customerId === c).length > 1).length;
    const topSalons = db.salons
      .map((s) => {
        const sb = all.filter((b) => b.salonId === s.id && b.status !== 'CANCELLED');
        return { salonId: s.id, name: s.name, city: s.city, bookings: sb.length, revenue: sb.reduce((x, b) => x + b.totalPrice, 0) };
      })
      .filter((s) => s.bookings > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 6);
    return ok({
      totalSalons: db.salons.length,
      totalCustomers: db.users.filter((u) => u.role === 'CUSTOMER').length,
      totalBookings: all.length,
      totalRevenue: all.filter((b) => b.status !== 'CANCELLED').reduce((s, b) => s + b.totalPrice, 0),
      completedRevenue: all.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + b.totalPrice, 0),
      repeatCustomerRate: customers.size ? Math.round((repeat / customers.size) * 100) : 0,
      bookingsByStatus: byStatus(all),
      revenueTrend: trendFor(all, days),
      topSalons,
      popularServices: popular(all),
    });
  }],
  ['GET', /^\/api\/analytics\/salon\/(\d+)\/overview$/, (req, [id]) => {
    const user = currentUser(req);
    const salon = findSalon(id);
    if (!ownsSalon(user, salon)) throw new HttpError(403, 'Not your salon');
    const days = Number(req.params.days) || 30;
    const sb = db.bookings.filter((b) => b.salonId === salon.id);
    const now = new Date();
    const st = salonStats(salon.id);
    return ok({
      salonId: salon.id,
      salonName: salon.name,
      totalBookings: sb.length,
      upcomingBookings: sb.filter((b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.startTime) > now).length,
      completedRevenue: sb.filter((b) => b.status === 'COMPLETED').reduce((s, b) => s + b.totalPrice, 0),
      projectedRevenue: sb.filter((b) => (b.status === 'PENDING' || b.status === 'CONFIRMED') && new Date(b.startTime) > now).reduce((s, b) => s + b.totalPrice, 0),
      averageRating: st.averageRating,
      reviewCount: st.reviewCount,
      bookingsByStatus: byStatus(sb),
      revenueTrend: trendFor(sb, days),
      popularServices: popular(sb),
    });
  }],
];

function conversationNames(c) {
  const customer = db.users.find((u) => u.id === c.customerId);
  const ownerSalon = db.salons.find((s) => s.ownerId === c.salonOwnerId);
  return { ...c, customerName: customer?.fullName || 'Customer', salonOwnerName: ownerSalon?.name || 'Salon' };
}

/** Stores a chat message and fans it out to open conversation views (WebSocket stand-in). */
export const sendChatMessage = (token, { conversationId, receiverId, content, clientMessageId }) => {
  const user = currentUser({ token });
  const convo = db.conversations.find((c) => c.id === Number(conversationId));
  if (!convo || (convo.customerId !== user.id && convo.salonOwnerId !== user.id)) throw new HttpError(403, 'Not allowed');
  const message = {
    id: nextId(),
    conversationId: convo.id,
    senderId: user.id,
    receiverId: Number(receiverId),
    content: String(content).slice(0, 2000),
    clientMessageId,
    status: 'SENT',
    createdAt: nowIso(),
  };
  db.messages.push(message);
  save();
  bus.emitMessage(convo.id, message);
  return message;
};
