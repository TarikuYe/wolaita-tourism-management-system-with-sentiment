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


  useEffect(() => {
    fetchUserGrowth();
    fetchRevenue();
    fetchTopTours();
    fetchBookingStatus();
    fetchTourCategories();
  }, []);

  const fetchUserGrowth = async () => {
    const snapshot = await getDocs(collection(db, 'users'));
    const growth: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const createdAt = doc.data().createdAt?.toDate();
      if (createdAt) {
        const month = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
        growth[month] = (growth[month] || 0) + 1;
      }
    });
    const labels = Object.keys(growth);
    const data = Object.values(growth);
    setUserData({ labels, data });
  };

  const fetchRevenue = async () => {
    const snapshot = await getDocs(collection(db, 'payments'));
    const totals: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const createdAt = doc.data().createdAt?.toDate();
      const amount = doc.data().amount;
      if (createdAt && amount) {
        const month = createdAt.toLocaleString('default', { month: 'short', year: 'numeric' });
        totals[month] = (totals[month] || 0) + amount;
      }
    });
    const labels = Object.keys(totals);
    const data = Object.values(totals);
    setRevenueData({ labels, data });
  };

  const fetchTopTours = async () => {
    const snapshot = await getDocs(query(collection(db, 'tours')));
    const top: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const { title, reviewsCount } = doc.data();
      if (title && reviewsCount) {
        top[title] = reviewsCount;
      }
    });
    const sorted = Object.entries(top).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const labels = sorted.map(([title]) => title);
    const data = sorted.map(([, count]) => count);
    setTourData({ labels, data });
  };

  const fetchBookingStatus = async () => {
    const snapshot = await getDocs(collection(db, 'bookings'));
    const counts: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const status = doc.data().status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
    });
    setBookingStatusData({ labels: Object.keys(counts), data: Object.values(counts) });
  };

  const fetchTourCategories = async () => {
    const snapshot = await getDocs(collection(db, 'tours'));
    const categories: Record<string, number> = {};
    snapshot.forEach((doc) => {
      const category = doc.data().category || 'other';
      categories[category] = (categories[category] || 0) + 1;
    });
    setCategoryData({ labels: Object.keys(categories), data: Object.values(categories) });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">User Growth</h3>
        <Line
          data={{
            labels: userData.labels,
            datasets: [
              {
                label: 'Users Registered',
                data: userData.data,
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
              },
            ],
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Revenue</h3>
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
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Popular Tours</h3>
        <Bar
          data={{
            labels: tourData.labels,
            datasets: [
              {
                label: 'Reviews',
                data: tourData.data,
                backgroundColor: 'rgba(153, 102, 255, 0.6)',
              },
            ],
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Bookings by Status</h3>
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
                  'rgba(201, 203, 207, 0.6)'
                ],
              },
            ],
          }}
        />
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Tour Categories</h3>
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
                  'rgba(201, 203, 207, 0.6)'
                ],
              },
            ],
          }}
        />
      </div>
    </div>
  );
};

export default AdminDashboardAnalytics;
