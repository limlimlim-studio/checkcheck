import { useState, useEffect } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Appbar, Text, Button, ActivityIndicator } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import Purchases, { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { Colors } from '../theme';
import { savePremiumStatus } from '../hooks/usePremiumStatus';
import { usePremiumStore } from '../stores/premiumStore';

// RevenueCat 대시보드에서 발급받은 iOS API 키로 교체하세요
export const REVENUECAT_API_KEY_IOS = 'test_cDiAAHedAhYcuFQPHeyoNUoxfTD';
// RevenueCat 대시보드에서 설정한 Entitlement ID
const ENTITLEMENT_ID = 'premium';

export function configurePurchases() {
  Purchases.configure({ apiKey: REVENUECAT_API_KEY_IOS });
}

export default function PremiumScreen() {
  const navigation = useNavigation();
  const isPremium = usePremiumStore((s) => s.isPremium);
  const [pkg, setPkg] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    loadOfferings();
  }, []);

  async function loadOfferings() {
    try {
      const offerings = await Purchases.getOfferings();
      const available = offerings.current?.availablePackages ?? [];
      const lifetime = available.find((p) => p.packageType === PACKAGE_TYPE.LIFETIME) ?? available[0];
      if (lifetime) setPkg(lifetime);
    } catch (e) {
      console.error('[Purchases] getOfferings error:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handlePurchase() {
    if (!pkg) return;
    setPurchasing(true);
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (active) {
        await savePremiumStatus(true);
        Alert.alert('구매 완료', '광고가 제거되었습니다.');
        navigation.goBack();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert('구매 실패', '잠시 후 다시 시도해 주세요.');
      }
    } finally {
      setPurchasing(false);
    }
  }

  async function handleRestore() {
    setRestoring(true);
    try {
      const customerInfo = await Purchases.restorePurchases();
      const active = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (active) {
        await savePremiumStatus(true);
        Alert.alert('복원 완료', '구매 내역이 복원되었습니다.');
        navigation.goBack();
      } else {
        Alert.alert('복원할 구매 내역이 없습니다.');
      }
    } catch (e) {
      Alert.alert('복원 실패', '잠시 후 다시 시도해 주세요.');
    } finally {
      setRestoring(false);
    }
  }

  const priceText = pkg?.product.priceString ?? '';

  return (
    <View style={styles.container}>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="프리미엄" />
      </Appbar.Header>

      <View style={styles.content}>
        {isPremium ? (
          <View style={styles.activeBox}>
            <Text variant="headlineSmall" style={styles.activeTitle}>프리미엄 이용 중</Text>
            <Text variant="bodyMedium" style={styles.activeDesc}>광고 없이 앱을 이용하고 있습니다.</Text>
          </View>
        ) : (
          <>
            <View style={styles.benefitBox}>
              <Text variant="headlineSmall" style={styles.benefitTitle}>광고 제거</Text>
              <Text variant="bodyMedium" style={styles.benefitDesc}>
                일회성 구매로 모든 광고를 영구적으로 제거합니다.{'\n'}
                기기를 바꿔도 구매 복원으로 유지됩니다.
              </Text>
            </View>

            {loading ? (
              <ActivityIndicator color={Colors.text} style={styles.loader} />
            ) : (
              <Button
                mode="contained"
                onPress={handlePurchase}
                loading={purchasing}
                disabled={purchasing || restoring || !pkg}
                style={styles.purchaseBtn}
                contentStyle={styles.btnContent}
              >
                {pkg ? `광고 제거 ${priceText}` : '상품 정보를 불러오는 중...'}
              </Button>
            )}

            <Button
              mode="text"
              onPress={handleRestore}
              loading={restoring}
              disabled={purchasing || restoring}
              style={styles.restoreBtn}
            >
              구매 복원
            </Button>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, padding: 24 },
  benefitBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    marginBottom: 32,
  },
  benefitTitle: { color: Colors.text, fontWeight: '700', marginBottom: 12 },
  benefitDesc: { color: Colors.textSecondary, lineHeight: 22 },
  loader: { marginTop: 8 },
  purchaseBtn: { borderRadius: 8 },
  btnContent: { paddingVertical: 6 },
  restoreBtn: { marginTop: 12, alignSelf: 'center' },
  activeBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  activeTitle: { color: Colors.text, fontWeight: '700', marginBottom: 8 },
  activeDesc: { color: Colors.textSecondary },
});
