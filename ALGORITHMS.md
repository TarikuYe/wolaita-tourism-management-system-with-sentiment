# Wolaita Tourism Platform - Algorithms Documentation

This document provides a comprehensive overview of all major algorithms used across the Wolaita Tourism Platform, including Web, Android, Backend, and ML components.

---

## Table of Contents

1. [Machine Learning Algorithms](#machine-learning-algorithms)
2. [Data Query & Filtering Algorithms](#data-query--filtering-algorithms)
3. [Pagination Algorithms](#pagination-algorithms)
4. [Sorting Algorithms](#sorting-algorithms)
5. [Aggregation & Statistics Algorithms](#aggregation--statistics-algorithms)
6. [Search Algorithms](#search-algorithms)
7. [Payment Processing Algorithms](#payment-processing-algorithms)
8. [Authentication & Authorization Algorithms](#authentication--authorization-algorithms)
9. [Analytics & Calculation Algorithms](#analytics--calculation-algorithms)
10. [Android-Specific Algorithms](#android-specific-algorithms)

---

## Machine Learning Algorithms

### 1. Hybrid Sentiment Analysis Model
**Location:** `backend/app.py`, `backend/models/trained_hybrid_model/`

**Algorithm Type:** Deep Learning (Transformer-based)

**Description:**
- Uses a pre-trained transformer model (AutoModelForSequenceClassification) for sentiment analysis
- Implements a hybrid approach combining transformer architecture with traditional ML techniques
- Processes review text to classify sentiment as positive, neutral, or negative

**Key Components:**
- **Tokenization:** Uses AutoTokenizer with truncation and padding
- **Model Architecture:** Transformer-based sequence classification
- **Prediction:** Softmax activation on logits to get probability distribution
- **Confidence Calculation:** Maximum probability from softmax output

**Implementation:**
```python
def predict_sentiment(text):
    inputs = tokenizer(text, return_tensors="pt", truncation=True, padding=True)
    outputs = model(**inputs)
    probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
    pred_class = torch.argmax(probs, dim=1).item()
    confidence = torch.max(probs).item()
```

**Time Complexity:** O(n) where n is text length
**Space Complexity:** O(n)

---

### 2. TF-IDF Vectorizer (Legacy)
**Location:** `functions/main.py`

**Algorithm Type:** Natural Language Processing

**Description:**
- Alternative sentiment analysis using TF-IDF vectorization with scikit-learn
- Converts text to numerical features using Term Frequency-Inverse Document Frequency
- Used as fallback when transformer model is unavailable

**Key Components:**
- Text vectorization using TF-IDF
- Classification using pre-trained model (joblib)
- Confidence calculation from prediction probabilities

---

## Data Query & Filtering Algorithms

### 3. Firestore Query Builder
**Location:** `src/hooks/useFirestore.ts`

**Algorithm Type:** Query Construction

**Description:**
- Dynamically builds Firestore queries based on conditions
- Supports multiple WHERE clauses, ordering, and field mapping
- Implements real-time data synchronization using onSnapshot

**Key Features:**
- Conditional query building
- Real-time updates
- Error handling with index detection
- Data transformation via mapper functions

**Time Complexity:** O(1) for query construction, O(n) for data processing
**Space Complexity:** O(n) where n is number of documents

---

### 4. Multi-Criteria Filtering Algorithm
**Location:** `src/pages/Tours.tsx`, `src/pages/Dashboard/AgencyDashboard.tsx`

**Algorithm Type:** Filtering

**Description:**
- Filters tours/bookings based on multiple criteria simultaneously
- Supports category, search term, availability, and status filters
- Uses functional programming approach with filter chains

**Implementation:**
```typescript
const filteredTours = tours.filter((tour) => {
  const matchesCategory = selectedCategory === 'all' || 
    tour.category?.toLowerCase() === selectedCategory;
  const matchesSearch = !searchTerm || 
    tour.title?.toLowerCase().includes(searchTerm.toLowerCase());
  return matchesCategory && matchesSearch && tour.available !== false;
});
```

**Time Complexity:** O(n) where n is number of items
**Space Complexity:** O(n)

---

### 5. Android Tour Filtering Algorithm
**Location:** `android/app/src/main/java/com/wolaitatours/android/ui/tours/ToursViewModel.kt`

**Algorithm Type:** Multi-field Search & Filter

**Description:**
- Filters tours in Android app using case-insensitive string matching
- Searches across multiple fields: title, titleAm, category, description, location, agencyName
- Combines query matching with category filtering

**Implementation:**
```kotlin
private fun filteredTours(): List<Tour> {
    return current.tours.filter { tour ->
        val matchesQuery = if (current.query.isBlank()) {
            true
        } else {
            val q = current.query.trim()
            tour.title.contains(q, true) ||
            tour.titleAm.contains(q, true) ||
            tour.category.contains(q, true) ||
            // ... more fields
        }
        matchesQuery && matchesCategory && isAvailable
    }
}
```

**Time Complexity:** O(n * m) where n is tours, m is query length
**Space Complexity:** O(n)

---

## Pagination Algorithms

### 6. Cursor-Based Pagination
**Location:** `src/hooks/useFirestore.ts` - `useToursPaginated`

**Algorithm Type:** Pagination

**Description:**
- Implements cursor-based pagination using Firestore's `startAfter` and `limit`
- Loads data in chunks (6 items per page)
- Tracks last document for subsequent fetches

**Key Features:**
- Efficient for large datasets
- Prevents duplicate data
- Supports "Load More" functionality
- Handles empty results gracefully

**Implementation:**
```typescript
const fetchTours = async (startAfterDoc) => {
  let q = query(collection(db, 'tours'), orderBy('createdAt', 'desc'), limit(6));
  if (startAfterDoc) {
    q = query(q, startAfter(startAfterDoc));
  }
  const snapshot = await getDocs(q);
  setTours(prev => startAfterDoc ? [...prev, ...newTours] : newTours);
  setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
};
```

**Time Complexity:** O(k) where k is page size
**Space Complexity:** O(k)

---

## Sorting Algorithms

### 7. Multi-Field Sorting
**Location:** `src/pages/Dashboard/CashierDashboard.tsx`, `src/pages/Dashboard/AgencyDashboard.tsx`

**Algorithm Type:** Sorting

**Description:**
- Sorts bookings/payments by multiple criteria
- Supports ascending/descending order
- Handles date, amount, status, and custom field sorting

**Implementation:**
```typescript
const sortedBookings = bookings.sort((a, b) => {
  if (sortBy === 'date') {
    return (b.tourDate?.getTime() || 0) - (a.tourDate?.getTime() || 0);
  }
  if (sortBy === 'amount') {
    return (b.totalPrice || 0) - (a.totalPrice || 0);
  }
  return 0;
});
```

**Time Complexity:** O(n log n)
**Space Complexity:** O(1)

---

### 8. Confidence-Based Review Sorting
**Location:** `src/components/Analytics/SentimentAnalytics.tsx`

**Algorithm Type:** Sorting

**Description:**
- Sorts reviews by sentiment confidence score
- Prioritizes high-confidence negative reviews for moderation
- Used for identifying critical reviews needing attention

**Implementation:**
```typescript
const negativeReviews = reviews
  .filter(review => review.sentimentLabel === 'negative')
  .sort((a, b) => 
    (b.sentimentAnalysis?.confidence || 0) - 
    (a.sentimentAnalysis?.confidence || 0)
  );
```

**Time Complexity:** O(n log n)
**Space Complexity:** O(n)

---

## Aggregation & Statistics Algorithms

### 9. Sentiment Statistics Calculator
**Location:** `src/components/Analytics/SentimentAnalytics.tsx`

**Algorithm Type:** Statistical Aggregation

**Description:**
- Calculates comprehensive sentiment statistics from reviews
- Computes positive/negative/neutral counts and percentages
- Calculates average confidence scores
- Tracks flagged and deleted reviews

**Implementation:**
```typescript
const calculateStats = (reviewsData: Review[]) => {
  const positiveCount = reviewsData.filter(r => 
    r.sentimentLabel === 'positive').length;
  const totalConfidence = reviewsData.reduce((sum, review) => 
    sum + (review.sentimentAnalysis?.confidence || 0), 0);
  const averageConfidence = reviewsData.length > 0 ? 
    totalConfidence / reviewsData.length : 0;
  const positivePercentage = reviewsData.length > 0 ? 
    (positiveCount / reviewsData.length) * 100 : 0;
};
```

**Time Complexity:** O(n)
**Space Complexity:** O(1)

---

### 10. Revenue Aggregation Algorithm
**Location:** `src/pages/Dashboard/AdminDashboard.tsx`, `src/components/Analytics/AnalyticsDashboard.tsx`

**Algorithm Type:** Financial Aggregation

**Description:**
- Calculates total revenue from completed bookings
- Aggregates revenue by status, date range, and category
- Computes average booking value
- Tracks monthly revenue trends

**Implementation:**
```typescript
const revenue = bookings
  .filter(b => b.status === 'completed')
  .reduce((sum, b) => sum + (b.totalPrice || 0), 0);
```

**Time Complexity:** O(n)
**Space Complexity:** O(1)

---

### 11. User Growth Calculation
**Location:** `src/components/Analytics/AdminDashboardAnalytics.tsx`

**Algorithm Type:** Time-Series Aggregation

**Description:**
- Groups users by month of creation
- Calculates monthly growth rates
- Generates time-series data for visualization

**Implementation:**
```typescript
const growth: Record<string, { count: number; label: string }> = {};
snapshot.forEach((doc) => {
  const createdAt = doc.data().createdAt.toDate();
  const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
  if (!growth[monthKey]) {
    growth[monthKey] = { count: 0, label: monthLabel };
  }
  growth[monthKey].count += 1;
});
```

**Time Complexity:** O(n)
**Space Complexity:** O(m) where m is number of unique months

---

### 12. Top Destinations Algorithm
**Location:** `src/components/Analytics/AdminDashboardAnalytics.tsx`

**Algorithm Type:** Ranking & Aggregation

**Description:**
- Counts bookings per tour/destination
- Ranks destinations by booking count
- Returns top N destinations

**Implementation:**
```typescript
const tourCounts: Record<string, number> = {};
bookings.forEach(b => {
  tourCounts[b.tourId] = (tourCounts[b.tourId] || 0) + 1;
});
const sorted = Object.entries(tourCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5);
```

**Time Complexity:** O(n log n)
**Space Complexity:** O(n)

---

## Search Algorithms

### 13. Multi-Field Text Search
**Location:** `src/pages/Tours.tsx`, `src/components/Admin/DisputesManagement.tsx`

**Algorithm Type:** String Matching

**Description:**
- Performs case-insensitive substring search across multiple fields
- Searches title, description, location, and agency name simultaneously
- Uses OR logic (matches if any field contains search term)

**Implementation:**
```typescript
const filtered = tours.filter((tour) =>
  tour.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  tour.titleAm?.includes(searchTerm) ||
  tour.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  tour.description?.toLowerCase().includes(searchTerm.toLowerCase())
);
```

**Time Complexity:** O(n * m) where n is items, m is average field length
**Space Complexity:** O(1)

---

### 14. Advanced Filtering with Multiple Criteria
**Location:** `src/components/Admin/DisputesManagement.tsx`

**Algorithm Type:** Multi-Criteria Filtering

**Description:**
- Filters disputes by search term, status, priority, and type simultaneously
- Uses AND logic (all criteria must match)
- Optimized with useMemo for performance

**Implementation:**
```typescript
const filteredDisputes = useMemo(() => {
  return disputes.filter(dispute => {
    const matchesSearch = 
      dispute.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.tourName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || dispute.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || dispute.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });
}, [disputes, searchTerm, statusFilter, priorityFilter]);
```

**Time Complexity:** O(n)
**Space Complexity:** O(n)

---

## Payment Processing Algorithms

### 15. Total Price Calculation
**Location:** `src/components/Modals/BookingModal.tsx`

**Algorithm Type:** Arithmetic Calculation

**Description:**
- Calculates total booking price based on participants and per-person price
- Real-time calculation as user changes participant count
- Validates against maximum participants

**Implementation:**
```typescript
const participants = watch('participants', 1);
const totalPrice = participants * tour.price;
```

**Time Complexity:** O(1)
**Space Complexity:** O(1)

---

### 16. Refund Processing Algorithm
**Location:** `src/components/Admin/RefundManagement.tsx`, `backend/controllers/payment.controller.js`

**Algorithm Type:** Transaction Processing

**Description:**
- Processes refunds through payment gateway (Chapa)
- Updates booking, payment, and refund request statuses
- Handles manual refund requirements
- Creates notifications for users

**Key Steps:**
1. Verify refund request validity
2. Process through payment gateway (or mark for manual processing)
3. Update booking status to cancelled
4. Update payment status to refunded
5. Create user notification

**Time Complexity:** O(1) per operation
**Space Complexity:** O(1)

---

## Authentication & Authorization Algorithms

### 17. Role-Based Access Control (RBAC)
**Location:** `src/components/ProtectedRoute.tsx`, `src/App.tsx`

**Algorithm Type:** Authorization

**Description:**
- Implements role-based access control for different user types
- Routes users to appropriate dashboards based on role
- Prevents unauthorized access to protected routes

**Roles:**
- Admin: Full system access
- Agency: Tour management and analytics
- Cashier: Payment processing
- Tourist: Booking and reviews

**Implementation:**
```typescript
if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
  const destination = 
    currentUser.role === 'admin' ? '/dashboard' :
    currentUser.role === 'agency' ? '/agency' :
    currentUser.role === 'cashier' ? '/cashier' : '/tourist';
  return <Navigate to={destination} replace />;
}
```

**Time Complexity:** O(1)
**Space Complexity:** O(1)

---

### 18. User Deletion with Auth Sync
**Location:** `backend/routes/user.routes.js`, `src/pages/Dashboard/AdminDashboard.tsx`

**Algorithm Type:** Data Synchronization

**Description:**
- Ensures user deletion from both Firestore and Firebase Authentication
- Handles cases where user exists in one but not the other
- Provides detailed feedback on deletion status

**Implementation:**
```javascript
// Check if user exists in Auth
const userExistsInAuth = await admin.auth().getUser(uid);
if (userExistsInAuth) {
  await admin.auth().deleteUser(uid);
}
// Delete from Firestore
await admin.firestore().collection('users').doc(uid).delete();
```

**Time Complexity:** O(1)
**Space Complexity:** O(1)

---

## Analytics & Calculation Algorithms

### 19. Average Rating Calculator
**Location:** `src/pages/Dashboard/AgencyDashboard.tsx`, `src/pages/Dashboard/AdminDashboard.tsx`

**Algorithm Type:** Statistical Calculation

**Description:**
- Calculates average rating from reviews
- Filters out invalid ratings (0 or null)
- Rounds to 1 decimal place

**Implementation:**
```typescript
const validReviews = reviews.filter(r => r.rating && r.rating > 0);
const averageRating = validReviews.length > 0 
  ? parseFloat((validReviews.reduce((sum, r) => sum + r.rating, 0) / validReviews.length).toFixed(1))
  : 0;
```

**Time Complexity:** O(n)
**Space Complexity:** O(1)

---

### 20. Sentiment Score Calculation
**Location:** `src/components/Analytics/AgencySentimentAnalytics.tsx`

**Algorithm Type:** Scoring Algorithm

**Description:**
- Calculates sentiment score for tours based on review sentiment
- Formula: (positiveCount - negativeCount) / totalReviews
- Ranges from -1 (all negative) to +1 (all positive)

**Implementation:**
```typescript
const sentimentScore = total > 0 
  ? (positiveCount - negativeCount) / total 
  : 0;
```

**Time Complexity:** O(n)
**Space Complexity:** O(1)

---

### 21. Monthly Revenue Aggregation
**Location:** `src/components/Analytics/AnalyticsDashboard.tsx`

**Algorithm Type:** Time-Series Aggregation

**Description:**
- Groups bookings by month
- Calculates revenue per month
- Generates data for line/bar charts
- Handles date range filtering

**Implementation:**
```typescript
const monthlyBookings = bookings.reduce((acc, booking) => {
  const monthYear = `${booking.tourDate.getFullYear()}-${String(booking.tourDate.getMonth() + 1).padStart(2, '0')}`;
  acc[monthYear] = (acc[monthYear] || 0) + booking.totalPrice;
  return acc;
}, {});
```

**Time Complexity:** O(n)
**Space Complexity:** O(m) where m is number of months

---

### 22. Booking Status Distribution
**Location:** `src/components/Analytics/AnalyticsDashboard.tsx`

**Algorithm Type:** Categorical Aggregation

**Description:**
- Counts bookings by status (pending, confirmed, completed, cancelled)
- Calculates percentage distribution
- Used for pie/doughnut charts

**Implementation:**
```typescript
const statusCounts: Record<string, number> = {};
bookings.forEach(booking => {
  statusCounts[booking.status] = (statusCounts[booking.status] || 0) + 1;
});
const distribution = Object.entries(statusCounts).map(([status, count]) => ({
  status,
  count,
  percentage: (count / total) * 100
}));
```

**Time Complexity:** O(n)
**Space Complexity:** O(k) where k is number of status types

---

### 23. Cost Breakdown by Category
**Location:** `src/components/Analytics/AnalyticsDashboard.tsx`

**Algorithm Type:** Categorical Aggregation

**Description:**
- Groups revenue by tour category
- Calculates total revenue per category
- Sorts by revenue (descending)

**Implementation:**
```typescript
const categoryRevenue: Record<string, number> = {};
bookings.forEach(booking => {
  const category = getTourCategory(booking.tourId);
  categoryRevenue[category] = (categoryRevenue[category] || 0) + booking.totalPrice;
});
const breakdown = Object.entries(categoryRevenue)
  .map(([category, revenue]) => ({ category, revenue }))
  .sort((a, b) => b.revenue - a.revenue);
```

**Time Complexity:** O(n log n)
**Space Complexity:** O(k) where k is number of categories

---

## Android-Specific Algorithms

### 24. Tour Grouping Algorithm
**Location:** `android/app/src/main/java/com/wolaitatours/android/ui/tours/ToursViewModel.kt`

**Algorithm Type:** Grouping

**Description:**
- Groups tours by agency name
- Uses LinkedHashMap to preserve insertion order
- Creates TourGroup objects for UI display

**Implementation:**
```kotlin
fun groups(): List<TourGroup> {
    val filtered = filteredTours()
    val grouped = LinkedHashMap<String, MutableList<Tour>>()
    filtered.forEach { tour ->
        val key = tour.agencyName.ifBlank { tour.agencyId.ifBlank { "" } }
        val list = grouped.getOrPut(key) { mutableListOf() }
        list += tour
    }
    return grouped.map { (agencyKey, tours) ->
        TourGroup(title = displayName, tours = tours)
    }
}
```

**Time Complexity:** O(n)
**Space Complexity:** O(n)

---

### 25. Real-Time Data Synchronization
**Location:** Multiple files using Firestore `onSnapshot`

**Algorithm Type:** Event-Driven Updates

**Description:**
- Implements real-time data synchronization using Firestore listeners
- Automatically updates UI when data changes
- Handles connection errors and reconnection

**Implementation:**
```typescript
const unsubscribe = onSnapshot(
  query(collection(db, 'tours')),
  (snapshot) => {
    const tours = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setTours(tours);
  },
  (error) => {
    console.error('Error:', error);
  }
);
```

**Time Complexity:** O(n) per update
**Space Complexity:** O(n)

---

## Summary

### Algorithm Categories by Component

**Web (React/TypeScript):**
- Multi-criteria filtering
- Cursor-based pagination
- Sentiment statistics calculation
- Revenue aggregation
- Search algorithms
- RBAC implementation

**Android (Kotlin):**
- Tour grouping
- Multi-field search
- Filtering algorithms

**Backend (Node.js/Python):**
- Hybrid sentiment analysis (ML)
- Payment processing
- User management with Auth sync
- Refund processing

**Machine Learning:**
- Transformer-based sentiment classification
- TF-IDF vectorization (legacy)
- Confidence scoring

### Performance Characteristics

- **O(1) Operations:** Price calculations, role checks, simple lookups
- **O(n) Operations:** Filtering, aggregation, statistics
- **O(n log n) Operations:** Sorting, ranking
- **O(n * m) Operations:** Multi-field text search

### Scalability Considerations

- Pagination algorithms handle large datasets efficiently
- Real-time listeners use Firestore's optimized infrastructure
- Caching strategies reduce redundant calculations
- Memoization (useMemo) prevents unnecessary recalculations

---

## Notes

- All algorithms are optimized for their specific use cases
- Error handling is implemented throughout
- Performance optimizations include memoization and lazy loading
- Real-time updates use Firestore's efficient change detection
- ML models are loaded once and reused for multiple predictions

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Maintained By:** Wolaita Tourism Platform Development Team

