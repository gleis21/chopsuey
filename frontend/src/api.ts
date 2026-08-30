// Typed wrapper around the backend API. The app is proxied under /buchungssystem
// in production (Caddy strips it) and served directly at /api in dev behind the
// same proxy, so relative /buchungssystem/api is resolved by the browser against
// the current origin once the prefix is applied. To be robust regardless of the
// mount prefix, build URLs from window.location.pathname's prefix segment where
// possible; here we use a small helper that derives the prefix.

export function apiPrefix(): string {
  const segs = window.location.pathname.split('/');
  // When served under /buchungssystem/... the first segment is the prefix.
  // Otherwise fall back to an empty prefix (direct /api access).
  const first = segs[1] ?? '';
  return first === 'buchungssystem' ? '/buchungssystem' : '';
}

const base = `${apiPrefix()}/api`;

// Resolve a static asset served from the backend's public folder. Images/layout
// live under /buchungssystem/images etc., so prefix consistently with the mount.
export function assetUrl(p: string): string {
  return `${apiPrefix()}/images/${p.replace(/^\//, '')}`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init
  });
  const json = await res.json();
  return json as T;
}

export type Booking = {
  id?: string;
  name?: string;
  notes?: string;
  participantsCount?: number;
  person: Record<string, any>;
  isNGO?: boolean;
  workTypeFloor?: boolean;
  workTypePaint?: boolean;
  equipment: Equipment[];
  timeSlots: TimeSlot[];
  hau?: string;
  customerEmail?: string;
  sendAutoMail?: boolean;
};

export type Equipment = {
  id: string;
  name: string;
  count: number;
  description?: string;
  quantity?: number;
  position?: number;
  notesTitle?: string;
  notes?: string | null;
};

export type TimeSlot = {
  id?: number;
  roomId: string;
  type: string;
  moeblierung: string;
  beginnDate: string;
  beginnH: number;
  beginnM: number;
  endH: number;
  endM: number;
  notes: string;
};

type JsonEnvelope<T> = { res: T; err: number | null };

export async function createBooking(payload: {
  name: string;
  customerEmail: string;
  sendAutoMail: boolean;
}): Promise<JsonEnvelope<{ editUrl: string; email: string; pin: string }>> {
  return request('/bookings', { method: 'POST', body: JSON.stringify(payload) });
}

export async function updateBooking(id: string, payload: any): Promise<JsonEnvelope<any>> {
  return request(`/bookings/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
}

export async function getBooking(id: string): Promise<JsonEnvelope<Booking>> {
  return request(`/bookings/${id}`);
}

export async function getRooms(id: string): Promise<JsonEnvelope<{ id: string; name: string }[]>> {
  return request(`/bookings/${id}/availablerooms`);
}

export async function getEquipment(id: string): Promise<JsonEnvelope<Equipment[]>> {
  return request(`/bookings/${id}/availableequipment`);
}

export async function getBookedEquipment(id: string): Promise<
  JsonEnvelope<{ equipmentId: string; numberBooked: number; notes: string }[]>
> {
  return request(`/bookings/${id}/bookedequipment`);
}

export async function getEventTimeSlots(id: string): Promise<JsonEnvelope<TimeSlot[]>> {
  return request(`/bookings/${id}/eventtimeslots`);
}
