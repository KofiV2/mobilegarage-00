import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, I18nManager } from 'react-native';
import { COLORS, SIZES } from '../../constants/theme';

export default function TabLayout() {
  const isRTL = I18nManager.isRTL;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 85 : 65,
          paddingBottom: Platform.OS === 'ios' ? 25 : 10,
          paddingTop: 8,
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.gray200,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          // Support RTL layout
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        tabBarLabelStyle: {
          fontSize: SIZES.caption,
          fontWeight: '600',
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        // Minimum touch target for accessibility
        tabBarItemStyle: {
          minHeight: SIZES.minTouchTarget,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: isRTL ? 'الرئيسية' : 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home' : 'home-outline'}
              size={26}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: isRTL ? 'الصفحة الرئيسية' : 'Home tab',
          tabBarTestID: 'home-tab',
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: isRTL ? 'الخدمات' : 'Services',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'car-sport' : 'car-sport-outline'}
              size={26}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: isRTL ? 'قائمة الخدمات' : 'Services tab',
          tabBarTestID: 'services-tab',
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: isRTL ? 'الحجوزات' : 'Bookings',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'calendar' : 'calendar-outline'}
              size={26}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: isRTL ? 'قائمة الحجوزات' : 'Bookings tab',
          tabBarTestID: 'bookings-tab',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: isRTL ? 'الملف الشخصي' : 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={26}
              color={color}
            />
          ),
          tabBarAccessibilityLabel: isRTL ? 'الملف الشخصي والإعدادات' : 'Profile tab',
          tabBarTestID: 'profile-tab',
        }}
      />
    </Tabs>
  );
}
