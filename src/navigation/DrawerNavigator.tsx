import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  BackHandler,
  Platform,
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { CommonActions, useNavigationState } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { quoteStorage } from '../services/QuoteStorageService';
import { useSyncQuotes } from '../hooks/useSyncQuotes';
import designTokens from '../styles/designTokens';
import { AppIcons, IconSize } from '../styles/iconRegistry';

// Import screens
import SiteNotesScreen from '../screens/SiteNotesScreen';
import TaskListScreen from '../screens/TaskListScreen';
import EditQuoteScreen from '../screens/EditQuoteScreen';
import ShareQuoteScreen from '../screens/ShareQuoteScreen';
import AccountScreen from '../screens/AccountScreen';
import PricingScreen from '../screens/PricingScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import TermsScreen from '../screens/TermsScreen';

// Import modals
import LoginSignupModal from '../components/modals/LoginSignupModal';
import { logger } from '../services/Logger';

const Stack = createStackNavigator();

// MenuModal component for drawer-like functionality
function MenuModal({ visible, onClose, navigation }: any) {
  const { signOut, user, isAnonymous, freemiumUser } = useAuth();
  const [savedQuotes, setSavedQuotes] = React.useState<any[]>([]);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('quotes');
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  React.useEffect(() => {
    if (visible) {
      loadSavedQuotes();
    }
  }, [visible]);

  const loadSavedQuotes = async () => {
    try {
      const quotes = await quoteStorage.getAll();
      // Sort: generated/completed first, then drafts
      const sorted = [...quotes].sort((a, b) => {
        const statusOrder = (s: string) => (s === 'draft' || !s ? 1 : 0);
        const orderDiff = statusOrder(a.status) - statusOrder(b.status);
        if (orderDiff !== 0) return orderDiff;
        return b.lastModified - a.lastModified;
      });
      setSavedQuotes(sorted.slice(0, 10));
    } catch (error) {
      console.error('Error loading saved quotes:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleQuotePress = (quote: any) => {
    logger.debug('📱 Quote pressed:', quote.id, 'Status:', quote.status);
    onClose();

    // Smart navigation based on quote status — always reset stack to prevent back-button loops
    if (quote.status === 'draft' || !quote.status) {
      // Draft quotes (or quotes without status) go to SiteNotesScreen for completion
      logger.debug('📝 Navigating to SiteNotes for draft/incomplete quote');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'SiteNotes', params: { existingQuote: quote } }],
        })
      );
    } else if (quote.status === 'generated') {
      // Generated quotes go to TaskList (QuoteView) screen to view with Edit/Share options
      logger.debug('📋 Navigating to TaskList (QuoteView) for generated quote');
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'TaskList',
              params: {
                siteNotes: quote.siteNotes || quote,
                savedQuote: quote,
                isViewingGenerated: true,
              },
            },
          ],
        })
      );
    } else {
      // Legacy quotes or unknown status - default to TaskList
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            {
              name: 'TaskList',
              params: {
                siteNotes: quote.siteNotes || quote,
                savedQuote: quote,
              },
            },
          ],
        })
      );
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    Alert.alert('Delete Quote', 'Are you sure you want to delete this quote?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await quoteStorage.delete(quoteId);
            // Reload with same sorting as loadSavedQuotes
            loadSavedQuotes();
          } catch (error) {
            console.error('Error deleting quote:', error);
            Alert.alert('Error', 'Failed to delete quote. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          onClose();
          signOut();
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer} edges={['top']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                {isAnonymous ? (
                  <Ionicons name={AppIcons.anonymousAvatar} size={IconSize.medium} color="white" />
                ) : (
                  <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
                )}
              </View>
              <View style={styles.userDetails}>
                <Text style={styles.userName}>
                  {isAnonymous ? 'Welcome to AskToddy!' : 'Welcome back!'}
                </Text>
                <Text style={styles.userEmail}>
                  {isAnonymous
                    ? `Anonymous User • ${freemiumUser.tier}`
                    : user?.email || 'Guest User'}
                </Text>
                {!isAnonymous && freemiumUser.tier === 'free' && (
                  <Text style={styles.quotesUsage}>
                    {freemiumUser.quotesUsed}/{freemiumUser.quotesLimit} quotes used
                  </Text>
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={designTokens.colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* New Quote Button */}
          <TouchableOpacity
            style={styles.newQuoteButton}
            onPress={() => {
              onClose();
              // Reset the stack so SiteNotesScreen fully remounts with blank state
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'SiteNotes', params: { existingQuote: null } }],
                })
              );
            }}
          >
            <Ionicons name="add-circle" size={24} color="white" />
            <Text style={styles.newQuoteText}>New Site Assessment</Text>
          </TouchableOpacity>

          {/* Saved Quotes Section */}
          <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('quotes')}>
            <View style={styles.sectionHeaderContent}>
              <Ionicons
                name="document-text-outline"
                size={20}
                color={designTokens.colors.text.primary}
              />
              <Text style={styles.sectionTitle}>Saved Quotes</Text>
              {savedQuotes.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{savedQuotes.length}</Text>
                </View>
              )}
            </View>
            <Ionicons
              name={expandedSection === 'quotes' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={designTokens.colors.text.secondary}
            />
          </TouchableOpacity>

          {expandedSection === 'quotes' && (
            <View style={styles.sectionContent}>
              {savedQuotes.length === 0 ? (
                <Text style={styles.emptyText}>No saved quotes yet</Text>
              ) : (
                savedQuotes.map(quote => (
                  <Pressable
                    key={quote.id}
                    style={[styles.quoteItem, quote.pendingGeneration && styles.quoteItemPending]}
                    onPress={() => handleQuotePress(quote)}
                  >
                    {quote.pendingGeneration && (
                      <Ionicons
                        name={AppIcons.needsConnection}
                        size={18}
                        color="#92400e"
                        style={{ marginRight: designTokens.spacing.sm }}
                      />
                    )}
                    <View style={styles.quoteInfo}>
                      <View style={styles.quoteTopRow}>
                        <Text style={styles.quoteAddress} numberOfLines={1}>
                          {quote.address || quote.siteNotes?.address || 'Untitled Quote'}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            quote.status === 'draft' || !quote.status
                              ? styles.statusBadgeDraft
                              : styles.statusBadgeGenerated,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              quote.status === 'draft' || !quote.status
                                ? styles.statusBadgeTextDraft
                                : styles.statusBadgeTextGenerated,
                            ]}
                          >
                            {quote.status === 'draft' || !quote.status ? 'Draft' : 'Completed'}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.quoteDetails}>
                        {quote.jobType || quote.siteNotes?.jobType || 'General'} •{' '}
                        {new Date(quote.timestamp).toLocaleDateString()}
                        {quote.pendingGeneration && ' • Needs connection'}
                      </Text>
                      {quote.status !== 'draft' && quote.status && (
                        <Text style={styles.quoteCost}>
                          {quote.pendingGeneration
                            ? 'Pending generation'
                            : quote.finalCost
                              ? `£${quote.finalCost.toLocaleString()}`
                              : `£${quote.totalCost?.min?.toLocaleString() || '0'} - £${quote.totalCost?.max?.toLocaleString() || '0'}`}
                        </Text>
                      )}
                    </View>
                    <Pressable
                      style={styles.deleteButton}
                      onPress={() => handleDeleteQuote(quote.id)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={designTokens.colors.error[500]}
                      />
                    </Pressable>
                  </Pressable>
                ))
              )}
            </View>
          )}

          {/* Menu Items */}
          <View style={styles.menuItems}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                navigation.navigate('Account');
              }}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>My Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                navigation.navigate('Pricing');
              }}
            >
              <Ionicons name="star-outline" size={20} color={designTokens.colors.primary[600]} />
              <Text style={[styles.menuItemText, { color: designTokens.colors.primary[600] }]}>
                Pricing & Upgrade
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                onClose();
                Alert.alert('Support', 'Contact us at support@asktoddy.com');
              }}
            >
              <Ionicons
                name="help-circle-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Help & Support</Text>
            </TouchableOpacity>
          </View>

          {/* Sign Out / Sign In */}
          {isAnonymous ? (
            <TouchableOpacity
              style={[styles.signOutButton, { backgroundColor: designTokens.colors.primary[50] }]}
              onPress={() => {
                setShowLoginModal(true);
              }}
            >
              <Ionicons name="log-in-outline" size={24} color={designTokens.colors.primary[600]} />
              <Text style={[styles.signOutText, { color: designTokens.colors.primary[600] }]}>
                Sign In / Sign Up
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={24} color={designTokens.colors.error[500]} />
              <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Login/Signup Modal */}
      <LoginSignupModal
        visible={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          // Don't close both modals at once - let auth state settle
          setTimeout(() => {
            setShowLoginModal(false);
            onClose(); // Close the menu modal after auth settles
          }, 500);
        }}
        mode="login"
        title="Sign In to Continue"
        subtitle="Access your saved quotes and generate new ones"
      />
    </Modal>
  );
}

// Simple Stack Navigator for MVP with modal menu
function SimpleNavigator() {
  const [menuVisible, setMenuVisible] = React.useState(false);
  const [currentNavigation, setCurrentNavigation] = React.useState<any>(null);

  // Background sync — triggers on foreground, online transition, and initial mount
  useSyncQuotes();

  // Intercept Android hardware back button on top-level screens
  const navigationState = useNavigationState(state => state);
  React.useEffect(() => {
    if (Platform.OS !== 'android') return;

    const onBackPress = () => {
      const currentRoute = navigationState?.routes?.[navigationState.index]?.name;
      // Block back on top-level screens — menu is the only way to navigate
      if (currentRoute === 'SiteNotes' || currentRoute === 'TaskList') {
        return true; // Consume the event, prevent default back
      }
      return false; // Allow default back for EditQuote, ShareQuote, Account, Pricing
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [navigationState]);

  return (
    <>
      <Stack.Navigator
        screenOptions={({ navigation }) => ({
          headerStyle: {
            backgroundColor: designTokens.colors.primary[500],
          },
          headerTintColor: 'white',
          headerTitleStyle: {
            fontWeight: designTokens.typography.fontWeight.bold as any,
          },
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                setCurrentNavigation(navigation);
                setMenuVisible(true);
              }}
              style={{ marginRight: 15 }}
            >
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen
          name="SiteNotes"
          component={SiteNotesScreen}
          options={{
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={AppIcons.brand} size={IconSize.medium} color="white" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>AskToddy</Text>
              </View>
            ),
            headerShown: true,
            headerLeft: () => null,
            gestureEnabled: false,
          }}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={({ navigation }) => ({
            headerTitle: () => (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name={AppIcons.quoteComplete} size={IconSize.medium} color="white" />
                <Text style={{ color: 'white', fontWeight: '700', fontSize: 18 }}>
                  Quote Generated
                </Text>
              </View>
            ),
            headerShown: true,
            headerLeft: () => null,
            gestureEnabled: false,
            headerRight: () => (
              <TouchableOpacity
                onPress={() => {
                  setCurrentNavigation(navigation);
                  setMenuVisible(true);
                }}
                style={{ marginRight: 15 }}
              >
                <Ionicons name="menu" size={24} color="white" />
              </TouchableOpacity>
            ),
          })}
        />
        <Stack.Screen
          name="EditQuote"
          component={EditQuoteScreen}
          options={{
            title: 'Edit Quote',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="ShareQuote"
          component={ShareQuoteScreen}
          options={{
            title: 'Share Quote',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="Account"
          component={AccountScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Pricing"
          component={PricingScreen}
          options={{
            title: 'Pricing',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="PrivacyPolicy"
          component={PrivacyPolicyScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Terms"
          component={TermsScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        navigation={currentNavigation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.xl,
    backgroundColor: designTokens.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: designTokens.colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: designTokens.typography.fontSize.xl,
    color: 'white',
    fontWeight: designTokens.typography.fontWeight.bold as any,
  },
  userDetails: {
    marginLeft: designTokens.spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: designTokens.typography.fontSize.lg,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    color: designTokens.colors.text.primary,
  },
  userEmail: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: 2,
  },
  quotesUsage: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.primary[600],
    marginTop: 2,
    fontWeight: designTokens.typography.fontWeight.medium as any,
  },
  closeButton: {
    padding: designTokens.spacing.sm,
  },
  newQuoteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: designTokens.colors.primary[500],
    marginHorizontal: designTokens.spacing.lg,
    marginVertical: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.md,
    paddingHorizontal: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.lg,
    gap: designTokens.spacing.sm,
  },
  newQuoteText: {
    color: 'white',
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    backgroundColor: designTokens.colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.primary,
  },
  sectionHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  sectionTitle: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
  },
  badge: {
    backgroundColor: designTokens.colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: designTokens.spacing.xs,
  },
  badgeText: {
    color: 'white',
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  sectionContent: {
    paddingVertical: designTokens.spacing.sm,
  },
  emptyText: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.tertiary,
    fontStyle: 'italic',
  },
  quoteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.secondary,
  },
  quoteItemPending: {
    backgroundColor: '#fffbeb',
  },
  quoteInfo: {
    flex: 1,
  },
  deleteButton: {
    paddingLeft: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  quoteTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  quoteAddress: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeDraft: {
    backgroundColor: designTokens.colors.neutral[100],
  },
  statusBadgeGenerated: {
    backgroundColor: '#dcfce7',
  },
  statusBadgeText: {
    fontSize: designTokens.typography.fontSize.xs,
    fontWeight: designTokens.typography.fontWeight.semibold as any,
  },
  statusBadgeTextDraft: {
    color: designTokens.colors.text.secondary,
  },
  statusBadgeTextGenerated: {
    color: '#16a34a',
  },
  quoteDetails: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
    marginTop: 2,
  },
  quoteCost: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.primary[600],
    fontWeight: designTokens.typography.fontWeight.semibold as any,
    marginTop: 4,
  },
  menuItems: {
    paddingVertical: designTokens.spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    gap: designTokens.spacing.md,
  },
  menuItemText: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    marginTop: designTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border.primary,
    gap: designTokens.spacing.sm,
  },
  signOutText: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.error[500],
  },
});

export default SimpleNavigator;
