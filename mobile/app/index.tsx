import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../components/ui/Button';

export default function Home() {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center bg-background px-6">
      <Text className="text-4xl font-extrabold text-primary mb-2">InkSpire</Text>
      <Text className="text-lg text-textLight text-center mb-10">
        The ultimate peer support platform for writers. Connect, review, and grow together.
      </Text>

      <View className="w-full gap-4">
        <Button 
          title="Get Started" 
          onPress={() => router.push('/(auth)/register')} 
        />
        <Button 
          title="Log In" 
          variant="outline" 
          onPress={() => router.push('/(auth)/login')} 
        />
      </View>
    </View>
  );
}
