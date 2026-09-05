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
  [key: string]: any;
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

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  bookings, 
  tours, 
  reviews,
  totalBookings,
  ongoingBookingsCount,
  completedBookingsCount,
  currentMonthRevenue,
  topDestinations,
  monthlyBookings,
  averageRating
}) => {
  const [dateRange, setDateRange] = useState('30d');
  const [selectedTeam, setSelectedTeam] = useState('all');
  const [selectedProjectType, setSelectedProjectType] = useState('all');

  // Helper function to filter bookings by date range
  const getFilteredBookings = useMemo(() => {
    const now = new Date();
    let startDate = new Date();
    
    switch (dateRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }
    
    startDate.setHours(0, 0, 0, 0);
    
    return bookings.filter(booking => {
      // Use bookingDate if available, otherwise use tourDate
      const dateToCheck = booking.bookingDate || booking.tourDate;
      if (!dateToCheck) return false;
      
      const bookingDate = dateToCheck instanceof Date 
        ? dateToCheck 
        : new Date(dateToCheck);
      
      return bookingDate >= startDate && bookingDate <= now;
    });
  }, [bookings, dateRange]);

  // Calculate filtered metrics based on date range
  const filteredMetrics = useMemo(() => {
    const filteredCompleted = getFilteredBookings.filter(b => b.status === 'completed');
    const filteredRevenue = filteredCompleted.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    const filteredOngoing = getFilteredBookings.filter(b => 
      b.status !== 'completed' && b.status !== 'cancelled'
    ).length;
    const filteredCompletedCount = filteredCompleted.length;
    
    return {
      totalBookings: getFilteredBookings.length,
      ongoingBookingsCount: filteredOngoing,
      completedBookingsCount: filteredCompletedCount,
      currentMonthRevenue: filteredRevenue
    };
  }, [getFilteredBookings]);

  // Calculate booking status distribution from filtered bookings
  const bookingStatusDistribution = useMemo(() => {
    const statusCounts: Record<string, number> = {};
    getFilteredBookings.forEach(booking => {
      const status = booking.status || 'pending';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = getFilteredBookings.length;
    if (total === 0) return [];

    const distribution: BookingStatusData[] = Object.entries(statusCounts).map(([status, count]) => {
      let color = '#6B7280'; // default gray
      let displayName = status.charAt(0).toUpperCase() + status.slice(1);
      
      switch (status.toLowerCase()) {
        case 'completed':
          color = '#10B981'; // green
          break;
        case 'confirmed':
          color = '#3B82F6'; // blue
          break;
        case 'pending':
          color = '#F59E0B'; // amber
          break;
        case 'cancelled':
          color = '#EF4444'; // red
          break;
      }

      return {
        name: displayName,
        value: Math.round((count / total) * 100),
        color
      };
    });

    return distribution;
  }, [getFilteredBookings]);

  // Convert topDestinations from [string, number][] to display format
  const topDestinationsData = useMemo(() => {
    return topDestinations.map(([destination, count]) => ({
      destination,
      count
    }));
  }, [topDestinations]);

  // Calculate revenue data for monthly chart (filtered)
  const revenueChartData = useMemo(() => {
    return monthlyBookings.map(monthData => ({
      month: monthData.month,
      revenue: getFilteredBookings
        .filter(b => {
          const dateToCheck = b.tourDate || b.bookingDate;
          if (!dateToCheck) return false;
          const bookingDate = dateToCheck instanceof Date ? dateToCheck : new Date(dateToCheck);
          const bookingMonth = bookingDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          return bookingMonth === monthData.month && b.status === 'completed';
        })
        .reduce((sum, b) => sum + (b.totalPrice || 0), 0)
    }));
  }, [monthlyBookings, getFilteredBookings]);

  // Calculate financial metrics (filtered)
  const financialMetrics = useMemo(() => {
    const totalRevenue = getFilteredBookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    const totalBookingsCount = getFilteredBookings.filter(b => b.status === 'completed').length;
    
    // Estimate costs (assuming 70% of revenue goes to costs, 30% profit margin)
    // This is a reasonable estimate for tour agencies
    const estimatedCosts = totalRevenue * 0.7;
    const profit = totalRevenue - estimatedCosts;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    // ROI calculation (assuming initial investment is 20% of revenue)
    const estimatedInvestment = totalRevenue * 0.2;
    const roi = estimatedInvestment > 0 ? ((profit / estimatedInvestment) * 100) : 0;
    
    // Cost per client (average cost per completed booking)
    const costPerClient = totalBookingsCount > 0 ? estimatedCosts / totalBookingsCount : 0;
    
    // Operating costs (monthly estimate based on total bookings)
    const operatingCosts = estimatedCosts;

    return {
      totalRevenue,
      profitMargin,
      roi,
      costPerClient,
      operatingCosts,
      profit
    };
  }, [getFilteredBookings]);

  // Calculate cost breakdown by category (filtered)
  const costBreakdown = useMemo(() => {
    const categoryRevenue: Record<string, { revenue: number; bookings: number }> = {};
    
    getFilteredBookings
      .filter(b => b.status === 'completed')
      .forEach(booking => {
        const tour = tours.find(t => t.id === booking.tourId);
        const category = tour?.category || 'Other';
        
        if (!categoryRevenue[category]) {
          categoryRevenue[category] = { revenue: 0, bookings: 0 };
        }
        
        categoryRevenue[category].revenue += booking.totalPrice || 0;
        categoryRevenue[category].bookings += 1;
      });

    return Object.entries(categoryRevenue)
      .map(([category, data]) => ({
        category,
        revenue: data.revenue,
        bookings: data.bookings,
        averageValue: data.bookings > 0 ? data.revenue / data.bookings : 0
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [getFilteredBookings, tours]);

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
          title={`Revenue (${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : dateRange === '90d' ? 'Last 90 days' : 'Last year'})`}
          value={filteredMetrics.currentMonthRevenue}
          change={0} 
          icon={DollarSign}
          color="bg-green-500"
          prefix="$"
        />
        <MetricCard
          title={`Total Bookings (${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : dateRange === '90d' ? 'Last 90 days' : 'Last year'})`}
          value={filteredMetrics.totalBookings}
          change={0} 
          icon={Users}
          color="bg-blue-500"
        />
        <MetricCard
          title={`Ongoing Bookings (${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : dateRange === '90d' ? 'Last 90 days' : 'Last year'})`}
          value={filteredMetrics.ongoingBookingsCount}
          change={0} 
          icon={Briefcase}
          color="bg-purple-500"
        />
        <MetricCard
          title={`Completed Bookings (${dateRange === '7d' ? 'Last 7 days' : dateRange === '30d' ? 'Last 30 days' : dateRange === '90d' ? 'Last 90 days' : 'Last year'})`}
          value={filteredMetrics.completedBookingsCount}
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
            <AreaChart data={revenueChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Revenue']} />
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
            {bookingStatusDistribution.length > 0 ? (
              <RechartsPieChart>
                <Pie
                  data={bookingStatusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}%`}
                >
                  {bookingStatusDistribution.map((entry, index) => ( 
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </RechartsPieChart>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">No booking status data available.</div>
            )}
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Destinations */}
      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Top Destinations</h3>
          <div className="space-y-4">
            {topDestinationsData.length > 0 ? (
              topDestinationsData.map((dest, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-amber-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900">{dest.destination}</span>
                  </div>
                  <span className="text-gray-600 font-semibold">{dest.count} bookings</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">No destination data available</div>
            )}
          </div>
        </motion.div>

        {/* Customer Ratings/Feedback Trends */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Customer Feedback</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
              <span className="text-gray-700 font-medium">Average Rating</span>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-5 w-5 ${i < Math.round(averageRating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                    />
                  ))}
                </div>
                <span className="font-bold text-gray-900 text-xl">{averageRating.toFixed(1)}</span>
                <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Positive Reviews</div>
                <div className="text-2xl font-bold text-green-600">
                  {reviews.length > 0 
                    ? Math.round((reviews.filter(r => {
                        const review = r as any; // Type assertion for optional sentiment fields
                        return review.sentimentLabel === 'positive' || review.sentimentAnalysis?.sentiment === 'positive';
                      }).length / reviews.length) * 100)
                    : 0}%
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Total Reviews</div>
                <div className="text-2xl font-bold text-blue-600">{reviews.length}</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Bookings Trend</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyBookings}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="bookings" fill="#3B82F6" name="Bookings" />
            </BarChart>
          </ResponsiveContainer>
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
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-semibold">
                  {filteredMetrics.totalBookings > 0 
                    ? Math.round((filteredMetrics.completedBookingsCount / filteredMetrics.totalBookings) * 100) 
                    : 0}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all" 
                  style={{ 
                    width: `${filteredMetrics.totalBookings > 0 ? (filteredMetrics.completedBookingsCount / filteredMetrics.totalBookings) * 100 : 0}%` 
                  }} 
                ></div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{filteredMetrics.completedBookingsCount}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">
                  ${filteredMetrics.totalBookings > 0 
                    ? Math.round(getFilteredBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0) / filteredMetrics.totalBookings)
                    : 0}
                </div>
                <div className="text-sm text-gray-600">Avg. Booking Value</div>
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
              <span className="text-gray-700">Total Revenue</span>
              <span className="text-xl font-bold text-green-600">
                ${financialMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
              <span className="text-gray-700">Profit Margin</span>
              <span className="text-xl font-bold text-green-600">
                {financialMetrics.profitMargin.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
              <span className="text-gray-700">ROI</span>
              <span className="text-xl font-bold text-blue-600">
                {financialMetrics.roi.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-amber-50 rounded-lg">
              <span className="text-gray-700">Cost per Client</span>
              <span className="text-xl font-bold text-amber-600">
                ${financialMetrics.costPerClient.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-red-50 rounded-lg">
              <span className="text-gray-700">Operating Costs</span>
              <span className="text-xl font-bold text-red-600">
                ${financialMetrics.operatingCosts.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between items-center p-4 bg-purple-50 rounded-lg">
              <span className="text-gray-700">Net Profit</span>
              <span className="text-xl font-bold text-purple-600">
                ${financialMetrics.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Revenue by Category</h3>
          <div className="space-y-4">
            {costBreakdown.length > 0 ? (
              <>
                {costBreakdown.map((item, index) => {
                  const percentage = financialMetrics.totalRevenue > 0 
                    ? (item.revenue / financialMetrics.totalRevenue) * 100 
                    : 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-gray-900 capitalize">{item.category}</span>
                          <span className="text-sm text-gray-500">({item.bookings} bookings)</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          ${item.revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full transition-all" 
                          style={{ width: `${percentage}%` }} 
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{percentage.toFixed(1)}% of total revenue</span>
                        <span>Avg: ${item.averageValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Total Revenue</span>
                    <span className="text-lg font-bold text-amber-600">
                      ${financialMetrics.totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No revenue data available by category
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};