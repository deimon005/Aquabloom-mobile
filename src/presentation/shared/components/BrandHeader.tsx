import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';

export function BrandHeader() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.header}>
      <View style={styles.row}>
        <View style={styles.mark} accessible={false}>
          <View style={styles.drop} />
          <View style={[styles.wave, { bottom: 12, width: 15 }]} />
          <View style={[styles.wave, { bottom: 9, width: 9 }]} />
        </View>
        <View>
          <Text style={styles.name}>AquaBloom Sur</Text>
          <Text style={styles.subtitle}>Ciencia colaborativa de lagos</Text>
        </View>
        <View style={styles.tag}>
          <View style={styles.dot} />
          <Text style={styles.tagText}>SUR</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  header: { backgroundColor: tokens.colors.navy },
  row: {
    minHeight: 78,
    paddingHorizontal: 22,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: tokens.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drop: {
    width: 18,
    height: 23,
    borderWidth: 1.8,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    transform: [{ rotate: '45deg' }],
  },
  wave: {
    position: 'absolute',
    height: 4,
    borderTopWidth: 1.5,
    borderTopColor: '#FFFFFF',
    borderRadius: 5,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: { color: '#A8C8CE', fontSize: 11, marginTop: 2 },
  tag: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderColor: '#2A505D',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagText: {
    color: '#AEDAD5',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 5,
    backgroundColor: tokens.colors.aqua,
  },
});
