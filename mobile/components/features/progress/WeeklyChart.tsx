import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

interface WeeklyChartProps {
  history: any[];
  dailyGoal: number;
}

export function WeeklyChart({ history, dailyGoal }: WeeklyChartProps) {
  // Generate last 7 days array
  const last7Days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = {
    labels: last7Days.map(dateStr => {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { weekday: 'short' });
    }),
    datasets: [
      {
        data: last7Days.map(dateStr => {
          const log = history.find(l => l.date.startsWith(dateStr));
          return log ? log.wordCount : 0;
        }),
        colors: last7Days.map(dateStr => {
          const log = history.find(l => l.date.startsWith(dateStr));
          const count = log ? log.wordCount : 0;
          return count >= dailyGoal 
            ? (opacity = 1) => `rgba(16, 185, 129, ${opacity})` // emerald-500
            : (opacity = 1) => `rgba(139, 92, 246, ${opacity})`; // violet-500
        })
      }
    ]
  };

  const screenWidth = Dimensions.get('window').width - 32;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>This Week</Text>
        <Text style={styles.goalText}>Goal: {dailyGoal} words</Text>
      </View>

      <BarChart
        data={chartData}
        width={screenWidth - 40}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        withCustomBarColorFromData={true}
        flatColor={true}
        fromZero={true}
        chartConfig={{
          backgroundColor: '#fff',
          backgroundGradientFrom: '#fff',
          backgroundGradientTo: '#fff',
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
          style: {
            borderRadius: 16
          },
          barPercentage: 0.7,
        }}
        style={{
          marginVertical: 8,
          borderRadius: 16
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
  },
  goalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  }
});
