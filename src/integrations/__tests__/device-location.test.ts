import { describe, expect, it, jest } from '@jest/globals';

import { getWebPosition, isPermissionDeniedError } from '../device-location';

describe('device location', () => {
  it('keeps latitude and longitude from a browser location result', async () => {
    const getCurrentPosition = jest.fn((success: PositionCallback) => {
      success({ coords: { latitude: 37.4979, longitude: 127.0276 } } as GeolocationPosition);
    });

    await expect(getWebPosition({ getCurrentPosition } as unknown as Geolocation)).resolves.toEqual({
      latitude: 37.4979,
      longitude: 127.0276,
    });
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), {
      enableHighAccuracy: false,
      maximumAge: 300000,
      timeout: 12000,
    });
  });

  it('distinguishes a denied permission from a location timeout', () => {
    expect(isPermissionDeniedError({ code: 1 })).toBe(true);
    expect(isPermissionDeniedError({ code: 3 })).toBe(false);
    expect(isPermissionDeniedError(new Error('LOCATION_TIMEOUT'))).toBe(false);
  });
});
