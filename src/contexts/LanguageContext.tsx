import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'am';
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string | string[];
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.tours': 'Tours',
    'nav.festivals': 'Festivals',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.hotel' : 'Hotel',
    'nav.login': 'Login',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.profile': 'My Profile',
    'nav.logout': 'Logout',
    'nav.culture': 'Culture',
    'nav.foodDrinks': 'Food & Drinks',
    'nav.clothes': 'Clothes',
    'nav.dances': 'Dances',
    'nav.cottages': 'Cottages',
    // Home page
    'home.hero.title': 'Discover the Beauty of Wolaita Zone',
    'home.hero.subtitle': 'Experience authentic Ethiopian culture, breathtaking landscapes, and unforgettable adventures',
    'home.hero.cta': 'Explore Tours',
    'home.features.title': 'Why Choose Wolaita Tours',
    'home.features.authentic': 'Authentic Experiences',
    'home.features.authentic.desc': 'Immerse yourself in genuine Wolaita culture and traditions',
    'home.features.guides': 'Expert Local Guides',
    'home.features.guides.desc': 'Learn from knowledgeable locals who know every hidden gem',
    'home.features.safety': 'Safe & Secure',
    'home.features.safety.desc': 'Your safety is our priority with vetted guides and secure bookings',
    'home.explore.wolaita': 'Explore Wolaita',
    'home.stats.travelers': 'Happy Travelers',
    'home.stats.destinations': 'Tour Destinations',
    'home.stats.guides': 'Expert Guides',
    'home.stats.rating': 'Average Rating',
    'home.feature.title': 'Featured Tours',
    'home.feature.description': 'Discover our most popular experiences',
    'home.mochena.borago.cave': 'Mochena Borago Cave',
    'home.ajora.twin.waterfalls': 'Ajora Twin Waterfalls',
    'home.abune.tekle.haymanot.monastery': 'Abune Tekele Haymanot Monastery',
    'home.view.details': 'View Details',
    'home.view.all.tours': 'View All Tours',
    'home.ready.to.explore': 'Ready to Explore Wolaita Zone?',
    'home.ready.to.explore.desc': 'Join thousands of travelers who have discovered the magic of authentic Wolaitan culture.',
    'home.start.journey': 'Start Your Journey',

    // Tour detail
    'home.tour.mochena.borago.desc': 'Mochena Borago Cave, located on the southwestern slopes of Mount Damota at an elevation of 2,200 meters, is one of the most remarkable prehistoric sites in Ethiopia. Archaeological excavations have revealed complex layers of sediments formed through both natural and human activities, pointing to multiple periods of occupation. Scientific evidence shows that humans sought shelter in this cave during very humid climatic conditions as early as 50,000–70,000 years ago. The name Mochena Borago is believed to have been derived from a man named Borago, who lived in the cave in ancient times. Today, the cave stands as a living testimony to early human history and survival against harsh weather.',
    'home.tour.ajora.desc': 'Ajora Falls, found in the Boloso Bombe district of Wolaita, is the only twin waterfall in Africa and one of the region most spectacular natural wonders. The twin streams, Soke and Ajancho, cascade dramatically into the lush green valleys below. Soke Falls drops over 170 meters while Ajancho Falls plunges more than 210 meters. Located about 56 km northwest of Sodo, Ajora Falls is not just a breathtaking sight but also a symbol of Wolaita rich natural heritage. Visitors can enjoy the scenic beauty, fresh air, and the thundering sound of the twin cascades in harmony with the surrounding forest.',
    'home.tour.monastery.desc': 'Perched at the edge of Mount Damota, the Abune Tekle Haymanot Monastery is both a religious and historical treasure. Built several centuries ago, this monastery continues to attract pilgrims and visitors alike. Within its compound lies a museum dedicated to preserving sacred texts, manuscripts, and religious artifacts, many of which are believed to date back to ancient times. The monastery offers not only spiritual significance but also an opportunity to explore Wolaitas deep-rooted Christian heritage.',
    'tour.overview': 'Overview',
    'tour.homePage': 'Back',
    // Tours
    'tours.title': 'Explore Our Tours',
    'tours.filter.all': 'All Tours',
    'tours.filter.cultural': 'Cultural',
    'tours.filter.adventure': 'Adventure',
    'tours.filter.religious': 'Religious',
    'tours.filter.nature': 'Nature',
    'tours.filter.historical': 'Historical',
    'tours.book': 'Book Now',
    'tours.price': 'Price',
    'tours.duration': 'Duration',
    'tours.participants': 'Max Participants',
    'tours.rating': 'Rating',
    
    // Festivals
    'festivals.title': 'Cultural Festivals',
    'festivals.subtitle': 'Experience the vibrant celebrations of Wolaita culture',
    'festivals.date': 'Date',
    'festivals.location': 'Location',
    'festivals.relatedTours': 'Related Tours',
    
    // Auth
    'auth.login.title': 'Welcome Back',
    'auth.login.subtitle': 'Sign in to your account',
    'auth.register.title': 'Create Account',
    'auth.register.subtitle': 'Join the Wolaita Tours community',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.phone': 'Phone Number',
    'auth.role': 'I am a',
    'auth.role.tourist': 'Tourist',
    'auth.role.agency': 'Tour Agency',
    'auth.submit': 'Submit',
    'auth.switchToLogin': 'Already have an account? Sign in',
    'auth.switchToRegister': 'Don\'t have an account? Sign up',
    
    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.tourist.title': 'Tourist Dashboard',
    'dashboard.agency.title': 'Agency Dashboard',
    'dashboard.admin.title': 'Admin Dashboard',
    'dashboard.bookings': 'My Bookings',
    'dashboard.reviews': 'My Reviews',
    'dashboard.tours.manage': 'Manage Tours',
    'dashboard.analytics': 'Analytics',
    'dashboard.users': 'Users',
    'dashboard.sentiment': 'Sentiment Analysis',
    'dashboard.bookings1':'Booking History',
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Something went wrong',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    
    // Profile
    'profile.title': 'My Profile',
    'profile.personalInfo': 'Personal Information',
    'profile.fullName': 'Full Name',
    'profile.email': 'Email Address',
    'profile.phone': 'Phone Number',
    'profile.gender': 'Gender',
    'profile.nationality': 'Nationality',
    'profile.languages': 'Languages Spoken',
    'profile.dateOfBirth': 'Date of Birth',
    'profile.travelPreferences': 'Travel Preferences',
    'profile.budget': 'Preferred Budget Range',
    'profile.accommodation': 'Accommodation Preference',
    'profile.diet': 'Dietary Requirements',
    'profile.verification': 'Verification Status',
    'profile.passport': 'Passport Information',
    'profile.passportNumber': 'Passport Number',
    'profile.passportExpiry': 'Passport Expiry',
    'profile.verified': 'Verified',
    'profile.notVerified': 'Not Verified',
    'profile.edit': 'Edit Profile',
    'profile.save': 'Save Changes',
    'profile.cancel': 'Cancel',
    'profile.uploadPhoto': 'Upload Photo',
    'profile.changePhoto': 'Change Photo',

    // Hotels
    'hotels.title': 'Places to Stay',
    'hotels.address': 'Address',
    'hotels.phone': 'Phone',
    'hotels.email': 'Email',
    'hotels.webpage': 'Website',
    
    // Hotel names (you can keep these in English or add Amharic versions)
    'hotel.haile': 'Haile Hotel',
    'hotel.lewi': 'Lewi Hotels and Resort',
    'hotel.abebe': 'Abebe Zeleke Hotel',
    'hotel.nega': 'Nega International Hotel',
    'hotel.day': 'Day Star Hotel',
    'hotel.semayat': 'Semayat Hotel',
    // Explore Wolaita
'explore.title': 'Explore Wolaita',
'explore.introTitle': 'Introduction & History',
'explore.introText': `The people of Wolaita have rich history. Wolaita is long known for its more than 50 kings with a title called Kawo under three different dynasties. Wolaita people is a people which has never ever used bartering system, but it's Owen currency called Marccuwa with well advanced financial and commercial system. Wolaitegna (Wolaytato) is the native language of the people. Wolaitas are known for their hospitality, patriotism, a habit of hard working, splendid natural and historical attractions, rich cultural and very warm traditions transcending from music, delicious traditional dishes (cousins), dancing, conflict resolution methods, wavering and so on.

Wolaita situated in the mid highland areas of southern Ethiopia on the escarpment of the Great Rift Valley and the great chained mountains like Damota, Duguna and Koysha. Sodo is the current center of administration and epicenter of the economic and social interaction for many people. Currently, Wolaita is located in the southern part of Ethiopia with in the area of about 4,400 square kilometers.`,
'explore.tourGuide.title': 'Wolaita Tour Guide',
'explore.tourGuide.air': 'Traveling by Air',
'explore.tourGuide.airText': `Most major airlines travel from the capital of Ethiopia, Addis Ababa. Domestic flights through Ethiopian airlines can reach you to Arba-minch and then you can use any of road transportation options to reach Wolaita Sodo after travelling 105 km.`,
'explore.tourGuide.road': 'Traveling by Road',
'explore.tourGuide.roadText': `From Addis Ababa different privately owned mini-bus cars are available at any time. While you are traveling through road transportation, there are three options of ways leading to Sodo. The first way is 330 km long and crosses small town like Butajira, Alaba and then to Wolaita. The second one is 339 km long and crosses Butajira, Hosana and then to Sodo. The last one is 380 km and crosses towns like Mojo, Ziway, Shashemene and then Wolaita.`,
'explore.tourGuide.population': 'Population',
'explore.tourGuide.populationText': `The total population of Wolaita is estimated to be more than 5 million with a density of 385 inhabitants per square km.`,
'explore.tourGuide.weather': 'Weather',
'explore.tourGuide.weatherText': `Wolaita has hot, cold and moderate climatic conditions. The Moderate climatic condition is dominant in most parts of the region including Sodo. The annual average temperature of Wolaita is 15.1° centigrade and the mean annual rainfall ranges from 1200–1300 mm.`,
'explore.tourGuide.language': 'Language',
'explore.tourGuide.languageText': `Wolaita’s language is commonly known as “wolaitatto” and is spoken throughout the zone and outside the zone by about five million people. It is also spoken in south-west Ethiopia. The language belongs to the middle class of the Omotic language family. The neighboring languages are Gamo, Gofa, Dawuro and Konta.`,
'explore.attractionsTitle': 'Tourist Attraction sites of Wolaita',
'explore.attractionsText': 'Before 58,000-70,000 years ago human beings were lived Mochena Borago rock shelter, the hot sprig of Abela chokare, the great fall of Ajora twin falls, the color full forest carbon project, the variety fruit trees, the friendly people, the historic warriors, the new year festival Gitaata, the natural birdage Xoosaa Zanphiya, the singing birds and the beautiful mount Damota. All those diverse qualities are UNFORGETABLE.',
'explore.galleryTitle': 'Gallery of Wolaita Attractions',
'explore.galleryText': 'Take a glimpse at the natural and cultural wonders of Wolaita through this image collection.',

//Culture
'culture.food.title': "Traditional Food & Drinks in Wolaita",
'culture.food.intro': "The cultural food of Wolaita is classified into two: Masuka and Maluwa.",
'culture.food.masuka.title': "Masuka Quma",
'culture.food.masuka.text': "Masuka foods are eaten daily and prepared from local garden resources. They are rich in carbohydrates and provide energy.",
'culture.food.malo.title': "Mal’o Quma",
'culture.food.malo.text': "Malo foods are prepared for holidays, weddings, and celebrations like Gifata. These protein-rich foods include meat, milk, and false banana, once reserved for royalty.",
'culture.beveragesTitle': "Local Beverages of Wolaita",
'culture.beveragesIntro': "Wolaita people prepare two types of beverages: Matoyena (non-alcoholic) and Matoyiya (alcoholic).",
'culture.drinks.nonAlcoholic.title': "Matoyena",
'culture.drinks.nonAlcoholic.text': "Matoyena (non-alcoholic). Which includes Eesa and Kineto.",
'culture.drinks.alcoholic.title': "Matoyiya",
'culture.drinks.alcoholic.text': "Matoyiya includes Parsuwa, Haraqiyaa, and Geshuwa. Tourists can enjoy these traditional drinks.",

//clothes
'culture.clothes.title': "Traditional Clothing",
'culture.clothes.intro': "Wolaita traditional clothes reflect the culture and way of life of its people. Each type holds cultural significance and is worn during specific ceremonies and events.",

'culture.clothes.dungua.title': "Dungua Hadiyaa",
'culture.clothes.dungua.text': "Dungua Hadiyaa, made of black and white fabric, is traditionally worn by men during festivals and major occasions.",

'culture.clothes.seere.title': "Seere Hadiyaa",
'culture.clothes.seere.text': "Seere Hadiyaa is a common daily wear for Wolaita men. Its patterns and colors carry symbolic meaning and community pride.",

'culture.clothes.pattala.title': "Pattaala Hadiyaa",
'culture.clothes.pattala.text': "Pattaala Hadiyaa, typically yellow-colored, is worn by men during cultural festivals and important gatherings.",

'culture.clothes.gomara.title': "Gomara Hadiyaa",
'culture.clothes.gomara.text': "Gomara Hadiyaa is traditional attire for women, often colorful and styled uniquely. It is worn during celebrations and public events.",

'culture.clothes.gutuma.title': "Gutuma Hadiyaa",
'culture.clothes.gutuma.text': "Gutuma Hadiyaa is made from corn husk and holds symbolic value. It represents ancient heritage and is revered during cultural festivals.",

'culture.clothes.cosmetics.title': "Cosmetics and Cultural Accessories",
'culture.clothes.cosmetics.text': "Other cultural items include Bulukuwa, Asara, Xibikuwa, Gixetuwa, Belcca, Sagayuwa, and Migiduwa.",

//Dances

  'culture.dance.title': 'Wolaita Traditional Dance',
  'culture.dance.intro': 'The Wolaita people are known for their energetic and expressive traditional dances, often performed during festivals, weddings, and social gatherings.',

  //cottages

'culture.cottages.title': 'Cottages',
'culture.cottages.intro': 'The people of Wolaita have the ability to build four types of cottage structures. These are:',
'culture.cottages.zuufaa': 'Zuufaa house',
'culture.cottages.dilima': 'Dilima meshuwaa house',
'culture.cottages.gulantta': 'Gulantta house',
'culture.cottages.legamaa': 'Legamaa meshwaa house',

// About page
'about.title': 'About Wolaita Tours',
'about.description': 'We are dedicated to showcasing the rich cultural heritage and natural beauty of Wolaita Zone, Ethiopia.',
'about.missionTitle': 'Our Mission',
'about.missionText': 'To provide authentic, sustainable, and memorable tourism experiences that connect visitors with the vibrant culture, traditions, and landscapes of Wolaita Zone while supporting local communities and preserving our heritage.',
'about.whyChooseUsTitle': 'Why Choose Us',
'about.whyChooseUsItems': [
  'Expert local guides with deep cultural knowledge',
  'Authentic experiences with local communities',
  'Sustainable tourism practices',
  'Multilingual support (English and Amharic)',
  'Safety and security guaranteed'
],
'about.tourismTitle': 'Tourism Growth in Wolaita (2020-2024)',
'about.totalTourists': 'Total Tourists (2020-2024)',
'about.foreignTourists': 'Foreign Tourists (2020-2024)',
'about.localTourists': 'Local Tourists (2020-2024)',
'about.chartTitle': 'Annual Tourist Numbers (Local vs. Foreign)',

// Contact page
'contact.title': 'Contact Us',
'contact.subtitle': 'Get in touch with us to plan your perfect Wolaita Zone adventure',
'contact.formTitle': 'Send us a Message',
'contact.nameLabel': 'Name',
'contact.emailLabel': 'Email',
'contact.messageLabel': 'Message',
'contact.sendButton': 'Send Message',
'contact.infoTitle': 'Contact Information',
'contact.addressLabel': 'Address',
'contact.phoneLabel': 'Phone',
'contact.hoursLabel': 'Business Hours',
'contact.hours.weekdays': 'Monday - Friday: 8:00 AM - 6:00 PM',
'contact.hours.saturday': 'Saturday: 9:00 AM - 4:00 PM',
'contact.hours.sunday': 'Sunday: Closed',
'contact.safetyTitle': 'Safety & Emergency Contacts',
'contact.emergency.police': 'Sodo Police Station',
'contact.emergency.hospital': 'Otona Hospital',
'contact.emergency.clinic': 'Dr. Muluken Clinic',
'contact.emergency.redcross': 'Red Cross Emergency Response',
'contact.emergency.phoneLabel': 'Phone',
'contact.emergency.locationLabel': 'Location',
'contact.emergency.serviceLabel': 'Service',
'contact.emergency.policeLocation': 'Marekato Market',
'contact.emergency.hospitalLocation': 'Otona',
'contact.emergency.clinicLocation': 'Wolaita Guttara',
'contact.emergency.redcrossService': '24/7 Emergency Assistance',

// //contact
// 'contact.title': 'Contact Us',
//     'contact.subtitle': 'Get in touch with us to plan your perfect Wolaita Zone adventure',
//     'contact.formTitle': 'Send us a Message',
//     'contact.nameLabel': 'Name',
//     'contact.emailLabel': 'Email',
//     'contact.messageLabel': 'Message',
//     'contact.sendButton': 'Send Message',
//     'contact.infoTitle': 'Contact Information',
//     'contact.addressLabel': 'Address',
//     'contact.phoneLabel': 'Phone',
//     'contact.hoursLabel': 'Business Hours',
//     'contact.hours.weekdays': 'Monday - Friday: 8:00 AM - 6:00 PM',
//     'contact.hours.saturday': 'Saturday: 9:00 AM - 4:00 PM',
//     'contact.hours.sunday': 'Sunday: Closed',
//     'contact.safetyTitle': 'Safety & Emergency Contacts',
//     'contact.emergency.police': 'Sodo Police Station',
//     'contact.emergency.hospital': 'Otona Hospital',
//     'contact.emergency.clinic': 'Dr. Muluken Clinic',
//     'contact.emergency.redcross': 'Red Cross Emergency Response',
//     'contact.emergency.phoneLabel': 'Phone',
//     'contact.emergency.locationLabel': 'Location',
//     'contact.emergency.serviceLabel': 'Service',
//     'contact.emergency.policeLocation': 'Marekato Market',
//     'contact.emergency.hospitalLocation': 'Otona',
//     'contact.emergency.clinicLocation': 'Wolaita Guttara',
//     'contact.emergency.redcrossService': '24/7 Emergency Assistance',

//     // //about
//     // 'about.title': 'About Wolaita Tours',
//     // 'about.description': 'We are dedicated to showcasing the rich cultural heritage and natural beauty of Wolaita Zone, Ethiopia.',
//     // 'about.missionTitle': 'Our Mission',
//     // 'about.missionText': 'To provide authentic, sustainable, and memorable tourism experiences that connect visitors with the vibrant culture, traditions, and landscapes of Wolaita Zone while supporting local communities and preserving our heritage.',
//     // 'about.whyChooseUsTitle': 'Why Choose Us',
//     // 'about.whyChooseUsItems': [
//     //   'Expert local guides with deep cultural knowledge',
//     //   'Authentic experiences with local communities',
//     //   'Sustainable tourism practices',
//     //   'Multilingual support (English and Amharic)',
//     //   'Safety and security guaranteed'
//     // ],
//     // 'about.tourismTitle': 'Tourism Growth in Wolaita (2020-2024)',
//     // 'about.totalTourists': 'Total Tourists (2020-2024)',
//     // 'about.foreignTourists': 'Foreign Tourists (2020-2024)',
//     // 'about.localTourists': 'Local Tourists (2020-2024)',
//     // 'about.chartTitle': 'Annual Tourist Numbers (Local vs. Foreign)',

// forget password
'auth.forgotPassword.title': 'Reset Your Password',
'auth.forgotPassword.subtitle': 'Enter your email address and we\'ll send you a link to reset your password.',
'auth.forgotPassword.sendResetLink': 'Send Reset Link',
'auth.forgotPassword.backToLogin': 'Back to Login',
'auth.forgotPassword.success': 'Password reset email sent! Check your inbox for further instructions.',
'auth.forgotPassword.error': 'Failed to send reset email. Please try again.',
'auth.forgotPassword.userNotFound': 'No account found with this email address.',
'auth.forgotPassword.invalidEmail': 'Please enter a valid email address.',
'auth.forgotPassword.tooManyRequests': 'Too many attempts. Please try again later.',
'auth.forgotPassword.networkError': 'Network error. Please check your internet connection.',
'auth.forgotPassword.link': 'Forgot your password?',
'auth.email1': 'Email Address',
'auth.emailPlaceholder': 'Enter your email',
'auth.submits': 'Submit',
'auth.validation.emailRequired': 'Email is required',
'auth.validation.invalidEmail': 'Invalid email address',
'common.loading2': 'Loading...',
'common.success': 'Success!',
'common.error3': 'Error!',

},
  am: {
    // Navigation
    'nav.home': 'ቤት',
    'nav.tours': 'ጉዞዎች',
    'nav.festivals': 'በዓላት',
    'nav.about': 'ስለ እኛ',
    'nav.contact': 'አግኙን',
    'nav.hotel' : "ሆቴሎች",
    'nav.login': 'ግባ',
    'nav.register': 'ተመዝገብ',
    'nav.dashboard': 'ዳሽቦርድ',
    'nav.profile': 'የእኔ መገለጫ',
    'nav.logout': 'ውጣ',
    'nav.culture': 'ባህላዊ ቅርፃዎች',
    'nav.foodDrinks': 'ምግብና መጠጥ',
    'nav.clothes': 'አልባሳት',
    'nav.dances': 'የዳንስ ቅርፃዎች',
    'nav.cottages': 'ጎጆዎች',
    
    // Home page
    'home.hero.title': 'የወላይታ ዞን ውበት ያግኙ',
    'home.hero.subtitle': 'ወላይታ ዞን የሚገኙ ጥንታዊ የኢትዮጵያ ባህል፣ የሚያስደንቅ የተፈጥሮ ገጽታ እና ከመዘንጋት የማይቻል ጀብዱ',
    'home.hero.cta': 'ጉዞዎችን ቃኝ',
    'home.features.title': 'ለምንድነው የወላይታ ጉዞዎችን መምረጥ',
    'home.features.authentic': 'እውነተኛ ተሞክሮዎች',
    'home.features.authentic.desc': 'በእውነተኛ የወላይታ ባህል እና ወጎች ውስጥ ተጠምቀዋል',
    'home.features.guides': 'ባለሙያ የአካባቢ መሪዎች',
    'home.features.guides.desc': 'በተደበቀ ታሪክ እና መሪ ክስ ካላቸው ከአካባቢ ነዋሪዎች ይማሩ',
    'home.features.safety': 'ደህንነት ያለው',
    'home.features.safety.desc': 'ደህንነትዎ በተረጋገጡ መሪዎች እና የተጠበቀ የማስያዝ ሲስተም የእኛ ቅድሚያ ነው',
    'home.explore.wolaita': 'ወላይታን ያስሱ',
    'home.stats.travelers': 'ደስ ያሉ ተጓዦች',
    'home.stats.destinations': 'የጉዞ መዳረሻዎች',
    'home.stats.guides': 'ባለሙያ መሪዎች',
    'home.stats.rating': 'አማካኝ ደረጃ',
    'home.feature.title': 'የተለዩ ጉዞዎች',
    'home.feature.description': 'በጣም ተወዳጅ የሆኑትን ተሞክሮዎቻችንን ያግኙ',
    'home.mochena.borago.cave': 'ሞቼና ቦራጎ ዋሻ',
    'home.ajora.twin.waterfalls': 'አጆራ እጥፍ ፏፏቴ',
    'home.abune.tekle.haymanot.monastery': 'አቡነ ተክለ ሃይማኖት ገዳም',
    'home.view.details': 'ዝርዝሮችን ይመልከቱ',
    'home.view.all.tours': 'ሁሉንም ጉዞዎች ይመልከቱ',
    'home.ready.to.explore': 'ወላይታ ዞን ለመጎብኘት ዝግጁ ነዎት?',
    'home.ready.to.explore.desc': 'በሺዎች የሚቆጠሩ ተጓዦች ይቀላቀሉ፥ እነዚህም የወላይታን ልዩ እና አስደናቂ ባህል አውቀዋል።',
    'home.start.journey': 'ጉዞዎን ይጀምሩ',
    
    // Tour detail
    'home.tour.mochena.borago.desc': 'ሞቼና ቦራጎ ዋሻ በደሞታ ተራራ ሰሜን ምዕራብ ተዳፋት ላይ በ2,200 ሜትር ቁመት የምትገኝ ከኢትዮጵያ በጣም አስደናቂ የሆኑት ቅድመ ታሪካዊ ቦታዎች አንዷ ናት። የእርሻ ቦታ መፈናቀል ውስብስብ የሆኑ ንጣፎችን አሳይቷል፣ እነዚህም በተፈጥሮ እና በሰው ልጅ ተግባራት ተፈጥረዋል፣ ይህም ደግሞ በርካታ የስራ ጊዜያት እንዳሉ ያሳያል። ሳይንሳዊ ማስረጃዎች እንደሚያሳዩት ሰዎች በ50,000-70,000 ዓመታት በፊት በጣም እርጥበት ያለው የአየር ሁኔታ ወቅት በዚህ ዋሻ ውስጥ መጠገን እንደነበረው ያሳያል። ሞቼና ቦራጎ የሚለው ስም በጥንት ጊዜ በዋሻው ውስጥ የኖረው ቦራጎ የተባለ ሰው ከመጣ እንደሆነ ይታስባል። ዛሬ ዋሻው የመጀመሪያ የሰው ልጅ ታሪክ እና በከፍተኛ የአየር ሁኔታ ላይ ለመትረፍ የታገለ ሕያው ምስክርነት ነው።',
    'home.tour.ajora.desc': 'አጆራ ፏፏቴ በወላይታ ቦሎሶ ቦምቤ ወረዳ ውስጥ ትገኛለች፣ እሷም በአፍሪካ ውስጥ ብቸኛዋ እጥፍ ፏፏቴ እና ከክልሉ በጣም አስደናቂ የተፈጥሮ ድንቅ አንዷ ናት። ሁለቱ ወንዞች፣ ሶኬ እና አጃንቾ፣ በከባድ ሁኔታ ወደ ታች ወዳሉት አረንጓዴ ሸለቆዎች ይፈስሳሉ። የሶኬ ፏፏቴ ከ170 ሜትር በላይ ይወርዳል እና የአጃንቾ ፏፏቴ ከ210 ሜትር በላይ ይወርዳል። ከሶዶ በሰሜን ምዕራብ ከ56 ኪሎ ሜትር ያህል ርቃ ትገኛለች፣ አጆራ ፏፏቴ የምትገኘው አስደናቂ እይታ ብቻ ሳትሆን የወላይታ ባለጠጋ የተፈጥሮ ቅርስ ምልክትም ናት። እንግዶች የተፈጥሮ ውበት፣ ንፁህ አየር እና የሁለቱ ፏፏቴዎች ከዙሪያቸው ደን ጋር በሚጣጣም ሁኔታ የሚያሰማውን ከባድ ድምፅ ማጣቀር ይችላሉ።',
    'home.tour.monastery.desc': 'በደሞታ ተራራ ጫፍ ላይ የሚገኘው የአቡነ ተክለ ሃይማኖት ገዳም የሃይማኖት እና የታሪክ ጸጋ ነው። ከብዙ መቶ ዓመታት በፊት የተገነባ ይህ ገዳም እስከ አሁን ድረስ ሃይማኖተኞችን እና እንግዶችን ይጋብዛል። በክፍለ ከተማው ውስጥ የተቀደሱ ጽሑፎችን፣ እጅ ጽሑፎችን እና የሃይማኖት አንተካከሎችን ለመጠበቅ የተዘጋጀ ሙዚየም ይገኛል፣ እነዚህም ብዙዎቹ ወደ ጥንታዊ ጊዜያት እንደሚመለሱ ይታሰባል። ገዳሙ የመንፈሳዊ ጠቀሜታ ብቻ ሳይሆን የወላይታን ጥልቅ የክርስትና ቅርስ ለመጠንቀቅ ዕድል ይሰጣል።',
    'tour.overview': 'ግምገማ',
    'tour.homePage': 'ወደ ኋላ',
    
    // Tours
    'tours.title': 'ጉዞዎቻችንን ይክዩ',
    'tours.filter.all': 'ሁሉም ጉዞዎች',
    'tours.filter.cultural': 'ባህላዊ',
    'tours.filter.adventure': 'ጀብዱ',
    'tours.filter.religious': 'ሃይማኖታዊ',
    'tours.filter.nature': 'ተፈጥሮ',
    'tours.filter.historical': 'ታሪካዊ',
    'tours.book': 'አሁን ማስያዝ',
    'tours.price': 'ዋጋ',
    'tours.duration': 'የሚቆይበት ጊዜ',
    'tours.participants': 'ከፍተኛ ተሳታፊዎች',
    'tours.rating': 'ደረጃ',
    
    // Festivals
    'festivals.title': 'ባህላዊ በዓላት',
    'festivals.subtitle': 'የወላይታ ባህል ደማ ጎ እና መዝናናት ይገኛሉ',
    'festivals.date': 'ቀን',
    'festivals.location': 'ቦታ',
    'festivals.relatedTours': 'ተመሳሳይ ጉዞዎች',
    
    // Auth
    'auth.login.title': 'እንኳን ደህና መጡ',
    'auth.login.subtitle': 'ወደ መለያዎ ይግቡ',
    'auth.register.title': 'መለያ ይፍጠሩ',
    'auth.register.subtitle': 'የወላይታ ጉዞዎች ማህበረሰብ ይቀላቀሉ',
    'auth.email': 'ኢሜይል',
    'auth.password': 'የይለፍ ቃል',
    'auth.name': 'ሙሉ ስም',
    'auth.phone': 'ስልክ ቁጥር',
    'auth.role': 'እኔ',
    'auth.role.tourist': 'ቱሪስት',
    'auth.role.agency': 'የጉዞ ኤጀንሲ',
    'auth.submit': 'ማስገባት',
    'auth.switchToLogin': 'መለያ አለዎት? ይግቡ',
    'auth.switchToRegister': 'መለያ የለዎትም? ይመዝገቡ',
    
    // Dashboard
    'dashboard.welcome': 'እንኳን ደህና መጡ',
    'dashboard.tourist.title': 'የቱሪስት ዳሽቦርድ',
    'dashboard.agency.title': 'የኤጀንሲ ዳሽቦርድ',
    'dashboard.admin.title': 'የአዳሪ ዳሽቦርድ',
    'dashboard.bookings': 'የእኔ ማስያዝ',
    'dashboard.reviews': 'የእኔ ግምገማዎች',
    'dashboard.tours.manage': 'ጉዞዎችን አስተዳድር',
    'dashboard.analytics': 'ትንተና',
    'dashboard.users': 'ተጠቃሚዎች',
    'dashboard.sentiment': 'የስሜት ትንተና',
    'dashboard.bookings1': 'የተያዘ ታሪክ',
    // Common
    'common.loading': 'በመጫን ላይ...',
    'common.error': 'ስህተት ተከሰተ',
    'common.save': 'ማስቀመጥ',
    'common.cancel': 'ይቅር',
    'common.delete': 'ስረዛ',
    'common.edit': 'ማስተካከል',
    'common.view': 'ይመልከቱ',
    'common.search': 'ፈልግ',
    'common.filter': 'አጣራ',
    'common.sort': 'ደርድር',
    
    // Profile
    'profile.title': 'የእኔ መገለጫ',
    'profile.personalInfo': 'የግል መረጃ',
    'profile.fullName': 'ሙሉ ስም',
    'profile.email': 'ኢሜይል አድራሻ',
    'profile.phone': 'ስልክ ቁጥር',
    'profile.gender': 'ጾታ',
    'profile.nationality': 'ዜግነት',
    'profile.languages': 'የሚናገሩት ቋንቋዎች',
    'profile.dateOfBirth': 'የተወለዱበት ቀን',
    'profile.travelPreferences': 'የጉዞ ምርጫዎች',
    'profile.budget': 'የተመረጠ የበጀት ክልል',
    'profile.accommodation': 'የማረፊያ ምርጫ',
    'profile.diet': 'የአመጋገብ መስፈርቶች',
    'profile.verification': 'የማረጋገጫ ሁኔታ',
    'profile.passport': 'የፓስፖርት መረጃ',
    'profile.passportNumber': 'የፓስፖርት ቁጥር',
    'profile.passportExpiry': 'የፓስፖርት ማብቂያ',
    'profile.verified': 'ተረጋግጧል',
    'profile.notVerified': 'አልተረጋገጠም',
    'profile.edit': 'መገለጫ አርትዕ',
    'profile.save': 'ለውጦችን አስቀምጥ',
    'profile.cancel': 'ይቅር',
    'profile.uploadPhoto': 'ፎቶ ይስቀሉ',
    'profile.changePhoto': 'ፎቶ ይቀይሩ',

    // Hotels
    'hotels.title': 'ለመቆየት ቦታዎች',
    'hotels.address': 'አድራሻ',
    'hotels.phone': 'ስልክ',
    'hotels.email': 'ኢሜይል',
    'hotels.webpage': 'ድረ-ገጽ',
    
    // Hotel names in Amharic
    'hotel.haile': 'ሀይል ሆቴል',
    'hotel.lewi': 'ሌዊ ሆቴል እና ሬሶርት',
    'hotel.abebe': 'አበበ ዘለቀ ሆቴል',
    'hotel.nega': 'ነጋ ኢንተርናሽናል ሆቴል',
    'hotel.day': 'ደይ ስታር ሆቴል',
    'hotel.semayat': 'ሰማያት ሆቴል',

    // Explore Wolaita
'explore.title': 'ወላይታን ያስሱ',
'explore.introTitle': 'መግቢያ እና ታሪክ',
'explore.introText': `የወላይታ ሕዝብ በባህላቸው ታሪክ በጣም ዐቃቂ ናቸው። ወላይታ በሶስት በተለያዩ የመንግሥት ዘመናት ስር የተጠራ ከ 50 በላይ ነበሩ ነገሥታት (ካዎ) ያካትታል። የወላይታ ሕዝብ የማያጠቀመው ለውጭ ንግድ ሲሆን የራሳቸው ምንዛሬ የሚባል Marccuwa ነበረባቸው እና በገንዘባዊ እና ንግዳዊ ስርዓት የተገናኘ ነበር። የወላይታ ቋንቋ የተባለው የተፈለገው “ወላይታቶ (ወላይታንኛ)” ነው። የወላይታ ሕዝብ ከፍተኛ እና እውነተኛ እንኳን በደህና መጡ በማለት የሚታወቁ ሲሆን፣ በጥራት የተሟላ የባህል እና ታሪካዊ መሳሪያዎች፣ ሙዚቃ፣ የባህላዊ ምግቦች፣ የቤተሰብ አካላት (አጎት አባት)፣ ዳንስ፣ የግጭት መፍትሔ ዘዴዎች እና ሌሎች የባህል ዓይነቶች በብዛት ናቸው።

ወላይታ በደቡብ ኢትዮጵያ በመካከለኛ ተራራማ አካባቢ በአስደናቂው የሪፍት ቫሊ ጐዳና ላይ በአንዱ ቀኝ አንዱ ግራ ባሉት ተራሮች እንደ Damota, Duguna እና Koysha የተለያዩ የተፈጥሮ መስክ ያለው ነው። ሶዶ የአሁኑ አስተዳደር እና ኢኮኖሚና ማህበራዊ ተውላጅነት ማዕከል ነው። አሁን ወላይታ በደቡብ ኢትዮጵያ አካባቢ ውስጥ በ 4,400 ኪ.ሜ. መሬት ይገኛል።`,
'explore.tourGuide.title': 'የወላይታ መጓጓዣ መመሪያ',
'explore.tourGuide.air': 'በአየር መጓጓዣ',
'explore.tourGuide.airText': `ከኢትዮጵያ ዋና ከተማ አዲስ አበባ በኩል አብዛኛው የአየር መንገድ የሚጓዝ ነው። የኢትዮጵያ አየር መንገድ በተደጋጋሚ ወደ አርባ ምንጭ ይደርሳሉ ከዚያ ወደ ወላይታ ሶዶ በ105 ኪሜ መንገድ መጓጓዣ ተቀባይነት አለው።`,
'explore.tourGuide.road': 'በመሬት መጓጓዣ',
'explore.tourGuide.roadText': `ከአዲስ አበባ የበግል ባለቤት የሆኑ ሚኒ-ባስ መኪናዎች በማንኛውም ጊዜ ዝግጁ ናቸው። በመሬት መንገድ መጓጓዣ ሲሆን፣ ወደ ሶዶ የሚወስዱ ሶስት መንገዶች አሉ። የመጀመሪያው መንገድ 330 ኪሜ ርዝመት አለው እና ቡታጅራ፣ አላባን እና ወላይታን ይሻገራል። ሁለተኛው 339 ኪሜ ነው እና ቡታጅራ፣ ሆሳናን ይሻገራል። የመጨረሻው ደግሞ 380 ኪሜ ነው እና ሞጆ፣ ዝዋይ፣ ሻሸመኔን ይያዛል።`,
'explore.tourGuide.population': 'ህዝብ',
'explore.tourGuide.populationText': `የወላይታ አጠቃላይ ህዝብ ከ 5 ሚሊዮን በላይ መሆኑ ተገመተ። በአንድ ኪ.ሜ. ላይ የሚገኙ ህዝቦች ከ 385 በላይ ናቸው።`,
'explore.tourGuide.weather': 'አየር ንብረት',
'explore.tourGuide.weatherText': `ወላይታ ከባድ፣ ቀዝቃዛ እና መካከለኛ የአየር ንብረቶችን አሳይታለች። በአካባቢው ብዙውን ጊዜ መካከለኛው አየር ንብረት ይበዛል። የአመቱ አማካይ የወቅት ደረጃ 15.1° ሴንቲ ግሬድ ነው፣ የዓመቱ አማካይ ዝናብ 1200–1300 ሚሜ ነው።`,
'explore.tourGuide.language': 'ቋንቋ',
'explore.tourGuide.languageText': `የወላይታ ቋንቋ “ወላይታቶ” ተብሎ ይታወቃል እና በዞኑ ውስጥና ውጪ በአንድ 5 ሚሊዮን ሰዎች ይናገራል። እንዲሁም በደቡብ ምዕራብ ኢትዮጵያም ይነገራል። የቋንቋው መነሻ በኦሞቲክ ቋንቋ ቤተሰብ መካከለኛ ደረጃ ውስጥ ነው። የቅርብ የሆኑ ቋንቋዎች ጋሞ፣ ጎፋ፣ ዳውሮ እና ኮንታ ናቸው።`,
'explore.attractionsTitle': 'የቱሪስቶች መሳብ ቦታዎች',
'explore.attractionsText': '58,000 እስከ 70,000 ዓመታት በፊት ሰዎች በሞቸና ቦራጎ የድንጋይ መጠለያ ውስጥ ይኖሩ ነበር። የአቤላ ጮካሬ እሳት ዝናብ ፣ አጆራ ባለባትና እጅግ ከፍተኛ ግድብ፣ በቀለም የተሞላው የዱር ካርቦን ፕሮጀክት፣ የፍሬ ዛፎች በዝሃ፣ አመራሮችና ታሪካዊ አባቶች፣ የአዲስ አመት በዓል (ጊታታ)፣ የወፎች መኖሪያ ቦታ ዞሳ ዛንፊያ፣ የሚዘምሩ ወፎችና ቆንጆ ደሞታ ተራራ ፣ እነዚህ ሁሉ የተለያዩ ባህላዊና ተፈጥሯዊ ባህላዊ ባህላት ማስታወሻ የማይረሱ ናቸው።',
'explore.galleryTitle': 'የወላይታ መሳብ ቦታዎች ማዕድ',
'explore.galleryText': 'የወላይታን ተፈጥሯዊና ባህላዊ ድንቅ ነገሮች በዚህ የምስል ስብስብ ውስጥ ይመልከቱ።',

//Culture

'culture.food.title': "የባህላዊ ምግብ እና መጠጦች",
'culture.food.intro': "የወላይታ ባህላዊ ምግቦች ወደ ሁለት ክፍል ተከፍለዋል፡ ማሱካ እና ማሉዋ።",
'culture.food.masuka.title': "ማሱካ ቁማ",
'culture.food.masuka.text': "ማሱካ ምግቦች በየቀኑ የሚበሉ ምግቦች ናቸው። ከቤት ውስጥ ተተክለው የሚመሩ ነዋሪ ምርቶች ነቃቂ እና ኃይል የሚሰጡ ነው።",
'culture.food.malo.title': "ማሉዋ ቁማ",
'culture.food.malo.text': "ማሉዋ ምግቦች በበዓሎች፣ ሰርሞኒያዎች፣ ግብረመና እና ጊፋታ እንደሚባሉት በዓላት ላይ የሚበሉ ናቸው። በተለይ በአራሶች ላይ የሚያቀርቡ የፕሮቲን ባህሪ ካላቸው ሥጋ፣ ወተት እና ከኖ የሚሰሩ ናቸው።",
'culture.beveragesTitle': "የወላይታ ባህላዊ መጠጦች",
'culture.beveragesIntro': "የወላይታ ህዝብ መቶዬና (ያልሚያመሰጡ) እና መቶይያ (የሚያመሰጡ) መጠጦችን ያዘጋጃሉ።",
'culture.drinks.nonAlcoholic.title': "መቶዬና",
'culture.drinks.nonAlcoholic.text': "የወላይታ ህዝብ መቶዬና (ያልሚያመሰጡ)። መቶዬና ኢሳ እና ኪኔቶን ያካትታል።",
'culture.drinks.alcoholic.title': "መቶይያ",
'culture.drinks.alcoholic.text': "መቶይያ ፓርሱዋ፣ ሀራቂያና ጌሹዋን ያካትታል። ቱሪስቶች ይህንን የባህል መጠጥ መውደድ ይችላሉ።",

//clothes
'culture.clothes.title': "የባህላዊ አልባሳት",
'culture.clothes.intro': "የወላይታ አልባሳት የህዝቡ ባህልን እና ህይወት መንገድን የሚያሳዩ ናቸው። እያንዳንዱ የልብስ አይነት በተለያዩ የባህል አገልግሎቶች እና በዓላት ውስጥ ስለተጠቀሙ የበለጠ አስፈላጊነት አለው።",

'culture.clothes.dungua.title': "ዱንጓ ሀድያ",
'culture.clothes.dungua.text': "ዱንጓ ሀድያ በሚታወቀው ጥቁር እና ነጭ ቀለም ተሠርቶ ሲለብስ በዋናነት ወንዶች በዓላት ላይ ይነሳል።",

'culture.clothes.seere.title': "ሴሬ ሀድያ",
'culture.clothes.seere.text': "ሴሬ ሀድያ በአብዛኛው ወንዶች በመደበኛ ቀናት ላይ የሚለብሱ ልብስ ሲሆን ስፋት ያለው እና ቀለማት የተለያዩ ትርጉም አላቸው።",

'culture.clothes.pattala.title': "ፓታላ ሀድያ",
'culture.clothes.pattala.text': "ፓታላ ሀድያ በእንቁላል ቀለም የተሠራ የወንዶች ዓይነት ልብስ ሲሆን በበዓላት እና ከባድ ትዕይንቶች ላይ ይለበሳል።",

'culture.clothes.gomara.title': "ጎማራ ሀድያ",
'culture.clothes.gomara.text': "ጎማራ ሀድያ የሴቶች ልብስ ሲሆን በተለያዩ ቀለማት እና ስነልቦና ይለያያል። በዓላት እና በልዩ ዝግጅቶች ላይ ይታያል።",

'culture.clothes.gutuma.title': "ጉቱማ ሀድያ",
'culture.clothes.gutuma.text': "ጉቱማ ሀድያ የበቆሎ ቁሳቁስ የተሰራ አልባስ ሲሆን በታላቁ የባህል ቅርስ መካከል ይገኛል። የማንኛውም የባህል ምልክት የሆነ ይዘት አለው።",

'culture.clothes.cosmetics.title': "የውበት እቃዎች እና ባህላዊ አልባሳት",
'culture.clothes.cosmetics.text': "እነዚህ የባህላዊ እቃዎች የሚካቱት፡ ቡሉኩዋ፣ አሳራ፣ ጽቢኩዋ፣ ግጸቱዋ፣ በልካ፣ ሳጋዩዋ፣ ሚጊዱዋ ናቸው።",

//cottages

'culture.cottages.title': 'ጎጆዎች',
'culture.cottages.intro': 'የወላይታ ሕዝብ አራት አይነት የጎጆ መዋቅሮችን ማንበር ይችላሉ፡፡ እነዚህም፡፡',
'culture.cottages.zuufaa': 'ዙፋ ቤት',
'culture.cottages.dilima': 'ዲሊማ መሹዋ ቤት',
'culture.cottages.gulantta': 'ጉላንታ ቤት',
'culture.cottages.legamaa': 'ሌጋማ መሹዋ ቤት',

//Dances

  'culture.dance.title': 'የወላይታ ባህላዊ ዳንስ',
  'culture.dance.intro': 'የወላይታ ሕዝብ ከንቱና ምቹ ባህላዊ ዳንሶች ያላቸው በበዓላት፣ በሰርስሮችና በማኅበራዊ መንክሮች የሚከናወኑ ናቸው።',

  // About page
  'about.title': 'ስለ ወላይታ ቱርስ',
  'about.description': 'የኢትዮጵያ ወላይታ ዞን የባህል ቅርሶች እና ተፈጥሯዊ ውበት ለማሳየት ቁርጠኛ ነን።',
  'about.missionTitle': 'ተልእኳችን',
  'about.missionText': 'ከአካባቢው ማህበረሰብ ጋር በመተባበር የባህላችንን ስርዓት ለመጠበቅ ሲቻል እንዲሁም የወላይታ ዞን ተፈጥሯዊ ውበት እና ባህል ለጎብኚዎች ተገኝነት ያለው ቆይታ እንዲኖረው እያሰብን ለጎብኝዎች ዘላቂ፣ አስታዋሽ እና እውነተኛ የቱሪዝም ልምድ እናቀርባለን።',
  'about.whyChooseUsTitle': 'ለምን እኛን መምረጥ ይገባል',
  'about.whyChooseUsItems': [
    'የአካባቢውን ባህል የሚያውቁ ብቃት ያላቸው የአካባቢ መሪዎች',
    'ከአካባቢው ማህበረሰብ ጋር የሚደረጉ እውነተኛ ልምዶች',
    'ዘላቂ የቱሪዝም ልምዶች',
    'ብርቅና ያለው የቋንቋ ድጋፍ (እንግሊዝኛ እና አማርኛ)',
    'ደህንነት እና ጸጥታ የተጠበቀ'
  ],
  'about.tourismTitle': 'በወላይታ የቱሪዝም እድገት (2020-2024)',
  'about.totalTourists': 'ጠቅላላ ጎብኝዎች (2020-2024)',
  'about.foreignTourists': 'የውጭ ጎብኝዎች (2020-2024)',
  'about.localTourists': 'የአገር ውስጥ ጎብኝዎች (2020-2024)',
  'about.chartTitle': 'ዓመታዊ የጎብኝዎች ቁጥር (የአገር ውስጥ እና የውጭ)',
  
  // Contact page
  'contact.title': 'አግኙን',
  'contact.subtitle': 'የሚመቸውን የወላይታ ዞን ጀብዱዎን ለመቅዳት ከእኛ ጋር ያገናኙ',
  'contact.formTitle': 'መልእክት ይላኩልን',
  'contact.nameLabel': 'ስም',
  'contact.emailLabel': 'ኢሜይል',
  'contact.messageLabel': 'መልእክት',
  'contact.sendButton': 'መልእክት ላክ',
  'contact.infoTitle': 'የመገኛ መረጃ',
  'contact.addressLabel': 'አድራሻ',
  'contact.phoneLabel': 'ስልክ',
  'contact.hoursLabel': 'የስራ ሰዓት',
  'contact.hours.weekdays': 'ሰኞ - አርብ: 8:00 ጥዋት - 6:00 ምሽት',
  'contact.hours.saturday': 'ቅዳሜ: 9:00 ጥዋት - 4:00 ምሽት',
  'contact.hours.sunday': 'እሁድ: ዝግ',
  'contact.safetyTitle': 'ደህንነት እና አደጋ ላይ የመጠቀሚያ ስልኮች',
  'contact.emergency.police': 'ሶዶ ፖሊስ ጣቢያ',
  'contact.emergency.hospital': 'ኦቶና ሆስፒታል',
  'contact.emergency.clinic': 'ዶ/ር ሙሉከን ክሊኒክ',
  'contact.emergency.redcross': 'ቀይ መስቀል አደጋ አስተናጋጅ',
  'contact.emergency.phoneLabel': 'ስልክ',
  'contact.emergency.locationLabel': 'ቦታ',
  'contact.emergency.serviceLabel': 'አገልግሎት',
  'contact.emergency.policeLocation': 'ማሬካቶ ገበያ',
  'contact.emergency.hospitalLocation': 'ኦቶና',
  'contact.emergency.clinicLocation': 'ወላይታ ጉታራ',
  'contact.emergency.redcrossService': '24/7 አደጋ አስተናጋጅ',


  
// //contact
//     'contact.title': 'አግኙን',
//     'contact.subtitle': 'የሚመቸውን የወላይታ ዞን ጀብዱዎን ለመቅዳት ከእኛ ጋር ያገናኙ',
//     'contact.formTitle': 'መልእክት ይላኩልን',
//     'contact.nameLabel': 'ስም',
//     'contact.emailLabel': 'ኢሜይል',
//     'contact.messageLabel': 'መልእክት',
//     'contact.sendButton': 'መልእክት ላክ',
//     'contact.infoTitle': 'የመገኛ መረጃ',
//     'contact.addressLabel': 'አድራሻ',
//     'contact.phoneLabel': 'ስልክ',
//     'contact.hoursLabel': 'የስራ ሰዓት',
//     'contact.hours.weekdays': 'ሰኞ - አርብ: 8:00 ጥዋት - 6:00 ምሽት',
//     'contact.hours.saturday': 'ቅዳሜ: 9:00 ጥዋት - 4:00 ምሽት',
//     'contact.hours.sunday': 'እሁድ: ዝግ',
//     'contact.safetyTitle': 'ደህንነት እና አደጋ ላይ የመጠቀሚያ ስልኮች',
//     'contact.emergency.police': 'ሶዶ ፖሊስ ጣቢያ',
//     'contact.emergency.hospital': 'ኦቶና ሆስፒታል',
//     'contact.emergency.clinic': 'ዶ/ር ሙሉከን ክሊኒክ',
//     'contact.emergency.redcross': 'ቀይ መስቀል አደጋ አስተናጋጅ',
//     'contact.emergency.phoneLabel': 'ስልክ',
//     'contact.emergency.locationLabel': 'ቦታ',
//     'contact.emergency.serviceLabel': 'አገልግሎት',
//     'contact.emergency.policeLocation': 'ማሬካቶ ገበያ',
//     'contact.emergency.hospitalLocation': 'ኦቶና',
//     'contact.emergency.clinicLocation': 'ወላይታ ጉታራ',
//     'contact.emergency.redcrossService': '24/7 አደጋ አስተናጋጅ',

//     //about
//     'about.title': 'ስለ ወላይታ ቱርስ',
//     'about.description': 'የኢትዮጵያ ወላይታ ዞን የባህል ቅርሶች እና ተፈጥሯዊ ውበት ለማሳየት ቁርጠኛ ነን።',
//     'about.missionTitle': 'ተልእኳችን',
//     'about.missionText': 'ከአካባቢው ማህበረሰብ ጋር በመተባበር የባህላችንን ስርዓት ለመጠበቅ ሲቻል እንዲሁም የወላይታ ዞን ተፈጥሯዊ ውበት እና ባህል ለጎብኚዎች ተገኝነት ያለው ቆይታ እንዲኖረው እያሰብን ለጎብኝዎች ዘላቂ፣ አስታዋሽ እና እውነተኛ የቱሪዝም ልምድ እናቀርባለን።',
//     'about.whyChooseUsTitle': 'ለምን እኛን መምረጥ ይገባል',
//     'about.whyChooseUsItems': [
//       'የአካባቢውን ባህል የሚያውቁ ብቃት ያላቸው የአካባቢ መሪዎች',
//       'ከአካባቢው ማህበረሰብ ጋር የሚደረጉ እውነተኛ ልምዶች',
//       'ዘላቂ የቱሪዝም ልምዶች',
//       'ብርቅና ያለው የቋንቋ ድጋፍ (እንግሊዝኛ እና አማርኛ)',
//       'ደህንነት እና ጸጥታ የተጠበቀ'
//     ],
//     'about.tourismTitle': 'በወላይታ የቱሪዝም እድገት (2020-2024)',
//     'about.totalTourists': 'ጠቅላላ ጎብኝዎች (2020-2024)',
//     'about.foreignTourists': 'የውጭ ጎብኝዎች (2020-2024)',
//     'about.localTourists': 'የአገር ውስጥ ጎብኝዎች (2020-2024)',
//     'about.chartTitle': 'ዓመታዊ የጎብኝዎች ቁጥር (የአገር ውስጥ እና የውጭ)',

//forget password
'auth.forgotPassword.title': 'የይለፍ ቃልዎን ዳግም ያስጀምሩ',
    'auth.forgotPassword.subtitle': 'ኢሜልዎን ያስገቡ እና የይለፍ ቃልዎን ለማስጀመር አገናኝ እንልክሎታለን።',
    'auth.forgotPassword.sendResetLink': 'ዳግም ማስጀመሪያ አገናኝ ይላኩ',
    'auth.forgotPassword.backToLogin': 'ወደ መግቢያ ተመለስ',
    'auth.forgotPassword.success': 'የይለፍ ቃል ዳግም ማስጀመሪያ ኢሜል ተልኳል! ለተጨማሪ መመሪያዎች መግቢያ ሳጥንዎን ያረጋግጡ።',
    'auth.forgotPassword.error': 'ዳግም ማስጀመሪያ ኢሜል ለመላክ አልተቻለም። እባክዎ እንደገና ይሞክሩ።',
    'auth.forgotPassword.userNotFound': 'በዚህ ኢሜል አድራሻ ምንም መለያ አልተገኘም።',
    'auth.forgotPassword.invalidEmail': 'እባክዎ ትክክለኛ ኢሜል አድራሻ ያስገቡ።',
    'auth.forgotPassword.tooManyRequests': 'በጣም ብዙ ሙከራዎች። እባክዎ ቆጣቢ በኋላ ይሞክሩ።',
    'auth.forgotPassword.networkError': 'የኔትወርክ ስህተት። እባክዎ የበይነመረብ ግንኙነትዎን ያረጋግጡ።',
    'auth.forgotPassword.link': 'የይለፍ ቃልዎን ረሱ?',
    'auth.email1': 'ኢሜል አድራሻ',
    'auth.emailPlaceholder': 'ኢሜልዎን ያስገቡ',
    'auth.submits': 'ይላኩ',
    'auth.validation.emailRequired': 'ኢሜል ያስፈልጋል',
    'auth.validation.invalidEmail': 'ትክክለኛ ያልሆነ ኢሜል አድራሻ',
    'common.loading2': 'በመጫን ላይ...',
    'common.success': 'ተሳክቷል!',
    'common.error3': 'ስህተት!'
  }
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const savedLanguage: string | null = localStorage.getItem('language');
    if (typeof savedLanguage === 'string' && (savedLanguage === 'en' || savedLanguage === 'am')) {
      setLanguage(savedLanguage as Language);
    }
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const t = (key: string): string | string[] => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};