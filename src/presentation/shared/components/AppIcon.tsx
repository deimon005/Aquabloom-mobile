import { View, type ViewStyle, type ColorValue } from 'react-native';
import { tokens } from '../theme/tokens';

export type IconName =
  | 'grid'
  | 'lake'
  | 'map'
  | 'user'
  | 'arrow'
  | 'search'
  | 'check'
  | 'shield'
  | 'pin';
export function AppIcon({
  name,
  color = tokens.colors.primary,
  size = 24,
}: {
  name: IconName;
  color?: ColorValue;
  size?: number;
}) {
  const stroke = (style: ViewStyle, key: number) => (
    <View
      key={key}
      style={[
        { position: 'absolute', borderWidth: 1.8, borderColor: color },
        style,
      ]}
    />
  );
  const line = (
    left: number,
    top: number,
    width: number,
    angle: string,
    key: number,
  ) => (
    <View
      key={key}
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height: 1.8,
        borderRadius: 2,
        backgroundColor: color,
        transform: [{ rotate: angle }],
      }}
    />
  );
  let drawing;
  switch (name) {
    case 'grid':
      drawing = [
        [3, 3],
        [14, 3],
        [3, 14],
        [14, 14],
      ].map(([left, top], i) =>
        stroke({ left, top, width: 7, height: 7, borderRadius: 1.5 }, i),
      );
      break;
    case 'user':
      drawing = [
        stroke({ left: 8, top: 2, width: 8, height: 8, borderRadius: 8 }, 0),
        stroke(
          {
            left: 4,
            top: 14,
            width: 16,
            height: 8,
            borderTopLeftRadius: 9,
            borderTopRightRadius: 9,
            borderBottomWidth: 0,
          },
          1,
        ),
      ];
      break;
    case 'map':
      drawing = [
        stroke(
          {
            left: 2,
            top: 4,
            width: 7,
            height: 16,
            transform: [{ skewY: '-18deg' }],
          },
          0,
        ),
        stroke(
          {
            left: 8,
            top: 4,
            width: 7,
            height: 16,
            transform: [{ skewY: '18deg' }],
          },
          1,
        ),
        stroke(
          {
            left: 14,
            top: 4,
            width: 7,
            height: 16,
            transform: [{ skewY: '-18deg' }],
          },
          2,
        ),
      ];
      break;
    case 'arrow':
      drawing = [line(9, 8, 9, '45deg', 0), line(9, 14, 9, '-45deg', 1)];
      break;
    case 'search':
      drawing = [
        stroke({ left: 2, top: 2, width: 14, height: 14, borderRadius: 14 }, 0),
        line(14, 18, 8, '45deg', 1),
      ];
      break;
    case 'check':
      drawing = [line(3, 13, 8, '45deg', 0), line(8, 10, 14, '-45deg', 1)];
      break;
    case 'shield':
      drawing = [
        stroke(
          {
            left: 4,
            top: 2,
            width: 16,
            height: 20,
            borderTopLeftRadius: 4,
            borderTopRightRadius: 4,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 12,
          },
          0,
        ),
        line(7, 12, 5, '45deg', 1),
        line(10, 10, 8, '-45deg', 2),
      ];
      break;
    case 'pin':
      drawing = [
        stroke({ left: 5, top: 2, width: 14, height: 17, borderRadius: 12 }, 0),
        stroke({ left: 10, top: 7, width: 4, height: 4, borderRadius: 4 }, 1),
        line(10, 20, 5, '45deg', 2),
      ];
      break;
    default:
      drawing = (
        <View
          style={{
            position: 'absolute',
            left: 4,
            top: 3,
            width: 16,
            height: 18,
            backgroundColor: color,
            borderTopLeftRadius: 5,
            borderTopRightRadius: 12,
            borderBottomLeftRadius: 12,
            borderBottomRightRadius: 8,
            transform: [{ rotate: '-25deg' }],
          }}
        />
      );
  }
  return (
    <View
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ width: size, height: size }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          transform: [{ scale: size / 24 }],
          transformOrigin: 'top left',
        }}
      >
        {drawing}
      </View>
    </View>
  );
}
