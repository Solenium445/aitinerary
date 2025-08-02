import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DollarSign, TrendingUp, TrendingDown, Utensils, Car, Hotel, Camera, ShoppingBag, Coffee } from 'lucide-react-native';

interface BudgetCategory {
  id: string;
  name: string;
  icon: any;
  allocated: number;
  spent: number;
  color: string;
}

const budgetData: BudgetCategory[] = [
  {
    id: 'accommodation',
    name: 'Accommodation',
    icon: Hotel,
    allocated: 800,
    spent: 650,
    color: '#3b82f6',
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: Utensils,
    allocated: 600,
    spent: 420,
    color: '#10b981',
  },
  {
    id: 'transport',
    name: 'Transport',
    icon: Car,
    allocated: 400,
    spent: 380,
    color: '#f59e0b',
  },
  {
    id: 'activities',
    name: 'Activities',
    icon: Camera,
    allocated: 500,
    spent: 280,
    color: '#8b5cf6',
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: ShoppingBag,
    allocated: 300,
    spent: 150,
    color: '#ec4899',
  },
  {
    id: 'miscellaneous',
    name: 'Miscellaneous',
    icon: Coffee,
    allocated: 200,
    spent: 85,
    color: '#64748b',
  },
];

export default function BudgetScreen() {
  const [budgetMode, setBudgetMode] = useState<'normal' | 'stretch' | 'save'>('normal');

  const totalAllocated = budgetData.reduce((sum, category) => sum + category.allocated, 0);
  const totalSpent = budgetData.reduce((sum, category) => sum + category.spent, 0);
  const remaining = totalAllocated - totalSpent;

  const getBudgetModeColor = () => {
    switch (budgetMode) {
      case 'stretch':
        return '#f97316';
      case 'save':
        return '#10b981';
      default:
        return '#3b82f6';
    }
  };

  const getBudgetModeText = () => {
    switch (budgetMode) {
      case 'stretch':
        return 'Stretch Budget Mode';
      case 'save':
        return 'Save More Mode';
      default:
        return 'Normal Budget Mode';
    }
  };

  const renderCategoryCard = (category: BudgetCategory) => {
    const IconComponent = category.icon;
    const percentage = (category.spent / category.allocated) * 100;
    const isOverBudget = percentage > 100;

    return (
      <View key={category.id} style={styles.categoryCard}>
        <View style={styles.categoryHeader}>
          <View style={styles.categoryIcon}>
            <IconComponent size={20} color={category.color} />
          </View>
          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryAmount}>
              £{category.spent} / £{category.allocated}
            </Text>
          </View>
          <View style={[styles.categoryStatus, { backgroundColor: isOverBudget ? '#fee2e2' : '#f0fdf4' }]}>
            {isOverBudget ? (
              <TrendingUp size={16} color="#dc2626" />
            ) : (
              <TrendingDown size={16} color="#16a34a" />
            )}
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.min(percentage, 100)}%`,
                backgroundColor: isOverBudget ? '#dc2626' : category.color,
              },
            ]}
          />
        </View>

        <Text style={[styles.percentageText, { color: isOverBudget ? '#dc2626' : '#16a34a' }]}>
          {percentage.toFixed(0)}% of budget used
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#10b981', '#059669']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Budget Tracker</Text>
        <Text style={styles.headerSubtitle}>Keep your spending on track</Text>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Budget Overview */}
        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <DollarSign size={24} color="#10b981" />
            <Text style={styles.overviewTitle}>Budget Overview</Text>
          </View>
          
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Total Budget</Text>
              <Text style={styles.amountValue}>£{totalAllocated.toLocaleString()}</Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Spent</Text>
              <Text style={[styles.amountValue, { color: '#dc2626' }]}>
                £{totalSpent.toLocaleString()}
              </Text>
            </View>
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Remaining</Text>
              <Text style={[styles.amountValue, { color: remaining >= 0 ? '#16a34a' : '#dc2626' }]}>
                £{remaining.toLocaleString()}
              </Text>
            </View>
          </View>

          <View style={styles.totalProgressBar}>
            <View
              style={[
                styles.totalProgressFill,
                {
                  width: `${Math.min((totalSpent / totalAllocated) * 100, 100)}%`,
                  backgroundColor: remaining >= 0 ? '#10b981' : '#dc2626',
                },
              ]}
            />
          </View>
        </View>

        {/* Budget Mode Selector */}
        <View style={styles.modeSection}>
          <Text style={styles.modeTitle}>Budget Mode</Text>
          <View style={styles.modeButtons}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                budgetMode === 'save' && { backgroundColor: '#10b981' },
              ]}
              onPress={() => setBudgetMode('save')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  budgetMode === 'save' && { color: '#ffffff' },
                ]}
              >
                Save More
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                budgetMode === 'normal' && { backgroundColor: '#3b82f6' },
              ]}
              onPress={() => setBudgetMode('normal')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  budgetMode === 'normal' && { color: '#ffffff' },
                ]}
              >
                Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                budgetMode === 'stretch' && { backgroundColor: '#f97316' },
              ]}
              onPress={() => setBudgetMode('stretch')}
            >
              <Text
                style={[
                  styles.modeButtonText,
                  budgetMode === 'stretch' && { color: '#ffffff' },
                ]}
              >
                Stretch
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.modeDescription, { color: getBudgetModeColor() }]}>
            {getBudgetModeText()} - {budgetMode === 'save' ? 'Find cheaper alternatives' : budgetMode === 'stretch' ? 'Unlock premium experiences' : 'Balanced recommendations'}
          </Text>
        </View>

        {/* Category Breakdown */}
        <View style={styles.categoriesSection}>
          <Text style={styles.categoriesTitle}>Spending by Category</Text>
          {budgetData.map(renderCategoryCard)}
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>💰 Money-Saving Tips</Text>
          <Text style={styles.tipsText}>
            • Look for lunch specials at restaurants{'\n'}
            • Use public transport day passes{'\n'}
            • Book activities online for discounts{'\n'}
            • Visit free attractions like parks and markets{'\n'}
            • Set daily spending alerts on your phone{'\n'}
            • Consider staying in areas slightly outside city centres{'\n'}
            • Check for student or group discounts
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#d1fae5',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  overviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  overviewTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    marginLeft: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  totalProgressBar: {
    height: 8,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  totalProgressFill: {
    height: '100%',
    borderRadius: 4,
  },
  modeSection: {
    marginTop: 24,
  },
  modeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  modeDescription: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  categoriesSection: {
    marginTop: 32,
  },
  categoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 16,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  categoryAmount: {
    fontSize: 14,
    color: '#64748b',
  },
  categoryStatus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  percentageText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  tipsText: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
});