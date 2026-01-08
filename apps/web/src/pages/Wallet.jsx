import React, { useState, useEffect } from 'react';
import { walletsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { toast } from 'react-toastify';
import './Wallet.css';

const Wallet = () => {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Modal states
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [showAutoReloadModal, setShowAutoReloadModal] = useState(false);

  // Form states
  const [topUpAmount, setTopUpAmount] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [cashbackPercentage, setCashbackPercentage] = useState(0);
  const [cashbackEnabled, setCashbackEnabled] = useState(false);
  const [autoReloadEnabled, setAutoReloadEnabled] = useState(false);
  const [autoReloadThreshold, setAutoReloadThreshold] = useState(50);
  const [autoReloadAmount, setAutoReloadAmount] = useState(200);

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [walletRes, transactionsRes, statsRes] = await Promise.all([
        walletsAPI.getMyWallet(),
        walletsAPI.getTransactions({ limit: 50 }),
        walletsAPI.getStatistics({ period: 30 })
      ]);

      setWallet(walletRes.data.data);
      setTransactions(transactionsRes.data.data);
      setStatistics(statsRes.data.data);

      // Set cashback settings
      if (walletRes.data.data.cashback_settings) {
        setCashbackEnabled(walletRes.data.data.cashback_settings.enabled);
        setCashbackPercentage(walletRes.data.data.cashback_settings.percentage);
      }

      // Set auto-reload settings
      if (walletRes.data.data.auto_reload_settings) {
        setAutoReloadEnabled(walletRes.data.data.auto_reload_settings.enabled);
        setAutoReloadThreshold(walletRes.data.data.auto_reload_settings.threshold);
        setAutoReloadAmount(walletRes.data.data.auto_reload_settings.reload_amount);
      }
    } catch (err) {
      console.error('Error fetching wallet data:', err);
      setError(err.response?.data?.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (e) => {
    e.preventDefault();
    try {
      await walletsAPI.topUp({
        amount: parseFloat(topUpAmount),
        paymentMethod: 'stripe',
        paymentId: 'demo_payment_id'
      });

      toast.success(`Successfully added ${topUpAmount} SAR to your wallet!`);
      setShowTopUpModal(false);
      setTopUpAmount('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to top up wallet');
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    try {
      await walletsAPI.transfer({
        recipientUserId: transferRecipient,
        amount: parseFloat(transferAmount)
      });

      toast.success(`Successfully transferred ${transferAmount} SAR!`);
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferRecipient('');
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to transfer funds');
    }
  };

  const handleCashbackSettings = async (e) => {
    e.preventDefault();
    try {
      await walletsAPI.configureCashback({
        enabled: cashbackEnabled,
        percentage: parseFloat(cashbackPercentage)
      });

      toast.success('Cashback settings updated!');
      setShowCashbackModal(false);
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update cashback settings');
    }
  };

  const handleAutoReloadSettings = async (e) => {
    e.preventDefault();
    try {
      await walletsAPI.configureAutoReload({
        enabled: autoReloadEnabled,
        threshold: parseFloat(autoReloadThreshold),
        reloadAmount: parseFloat(autoReloadAmount),
        paymentMethod: 'stripe'
      });

      toast.success('Auto-reload settings updated!');
      setShowAutoReloadModal(false);
      fetchWalletData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update auto-reload settings');
    }
  };

  const getTransactionIcon = (type) => {
    const icons = {
      credit: '➕',
      debit: '➖',
      transfer_in: '⬇️',
      transfer_out: '⬆️',
      refund: '↩️',
      cashback: '💰',
      auto_reload: '🔄',
      admin_credit: '👤',
      admin_debit: '👤'
    };
    return icons[type] || '💳';
  };

  const getTransactionColor = (type) => {
    if (type.includes('credit') || type === 'transfer_in' || type === 'refund' || type === 'cashback') {
      return 'positive';
    }
    return 'negative';
  };

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading your wallet..." />;
  }

  if (error) {
    return (
      <div className="wallet-page">
        <ErrorMessage
          message="Error Loading Wallet"
          details={error}
          onRetry={fetchWalletData}
        />
      </div>
    );
  }

  return (
    <div className="wallet-page">
      <div className="wallet-header">
        <h1>My Wallet</h1>
        <p>Manage your funds and transactions</p>
      </div>

      <div className="wallet-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'transactions' ? 'active' : ''}
          onClick={() => setActiveTab('transactions')}
        >
          Transactions
        </button>
        <button
          className={activeTab === 'settings' ? 'active' : ''}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="wallet-overview">
          <div className="wallet-balance-card">
            <div className="balance-header">
              <span>Available Balance</span>
              <span className={`status-badge ${wallet.is_active ? 'active' : 'inactive'}`}>
                {wallet.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="balance-amount">
              {wallet.balance.toFixed(2)} <span className="currency">SAR</span>
            </div>
            <div className="wallet-actions">
              <button className="action-btn primary" onClick={() => setShowTopUpModal(true)}>
                ➕ Top Up
              </button>
              <button className="action-btn" onClick={() => setShowTransferModal(true)}>
                ↔️ Transfer
              </button>
            </div>
          </div>

          {statistics && (
            <div className="wallet-stats-grid">
              <div className="stat-card">
                <div className="stat-icon positive">📈</div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.totalCredits.toFixed(2)} SAR</div>
                  <div className="stat-label">Total Credits (30 days)</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon negative">📉</div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.totalDebits.toFixed(2)} SAR</div>
                  <div className="stat-label">Total Debits (30 days)</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.cashbackEarned.toFixed(2)} SAR</div>
                  <div className="stat-label">Cashback Earned</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🔄</div>
                <div className="stat-content">
                  <div className="stat-value">{statistics.autoReloadsCount}</div>
                  <div className="stat-label">Auto-Reloads</div>
                </div>
              </div>
            </div>
          )}

          {wallet.cashback_settings?.enabled && (
            <div className="feature-card cashback">
              <div className="feature-icon">💰</div>
              <div className="feature-content">
                <h3>Cashback Active</h3>
                <p>Earning {wallet.cashback_settings.percentage}% cashback on all purchases</p>
                <div className="feature-stat">
                  Total Earned: {wallet.cashback_settings.total_earned?.toFixed(2)} SAR
                </div>
              </div>
            </div>
          )}

          {wallet.auto_reload_settings?.enabled && (
            <div className="feature-card auto-reload">
              <div className="feature-icon">🔄</div>
              <div className="feature-content">
                <h3>Auto-Reload Active</h3>
                <p>
                  Reload {wallet.auto_reload_settings.reload_amount} SAR when balance drops below{' '}
                  {wallet.auto_reload_settings.threshold} SAR
                </p>
                {wallet.auto_reload_settings.last_reload_date && (
                  <div className="feature-stat">
                    Last Reload: {new Date(wallet.auto_reload_settings.last_reload_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="wallet-transactions">
          <h2>Transaction History</h2>
          {transactions.length === 0 ? (
            <div className="empty-state">
              <p>No transactions yet</p>
            </div>
          ) : (
            <div className="transactions-list">
              {transactions.map((tx, index) => (
                <div key={index} className="transaction-item">
                  <div className="transaction-icon">{getTransactionIcon(tx.type)}</div>
                  <div className="transaction-content">
                    <div className="transaction-description">
                      {tx.description || tx.type.replace(/_/g, ' ').toUpperCase()}
                    </div>
                    <div className="transaction-date">{new Date(tx.date).toLocaleString()}</div>
                    {tx.payment_method && (
                      <div className="transaction-method">via {tx.payment_method}</div>
                    )}
                  </div>
                  <div className={`transaction-amount ${getTransactionColor(tx.type)}`}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)} SAR
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="wallet-settings">
          <h2>Wallet Settings</h2>

          <div className="settings-card">
            <div className="setting-header">
              <h3>💰 Cashback Settings</h3>
              <button className="edit-btn" onClick={() => setShowCashbackModal(true)}>
                Edit
              </button>
            </div>
            <div className="setting-content">
              <p>Status: {wallet.cashback_settings?.enabled ? '✓ Enabled' : '✗ Disabled'}</p>
              {wallet.cashback_settings?.enabled && (
                <p>Percentage: {wallet.cashback_settings.percentage}%</p>
              )}
            </div>
          </div>

          <div className="settings-card">
            <div className="setting-header">
              <h3>🔄 Auto-Reload Settings</h3>
              <button className="edit-btn" onClick={() => setShowAutoReloadModal(true)}>
                Edit
              </button>
            </div>
            <div className="setting-content">
              <p>Status: {wallet.auto_reload_settings?.enabled ? '✓ Enabled' : '✗ Disabled'}</p>
              {wallet.auto_reload_settings?.enabled && (
                <>
                  <p>Threshold: {wallet.auto_reload_settings.threshold} SAR</p>
                  <p>Reload Amount: {wallet.auto_reload_settings.reload_amount} SAR</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Up Modal */}
      {showTopUpModal && (
        <div className="modal-overlay" onClick={() => setShowTopUpModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Top Up Wallet</h2>
            <form onSubmit={handleTopUp}>
              <div className="form-group">
                <label>Amount (SAR)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTopUpModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Top Up
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Transfer Funds</h2>
            <form onSubmit={handleTransfer}>
              <div className="form-group">
                <label>Recipient User ID</label>
                <input
                  type="text"
                  value={transferRecipient}
                  onChange={(e) => setTransferRecipient(e.target.value)}
                  required
                  placeholder="Enter recipient ID"
                />
              </div>
              <div className="form-group">
                <label>Amount (SAR)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  placeholder="Enter amount"
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => setShowTransferModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cashback Settings Modal */}
      {showCashbackModal && (
        <div className="modal-overlay" onClick={() => setShowCashbackModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Cashback Settings</h2>
            <form onSubmit={handleCashbackSettings}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={cashbackEnabled}
                    onChange={(e) => setCashbackEnabled(e.target.checked)}
                  />
                  Enable Cashback
                </label>
              </div>
              {cashbackEnabled && (
                <div className="form-group">
                  <label>Cashback Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={cashbackPercentage}
                    onChange={(e) => setCashbackPercentage(e.target.value)}
                    placeholder="0-100"
                  />
                </div>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowCashbackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Reload Settings Modal */}
      {showAutoReloadModal && (
        <div className="modal-overlay" onClick={() => setShowAutoReloadModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Auto-Reload Settings</h2>
            <form onSubmit={handleAutoReloadSettings}>
              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={autoReloadEnabled}
                    onChange={(e) => setAutoReloadEnabled(e.target.checked)}
                  />
                  Enable Auto-Reload
                </label>
              </div>
              {autoReloadEnabled && (
                <>
                  <div className="form-group">
                    <label>Threshold (SAR)</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={autoReloadThreshold}
                      onChange={(e) => setAutoReloadThreshold(e.target.value)}
                      placeholder="Balance threshold"
                    />
                  </div>
                  <div className="form-group">
                    <label>Reload Amount (SAR)</label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={autoReloadAmount}
                      onChange={(e) => setAutoReloadAmount(e.target.value)}
                      placeholder="Amount to reload"
                    />
                  </div>
                </>
              )}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowAutoReloadModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary">
                  Save Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
