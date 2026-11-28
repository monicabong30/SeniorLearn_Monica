import { useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import auFlag from "../../assets/flags/au.png";
import caFlag from "../../assets/flags/ca.png";
import gbFlag from "../../assets/flags/gb.png";
import myFlag from "../../assets/flags/my.png";
import nzFlag from "../../assets/flags/nz.png";
import sgFlag from "../../assets/flags/sg.png";
import usFlag from "../../assets/flags/us.png";

const localFlags: Record<string, number> = {
  AU: auFlag, NZ: nzFlag, MY: myFlag, SG: sgFlag, GB: gbFlag, US: usFlag, CA: caFlag,
};

/** A fixed-size, cached national flag. Local assets are preferred for common countries. */
export function CountryFlag({ iso }: { iso: string }) {
  const [failed, setFailed] = useState(false);
  const code = iso.toUpperCase(), local = localFlags[code];
  if (failed) return <View accessibilityLabel={`${code} flag unavailable`} style={s.fallback}><Ionicons accessible={false} name="globe-outline" size={16} color="#4B5563" /></View>;
  return <Image accessibilityLabel={`${code} flag`} source={local ?? { uri: `https://flagcdn.com/w80/${code.toLowerCase()}.png`, cache: "force-cache" }} onError={() => setFailed(true)} style={s.image} />;
}
const s = StyleSheet.create({ image: { width: 24, height: 18, borderRadius: 2, resizeMode: "contain" }, fallback: { width: 24, height: 18, alignItems: "center", justifyContent: "center", borderRadius: 2, backgroundColor: "#F3F4F6" } });
