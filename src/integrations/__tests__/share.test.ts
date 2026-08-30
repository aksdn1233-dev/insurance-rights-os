import { describe, expect, it, jest } from '@jest/globals';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';

import { productShare, shareLink } from '@/integrations/share';

describe('share link', () => {
  it('opens the platform share sheet with the public product link', async () => {
    const share = jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

    await expect(shareLink(productShare)).resolves.toBe('shared');
    expect(share).toHaveBeenCalledWith(
      expect.objectContaining({
        title: '보험의 달인',
        url: 'https://insurance-rights-korea.pages.dev/',
      }),
    );

    share.mockRestore();
  });

  it('copies the link when the platform share sheet is unavailable', async () => {
    const share = jest.spyOn(Share, 'share').mockRejectedValue(new Error('unavailable'));
    const clipboard = jest.spyOn(Clipboard, 'setStringAsync').mockResolvedValue(true);

    await expect(shareLink(productShare)).resolves.toBe('copied');
    expect(clipboard).toHaveBeenCalledWith(expect.stringContaining(productShare.url));

    share.mockRestore();
    clipboard.mockRestore();
  });
});
