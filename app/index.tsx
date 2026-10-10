import { Redirect } from "expo-router";
import { useAuth } from "@/services";

// Entry point: decide where the user belongs
export default function Index() {
    const { isAuthenticated, hasSeenIntro } = useAuth();

    if (isAuthenticated) return <Redirect href="/(tabs)" />;
    return <Redirect href={hasSeenIntro ? "/(routes)/login" : "/(routes)/onboarding"} />;
}
