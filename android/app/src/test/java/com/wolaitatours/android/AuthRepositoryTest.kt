package com.wolaitatours.android

import com.google.firebase.auth.AuthResult
import com.google.firebase.auth.FirebaseAuth
import com.wolaitatours.android.data.remote.FirebaseAuthDataSource
import com.wolaitatours.android.data.repository.AuthRepository
import com.wolaitatours.android.util.Resource
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.runTest
import org.junit.Test

class AuthRepositoryTest {

    private val remote: FirebaseAuthDataSource = mockk(relaxed = true)
    private val auth: FirebaseAuth = mockk(relaxed = true)
    private val repository = AuthRepository(remote, auth)

    @Test
    fun signInSuccess() = runTest {
        val authResult = mockk<AuthResult>(relaxed = true)
        coEvery { remote.signIn(any(), any()) } returns authResult

        val result = repository.signIn("demo@wolaita.com", "password")

        assert(result is Resource.Success)
        coVerify { remote.signIn("demo@wolaita.com", "password") }
    }
}

