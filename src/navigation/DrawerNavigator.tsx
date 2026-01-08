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
} from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../styles/designTokens';

// Import screens
import SiteNotesScreen from '../screens/SiteNotesScreen';
import TaskListScreen from '../screens/TaskListScreen';
import EditQuoteScreen from '../screens/EditQuoteScreen';
import ShareQuoteScreen from '../screens/ShareQuoteScreen';
import AccountScreen from '../screens/AccountScreen';
import PricingScreen from '../screens/PricingScreen';

// Import modals
import LoginSignupModal from '../components/modals/LoginSignupModal';

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
      const quotesJson = await AsyncStorage.getItem('saved_quotes');
      if (quotesJson) {
        const quotes = JSON.parse(quotesJson);
        setSavedQuotes(quotes.slice(0, 10));
      }
    } catch (error) {
      console.error('Error loading saved quotes:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleQuotePress = (quote: any) => {
    console.log('📱 Quote pressed:', quote.id, 'Status:', quote.status);
    onClose();

    // Smart navigation based on quote status
    if (quote.status === 'draft' || !quote.status) {
      // Draft quotes (or quotes without status) go to SiteNotesScreen for completion
      console.log('📝 Navigating to SiteNotes for draft/incomplete quote');
      navigation.navigate('SiteNotes', {
        existingQuote: quote,
      });
    } else if (quote.status === 'generated') {
      // Generated quotes go to TaskList (QuoteView) screen to view with Edit/Share options
      console.log('📋 Navigating to TaskList (QuoteView) for generated quote');

      // Navigate to TaskList which now shows the quote with Edit/Share buttons
      navigation.navigate('TaskList', {
        siteNotes: quote.siteNotes || quote,
        savedQuote: quote,
        isViewingGenerated: true, // Flag to indicate we're viewing a saved quote
      });
    } else {
      // Legacy quotes or unknown status - default to TaskList
      navigation.navigate('TaskList', {
        siteNotes: quote.siteNotes || quote,
        savedQuote: quote,
      });
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
            const quotesJson = await AsyncStorage.getItem('saved_quotes');
            if (quotesJson) {
              const quotes = JSON.parse(quotesJson);
              const updatedQuotes = quotes.filter((q: any) => q.id !== quoteId);
              await AsyncStorage.setItem('saved_quotes', JSON.stringify(updatedQuotes));
              setSavedQuotes(updatedQuotes.slice(0, 10));
            }
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
                <Text style={styles.avatarText}>
                  {isAnonymous ? '🚀' : user?.email?.[0]?.toUpperCase() || 'U'}
                </Text>
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
              // Always navigate to blank form for new assessment
              navigation.navigate('SiteNotes', { existingQuote: null });
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
                    style={styles.quoteItem}
                    onPress={() => handleQuotePress(quote)}
                  >
                    <View style={styles.quoteInfo}>
                      <Text style={styles.quoteAddress} numberOfLines={1}>
                        {quote.address || quote.siteNotes?.address || 'Untitled Quote'}
                      </Text>
                      <Text style={styles.quoteDetails}>
                        {quote.jobType || quote.siteNotes?.jobType || 'General'} •{' '}
                        {new Date(quote.timestamp).toLocaleDateString()}
                        {quote.pendingGeneration && ' • 📶 Needs connection'}
                      </Text>
                      <Text style={styles.quoteCost}>
                        {quote.pendingGeneration
                          ? '⏳ Pending generation'
                          : `£${quote.totalCost?.min?.toLocaleString() || '0'} - £${quote.totalCost?.max?.toLocaleString() || '0'}`}
                      </Text>
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
                Alert.alert('Settings', 'Settings screen coming soon');
              }}
            >
              <Ionicons
                name="settings-outline"
                size={20}
                color={designTokens.colors.text.secondary}
              />
              <Text style={styles.menuItemText}>Settings</Text>
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
          setShowLoginModal(false);
          onClose(); // Close the menu modal after successful login
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
            title: '🏗️ AskToddy',
            headerShown: true,
          }}
        />
        <Stack.Screen
          name="TaskList"
          component={TaskListScreen}
          options={({ navigation }) => ({
            title: '✅ Quote Generated',
            headerShown: true,
            headerLeft: () => null, // This removes ONLY the back button
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
            title: 'My Account',
            headerShown: true,
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
  quoteInfo: {
    flex: 1,
  },
  deleteButton: {
    paddingLeft: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.sm,
  },
  quoteAddress: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.text.primary,
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
