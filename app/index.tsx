import { Redirect } from "expo-router";

export default function index() {
    return (
        <Redirect href={"/(tabs)"} />
);
   
}
//<Redirect href={"/(routes)/onboarding"} />
//<Redirect href={"/(tabs)"} />