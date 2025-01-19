import { Linking } from 'react-native';

const openSnapchatAddFriend = async (username:any) => {
  const deepLink = `snapchat://add/${username}`;

  try {
    // Check if Snapchat is installed
    const supported = await Linking.canOpenURL(deepLink);

    if (supported) {
      // Open Snapchat
      await Linking.openURL(deepLink);
    } else {
      // If Snapchat is not installed, open the Snapchat profile in the browser
      const webUrl = `https://www.snapchat.com/add/${username}`;
      await Linking.openURL(webUrl);
    }
  } catch (error) {
    console.error('Error opening Snapchat:', error);
  }
};

export default openSnapchatAddFriend;