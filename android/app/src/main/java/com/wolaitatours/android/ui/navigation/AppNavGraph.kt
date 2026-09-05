package com.wolaitatours.android.ui.navigation

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.wolaitatours.android.BuildConfig
import com.wolaitatours.android.MainViewModel
import com.wolaitatours.android.data.model.AuthState
import com.wolaitatours.android.data.model.LanguageOption
import com.wolaitatours.android.data.model.PaymentRequest
import com.wolaitatours.android.ui.about.AboutScreen
import com.wolaitatours.android.ui.auth.AuthScreen
import com.wolaitatours.android.ui.auth.AuthViewModel
import com.wolaitatours.android.ui.booking.BookingHistoryScreen
import com.wolaitatours.android.ui.booking.BookingScreen
import com.wolaitatours.android.ui.booking.BookingViewModel
import com.wolaitatours.android.ui.contact.ContactScreen
import com.wolaitatours.android.ui.dashboard.TouristDashboardScreen
import com.wolaitatours.android.ui.dashboard.TouristDashboardViewModel
import com.wolaitatours.android.ui.explore.ExploreScreen
import com.wolaitatours.android.ui.favorites.FavoritesScreen
import com.wolaitatours.android.ui.favorites.FavoritesViewModel
import com.wolaitatours.android.ui.festivals.FestivalsScreen
import com.wolaitatours.android.ui.home.HomeScreen
import com.wolaitatours.android.ui.home.HomeViewModel
import com.wolaitatours.android.ui.home.TourDetailScreen
import com.wolaitatours.android.ui.home.TourDetailViewModel
import com.wolaitatours.android.ui.hotels.HotelsScreen
import com.wolaitatours.android.ui.payment.ChapaWebViewActivity
import com.wolaitatours.android.ui.payment.ManualPaymentScreen
import com.wolaitatours.android.ui.payment.PaymentOptionsScreen
import com.wolaitatours.android.ui.payment.PaymentViewModel
import com.wolaitatours.android.ui.profile.ProfileScreen
import com.wolaitatours.android.ui.profile.ProfileViewModel
import com.wolaitatours.android.ui.reviews.ReviewScreen
import com.wolaitatours.android.ui.reviews.ReviewViewModel
import com.wolaitatours.android.ui.tours.ToursRoute
import com.wolaitatours.android.services.PaymentDeepLinkHandler
import com.wolaitatours.android.data.repository.BookingRepository
import com.wolaitatours.android.data.model.BookingStatus
import com.wolaitatours.android.data.model.PaymentStatus
import com.wolaitatours.android.util.Resource
import dagger.hilt.android.EntryPointAccessors
import com.wolaitatours.android.di.AppEntryPoint

private object Destinations {
    const val Auth = "auth"
    const val Dashboard = "dashboard"
    const val Home = "home"
    const val Explore = "explore"
    const val Tours = "tours"
    const val Hotels = "hotels"
    const val Festivals = "festivals"
    const val Favorites = "favorites"
    const val TourDetail = "tour/{tourId}"
    const val Booking = "booking/{tourId}/{tourName}/{agencyId}/{agencyName}/{price}"
    const val Bookings = "bookings"
    const val Profile = "profile"
    const val PaymentOptions = "payment/{bookingId}/{amount}/{tourName}"
    const val ManualPayment = "payment/manual/{bookingId}/{amount}"
    const val Review = "review/{bookingId}/{tourId}/{tourName}"
    const val About = "about"
    const val Contact = "contact"
    const val Loading = "loading"
}

@Composable
fun AppNavGraph(
    appState: AppState,
    authState: AuthState,
    mainViewModel: MainViewModel,
    intent: Intent?,
) {
    val navController = appState.navController
    val context = LocalContext.current

    // Handle payment deep link
    LaunchedEffect(intent, authState) {
        if (intent != null && authState is AuthState.SignedIn) {
            val entryPoint = EntryPointAccessors.fromApplication(
                context.applicationContext,
                AppEntryPoint::class.java
            )
            val deepLinkHandler = entryPoint.paymentDeepLinkHandler()
            val bookingRepository = entryPoint.bookingRepository()
            
            val deepLink = deepLinkHandler.parse(intent)
            if (deepLink != null && deepLink.status == "paid" && !deepLink.bookingId.isNullOrBlank()) {
                android.util.Log.d("AppNavGraph", "Payment successful for booking: ${deepLink.bookingId}")
                // Update booking status to confirmed and payment status to paid
                // We're already in a coroutine context (LaunchedEffect), so we can call suspend functions directly
                val result = bookingRepository.updateBooking(
                    deepLink.bookingId,
                    mapOf(
                        "status" to BookingStatus.confirmed.name,
                        "paymentStatus" to PaymentStatus.paid.name
                    )
                )
                when (result) {
                    is Resource.Success -> {
                        android.util.Log.d("AppNavGraph", "Booking updated successfully, navigating to Dashboard")
                        // Navigate to dashboard to show the updated booking
                        // Use launchSingleTop to avoid creating multiple instances
                        navController.navigate(Destinations.Dashboard) {
                            // Clear back stack up to Home, but keep Home in the stack
                            popUpTo(Destinations.Home) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                    is Resource.Error -> {
                        android.util.Log.e("AppNavGraph", "Failed to update booking", result.throwable)
                        // Still navigate to dashboard even if update fails, so user can see their bookings
                        android.util.Log.d("AppNavGraph", "Navigating to Dashboard despite update error")
                        navController.navigate(Destinations.Dashboard) {
                            popUpTo(Destinations.Home) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                    else -> {
                        // Even if result is Loading, navigate to dashboard
                        android.util.Log.d("AppNavGraph", "Navigating to Dashboard")
                        navController.navigate(Destinations.Dashboard) {
                            popUpTo(Destinations.Home) { inclusive = false }
                            launchSingleTop = true
                        }
                    }
                }
            }
        }
    }

    // Centralized navigation logic that reacts to authentication state
    LaunchedEffect(authState) {
        val currentRoute = navController.currentBackStackEntry?.destination?.route

        when (authState) {
            is AuthState.SignedIn -> {
                if (currentRoute != Destinations.Home) {
                    navController.navigate(Destinations.Home) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }

            is AuthState.SignedOut, is AuthState.Error -> {
                // If the user is signed out or an error occurs, navigate to the authentication screen.
                if (currentRoute != Destinations.Auth) {
                    navController.navigate(Destinations.Auth) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = true }
                        launchSingleTop = true
                    }
                }
            }

            AuthState.Loading -> {
                // While the auth state is loading, we stay on the loading screen.
            }
        }
    }

    NavHost(
        navController = navController,
        startDestination = Destinations.Loading, // Always start at the loading screen
        modifier = Modifier
    ) {
        composable(Destinations.Loading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        }
        composable(Destinations.Auth) {
            val vm: AuthViewModel = hiltViewModel()
            AuthScreen(
                viewModel = vm,
                onLoginSuccess = {
                    // This will trigger the LaunchedEffect above to navigate to Home
                    // since authState will change to SignedIn
                }
            )
        }
        composable(Destinations.Dashboard) {
            val vm = hiltViewModel<TouristDashboardViewModel>()
            TouristDashboardScreen(
                viewModel = vm,
                onViewAllBookings = {
                    navController.navigate(Destinations.Bookings)
                },
                onViewTours = {
                    navController.navigate(Destinations.Tours)
                },
                onViewFestivals = {
                    navController.navigate(Destinations.Festivals)
                },
                onViewFavorites = {
                    navController.navigate(Destinations.Favorites)
                },
                onBookingClick = { booking ->
                    navController.navigate(Destinations.Bookings)
                },
                onLogout = {
                    mainViewModel.onSignOut()
                },
                onLeaveReview = { booking ->
                    val encodedTourName = Uri.encode(booking.tourName)
                    navController.navigate("review/${booking.id}/${booking.tourId}/$encodedTourName")
                },
                onProfileClick = {
                    navController.navigate(Destinations.Profile)
                }
            )
        }
        composable(Destinations.Home) {
            val vm = hiltViewModel<HomeViewModel>()
            HomeScreen(
                viewModel = vm,
                onTourSelected = { tour ->
                    navController.navigate("tour/${tour.id}")
                },
                onExploreClick = {
                    navController.navigate(Destinations.Explore)
                },
                onViewAllTours = {
                    navController.navigate(Destinations.Tours)
                },
                onDashboardClick = { // Added for navigation to dashboard
                    navController.navigate(Destinations.Dashboard)
                },
                onLanguageChange = {
                    mainViewModel.setLanguage(it)
                },
                onAboutClick = {
                    navController.navigate(Destinations.About)
                },
                onContactClick = {
                    navController.navigate(Destinations.Contact)
                }
            )
        }
        composable(Destinations.Explore) {
            ExploreScreen()
        }
        composable(Destinations.Tours) {
            ToursRoute(
                onBack = { navController.popBackStack() },
                onTourSelected = { tour ->
                    navController.navigate("tour/${tour.id}")
                }
            )
        }
        composable(Destinations.Hotels) {
            HotelsScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(Destinations.Festivals) {
            FestivalsScreen(
                onBack = { navController.popBackStack() },
                onFestivalSelected = { festival ->
                    // TODO: Navigate to festival detail screen when implemented
                },
                onViewTours = {
                    navController.navigate(Destinations.Tours)
                }
            )
        }
        composable(Destinations.Favorites) {
            val vm = hiltViewModel<FavoritesViewModel>()
            FavoritesScreen(
                viewModel = vm,
                onBack = { navController.popBackStack() },
                onBrowseTours = {
                    navController.navigate(Destinations.Tours)
                },
                onTourSelected = { tour ->
                    navController.navigate("tour/${tour.id}")
                }
            )
        }
        composable(
            route = Destinations.TourDetail,
            arguments = listOf(navArgument("tourId") { type = NavType.StringType })
        ) {
            val vm = hiltViewModel<TourDetailViewModel>()
            val state by vm.state.collectAsStateWithLifecycle()
            when (val resource = state) {
                is com.wolaitatours.android.util.Resource.Success -> TourDetailScreen(
                    tour = resource.data,
                    onBookClick = {
                        val tour = resource.data
                        navController.navigate("booking/${tour.id}/${tour.title}/${tour.agencyId}/${tour.agencyName}/${tour.price}")
                    }
                )

                is com.wolaitatours.android.util.Resource.Error -> Text("Error")
                is com.wolaitatours.android.util.Resource.Loading -> Text("Loading…")
            }
        }
        composable(
            route = Destinations.Booking,
            arguments = listOf(
                navArgument("tourId") { type = NavType.StringType },
                navArgument("tourName") { type = NavType.StringType },
                navArgument("agencyId") { type = NavType.StringType },
                navArgument("agencyName") { type = NavType.StringType },
                navArgument("price") { type = NavType.StringType },
            )
        ) { backStack ->
            val vm = hiltViewModel<BookingViewModel>()
            val tourId = backStack.arguments?.getString("tourId").orEmpty()
            val tourName = backStack.arguments?.getString("tourName").orEmpty()
            val agencyId = backStack.arguments?.getString("agencyId").orEmpty()
            val agencyName = backStack.arguments?.getString("agencyName").orEmpty()
            val price = backStack.arguments?.getString("price").orEmpty().toDoubleOrNull() ?: 0.0
            vm.updateTour(tourId)
            BookingScreen(
                viewModel = vm,
                tourName = tourName,
                agencyId = agencyId,
                agencyName = agencyName,
                basePrice = price,
                onPaymentRequested = { bookingId, total, tour ->
                    val encodedTour = Uri.encode(tour)
                    // Convert total to String for navigation
                    val totalString = total.toString()
                    navController.navigate("payment/$bookingId/$totalString/$encodedTour")
                }
            )
        }
        composable(Destinations.Bookings) {
            val vm = hiltViewModel<BookingViewModel>()
            BookingHistoryScreen(viewModel = vm)
        }
        composable(Destinations.Profile) {
            val vm = hiltViewModel<ProfileViewModel>()
            ProfileScreen(
                viewModel = vm,
                onBack = { navController.popBackStack() }
            )
        }
        composable(
            route = Destinations.PaymentOptions,
            arguments = listOf(
                navArgument("bookingId") { type = NavType.StringType },
                navArgument("amount") { type = NavType.StringType },
                navArgument("tourName") { type = NavType.StringType },
            )
        ) { backStack ->
            val bookingId = backStack.arguments?.getString("bookingId").orEmpty()
            val amount = backStack.arguments?.getString("amount").orEmpty().toDoubleOrNull() ?: 0.0
            val tourName = backStack.arguments?.getString("tourName").orEmpty()
            val vm = hiltViewModel<PaymentViewModel>()
            val state by vm.state.collectAsStateWithLifecycle()

            LaunchedEffect(state.checkoutUrl) {
                val checkout = state.checkoutUrl ?: return@LaunchedEffect
                context.startActivity(
                    Intent(context, ChapaWebViewActivity::class.java).apply {
                        putExtra(ChapaWebViewActivity.EXTRA_CHECKOUT_URL, checkout)
                    }
                )
            }

            PaymentOptionsScreen(
                isLoading = state.isProcessing,
                error = state.error,
                onOnlinePayment = {
                    try {
                        android.util.Log.d("AppNavGraph", "Payment button clicked for booking: $bookingId, amount: $amount")
                        
                        // Get user info from Firebase Auth
                        val currentUser = com.google.firebase.auth.FirebaseAuth.getInstance().currentUser
                        if (currentUser == null) {
                            android.util.Log.e("AppNavGraph", "No user logged in")
                            return@PaymentOptionsScreen
                        }
                        
                        val userEmail = currentUser.email
                        if (userEmail.isNullOrBlank()) {
                            android.util.Log.e("AppNavGraph", "User email is missing")
                            return@PaymentOptionsScreen
                        }
                        
                        val userName = currentUser.displayName ?: ""
                        val nameParts = userName.split(" ").filter { it.isNotBlank() }
                        val firstName = nameParts.firstOrNull() ?: "Customer"
                        val lastName = nameParts.drop(1).joinToString(" ").takeIf { it.isNotBlank() } ?: "User"
                        val userPhone = currentUser.phoneNumber
                        
                        android.util.Log.d("AppNavGraph", "User info: email=$userEmail, name=$firstName $lastName")
                        
                        // Generate transaction reference matching website format
                        val txRef = "WOLAITA_TOUR_${System.currentTimeMillis()}_${kotlin.random.Random.nextInt(1000, 9999)}"
                        
                        // Build callback and return URLs
                        val backendUrl = BuildConfig.CHAPA_BACKEND_URL
                        android.util.Log.d("AppNavGraph", "Backend URL from config: $backendUrl")
                        
                        // Extract base URL (remove /api/chapa if present)
                        val baseUrl = if (backendUrl.endsWith("/api/chapa")) {
                            backendUrl.removeSuffix("/api/chapa").removeSuffix("/")
                        } else if (backendUrl.contains("/api/chapa")) {
                            backendUrl.substringBefore("/api/chapa").removeSuffix("/")
                        } else {
                            backendUrl.removeSuffix("/")
                        }
                        
                        // For local backend, callback should point to backend
                        val callbackUrl = "$baseUrl/api/chapa/callback"
                        val returnUrl = "wolaita://tours?status=paid&bookingId=$bookingId"
                        
                        android.util.Log.d("AppNavGraph", "Base URL: $baseUrl")
                        android.util.Log.d("AppNavGraph", "Callback URL: $callbackUrl")
                        android.util.Log.d("AppNavGraph", "Return URL: $returnUrl")
                        
                        android.util.Log.d("AppNavGraph", "Callback URL: $callbackUrl, Return URL: $returnUrl")
                        
                        val paymentRequest = PaymentRequest(
                            bookingId = bookingId,
                            amount = amount,
                            currency = "ETB",
                            firstName = firstName,
                            lastName = lastName,
                            email = userEmail,
                            phoneNumber = userPhone,
                            description = "Payment for $tourName",
                            txRef = txRef,
                            returnUrl = returnUrl,
                            callbackUrl = callbackUrl,
                            meta = mapOf(
                                "booking_id" to bookingId,
                                "user_id" to currentUser.uid,
                            )
                        )
                        
                        android.util.Log.d("AppNavGraph", "Calling initializePayment")
                        vm.initializePayment(paymentRequest)
                    } catch (e: Exception) {
                        android.util.Log.e("AppNavGraph", "Error in payment initialization", e)
                    }
                },
                onManualPayment = {
                    navController.navigate("payment/manual/$bookingId/$amount")
                }
            )
        }
        composable(
            route = Destinations.ManualPayment,
            arguments = listOf(
                navArgument("bookingId") { type = NavType.StringType },
                navArgument("amount") { type = NavType.StringType },
            )
        ) { backStack ->
            val bookingId = backStack.arguments?.getString("bookingId").orEmpty()
            val amount = backStack.arguments?.getString("amount").orEmpty().toDoubleOrNull() ?: 0.0
            val vm = hiltViewModel<PaymentViewModel>()
            ManualPaymentScreen(
                viewModel = vm,
                bookingId = bookingId,
                currency = "ETB",
                amount = amount,
                onPickImage = {}
            )
        }
        composable(
            route = Destinations.Review,
            arguments = listOf(
                navArgument("bookingId") { type = NavType.StringType },
                navArgument("tourId") { type = NavType.StringType },
                navArgument("tourName") { type = NavType.StringType }
            )
        ) { backStack ->
            val vm = hiltViewModel<ReviewViewModel>()
            val bookingId = backStack.arguments?.getString("bookingId").orEmpty()
            val tourId = backStack.arguments?.getString("tourId").orEmpty()
            val tourName = backStack.arguments?.getString("tourName").orEmpty()
            ReviewScreen(
                viewModel = vm,
                bookingId = bookingId,
                tourId = tourId,
                tourName = tourName,
                onReviewSubmitted = {
                    navController.popBackStack()
                }
            )
        }
        composable(Destinations.About) {
            AboutScreen(
                onBack = { navController.popBackStack() }
            )
        }
        composable(Destinations.Contact) {
            ContactScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}