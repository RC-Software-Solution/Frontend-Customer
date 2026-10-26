import { View, Image } from "react-native";
import BouncyCheckbox from "react-native-bouncy-checkbox";
import React from "react";
import { MenuItem } from "@/screens/homeTab/home/home.screen"; // Import MenuItem type
import { Card } from "@/components/ui/Card";
import { AppText } from "@/components/ui/AppText";
import { color, radius, space } from "@/theme";

interface Props {
  item: MenuItem;
  onPressCheckbox: (meal: string, isChecked: boolean) => void;
  isChecked: boolean;
  /** session not open: shown but can't be selected */
  disabled?: boolean;
}

const RenderItem: React.FC<Props> = ({
  item,
  onPressCheckbox,
  isChecked,
  disabled = false,
}) => {
  return (
    <Card
      style={{
        flexDirection: "row",
        alignItems: "center",
        opacity: disabled ? 0.55 : 1,
        padding: space.sm + 2,
        marginBottom: space.sm,
      }}
    >
      {/* Food Image */}
      <Image
        source={require("../../assets/plate.jpeg")}
        resizeMode="cover"
        style={{
          width: 72,
          height: 72,
          borderRadius: radius.md,
          backgroundColor: color.field,
        }}
      />

      {/* Meal Info */}
      {/* flexGrow/flexShrink (not flex: 1): a zero flex-basis makes Android measure the text at ~0 width, one character per line, blowing up the row height */}
      <View
        style={{
          flexGrow: 1,
          flexShrink: 1,
          marginLeft: 12,
          justifyContent: "center",
        }}
      >
        <AppText variant="body" weight="bold">
          {item.name}
        </AppText>
        <AppText
          variant="caption"
          tone="muted"
          numberOfLines={2}
          style={{ marginTop: 2 }}
        >
          {item.description}
        </AppText>
        <AppText variant="caption" weight="bold" style={{ marginTop: 5 }}>
          Rs. {item.price.toFixed(2)}
        </AppText>
      </View>

      {/* Checkbox: padding 12 around the 25 dp box makes a 49 dp touch target */}
      <BouncyCheckbox
        disableText
        disabled={disabled}
        testID={`select-${item.name}`}
        style={{ alignSelf: "center", marginLeft: 8, padding: 12 }}
        size={25}
        fillColor={color.brandStrong}
        unFillColor={color.surface}
        iconStyle={{ borderColor: color.brandStrong }}
        innerIconStyle={{ borderWidth: 2 }}
        isChecked={isChecked}
        onPress={(isChecked: boolean) => onPressCheckbox(item.name, isChecked)}
      />
    </Card>
  );
};

export default React.memo(RenderItem);
