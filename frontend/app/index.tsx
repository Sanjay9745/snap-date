import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as api from '../api/users';
import { router } from 'expo-router';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface FormData {
  username?: string; // Optional field
  email: string;
  age: string;
  gender: string;
}

interface FormErrors {
  username?: string; // Optional field
  email?: string;
  age: string;
  gender: string;
}

export default function FormScreen() {
  const [token, setToken] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    username: '', // Initialize with an empty string
    email: '',
    age: '',
    gender: ''
  });

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errors, setErrors] = useState<FormErrors>({
    username: '',
    email: '',
    age: '',
    gender: ''
  });

  useEffect(() => {
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Permission to access location was denied');
        return;
      }

      let currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    };

    getLocation();
  }, []);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          setToken(storedToken);
          let protectedRes = await api.protectedRoute(storedToken);
          if (protectedRes.success) {
            router.replace('/(tabs)/home');
          }
        }
      } catch (error) {
        console.error('Error checking token:', error);
      }
    };

    checkToken();
  }, []);

  const handleSubmit = async () => {
    let valid = true;
    let newErrors: FormErrors = {
      username: '',
      email: '',
      age: '',
      gender: ''
    };

    // Validate username (if required)
    if (!formData.username?.trim()) {
      newErrors.username = 'Username is required';
      valid = false;
    }

    // Validate age
    if (!formData.age.trim()) {
      newErrors.age = 'Age is required';
      valid = false;
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 18) {
      newErrors.age = 'Must be 18 or older';
      valid = false;
    }

    // Validate gender
    if (!formData.gender.trim()) {
      newErrors.gender = 'Gender is required';
      valid = false;
    }

    setErrors(newErrors);

    if (valid && location) {
      try {
        const response = await api.createOrFindUser(
          formData.username || '', // Ensure username is not undefined
          formData.gender,
          Number(formData.age),
          location.coords.latitude,
          location.coords.longitude
        );

        if (response.success) {
          await AsyncStorage.setItem('token', response.token);
          setToken(response.token);
          router.replace('/(tabs)/home');
        } else {
          setErrors(response.errors || {}); // Ensure errors is not undefined
        }
      } catch (error) {
        console.error('Form submission error:', error);
        Alert.alert('Error', 'Failed to submit the form. Please try again.');
      }
    }
  };

  const capitalizeFirstLetter = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  return (
    <ScrollView className="flex-1 bg-yellow-50 p-4">
      <View className="space-y-6">
        {/* Welcome Image */}
        <View className="items-center mb-6">
          <Image
            source={require('../assets/images/welcome.png')} // Replace with your image path
            style={{ width: 300, height: 300 }}
            resizeMode="cover"
          />
        </View>

        {/* Form Header */}
        <Text className="text-3xl font-bold text-yellow-900 mb-6">Create Profile</Text>

        {/* Username Field */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-yellow-900 mb-2">Snapchat Username</Text>
          <TextInput
            className="w-full p-3 border border-yellow-300 rounded-lg bg-yellow-100 text-yellow-900"
            value={formData.username || ''} // Ensure value is not undefined
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            placeholder="Enter username"
            placeholderTextColor="#A1A1AA"
          />
          {errors.username ? (
            <Text className="text-red-500 mt-1">{errors.username}</Text>
          ) : null}
        </View>

        {/* Age Field */}
        <View className="mb-6">
          <Text className="text-lg font-semibold text-yellow-900 mb-2">Age</Text>
          <TextInput
            className="w-full p-3 border border-yellow-300 rounded-lg bg-yellow-100 text-yellow-900"
            value={formData.age}
            onChangeText={(text) => {
              const age = text.replace(/[^0-9]/g, ''); // Ensure only numeric input
              if (Number(age) <= 100) { // Set max age limit to 100
          setFormData(prev => ({ ...prev, age }));
              }
            }}
            placeholder="Enter age"
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
            {['male', 'female', 'other'].map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => setFormData(prev => ({ ...prev, gender: option }))}
                className={`flex-1 mx-1 border border-yellow-300 rounded-lg p-2 items-center ${
                  formData.gender === option ? 'bg-yellow-500' : 'bg-yellow-100'
                }`}
              >
                <MaterialIcons
                  name={
                    option === 'male'
                      ? 'male'
                      : option === 'female'
                      ? 'female'
                      : 'person-outline'
                  }
                  size={20}
                  color={formData.gender === option ? '#FFFFFF' : '#78350F'}
                />
                <Text
                  className={`text-sm font-semibold mt-1 ${
                    formData.gender === option ? 'text-white' : 'text-yellow-900'
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

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          className="bg-yellow-500 p-4 rounded-lg"
        >
          <Text className="text-white text-center font-bold text-lg">Submit</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}