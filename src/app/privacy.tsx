import { StyleSheet, Text, View } from 'react-native';

import { DetailRow, Eyebrow, Page, SectionHeader, Surface, TestDataBanner, Title } from '@/components/product-ui';
import { palette, space, type } from '@/constants/product-theme';

export default function PrivacyScreen() {
  return (
    <Page>
      <TestDataBanner />
      <View style={styles.header}>
        <Eyebrow>개인정보·이용 안내</Eyebrow>
        <Title>내 정보가 어떻게{`\n`}쓰이는지 알려드려요.</Title>
        <Text style={styles.copy}>현재 공개 베타는 서버로 보험·진료 정보를 보내지 않아요.</Text>
      </View>

      <View style={styles.section}>
        <SectionHeader title="지금 저장되는 것" />
        <Surface>
          <DetailRow title="연습 진행 상태" detail="이 기기의 브라우저나 앱 안에만 저장해요." />
          <DetailRow title="선택한 서류" detail="내용과 실제 파일 이름을 저장하거나 전송하지 않아요." />
          <DetailRow title="병원 주변 검색" detail="지도 제공사에 지도 중심 좌표를 보내요. 앱 서버에는 위치를 저장하지 않아요." />
          <DetailRow title="공식기관 로그인" detail="각 공식기관 화면에서만 진행해요. 이 앱은 비밀번호를 받지 않아요." last />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="익명 후기·개선점" />
        <Surface>
          <DetailRow
            title="저장하는 내용"
            detail="선택한 의견 종류, 작성한 글, 작성한 화면 경로와 시각을 저장해요."
          />
          <DetailRow
            title="저장하지 않는 내용"
            detail="IP, 기기정보, 위치, 이름과 연락처를 따로 저장하지 않아요."
          />
          <DetailRow
            title="보관 장소와 기간"
            detail="Cloudflare APAC 서버에 암호화해 보관하고 90일이 지나면 매일 자동으로 지워요."
          />
          <DetailRow
            title="민감한 정보는 쓰지 마세요"
            detail="보험번호와 진료 내용은 의견창에 적지 않도록 안내하고, 전화번호·이메일·주민등록번호 형태는 전송 전에 막아요."
            last
          />
        </Surface>
      </View>

      <View style={styles.section}>
        <SectionHeader title="꼭 알아두세요" />
        <Surface>
          <DetailRow title="보험금 지급을 정하지 않아요" detail="화면의 결과는 확인 후보이며 보험사가 최종 결정해요." />
          <DetailRow title="새 치료를 권하지 않아요" detail="이미 정상적으로 받은 진료에서 확인할 권리만 찾아요." />
          <DetailRow title="정식 청구 전 확인하세요" detail="약관, 가입 시점, 서류가 실제 계약과 맞는지 다시 확인해야 해요." last />
        </Surface>
      </View>

      <Text style={styles.footnote}>공개 베타 안내 · 2026년 8월 29일 기준</Text>
    </Page>
  );
}

const styles = StyleSheet.create({
  header: { gap: space.md },
  copy: { ...type.body, color: palette.muted },
  section: { gap: space.lg },
  footnote: { ...type.caption, color: palette.muted },
});
