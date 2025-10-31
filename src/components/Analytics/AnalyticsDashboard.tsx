import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Users, 
  Briefcase, 
  DollarSign, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
  Target,
  Clock,
  Star,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  LineChart as RechartsLineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

import { Booking } from '../../types/booking';
import { Tour } from '../../types';
import { Review } from '../../types/review';

interface MonthlyBookingData {
  month: string;
  bookings: number;
}

interface TopDestinationData {
  destination: string;
  count: number;
}

interface BookingStatusData {
  name: string;
  value: number;
  color: string;
}

interface AnalyticsDashboardProps {
  bookings: Booking[];
  tours: Tour[];
  reviews: Review[];
  totalBookings: number;
  ongoingBookingsCount: number;
  completedBookingsCount: number;
  currentMonthRevenue: number;
  topDestinations: [string, number][]; // Or TopDestinationData[] if you prefer
  monthlyBookings: { month: string; bookings: number; }[]; // Or MonthlyBookingData[] if you prefer
  averageRating: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change: number;
  icon: React.ElementType;
  color: string;
  prefix?: string;
  suffix?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  color, 
  prefix = '', 
  suffix = '' 
}) => {
  const getChangeIcon = () => {
    if (change > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getChangeColor = () => {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex items-center space-x-1">
          {getChangeIcon()}
          <span className={`text-sm font-medium ${getChangeColor()}`}>
            {Math.abs(change)}%
          </span>
        </div>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <p className="text-2xl font-bold text-gray-900">
          {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
        </p>
      </div>
    </div>
  );
};

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ bookings, tours, reviews }) => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProjectType, setSelectedProjectType] = useState('all');

  // Calculate analytics data from props using useMemo for optimization
  const { totalBookings, ongoingBookingsCount, completedBookingsCount, monthlyBookings, topDestinations, currentMonthRevenue, bookingStatusDistribution } = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const totalBookings = bookings.length;
    // Assuming 'confirmed' and 'ongoing' statuses represent ongoing tours/bookings
    // TODO: Implement logic to determine ongoing bookings based on tour dates and booking status (e.g., 'confirmed')
    const ongoingBookingsCount = 0;
    const currentMonthRevenue = bookings
      .filter(booking => {
        const bookingDate = new Date(booking.bookingDate);
        return booking.status === 'completed' && bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
      })
      .reduce((sum, booking) => sum + (booking.price || 0), 0); // Use 0 if price is null/undefined

    // TODO: Implement logic to group bookings by month for monthlyBookings trend chart
    const monthlyBookings: MonthlyBookingData[] = [];

    // TODO: Implement logic to calculate top destinations from bookings and tours
    const topDestinations: TopDestinationData[] = [];

    // Calculate completed bookings count based on booking status
    const completedBookingsCount = bookings.filter(booking => booking.status === 'completed').length;

    // TODO: Implement logic to calculate data for booking status distribution (Completed vs Ongoing)
    const bookingStatusDistribution: BookingStatusData[] = []; // Placeholder - implement calculation

 return { totalBookings, ongoingBookingsCount, completedBookingsCount, monthlyBookings, topDestinations, currentMonthRevenue, bookingStatusDistribution };
  }, [bookings, tours, reviews]);

  const exportReport = (type: 'pdf' | 'excel' | 'csv') => {
    // Mock export functionality
    const data = {
      dateRange,
      selectedTeam,
      selectedProjectType, // TODO: Replace mockData with real data calculations
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-report-${Date.now()}.${type === 'excel' ? 'xlsx' : type}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EF4444', '#6B7280'];

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
            <p className="text-gray-600">Comprehensive performance metrics and insights</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            {/* Team Filter */}
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Teams</option>
              <option value="sales">Sales Team</option>
              <option value="operations">Operations</option>
              <option value="marketing">Marketing</option>
            </select>

            {/* Project Type Filter */}
            <select
              value={selectedProjectType}
              onChange={(e) => setSelectedProjectType(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="all">All Project Types</option>
              <option value="cultural">Cultural Tours</option>
              <option value="adventure">Adventure Tours</option>
              <option value="religious">Religious Tours</option>
              <option value="nature">Nature Tours</option>
            </select>

            {/* Export Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('pdf')}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>PDF</span>
              </button>
              <button
                onClick={() => exportReport('excel')}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Excel</span>
              </button>
              <button
                onClick={() => exportReport('csv')}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Current Month Revenue"
          value={currentMonthRevenue}
          // TODO: Calculate revenue change percentage
          change={0} 
          icon={DollarSign}
          color="bg-green-500"
          prefix="$"
        />
        <MetricCard
          title="Total Bookings"
          value={totalBookings}
          // TODO: Calculate booking change percentage
          change={0} 
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title="Ongoing Bookings"
          value={ongoingBookingsCount}
          // TODO: Calculate ongoing booking change percentage
          change={0} 
          icon={Briefcase}
          color="bg-purple-500"
        />
        <MetricCard
          title="Completed Bookings"
          value={completedBookingsCount}
          // TODO: Calculate completed booking change percentage
          change={0} 
          icon={Target}
          color="bg-amber-500"
        />
      </div>

      {/* Revenue Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trends</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {/* TODO: Use calculated monthly bookings data */}
            <AreaChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              {/* <XAxis dataKey="month" /> */} {/* Update dataKey based on your monthlyBookings structure */}
              {/* <YAxis /> */}
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              <Area type="monotone" dataKey="revenue" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              {/* TODO: Calculate data for booking status distribution (Completed vs Ongoing) */}
              <Pie
                data={bookingStatusDistribution} // Replace with calculated booking status data
                cx="50%"
                cy="50%"
                outerRadius={80}
                // fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {bookingStatusDistribution.map((entry, index) => ( 
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
            </RechartsPieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Destinations */}
      {/* TODO: Replace Client Analytics section with Top Destinations */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Metrics</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              {/* TODO: Display Top Destinations */}
              <span className="text-gray-600">Top Destinations</span>
              {/* Example: */}
              {/* <ul>
                {topDestinations.map((dest, index) => (
                  <li key={index}>{dest.name}: {dest.count} bookings</li>
                ))}
              </ul> */}
            </div>
          </div>
        </motion.div>

        {/* Customer Ratings/Feedback Trends */}
        {/* TODO: Implement a section for Customer Ratings/Feedback Trends based on reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Feedback</h3>
          <div className="space-y-4">
            {/* TODO: Display average rating or sentiment analysis */}
            {/* Example: */}
            {/* <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Rating</span>
              <div className="flex items-center space-x-1">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="font-semibold">TODO: Calculate average rating from reviews</span>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Acquisition & Retention</h3>
          <ResponsiveContainer width="100%" height={250}>
            {/* TODO: Use calculated monthly bookings data for a trend chart if desired */}
            <BarChart data={[]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="new" fill="#3B82F6" name="New Clients" />
              <Bar dataKey="retained" fill="#10B981" name="Retained Clients" />
            </BarChart>

         </div>
        </motion.div>
      </div>


      {/* Booking Status Distribution (Pie Chart) and Booking Performance (Metrics) */}
      {/* TODO: Adapt or replace Project Metrics section for Booking Status and Performance */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Project Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            {bookingStatusDistribution && bookingStatusDistribution.length > 0 ? (
              <RechartsPieChart>
                {/* TODO: Use data for booking status distribution */}
                <Pie
                  data={bookingStatusDistribution} // Replace with calculated booking status data
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  // fill="#8884d8" // Use COLORS based on booking status
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {bookingStatusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No booking status data available.</div>
            )}
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Booking Performance</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Completion Rate</span> {/* TODO: Calculate a relevant completion rate for bookings if needed */}
                <span className="font-semibold">{/* TODO: Calculate a relevant completion rate for bookings if needed */}N/A%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  // TODO: Calculate a relevant completion rate for bookings if needed
                  style={{ width: `0%` }} 
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{completedBookingsCount}</div>\
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                {/* TODO: Display another relevant booking metric, e.g., average booking value */}
                <div className="text-2xl font-bold text-gray-900">N/A</div>\
                <div className="text-sm text-gray-600">Avg. Duration (days)</div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>


      {/* Financial Insights */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Financial Overview</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-gray-700">Profit Margin</span>
              <span className="text-xl font-bold text-green-600">{/* TODO: Calculate Profit Margin */}N/A%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700">ROI</span>
              <span className="text-xl font-bold text-blue-600">{/* TODO: Calculate ROI */}N/A%</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
              <span className="text-gray-700">Cost per Client</span>
              <span className="text-xl font-bold text-amber-600">${/* TODO: Calculate Cost per Client */}N/A</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="text-gray-700">Operating Costs</span>
              <span className="text-xl font-bold text-red-600">${/* TODO: Calculate Operating Costs */}N/A</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Cost Breakdown</h3>
          <div className="space-y-3">
            {/* TODO: Implement logic to display a relevant financial breakdown using actual data from bookings and tours */}
          </div>
        </motion.div>
      </div>
    </div>
  );
};