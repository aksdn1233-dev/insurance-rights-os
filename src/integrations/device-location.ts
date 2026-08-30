export type SimplePosition = { latitude: number; longitude: number };

export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error('LOCATION_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function getWebPosition(geolocation = typeof navigator === 'undefined' ? undefined : navigator.geolocation): Promise<SimplePosition> {
  return new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(new Error('LOCATION_UNAVAILABLE'));
      return;
    }
    geolocation.getCurrentPosition(
      (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
      reject,
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 12000 }
    );
  });
}

export function isPermissionDeniedError(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && Number((error as { code: unknown }).code) === 1);
}
