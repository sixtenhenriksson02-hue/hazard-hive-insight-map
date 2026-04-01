// Maps category names (both sv and en) to lucide icon names
// These icons visually represent each risk category

const CATEGORY_ICON_MAP: Record<string, string> = {
  // Swedish
  "Halkrisk": "🚶‍♂️💦",
  "Snubbelrisk": "⚠️🦶",
  "Fallrisk (höjd)": "🧗‍♂️⬇️",
  "Belysning": "💡",
  "Brandsäkerhet": "🔥🧯",
  "Skyddsutrustning": "🦺",
  "Ergonomi": "🏋️‍♂️",
  "Kemikalier": "☠️",
  "Elektricitet": "⚡",
  "Fordon/Truckar": "🚜",
  "Buller/Vibrationer": "🔊🙉",
  "Damm/Partiklar": "😷",
  "Ras/Kollaps": "🏚️💥",
  "Klämrisk": "✋🚧",
  "Lyftanordningar/Kranarbete": "🏗️",
  "Arbete i trånga utrymmen": "🚪🔒",
  "Heta arbeten (svetsning)": "🔥👨‍🏭",
  "Ordning & reda": "🧹",
  "Bristfällig skyltning": "⚠️🚫",
  "Psykosocial arbetsmiljö": "🧠💬",
  "Övrigt": "📋",

  // English
  "Slip hazard": "🚶‍♂️💦",
  "Trip hazard": "⚠️🦶",
  "Fall risk (height)": "🧗‍♂️⬇️",
  "Lighting": "💡",
  "Fire safety": "🔥🧯",
  "Protective equipment": "🦺",
  "Ergonomics": "🏋️‍♂️",
  "Chemicals": "☠️",
  "Electricity": "⚡",
  "Vehicles/Forklifts": "🚜",
  "Noise/Vibrations": "🔊🙉",
  "Dust/Particles": "😷",
  "Collapse risk": "🏚️💥",
  "Crush risk": "✋🚧",
  "Lifting equipment/Crane work": "🏗️",
  "Confined spaces": "🚪🔒",
  "Hot work (welding)": "🔥👨‍🏭",
  "Housekeeping": "🧹",
  "Inadequate signage": "⚠️🚫",
  "Psychosocial work environment": "🧠💬",
  "Other": "📋",
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICON_MAP[category] ?? "📋";
}
