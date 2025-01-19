import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  ListRenderItem,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import MultiSlider from '@ptomasroos/react-native-multi-slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import debounce from 'lodash.debounce';
import * as api from '@/api/users';
import { router } from 'expo-router';
import isProtected from '@/helpers/isProtected';
import openSnapchatAddFriend from '@/helpers/openSnapchatAddFriend';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface User {
  _id: string;
  username: string;
  age: number;
  location: string;
  gender: 'male' | 'female' | 'other';
  away?: number;
}

interface Filters {
  ageRange: {
    min: number;
    max: number;
  };
  selectedGender: 'All' | 'Male' | 'Female' | 'Non-binary';
  nearbyRange: number;
  anywhere?: boolean;
}

const ITEMS_PER_PAGE = 10;

const EmptyState: React.FC = () => (
  <View className="flex-1 justify-center items-center p-4">
    <MaterialIcons name="people-outline" size={48} color="#F4CE14" />
    <Text className="text-lg font-semibold text-gray-700 mt-4">No Users Found</Text>
    <Text className="text-gray-500 text-center mt-2">
      Try adjusting your filters to find more users
    </Text>
  </View>
);

const Home: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [token, setToken] = useState<string>('');

  const [filters, setFilters] = useState<Filters>({
    ageRange: { min: 18, max: 99 },
    selectedGender: 'All',
    nearbyRange: 10,
    anywhere: true,
  });

  const isMounted = useRef(true); // To track if the component is mounted

  useEffect(() => {
    return () => {
      isMounted.current = false; // Cleanup on unmount
    };
  }, []);

  const loadUsers = async (resetData: boolean = false): Promise<void> => {
    if (!isMounted.current) return; // Prevent state updates if unmounted
  
    if (resetData) {
      setLoading(true);
      setPage(1); // Reset to the first page
    } else if (loading || !hasMore) {
      return; // Prevent duplicate or unnecessary calls
    }
  
    try {
      let authToken: any = token;
      if (!authToken) {
        authToken = await AsyncStorage.getItem('token');
        setToken(authToken || '');
        if (!authToken) {
          return;
        }
      }
  
      const options = {
        page: resetData ? 1 : page, // Use page 1 if resetting data
        limit: ITEMS_PER_PAGE,
        minAge: filters.ageRange.min,
        maxAge: filters.ageRange.max,
        gender: filters.selectedGender === 'All' ? undefined : filters.selectedGender,
        anywhere: filters.anywhere,
        maxDistance: filters.nearbyRange,
      };
  
      const response = await api.getUsers(options, authToken);
  
      if (!isMounted.current) return; // Prevent state updates if unmounted
  
      const newUsers = response?.users || [];
  
      // Remove duplicates based on `_id`
      const uniqueUsers = resetData
        ? newUsers // If resetting data, use the new users directly
        : [...users, ...newUsers].filter(
            (user, index, self) =>
              index === self.findIndex((u) => u._id === user._id)
          );
  
      setUsers(uniqueUsers);
      setHasMore(newUsers.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setInitialLoading(false);
        setRefreshing(false);
      }
    }
  };

  const handleApplyFilters = () => {
    loadUsers(true); // Reload data with new filters
  };

  useEffect(() => {
    async function fetchTokenAndLoadUsers() {
      let isAuth = await isProtected();
      if (!isAuth) {
        router.replace('/');
      }
      const token = await AsyncStorage.getItem('token');
      setToken(token || '');
      await loadUsers(true);
    }
    fetchTokenAndLoadUsers();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadUsers(true);
  };

  const handleEndReached = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
      loadUsers(); // Load the next page
    }
  };

  const renderUser: ListRenderItem<User> = ({ item }) => (
    <View className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
      <View className="p-4">
        <View className="flex-row justify-between items-center mb-2">
          <View>
            <Text className="text-lg font-bold text-gray-800">{item.username}</Text>
          </View>
          <View className="bg-yellow-100 px-2 py-1 rounded-full">
            <Text className="text-yellow-600 text-sm">{item.age} years</Text>
          </View>
        </View>
        <View className="flex-row justify-between items-center">
          <View className="flex-col items-start">
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="person" size={16} color="#F4CE14" />
              <Text className="text-gray-600 ml-1">
                {item?.gender?.charAt(0).toUpperCase() + item?.gender?.slice(1)}
              </Text>
            </View>

            <View className="flex-row items-center mb-3">
              <MaterialIcons name="location-on" size={16} color="#F4CE14" />
              <Text className="text-gray-600 ml-1">{item?.away} KM Away</Text>
            </View>
          </View>

          <View className="flex-row justify-end">
            <TouchableOpacity
              className="bg-yellow-500 px-4 py-2 rounded-lg flex-row items-center"
              onPress={() => openSnapchatAddFriend(item.username)}
            >
              <Text className="text-white mr-2">Add Friend</Text>
              <MaterialIcons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  const FiltersSection: React.FC = React.memo(() => {
    const handleAgeRangeChange = useCallback(
      debounce((values: number[]) => {
        setFilters((prevFilters) => ({
          ...prevFilters,
          ageRange: { min: values[0], max: values[1] },
        }));
      }, 100),
      []
    );

    const handleNearbyRangeChange = useCallback(
      debounce((values: number[]) => {
        setFilters((prevFilters) => ({
          ...prevFilters,
          nearbyRange: values[0],
        }));
      }, 100),
      []
    );

    return (
      <View className="bg-white rounded-xl shadow-sm mb-4 overflow-hidden">
        <TouchableOpacity
          className="p-4 flex-row justify-between items-center"
          onPress={() => setShowFilters(!showFilters)}
        >
          <Text className="text-lg font-bold text-gray-800">Filters</Text>
          <MaterialIcons
            name={showFilters ? 'expand-less' : 'expand-more'}
            size={24}
            color="#45474B"
          />
        </TouchableOpacity>

        {showFilters && (
          <View className="p-4 border-t border-gray-100">
            <Text className="text-gray-700 mb-2">
              Age Range: {filters.ageRange.min} - {filters.ageRange.max}
            </Text>
            <View className="mb-6 items-center">
              <MultiSlider
                values={[filters.ageRange.min, filters.ageRange.max]}
                sliderLength={SCREEN_WIDTH - 80}
                min={18}
                max={99}
                step={1}
                allowOverlap={false}
                snapped
                customMarker={() => (
                  <View className="h-5 w-5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
                )}
                selectedStyle={{
                  backgroundColor: '#F4CE14',
                }}
                unselectedStyle={{
                  backgroundColor: '#F5F7F8',
                }}
                containerStyle={{
                  height: 40,
                }}
                trackStyle={{
                  height: 4,
                  borderRadius: 2,
                }}
                onValuesChange={handleAgeRangeChange}
              />
            </View>

            <Text className="text-gray-700 mb-2">Gender</Text>
            <View className="border border-gray-200 rounded-lg mb-4">
              <Picker
                selectedValue={filters.selectedGender}
                onValueChange={(value: Filters['selectedGender']) =>
                  setFilters({ ...filters, selectedGender: value })
                }
              >
                <Picker.Item label="All Genders" value="All" />
                <Picker.Item label="Male" value="male" />
                <Picker.Item label="Female" value="female" />
                <Picker.Item label="other" value="other" />
              </Picker>
            </View>
            <View className='mb-2 flex-row justify-between items-center'>
              <Text className="text-gray-700">Distance: {
                filters.anywhere ? '' : `${filters.nearbyRange} km`
              }</Text>
              <TouchableOpacity
                className="flex-row items-center"
                onPress={() => setFilters((prevFilters) => ({ ...prevFilters, anywhere: !prevFilters.anywhere }))}
              >
                <MaterialIcons
                  name={filters.anywhere ? 'check-box' : 'check-box-outline-blank'}
                  size={24}
                  color="#F4CE14"
                />
                <Text className="ml-2 text-gray-700">Anywhere</Text>
              </TouchableOpacity>
            </View>
            {!filters.anywhere && (
              <View className="items-center">
                <MultiSlider
                  values={[filters.nearbyRange]}
                  sliderLength={SCREEN_WIDTH - 80}
                  min={1}
                  max={500}
                  step={1}
                  snapped
                  customMarker={() => (
                    <View className="h-5 w-5 rounded-full bg-yellow-500 border-2 border-white shadow-sm" />
                  )}
                  selectedStyle={{
                    backgroundColor: '#F4CE14',
                  }}
                  unselectedStyle={{
                    backgroundColor: '#F5F7F8',
                  }}
                  containerStyle={{
                    height: 40,
                  }}
                  trackStyle={{
                    height: 4,
                    borderRadius: 2,
                  }}
                  onValuesChange={handleNearbyRangeChange}
                />
              </View>
            )}

            <TouchableOpacity
              className="bg-yellow-500 px-4 py-2 rounded-lg mt-4"
              onPress={handleApplyFilters}
            >
              <Text className="text-white text-center font-bold">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  });

  const renderFooter = (): React.ReactElement | null => {
    if (!loading || refreshing) return null;
    return (
      <View className="py-4">
        <ActivityIndicator size="large" color="#F4CE14" />
      </View>
    );
  };

  if (initialLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#F4CE14" />
        <Text className="mt-2 text-gray-600">Loading users...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F5F7F8" />
      <View className="flex-1">
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item._id.toString()}
          className="flex-1 px-4 pt-4"
          ListHeaderComponent={FiltersSection}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={EmptyState}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.5}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={10}
          contentContainerStyle={{ paddingBottom: 100 }} // Add margin/padding at the bottom
        />
      </View>
    </SafeAreaView>
  );
};

export default Home;