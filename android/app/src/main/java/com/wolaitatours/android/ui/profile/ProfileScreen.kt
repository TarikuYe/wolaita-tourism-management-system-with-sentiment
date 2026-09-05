package com.wolaitatours.android.ui.profile

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Phone
import androidx.compose.material.icons.filled.Public
import androidx.compose.material.icons.filled.CalendarToday
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import coil.compose.AsyncImage
import com.wolaitatours.android.ui.components.Container
import com.wolaitatours.android.ui.theme.SecondaryColor
import com.wolaitatours.android.ui.theme.SuccessGreen
import com.wolaitatours.android.ui.theme.Gray600
import com.wolaitatours.android.ui.theme.WhiteBackground
import com.wolaitatours.android.ui.theme.TextGray900
import java.text.SimpleDateFormat
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    viewModel: ProfileViewModel,
    onBack: () -> Unit = {},
) {
    val state by viewModel.state.collectAsStateWithLifecycle()
    val snackbarHostState = remember { SnackbarHostState() }
    val context = LocalContext.current

    // Show messages in snackbar
    LaunchedEffect(state.message) {
        state.message?.let {
            snackbarHostState.showSnackbar(it)
            viewModel.clearMessage()
        }
    }

    LaunchedEffect(state.error) {
        state.error?.let {
            snackbarHostState.showSnackbar(it)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Profile", color = TextGray900) },
                navigationIcon = {
                    TextButton(onClick = onBack) {
                        Text("Back", color = TextGray900)
                    }
                },
                colors = androidx.compose.material3.TopAppBarDefaults.topAppBarColors(
                    containerColor = WhiteBackground,
                    titleContentColor = TextGray900,
                    navigationIconContentColor = TextGray900
                )
            )
        },
        snackbarHost = { SnackbarHost(snackbarHostState) }
    ) { padding ->
        Container(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            val profile = state.profile // Store in local variable to avoid smart cast issues
            
            if (state.isLoading && profile == null) {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    CircularProgressIndicator()
                }
            } else if (profile != null) {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .verticalScroll(rememberScrollState())
                        .padding(vertical = 12.dp, horizontal = 12.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Profile Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(18.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            // Profile Image - Centered
                            Box(
                                modifier = Modifier.size(120.dp),
                                contentAlignment = Alignment.BottomEnd
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(120.dp)
                                        .clip(CircleShape)
                                        .background(Color.Gray.copy(alpha = 0.3f))
                                        .border(4.dp, Color.Gray.copy(alpha = 0.2f), CircleShape),
                                    contentAlignment = Alignment.Center
                                ) {
                                    val imageUrl = profile.profileImage 
                                        ?: profile.photoURL
                                    if (imageUrl != null) {
                                        AsyncImage(
                                            model = imageUrl,
                                            contentDescription = "Profile",
                                            modifier = Modifier
                                                .fillMaxSize()
                                                .clip(CircleShape),
                                            contentScale = ContentScale.Crop
                                        )
                                    } else {
                                        // Placeholder avatar
                                        Icon(
                                            imageVector = Icons.Default.CameraAlt,
                                            contentDescription = null,
                                            modifier = Modifier.size(60.dp),
                                            tint = Color.Gray
                                        )
                                    }
                                }
                                // Camera icon button (for future image upload)
                                Box(
                                    modifier = Modifier
                                        .size(36.dp)
                                        .clip(CircleShape)
                                        .background(SecondaryColor)
                                        .clickable { /* TODO: Implement image upload */ },
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.CameraAlt,
                                        contentDescription = "Update profile image",
                                        tint = Color.White,
                                        modifier = Modifier.size(18.dp)
                                    )
                                }
                            }

                            // Profile Details Header - Centered
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Profile Details",
                                    style = MaterialTheme.typography.titleLarge,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.weight(1f)
                                )
                                if (!state.isEditing) {
                                    Button(
                                        onClick = { viewModel.setEditing(true) },
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = SecondaryColor
                                        ),
                                        modifier = Modifier.padding(start = 8.dp)
                                    ) {
                                        Text("Edit Profile", style = MaterialTheme.typography.bodySmall)
                                    }
                                } else {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                                Button(
                                                    onClick = { viewModel.saveProfile() },
                                                    enabled = !state.isLoading,
                                                    colors = ButtonDefaults.buttonColors(
                                                        containerColor = SuccessGreen
                                                    )
                                                ) {
                                                    Text("Save", style = MaterialTheme.typography.bodySmall)
                                                }
                                                Button(
                                                    onClick = { viewModel.setEditing(false) },
                                                    enabled = !state.isLoading,
                                                    colors = ButtonDefaults.buttonColors(
                                                        containerColor = Gray600
                                                    )
                                                ) {
                                                    Text("Cancel", style = MaterialTheme.typography.bodySmall)
                                                }
                                    }
                                }
                            }

                            // Profile Information - Centered
                            Column(
                                modifier = Modifier.fillMaxWidth(),
                                verticalArrangement = Arrangement.spacedBy(14.dp)
                            ) {

                                    // Email (non-editable)
                                    ProfileField(
                                        label = "Email Address",
                                        value = profile.email,
                                        icon = Icons.Default.Email,
                                        enabled = false
                                    )

                                // Name (editable)
                                if (state.isEditing) {
                                    OutlinedTextField(
                                        value = state.profileForm.name,
                                        onValueChange = { viewModel.updateProfileForm(name = it) },
                                        label = { Text("Full Name") },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = SecondaryColor
                                        )
                                    )
                                } else {
                                    ProfileField(
                                        label = "Full Name",
                                        value = profile.name.ifEmpty { "Not provided" },
                                        icon = null
                                    )
                                }

                                // Phone (editable)
                                if (state.isEditing) {
                                    OutlinedTextField(
                                        value = state.profileForm.phone,
                                        onValueChange = { viewModel.updateProfileForm(phone = it) },
                                        label = { Text("Phone Number") },
                                        leadingIcon = {
                                            Icon(Icons.Default.Phone, contentDescription = null)
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = SecondaryColor
                                        )
                                    )
                                } else {
                                    ProfileField(
                                        label = "Phone Number",
                                        value = profile.phone ?: "Not provided",
                                        icon = Icons.Default.Phone
                                    )
                                }

                                // Nationality (editable)
                                if (state.isEditing) {
                                    OutlinedTextField(
                                        value = state.profileForm.nationality,
                                        onValueChange = { viewModel.updateProfileForm(nationality = it) },
                                        label = { Text("Nationality") },
                                        leadingIcon = {
                                            Icon(Icons.Default.Public, contentDescription = null)
                                        },
                                        modifier = Modifier.fillMaxWidth(),
                                        singleLine = true,
                                        colors = OutlinedTextFieldDefaults.colors(
                                            focusedBorderColor = SecondaryColor
                                        )
                                    )
                                } else {
                                    ProfileField(
                                        label = "Nationality",
                                        value = profile.nationality ?: "Not provided",
                                        icon = Icons.Default.Public
                                    )
                                }

                                // Joined Date (non-editable)
                                ProfileField(
                                    label = "Joined Date",
                                    value = formatDate(profile.createdAt),
                                    icon = Icons.Default.CalendarToday,
                                    enabled = false
                                )
                            }
                        }
                    }

                    // Password Change Section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(16.dp),
                        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(14.dp)
                        ) {
                            Text(
                                text = "Change Password",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold
                            )

                            OutlinedTextField(
                                value = state.passwordForm.oldPassword,
                                onValueChange = { viewModel.updatePasswordForm(oldPassword = it) },
                                label = { Text("Current Password") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = SecondaryColor
                                )
                            )

                            OutlinedTextField(
                                value = state.passwordForm.newPassword,
                                onValueChange = { viewModel.updatePasswordForm(newPassword = it) },
                                label = { Text("New Password") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = SecondaryColor
                                )
                            )

                            OutlinedTextField(
                                value = state.passwordForm.confirmPassword,
                                onValueChange = { viewModel.updatePasswordForm(confirmPassword = it) },
                                label = { Text("Confirm New Password") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                                colors = OutlinedTextFieldDefaults.colors(
                                    focusedBorderColor = SecondaryColor
                                )
                            )

                            Button(
                                onClick = { viewModel.changePassword() },
                                enabled = !state.isUpdatingPassword,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = SecondaryColor
                                )
                            ) {
                                if (state.isUpdatingPassword) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        color = Color.White
                                    )
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text("Updating Password...")
                                } else {
                                    Text("Change Password")
                                }
                            }
                        }
                    }
                }
            } else {
                Box(
                    modifier = Modifier.fillMaxSize(),
                    contentAlignment = Alignment.Center
                ) {
                    Text("Failed to load profile")
                }
            }
        }
    }
}

@Composable
private fun ProfileField(
    label: String,
    value: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector?,
    enabled: Boolean = true
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(6.dp)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            icon?.let {
                Icon(
                    imageVector = it,
                    contentDescription = null,
                    modifier = Modifier.size(18.dp),
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontWeight = FontWeight.Medium
            )
        }
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp)
                .background(
                    if (enabled) Color.Transparent
                    else MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f),
                    RoundedCornerShape(10.dp)
                )
                .border(
                    1.dp,
                    MaterialTheme.colorScheme.outline.copy(alpha = 0.5f),
                    RoundedCornerShape(10.dp)
                )
                .padding(horizontal = 14.dp),
            contentAlignment = Alignment.CenterStart
        ) {
            Text(
                text = value,
                style = MaterialTheme.typography.bodyMedium,
                color = if (enabled) MaterialTheme.colorScheme.onSurface
                else MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private fun formatDate(timestamp: com.google.firebase.Timestamp?): String {
    if (timestamp == null) return "N/A"
    return try {
        val date = timestamp.toDate()
        SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        "N/A"
    }
}
