import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import api from '../services/api';

const QUICK_ADD_AMOUNTS = [
  { amount: 50, bonus: 0 },
  { amount: 100, bonus: 10 },
  { amount: 200, bonus: 25 },
  { amount: 500, bonus: 75 },
  { amount: 1000, bonus: 150 }
];

export default function Wallet() {
  const [loading, setLoading] = useState(true);
  const [walletData, setWalletData] = useState(null);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const response = await api.get('/wallets/me');
      setWalletData(response.data);
    } catch (error) {
      console.error('Error fetching wallet:', error);
      Alert.alert('Error', 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async () => {
    if (!selectedAmount) {
      Alert.alert('Error', 'Please select an amount');
      return;
    }

    try {
      setProcessing(true);

      // In production, integrate with payment gateway (Stripe, etc.)
      const response = await api.post('/wallets/topup', {
        amount: selectedAmount.amount,
        bonus: selectedAmount.bonus
      });

      setShowAddFundsModal(false);
      setSelectedAmount(null);
      fetchWalletData();

      Alert.alert(
        'Success!',
        `AED ${selectedAmount.amount + selectedAmount.bonus} added to your wallet${
          selectedAmount.bonus > 0 ? ` (including AED ${selectedAmount.bonus} bonus!)` : ''
        }`
      );
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to add funds');
    } finally {
      setProcessing(false);
    }
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'credit':
      case 'bonus':
        return { name: 'add-circle', color: '#4CAF50' };
      case 'debit':
        return { name: 'remove-circle', color: '#EF5350' };
      case 'refund':
        return { name: 'replay', color: '#2196F3' };
      default:
        return { name: 'info', color: '#999' };
    }
  };

  const renderTransaction = (transaction) => {
    const icon = getTransactionIcon(transaction.type);

    return (
      <View key={transaction.id} style={styles.transactionItem}>
        <View style={styles.transactionLeft}>
          <View style={[styles.transactionIcon, { backgroundColor: icon.color + '20' }]}>
            <MaterialIcons name={icon.name} size={24} color={icon.color} />
          </View>
          <View style={styles.transactionInfo}>
            <Text style={styles.transactionDesc}>{transaction.description}</Text>
            <Text style={styles.transactionDate}>
              {new Date(transaction.createdAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        </View>
        <View style={styles.transactionRight}>
          <Text style={[
            styles.transactionAmount,
            { color: transaction.type === 'debit' ? '#EF5350' : '#4CAF50' }
          ]}>
            {transaction.type === 'debit' ? '-' : '+'}AED {Math.abs(transaction.amount).toFixed(2)}
          </Text>
          <Text style={styles.transactionBalance}>
            Balance: AED {transaction.balanceAfter.toFixed(2)}
          </Text>
        </View>
      </View>
    );
  };

  const renderAddFundsModal = () => (
    <Modal
      visible={showAddFundsModal}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowAddFundsModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Funds</Text>
            <TouchableOpacity onPress={() => setShowAddFundsModal(false)}>
              <MaterialIcons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSubtitle}>Choose amount to add</Text>

            {QUICK_ADD_AMOUNTS.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.amountCard,
                  selectedAmount?.amount === item.amount && styles.amountCardSelected
                ]}
                onPress={() => setSelectedAmount(item)}
              >
                <View style={styles.amountLeft}>
                  <Text style={styles.amountValue}>AED {item.amount}</Text>
                  {item.bonus > 0 && (
                    <View style={styles.bonusBadge}>
                      <MaterialIcons name="local-offer" size={14} color="#4CAF50" />
                      <Text style={styles.bonusText}>+AED {item.bonus} BONUS</Text>
                    </View>
                  )}
                </View>
                <View style={styles.amountRight}>
                  {item.bonus > 0 && (
                    <Text style={styles.totalAmount}>
                      Total: AED {item.amount + item.bonus}
                    </Text>
                  )}
                  {selectedAmount?.amount === item.amount && (
                    <MaterialIcons name="check-circle" size={24} color="#FF6B35" />
                  )}
                </View>
              </TouchableOpacity>
            ))}

            <View style={styles.benefitsContainer}>
              <Text style={styles.benefitsTitle}>Benefits:</Text>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Instant top-up</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Faster checkout</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Bonus credits on select amounts</Text>
              </View>
              <View style={styles.benefitItem}>
                <MaterialIcons name="check" size={18} color="#4CAF50" />
                <Text style={styles.benefitText}>Never expires</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.addButton,
                (!selectedAmount || processing) && styles.addButtonDisabled
              ]}
              onPress={handleAddFunds}
              disabled={!selectedAmount || processing}
            >
              <Text style={styles.addButtonText}>
                {processing ? 'Processing...' : 'Add to Wallet'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.securityNote}>
              <MaterialIcons name="lock" size={14} color="#666" />
              {' '}Secure payment via Stripe
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B35', '#F7931E']} style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Wallet</Text>
        <View style={styles.headerSpacer} />
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance Card */}
        <LinearGradient
          colors={['#4CAF50', '#45A049']}
          style={styles.balanceCard}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <MaterialIcons name="account-balance-wallet" size={32} color="#fff" />
          </View>

          <Text style={styles.balanceAmount}>
            AED {(walletData?.balance + walletData?.bonusBalance || 0).toFixed(2)}
          </Text>

          <View style={styles.balanceBreakdown}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Main Balance</Text>
              <Text style={styles.balanceItemValue}>
                AED {walletData?.balance?.toFixed(2) || '0.00'}
              </Text>
            </View>
            {walletData?.bonusBalance > 0 && (
              <View style={styles.balanceItem}>
                <Text style={styles.balanceItemLabel}>Bonus</Text>
                <Text style={styles.balanceItemValue}>
                  AED {walletData?.bonusBalance?.toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.addFundsButton}
            onPress={() => setShowAddFundsModal(true)}
          >
            <MaterialIcons name="add" size={20} color="#4CAF50" />
            <Text style={styles.addFundsButtonText}>Add Funds</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <MaterialIcons name="trending-up" size={28} color="#2196F3" />
            <Text style={styles.statValue}>
              AED {walletData?.lifetimeAdded?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Total Added</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="local-offer" size={28} color="#4CAF50" />
            <Text style={styles.statValue}>
              AED {walletData?.totalBonusEarned?.toFixed(2) || '0.00'}
            </Text>
            <Text style={styles.statLabel}>Bonus Earned</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="shopping-cart" size={28} color="#FF6B35" />
            <Text style={styles.statValue}>{walletData?.totalTransactions || 0}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
        </View>

        {/* Auto-reload Setting */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Settings</Text>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingLeft}>
              <MaterialIcons name="autorenew" size={24} color="#FF6B35" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Auto-reload</Text>
                <Text style={styles.settingDesc}>
                  Add AED 100 when balance is below AED 20
                </Text>
              </View>
            </View>
            <MaterialIcons name="toggle-off" size={32} color="#ccc" />
          </View>
        </View>

        {/* Transaction History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {walletData?.transactions && walletData.transactions.length > 0 ? (
            walletData.transactions.map(renderTransaction)
          ) : (
            <View style={styles.emptyTransactions}>
              <MaterialIcons name="receipt-long" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {renderAddFundsModal()}
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
  balanceCard: {
    margin: 20,
    padding: 25,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  balanceLabel: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20
  },
  balanceBreakdown: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)'
  },
  balanceItem: {
    flex: 1
  },
  balanceItemLabel: {
    fontSize: 13,
    color: '#fff',
    opacity: 0.8,
    marginBottom: 4
  },
  balanceItemValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff'
  },
  addFundsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    gap: 8
  },
  addFundsButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 20
  },
  statCard: {
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
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center'
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600'
  },
  settingCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  settingInfo: {
    marginLeft: 12,
    flex: 1
  },
  settingName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3
  },
  settingDesc: {
    fontSize: 13,
    color: '#666'
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  transactionIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  transactionInfo: {
    flex: 1
  },
  transactionDesc: {
    fontSize: 15,
    color: '#333',
    marginBottom: 4
  },
  transactionDate: {
    fontSize: 12,
    color: '#999'
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  transactionBalance: {
    fontSize: 11,
    color: '#999'
  },
  emptyTransactions: {
    alignItems: 'center',
    paddingVertical: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 10
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: '85%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalBody: {
    padding: 20
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  amountCardSelected: {
    backgroundColor: '#FFF3E0',
    borderColor: '#FF6B35'
  },
  amountLeft: {
    flex: 1
  },
  amountValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  bonusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  bonusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4CAF50'
  },
  amountRight: {
    alignItems: 'flex-end'
  },
  totalAmount: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  benefitsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 20
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 10
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8
  },
  benefitText: {
    fontSize: 13,
    color: '#1B5E20'
  },
  addButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10
  },
  addButtonDisabled: {
    backgroundColor: '#ccc'
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  securityNote: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10
  }
});
