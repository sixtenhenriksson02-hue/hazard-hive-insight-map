export type Language = "sv" | "en";

const translations: Record<string, Record<Language, string>> = {
  // Common
  "app.name": { sv: "RiskRadar", en: "RiskRadar" },
  "app.tagline": { sv: "Riskhantering & Förebyggande", en: "Risk Management & Prevention" },
  "common.save": { sv: "Spara", en: "Save" },
  "common.cancel": { sv: "Avbryt", en: "Cancel" },
  "common.edit": { sv: "Redigera", en: "Edit" },
  "common.delete": { sv: "Ta bort", en: "Delete" },
  "common.loading": { sv: "Laddar...", en: "Loading..." },
  "common.yes": { sv: "Ja", en: "Yes" },
  "common.no": { sv: "Nej", en: "No" },
  "common.send": { sv: "Skicka", en: "Send" },
  "common.all": { sv: "Alla", en: "All" },
  "common.days": { sv: "dagar", en: "days" },

  // Auth
  "auth.login": { sv: "Logga in", en: "Log in" },
  "auth.signup": { sv: "Skapa konto", en: "Create account" },
  "auth.email": { sv: "E-post", en: "Email" },
  "auth.password": { sv: "Lösenord", en: "Password" },
  "auth.name": { sv: "Namn", en: "Name" },
  "auth.role": { sv: "Roll", en: "Role" },
  "auth.worker": { sv: "Arbetare", en: "Worker" },
  "auth.admin": { sv: "Admin", en: "Admin" },
  "auth.noAccount": { sv: "Har du inget konto?", en: "Don't have an account?" },
  "auth.hasAccount": { sv: "Har du redan ett konto?", en: "Already have an account?" },
  "auth.forgotPassword": { sv: "Glömt lösenord?", en: "Forgot password?" },
  "auth.resetPassword": { sv: "Återställ lösenord", en: "Reset password" },
  "auth.sendResetLink": { sv: "Skicka återställningslänk", en: "Send reset link" },
  "auth.newPassword": { sv: "Nytt lösenord", en: "New password" },
  "auth.confirmPassword": { sv: "Bekräfta lösenord", en: "Confirm password" },
  "auth.updatePassword": { sv: "Uppdatera lösenord", en: "Update password" },
  "auth.resetSent": { sv: "Återställningslänk skickad!", en: "Reset link sent!" },
  "auth.resetSentDesc": { sv: "Kolla din e-post för länken.", en: "Check your email for the link." },
  "auth.backToLogin": { sv: "Tillbaka till inloggning", en: "Back to login" },
  "auth.selectProject": { sv: "Välj projekt", en: "Select project" },
  "auth.accountCreated": { sv: "Konto skapat!", en: "Account created!" },
  "auth.loggedIn": { sv: "Du är nu inloggad.", en: "You are now logged in." },
  "auth.logout": { sv: "Logga ut", en: "Log out" },

  // Header
  "header.viewAsWorker": { sv: "Visa som arbetare", en: "View as worker" },
  "header.viewAsAdmin": { sv: "Visa som admin", en: "View as admin" },

  // Dashboard
  "dashboard.welcome": { sv: "Välkommen tillbaka 👋", en: "Welcome back 👋" },
  "dashboard.subtitle": { sv: "Rapportera, spåra och åtgärda risker på arbetsplatsen.", en: "Report, track and resolve workplace risks." },
  "dashboard.reports": { sv: "Rapporter", en: "Reports" },
  "dashboard.matrix": { sv: "Riskmatris", en: "Risk Matrix" },
  "dashboard.stats": { sv: "Statistik", en: "Statistics" },
  "dashboard.newReport": { sv: "Ny rapport", en: "New Report" },
  "dashboard.noReports": { sv: "Inga rapporter att visa.", en: "No reports to show." },
  "dashboard.loadingReports": { sv: "Laddar rapporter...", en: "Loading reports..." },

  // Sort
  "sort.newest": { sv: "Nyast först", en: "Newest first" },
  "sort.severity": { sv: "Allvarligast", en: "Most severe" },
  "sort.oldestOpen": { sv: "Längst kvar", en: "Longest open" },

  // Status
  "status.open": { sv: "Öppen", en: "Open" },
  "status.inProgress": { sv: "Pågår", en: "In Progress" },
  "status.resolved": { sv: "Åtgärdad", en: "Resolved" },
  "status.all": { sv: "Alla", en: "All" },
  "status.openPlural": { sv: "Öppna", en: "Open" },
  "status.resolvedPlural": { sv: "Åtgärdade", en: "Resolved" },

  // Risk levels
  "risk.low": { sv: "Låg", en: "Low" },
  "risk.medium": { sv: "Medel", en: "Medium" },
  "risk.high": { sv: "Hög", en: "High" },
  "risk.critical": { sv: "Kritisk", en: "Critical" },

  // Stats
  "stats.total": { sv: "Totalt rapporter", en: "Total reports" },
  "stats.open": { sv: "Öppna", en: "Open" },
  "stats.inProgress": { sv: "Pågår", en: "In Progress" },
  "stats.resolved": { sv: "Åtgärdade", en: "Resolved" },
  "stats.critical": { sv: "kritiska", en: "critical" },

  // Report form
  "form.title": { sv: "Titel", en: "Title" },
  "form.titlePlaceholder": { sv: "Kort beskrivning...", en: "Short description..." },
  "form.reportType": { sv: "Typ av rapport", en: "Report type" },
  "form.observation": { sv: "Riskobservation", en: "Risk Observation" },
  "form.injury": { sv: "Skadeanmälan", en: "Injury Report" },
  "form.building": { sv: "Byggnad/Projekt", en: "Building/Project" },
  "form.specificLocation": { sv: "Specifik plats", en: "Specific location" },
  "form.specificLocationPlaceholder": { sv: "T.ex. Gång 3, våning 2", en: "E.g. Aisle 3, floor 2" },
  "form.category": { sv: "Kategori", en: "Category" },
  "form.description": { sv: "Beskrivning", en: "Description" },
  "form.descriptionPlaceholder": { sv: "Beskriv kort vad som inträffade...", en: "Briefly describe what happened..." },
  "form.severity": { sv: "Allvarlighetsgrad", en: "Severity" },
  "form.severityLabels": { sv: "1=Lindrig, 5=Mycket allvarlig", en: "1=Minor, 5=Very serious" },
  "form.image": { sv: "Bifoga bild (valfritt)", en: "Attach image (optional)" },
  "form.uploadImage": { sv: "Ladda upp bild", en: "Upload image" },
  "form.changeImage": { sv: "Byt bild", en: "Change image" },
  "form.aiNote": { sv: "Risknivån bedöms utifrån din beskrivning och allvarlighetsgrad.", en: "Risk level is assessed from your description and severity." },
  "form.submitReport": { sv: "Skicka rapport", en: "Submit report" },
  "form.fillAllFields": { sv: "Fyll i alla obligatoriska fält", en: "Fill in all required fields" },
  "form.reportCreated": { sv: "Rapport skapad!", en: "Report created!" },
  "form.reportCreatedDesc": { sv: "Risken har bedömts automatiskt.", en: "Risk has been assessed automatically." },

  // Injury fields
  "injury.bodyPart": { sv: "Skadad kroppsdel", en: "Injured body part" },
  "injury.type": { sv: "Typ av skada", en: "Type of injury" },
  "injury.medicalCare": { sv: "Sjukvård krävdes?", en: "Medical care required?" },
  "injury.absence": { sv: "Frånvaro från arbetet?", en: "Absence from work?" },
  "injury.absenceDays": { sv: "Antal dagar", en: "Number of days" },

  // Report detail
  "detail.reporter": { sv: "Rapporterad av", en: "Reported by" },
  "detail.unknown": { sv: "Okänd", en: "Unknown" },
  "detail.status": { sv: "Status", en: "Status" },
  "detail.comments": { sv: "Kommentarer", en: "Comments" },
  "detail.noComments": { sv: "Inga kommentarer ännu.", en: "No comments yet." },
  "detail.writeComment": { sv: "Skriv en kommentar...", en: "Write a comment..." },
  "detail.building": { sv: "Byggnad", en: "Building" },
  "detail.location": { sv: "Plats", en: "Location" },
  "detail.injuryDetails": { sv: "Skadedetaljer", en: "Injury details" },

  // Projects
  "project.manage": { sv: "Hantera projekt", en: "Manage Projects" },
  "project.create": { sv: "Skapa projekt", en: "Create Project" },
  "project.name": { sv: "Projektnamn", en: "Project name" },
  "project.namePlaceholder": { sv: "T.ex. Bygge Storgatan 5", en: "E.g. Construction Main St 5" },
  "project.noProjects": { sv: "Inga projekt skapade ännu.", en: "No projects created yet." },
  "project.created": { sv: "Projekt skapat!", en: "Project created!" },
  "project.select": { sv: "Välj projekt", en: "Select project" },

  // Risk matrix
  "matrix.title": { sv: "Riskmatris", en: "Risk Matrix" },
  "matrix.probability": { sv: "Sannolikhet", en: "Probability" },
  "matrix.consequence": { sv: "Konsekvens", en: "Consequence" },
  "matrix.veryLikely": { sv: "Mycket troligt", en: "Very likely" },
  "matrix.likely": { sv: "Troligt", en: "Likely" },
  "matrix.possible": { sv: "Möjligt", en: "Possible" },
  "matrix.unlikely": { sv: "Osannolikt", en: "Unlikely" },
  "matrix.minor": { sv: "Lindrig", en: "Minor" },
  "matrix.moderate": { sv: "Måttlig", en: "Moderate" },
  "matrix.serious": { sv: "Allvarlig", en: "Serious" },
  "matrix.verySevere": { sv: "Mycket allvarlig", en: "Very severe" },

  // Admin stats
  "adminStats.title": { sv: "Statistik", en: "Statistics" },
  "adminStats.period": { sv: "Period", en: "Period" },
  "adminStats.last7": { sv: "Senaste 7 dagarna", en: "Last 7 days" },
  "adminStats.last30": { sv: "Senaste 30 dagarna", en: "Last 30 days" },
  "adminStats.last90": { sv: "Senaste 90 dagarna", en: "Last 90 days" },
  "adminStats.reportsOverTime": { sv: "Rapporter över tid", en: "Reports over time" },
  "adminStats.byCategory": { sv: "Per kategori", en: "By category" },
  "adminStats.byRisk": { sv: "Per risknivå", en: "By risk level" },
  "adminStats.resolutionRate": { sv: "Åtgärdsgrad", en: "Resolution rate" },
  "adminStats.avgResolutionDays": { sv: "Snitt åtgärdstid (dagar)", en: "Avg resolution time (days)" },
  "adminStats.injuryReports": { sv: "Skadeanmälningar", en: "Injury reports" },
  "adminStats.observations": { sv: "Riskobservationer", en: "Risk observations" },
};

// Categories
export const CATEGORIES_I18N: Record<Language, string[]> = {
  sv: ["Halkrisk", "Snubbelrisk", "Belysning", "Brandsäkerhet", "Skyddsutrustning", "Ergonomi", "Kemikalier", "Elektricitet", "Fordon/Truckar", "Övrigt"],
  en: ["Slip hazard", "Trip hazard", "Lighting", "Fire safety", "Protective equipment", "Ergonomics", "Chemicals", "Electricity", "Vehicles/Forklifts", "Other"],
};

export const BODY_PARTS_I18N: Record<Language, string[]> = {
  sv: ["Huvud", "Ansikte", "Öga", "Nacke", "Axel", "Arm", "Hand/Fingrar", "Rygg", "Bröst/Mage", "Höft", "Ben", "Knä", "Fot/Tår"],
  en: ["Head", "Face", "Eye", "Neck", "Shoulder", "Arm", "Hand/Fingers", "Back", "Chest/Abdomen", "Hip", "Leg", "Knee", "Foot/Toes"],
};

export const INJURY_TYPES_I18N: Record<Language, string[]> = {
  sv: ["Sårskada", "Stukning/Vrickning", "Fraktur", "Brännskada", "Klämskada", "Skärskada", "Ögonskada", "Hörselskada", "Andningsbesvär", "Övrigt"],
  en: ["Wound", "Sprain/Strain", "Fracture", "Burn", "Crush injury", "Cut", "Eye injury", "Hearing damage", "Breathing difficulty", "Other"],
};

export function t(key: string, lang: Language): string {
  return translations[key]?.[lang] ?? key;
}

export default translations;
