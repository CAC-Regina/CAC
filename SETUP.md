# Account system setup (Expo + Supabase)

## 1. Create the Supabase project
1. Sign up at https://supabase.com and create a project.
2. Project Settings -> API: copy the **Project URL** and the **anon public** key.
   Never put the `service_role` key in the app.
3. Authentication -> Providers -> Email: keep it enabled.
   - "Confirm email" ON is recommended for production (users must click a link in their email before logging in).
   - Turn it OFF while testing if you don't want to check email each time.
4. Authentication -> Sign In / Providers -> set the minimum password length to 8 to match the app.

## 2. Copy the files into your Expo project
Copy these into your project root (keep the folder names):

    lib/supabase.js
    context/AuthContext.js
    screens/AuthScreen.js
    components/AuthGate.js

Then copy `.env.example` to `.env` in your project root and fill in the two values.
Make sure `.env` is in your `.gitignore`.

## 3. Install dependencies
From your project root:

    npx expo install @react-native-async-storage/async-storage expo-secure-store react-native-get-random-values
    npm install @supabase/supabase-js react-native-url-polyfill aes-js

## 4. Wire it into your app
See `App.example.js`. In short, wrap your app:

    <AuthProvider>
      <AuthGate>
        {/* your existing app / navigation */}
      </AuthGate>
    </AuthProvider>

In any screen, use the hook:

    const { user, signOut } = useAuth();

If you use Expo Router, put the provider and gate in `app/_layout.js` around `<Stack />`.

## 5. Run it
Restart Metro with a clean cache so the `.env` values load:

    npx expo start -c

Press `a` to open the Android emulator.

## 6. Enable password reset (one-time Supabase change)
By default Supabase emails a reset *link*. This app uses a *code* instead, so edit the template:
1. Supabase dashboard -> Authentication -> Email Templates -> **Reset Password**.
2. Replace the body with something like:

       <h2>Reset your password</h2>
       <p>Your password reset code is: <strong>{{ .Token }}</strong></p>
       <p>If you didn't ask for this, you can ignore this email.</p>

3. Save. (Keep `{{ .Token }}` exactly as written.)

Note: Supabase's built-in email sender only allows a few emails per hour, which is fine for testing.
For a real launch, add your own SMTP provider under Authentication -> SMTP Settings.

## Notes
- Passwords are hashed and stored by Supabase; the app never stores them.
- The session is encrypted on the device (key in Android Keystore via SecureStore).
- With email confirmation on, the confirmation link opens in a browser. After confirming, return to the app and log in.
- Password reset works with an emailed code (no deep links needed). It requires the Supabase email template change in the next section.
- Email and password rules live in `lib/validation.js`. Passwords must be longer than 8 characters (`MIN_PASSWORD_LENGTH = 9`).
- Before going live, review Supabase's Row Level Security for any tables you create. The anon key is public, so RLS is what protects your data.
