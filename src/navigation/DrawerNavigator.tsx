import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import {
  createDrawerNavigator,
  DrawerContentScrollView,
  DrawerItem,
  DrawerContentComponentProps,
} from '@react-navigation/drawer';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../contexts/AuthContext';
import designTokens from '../styles/designTokens';

// Import screens
import SiteNotesScreen from '../screens/SiteNotesScreen';
import TaskListScreen from '../screens/TaskListScreen';
import AccountScreen from '../screens/AccountScreen';

const Drawer = createDrawerNavigator();

// Custom Drawer Content
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const { signOut, user } = useAuth();
  const [savedQuotes, setSavedQuotes] = React.useState<any[]>([]);
  const [expandedSection, setExpandedSection] = React.useState<string | null>('quotes');

  React.useEffect(() => {
    loadSavedQuotes();
  }, []);

  const loadSavedQuotes = async () => {
    try {
      const quotesJson = await AsyncStorage.getItem('saved_quotes');
      if (quotesJson) {
        const quotes = JSON.parse(quotesJson);
        setSavedQuotes(quotes.slice(0, 10)); // Show last 10 quotes
      }
    } catch (error) {
      console.error('Error loading saved quotes:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleQuotePress = (quote: any) => {
    // Navigate to quote details or task list with the saved quote
    props.navigation.navigate('TaskList', {
      siteNotes: quote.siteNotes,
      savedQuote: quote,
    });
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
              let quotes = JSON.parse(quotesJson);
              quotes = quotes.filter((q: any) => q.id !== quoteId);
              await AsyncStorage.setItem('saved_quotes', JSON.stringify(quotes));
              setSavedQuotes(quotes.slice(0, 10));
            }
          } catch (error) {
            console.error('Error deleting quote:', error);
          }
        },
      },
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.drawerContainer} edges={['top']}>
      <DrawerContentScrollView {...props} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() || 'U'}</Text>
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>Welcome back!</Text>
              <Text style={styles.userEmail}>{user?.email || 'Guest User'}</Text>
            </View>
          </View>
        </View>

        {/* New Quote Button */}
        <TouchableOpacity
          style={styles.newQuoteButton}
          onPress={() => {
            props.navigation.closeDrawer();
            props.navigation.navigate('SiteNotes');
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
                <View key={quote.id} style={styles.quoteItem}>
                  <TouchableOpacity
                    style={styles.quoteContent}
                    onPress={() => handleQuotePress(quote)}
                  >
                    <View style={styles.quoteInfo}>
                      <Text style={styles.quoteAddress} numberOfLines={1}>
                        {quote.siteNotes?.address || 'Untitled Quote'}
                      </Text>
                      <Text style={styles.quoteDetails}>
                        {quote.siteNotes?.jobType || 'General'} •{' '}
                        {new Date(quote.timestamp).toLocaleDateString()}
                      </Text>
                      <Text style={styles.quoteCost}>
                        £{quote.totalCost?.min?.toLocaleString() || '0'} - £
                        {quote.totalCost?.max?.toLocaleString() || '0'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDeleteQuote(quote.id)}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={designTokens.colors.error[500]}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* Draft Notes Section */}
        <TouchableOpacity style={styles.sectionHeader} onPress={() => toggleSection('drafts')}>
          <View style={styles.sectionHeaderContent}>
            <Ionicons name="create-outline" size={20} color={designTokens.colors.text.primary} />
            <Text style={styles.sectionTitle}>Draft Notes</Text>
          </View>
          <Ionicons
            name={expandedSection === 'drafts' ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={designTokens.colors.text.secondary}
          />
        </TouchableOpacity>

        {expandedSection === 'drafts' && (
          <View style={styles.sectionContent}>
            <Text style={styles.emptyText}>No draft notes</Text>
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Menu Items */}
        <DrawerItem
          label="My Profile"
          onPress={() => props.navigation.navigate('Account')}
          icon={({ size, color }) => <Ionicons name="person-outline" size={size} color={color} />}
          labelStyle={styles.drawerLabel}
        />

        <DrawerItem
          label="Settings"
          onPress={() => Alert.alert('Settings', 'Settings screen coming soon')}
          icon={({ size, color }) => <Ionicons name="settings-outline" size={size} color={color} />}
          labelStyle={styles.drawerLabel}
        />

        <DrawerItem
          label="Privacy Policy"
          onPress={() =>
            Alert.alert('Privacy Policy', 'View our privacy policy at asktoddy.com/privacy')
          }
          icon={({ size, color }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color} />
          )}
          labelStyle={styles.drawerLabel}
        />

        <DrawerItem
          label="Terms & Conditions"
          onPress={() => Alert.alert('Terms & Conditions', 'View our terms at asktoddy.com/terms')}
          icon={({ size, color }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          )}
          labelStyle={styles.drawerLabel}
        />

        <DrawerItem
          label="Help & Support"
          onPress={() => Alert.alert('Support', 'Contact us at support@asktoddy.com')}
          icon={({ size, color }) => (
            <Ionicons name="help-circle-outline" size={size} color={color} />
          )}
          labelStyle={styles.drawerLabel}
        />

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={24} color={designTokens.colors.error[500]} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <Text style={styles.footerText}>AskToddy v1.2.0</Text>
        <Text style={styles.footerSubtext}>Professional Quotes in Minutes</Text>
      </View>
    </SafeAreaView>
  );
}

// Main Drawer Navigator
export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      drawerContent={props => <CustomDrawerContent {...props} />}
      screenOptions={{
        drawerStyle: {
          backgroundColor: designTokens.colors.background.primary,
          width: 320,
        },
        headerStyle: {
          backgroundColor: designTokens.colors.primary[500],
        },
        headerTintColor: 'white',
        headerTitleStyle: {
          fontWeight: designTokens.typography.fontWeight.bold as any,
        },
        swipeEnabled: true,
        drawerType: 'slide',
      }}
    >
      <Drawer.Screen
        name="SiteNotesTab"
        component={SiteNotesScreen}
        options={{
          title: 'AskToddy',
          headerShown: true,
        }}
      />
      <Drawer.Screen
        name="TaskListTab"
        component={TaskListScreen}
        options={{
          title: 'Task List',
          headerShown: false,
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
      <Drawer.Screen
        name="AccountTab"
        component={AccountScreen}
        options={{
          title: 'My Account',
          headerShown: false,
          drawerItemStyle: { display: 'none' }, // Hide from drawer menu
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: designTokens.colors.background.primary,
  },
  drawerHeader: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.xl,
    backgroundColor: designTokens.colors.primary[50],
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.primary,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: designTokens.colors.border.secondary,
  },
  quoteContent: {
    flex: 1,
  },
  quoteInfo: {
    flex: 1,
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
  deleteButton: {
    padding: designTokens.spacing.sm,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: designTokens.colors.border.primary,
    marginVertical: designTokens.spacing.md,
  },
  drawerLabel: {
    fontSize: designTokens.typography.fontSize.base,
    color: designTokens.colors.text.primary,
  },
  signOutSection: {
    marginTop: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border.primary,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: designTokens.spacing.sm,
  },
  signOutText: {
    fontSize: designTokens.typography.fontSize.base,
    fontWeight: designTokens.typography.fontWeight.medium as any,
    color: designTokens.colors.error[500],
  },
  drawerFooter: {
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.md,
    borderTopWidth: 1,
    borderTopColor: designTokens.colors.border.primary,
  },
  footerText: {
    fontSize: designTokens.typography.fontSize.sm,
    color: designTokens.colors.text.secondary,
  },
  footerSubtext: {
    fontSize: designTokens.typography.fontSize.xs,
    color: designTokens.colors.text.tertiary,
    marginTop: 2,
  },
});
