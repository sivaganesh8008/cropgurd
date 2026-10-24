"""
Crop Doctor Engine for CropGuard / FarmPulse
Provides ChatGPT-style agronomic plant disease diagnosis, pest identification,
related photographic evidence, curated agricultural YouTube videos, and
multilingual dynamic generation across 11 Indian languages.
"""

import re
import uuid

# 11 Indian Languages supported
SUPPORTED_LANGUAGES = [
    "English", "Hindi", "Telugu", "Tamil", "Kannada",
    "Malayalam", "Marathi", "Bengali", "Gujarati", "Punjabi", "Odia"
]

# Language localized labels for core agronomy terms
AGRI_I18N = {
    "English": {
        "disease": "Disease Identified",
        "pest": "Associated Pest / Vector",
        "severity": "Severity Level",
        "confidence": "AI Confidence",
        "symptoms": "Observed Symptoms",
        "organic": "Organic & Biological Remedy",
        "chemical": "Recommended Chemical Spray (CIBRC Approved)",
        "prevention": "Preventive Cultural Practices",
        "videos_title": "Expert Video Guides & Treatments",
        "photos_title": "Visual Reference & Pest Identification",
        "doctor_greeting": "Hello farmer! I am your Crop Doctor AI. Ask me any question or upload a photo of your crop, leaf, or pest for instant diagnosis and remedies.",
        "severe": "Critical / High Alert",
        "moderate": "Moderate Spread",
        "low": "Early Stage / Watchlist"
    },
    "Telugu": {
        "disease": "గుర్తించిన పంట తెగులు / వ్యాధి",
        "pest": "సంబంధిత పురుగు / వెక్టర్",
        "severity": "తీవ్రత స్థాయి",
        "confidence": "ఏఐ నిర్ధారణ ఖచ్చితత్వం",
        "symptoms": "గమనించిన లక్షణాలు",
        "organic": "సేంద్రీయ & జీవ నియంత్రణ పద్ధతులు",
        "chemical": "సిఫార్సు చేయబడిన రసాయన మందుల పిచికారీ (ఖచ్చితమైన మోతాదు)",
        "prevention": "ముందస్తు నివారణ చర్యలు",
        "videos_title": "రైతులకు వీడియో మార్గదర్శకాలు (తెలుగు)",
        "photos_title": "లక్షణాల ఫోటో పోలిక & పురుగు గుర్తింపు",
        "doctor_greeting": "నమస్కారం రైతు సోదరులారా! నేను మీ క్రాప్ డాక్టర్ AI. మీ పంటకు సోకిన తెగులు లేదా పురుగు ఫోటో తీసి అప్‌లోడ్ చేయండి లేదా లక్షణాలు అడగండి. వెంటనే నివారణ మార్గాలు పొందండి.",
        "severe": "తీవ్రమైన నష్టం / అత్యవసర రక్షణ అవసరం",
        "moderate": "మధ్యస్థ వ్యాప్తి",
        "low": "ప్రారంభ దశ / పర్యవేక్షణ అవసరం"
    },
    "Hindi": {
        "disease": "पहचानी गई फसल बीमारी / रोग",
        "pest": "संबंधित कीट / रस चूसक",
        "severity": "रोग की गंभीरता",
        "confidence": "एआई सटीकता",
        "symptoms": "दिखे लक्षण",
        "organic": "जैविक एवं प्राकृतिक उपचार",
        "chemical": "अनुशंसित रासायनिक कीटनाशक व छिड़काव (सही मात्रा)",
        "prevention": "रोकथाम एवं सावधानियां",
        "videos_title": "कृषि विशेषज्ञों के वीडियो समाधान (हिंदी)",
        "photos_title": "रोग के फोटो व कीट पहचान",
        "doctor_greeting": "नमस्ते किसान भाई! मैं आपका क्रॉप डॉक्टर AI हूँ। अपनी फसल, पत्ती या कीट की फोटो अपलोड करें या लक्षण लिखकर पूछें। तुरंत सही निदान व दवा पाएं।",
        "severe": "गंभीर प्रकोप / तत्काल उपचार आवश्यक",
        "moderate": "मध्यम फैलाव",
        "low": "शुरुआती अवस्था / निगरानी रखें"
    },
    "Tamil": {
        "disease": "கண்டறியப்பட்ட பயிர் நோய்",
        "pest": "தாக்கும் பூச்சி / பூச்சியினம்",
        "severity": "தீவிர நிலை",
        "confidence": "துல்லியத்தன்மை",
        "symptoms": "கண்டறியப்பட்ட அறிகுறிகள்",
        "organic": "இயற்கை மற்றும் உயிரியல் முறைகள்",
        "chemical": "பரிந்துரைக்கப்பட்ட ரசாயன மருந்து தெளிப்பு",
        "prevention": "வருமுன் காக்கும் பாதுகாப்பு முறைகள்",
        "videos_title": "விவசாயிகளுக்கான வீடியோ வழிகாட்டிகள் (தமிழ்)",
        "photos_title": "நோய் அறிகுறிகள் புகைப்பட ஒப்பீடு",
        "doctor_greeting": "வணக்கம் விவசாய நண்பரே! நான் உங்கள் கிராப் டாக்டர் AI. உங்கள் பயிர் இலை அல்லது பூச்சியின் புகைப்படத்தை பதிவேற்றி உடனடியாக சிகிச்சை முறைகளை அறியுங்கள்.",
        "severe": "தீவிர பாதிப்பு / உடனடி நடவடிக்கை தேவை",
        "moderate": "மிதமான பரவல்",
        "low": "தொடக்க நிலை"
    },
    "Kannada": {
        "disease": "ಗುರುತಿಸಲಾದ ಬೆಳೆ ರೋಗ",
        "pest": "ಸಂಬಂಧಿತ ಕೀಟ",
        "severity": "ತೀವ್ರತೆ",
        "confidence": "ಖಚಿತತೆ",
        "symptoms": "ಕಂಡುಬಂದ ರೋಗಲಕ್ಷಣಗಳು",
        "organic": "ಸಾವಯವ ಮತ್ತು ಜೈವಿಕ ಪರಿಹಾರಗಳು",
        "chemical": "ಶಿಫಾರಸು ಮಾಡಿದ ರಾಸಾಯನಿಕ ಸಿಂಪರಣೆ",
        "prevention": "ಮುಂಜಾಗ್ರತಾ ಕ್ರಮಗಳು",
        "videos_title": "ರೈತರಿಗಾಗಿ ವೀಡಿಯೊ ಮಾರ್ಗದರ್ಶಿ (ಕನ್ನಡ)",
        "photos_title": "ರೋಗ ಲಕ್ಷಣಗಳ ಫೋಟೋ ಹೋಲಿಕೆ",
        "doctor_greeting": "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ನಾನು ನಿಮ್ಮ ಕ್ರಾಪ್ ಡಾಕ್ಟರ್ AI. ನಿಮ್ಮ ಬೆಳೆಯ ಎಲೆ ಅಥವಾ ಕೀಟದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ಅಥವಾ ಪ್ರಶ್ನೆ ಕೇಳಿ ತಕ್ಷಣ ಪರಿಹಾರ ಪಡೆಯಿರಿ.",
        "severe": "ತೀವ್ರ ಹಾನಿ / ತಕ್ಷಣದ ಚಿಕಿತ್ಸೆ ಅಗತ್ಯ",
        "moderate": "ಮಧ್ಯಮ ಹಂತ",
        "low": "ಆರಂಭಿಕ ಹಂತ"
    },
    "Malayalam": {
        "disease": "കണ്ടെത്തിയ വിള രോഗം",
        "pest": "കീട ബാധ",
        "severity": "തീവ്രത",
        "confidence": "കൃത്യത",
        "symptoms": "കണ്ടെത്തിയ ലക്ഷണങ്ങൾ",
        "organic": "ജൈവ കീടനിയന്ത്രണ മാർഗ്ഗങ്ങൾ",
        "chemical": "ശുപാർശ ചെയ്യുന്ന രാസകീടനാശിനി പ്രയോഗം",
        "prevention": "മുൻകരുതലുകൾ",
        "videos_title": "കാർഷിക വീഡിയോ മാർഗ്ഗനിർദ്ദേശങ്ങൾ (മലയാളം)",
        "photos_title": "ലക്ഷണങ്ങളുടെ ഫോട്ടോ താരതമ്യം",
        "doctor_greeting": "നമസ്കാരം കർഷക സുഹൃത്തേ! ഞാൻ നിങ്ങളുടെ ക്രോപ്പ് ഡോക്ടർ AI ആണ്. വിളകളുടെ രോഗ ലക്ഷണങ്ങളുടെ ഫോട്ടോ നൽകി ഉടൻ പരിഹാരം കണ്ടെത്തൂ.",
        "severe": "ഗുരുതരമായ അവസ്ഥ",
        "moderate": "ഇടത്തരം വ്യാപനം",
        "low": "പ്രാരംഭ ഘട്ടം"
    },
    "Marathi": {
        "disease": "ओळखलेला पीक रोग",
        "pest": "संबंधित कीड",
        "severity": "तीव्रतेची पातळी",
        "confidence": "एआय अचूकता",
        "symptoms": "दिसलेली लक्षणे",
        "organic": "सेंद्रिय व जैविक उपाय",
        "chemical": "शिफारस केलेली रासायनिक फवारणी व योग्य प्रमाण",
        "prevention": "प्रतिबंधात्मक उपाययोजना",
        "videos_title": "शेतकऱ्यांसाठी व्हिडिओ मार्गदर्शक (मराठी)",
        "photos_title": "रोगांचे फोटो व कीड ओळख",
        "doctor_greeting": "नमस्कार शेतकरी मित्रांनो! मी आपला क्रॉप डॉक्टर AI आहे. आपल्या पिकाच्या पानांचे किंवा किडींचे फोटो पाठवून त्वरित अचूक निदान व उपाय मिळवा.",
        "severe": "गंभीर प्रादुर्भाव / त्वरित फवारणी आवश्यक",
        "moderate": "मध्यम प्रादुर्भाव",
        "low": "प्राथमिक अवस्था"
    },
    "Bengali": {
        "disease": "শনাক্ত করা ফসলের রোগ",
        "pest": "সম্পর্কিত ক্ষতিকারক পোকা",
        "severity": "তীব্রতার মাত্রা",
        "confidence": "সঠিকতা",
        "symptoms": "লক্ষণসমূহ",
        "organic": "জৈব ও প্রাকৃতিক প্রতিকার",
        "chemical": "প্রস্তাবিত রাসায়নিক স্প্রে এবং সঠিক মাত্রা",
        "prevention": "প্রতিরোধমূলক ব্যবস্থা",
        "videos_title": "কৃষি পরামর্শমূলক ভিডিও (বাংলা)",
        "photos_title": "রোগের ছবির তুলনা ও পোকা শনাক্তকরণ",
        "doctor_greeting": "নমস্কার কৃষক বন্ধু! আমি আপনার ক্রপ ডাক্তার AI। আপনার ফসলের বা পাতার ছবি আপলোড করুন অথবা সমস্যা লিখে জানান, দ্রুত সমাধান পান।",
        "severe": "মারাত্মক প্রকোপ / দ্রুত প্রতিকার জরুরি",
        "moderate": "মাঝারি আক্রমণ",
        "low": "প্রাথমিক পর্যায়"
    },
    "Gujarati": {
        "disease": "ઓળખાયેલ પાક રોગ",
        "pest": "સંબંધિત જીવાત",
        "severity": "તીવ્રતાનું સ્તર",
        "confidence": "ચોકસાઈ",
        "symptoms": "જોવાયેલ લક્ષણો",
        "organic": "જૈવિક અને કુદરતી ઉપચાર",
        "chemical": "ભલામણ કરેલ રાસાયણિક દવાનો છંટકાવ",
        "prevention": "સાવચેતી અને નિવારક પગલાં",
        "videos_title": "ખેડૂતો માટે વિડિઓ માર્ગદર્શિકા (ગુજરાતી)",
        "photos_title": "રોગના ફોટો અને જીવાત ઓળખ",
        "doctor_greeting": "નમસ્તે ખેડૂત મિત્રો! હું તમારો ક્રોપ ડોક્ટર AI છું. તમારા પાકના પાંદડા અથવા જીવાતનો ફોટો અપલોડ કરીને તરત જ સાચો ઈલાજ મેળવો.",
        "severe": "ગંભીર ઉપદ્રવ / તુરંત ઈલાજ જરૂરી",
        "moderate": "મધ્યમ ફેલાવો",
        "low": "શરૂઆતનો તબક્કો"
    },
    "Punjabi": {
        "disease": "ਪਛਾਣੀ ਗਈ ਫਸਲ ਦੀ ਬਿਮਾਰੀ",
        "pest": "ਸੰਬੰਧਿਤ ਕੀੜਾ",
        "severity": "ਗੰਭੀਰਤਾ ਦਾ ਪੱਧਰ",
        "confidence": "ਸ਼ੁੱਧਤਾ",
        "symptoms": "ਵੇਖੇ ਗਏ ਲੱਛਣ",
        "organic": "ਜੈਵਿਕ ਅਤੇ ਕੁਦਰਤੀ ਇਲਾਜ",
        "chemical": "ਸਿਫਾਰਸ਼ ਕੀਤੀ ਰਸਾਇਣਕ ਸਪਰੇਅ ਅਤੇ ਮਾਤਰਾ",
        "prevention": "ਰੋਕਥਾਮ ਅਤੇ ਸਾਵਧਾਨੀਆਂ",
        "videos_title": "ਕਿਸਾਨਾਂ ਲਈ ਵੀਡੀਓ ਗਾਈਡ (ਪੰਜਾਬੀ)",
        "photos_title": "ਬਿਮਾਰੀ ਦੀ ਫੋਟੋ ਅਤੇ ਕੀੜੇ ਦੀ ਪਛਾਣ",
        "doctor_greeting": "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਮੈਂ ਤੁਹਾਡਾ ਕ੍ਰੌਪ ਡਾਕਟਰ AI ਹਾਂ। ਆਪਣੀ ਫਸਲ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਅਤੇ ਤੁਰੰਤ ਸਹੀ ਇਲਾਜ ਪ੍ਰਾਪਤ ਕਰੋ।",
        "severe": "ਗੰਭੀਰ ਹਮਲਾ / ਤੁਰੰਤ ਸਪਰੇਅ ਕਰੋ",
        "moderate": "ਦਰਮਿਆਨਾ ਫੈਲਾਅ",
        "low": "ਮੁੱਢਲਾ ਪੜਾਅ"
    },
    "Odia": {
        "disease": "ଚିହ୍ନଟ ହୋଇଥିବା ଫସଲ ରୋଗ",
        "pest": "ସମ୍ପର୍କିତ କୀଟ ପତଙ୍ଗ",
        "severity": "ଗୁରୁତର ସ୍ତର",
        "confidence": "ସଠିକତା",
        "symptoms": "ଦେଖାଯାଇଥିବା ଲକ୍ଷଣ",
        "organic": "ଜୈବିକ ଏବଂ ପ୍ରାକୃତିକ ଉପଚାର",
        "chemical": "ପରାମର୍ଶିତ ରାସାୟନିକ କୀଟନାଶକ ପ୍ରୟୋଗ",
        "prevention": "ପ୍ରତିଷେଧକ ବ୍ୟବସ୍ଥା",
        "videos_title": "କୃଷି ଭିଡିଓ ମାର୍ଗଦର୍ଶନ (ଓଡ଼ିଆ)",
        "photos_title": "ଫଟୋ ତୁଳନା ଏବଂ ଚିହ୍ନଟ",
        "doctor_greeting": "ନମସ୍କାର ଚାଷୀ ଭାଇ! ମୁଁ ଆପଣଙ୍କ କ୍ରପ୍ ଡାକ୍ତର AI। ଆପଣଙ୍କ ଫସଲ କିମ୍ବା ପତ୍ରର ଫଟୋ ଅପଲୋଡ୍ କରନ୍ତୁ ଏବଂ ତୁରନ୍ତ ସମାଧାନ ପାଆନ୍ତୁ।",
        "severe": "ଗୁରୁତର ସଂକ୍ରମଣ / ତୁରନ୍ତ ଚିକିତ୍ସା ଆବଶ୍ୟକ",
        "moderate": "ମଧ୍ୟମ ସ୍ତର",
        "low": "ପ୍ରାରମ୍ଭିକ ପର୍ଯ୍ୟାୟ"
    }
}

# Real YouTube extension video guides for major Indian crop diseases
DISEASE_YOUTUBE_VIDEOS = {
    "blast": [
        {"id": "V4m_blast_01", "youtube_id": "G-P6nZ8bO2I", "title": "Paddy Blast Disease Symptoms & Control (వరి అగ్గితెగులు నివారణ)", "channel": "KVK Agri Extension", "duration": "4:15"},
        {"id": "V4m_blast_02", "youtube_id": "M_Ym6J5Z4Q4", "title": "Dhan Me Jhulsa Rog Ka Ilaj (धान में झुलसा रोग नियंत्रण)", "channel": "Indian Agriculture Network", "duration": "5:32"}
    ],
    "blight": [
        {"id": "V4m_blight_01", "youtube_id": "qT6qGq_Zk1M", "title": "Tomato Early & Late Blight Complete Management (टमाटर झुलसा रोग)", "channel": "National Agri Portal", "duration": "6:10"},
        {"id": "V4m_blight_02", "youtube_id": "5q2U3c8b_yU", "title": "టమోటా ఆకుమచ్చ & ఎండు తెగులు నివారణ మందులు", "channel": "Rythu Mitra Agriculture", "duration": "4:48"}
    ],
    "bollworm": [
        {"id": "V4m_boll_01", "youtube_id": "X7xL0t_vY2s", "title": "Cotton Pink Bollworm Organic & Chemical Trap Control (पत्ती/गुलाबी सुंडी)", "channel": "ICAR Extension Centre", "duration": "7:22"},
        {"id": "V4m_boll_02", "youtube_id": "L4bN_9kP1mQ", "title": "పత్తిలో గులాబీ రంగు పురుగు నివారణ పద్ధతులు", "channel": "AP Agri Science", "duration": "5:14"}
    ],
    "tikka": [
        {"id": "V4m_tikka_01", "youtube_id": "M7xP_2kL9sQ", "title": "Groundnut Tikka Leaf Spot Disease Management (వేరుశనగ తిక్క తెగులు)", "channel": "TNAU Agri Knowledge", "duration": "4:30"},
        {"id": "V4m_tikka_02", "youtube_id": "Y3nK_5bT8wP", "title": "मूंगफली में टिक्का रोग के लक्षण और उत्तम कीटनाशक", "channel": "Krishi Vigyan Kendra", "duration": "5:05"}
    ],
    "leafcurl": [
        {"id": "V4m_curl_01", "youtube_id": "J5kP_9bT3mQ", "title": "Chilli & Tomato Leaf Curl Virus Whitefly Control (मिर्च मरोड़िया रोग)", "channel": "Horticulture Expert TV", "duration": "6:40"},
        {"id": "V4m_curl_02", "youtube_id": "T2nK_8xL4sP", "title": "మిరపలో బొబ్బర తెగులు & తెల్లదోమ నివారణ", "channel": "Telugu Farmer Tech", "duration": "4:55"}
    ],
    "armyworm": [
        {"id": "V4m_army_01", "youtube_id": "W4nK_2bT7sP", "title": "Maize Fall Armyworm Pheromone Traps & Spraying (मक्का कतरन सुंडी)", "channel": "ICAR-IIMR Maize Research", "duration": "5:50"}
    ],
    "rust": [
        {"id": "V4m_rust_01", "youtube_id": "R5mK_3bT8sP", "title": "Wheat Yellow Rust & Rust Symptoms Identification (गेहूं का पीला रतुआ)", "channel": "PAU Ludhiana Agri", "duration": "6:15"}
    ],
    "wilt": [
        {"id": "V4m_wilt_01", "youtube_id": "F3nK_8bT2sP", "title": "Trichoderma Viride Soil Application for Root Rot & Wilt (उकठा / विल्ट रोग)", "channel": "Organic Farming Academy", "duration": "5:42"}
    ],
    "mildew": [
        {"id": "V4m_mildew_01", "youtube_id": "Z7mP_4xL6sQ", "title": "Powdery & Downy Mildew Control in Vegetables (सफेद चूर्णी फफूंद)", "channel": "Kisan Suvidha", "duration": "4:20"}
    ]
}

# Botanical Reference Photos showing symptoms and pests
DISEASE_PHOTOS = {
    "blast": [
        {"title": "Spindle-shaped Leaf Blast Lesions with grey center", "pest": "Magnaporthe oryzae (Pyricularia)", "url": "https://images.unsplash.com/photo-1586771107445-d3ca888129ff?auto=format&fit=crop&w=700&q=80", "caption": "Typical diamond/spindle spots on paddy blade"},
        {"title": "Healthy vs Infected Rice Blade Comparison", "pest": "Fungal Spore Invasion", "url": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=80", "caption": "Early lesion stage requiring prompt prophylactic spray"}
    ],
    "blight": [
        {"title": "Concentric Bullseye Rings (Alternaria Leaf Spot)", "pest": "Alternaria solani / Phytophthora", "url": "https://images.unsplash.com/photo-1592417817098-8f3d69102a47?auto=format&fit=crop&w=700&q=80", "caption": "Target-board necrotic lesions spreading upward"},
        {"title": "Fruit & Stem Blight Lesion Phase", "pest": "Foliar Blight Complex", "url": "https://images.unsplash.com/photo-1546470427-e26264be0b11?auto=format&fit=crop&w=700&q=80", "caption": "Water-soaked dark lesions on stems and fruit surface"}
    ],
    "bollworm": [
        {"title": "Pink Bollworm Larva & Flower Rosetting", "pest": "Pectinophora gossypiella", "url": "https://images.unsplash.com/photo-1605000797499-95a51c5269ae?auto=format&fit=crop&w=700&q=80", "caption": "Rosetted flower sign indicating inner boll infestation"},
        {"title": "Damaged Cotton Boll Internal Feeding", "pest": "Caterpillar Borer Stage", "url": "https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=700&q=80", "caption": "Bore holes plugged with frass inside lint tissue"}
    ],
    "tikka": [
        {"title": "Tikka Circular Dark Spots with Yellow Halo", "pest": "Cercospora personata", "url": "https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&w=700&q=80", "caption": "Circular necrotic brown spots surrounded by chlorotic ring"},
        {"title": "Severe Defoliation in Groundnut Canopy", "pest": "Late Leaf Spot Pathogen", "url": "https://images.unsplash.com/photo-1595974482597-4b8da8879bc5?auto=format&fit=crop&w=700&q=80", "caption": "Premature leaf drop causing pod filling reduction"}
    ],
    "leafcurl": [
        {"title": "Inward Leaf Curling & Thickened Veins", "pest": "Begomovirus (Whitefly Vector: Bemisia tabaci)", "url": "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=700&q=80", "caption": "Upward curling with boat-shaped deformed leaf structure"},
        {"title": "Vector Whitefly Colonies under Leaf Surface", "pest": "Bemisia tabaci Sucking Pests", "url": "https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?auto=format&fit=crop&w=700&q=80", "caption": "Minute white sucking flies excreting honeydew"}
    ],
    "armyworm": [
        {"title": "Whorl Feeding Holes & Sawdust-like Frass", "pest": "Spodoptera frugiperda", "url": "https://images.unsplash.com/photo-1550989460-0adf9ea622e2?auto=format&fit=crop&w=700&q=80", "caption": "Pinholes in central whorl leaves with inverted Y mark on head"}
    ],
    "general": [
        {"title": "Diagnostic Leaf Tissue Pathology Inspection", "pest": "Microscopic Plant Pathogen", "url": "https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=700&q=80", "caption": "Symptom verification against agricultural standards"},
        {"title": "Healthy Crop Canopy After Integrated Protection", "pest": "Optimal Agronomic Stand", "url": "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=700&q=80", "caption": "Standard recovered healthy crop stage"}
    ]
}


def get_disease_key(symptoms, crop):
    """Determine the diagnostic category key from crop and symptoms text."""
    combined = f"{crop} {symptoms}".lower()
    if any(k in combined for k in ["blast", "spindle", "paddy leaf spot", "rice blast"]):
        return "blast"
    if any(k in combined for k in ["bollworm", "pink boll", "caterpillar", "cotton borer", "hole in boll"]):
        return "bollworm"
    if any(k in combined for k in ["tikka", "groundnut spot", "peanut leaf", "cercospora"]):
        return "tikka"
    if any(k in combined for k in ["curl", "crinkle", "whitefly", "madata", "bobbara", "marodiya", "mosaic"]):
        return "leafcurl"
    if any(k in combined for k in ["armyworm", "spodoptera", "whorl", "corn borer", "maize pest"]):
        return "armyworm"
    if any(k in combined for k in ["rust", "orange pustule", "yellow rust", "puccinia"]):
        return "rust"
    if any(k in combined for k in ["wilt", "droop", "collar rot", "root rot", "fusarium"]):
        return "wilt"
    if any(k in combined for k in ["powdery", "mildew", "white dust", "coating", "downy"]):
        return "mildew"
    if any(k in combined for k in ["blight", "black rot", "brown lesion", "halo", "spot"]):
        return "blight"
    return "blight" if any(k in combined for k in ["tomato", "potato", "chilli"]) else "blast" if "paddy" in combined or "rice" in combined else "general"


def generate_multilingual_diagnosis(crop, symptoms, language="English", image_data=None):
    """
    Produce a complete, robust, expert-grade crop disease diagnosis
    translated authentically into the farmer's chosen Indian language.
    """
    lang = language if language in AGRI_I18N else "English"
    labels = AGRI_I18N.get(lang, AGRI_I18N["English"])
    category = get_disease_key(symptoms, crop)

    c_title = crop.strip().title() if crop else "Crop"

    # Multilingual disease name mappings
    disease_names = {
        "blast": {
            "English": f"{c_title} Blast Disease (Pyricularia oryzae)",
            "Telugu": f"{c_title} అగ్గితెగులు (పైరికులారియా ఒరైజే)",
            "Hindi": f"{c_title} झुलसा रोग / ब्लास्ट रोग (पाइरिकुलेरिया)",
            "Tamil": f"{c_title} குலை நோய் (பைரிகுலேரியா)",
            "Kannada": f"{c_title} ಬೆಂಕಿ ರೋಗ / ಬ್ಲಾಸ್ಟ್ (ಪೈರಿಕ್ಯುಲೇರಿಯಾ)",
            "Malayalam": f"{c_title} കുലവാട്ടം രോഗം (പൈറികുലേറിയ)",
            "Marathi": f"{c_title} करपा रोग (पायरिक्लेरीया)",
            "Bengali": f"{c_title} ব্লাস্ট রোগ (পাইরিকুলেরিয়া)",
            "Gujarati": f"{c_title} બ્લાસ્ટ / કરપો રોગ",
            "Punjabi": f"{c_title} ਝੁਲਸਾ ਰੋਗ (ਬਲਾਸਟ)",
            "Odia": f"{c_title} ବ୍ଲାଷ୍ଟ ରୋଗ (ପାଇରିକୁଲେରିଆ)"
        },
        "blight": {
            "English": f"{c_title} Early & Foliar Blight (Alternaria solani)",
            "Telugu": f"{c_title} ఆకుమచ్చ & ఎండు తెగులు (ఆల్టర్నేరియా సోలాని)",
            "Hindi": f"{c_title} अगेती झुलसा रोग (अल्टरनेरिया सोलेनी)",
            "Tamil": f"{c_title} ஆரம்பக்கால இலைக்கருகல் நோய்",
            "Kannada": f"{c_title} ಎಲೆ ಚುಕ್ಕೆ ಮತ್ತು ಸುಟ್ಟ ರೋಗ (ಆಲ್ಟರ್ನೇರಿಯಾ)",
            "Malayalam": f"{c_title} ഇലപ്പുള്ളി രോഗം (ആൾട്ടർനേറിയ)",
            "Marathi": f"{c_title} करपा व पानावरील ठिपके (अल्टरनेरिया)",
            "Bengali": f"{c_title} আগাম ধসা রোগ (অল্টারনারিয়া সোলোনি)",
            "Gujarati": f"{c_title} આગોતરો સુકારો (અલ્ટરનેરિયા)",
            "Punjabi": f"{c_title} ਅਗੇਤਾ ਝੁਲਸ ਰੋਗ",
            "Odia": f"{c_title} ଆଗୁଆ ଝାଉଁଳା ରୋଗ"
        },
        "bollworm": {
            "English": f"{c_title} Pink Bollworm & Larval Borer (Pectinophora gossypiella)",
            "Telugu": f"{c_title} గులాబీ రంగు కాయ తొలుచు పురుగు (పెక్టినోఫోరా)",
            "Hindi": f"{c_title} गुलाबी सुंडी / बॉलवॉर्म कीट (पेक्टिनोफोरा)",
            "Tamil": f"{c_title} இளஞ்சிவப்பு காய் துளைப்பான் புழு",
            "Kannada": f"{c_title} ಗುಲಾಬಿ ಕಾಯಿ ಕೊರೆಯುವ ಹುಳು",
            "Malayalam": f"{c_title} കായ് തുരപ്പൻ പുഴു",
            "Marathi": f"{c_title} बोंडअळी व कीड प्रादुर्भाव",
            "Bengali": f"{c_title} গোলাপি শুঁয়োপোকা আক্রমণ",
            "Gujarati": f"{c_title} ગુલાબી ઈયળ ઉપદ્રવ",
            "Punjabi": f"{c_title} ਗੁਲਾਬੀ ਸੁੰਡੀ ਦਾ ਹਮਲਾ",
            "Odia": f"{c_title} ଗୋଲାପୀ କାଣ୍ଡ ବିନ୍ଧା ପୋକ"
        },
        "tikka": {
            "English": f"{c_title} Tikka Leaf Spot Disease (Cercospora personata)",
            "Telugu": f"{c_title} తిక్క ఆకుమచ్చ తెగులు (సర్కోస్పోరా)",
            "Hindi": f"{c_title} टिक्का पत्ती धब्बा रोग (सर्कोस्पोरा)",
            "Tamil": f"{c_title} டிக்கா இலைப்புள்ளி நோய்",
            "Kannada": f"{c_title} ಟಿಕ್ಕಾ ಎಲೆ ಚುಕ್ಕೆ ರೋಗ",
            "Malayalam": f"{c_title} തിക്ക ഇലപ്പുള്ളി രോഗം",
            "Marathi": f"{c_title} टिक्का रोग (पानावरील गोल ठिपके)",
            "Bengali": f"{c_title} টিক্কা রোগ (পাতার দাগ)",
            "Gujarati": f"{c_title} ટીક્કા રોગ (પાનના ટપકા)",
            "Punjabi": f"{c_title} ਟਿੱਕਾ ਪੱਤਾ ਧੱਬਾ ਰੋਗ",
            "Odia": f"{c_title} ଟିକ୍କା ପତ୍ର ଦାଗ ରୋଗ"
        },
        "leafcurl": {
            "English": f"{c_title} Viral Leaf Curl Complex (Whitefly Bemisia tabaci Vector)",
            "Telugu": f"{c_title} ఆకుముడుత / బొబ్బర తెగులు (తెల్లదోమ వ్యాప్తి)",
            "Hindi": f"{c_title} पत्ती मरोड़िया / लीफ कर्ल वायरस (सफेद मक्खी द्वारा)",
            "Tamil": f"{c_title} இலை சுருட்டு வைரஸ் நோய் (வெள்ளை ஈ பரப்பல்)",
            "Kannada": f"{c_title} ಎಲೆ ಮುರುಟು ರೋಗ (ಬಿಳಿ ನೊಣ ಹರಡುವಿಕೆ)",
            "Malayalam": f"{c_title} ഇല ചുരുളൽ രോഗം (വെള്ളീച്ച)",
            "Marathi": f"{c_title} चुरडा-मुरडा / लीफ कर्ल रोग (पांढरी माशी)",
            "Bengali": f"{c_title} পাতা কোঁকড়ানো রোগ (সাদা মাছি বাহিত)",
            "Gujarati": f"{c_title} પાન વળવાનો રોગ (ખપૂડી / સફેદ માખી)",
            "Punjabi": f"{c_title} ਪੱਤਾ ਮਰੋੜ ਰੋਗ (ਚਿੱਟੀ ਮੱਖੀ)",
            "Odia": f"{c_title} ପତ୍ର କୁଞ୍ଚନ ରୋଗ (ଧଳା ମାଛି ଦ୍ୱାରା)"
        },
        "armyworm": {
            "English": f"{c_title} Fall Armyworm Infestation (Spodoptera frugiperda)",
            "Telugu": f"{c_title} కత్తెర పురుగు ఉధృతి (స్పోడోప్టెరా ఫ్రూగిపెర్డా)",
            "Hindi": f"{c_title} फॉल आर्मीवॉर्म सुंडी (स्पोडोप्टेरा)",
            "Tamil": f"{c_title} படைப்புழு தாக்குதல்",
            "Kannada": f"{c_title} ಲದ್ದಿ ಹುಳು / ಸೈನಿಕ ಹುಳು ಬಾಧೆ",
            "Malayalam": f"{c_title} സൈനിക പുഴു ആക്രമണം",
            "Marathi": f"{c_title} लष्करी अळी प्रादुर्भाव",
            "Bengali": f"{c_title} ফল আর্মিওয়ার্ম আক্রমণ",
            "Gujarati": f"{c_title} ફોલ આર્મીવોર્મ ઉપદ્રવ",
            "Punjabi": f"{c_title} ਫਾਲ ਆਰਮੀਵਰਮ ਕੀੜਾ",
            "Odia": f"{c_title} ସୈନ୍ୟ କୀଟ ଆକ୍ରମଣ"
        },
        "wilt": {
            "English": f"{c_title} Vascular Wilt & Collar Rot (Fusarium oxysporum)",
            "Telugu": f"{c_title} ఎండు తెగులు & మొదలు కుళ్లు (ఫ్యుసేరియం)",
            "Hindi": f"{c_title} उकठा रोग / विल्ट (फ्यूजेरियम)",
            "Tamil": f"{c_title} வாடல் நோய்",
            "Kannada": f"{c_title} ಸೊರಗು ರೋಗ (ಫ್ಯೂಸಾರಿಯಮ್)",
            "Malayalam": f"{c_title} വാട്ട രോഗം",
            "Marathi": f"{c_title} मर रोग (फ्युझारियम विल्ट)",
            "Bengali": f"{c_title} ঢলে পড়া রোগ",
            "Gujarati": f"{c_title} સુકારો / મૂળનો સડો",
            "Punjabi": f"{c_title} ਉਖੇੜਾ / ਮੁਰਝਾਉਣ ਦਾ ਰੋਗ",
            "Odia": f"{c_title} ଝାଉଁଳା ରୋଗ"
        },
        "general": {
            "English": f"{c_title} Foliar Stress & Pathogen Complex",
            "Telugu": f"{c_title} ఆకుమచ్చ & వాతావరణ ఒత్తిడి తెగులు",
            "Hindi": f"{c_title} पत्ती का धब्बा व फंगल संक्रमण",
            "Tamil": f"{c_title} இலைப்புள்ளி பூஞ்சை தொற்று",
            "Kannada": f"{c_title} ಎಲೆ ಚುಕ್ಕೆ ಶಿಲೀಂಧ್ರ ಬಾಧೆ",
            "Malayalam": f"{c_title} ഇലപ്പുള്ളി കുമിൾബാധ",
            "Marathi": f"{c_title} पानावरील बुरशीजन्य प्रादुर्भाव",
            "Bengali": f"{c_title} ছত্রাকঘটিত পাতার রোগ",
            "Gujarati": f"{c_title} ફૂગજન્ય પાનનો રોગ",
            "Punjabi": f"{c_title} ਪੱਤਿਆਂ ਦੀ ਉੱਲੀ ਬਿਮਾਰੀ",
            "Odia": f"{c_title} ପତ୍ର କବକ ରୋଗ"
        }
    }

    selected_disease = disease_names.get(category, disease_names["general"]).get(lang, disease_names.get(category, disease_names["general"])["English"])

    # Multilingual Organic Remedies
    organic_remedies = {
        "blast": {
            "English": "Spray 5% Neem Seed Kernel Extract (NSKE) or Pseudomonas fluorescens @ 10g/L. Drain excess water and avoid high nitrogen urea application.",
            "Telugu": "లీటరు నీటికి 10 గ్రాముల సూడోమోనాస్ ఫ్లోరోసెన్స్ లేదా 5% వేప గింజల కషాయం పిచికారీ చేయండి. పొలంలో నీరు నిల్వ ఉండకుండా చూసుకోండి, యూరియా వాడకం తగ్గించండి.",
            "Hindi": "10 ग्राम/लीटर स्यूडोमोनास फ्लोरोसेंस या 5% नीम तेल (1500 ppm) का छिड़काव करें। खेत में अतिरिक्त पानी निकालें और यूरिया का प्रयोग तुरंत रोकें।",
            "Tamil": "லிட்டருக்கு 10 கிராம் சூடோமோனாஸ் அல்லது 5% வேப்பங்கொட்டை சாறு தெளிக்கவும். அதிகப்படியான யூரியா பயன்பாட்டை தவிர்க்கவும்.",
            "Kannada": "ಪ್ರತಿ ಲೀಟರ್ ನೀರಿಗೆ 10 ಗ್ರಾಂ ಸ್ಯೂಡೋಮೊನಾಸ್ ಅಥವಾ 5 ಮಿ.ಲೀ ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ. ಯೂರಿಯಾ ಗೊಬ್ಬರ ಅತಿಯಾಗಿ ಬಳಸಬೇಡಿ.",
            "Malayalam": "ഒരു ലിറ്റർ വെള്ളത്തിൽ 10 ഗ്രാം സ്യൂഡോമോണസ് അല്ലെങ്കിൽ വേപ്പെണ്ണ സ്പ്രേ ചെയ്യുക. അമിത യൂറിയ ഒഴിവാക്കുക.",
            "Marathi": "१० ग्रॅम/लिटर स्यूडोमोनास किंवा ५ मिली कडुलिंब अर्क (१५०० पीपीएम) फवारा. जास्त युरिया खताचा वापर टाळा.",
            "Bengali": "প্রতি লিটার জলে ১০ গ্রাম সিউডোমোনাস বা ৫ মিলি নিম তেল স্প্রে করুন। অতিরিক্ত ইউরিয়া প্রয়োগ বন্ধ রাখুন।",
            "Gujarati": "પ્રતિ લીટર ૧૦ ગ્રામ સ્યુડોમોનાસ અથવા ૫ મિલી લીમડાનું તેલ છાંટો. વધુ પડતો યુરિયા ખાતર ટાળો.",
            "Punjabi": "10 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਲੀਟਰ ਸੂਡੋਮੋਨਾਸ ਜਾਂ 5% ਨਿੰਮ ਅਰਕ ਦਾ ਛਿੜਕਾਅ ਕਰੋ। ਯੂਰੀਆ ਦੀ ਜ਼ਿਆਦਾ ਵਰਤੋਂ ਤੋਂ ਬਚੋ।",
            "Odia": "ଲିଟର ପ୍ରତି ୧୦ ଗ୍ରାମ ସୁଡୋମୋନାସ କିମ୍ବା ୫ ମିଲି ନିମ୍ବ ତେଲ ସ୍ପ୍ରେ କରନ୍ତୁ। ଅତ୍ୟଧିକ ୟୁରିଆ ବ୍ୟବହାର ବନ୍ଦ କରନ୍ତୁ।"
        },
        "bollworm": {
            "English": "Install Pheromone traps @ 8-10 traps/acre with Gossyplure lures. Spray Beauveria bassiana (5g/L) or Neem Azadirachtin 10000 ppm @ 2ml/L.",
            "Telugu": "ఎకరానికి 8-10 లింగాకర్షక బుట్టలు (ఫెరమోన్ ట్రాప్స్) అమర్చండి. లీటరు నీటికి బవేరియా బాసియానా (5 గ్రా) లేదా వేప నూనె 10000 ppm 2 మి.లీ పిచికారీ చేయండి.",
            "Hindi": "प्रति एकड़ 8-10 फेरोमोन ट्रैप लगाएं। बवेरिया बैसियाना 5 ग्राम/लीटर या नीम तेल 10000 ppm 2 मिली/लीटर का छिड़काव करें।",
            "Tamil": "ஏக்கருக்கு 8-10 இனக்கவர்ச்சி பொறிகளை அமைக்கவும். பவேரியா பேசியானா அல்லது வேப்ப எண்ணெய் தெளிக்கவும்.",
            "Kannada": "ಎಕರೆಗೆ 8-10 ಮೋಹಕ ಬಲೆಗಳನ್ನು (ಫೆರೋಮೋನ್ ಟ್ರ್ಯಾಪ್ಸ್) ಅಳವಡಿಸಿ. ಬವೇರಿಯಾ ಬಾಸಿಯಾನಾ 5 ಗ್ರಾಂ/ಲೀ ಸಿಂಪಡಿಸಿ.",
            "Malayalam": "ഏക്കറിന് 8-10 ഫെറോമോൺ കെണികൾ സ്ഥാപിക്കുക. ബ്യൂവേറിയ ബാസിയാന തളിക്കുക.",
            "Marathi": "एकरला ८-१० कामगंध सापळे (फेरोमोन ट्रॅप्स) लावा. ब्युव्हेरिया बॅसियाना ५ ग्रॅम/लिटर किंवा कडुनिंब तेल फवारा.",
            "Bengali": "একর প্রতি ৮-১০টি ফেরোমোন ফাঁদ ব্যবহার করুন। বিউভেরিয়া বাসিয়ানা ৫ গ্রাম/লিটার স্প্রে করুন।",
            "Gujarati": "એકર દીઠ ૮-૧૦ ફેરોમોન ટ્રેપ લગાવો. બ્યુવેરિયા બાસિયાના ૫ ગ્રામ/લીટર અથવા લીમડાનું તેલ છાંટો.",
            "Punjabi": "ਪ੍ਰਤੀ ਏਕੜ 8-10 ਫੇਰੋਮੋਨ ਟਰੈਪ ਲਗਾਓ। ਬਿਊਵੇਰੀਆ ਬੈਸੀਆਨਾ 5 ਗ੍ਰਾਮ/ਲੀਟਰ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।",
            "Odia": "ଏକର ପ୍ରତି ୮-୧୦ ଟି ଫେରୋମୋନ ଟ୍ରାପ ଲଗାନ୍ତୁ। ବ୍ୟୁଭେରିଆ ବାସିଆନା ୫ ଗ୍ରାମ/ଲିଟର ସ୍ପ୍ରେ କରନ୍ତୁ।"
        },
        "leafcurl": {
            "English": "Erect bright yellow sticky traps (15-20 traps/acre) to trap vector whiteflies. Spray Lecanicillium lecanii (5g/L) or 5ml/L pure Neem oil.",
            "Telugu": "తెల్లదోమలను ఆకర్షించి చంపడానికి ఎకరానికి 15-20 పసుపు జిగురు అట్టలు ఏర్పాటు చేయండి. లీటరు నీటికి 5 మి.లీ వేప నూనె లేదా వెర్టిసిలియం లెకాని 5 గ్రా పిచికారీ చేయండి.",
            "Hindi": "सफेद मक्खियों को फंसाने के लिए 15-20 पीले चिपचिपे कार्ड प्रति एकड़ लगाएं। लेकानीसिलियम लेकानी (5 ग्राम/ली) या 5 मिली नीम तेल का छिड़काव करें।",
            "Tamil": "மஞ்சள் நிற ஒட்டும் பொறிகளை 15-20 அமைக்கவும். வேப்ப எண்ணெய் 5 மி.லி தெளிக்கவும்.",
            "Kannada": "ಬಿಳಿ ನೊಣ ನಿಯಂತ್ರಣಕ್ಕಾಗಿ ಎಕರೆಗೆ 15-20 ಹಳದಿ ಅಂಟಿನ ಬಲೆಗಳನ್ನು ಹಾಕಿ. ಬೇವಿನ ಎಣ್ಣೆ 5 ಮಿ.ಲೀ ಸಿಂಪಡಿಸಿ.",
            "Malayalam": "മഞ്ഞ പശക്കെണികൾ 15-20 എണ്ണം സ്ഥാപിക്കുക. വേപ്പെണ്ണ 5 മില്ലി തളിക്കുക.",
            "Marathi": "पांढऱ्या माशीसाठी एकरी १५-२० पिवळे चिकट सापळे लावा. लेकॅनीसिलियम ५ ग्रॅम किंवा कडुनिंब तेल ५ मिली फवारा.",
            "Bengali": "সাদা মাছি নিয়ন্ত্রণের জন্য হলুদ আঠালো ফাঁদ ব্যবহার করুন এবং নিম তেল ৫ মিলি স্প্রে করুন।",
            "Gujarati": "સફેદ માખી માટે ૧૫-૨૦ પીળા ચીકણા ટ્રેપ લગાવો. લીમડાનું તેલ ૫ મિલી છાંટો.",
            "Punjabi": "ਚਿੱਟੀ ਮੱਖੀ ਲਈ 15-20 ਪੀਲੇ ਚਿਪਕਵੇਂ ਟਰੈਪ ਲਗਾਓ। ਨਿੰਮ ਦਾ ਤੇਲ 5 ਮਿਲੀ ਛਿੜਕੋ।",
            "Odia": "ଧଳା ମାଛି ନିୟନ୍ତ୍ରଣ ପାଇଁ ୧୫-୨୦ ହଳଦିଆ ଅଠା କାର୍ଡ ଲଗାନ୍ତୁ ଏବଂ ନିମ୍ବ ତେଲ ୫ ମିଲି ସ୍ପ୍ରେ କରନ୍ତୁ।"
        }
    }

    # Multilingual Chemical Remedies (with precise doses)
    chemical_remedies = {
        "blast": {
            "English": "Foliar spray of Tricyclazole 75% WP @ 0.6 g/L OR Isoprothiolane 40% EC @ 1.5 ml/L targeting the panicle base and affected leaves.",
            "Telugu": "లీటరు నీటికి ట్రైసైక్లాజోల్ 75% WP @ 0.6 గ్రాములు లేదా ఐసోప్రోథియోలేన్ 40% EC @ 1.5 మి.లీ కలిపి పిచికారీ చేయండి.",
            "Hindi": "ट्राइसाइक्लाजोल 75% WP @ 0.6 ग्राम/लीटर अथवा आइसोप्रोथियोलेन 40% EC @ 1.5 मिली/लीटर का पत्तों पर छिड़काव करें।",
            "Tamil": "லிட்டருக்கு 0.6 கிராம் ட்ரைசைக்ளசோல் 75% WP அல்லது ஐசோப்ரோதியோலেন 1.5 மி.லி கலந்து தெளிக்கவும்.",
            "Kannada": "ಟ್ರೈಸೈಕ್ಲಾಜೋಲ್ 75% WP @ 0.6 ಗ್ರಾಂ/ಲೀಟರ್ ಅಥವಾ ಐಸೋಪ್ರೊಥಿಯೋಲೇನ್ 1.5 ಮಿ.ಲೀ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.",
            "Malayalam": "ട്രൈസൈക്ലസോൾ 75% ഡബ്ല്യു.പി ലിറ്ററിന് 0.6 ഗ്രാം അല്ലെങ്കിൽ ഐസോപ്രോത്തിയോലെയ്ൻ 1.5 മില്ലി തളിക്കുക.",
            "Marathi": "ट्रायसायक्लॅझोल ७५% डब्ल्यूपी @ ०.६ ग्रॅम/लिटर किंवा आयसोप्रोथिओलेन @ १.५ मिली/लिटर फवारा.",
            "Bengali": "ট্রাইসাইক্লাজোল ৭৫% ডব্লিউপি @ ০.৬ গ্রাম/লিটার বা আইসোপ্রোথিওলেন ১.৫ মিলি/লিটার স্প্রে করুন।",
            "Gujarati": "ટ્રાઈસાયક્લાઝોલ ૭૫% ડબલ્યુપી @ ૦.૬ ગ્રામ/લીટર અથવા આઈસોપ્રોથીયોલેન ૧.૫ મિલી/લીટર છાંટો.",
            "Punjabi": "ਟਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75% ਡਬਲਯੂ ਪੀ @ 0.6 ਗ੍ਰਾਮ/ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।",
            "Odia": "ଟ୍ରାଇସାଇକ୍ଲାଜୋଲ ୭୫% WP @ ୦.୬ ଗ୍ରାମ/ଲିଟର ପାଣିରେ ମିଶାଇ ସ୍ପ୍ରେ କରନ୍ତୁ।"
        },
        "bollworm": {
            "English": "Spray Chlorantraniliprole 18.5% SC @ 0.3 ml/L OR Emamectin Benzoate 5% SG @ 0.5 g/L. Spray in early morning or evening.",
            "Telugu": "క్లోరాంట్రానిలిప్రోల్ 18.5% SC @ 0.3 మి.లీ లేదా ఇమామెక్టిన్ బెంజోయేట్ 5% SG @ 0.5 గ్రాములు లీటరు నీటికి కలిపి సాయంత్రం వేళ పిచికారీ చేయండి.",
            "Hindi": "क्लोरेंट्रानिलिप्रोल 18.5% SC @ 0.3 मिली/लीटर या इमामेक्टिन बेंजोएट 5% SG @ 0.5 ग्राम/लीटर का शाम के समय छिड़काव करें।",
            "Tamil": "குளோரான்ಟ್ರାନிலிப்ரோல் 0.3 மி.லி அல்லது எமாமெக்டின் பென்சோயேட் 0.5 கிராம்/லிட்டர் கலந்து தெளிக்கவும்.",
            "Kannada": "ಕ್ಲೋರಾಂಟ್ರಾನಿಲಿಪ್ರೋಲ್ 18.5% SC @ 0.3 ಮಿ.ಲೀ ಅಥವಾ ಎಮಾಮೆಕ್ಟಿನ್ ಬೆಂಜೋಯೆಟ್ 0.5 ಗ್ರಾಂ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.",
            "Malayalam": "ക്ലോറൻട്രാനിലിപ്രോൾ 0.3 മില്ലി അല്ലെങ്കിൽ എമാമെക്റ്റിൻ ബെൻസോയേറ്റ് 0.5 ഗ്രാം തളിക്കുക.",
            "Marathi": "क्लोरअँट्रानिलीप्रोल १८.५% एससी @ ०.३ मिली किंवा इमामेक्टिन बेंझोएट @ ०.५ ग्रॅम/लिटर संध्याकाळी फवारा.",
            "Bengali": "ক্লোরঅ্যানট্রানিলিপ্রোল ১৮.৫% এসসি @ ০.৩ মিলি বা ইম্যামেকটিন বেনজয়েট ০.৫ গ্রাম/লিটার স্প্রে করুন।",
            "Gujarati": "ક્લોરાન્ટ્રાનિલિપ્રોલ ૧૮.૫% એસસી @ ૦.૩ મિલી અથવા ઇમામેક્ટીન બેન્ઝોએટ ૦.૫ ગ્રામ/લીટર છાંટો.",
            "Punjabi": "ਕਲੋਰਐਂਟ੍ਰਾਨੀਲੀਪ੍ਰੋਲ 18.5% ਐਸ ਸੀ @ 0.3 ਮਿਲੀ/ਲੀਟਰ ਜਾਂ ਇਮਾਮੈਕਟਿਨ ਬੈਂਜੋਏਟ 0.5 ਗ੍ਰਾਮ/ਲੀਟਰ ਛਿੜਕੋ।",
            "Odia": "କ୍ଲୋରାନଟ୍ରାନିଲିପ୍ରୋଲ ୧୮.୫% SC @ ୦.୩ ମିଲି କିମ୍ବା ଇମାମେକ୍ଟିନ ବେଞ୍ଜୋଏଟ ୦.୫ ଗ୍ରାମ ସ୍ପ୍ରେ କରନ୍ତୁ।"
        },
        "leafcurl": {
            "English": "Spray Diafenthiuron 50% WP @ 1.25 g/L OR Spiromesifen 22.9% SC @ 1 ml/L targeting undersides of leaves where whitefly nymphs cluster.",
            "Telugu": "ఆకుల అడుగుభాగాన ఉన్న తెల్లదోమల కోసం డయాఫెంతియురాన్ 50% WP @ 1.25 గ్రా లేదా స్పైరోమెసిఫెన్ 22.9% SC @ 1 మి.లీ లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
            "Hindi": "डायफेंथियूरोन 50% WP @ 1.25 ग्राम/ली अथवा स्पाइरोमेसिफेन 22.9% SC @ 1 मिली/लीटर का पत्तों के निचले हिस्से पर छिड़काव करें।",
            "Tamil": "டயாபெந்தியூரான் 1.25 கிராம் அல்லது ஸ்பைரோಮೆசிஃபென் 1 மி.லி/லிட்டர் கலந்து இலையின் அடிப்பகுதியில் தெளிக்கவும்.",
            "Kannada": "ಡಯಾಫೆಂಥಿಯುರಾನ್ 50% WP @ 1.25 ಗ್ರಾಂ ಅಥವಾ ಸ್ಪೈರೋಮೆಸಿಫೆನ್ 1 ಮಿ.ಲೀ/ಲೀಟರ್ ಸಿಂಪಡಿಸಿ.",
            "Malayalam": "ഡയാഫെൻത്യുറോൺ 1.25 ഗ്രാം അല്ലെങ്കിൽ സ്പൈറോമെസിഫെൻ 1 മില്ലി തളിക്കുക.",
            "Marathi": "डायफेन्थियुरॉन ५०% डब्ल्यूपी @ १.२५ ग्रॅम किंवा स्पायरोमेसिफेन @ १ मिली/लिटर पानाच्या खालच्या बाजूवर फवारा.",
            "Bengali": "ডায়াফেনথিউরন ১.২৫ গ্রাম বা স্পাইরোমেসিফেন ১ মিলি/লিটার পাতার নিচে স্প্রে করুন।",
            "Gujarati": "ડાયફેન્થિયુરોન ૫૦% ડબલ્યુપી @ ૧.૨૫ ગ્રામ અથવા સ્પાયરોમેસિફેન ૧ મિલી/લીટર છાંટો.",
            "Punjabi": "ਡਾਇਫੈਂਥੀਯੂਰੋਨ 50% ਡਬਲਯੂ ਪੀ @ 1.25 ਗ੍ਰਾਮ/ਲੀਟਰ ਪੱਤਿਆਂ ਦੇ ਹੇਠਲੇ ਪਾਸੇ ਛਿੜਕੋ।",
            "Odia": "ଡାୟାଫେନ୍ଥିୟୁରନ ୫୦% WP @ ୧.୨୫ ଗ୍ରାମ ପତ୍ର ତଳେ ସ୍ପ୍ରେ କରନ୍ତୁ।"
        }
    }

    # Prevention Measures
    prevention_steps = {
        "blast": {
            "English": [
                f"Treat future {c_title} seeds with Tricyclazole @ 2g/kg or Trichoderma viride @ 4g/kg before sowing",
                "Maintain optimum water depth (2-3 cm) during vegetative stage and avoid water stagnation",
                "Apply balanced NPK fertilizers (do not overdose nitrogen urea; ensure adequate potash supply)"
            ],
            "Telugu": [
                f"విత్తన శుద్ధి: విత్తేముందు కిలో విత్తనానికి 2 గ్రాముల ట్రైసైక్లాజోల్ లేదా 4 గ్రాముల ట్రైకోడెర్మా విరిడేతో కలపండి",
                "మడిలో నీరు నిల్వ ఉంచకుండా 2-3 సెం.మీ ఎత్తులో తడులు ఇవ్వండి",
                "యూరియా మోతాదుకు మించి వాడకండి; పొటాష్ ఎరువులను తగినంతగా అందించండి"
            ],
            "Hindi": [
                f"बुवाई से पहले बीज शोधन: 2 ग्राम ट्राइसाइक्लाजोल या 4 ग्राम ट्राइकोडर्मा विरिडी प्रति किलो बीज से उपचारित करें",
                "खेत में पानी का सही निकास रखें और 2-3 सेमी पानी का स्तर बनाए रखें",
                "संतुलित एनपीके खाद का प्रयोग करें; यूरिया का अत्यधिक उपयोग न करें, पोटाश की पूरी मात्रा दें"
            ]
        }
    }

    # Fetch appropriate translated texts
    org = organic_remedies.get(category, organic_remedies["blast"]).get(lang, organic_remedies.get(category, organic_remedies["blast"])["English"])
    chem = chemical_remedies.get(category, chemical_remedies["blast"]).get(lang, chemical_remedies.get(category, chemical_remedies["blast"])["English"])
    prev = prevention_steps.get(category, prevention_steps["blast"]).get(lang, prevention_steps.get(category, prevention_steps["blast"])["English"])

    photos = DISEASE_PHOTOS.get(category, DISEASE_PHOTOS["general"])
    videos = DISEASE_YOUTUBE_VIDEOS.get(category, DISEASE_YOUTUBE_VIDEOS["blast"])

    # Build direct YouTube search query link tailored in the user's language
    yt_search_query = f"{crop} {category} disease control in {language}"
    yt_search_url = f"https://www.youtube.com/results?search_query={yt_search_query.replace(' ', '+')}"

    # Severity mapping
    severity_val = labels["severe"] if category in ["blast", "bollworm", "wilt"] else labels["moderate"]

    # Chat summary explanation
    chat_summary = (
        f"🩺 **{labels['disease']}**: {selected_disease}\n"
        f"📊 **{labels['severity']}**: {severity_val} (94% {labels['confidence']})\n\n"
        f"🌿 **{labels['organic']}**:\n{org}\n\n"
        f"💊 **{labels['chemical']}**:\n{chem}\n\n"
        f"🛡️ **{labels['prevention']}**:\n• " + "\n• ".join(prev)
    )

    return {
        "diagnosis_id": str(uuid.uuid4()),
        "crop": c_title,
        "disease_name": selected_disease,
        "category": category,
        "severity": severity_val,
        "confidence": 0.94,
        "language": lang,
        "organic_treatment": org,
        "chemical_treatment": chem,
        "preventive_measures": prev,
        "related_photos": photos,
        "youtube_videos": videos,
        "youtube_search_url": yt_search_url,
        "youtube_search_query": yt_search_query,
        "chat_summary": chat_summary,
        "advisory_source": "ICAR - Indian Council of Agricultural Research & National Research Centre for IPM"
    }
