import { Link, Stack } from "expo-router";
import { Text } from "react-native";
import { StyleSheet } from "react-native-unistyles";

import { Container } from "@/components/container";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <Container>
        <Text style={styles.title}>This screen doesn't exist.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Go to home screen!</Text>
        </Link>
      </Container>
    </>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: theme.colors.typography,
  },
  link: {
    marginTop: 16,
    paddingVertical: 16,
  },
  linkText: {
    fontSize: 14,
  },
}));
