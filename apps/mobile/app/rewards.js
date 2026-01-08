import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const TIER_LEVELS = [
  {
    id: 'bronze',
    name: 'Bronze',
    icon: '🥉',
    minPoints: 0,
    color: '#CD7F32',
    benefits: ['5% discount on services', 'Birthday reward']
  },
  {
    id: 'silver',
    name: 'Silver',
    icon: '🥈',
    minPoints: 500,
    color: '#C0C0C0',
    benefits: ['10% discount on services', 'Priority booking', 'Birthday reward + gift']
  },
  {
    id: 'gold',
    name: 'Gold',
    icon: '🥇',
    minPoints: 1500,
    color: '#FFD700',
    benefits: ['15% discount', 'Priority + express booking', 'Free monthly wash', 'Exclusive offers']
  },
  {
    id: 'platinum',
    name: 'Platinum',
    icon: '💎',
    minPoints: 3000,
    color: '#E5E4E2',
    benefits: ['20% discount', 'VIP treatment', '2 free monthly washes', 'Concierge service', 'All premium benefits']
  }
];

const ACHIEVEMENTS = [
  { id: 'first_wash', name: 'First Wash', icon: '🎉', points: 50, description: 'Complete your first wash' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', points: 25, description: 'Book before 8 AM' },
  { id: 'night_owl', name: 'Night Owl', icon: '🌙', points: 25, description: 'Book after 8 PM' },
  { id: 'weekend_warrior', name: 'Weekend Warrior', icon: '🎯', points: 30, description: 'Book 4 weekend washes' },
  { id: 'consistent', name: 'Consistency King', icon: '👑', points: 100, description: 'Book weekly for a month' },
  { id: 'referral_master', name: 'Referral Master', icon: '🎁', points: 200, description: 'Refer 5 friends' },
  { id: 'century', name: 'Century Club', icon: '💯', points: 500, description: 'Complete 100 washes' },
  { id: 'eco_warrior', name: 'Eco Warrior', icon: '🌱', points: 75, description: 'Choose eco-friendly 10 times' }
];

export default function Rewards() {
  const [loading, setLoading] = useState(true);
  const [rewardsData, setRewardsData] = useState(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const router = useRouter();

  useEffect(() => {
    fetchRewardsData();
  }, []);

  const fetchRewardsData = async () => {
    try {
      const response = await api.get('/loyalty/me');
      setRewardsData(response.data);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentTier = () => {
    const points = rewardsData?.totalPoints || 0;
    return [...TIER_LEVELS].reverse().find(tier => points >= tier.minPoints) || TIER_LEVELS[0];
  };

  const getNextTier = () => {
    const currentTier = getCurrentTier();
    const currentIndex = TIER_LEVELS.findIndex(t => t.id === currentTier.id);
    return TIER_LEVELS[currentIndex + 1];
  };

  const getProgressToNextTier = () => {
    const points = rewardsData?.totalPoints || 0;
    const nextTier = getNextTier();
    if (!nextTier) return 100;
    const currentTier = getCurrentTier();
    const progress = ((points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  const handleShareReferral = async () => {
    try {
      const referralCode = rewardsData?.referralCode || 'CARWASH123';
      await Share.share({
        message: `Get AED 50 off your first car wash! Use my referral code: ${referralCode}\n\nDownload In & Out Car Wash app now!`,
        title: 'Get AED 50 off your first car wash!'
      });

      // Track share event
      await api.post('/loyalty/track-share');
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleRedeemReward = async (reward) => {
    try {
      await api.post('/loyalty/redeem', { rewardId: reward.id });
      setShowRedeemModal(false);
      fetchRewardsData();
    } catch (error) {
      alert(error.response?.data?.error || 'Failed to redeem reward');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[currentTier.color, currentTier.color + '99']}
        style={styles.header}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rewards</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Current Tier Card */}
        <LinearGradient
          colors={[currentTier.color, currentTier.color + 'CC']}
          style={styles.tierCard}
        >
          <View style={styles.tierHeader}>
            <Text style={styles.tierIcon}>{currentTier.icon}</Text>
            <View style={styles.tierInfo}>
              <Text style={styles.tierName}>{currentTier.name} Member</Text>
              <Text style={styles.tierPoints}>
                {rewardsData?.totalPoints || 0} points
              </Text>
            </View>
          </View>

          {nextTier && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressToNextTier()}%` }
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {nextTier.minPoints - (rewardsData?.totalPoints || 0)} points to {nextTier.name}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Points Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Points Summary</Text>
          <View style={styles.pointsGrid}>
            <View style={styles.pointsCard}>
              <MaterialIcons name="emoji-events" size={32} color="#FF6B35" />
              <Text style={styles.pointsValue}>{rewardsData?.totalPoints || 0}</Text>
              <Text style={styles.pointsLabel}>Total Points</Text>
            </View>
            <View style={styles.pointsCard}>
              <MaterialIcons name="stars" size={32} color="#4CAF50" />
              <Text style={styles.pointsValue}>{rewardsData?.availablePoints || 0}</Text>
              <Text style={styles.pointsLabel}>Available</Text>
            </View>
            <View style={styles.pointsCard}>
              <MaterialIcons name="redeem" size={32} color="#2196F3" />
              <Text style={styles.pointsValue}>{rewardsData?.redeemedPoints || 0}</Text>
              <Text style={styles.pointsLabel}>Redeemed</Text>
            </View>
          </View>
        </View>

        {/* Tier Benefits */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Benefits</Text>
          <View style={styles.benefitsContainer}>
            {currentTier.benefits.map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* All Tiers */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Tiers</Text>
          {TIER_LEVELS.map((tier) => (
            <View
              key={tier.id}
              style={[
                styles.tierListItem,
                currentTier.id === tier.id && styles.tierListItemActive
              ]}
            >
              <View style={styles.tierListHeader}>
                <View style={styles.tierListLeft}>
                  <Text style={styles.tierListIcon}>{tier.icon}</Text>
                  <View>
                    <Text style={styles.tierListName}>{tier.name}</Text>
                    <Text style={styles.tierListPoints}>
                      {tier.minPoints}+ points
                    </Text>
                  </View>
                </View>
                {currentTier.id === tier.id && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentText}>Current</Text>
                  </View>
                )}
              </View>
              <View style={styles.tierBenefitsList}>
                {tier.benefits.map((benefit, idx) => (
                  <Text key={idx} style={styles.tierBenefitText}>
                    • {benefit}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Achievements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Achievements</Text>
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement) => {
              const isUnlocked = rewardsData?.achievements?.includes(achievement.id);
              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    isUnlocked && styles.achievementUnlocked
                  ]}
                >
                  <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDesc}>{achievement.description}</Text>
                  <Text style={styles.achievementPoints}>+{achievement.points}pts</Text>
                  {isUnlocked && (
                    <View style={styles.unlockedBadge}>
                      <MaterialIcons name="check" size={16} color="#fff" />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* Referral Program */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Refer & Earn</Text>
          <LinearGradient
            colors={['#FF6B35', '#F7931E']}
            style={styles.referralCard}
          >
            <MaterialIcons name="card-giftcard" size={40} color="#fff" />
            <Text style={styles.referralTitle}>Invite Friends</Text>
            <Text style={styles.referralText}>
              Give AED 50, Get 100 points
            </Text>
            <View style={styles.referralCodeContainer}>
              <Text style={styles.referralCode}>
                {rewardsData?.referralCode || 'LOADING...'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareReferral}
            >
              <MaterialIcons name="share" size={20} color="#FF6B35" />
              <Text style={styles.shareButtonText}>Share Code</Text>
            </TouchableOpacity>
            <Text style={styles.referralStats}>
              {rewardsData?.referralCount || 0} friends referred
            </Text>
          </LinearGradient>
        </View>

        {/* Recent Activity */}
        {rewardsData?.recentActivity && rewardsData.recentActivity.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {rewardsData.recentActivity.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <View style={styles.activityLeft}>
                  <MaterialIcons
                    name={activity.points > 0 ? 'add-circle' : 'remove-circle'}
                    size={24}
                    color={activity.points > 0 ? '#4CAF50' : '#EF5350'}
                  />
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{activity.description}</Text>
                    <Text style={styles.activityDate}>
                      {new Date(activity.date).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
                <Text style={[
                  styles.activityPoints,
                  { color: activity.points > 0 ? '#4CAF50' : '#EF5350' }
                ]}>
                  {activity.points > 0 ? '+' : ''}{activity.points}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20
  },
  backButton: {
    padding: 5
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff'
  },
  headerSpacer: {
    width: 34
  },
  content: {
    flex: 1
  },
  tierCard: {
    margin: 20,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  tierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  tierIcon: {
    fontSize: 60,
    marginRight: 15
  },
  tierInfo: {
    flex: 1
  },
  tierName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5
  },
  tierPoints: {
    fontSize: 18,
    color: '#fff',
    opacity: 0.9
  },
  progressContainer: {
    marginTop: 10
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    color: '#fff',
    textAlign: 'center'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15
  },
  pointsGrid: {
    flexDirection: 'row',
    gap: 10
  },
  pointsCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8
  },
  pointsLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  },
  benefitsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  benefitText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10
  },
  tierListItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },
  tierListItemActive: {
    borderWidth: 2,
    borderColor: '#FF6B35'
  },
  tierListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  tierListLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tierListIcon: {
    fontSize: 32,
    marginRight: 12
  },
  tierListName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  tierListPoints: {
    fontSize: 13,
    color: '#666',
    marginTop: 2
  },
  currentBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  currentText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold'
  },
  tierBenefitsList: {
    paddingLeft: 44
  },
  tierBenefitText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  achievementCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    opacity: 0.5,
    position: 'relative'
  },
  achievementUnlocked: {
    opacity: 1,
    borderWidth: 2,
    borderColor: '#4CAF50'
  },
  achievementIcon: {
    fontSize: 36,
    marginBottom: 8
  },
  achievementName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4
  },
  achievementDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8
  },
  achievementPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35'
  },
  unlockedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  referralCard: {
    padding: 25,
    borderRadius: 15,
    alignItems: 'center'
  },
  referralTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 15,
    marginBottom: 5
  },
  referralText: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 20
  },
  referralCodeContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15
  },
  referralCode: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 25,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 10
  },
  shareButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8
  },
  referralStats: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8
  },
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },
  activityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  activityInfo: {
    marginLeft: 12,
    flex: 1
  },
  activityTitle: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4
  },
  activityDate: {
    fontSize: 12,
    color: '#999'
  },
  activityPoints: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
