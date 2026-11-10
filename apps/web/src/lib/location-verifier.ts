/**
 * Strict Location Verifier for Miracle Discovery Engine
 * Enforces authentic physical city & country verification for discovered business leads.
 */

export interface LocationVerificationResult {
  matched: boolean;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "MISMATCH";
  matchedCity: boolean;
  matchedCountry: boolean;
  evidence: string[];
  reason?: string;
}

// Known regional signatures, ccTLDs, phone prefixes, and major districts
const COUNTRY_SIGNATURES: Record<
  string,
  {
    aliases: string[];
    cctlds: string[];
    phonePrefixes: string[];
    cities: Record<string, { aliases: string[]; districts: string[]; postalPrefixes: string[] }>;
  }
> = {
  "saudi arabia": {
    aliases: ["saudi arabia", "ksa", "saudi", "المملكة العربية السعودية", "السعودية"],
    cctlds: [".sa", ".com.sa", ".net.sa", ".org.sa", ".edu.sa", ".gov.sa"],
    phonePrefixes: ["+966", "00966", "966"],
    cities: {
      riyadh: {
        aliases: ["riyadh", "ar riyadh", "الرياض"],
        districts: [
          "olaya",
          "al olaya",
          "malqa",
          "al malqa",
          "nakheel",
          "al nakheel",
          "sulaimaniyah",
          "al sulaimaniyah",
          "diplomatic quarter",
          "dq",
          "hittin",
          "al hittin",
          "mohammadiyyah",
          "al mohammadiyyah",
          "wurud",
          "al wurud",
          "yasmin",
          "al yasmin",
          "king fahd",
          "al izdihar",
          "sahafa",
          "al narjis",
          "aqiq",
          "qurtubah",
          "rawdah",
          "diriyah",
        ],
        postalPrefixes: ["11", "12", "13", "14"],
      },
      jeddah: {
        aliases: ["jeddah", "jiddah", "جدة"],
        districts: ["al rawdah", "al andalus", "al salamah", "al hamra", "obhur"],
        postalPrefixes: ["21", "22", "23"],
      },
      dammam: {
        aliases: ["dammam", "الدمام", "khobar", "al khobar", "الخبر"],
        districts: ["al faisaliyah", "al shatie", "corniche"],
        postalPrefixes: ["31", "32"],
      },
    },
  },
  "united states": {
    aliases: ["united states", "usa", "us", "u.s.", "america"],
    cctlds: [".us"],
    phonePrefixes: ["+1", "1-"],
    cities: {
      chicago: {
        aliases: ["chicago", "chi"],
        districts: ["loop", "river north", "lincoln park", "west loop", "wicker park"],
        postalPrefixes: ["606"],
      },
      "new york": {
        aliases: ["new york", "nyc", "manhattan", "brooklyn", "queens"],
        districts: ["soho", "tribeca", "midtown", "chelsea", "williamsburg"],
        postalPrefixes: ["100", "101", "102", "112"],
      },
      austin: {
        aliases: ["austin", "atx"],
        districts: ["downtown", "south congress", "east austin", "domain"],
        postalPrefixes: ["787"],
      },
      "los angeles": {
        aliases: ["los angeles", "la", "hollywood", "santa monica", "beverly hills"],
        districts: ["downtown la", "venice", "silver lake", "west hollywood"],
        postalPrefixes: ["900", "902", "904"],
      },
    },
  },
  "united arab emirates": {
    aliases: ["united arab emirates", "uae", "الإمارات العربية المتحدة", "الإمارات"],
    cctlds: [".ae"],
    phonePrefixes: ["+971", "00971", "971"],
    cities: {
      dubai: {
        aliases: ["dubai", "دبي"],
        districts: ["downtown", "marina", "jbr", "business bay", "difc", "palm jumeirah"],
        postalPrefixes: [],
      },
      "abu dhabi": {
        aliases: ["abu dhabi", "أبو ظبي"],
        districts: ["al reem", "saadiyat", "corniche", "yas island"],
        postalPrefixes: [],
      },
    },
  },
  "united kingdom": {
    aliases: ["united kingdom", "uk", "great britain", "england", "britain"],
    cctlds: [".uk", ".co.uk"],
    phonePrefixes: ["+44", "0044", "44"],
    cities: {
      london: {
        aliases: ["london"],
        districts: ["shoreditch", "soho", "mayfair", "canary wharf", "kensington"],
        postalPrefixes: ["EC", "WC", "W1", "SW1", "E1"],
      },
    },
  },
};

/**
 * Normalizes string for fuzzy/alias comparison
 */
function norm(str: string): string {
  return (str || "").toLowerCase().trim().replace(/['".,-]/g, " ");
}

/**
 * Verifies whether a candidate business genuinely belongs to the target city & country.
 */
export function verifyLocationMatch(
  candidate: {
    city?: string;
    country?: string;
    website?: string;
    address?: string;
    phone?: string;
    textEvidence?: string;
  },
  targetCity: string,
  targetCountry: string
): LocationVerificationResult {
  const normTargetCountry = norm(targetCountry);
  const normTargetCity = norm(targetCity);
  const candCity = norm(candidate.city || "");
  const candCountry = norm(candidate.country || "");
  const website = (candidate.website || "").toLowerCase();
  const phone = (candidate.phone || "").replace(/\s+/g, "");
  const combinedText = norm(
    `${candidate.city || ""} ${candidate.country || ""} ${candidate.address || ""} ${candidate.textEvidence || ""} ${candidate.website || ""}`
  );

  const evidence: string[] = [];
  let matchedCountry = false;
  let matchedCity = false;

  // 1. Direct Known Mismatch check
  // E.g., target is Riyadh/Saudi Arabia, but candidate is Chicago/United States
  const countryConfig = COUNTRY_SIGNATURES[normTargetCountry] ||
    Object.values(COUNTRY_SIGNATURES).find((c) => c.aliases.some((a) => normTargetCountry.includes(a)));

  // If candidate has an explicit city/country that belongs to a different country
  for (const [otherCountryKey, otherCountry] of Object.entries(COUNTRY_SIGNATURES)) {
    if (countryConfig && otherCountryKey === normTargetCountry) continue;

    // Check if candidate matches this OTHER country
    const isOtherCountry =
      otherCountry.aliases.some((a) => candCountry === a || candCountry.includes(a)) ||
      otherCountry.cctlds.some((tld) => website.endsWith(tld) || website.includes(tld + "/"));

    for (const [otherCityKey, otherCity] of Object.entries(otherCountry.cities)) {
      if (
        candCity === otherCityKey ||
        otherCity.aliases.some((a) => candCity === a) ||
        (website.includes(otherCityKey) && !countryConfig)
      ) {
        if (normTargetCountry !== otherCountryKey || normTargetCity !== otherCityKey) {
          return {
            matched: false,
            confidence: "MISMATCH",
            matchedCity: false,
            matchedCountry: false,
            evidence: [`Explicit location mismatch: Candidate is in ${candCity || otherCityKey}, ${candCountry || otherCountryKey}`],
            reason: `Business is located in ${candidate.city || otherCityKey}, not in ${targetCity}, ${targetCountry}`,
          };
        }
      }
    }

    if (isOtherCountry && countryConfig && !otherCountry.aliases.some((a) => normTargetCountry.includes(a))) {
      return {
        matched: false,
        confidence: "MISMATCH",
        matchedCity: false,
        matchedCountry: false,
        evidence: [`Explicit country mismatch: Candidate is in ${candCountry || otherCountryKey}`],
        reason: `Business is located in ${candidate.country || otherCountryKey}, not in ${targetCountry}`,
      };
    }
  }

  // 2. Target Country Verification
  if (countryConfig) {
    if (countryConfig.aliases.some((a) => candCountry.includes(a) || combinedText.includes(a))) {
      matchedCountry = true;
      evidence.push(`Country matched alias: "${targetCountry}"`);
    }

    if (countryConfig.cctlds.some((tld) => website.includes(tld))) {
      matchedCountry = true;
      evidence.push(`National ccTLD matched: ${countryConfig.cctlds.find((tld) => website.includes(tld))}`);
    }

    if (countryConfig.phonePrefixes.some((p) => phone.startsWith(p) || phone.includes(p))) {
      matchedCountry = true;
      evidence.push(`International telephone dialing code matched for ${targetCountry}`);
    }
  } else {
    // Generic country matching
    if (candCountry.includes(normTargetCountry) || combinedText.includes(normTargetCountry)) {
      matchedCountry = true;
      evidence.push(`Country name found in profile: ${targetCountry}`);
    }
  }

  // 3. Target City Verification
  const cityConfig = countryConfig?.cities[normTargetCity] ||
    (countryConfig ? Object.values(countryConfig.cities).find((c) => c.aliases.some((a) => normTargetCity.includes(a))) : undefined);

  if (cityConfig) {
    if (cityConfig.aliases.some((a) => candCity === a || combinedText.includes(a))) {
      matchedCity = true;
      evidence.push(`City name verified: "${targetCity}"`);
    }

    const matchedDistrict = cityConfig.districts.find((d) => combinedText.includes(d));
    if (matchedDistrict) {
      matchedCity = true;
      evidence.push(`Recognized ${targetCity} district identified: "${matchedDistrict}"`);
    }
  } else {
    // Generic city matching
    if (candCity === normTargetCity || candCity.includes(normTargetCity) || combinedText.includes(normTargetCity)) {
      matchedCity = true;
      evidence.push(`City name matched: "${targetCity}"`);
    }
  }

  // 4. Synthesize Confidence
  if (matchedCity && matchedCountry) {
    const isHigh = evidence.length >= 2;
    return {
      matched: true,
      confidence: isHigh ? "HIGH" : "MEDIUM",
      matchedCity: true,
      matchedCountry: true,
      evidence,
    };
  }

  if (matchedCity && !matchedCountry) {
    return {
      matched: false,
      confidence: "LOW",
      matchedCity: true,
      matchedCountry: false,
      evidence,
      reason: `City "${targetCity}" detected but missing confirmed presence in "${targetCountry}"`,
    };
  }

  return {
    matched: false,
    confidence: "MISMATCH",
    matchedCity,
    matchedCountry,
    evidence,
    reason: `Candidate failed location verification for ${targetCity}, ${targetCountry}`,
  };
}
