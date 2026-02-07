import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { ProfileScreenSkeleton } from '../../components/Skeleton';
import {
  getButtonAccessibility,
  getHeaderAccessibility,
  getImageAccessibility,
  getLinkAccessibility,
} from '../../utils/accessibility';
import { COLORS, SIZES } from '../../constants/theme';

export default function Profile() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const isRTL = I18nManager.isRTL;

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const menuItems = [
    {
      icon: 'person-outline',
      label: 'Edit Profile',
      labelAr: 'تعديل الملف الشخصي',
      route: '/edit-profile',
      hint: 'Update your personal information',
    },
    {
      icon: 'car-outline',
      label: 'My Vehicles',
      labelAr: 'سياراتي',
      route: '/vehicles',
      hint: 'Manage your saved vehicles',
    },
    {
      icon: 'wallet-outline',
      label: 'Payment Methods',
      labelAr: 'طرق الدفع',
      route: '/payments',
      hint: 'Manage your payment methods',
    },
    {
      icon: 'notifications-outline',
      label: 'Notifications',
      labelAr: 'الإشعارات',
      route: '/notifications',
      hint: 'Manage notification preferences',
    },
    {
      icon: 'help-circle-outline',
      label: 'Help & Support',
      labelAr: 'المساعدة والدعم',
      route: '/support',
      hint: 'Get help and contact support',
    },
    {
      icon: 'settings-outline',
      label: 'Settings',
      labelAr: 'الإعدادات',
      route: '/settings',
      hint: 'App settings and preferences',
    },
  ];

  // Show skeleton while loading
  if (loading) {
    return <ProfileScreenSkeleton />;
  }

  return (
    <ScrollView
      style={styles.container}
      accessibilityLabel="Profile screen"
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View
            style={styles.avatar}
            {...getImageAccessibility(`Profile picture for ${user?.firstName} ${user?.lastName}`)}
          >
            <Text style={styles.avatarText}>
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </Text>
          </View>
        </View>
        <Text
          style={styles.userName}
          {...getHeaderAccessibility(`${user?.firstName} ${user?.lastName}`)}
        >
          {user?.firstName} {user?.lastName}
        </Text>
        <Text
          style={styles.userEmail}
          accessibilityLabel={`Email: ${user?.email}`}
        >
          {user?.email}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Stats Section */}
        <View
          style={[styles.statsContainer, isRTL && styles.statsContainerRTL]}
          accessibilityRole="summary"
          accessibilityLabel="Account statistics"
        >
          <View style={styles.statBox}>
            <Text
              style={styles.statNumber}
              accessibilityLabel="0 total bookings"
            >
              0
            </Text>
            <Text style={styles.statLabel}>Bookings</Text>
          </View>
          <View style={styles.statBox}>
            <Text
              style={styles.statNumber}
              accessibilityLabel="0 reward points"
            >
              0
            </Text>
            <Text style={styles.statLabel}>Points</Text>
          </View>
          <View style={styles.statBox}>
            <Text
              style={styles.statNumber}
              accessibilityLabel="0 dirhams spent"
            >
              AED 0
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </View>
        </View>

        {/* Menu Items */}
        <View
          style={styles.menuContainer}
          accessibilityRole="menu"
        >
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, isRTL && styles.menuItemRTL]}
              onPress={() => router.push(item.route)}
              {...getLinkAccessibility(item.label, item.hint)}
            >
              <View style={[styles.menuLeft, isRTL && styles.menuLeftRTL]}>
                <Ionicons
                  name={item.icon}
                  size={24}
                  color={COLORS.primary}
                  accessibilityElementsHidden={true}
                />
                <Text style={[styles.menuLabel, isRTL && styles.menuLabelRTL]}>
                  {item.label}
                </Text>
              </View>
              <Ionicons
                name={isRTL ? 'chevron-back' : 'chevron-forward'}
                size={20}
                color={COLORS.textTertiary}
                accessibilityElementsHidden={true}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          {...getButtonAccessibility(
            'Logout',
            'Sign out of your account'
          )}
        >
          <Ionicons
            name="log-out-outline"
            size={20}
            color={COLORS.white}
            accessibilityElementsHidden={true}
          />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        {/* Version */}
        <Text
          style={styles.version}
          accessibilityLabel="App version 1.0.0"
        >
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: SIZES.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SIZES.xs,
  },
  userEmail: {
    fontSize: SIZES.caption,
    color: COLORS.white,
    opacity: 0.9,
  },
  content: {
    padding: SIZES.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    padding: SIZES.lg,
    marginBottom: SIZES.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statsContainerRTL: {
    flexDirection: 'row-reverse',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: SIZES.xs,
  },
  statLabel: {
    fontSize: SIZES.caption,
    color: COLORS.textSecondary,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusLg,
    overflow: 'hidden',
    marginBottom: SIZES.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SIZES.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
    minHeight: SIZES.minTouchTarget,
  },
  menuItemRTL: {
    flexDirection: 'row-reverse',
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SIZES.md,
  },
  menuLeftRTL: {
    flexDirection: 'row-reverse',
  },
  menuLabel: {
    fontSize: SIZES.body,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  menuLabelRTL: {
    textAlign: 'right',
  },
  logoutButton: {
    backgroundColor: COLORS.error,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SIZES.sm,
    padding: SIZES.md,
    borderRadius: SIZES.radiusMd,
    marginBottom: SIZES.lg,
    minHeight: SIZES.minTouchTarget,
  },
  logoutText: {
    color: COLORS.white,
    fontSize: SIZES.body,
    fontWeight: 'bold',
  },
  version: {
    textAlign: 'center',
    color: COLORS.textTertiary,
    fontSize: SIZES.caption,
    marginBottom: SIZES.lg,
  },
});
