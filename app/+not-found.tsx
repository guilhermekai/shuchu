import { Redirect } from 'expo-router';

// Unknown paths (e.g. an embedded web preview) land on the Focus tab.
export default function NotFound() {
  return <Redirect href="/" />;
}
