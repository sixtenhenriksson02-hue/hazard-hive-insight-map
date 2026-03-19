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
  "form.building": { sv: "Projekt", en: "Project" },
  "form.specificLocation": { sv: "Specifik plats", en: "Specific location" },
  "form.specificLocationPlaceholder": { sv: "T.ex. Gång 3, våning 2", en: "E.g. Aisle 3, floor 2" },
  "form.category": { sv: "Kategori", en: "Category" },
  "form.description": { sv: "Beskrivning", en: "Description" },
  "form.descriptionPlaceholder": { sv: "Beskriv kort vad som inträffade...", en: "Briefly describe what happened..." },
  "form.severity": { sv: "Allvarlighetsgrad", en: "Severity" },
  "form.severityLabels": { sv: "1=Lindrig, 5=Mycket allvarlig", en: "1=Minor, 5=Very serious" },
  "form.project": { sv: "Projekt", en: "Project" },
  "form.assessing": { sv: "AI bedömer risk...", en: "AI assessing risk..." },
  "form.image": { sv: "Bifoga bild (valfritt)", en: "Attach image (optional)" },
  "form.uploadImage": { sv: "Ladda upp bild", en: "Upload image" },
  "form.changeImage": { sv: "Byt bild", en: "Change image" },
  "form.aiNote": { sv: "Risknivån bedöms automatiskt av AI baserat på din rapport.", en: "Risk level is automatically assessed by AI based on your report." },
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
  "detail.aiAssessment": { sv: "AI-bedömning", en: "AI Assessment" },
  "detail.reassess": { sv: "Ombedöm", en: "Reassess" },
  "detail.overrideRisk": { sv: "Ändra risknivå", en: "Override risk level" },
  "detail.adminOverride": { sv: "Ändrad av admin", en: "Changed by admin" },
  "detail.suggestedActions": { sv: "Föreslagna åtgärder", en: "Suggested Actions" },

  // Projects
  "project.manage": { sv: "Hantera projekt", en: "Manage Projects" },
  "project.create": { sv: "Skapa projekt", en: "Create Project" },
  "project.name": { sv: "Projektnamn", en: "Project name" },
  "project.namePlaceholder": { sv: "T.ex. Bygge Storgatan 5", en: "E.g. Construction Main St 5" },
  "project.noProjects": { sv: "Inga projekt skapade ännu.", en: "No projects created yet." },
  "project.created": { sv: "Projekt skapat!", en: "Project created!" },
  "project.select": { sv: "Välj projekt", en: "Select project" },
  "project.allProjects": { sv: "Alla projekt", en: "All projects" },
  "project.selectProject": { sv: "Välj projekt", en: "Select project" },
  "safety.firstAid": { sv: "Förstahjälpen", en: "First Aid" },
  "safety.fireExtinguisher": { sv: "Brandsläckare", en: "Fire Extinguisher" },
  "safety.placeFirstAid": { sv: "Placera förstahjälpen", en: "Place First Aid" },
  "safety.placeFireExtinguisher": { sv: "Placera brandsläckare", en: "Place Fire Ext." },
  "safety.defibrillator": { sv: "Hjärtstartare", en: "Defibrillator" },
  "safety.placeDefibrillator": { sv: "Placera hjärtstartare", en: "Place Defibrillator" },
  "safety.placingMode": { sv: "Klicka på kartan för att placera", en: "Click on the map to place" },
  "safety.markerPlaced": { sv: "Markör placerad!", en: "Marker placed!" },
  "safety.markerDeleted": { sv: "Markör borttagen!", en: "Marker deleted!" },
  "safety.markerUpdated": { sv: "Markör uppdaterad!", en: "Marker updated!" },
  "safety.addDescription": { sv: "Lägg till beskrivning", en: "Add description" },
  "safety.descriptionPlaceholder": { sv: "T.ex. Plan 2, vid trappuppgången", en: "E.g. Floor 2, by the staircase" },
  "safety.noDescription": { sv: "Ingen beskrivning", en: "No description" },
  "project.myProjects": { sv: "Mina projekt", en: "My Projects" },
  "project.addProject": { sv: "Lägg till projekt", en: "Add project" },
  "project.setActive": { sv: "Välj", en: "Select" },
  "project.selectToAdd": { sv: "Välj projekt att lägga till:", en: "Select project to add:" },
  "project.noEnrolled": { sv: "Du är inte med i något projekt ännu.", en: "You're not enrolled in any project yet." },
  "project.allEnrolled": { sv: "Du är redan med i alla projekt.", en: "You're already enrolled in all projects." },
  "project.inviteCode": { sv: "Inbjudningskod", en: "Invite code" },
  "project.codeCopied": { sv: "Kod kopierad!", en: "Code copied!" },
  "project.joinWithCode": { sv: "Gå med i projekt med kod", en: "Join project with code" },
  "project.archive": { sv: "Arkivera", en: "Archive" },
  "project.activate": { sv: "Aktivera", en: "Activate" },
  "project.archived": { sv: "Arkiverat", en: "Archived" },
  "project.showArchived": { sv: "Visa arkiverade", en: "Show archived" },
  "project.hideArchived": { sv: "Dölj arkiverade", en: "Hide archived" },
  "project.enterCode": { sv: "Ange kod", en: "Enter code" },
  "project.join": { sv: "Gå med", en: "Join" },

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
  "matrix.aiInfoTitle": { sv: "Hur bedömer AI riskerna?", en: "How does AI assess risks?" },
  "matrix.aiInfoText1": { sv: "AI:n analyserar titel, beskrivning, kategori, platsinfo och skadedetaljer för att bedöma risknivån. Den använder riskmatrisen ovan som grund – sannolikhet × konsekvens.", en: "The AI analyzes title, description, category, location info and injury details to assess the risk level. It uses the risk matrix above as a basis – probability × consequence." },
  "matrix.aiInfoText2": { sv: "Om en kommentar indikerar att risken har åtgärdats gör AI:n en ny bedömning automatiskt. Administratörer kan alltid manuellt ändra risknivån.", en: "If a comment indicates the risk has been resolved, the AI automatically reassesses. Admins can always manually override the risk level." },
  "matrix.aiInfoTips": { sv: "Tips för bättre AI-bedömning:", en: "Tips for better AI assessment:" },
  "matrix.aiTip1": { sv: "Beskriv vad som hände eller kan hända så detaljerat som möjligt", en: "Describe what happened or could happen as detailed as possible" },
  "matrix.aiTip2": { sv: "Ange exakt plats (byggnad, våning, gång)", en: "Specify exact location (building, floor, aisle)" },
  "matrix.aiTip3": { sv: "Välj rätt kategori – det hjälper AI:n att bedöma konsekvenserna", en: "Choose the right category – it helps the AI assess consequences" },
  "matrix.aiTip4": { sv: "Vid skadeanmälan: fyll i alla skadedetaljer noggrant", en: "For injury reports: fill in all injury details carefully" },

  // Notifications
  "notifications.title": { sv: "Notifikationer", en: "Notifications" },
  "notifications.empty": { sv: "Inga notifikationer", en: "No notifications" },
  "notifications.markAllRead": { sv: "Markera alla lästa", en: "Mark all read" },

  // Monthly Report
  "monthly.title": { sv: "Månadsrapport", en: "Monthly Report" },
  "monthly.generate": { sv: "Månadsrapport", en: "Monthly Report" },
  "monthly.generating": { sv: "Genererar...", en: "Generating..." },
  "monthly.keyRisks": { sv: "Identifierade risker", en: "Key Risks" },
  "monthly.trends": { sv: "Trender", en: "Trends" },
  "monthly.improvements": { sv: "Förbättringar", en: "Improvements" },
  "monthly.actionPlan": { sv: "Åtgärdsplan", en: "Action Plan" },

  "apd.title": { sv: "Riskanalys-karta", en: "Risk Analysis Map" },
  "apd.upload": { sv: "Ladda upp", en: "Upload" },
  "apd.uploadTitle": { sv: "Ladda upp riskanalys-karta", en: "Upload Risk Analysis Map" },
  "apd.planName": { sv: "Namn på planen", en: "Plan name" },
  "apd.selectFile": { sv: "Välj fil (bild)", en: "Select file (image)" },
  "apd.uploaded": { sv: "Riskanalys-karta uppladdad!", en: "Risk analysis map uploaded!" },
  "apd.noPlan": { sv: "Ingen riskanalys-karta uppladdad för detta projekt.", en: "No risk analysis map uploaded for this project." },
  "apd.uploadFirst": { sv: "Ladda upp en karta", en: "Upload a map" },
  "apd.selectProject": { sv: "Välj ett projekt för att se riskanalys-kartan.", en: "Select a project to view the risk analysis map." },
  "apd.clickToPlace": { sv: "Klicka på kartan för att markera var risken uppstod", en: "Click on the map to mark where the risk occurred" },
  "apd.confirmDelete": { sv: "Är du säker på att du vill ta bort denna riskanalys-karta?", en: "Are you sure you want to delete this risk analysis map?" },
  "apd.deleted": { sv: "Riskanalys-karta borttagen", en: "Risk analysis map deleted" },
  "apd.placeOnPlan": { sv: "Markera på riskanalys-karta", en: "Mark on risk analysis map" },
  "apd.legendTitle": { sv: "Risker på kartan", en: "Risks on map" },
  "apd.activeRisks": { sv: "Aktiva risker på kartan", en: "Active risks on map" },
  "apd.enhance": { sv: "Förbättra bild", en: "Enhance image" },

  // Admin stats
  "adminStats.title": { sv: "Statistik", en: "Statistics" },
  "adminStats.period": { sv: "Period", en: "Period" },
  "adminStats.last7": { sv: "Senaste 7 dagarna", en: "Last 7 days" },
  "adminStats.last30": { sv: "Senaste 30 dagarna", en: "Last 30 days" },
  "adminStats.last90": { sv: "Senaste 90 dagarna", en: "Last 90 days" },
  "adminStats.last180": { sv: "Senaste 180 dagarna", en: "Last 180 days" },
  "adminStats.last365": { sv: "Senaste året", en: "Last year" },
  "adminStats.allTime": { sv: "All tid", en: "All time" },
  "adminStats.reportsOverTime": { sv: "Rapporter över tid", en: "Reports over time" },
  "adminStats.byCategory": { sv: "Per kategori", en: "By category" },
  "adminStats.byRisk": { sv: "Per risknivå", en: "By risk level" },
  "adminStats.resolutionRate": { sv: "Åtgärdsgrad", en: "Resolution rate" },
  "adminStats.avgResolutionDays": { sv: "Snitt åtgärdstid (dagar)", en: "Avg resolution time (days)" },
  "adminStats.resolvedHistory": { sv: "Åtgärdade rapporter", en: "Resolved reports" },
  "adminStats.resolvedAt": { sv: "Åtgärdad", en: "Resolved" },
  "adminStats.noResolved": { sv: "Inga åtgärdade rapporter i perioden.", en: "No resolved reports in this period." },
  "adminStats.injuryReports": { sv: "Skadeanmälningar", en: "Injury reports" },
  "adminStats.observations": { sv: "Riskobservationer", en: "Risk observations" },

  // Report Generator
  "reportGen.title": { sv: "Generera rapport", en: "Generate Report" },
  "reportGen.button": { sv: "Periodrapporter", en: "Period Reports" },
  "reportGen.monthly": { sv: "Månadsrapport", en: "Monthly" },
  "reportGen.quarterly": { sv: "Kvartalsrapport", en: "Quarterly" },
  "reportGen.yearly": { sv: "Årsrapport", en: "Yearly" },
  "reportGen.generate": { sv: "Generera", en: "Generate" },
  "reportGen.generating": { sv: "Genererar...", en: "Generating..." },
  "reportGen.saveDoc": { sv: "Spara som dokument", en: "Save as document" },
  "reportGen.saved": { sv: "Rapport sparad som dokument!", en: "Report saved as document!" },
  "reportGen.saveError": { sv: "Kunde inte spara dokumentet", en: "Could not save document" },
  "reportGen.error": { sv: "Kunde inte generera rapport", en: "Could not generate report" },

  // Documents
  "documents.title": { sv: "Dokument", en: "Documents" },
  "documents.subtitle": { sv: "Sparade rapporter och analyser", en: "Saved reports and analyses" },
  "documents.empty": { sv: "Inga dokument sparade ännu.", en: "No documents saved yet." },

  // Translate
  "translate.button": { sv: "Översätt till engelska", en: "Translate to English" },
  "translate.translating": { sv: "Översätter...", en: "Translating..." },
  "translate.original": { sv: "Visa original", en: "Show original" },

  // Spellcheck
  "spellcheck.button": { sv: "Stavningskoll", en: "Spell check" },
  "spellcheck.checking": { sv: "Kontrollerar...", en: "Checking..." },
  "spellcheck.done": { sv: "Kontrollerad", en: "Checked" },
  "spellcheck.corrected": { sv: "Stavning korrigerad!", en: "Spelling corrected!" },
  "spellcheck.noErrors": { sv: "Inga stavfel hittades!", en: "No spelling errors found!" },
  "spellcheck.reviewTitle": { sv: "Stavningskontroll", en: "Spell Check" },
  "spellcheck.reviewDesc": { sv: "Följande ändringar föreslås. Godkänn för att skicka rapporten med rättad text, eller avvisa för att behålla originalet.", en: "The following changes are suggested. Accept to submit with corrected text, or reject to keep the original." },
  "spellcheck.original": { sv: "Original", en: "Original" },
  "spellcheck.suggested": { sv: "Förslag", en: "Suggested" },
  "spellcheck.accept": { sv: "Godkänn & skicka", en: "Accept & submit" },
  "spellcheck.reject": { sv: "Behåll original & skicka", en: "Keep original & submit" },
  "spellcheck.autoChecking": { sv: "Kontrollerar stavning...", en: "Checking spelling..." },

  // Navigation
  "nav.dashboard": { sv: "Dashboard", en: "Dashboard" },
  "nav.documents": { sv: "Dokument", en: "Documents" },

  // Help Guide
  "help.button": { sv: "Hjälp", en: "Help" },
  "help.adminTitle": { sv: "Så här fungerar RiskRadar – Admin", en: "How RiskRadar works – Admin" },
  "help.workerTitle": { sv: "Så här fungerar RiskRadar – Arbetare", en: "How RiskRadar works – Worker" },
  "help.adminIntro": { sv: "Som admin har du full kontroll över projekt, rapporter och statistik. Här är en steg-för-steg guide:", en: "As an admin you have full control over projects, reports and statistics. Here's a step-by-step guide:" },
  "help.workerIntro": { sv: "Som arbetare kan du rapportera risker och följa upp dem. Här är hur du kommer igång:", en: "As a worker you can report risks and follow up on them. Here's how to get started:" },

  // Admin help steps
  "help.admin.createProject": { sv: "Skapa ett projekt", en: "Create a project" },
  "help.admin.createProjectDesc": { sv: "Klicka på 'Hantera projekt' i menyn. Skapa ett nytt projekt med ett namn – en unik inbjudningskod genereras automatiskt.", en: "Click 'Manage Projects' in the menu. Create a new project with a name – a unique invite code is generated automatically." },
  "help.admin.inviteWorkers": { sv: "Bjud in arbetare", en: "Invite workers" },
  "help.admin.inviteWorkersDesc": { sv: "Dela projektets inbjudningskod med dina arbetare. De anger koden under 'Gå med i projekt' för att ansluta sig.", en: "Share the project's invite code with your workers. They enter the code under 'Join project' to connect." },
  "help.admin.uploadPlan": { sv: "Ladda upp riskanalys-karta", en: "Upload risk analysis map" },
  "help.admin.uploadPlanDesc": { sv: "Välj ett projekt och klicka 'Ladda upp' på riskanalys-kartan. Ladda upp en bild av arbetsplatsen – rapporterade risker visas sedan som markeringar på kartan.", en: "Select a project and click 'Upload' on the risk analysis map. Upload an image of the workplace – reported risks will then show as markers on the map." },
  "help.admin.manageReports": { sv: "Hantera rapporter", en: "Manage reports" },
  "help.admin.manageReportsDesc": { sv: "Granska inkomna rapporter, ändra status (öppen/åtgärdad), justera risknivå manuellt eller låt AI ombedöma. Kommentera för att kommunicera med rapportören.", en: "Review incoming reports, change status (open/resolved), adjust risk level manually or let AI reassess. Comment to communicate with the reporter." },
  "help.admin.statistics": { sv: "Följ statistik", en: "Track statistics" },
  "help.admin.statisticsDesc": { sv: "Under fliken Statistik ser du åtgärdsgrad, rapporter över tid, fördelning per kategori och risknivå. Välj tidsperiod från 7 dagar upp till all tid.", en: "Under the Statistics tab you'll see resolution rate, reports over time, distribution by category and risk level. Choose time period from 7 days up to all time." },
  "help.admin.generateReports": { sv: "Generera rapporter & dokument", en: "Generate reports & documents" },
  "help.admin.generateReportsDesc": { sv: "Klicka 'Rapporter' för att generera månads-, kvartals- eller årsrapporter med AI. Spara dem som dokument under Dokument-fliken för framtida referens.", en: "Click 'Reports' to generate monthly, quarterly or yearly reports with AI. Save them as documents under the Documents tab for future reference." },
  "help.admin.translate": { sv: "Översätt rapporter", en: "Translate reports" },
  "help.admin.translateDesc": { sv: "Öppna en rapport och klicka 'Översätt' för att översätta titel, beskrivning och AI-bedömning till engelska eller svenska.", en: "Open a report and click 'Translate' to translate title, description and AI assessment to English or Swedish." },

  // Worker help steps
  "help.worker.joinProject": { sv: "Gå med i ett projekt", en: "Join a project" },
  "help.worker.joinProjectDesc": { sv: "Klicka 'Gå med i projekt med kod' och ange inbjudningskoden du fått från din admin. Du ser sedan projektet i listan.", en: "Click 'Join project with code' and enter the invite code you received from your admin. You'll then see the project in the list." },
  "help.worker.createReport": { sv: "Rapportera en risk eller skada", en: "Report a risk or injury" },
  "help.worker.createReportDesc": { sv: "Klicka 'Ny rapport', välj typ (riskobservation eller skadeanmälan), fyll i detaljer och skicka. AI bedömer automatiskt risknivån.", en: "Click 'New Report', choose type (risk observation or injury report), fill in details and submit. AI automatically assesses the risk level." },
  "help.worker.markOnPlan": { sv: "Markera på riskanalys-kartan", en: "Mark on the risk analysis map" },
  "help.worker.markOnPlanDesc": { sv: "När du skapar en rapport kan du markera exakt var risken finns på arbetsplatsens riskanalys-karta genom att klicka på bilden.", en: "When creating a report you can mark exactly where the risk is on the workplace risk analysis map by clicking on the image." },
  "help.worker.viewReports": { sv: "Se och kommentera rapporter", en: "View and comment on reports" },
  "help.worker.viewReportsDesc": { sv: "Klicka på en rapport i listan för att se detaljer, AI-bedömning och föreslagna åtgärder. Lägg till kommentarer för att uppdatera status.", en: "Click on a report in the list to see details, AI assessment and suggested actions. Add comments to update status." },
  "help.worker.translate": { sv: "Översätt rapporter", en: "Translate reports" },
  "help.worker.translateDesc": { sv: "Öppna en rapport och klicka 'Översätt' för att se all text på engelska eller svenska.", en: "Open a report and click 'Translate' to see all text in English or Swedish." },
};

// Categories
export const CATEGORIES_I18N: Record<Language, string[]> = {
  sv: [
    "Halkrisk", "Snubbelrisk", "Fallrisk (höjd)", "Belysning", "Brandsäkerhet",
    "Skyddsutrustning", "Ergonomi", "Kemikalier", "Elektricitet", "Fordon/Truckar",
    "Buller/Vibrationer", "Damm/Partiklar", "Ras/Kollaps", "Klämrisk", "Lyftanordningar/Kranarbete",
    "Arbete i trånga utrymmen", "Heta arbeten (svetsning)", "Ordning & reda", "Bristfällig skyltning",
    "Psykosocial arbetsmiljö", "Övrigt"
  ],
  en: [
    "Slip hazard", "Trip hazard", "Fall risk (height)", "Lighting", "Fire safety",
    "Protective equipment", "Ergonomics", "Chemicals", "Electricity", "Vehicles/Forklifts",
    "Noise/Vibrations", "Dust/Particles", "Collapse risk", "Crush risk", "Lifting equipment/Crane work",
    "Confined spaces", "Hot work (welding)", "Housekeeping", "Inadequate signage",
    "Psychosocial work environment", "Other"
  ],
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
