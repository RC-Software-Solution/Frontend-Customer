// D:\RiceCooker\RC-Customer(ccc)\Frontend-Customer\components\flatList\flatList.tsx
import { View, Text, Image, TouchableOpacity } from 'react-native';
import BouncyCheckbox from 'react-native-bouncy-checkbox';
import React from 'react';
import { MenuItem } from '@/screens/homeTab/home/home.screen'; // Import MenuItem type

interface Props {
  item: MenuItem;
  onPressCheckbox: (meal: string, isChecked: boolean) => void;
  isChecked: boolean;
}

const RenderItem: React.FC<Props> = ({ item, onPressCheckbox, isChecked }) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 10,
        marginVertical: 8,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
      }}
    >
      {/* Food Image */}
      <Image
        source={require('../../assets/plate.jpeg')}
        style={{
          width: 80,
          height: 80,
          borderRadius: 10,
        }}
      />

      {/* Meal Info */}
      <View style={{ flex: 1, marginLeft: 12, justifyContent: 'center' }}>
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#333' }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 12, color: '#777', marginTop: 2 }}>
          {item.description}
        </Text>
        <Text style={{ fontSize: 14, fontWeight: 'bold', marginTop: 5 }}>
          Rs. {item.price.toFixed(2)}
        </Text>
      </View>

      {/* Checkbox */}
      <BouncyCheckbox
        size={25}
        fillColor='#69bf70'
        unFillColor='#FFFFFF'
        iconStyle={{ borderColor: '#69bf70' }}
        innerIconStyle={{ borderWidth: 2 }}
        isChecked={isChecked}
        onPress={(isChecked: boolean) => onPressCheckbox(item.name, isChecked)}
      />
    </View>
  );
};

export default RenderItem;