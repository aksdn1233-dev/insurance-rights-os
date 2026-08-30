import * as Clipboard from 'expo-clipboard';
import { Platform, Share } from 'react-native';

export type ShareResult = 'shared' | 'copied';

type ShareLinkInput = {
  title: string;
  message: string;
  url: string;
};

export async function shareLink(input: ShareLinkInput): Promise<ShareResult> {
  try {
    await Share.share({
      title: input.title,
      message: Platform.OS === 'android' ? `${input.message}\n${input.url}` : input.message,
      url: input.url,
    });
    return 'shared';
  } catch {
    try {
      const copied = await Clipboard.setStringAsync(`${input.message}\n${input.url}`);
      if (!copied) {
        throw new Error('clipboard_unavailable');
      }
      return 'copied';
    } catch {
      throw new Error('share_unavailable');
    }
  }
}

export const productShare = {
  title: '내 보험 권리 찾기',
  message: '받은 치료를 고르면 내 보험에서 확인할 내용과 필요한 서류를 쉽게 알려줘요.',
  url: 'https://insurance-rights-korea.pages.dev/',
} as const;

export const eventShare = {
  title: '권리찾기 공개 베타 이벤트',
  message: '권리찾기를 직접 써보고 솔직한 후기와 개선점을 남겨보세요.',
  url: 'https://insurance-rights-korea.pages.dev/event',
} as const;
