export function getAnonId(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const key = "edcalmsim_anon_id";
  const existing = window.localStorage.getItem(key);
  if (existing) {
    return existing;
  }

  const newId = window.crypto.randomUUID();
  window.localStorage.setItem(key, newId);
  return newId;
}
