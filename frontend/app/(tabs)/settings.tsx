import React, { useEffect, useState } from "react";
import { View, Text, Alert, ActivityIndicator, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router, useFocusEffect } from "expo-router"; // Import useFocusEffect
import { MaterialIcons } from "@expo/vector-icons";
import * as api from "@/api/users";
import isProtected from "@/helpers/isProtected";

// Define the type for user data
type User = {
  username: string;
  age: number;
  gender: string;
  bio?: string; // Optional bio field
};

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Loading state

  const fetchUserData = async () => {
    try {
      const authToken = await AsyncStorage.getItem("token");
      if (authToken) {
        setToken(authToken);

        // Check if the user is protected (logged in)
        const protectedRes = await isProtected();
        if (!protectedRes) {
          router.replace("/"); // Redirect to login if not protected
          return;
        }

        // Fetch user data from AsyncStorage or API
    
          const response = await api.getUser(authToken);
          if (response.success) {
            setUser(response.user);
            await AsyncStorage.setItem("user", JSON.stringify(response.user));
          } else {
            console.error("Failed to fetch user data:", response.message);
          }
      } else {
        router.replace("/"); // Redirect to login if no token is found
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false); // Stop loading after fetching data
    }
  };

  // Use useFocusEffect to re-fetch data when the screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchUserData();
    }, [])
  );

  // Logout function
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Delete account function
  const deleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await api.deleteAccount(token || "");
              if (response.success) {
                await AsyncStorage.removeItem("token");
                await AsyncStorage.removeItem("user");
                router.replace("/");
              }
            } catch (error) {
              console.error("Error deleting account:", error);
            }
          },
        },
      ]
    );
  };

  // Edit profile function
  const editProfile = () => {
    router.push("/edit-profile"); // Navigate to the edit profile screen
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-yellow-50">
        <ActivityIndicator size="large" color="#F4CE14" />
        <Text className="mt-2 text-yellow-900">Loading...</Text>
      </View>
    );
  }

  // Show error message if no user data is found
  if (!user) {
    return (
      <View className="flex-1 justify-center items-center bg-yellow-50">
        <Text className="text-yellow-900">Failed to load user data.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 p-5 bg-yellow-50">
      {/* User Profile Section */}
      <View className="bg-white rounded-xl shadow-lg p-6 items-center mb-8">
        <MaterialIcons name="account-circle" size={80} color="#F4CE14" />
        <Text className="text-3xl font-bold text-yellow-900 mt-2">
          {user.username}
        </Text>

        {/* Age and Gender Display */}
        <View className="flex-row justify-between w-full mt-6">
          <View className="bg-yellow-100 rounded-lg p-4 items-center w-[48%]">
            <Text className="text-yellow-900 text-lg font-semibold">Age</Text>
            <Text className="text-yellow-900 text-2xl">{user.age}</Text>
          </View>
          <View className="bg-yellow-100 rounded-lg p-4 items-center w-[48%]">
            <Text className="text-yellow-900 text-lg font-semibold">Gender</Text>
            <Text className="text-yellow-900 text-2xl capitalize">
              {user.gender}
            </Text>
          </View>
        </View>

        {/* Bio Section */}
        {user.bio && (
          <View className="w-full mt-6">
            <Text className="text-yellow-900 text-lg font-semibold">Bio</Text>
            <Text className="text-yellow-900 text-base mt-2">{user.bio}</Text>
          </View>
        )}
      </View>

      {/* Actions Section */}
      <View className="flex-1">
  <TouchableOpacity
    onPress={editProfile}
    className="bg-yellow-500 rounded-lg p-4 items-center mb-4"
  >
    <Text className="text-white text-lg font-bold">Edit Profile</Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={logout}
    className="bg-red-500 rounded-lg p-4 items-center mb-4"
  >
    <Text className="text-white text-lg font-bold">Logout</Text>
  </TouchableOpacity>
  <TouchableOpacity
    onPress={deleteAccount}
    className="bg-red-500 rounded-lg p-4 items-center"
  >
    <Text className="text-white text-lg font-bold">Delete Account</Text>
  </TouchableOpacity>
</View>
    </View>
  );
}