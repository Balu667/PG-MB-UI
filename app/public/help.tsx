// app/public/help.tsx
// Help & Support Screen - Accessible from Login
import React, { useMemo, useCallback, useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Platform,
  I18nManager,
  StatusBar,
  Animated,
  LayoutAnimation,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { useTheme } from "@/src/theme/ThemeContext";
import { hexToRgba } from "@/src/theme";

/* ─────────────────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────────────────── */

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

interface ContactItem {
  icon: string;
  iconFamily: "material" | "ionicons" | "material-community";
  title: string;
  subtitle: string;
  action: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ DATA
───────────────────────────────────────────────────────────────────────────── */

const FAQ_DATA: FAQItem[] = [
  {
    id: "1",
    question: "How do I create an account?",
    answer:
      "To create an account, simply enter your 10-digit Indian mobile number on the login screen and tap 'Get OTP'. You'll receive a one-time password via SMS to verify your number. Once verified, your account will be created automatically.",
  },
  {
    id: "2",
    question: "I'm not receiving the OTP. What should I do?",
    answer:
      "Make sure your mobile number is correct and has active network coverage. Wait for at least 60 seconds before requesting a new OTP. Check if SMS from unknown numbers is blocked on your phone. If the issue persists, contact our support team.",
  },
  {
    id: "3",
    question: "Is my data secure?",
    answer:
      "Yes, we take security very seriously. Your data is encrypted using industry-standard protocols. We never share your personal information with third parties without your consent. All transactions are secured with multiple layers of protection.",
  },
  {
    id: "4",
    question: "Can I manage multiple properties?",
    answer:
      "Absolutely! PGMS allows you to manage unlimited properties from a single account. You can easily switch between properties, track tenants, collect payments, and view reports for each property separately.",
  },
  {
    id: "5",
    question: "What payment methods are supported?",
    answer:
      "We support multiple payment collection methods including Cash, UPI, Bank Transfer, and Online payments. You can record payments made through any of these methods and generate receipts instantly.",
  },
  {
    id: "6",
    question: "How do I contact support?",
    answer:
      "You can reach our support team via email at support@pgms.com or call us at +91-9876543210. Our support hours are Monday to Saturday, 9 AM to 6 PM IST. For urgent issues, you can also use the WhatsApp support option.",
  },
];

/* ─────────────────────────────────────────────────────────────────────────────
   FAQ ITEM COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const FAQItemComponent = React.memo<{ item: FAQItem; index: number }>(({ item, index }) => {
  const { colors, spacing, radius } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggleExpand = useCallback(() => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((prev) => !prev);
    Animated.spring(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
    }).start();
  }, [isExpanded, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  return (
    <Pressable
      onPress={toggleExpand}
      style={{
        backgroundColor: colors.cardBackground,
        borderRadius: radius.lg,
        marginBottom: spacing.sm,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isExpanded ? colors.accent : hexToRgba(colors.textSecondary, 0.1),
      }}
      accessibilityRole="button"
      accessibilityLabel={item.question}
      accessibilityHint={isExpanded ? "Tap to collapse answer" : "Tap to expand answer"}
      accessibilityState={{ expanded: isExpanded }}
      accessible
    >
      {/* Question */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          padding: spacing.md,
          gap: 12,
        }}
      >
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: hexToRgba(colors.accent, 0.1),
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: "700", color: colors.accent }}>{index + 1}</Text>
        </View>
        <Text
          style={{
            flex: 1,
            fontSize: 15,
            fontWeight: "600",
            color: colors.textPrimary,
            lineHeight: 22,
          }}
        >
          {item.question}
        </Text>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.textSecondary} />
        </Animated.View>
      </View>

      {/* Answer */}
      {isExpanded && (
        <View
          style={{
            paddingHorizontal: spacing.md,
            paddingBottom: spacing.md,
            paddingTop: 0,
          }}
        >
          <View
            style={{
              height: 1,
              backgroundColor: hexToRgba(colors.textSecondary, 0.1),
              marginBottom: spacing.sm,
            }}
          />
          <Text
            style={{
              fontSize: 14,
              color: colors.textSecondary,
              lineHeight: 22,
            }}
          >
            {item.answer}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

FAQItemComponent.displayName = "FAQItemComponent";

/* ─────────────────────────────────────────────────────────────────────────────
   CONTACT CARD COMPONENT
───────────────────────────────────────────────────────────────────────────── */

const ContactCard = React.memo<ContactItem>(({ icon, iconFamily, title, subtitle, action }) => {
  const { colors, spacing, radius } = useTheme();

  const IconComponent =
    iconFamily === "ionicons"
      ? Ionicons
      : iconFamily === "material-community"
      ? MaterialCommunityIcons
      : MaterialIcons;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        action();
      }}
      style={({ pressed }) => ({
        flex: 1,
        backgroundColor: pressed
          ? hexToRgba(colors.accent, 0.08)
          : colors.cardBackground,
        borderRadius: radius.lg,
        padding: spacing.md,
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: hexToRgba(colors.textSecondary, 0.1),
        minHeight: 110,
      })}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={subtitle}
      accessible
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <IconComponent name={icon as never} size={24} color={colors.accent} />
      </View>
      <View style={{ alignItems: "center" }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: "600",
            color: colors.textPrimary,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 2,
          }}
        >
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
});

ContactCard.displayName = "ContactCard";

/* ─────────────────────────────────────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────────────────────────────────────── */

export default function HelpScreen() {
  const router = useRouter();
  const { colors, spacing, radius } = useTheme();
  const insets = useSafeAreaInsets();

  // Handlers
  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  }, [router]);

  const handleEmail = useCallback(() => {
    Linking.openURL("mailto:support@pgms.com?subject=PGMS Support Request");
  }, []);

  const handleCall = useCallback(() => {
    Linking.openURL("tel:+919876543210");
  }, []);

  const handleWhatsApp = useCallback(() => {
    Linking.openURL("https://wa.me/919876543210?text=Hello, I need help with PGMS app");
  }, []);

  const contactMethods: ContactItem[] = useMemo(
    () => [
      {
        icon: "mail-outline",
        iconFamily: "ionicons" as const,
        title: "Email Us",
        subtitle: "24-48 hrs response",
        action: handleEmail,
      },
      {
        icon: "call-outline",
        iconFamily: "ionicons" as const,
        title: "Call Us",
        subtitle: "9 AM - 6 PM IST",
        action: handleCall,
      },
      {
        icon: "logo-whatsapp",
        iconFamily: "ionicons" as const,
        title: "WhatsApp",
        subtitle: "Quick support",
        action: handleWhatsApp,
      },
    ],
    [handleEmail, handleCall, handleWhatsApp]
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        header: {
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          borderBottomWidth: 1,
          borderBottomColor: hexToRgba(colors.textSecondary, 0.1),
          gap: 12,
        },
        backButton: {
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: hexToRgba(colors.textSecondary, 0.08),
          alignItems: "center",
          justifyContent: "center",
        },
        headerTitle: {
          flex: 1,
          fontSize: 20,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        content: {
          flex: 1,
        },
        scrollContent: {
          padding: spacing.md,
          paddingBottom: insets.bottom + spacing.lg,
        },
        // Hero section
        heroSection: {
          alignItems: "center",
          paddingVertical: spacing.lg,
        },
        heroIcon: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
          marginBottom: spacing.md,
        },
        heroTitle: {
          fontSize: 24,
          fontWeight: "700",
          color: colors.textPrimary,
          marginBottom: 8,
        },
        heroSubtitle: {
          fontSize: 15,
          color: colors.textSecondary,
          textAlign: "center",
          lineHeight: 22,
          paddingHorizontal: spacing.lg,
        },
        // Section
        sectionContainer: {
          marginTop: spacing.lg,
        },
        sectionHeader: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          marginBottom: spacing.md,
        },
        sectionIconBadge: {
          width: 32,
          height: 32,
          borderRadius: 10,
          backgroundColor: hexToRgba(colors.accent, 0.12),
          alignItems: "center",
          justifyContent: "center",
        },
        sectionTitle: {
          fontSize: 17,
          fontWeight: "700",
          color: colors.textPrimary,
        },
        // Contact grid
        contactGrid: {
          flexDirection: "row",
          gap: spacing.sm,
        },
        // Info card
        infoCard: {
          backgroundColor: hexToRgba(colors.accent, 0.08),
          borderRadius: radius.lg,
          padding: spacing.md,
          marginTop: spacing.lg,
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 12,
        },
        infoText: {
          flex: 1,
          fontSize: 13,
          color: colors.textSecondary,
          lineHeight: 20,
        },
      }),
    [colors, spacing, radius, insets.bottom]
  );

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [styles.backButton, pressed && { opacity: 0.7 }]}
          android_ripple={{ color: hexToRgba(colors.textSecondary, 0.2), borderless: true }}
          accessibilityRole="button"
          accessibilityLabel="Go back to login"
          accessibilityHint="Returns to the login screen"
          accessible
        >
          <MaterialIcons
            name={I18nManager.isRTL ? "arrow-forward" : "arrow-back"}
            size={24}
            color={colors.textPrimary}
          />
        </Pressable>
        <Text style={styles.headerTitle}>Help & Support</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIcon}>
            <Ionicons name="help-buoy-outline" size={40} color={colors.accent} />
          </View>
          <Text style={styles.heroTitle}>How can we help?</Text>
          <Text style={styles.heroSubtitle}>
            We're here to assist you with any questions or issues you may have. Choose how you'd
            like to reach us.
          </Text>
        </View>

        {/* Contact Methods */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="chatbubbles-outline" size={16} color={colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Contact Us</Text>
          </View>
          <View style={styles.contactGrid}>
            {contactMethods.map((method) => (
              <ContactCard key={method.title} {...method} />
            ))}
          </View>
        </View>

        {/* FAQ Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIconBadge}>
              <Ionicons name="help-circle-outline" size={16} color={colors.accent} />
            </View>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          </View>
          {FAQ_DATA.map((faq, index) => (
            <FAQItemComponent key={faq.id} item={faq} index={index} />
          ))}
        </View>

        {/* Support Info */}
        <View style={styles.infoCard}>
          <Ionicons name="time-outline" size={20} color={colors.accent} />
          <Text style={styles.infoText}>
            Our support team is available Monday to Saturday, 9:00 AM to 6:00 PM IST. For urgent
            matters outside these hours, please use WhatsApp.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

