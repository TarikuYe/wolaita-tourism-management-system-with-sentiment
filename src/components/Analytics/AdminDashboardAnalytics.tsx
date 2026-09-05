// AdminDashboardAnalytics.tsx (to be included in the analytics tab of AdminDashboard)

import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebase';
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  Timestamp
} from 'firebase/firestore';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const AdminDashboardAnalytics = () => {
    const [userData, setUserData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [revenueData, setRevenueData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [tourData, setTourData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [bookingStatusData, setBookingStatusData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [categoryData, setCategoryData] = useState<{ labels: string[]; data: number[] }>({ labels: [], data: [] });
    const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUserGrowth(),
          fetchRevenue(),
          fetchTopTours(),
          fetchBookingStatus(),
          fetchTourCategories()
        ]);
      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const fetchUserGrowth = async () => {
    try {
      const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'asc')));
      const growth: Record<string, { count: number; label: string }> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt: Date | null = null;
        
        // Handle Firestore Timestamp
        if (data.createdAt) {
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          }
        }
        
        if (createdAt) {
          const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!growth[monthKey]) {
            growth[monthKey] = { count: 0, label: monthLabel };
          }
          growth[monthKey].count += 1;
        }
      });
      
      // Sort by month key and extract labels and data
      const sortedEntries = Object.entries(growth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value);
      
      const labels = sortedEntries.map(entry => entry.label);
      const data = sortedEntries.map(entry => entry.count);
      
      setUserData({ labels, data });
    } catch (error) {
      console.error('Error fetching user growth:', error);
      // Fallback: try without orderBy
      try {
        const snapshot = await getDocs(collection(db, 'users'));
        const growth: Record<string, { count: number; label: string }> = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt: Date | null = null;
          
          if (data.createdAt) {
            if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            } else if (data.createdAt.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            }
          }
          
          if (createdAt) {
            const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!growth[monthKey]) {
              growth[monthKey] = { count: 0, label: monthLabel };
            }
            growth[monthKey].count += 1;
          }
        });
        
        const sortedEntries = Object.entries(growth)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, value]) => value);
        
        const labels = sortedEntries.map(entry => entry.label);
        const data = sortedEntries.map(entry => entry.count);
        
        setUserData({ labels, data });
      } catch (fallbackError) {
        console.error('Error in user growth fallback:', fallbackError);
        setUserData({ labels: [], data: [] });
      }
    }
  };

  const fetchRevenue = async () => {
    try {
      // Fetch only successful payments
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('status', 'in', ['completed', 'paid', 'successful', 'verified'])
      );
      const snapshot = await getDocs(paymentsQuery);
      const totals: Record<string, { amount: number; label: string }> = {};
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        let createdAt: Date | null = null;
        const amount = parseFloat(data.amount) || 0;
        
        // Handle Firestore Timestamp
        if (data.createdAt) {
          if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
            createdAt = data.createdAt.toDate();
          } else if (data.createdAt instanceof Date) {
            createdAt = data.createdAt;
          } else if (data.createdAt.seconds) {
            createdAt = new Date(data.createdAt.seconds * 1000);
          }
        }
        
        if (createdAt && amount > 0) {
          const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
          const monthLabel = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!totals[monthKey]) {
            totals[monthKey] = { amount: 0, label: monthLabel };
          }
          totals[monthKey].amount += amount;
        }
      });
      
      // Sort by month key and extract labels and data
      const sortedEntries = Object.entries(totals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value);
      
      const labels = sortedEntries.map(entry => entry.label);
      const data = sortedEntries.map(entry => entry.amount);
      
      setRevenueData({ labels, data });
    } catch (error) {
      console.error('Error fetching revenue:', error);
      // Fallback: try without status filter
      try {
        const snapshot = await getDocs(collection(db, 'payments'));
        const totals: Record<string, { amount: number; label: string }> = {};
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          let createdAt: Date | null = null;
          const amount = parseFloat(data.amount) || 0;
          const status = data.status?.toLowerCase() || '';
          
          // Only count successful payments
          if (!['completed', 'paid', 'successful', 'verified'].includes(status)) {
            return;
          }
          
          if (data.createdAt) {
            if (data.createdAt.toDate && typeof data.createdAt.toDate === 'function') {
              createdAt = data.createdAt.toDate();
            } else if (data.createdAt instanceof Date) {
              createdAt = data.createdAt;
            } else if (data.createdAt.seconds) {
              createdAt = new Date(data.createdAt.seconds * 1000);
            }
          }
          
          if (createdAt && amount > 0) {
            const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
            if (!totals[monthKey]) {
              totals[monthKey] = { amount: 0, label: monthLabel };
            }
            totals[monthKey].amount += amount;
          }
        });
        
        const sortedEntries = Object.entries(totals)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([, value]) => value);
        
        const labels = sortedEntries.map(entry => entry.label);
        const data = sortedEntries.map(entry => entry.amount);
        
        setRevenueData({ labels, data });
      } catch (fallbackError) {
        console.error('Error in revenue fallback:', fallbackError);
        setRevenueData({ labels: [], data: [] });
      }
    }
  };

  const fetchTopTours = async () => {
    try {
      // Fetch all bookings to count bookings per tour
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
      const tourBookings: Record<string, number> = {};
      
      bookingsSnapshot.forEach((doc) => {
        const tourId = doc.data().tourId;
        const tourName = doc.data().tourName;
        if (tourId || tourName) {
          const key = tourName || tourId;
          tourBookings[key] = (tourBookings[key] || 0) + 1;
        }
      });
      
      // Also fetch tours to get titles
      const toursSnapshot = await getDocs(collection(db, 'tours'));
      const tourMap: Record<string, string> = {};
      
      toursSnapshot.forEach((doc) => {
        const tourId = doc.id;
        const title = doc.data().title;
        if (tourId && title) {
          tourMap[tourId] = title;
        }
      });
      
      // Combine booking counts with tour titles
      const combined: Record<string, number> = {};
      Object.entries(tourBookings).forEach(([key, count]) => {
        const title = tourMap[key] || key;
        combined[title] = (combined[title] || 0) + count;
      });
      
      // Sort by booking count and take top 5
      const sorted = Object.entries(combined)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
      
      const labels = sorted.map(([title]) => title.length > 30 ? title.substring(0, 30) + '...' : title);
      const data = sorted.map(([, count]) => count);
      
      setTourData({ labels, data });
    } catch (error) {
      console.error('Error fetching top tours:', error);
      setTourData({ labels: [], data: [] });
    }
  };

  const fetchBookingStatus = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'bookings'));
      const counts: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const status = doc.data().status || 'unknown';
        const normalizedStatus = status.toLowerCase();
        counts[normalizedStatus] = (counts[normalizedStatus] || 0) + 1;
      });
      
      // Capitalize first letter for display
      const labels = Object.keys(counts).map(status => 
        status.charAt(0).toUpperCase() + status.slice(1)
      );
      const data = Object.values(counts);
      
      setBookingStatusData({ labels, data });
    } catch (error) {
      console.error('Error fetching booking status:', error);
      setBookingStatusData({ labels: [], data: [] });
    }
  };

  const fetchTourCategories = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'tours'));
      const categories: Record<string, number> = {};
      
      snapshot.forEach((doc) => {
        const category = doc.data().category || 'Uncategorized';
        const normalizedCategory = category.trim() || 'Uncategorized';
        categories[normalizedCategory] = (categories[normalizedCategory] || 0) + 1;
      });
      
      const labels = Object.keys(categories);
      const data = Object.values(categories);
      
      setCategoryData({ labels, data });
    } catch (error) {
      console.error('Error fetching tour categories:', error);
      setCategoryData({ labels: [], data: [] });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
    },
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">User Growth</h3>
          {userData.labels.length > 0 ? (
            <Line
              data={{
                labels: userData.labels,
                datasets: [
                  {
                    label: 'Users Registered',
                    data: userData.data,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                  },
                ],
              }}
              options={chartOptions}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No user data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
          {revenueData.labels.length > 0 ? (
            <Bar
              data={{
                labels: revenueData.labels,
                datasets: [
                  {
                    label: 'Revenue ($)',
                    data: revenueData.data,
                    backgroundColor: 'rgba(255, 159, 64, 0.6)',
                  },
                ],
              }}
              options={chartOptions}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No revenue data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Popular Tours (by Bookings)</h3>
          {tourData.labels.length > 0 ? (
            <Bar
              data={{
                labels: tourData.labels,
                datasets: [
                  {
                    label: 'Number of Bookings',
                    data: tourData.data,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                  },
                ],
              }}
              options={{
                ...chartOptions,
                indexAxis: 'y' as const,
              }}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No tour booking data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
          {bookingStatusData.labels.length > 0 ? (
            <Pie
              data={{
                labels: bookingStatusData.labels,
                datasets: [
                  {
                    label: 'Bookings',
                    data: bookingStatusData.data,
                    backgroundColor: [
                      'rgba(75, 192, 192, 0.6)',
                      'rgba(255, 99, 132, 0.6)',
                      'rgba(255, 206, 86, 0.6)',
                      'rgba(201, 203, 207, 0.6)',
                      'rgba(153, 102, 255, 0.6)',
                      'rgba(255, 159, 64, 0.6)'
                    ],
                  },
                ],
              }}
              options={chartOptions}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">No booking data available</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Tour Categories Distribution</h3>
          {categoryData.labels.length > 0 ? (
            <div className="max-w-2xl mx-auto">
              <Doughnut
                data={{
                  labels: categoryData.labels,
                  datasets: [
                    {
                      label: 'Tours',
                      data: categoryData.data,
                      backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(201, 203, 207, 0.6)',
                        'rgba(255, 159, 64, 0.6)',
                        'rgba(255, 99, 255, 0.6)'
                      ],
                    },
                  ],
                }}
                options={chartOptions}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">No category data available</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardAnalytics;
