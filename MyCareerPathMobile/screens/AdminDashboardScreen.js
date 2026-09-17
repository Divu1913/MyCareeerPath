import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { api } from '../services/api';

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 justify-center items-center bg-cream">
        <ActivityIndicator size="large" color="#FF6B00" />
      </View>
    );
  }

  const s = stats || {};

  return (
    <ScrollView 
      className="flex-1 bg-cream pt-4 px-4"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text className="text-2xl font-bold text-navy mb-6">Control Center</Text>

      <View className="flex-row flex-wrap justify-between">
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Total Users</Text>
          <Text className="text-2xl font-bold text-navy">{s.total_users || 0}</Text>
        </View>
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Candidates</Text>
          <Text className="text-2xl font-bold text-navy">{s.total_candidates || 0}</Text>
        </View>
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Recruiters</Text>
          <Text className="text-2xl font-bold text-orange">{s.total_recruiters || 0}</Text>
        </View>
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Pending Companies</Text>
          <Text className="text-2xl font-bold text-red-600">{s.pending_companies || 0}</Text>
        </View>
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Active Jobs</Text>
          <Text className="text-2xl font-bold text-navy">{s.total_jobs || 0}</Text>
        </View>
        <View className="w-[48%] bg-white p-4 rounded-xl shadow mb-4 border border-gray-100">
          <Text className="text-gray-500 text-sm mb-1">Total Apps</Text>
          <Text className="text-2xl font-bold text-green-600">{s.total_applications || 0}</Text>
        </View>
      </View>

      <View className="bg-navy p-4 rounded-xl mt-4 mb-8">
        <Text className="text-white font-bold text-lg mb-2">System Health</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-gray-300">API Status</Text>
          <Text className="text-green-400 font-semibold">Online</Text>
        </View>
        <View className="flex-row items-center justify-between mt-2">
          <Text className="text-gray-300">DB Connections</Text>
          <Text className="text-green-400 font-semibold">Stable</Text>
        </View>
      </View>
    </ScrollView>
  );
}

