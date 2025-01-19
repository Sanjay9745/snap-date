import { protectedRoute } from '@/api/users';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default async function isProtected() {
    try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
            let protectedRes = await protectedRoute(storedToken);
            if (protectedRes.success) {
                return true;
            } else {
                return false;
            }
        }
    } catch (error) {
        console.error('Error checking token:', error);
    }

    return false;
}