package com.wolaitatours.android.ui.navigation

import androidx.compose.material3.DrawerState
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController

@Composable
fun rememberAppState(
    navController: NavHostController = rememberNavController(),
    snackbarHostState: SnackbarHostState = remember { SnackbarHostState() },
    drawerState: DrawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
): AppState {
    return remember(navController, snackbarHostState, drawerState) {
        AppState(
            navController = navController,
            snackbarHostState = snackbarHostState,
            drawerState = drawerState
        )
    }
}

class AppState(
    val navController: NavHostController,
    val snackbarHostState: SnackbarHostState,
    val drawerState: DrawerState
)
