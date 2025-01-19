import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import * as api from "@/api/users";
import isProtected from "@/helpers/isProtected";

export default function EditProfile() {
  const [username, setUsername] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [bio, setBio] = useState("");
  const [errors, setErrors] = useState({
    age: "",
    gender: "",
    bio: "",
  });

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const authToken = await AsyncStorage.getItem("token");
        if (authToken) {
          // Check if the user is protected (logged in)
          const protectedRes = await isProtected();
          if (!protectedRes) {
            router.replace("/"); // Redirect to login if not protected
            return;
          }

          // Fetch user details
          const response = await api.getUser(authToken);
          if (response.success) {
            // Set default values for the form fields
            setUsername(response.user.username || "");
            setAge(response.user.age?.toString() || "");
            setGender(response.user.gender || "");
            setBio(response.user.bio || "");
          } else {
            console.error("Failed to fetch user data:", response.message);
          }
        } else {
          router.replace("/"); // Redirect to login if no token is found
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const saveProfile = async () => {
    // Reset errors
    setErrors({
      age: "",
      gender: "",
      bio: "",
    });

    let hasError = false;
    const newErrors = { age: "", gender: "", bio: "" };

    // Validate age
    if (!age.trim()) {
      newErrors.age = "Age is required.";
      hasError = true;
    } else if (isNaN(Number(age)) || Number(age) < 0) {
      newErrors.age = "Age must be a valid number.";
      hasError = true;
    }

    // Validate gender
    if (!gender.trim()) {
      newErrors.gender = "Gender is required.";
      hasError = true;
    }

    // Validate bio (optional)
    if (bio.length > 200) {
      newErrors.bio = "Bio must be less than 200 characters.";
      hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      return;
    }

    // Save profile if no errors
    let authToken: any = await AsyncStorage.getItem("token");
    let response = await api.updateUser(
      {
        age: parseInt(age),
        gender,
        bio,
      },
      authToken
    );

    if (response.success) {
      let user = {username:response.user.username, age:response.user.age, gender:response.user.gender, bio:response.user.bio};
      await AsyncStorage.setItem("user", JSON.stringify(user));
    }
    router.replace("/settings");
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <View className="flex-1 p-6 bg-yellow-50">
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.push("/settings")}
        className="absolute top-10 left-6 z-10"
      >
        <MaterialIcons name="arrow-back" size={24} color="#F4CE14" />
      </TouchableOpacity>

      {/* Form Header */}
      <Text className="text-3xl font-bold text-yellow-900 mt-16 mb-6">
        Edit Profile
      </Text>

      {/* Age Field */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-yellow-900 mb-2">Age</Text>
        <TextInput
          className={`border ${
            errors.age ? "border-red-500" : "border-yellow-300"
          } rounded-lg p-3 bg-yellow-100 text-yellow-900`}
          value={age}
          onChangeText={(text) => {
            const age = text.replace(/[^0-9]/g, ''); // Ensure only numeric input
            if (Number(age) <= 100) { // Set max age limit to 100
              setAge(age);
            }
          }}
          placeholder="Enter your age"
          placeholderTextColor="#A1A1AA"
          keyboardType="numeric"
        />
        {errors.age ? (
          <Text className="text-red-500 mt-1">{errors.age}</Text>
        ) : null}
      </View>

      {/* Gender Field */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-yellow-900 mb-2">Gender</Text>
        <View className="flex-row justify-between">
          {["male", "female", "other"].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => setGender(option)}
              className={`flex-1 mx-1 border ${
                errors.gender ? "border-red-500" : "border-yellow-300"
              } rounded-lg p-2 items-center ${
                gender === option ? "bg-yellow-500" : "bg-yellow-100"
              }`}
            >
              <MaterialIcons
                name={
                  option === "male"
                    ? "male"
                    : option === "female"
                    ? "female"
                    : "person-outline"
                }
                size={20}
                color={gender === option ? "#FFFFFF" : "#78350F"}
              />
              <Text
                className={`text-sm font-semibold mt-1 ${
                  gender === option ? "text-white" : "text-yellow-900"
                }`}
              >
                {capitalizeFirstLetter(option)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {errors.gender ? (
          <Text className="text-red-500 mt-1">{errors.gender}</Text>
        ) : null}
      </View>

      {/* Bio Field */}
      <View className="mb-6">
        <Text className="text-lg font-semibold text-yellow-900 mb-2">Bio</Text>
        <TextInput
          className={`border ${
            errors.bio ? "border-red-500" : "border-yellow-300"
          } rounded-lg p-3 bg-yellow-100 text-yellow-900 h-32`}
          value={bio}
          onChangeText={setBio}
          placeholder="Tell us about yourself"
          placeholderTextColor="#A1A1AA"
          multiline
        />
        {errors.bio ? (
          <Text className="text-red-500 mt-1">{errors.bio}</Text>
        ) : null}
      </View>

      {/* Save Button */}
      <TouchableOpacity
        onPress={saveProfile}
        className="bg-yellow-500 rounded-lg p-3 items-center"
      >
        <Text className="text-white text-lg font-semibold">Save Profile</Text>
      </TouchableOpacity>
    </View>
  );
}