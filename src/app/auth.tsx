import { Redirect } from 'expo-router';

// Where the sign-in email's link lands. The store has already signed in by now.
export default function AuthLanding() {
  return <Redirect href="/" />;
}
