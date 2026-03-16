import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center px-8">
        <Text className="text-6xl mb-6">🌿</Text>
        <Text className="text-4xl font-bold text-dark text-center mb-3">Grazeful</Text>
        <Text className="text-lg text-grayText text-center mb-12">
          Eat well. Feel good. No pressure.
        </Text>
        <TouchableOpacity
          className="bg-primary w-full py-4 rounded-2xl items-center"
          onPress={() => router.push('/onboarding/profile')}
        >
          <Text className="text-white text-lg font-semibold">Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
