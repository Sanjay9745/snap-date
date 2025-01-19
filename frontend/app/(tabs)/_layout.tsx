 // @ts-ignore 
import React, { useState } from "react";
import { Tabs } from "expo-router";
import { View, Pressable, Animated, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const CustomTabBar = ({ state, descriptors, navigation }:any) => {
  const [animation] = useState(new Animated.Value(0));

  const animateIcon = (index:any) => {
    Animated.spring(animation, {
      toValue: index,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.tabBar}>
      {state.routes.map((route:any, index:any) => {
        const { options } = descriptors[route.key];
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
            animateIcon(index);
          }
        };

        const iconScale = animation.interpolate({
              inputRange: state.routes.map((_: any, i: any) => i),
              outputRange: state.routes.map((_: any, i: any) => (i === index ? 1.2 : 1)),
            });

            const iconTranslateY = animation.interpolate({
              inputRange: state.routes.map((_: any, i: any) => i),
              outputRange: state.routes.map((_: any, i: any) => (i === index ? -15 : 0)),
            });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
          >
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
                },
              ]}
            >
              <MaterialIcons
                name={options.tabBarIconName}
                size={24}
                color={isFocused ? "#F4CE14" : "#6B7280"}
              />
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
};

export default function RootLayout() {
  return (
    <Tabs
      tabBar={(props:any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          tabBarIconName: "home", // Icon name for the custom tab bar
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIconName: "settings", // Icon name for the custom tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    height: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
});