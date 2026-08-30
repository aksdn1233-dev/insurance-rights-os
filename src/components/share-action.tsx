import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { SecondaryButton } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';
import { shareLink } from '@/integrations/share';

type ShareContent = Parameters<typeof shareLink>[0];

export function ShareAction({
  content,
  label = '친구에게 공유하기',
}: {
  content: ShareContent;
  label?: string;
}) {
  const [state, setState] = useState<'idle' | 'busy' | 'shared' | 'copied' | 'error'>('idle');

  const onPress = () => {
    setState('busy');
    void shareLink(content)
      .then((result) => setState(result))
      .catch(() => setState('error'));
  };

  const status = {
    idle: '',
    busy: '공유 창을 여는 중이에요.',
    shared: '공유할 앱을 골라 보내주세요.',
    copied: '링크를 복사했어요. 원하는 곳에 붙여 넣으세요.',
    error: '아래 링크를 길게 눌러 복사하세요.',
  }[state];

  return (
    <View style={styles.wrap}>
      <SecondaryButton label={state === 'busy' ? '잠시만요' : label} onPress={onPress} disabled={state === 'busy'} />
      {status ? (
        <Text style={[styles.status, state === 'error' && styles.error]} accessibilityLiveRegion="polite">
          {status}
        </Text>
      ) : null}
      {state === 'error' ? (
        <Text selectable style={styles.manualLink} accessibilityLabel="직접 복사할 공유 링크">
          {content.url}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.sm },
  status: { ...type.caption, color: palette.muted, textAlign: 'center' },
  error: { color: palette.danger },
  manualLink: {
    ...type.caption,
    color: palette.brand,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
