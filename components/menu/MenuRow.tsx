import React from 'react';
import { View, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import { removeItem, updateQuantity } from '@/store/cartSlice';
import { FoodItem } from '@/services/types/api.types';
import { Card } from '@/components/ui/Card';
import { AppText } from '@/components/ui/AppText';
import { color, radius, space } from '@/theme';

type Props = {
  item: FoodItem;
  /** how many of this dish are in the cart (0 = not in it) */
  quantity: number;
  /** session not open: shown but can't be added */
  disabled: boolean;
  onAdd: (item: FoodItem) => void;
};

const MenuRow = ({ item, quantity, disabled, onAdd }: Props) => {
  const dispatch = useDispatch();
  const id = String(item.id); // the cart id the Menu screen gives this dish

  const decrease = () =>
    dispatch(quantity === 1 ? removeItem(id) : updateQuantity({ id, type: 'decrease' }));

  return (
    <Card style={styles.row}>
      <Image
        source={item.image_url ? { uri: item.image_url } : require('../../assets/plate.jpeg')}
        resizeMode="cover"
        style={styles.thumb}
      />

      {/* flexGrow/flexShrink (not flex: 1): a zero flex-basis makes Android measure the text at ~0 width, one character per line, blowing up the row height */}
      <View style={styles.info}>
        <AppText variant="body" weight="bold">
          {item.name}
        </AppText>
        <AppText variant="caption" tone="muted" numberOfLines={2} style={{ marginTop: 2 }}>
          {item.description}
        </AppText>
        <AppText variant="caption" weight="bold" style={{ marginTop: space.xs }}>
          Rs. {parseFloat(item.price).toFixed(2)}
        </AppText>
      </View>

      {quantity > 0 && !disabled ? (
        <View style={styles.stepperRow}>
          <TouchableOpacity
            onPress={decrease}
            style={[styles.stepper, { backgroundColor: color.field }]}
            accessibilityRole="button"
            accessibilityLabel={`Decrease quantity of ${item.name}`}
          >
            <Ionicons name="remove" size={22} color={color.ink} />
          </TouchableOpacity>
          <AppText variant="body" weight="bold" style={styles.quantity}>
            {quantity}
          </AppText>
          <TouchableOpacity
            onPress={() => dispatch(updateQuantity({ id, type: 'increase' }))}
            style={[styles.stepper, { backgroundColor: color.brand }]}
            accessibilityRole="button"
            accessibilityLabel={`Increase quantity of ${item.name}`}
          >
            <Ionicons name="add" size={22} color={color.onBrand} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={() => onAdd(item)}
          disabled={disabled}
          style={[styles.add, { backgroundColor: disabled ? color.field : color.brand }]}
          accessibilityRole="button"
          accessibilityLabel={`Add ${item.name}`}
          accessibilityState={{ disabled }}
        >
          <AppText variant="caption" weight="bold" tone={disabled ? 'subtle' : 'onBrand'}>
            Add
          </AppText>
        </TouchableOpacity>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm + space.xs, padding: space.sm + space.xs },
  thumb: { width: 72, height: 72, borderRadius: radius.md, backgroundColor: color.field },
  info: { flexGrow: 1, flexShrink: 1, justifyContent: 'center' },
  add: { minHeight: 48, minWidth: 72, paddingHorizontal: space.md, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  stepper: { width: 48, height: 48, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  quantity: { minWidth: 20, textAlign: 'center' },
});

export default React.memo(MenuRow);
