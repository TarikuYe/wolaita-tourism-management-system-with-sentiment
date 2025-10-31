import React, { useEffect, useState, useRef, useCallback } from 'react';
import { db } from '../../config/firebase';
import { 
  collection, doc, query, where, orderBy, 
  writeBatch, onSnapshot, getDoc 
} from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { 
  FiArrowUp, FiArrowDown, FiCheckCircle, 
  FiAlertCircle, FiClock, FiUser, FiSearch, FiDownload, 
  FiCheckSquare, FiDollarSign, FiCalendar, FiFileText, FiX 
} from 'react-icons/fi';
import { CSVLink } from 'react-csv';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { enUS } from 'date-fns/locale'; 

registerLocale('en-US', enUS);

const EXCHANGE_RATES = {
  USD: 1,
  ETB: 55 // 1 USD = 55 ETB
};

interface PaymentData {
  description?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string | null;
}

interface Payment {
  id: string;
  amount: number;
  bookingId: string;
  createdAt: any;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  method: string;
  status: 'pending' | 'pending_verification' | 'verified' | 'failed';
  txRef: string;
  verifiedBy?: string;
  verifiedByName?: string;
  verifiedAt?: any;
  error?: string;
  receiptUrl?: string;
  phone_number?: string | null;
  paymentData?: PaymentData;
  userId: string;
}

interface DashboardStats {
  total: number;
  pending: number;
  verified: number;
  failed: number;
  totalAmountUSD: number;
  totalAmountETB: number;
  displayCurrency: string;
}

interface UserData {
  name: string;
  email: string;
  phone: string;
  role: string;
  verified: boolean;
  createdAt: any;
}

export default function CashierDashboard() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCurrency, setFilterCurrency] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [minAmount, setMinAmount] = useState<number | ''>('');
  const [maxAmount, setMaxAmount] = useState<number | ''>('');
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    pending: 0,
    verified: 0,
    failed: 0,
    totalAmountUSD: 0,
    totalAmountETB: 0,
    displayCurrency: 'USD'
  });
  const [userData, setUserData] = useState<Record<string, UserData>>({});
  const csvLinkRef = useRef<any>(null);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const convertToUSD = useCallback((amount: number, currency: string) => {
    return currency === 'USD' ? amount : amount / EXCHANGE_RATES.ETB;
  }, []);

  const convertToETB = useCallback((amount: number, currency: string) => {
    return currency === 'ETB' ? amount : amount * EXCHANGE_RATES.ETB;
  }, []);

  const fetchUserData = useCallback(async (userIds: string[]) => {
    try {
      const uniqueIds = Array.from(new Set(userIds.filter(id => id)));
      if (uniqueIds.length === 0) return;

      const userDocs = await Promise.all(
        uniqueIds.map(id => getDoc(doc(db, 'users', id)))
      );

      const newUserData: Record<string, UserData> = {};
      userDocs.forEach((docSnap, index) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          newUserData[uniqueIds[index]] = {
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || '',
            verified: data.verified || false,
            createdAt: data.createdAt?.toDate()
          };
        }
      });

      setUserData(prev => ({ ...prev, ...newUserData }));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  }, []);

  const fetchPayments = useCallback(() => {
    if (!currentUser || currentUser.role !== 'cashier') return;
    setLoading(true);

    try {
      let q = query(collection(db, 'payments'));

      if (filterStatus !== 'all') {
        q = query(q, where('status', '==', filterStatus));
      }

      if (filterCurrency !== 'all') {
        q = query(q, where('currency', '==', filterCurrency));
      }

      if (startDate && endDate) {
        q = query(q, 
          where('createdAt', '>=', startDate),
          where('createdAt', '<=', new Date(endDate.getTime() + 86400000))
        );
      }

      if (minAmount !== '' || maxAmount !== '') {
        if (minAmount !== '' && maxAmount !== '') {
          q = query(q, 
            where('amount', '>=', minAmount),
            where('amount', '<=', maxAmount)
          );
        } else if (minAmount !== '') {
          q = query(q, where('amount', '>=', minAmount));
        } else {
          q = query(q, where('amount', '<=', maxAmount));
        }
      }

      q = query(q, orderBy(sortBy, sortDirection));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const paymentsData = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            first_name: data.first_name || data.paymentData?.first_name || '',
            last_name: data.last_name || data.paymentData?.last_name || '',
            email: data.email || data.paymentData?.email || '',
            amount: data.amount || 0,
            currency: data.currency || 'ETB',
            bookingId: data.bookingId || '',
            createdAt: data.createdAt?.toDate(),
            method: data.method || '',
            status: data.status || 'pending',
            txRef: data.txRef || '',
            verifiedBy: data.verifiedBy,
            verifiedByName: data.verifiedByName,
            verifiedAt: data.verifiedAt?.toDate(),
            error: data.error,
            receiptUrl: data.receiptUrl || undefined,
            phone_number: data.phone_number || data.paymentData?.phone_number || null,
            paymentData: data.paymentData || {},
            userId: data.userId || ''
          } as Payment;
        });

        const filteredData = searchQuery 
          ? paymentsData.filter(payment => 
              `${payment.first_name} ${payment.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.bookingId.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.txRef.toLowerCase().includes(searchQuery.toLowerCase()) ||
              payment.amount.toString().includes(searchQuery) ||
              payment.userId.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : paymentsData;

        setPayments(filteredData);
        calculateStatistics(filteredData);
        
        const userIds = filteredData.map(p => p.userId).filter(id => id);
        if (userIds.length > 0) {
          fetchUserData(userIds);
        }
        
        setSelectedPayments([]);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      toast.error('Failed to load payments');
      console.error('Error fetching payments:', error);
      setLoading(false);
    }
  }, [currentUser, filterStatus, filterCurrency, sortBy, sortDirection, startDate, endDate, minAmount, maxAmount, searchQuery, fetchUserData]);

  const calculateStatistics = useCallback((payments: Payment[]) => {
    const totalAmountUSD = payments.reduce((sum, p) => sum + convertToUSD(p.amount, p.currency), 0);
    const totalAmountETB = payments.reduce((sum, p) => sum + convertToETB(p.amount, p.currency), 0);

    const newStats = {
      total: payments.length,
      pending: payments.filter(p => p.status === 'pending' || p.status === 'pending_verification').length,
      verified: payments.filter(p => p.status === 'verified').length,
      failed: payments.filter(p => p.status === 'failed').length,
      totalAmountUSD,
      totalAmountETB,
      displayCurrency: 'USD'
    };
    setStats(newStats);
  }, [convertToUSD, convertToETB]);

  const generateReceipt = useCallback((payment: Payment) => {
    if (!payment) {
      toast.error('Invalid payment data');
      return;
    }

    const user = userData[payment.userId] || {};
    const userName = user.name || `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || 'Customer';
    const email = user.email || payment.email;
    
    const description = payment.paymentData?.description || 'Tour Booking Payment';
    const method = payment.method || 'N/A';
    const error = payment.error || '';

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('PAYMENT RECEIPT', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text('Tour Booking System', 105, 30, { align: 'center' });
    doc.text('123 Travel Street, Tourism City', 105, 35, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Receipt #: ${payment.bookingId || 'N/A'}`, 20, 50);
    doc.text(`Date: ${formatDate(payment.createdAt) || 'N/A'}`, 20, 60);
    doc.text(`Status: ${payment.status ? payment.status.toUpperCase() : 'N/A'}`, 20, 70);
    doc.text(`Payment Method: ${method.toUpperCase()}`, 20, 80);
    
    doc.text(`Customer: ${userName}`, 20, 95);
    doc.text(`Email: ${email}`, 20, 105);
    
    if (payment.phone_number || user.phone) {
      doc.text(`Phone: ${payment.phone_number || user.phone}`, 20, 115);
    }

    if (payment.status === 'failed' && error) {
      doc.setFontSize(10);
      doc.setTextColor(255, 0, 0);
      doc.text(`Error: ${error}`, 20, 125);
      doc.setTextColor(0, 0, 0);
    }
    
    doc.setFontSize(14);
    doc.text('Payment Details', 20, payment.status === 'failed' && error ? 140 : 130);
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, payment.status === 'failed' && error ? 145 : 135, 190, payment.status === 'failed' && error ? 145 : 135);
    
    doc.setFontSize(12);
    doc.text('Description', 20, payment.status === 'failed' && error ? 160 : 150);
    doc.text('Amount', 160, payment.status === 'failed' && error ? 160 : 150, { align: 'right' });
    
    doc.text(description, 20, payment.status === 'failed' && error ? 170 : 160);
    doc.text(`${payment.amount ? payment.amount.toLocaleString() : '0'} ${payment.currency || ''}`, 
      160, payment.status === 'failed' && error ? 170 : 160, { align: 'right' });
    
    doc.text('Equivalent in USD:', 20, payment.status === 'failed' && error ? 185 : 175);
    doc.text(`${convertToUSD(payment.amount || 0, payment.currency || 'ETB').toLocaleString()} USD`, 
      160, payment.status === 'failed' && error ? 185 : 175, { align: 'right' });
    
    doc.text('Equivalent in ETB:', 20, payment.status === 'failed' && error ? 200 : 190);
    doc.text(`${convertToETB(payment.amount || 0, payment.currency || 'ETB').toLocaleString()} ETB`, 
      160, payment.status === 'failed' && error ? 200 : 190, { align: 'right' });
    
    doc.setFontSize(10);
    const finalY = payment.status === 'failed' && error ? 220 : 210;
    doc.text('Thank you for your booking!', 105, finalY, { align: 'center' });
    doc.text('This receipt is generated automatically and does not require signature', 105, finalY + 10, { align: 'center' });
    
    doc.save(`receipt-${payment.bookingId || 'receipt'}.pdf`);
  }, [formatDate, convertToUSD, convertToETB, userData]);

  const handleVerify = useCallback(async (paymentId: string) => {
    if (!currentUser?.id) {
      toast.error('Authentication required');
      return;
    }

    try {
      const batch = writeBatch(db);
      const paymentRef = doc(db, 'payments', paymentId);
      const verificationTime = new Date();

      batch.update(paymentRef, {
        status: 'verified',
        updatedAt: verificationTime,
        verifiedBy: currentUser.id,
        verifiedByName: currentUser.name || 'Cashier',
        verifiedAt: verificationTime
      });

      const logRef = doc(collection(db, 'paymentVerificationLogs'));
      batch.set(logRef, {
        paymentId,
        verifiedBy: currentUser.id,
        verifiedAt: verificationTime,
        action: 'verification'
      });

      const paymentDoc = await getDoc(paymentRef);
      if (paymentDoc.exists()) {
        const paymentData = paymentDoc.data();
        if (paymentData.bookingId) {
          const bookingRef = doc(db, 'bookings', paymentData.bookingId);
          batch.update(bookingRef, {
            paymentStatus: 'verified',
            updatedAt: verificationTime
          });
        }
      }

      await batch.commit();
      
      const verifiedPayment = payments.find(p => p.id === paymentId);
      if (verifiedPayment) {
        const updatedPayment: Payment = {
          ...verifiedPayment,
          status: 'verified',
          verifiedBy: currentUser.id,
          verifiedByName: currentUser.name || 'Cashier',
          verifiedAt: verificationTime
        };
        generateReceipt(updatedPayment);
      }
      
      toast.success('Payment verified and receipt generated!');
    } catch (error) {
      toast.error(`Failed to verify payment: ${(error as Error).message}`);
      console.error('Verification error:', error);
    }
  }, [currentUser, payments, generateReceipt]);

  const bulkVerifyPayments = useCallback(async () => {
    if (!currentUser?.id || selectedPayments.length === 0) return;

    try {
      const batch = writeBatch(db);
      const verificationTime = new Date();

      for (const paymentId of selectedPayments) {
        const paymentRef = doc(db, 'payments', paymentId);
        
        batch.update(paymentRef, {
          status: 'verified',
          updatedAt: verificationTime,
          verifiedBy: currentUser.id,
          verifiedByName: currentUser.name || 'Cashier',
          verifiedAt: verificationTime
        });

        const logRef = doc(collection(db, 'paymentVerificationLogs'));
        batch.set(logRef, {
          paymentId,
          verifiedBy: currentUser.id,
          verifiedAt: verificationTime,
          action: 'bulk_verification'
        });

        const paymentDoc = await getDoc(paymentRef);
        if (paymentDoc.exists()) {
          const paymentData = paymentDoc.data();
          if (paymentData.bookingId) {
            const bookingRef = doc(db, 'bookings', paymentData.bookingId);
            batch.update(bookingRef, {
              paymentStatus: 'verified',
              updatedAt: verificationTime
            });
          }
        }
      }

      await batch.commit();
      toast.success(`${selectedPayments.length} payments verified successfully!`);
    } catch (error) {
      toast.error('Failed to verify payments');
      console.error('Bulk verification error:', error);
    }
  }, [currentUser, selectedPayments]);

  const togglePaymentSelection = useCallback((paymentId: string) => {
    setSelectedPayments(prev =>
      prev.includes(paymentId)
        ? prev.filter(id => id !== paymentId)
        : [...prev, paymentId]
    );
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedPayments.length === payments.length) {
      setSelectedPayments([]);
    } else {
      setSelectedPayments(payments.map(p => p.id));
    }
  }, [payments, selectedPayments]);

  const generateCSVData = useCallback(() => {
    return payments.map(payment => {
      const user = userData[payment.userId] || {};
      return {
        'Booking ID': payment.bookingId,
        'Customer': user.name || `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || 'Customer',
        'Email': user.email || payment.email,
        'User ID': payment.userId,
        'Phone': payment.phone_number || user.phone || 'N/A',
        'Amount (Original)': payment.amount,
        'Currency': payment.currency,
        'Amount (USD)': convertToUSD(payment.amount, payment.currency),
        'Amount (ETB)': convertToETB(payment.amount, payment.currency),
        'Method': payment.method,
        'Status': payment.status,
        'Date': formatDate(payment.createdAt),
        'Verified By': payment.verifiedByName || 'N/A',
        'Verified At': payment.verifiedAt ? formatDate(payment.verifiedAt) : 'N/A',
        'Transaction Ref': payment.txRef,
        'Error': payment.error || 'N/A',
        'Receipt URL': payment.receiptUrl || 'N/A',
        'Description': payment.paymentData?.description || 'N/A'
      };
    });
  }, [payments, userData, formatDate, convertToUSD, convertToETB]);

  const generatePDFReport = useCallback(() => {
    const doc = new jsPDF();
    const title = 'Payment Report';
    const dateRange = startDate && endDate 
      ? `${formatDate(startDate)} - ${formatDate(endDate)}` 
      : 'All Dates';
    
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated on: ${formatDate(new Date())}`, 105, 28, { align: 'center' });
    doc.text(`Date Range: ${dateRange}`, 105, 35, { align: 'center' });
    
    const headers = [
      ['Booking ID', 'Customer', 'Amount', 'Currency', 'Status', 'Date', 'User ID']
    ];
    
    const data = payments.map(payment => {
      const user = userData[payment.userId] || {};
      return [
        payment.bookingId,
        user.name || `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || 'Customer',
        payment.amount.toLocaleString(),
        payment.currency,
        payment.status,
        formatDate(payment.createdAt),
        payment.userId
      ];
    });

    (doc as any).autoTable({
      head: headers,
      body: data,
      startY: 40,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 185] }
    });

    doc.setFontSize(12);
    doc.text('Summary Statistics', 14, (doc as any).lastAutoTable.finalY + 20);
    
    (doc as any).autoTable({
      startY: (doc as any).lastAutoTable.finalY + 25,
      body: [
        ['Total Payments', stats.total],
        ['Pending', stats.pending],
        ['Verified', stats.verified],
        ['Failed', stats.failed],
        ['Total Amount (USD)', `${stats.totalAmountUSD.toLocaleString()} USD`],
        ['Total Amount (ETB)', `${stats.totalAmountETB.toLocaleString()} ETB`]
      ],
      styles: { fontSize: 10 },
      columnStyles: {
        0: { fontStyle: 'bold' },
        1: { halign: 'right' }
      }
    });

    doc.save(`payment-report-${new Date().toISOString().slice(0,10)}.pdf`);
  }, [payments, stats, startDate, endDate, formatDate, userData]);

  const clearFilters = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    setMinAmount('');
    setMaxAmount('');
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCurrency('all');
  }, []);

  useEffect(() => {
    const unsubscribe = fetchPayments();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchPayments]);

  if (!currentUser) return <div className="flex justify-center items-center h-screen">Loading user data...</div>;
  if (currentUser.role !== 'cashier') return (
    <div className="flex justify-center items-center h-screen">
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded max-w-md">
        <h3 className="font-bold">Access Denied</h3>
        <p>You don't have permission to access the cashier dashboard.</p>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Payment Management</h1>
          <p className="text-gray-600">Review and verify customer payments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={generatePDFReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            disabled={loading || payments.length === 0}
          >
            <FiDownload /> PDF Report
          </button>
          <CSVLink
            data={generateCSVData()}
            filename={`payments-${new Date().toISOString().slice(0,10)}.csv`}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            ref={csvLinkRef}
            asyncOnClick={true}
            onClick={() => {
              if (payments.length === 0) {
                toast.error('No data to export');
                return false;
              }
              return true;
            }}
          >
            <FiDownload /> Export CSV
          </CSVLink>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Payments</h3>
          <p className="text-2xl font-semibold">{stats.total}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Pending</h3>
          <p className="text-2xl font-semibold text-yellow-600">{stats.pending}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Verified</h3>
          <p className="text-2xl font-semibold text-green-600">{stats.verified}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Failed</h3>
          <p className="text-2xl font-semibold text-red-600">{stats.failed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
          <p className="text-2xl font-semibold">
            {stats.totalAmountUSD.toLocaleString()} USD
          </p>
          <p className="text-sm text-gray-500">
            ≈ {stats.totalAmountETB.toLocaleString()} ETB
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search payments..."
                className="pl-10 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex gap-2">
              <DatePicker
                selected={startDate}
                onChange={(date: Date | null) => setStartDate(date)}
                selectsStart
                startDate={startDate}
                endDate={endDate}
                placeholderText="Start Date"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="MMM d, yyyy"
                locale="en-US"
              />
              <DatePicker
                selected={endDate}
                onChange={(date: Date | null) => setEndDate(date)}
                selectsEnd
                startDate={startDate}
                endDate={endDate}
                minDate={startDate === null ? undefined : startDate}
                placeholderText="End Date"
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                dateFormat="MMM d, yyyy"
                locale="en-US"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount Range</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="Min"
                  className="pl-8 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value ? Number(e.target.value) : '')}
                  min="0"
                />
              </div>
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiDollarSign className="text-gray-400" />
                </div>
                <input
                  type="number"
                  placeholder="Max"
                  className="pl-8 w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value ? Number(e.target.value) : '')}
                  min={minAmount !== '' ? minAmount : 0}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Payments</option>
              <option value="pending">Pending</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="verified">Verified</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
            <select
              className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
            >
              <option value="all">All Currencies</option>
              <option value="USD">USD</option>
              <option value="ETB">ETB</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <FiX /> Clear Filters
          </button>
        </div>
      </div>

      {selectedPayments.length > 0 && (
        <div className="bg-blue-50 rounded-lg shadow p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-medium">{selectedPayments.length} payments selected</span>
            <button 
              onClick={() => setSelectedPayments([])}
              className="text-blue-600 hover:text-blue-800"
            >
              <FiX />
            </button>
          </div>
          <button
            onClick={bulkVerifyPayments}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <FiCheckSquare /> Verify Selected
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h3 className="text-lg font-medium text-gray-700 mb-2">No payments found</h3>
          <p className="text-gray-500">Try adjusting your filters or search criteria</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedPayments.length === payments.length && payments.length > 0}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Booking ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => {
                  const user = userData[payment.userId] || {};
                  const userName = user.name || `${payment.first_name || ''} ${payment.last_name || ''}`.trim() || 'Customer';
                  const email = user.email || payment.email;
                  
                  return (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedPayments.includes(payment.id)}
                          onChange={() => togglePaymentSelection(payment.id)}
                          className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <FiUser className="text-gray-600" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {userName}
                            </div>
                            <div className="text-sm text-gray-500">{email}</div>
                            {payment.userId && (
                              <div className="text-xs text-gray-400 mt-1">
                                ID: {payment.userId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.currency === 'USD' ? 
                            `≈ ${convertToETB(payment.amount, payment.currency).toLocaleString()} ETB` :
                            `≈ ${convertToUSD(payment.amount, payment.currency).toLocaleString()} USD`}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{payment.method}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'verified' ? 'bg-green-100 text-green-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          (payment.status === 'pending' || payment.status === 'pending_verification') ? 
                            'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {payment.status.toUpperCase()}
                        </span>
                        {payment.status === 'verified' && payment.verifiedByName && (
                          <div className="text-xs text-gray-500 mt-1">
                            by {payment.verifiedByName}
                          </div>
                        )}
                        {payment.status === 'failed' && payment.error && (
                          <div className="text-xs text-red-500 mt-1 truncate max-w-xs">
                            {payment.error}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(payment.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {payment.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payment.method === 'manual' && payment.receiptUrl ? (
                          <a href={payment.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-900 flex items-center gap-1">
                            <FiFileText /> View Receipt
                          </a>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {(payment.status === 'pending' || payment.status === 'pending_verification') && (
                            <button
                              onClick={() => handleVerify(payment.id)}
                              className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            >
                              <FiCheckCircle /> Verify
                            </button>
                          )}
                          {payment.status === 'verified' && (
                            <button
                              onClick={() => generateReceipt(payment)}
                              className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                            >
                              <FiFileText /> Receipt
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}