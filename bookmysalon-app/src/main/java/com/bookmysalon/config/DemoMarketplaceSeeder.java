package com.bookmysalon.config;

import com.bookmysalon.entity.Category;
import com.bookmysalon.entity.Review;
import com.bookmysalon.entity.Role;
import com.bookmysalon.entity.Salon;
import com.bookmysalon.entity.ServiceOffering;
import com.bookmysalon.entity.User;
import com.bookmysalon.entity.UserRole;
import com.bookmysalon.repository.CategoryRepository;
import com.bookmysalon.repository.ReviewRepository;
import com.bookmysalon.repository.RoleRepository;
import com.bookmysalon.repository.SalonRepository;
import com.bookmysalon.repository.ServiceOfferingRepository;
import com.bookmysalon.repository.UserRepository;
import com.bookmysalon.service.SalonStatsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

/**
 * Seeds a realistic Indian marketplace for demos: ~40 salons across 10 cities, each with
 * photos, an INR menu, opening hours and reviews from demo customers.
 *
 * Off by default ({@code APP_DEMO_SEED_DATA=true} to enable). Idempotent: salons are keyed
 * by email, so re-running only adds what is missing. Output is deterministic (fixed seed),
 * so every environment shows the same catalogue. Demo owner and reviewer accounts get a
 * random password nobody knows — they exist only to own data.
 */


@Component
@Order(20)
@RequiredArgsConstructor
@Slf4j
public class DemoMarketplaceSeeder implements CommandLineRunner {

    private static final String DOMAIN = "demo.bookmysalon.in";

    @Value("${app.demo.seed-data:false}")
    private boolean enabled;

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final SalonRepository salonRepository;
    private final CategoryRepository categoryRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;
    private final JdbcTemplate jdbcTemplate;
    private final SalonStatsService salonStatsService;

    enum Kind { UNISEX, BARBER, SPA, BRIDAL, NAILS, SKIN }

    record SalonSeed(String name, Kind kind, String city, String area, String street,
                     double lat, double lng, String owner) {
    }

    record ServiceSeed(String category, String name, String description, int price, int minutes) {
    }

    // ---------------------------------------------------------------- catalogue

    private static final List<SalonSeed> SALONS = List.of(
            new SalonSeed("Kesh Kala Studio", Kind.UNISEX, "Delhi", "Hauz Khas", "14 Hauz Khas Village", 28.5535, 77.1942, "Ritika Malhotra"),
            new SalonSeed("The Barber Collective", Kind.BARBER, "Delhi", "Rajouri Garden", "J-2/7 Main Market, Rajouri Garden", 28.6492, 77.1222, "Harpreet Singh"),
            new SalonSeed("Ruh Wellness Spa", Kind.SPA, "Delhi", "Vasant Kunj", "B-4 Pocket 6, Vasant Kunj", 28.5200, 77.1590, "Kavya Arora"),
            new SalonSeed("Mehr Bridal Studio", Kind.BRIDAL, "Delhi", "Lajpat Nagar", "21 Central Market, Lajpat Nagar II", 28.5677, 77.2433, "Simran Kaur"),
            new SalonSeed("Nail Theory", Kind.NAILS, "Delhi", "Greater Kailash II", "M-31 M Block Market, GK II", 28.5300, 77.2430, "Aanya Kapoor"),
            new SalonSeed("Glow Lab Skin Studio", Kind.SKIN, "Delhi", "Defence Colony", "C-42 Defence Colony Market", 28.5743, 77.2321, "Dr. Neha Bansal"),
            new SalonSeed("Strands & Co.", Kind.UNISEX, "Gurugram", "DLF Phase 4", "Shop 18, Galleria Market, DLF Phase 4", 28.4673, 77.0811, "Mohit Sethi"),
            new SalonSeed("Sharp Edge Barbers", Kind.BARBER, "Gurugram", "Sector 29", "SCO 9, Sector 29 Market", 28.4690, 77.0646, "Aakash Yadav"),
            new SalonSeed("Saanjh Spa", Kind.SPA, "Gurugram", "Sohna Road", "2nd Floor, Omaxe City Centre, Sohna Road", 28.4089, 77.0420, "Pooja Khanna"),
            new SalonSeed("Looks Unisex Salon", Kind.UNISEX, "Noida", "Sector 62", "C-56 Sector 62", 28.6270, 77.3730, "Vivek Tyagi"),
            new SalonSeed("Shringar Bridal Lounge", Kind.BRIDAL, "Noida", "Sector 50", "A-12 Sector 50 Market", 28.5700, 77.3600, "Shalini Gupta"),
            new SalonSeed("Bandstand Hair Co.", Kind.UNISEX, "Mumbai", "Bandra West", "Hill Road, near Mehboob Studio, Bandra West", 19.0544, 72.8203, "Zoya D'Souza"),
            new SalonSeed("Colaba Cutting Room", Kind.BARBER, "Mumbai", "Colaba", "Shahid Bhagat Singh Road, Colaba", 18.9067, 72.8147, "Farhan Shaikh"),
            new SalonSeed("Juhu Shore Spa", Kind.SPA, "Mumbai", "Juhu", "Juhu Tara Road, Juhu", 19.1075, 72.8263, "Meera Iyer"),
            new SalonSeed("Polish Andheri", Kind.NAILS, "Mumbai", "Andheri West", "Lokhandwala Market, Andheri West", 19.1364, 72.8296, "Tanya Mehta"),
            new SalonSeed("Powai Glow Clinic", Kind.SKIN, "Mumbai", "Powai", "Hiranandani Gardens, Powai", 19.1176, 72.9060, "Dr. Aditi Kulkarni"),
            new SalonSeed("Dulhan by Rhea", Kind.BRIDAL, "Mumbai", "Dadar", "Ranade Road, Shivaji Park, Dadar West", 19.0270, 72.8380, "Rhea Patil"),
            new SalonSeed("Indiranagar Hair Lab", Kind.UNISEX, "Bengaluru", "Indiranagar", "100 Feet Road, HAL 2nd Stage, Indiranagar", 12.9719, 77.6412, "Karthik Rao"),
            new SalonSeed("Koramangala Barber Club", Kind.BARBER, "Bengaluru", "Koramangala", "80 Feet Road, 5th Block, Koramangala", 12.9352, 77.6245, "Arjun Nair"),
            new SalonSeed("Soukhya Ayurvedic Spa", Kind.SPA, "Bengaluru", "Jayanagar", "11th Main, 4th Block, Jayanagar", 12.9250, 77.5938, "Lakshmi Hegde"),
            new SalonSeed("Gloss Nail Bar", Kind.NAILS, "Bengaluru", "HSR Layout", "27th Main, Sector 1, HSR Layout", 12.9116, 77.6474, "Divya Shetty"),
            new SalonSeed("Whitefield Skin Studio", Kind.SKIN, "Bengaluru", "Whitefield", "ITPL Main Road, Whitefield", 12.9698, 77.7500, "Dr. Sneha Reddy"),
            new SalonSeed("Banjara Blowdry Bar", Kind.UNISEX, "Hyderabad", "Banjara Hills", "Road No. 12, Banjara Hills", 17.4126, 78.4482, "Sana Mirza"),
            new SalonSeed("Jubilee Grooming Co.", Kind.BARBER, "Hyderabad", "Jubilee Hills", "Road No. 36, Jubilee Hills", 17.4310, 78.4070, "Rahul Varma"),
            new SalonSeed("Nizam Bridal House", Kind.BRIDAL, "Hyderabad", "Himayatnagar", "Main Road, Himayatnagar", 17.4010, 78.4870, "Ayesha Khan"),
            new SalonSeed("Gachibowli Glow Spa", Kind.SPA, "Hyderabad", "Gachibowli", "DLF Cyber City Road, Gachibowli", 17.4401, 78.3489, "Swathi Reddy"),
            new SalonSeed("Anna Nagar Hair Studio", Kind.UNISEX, "Chennai", "Anna Nagar", "2nd Avenue, Anna Nagar", 13.0850, 80.2101, "Priya Raman"),
            new SalonSeed("Marina Barbers", Kind.BARBER, "Chennai", "Mylapore", "Luz Church Road, Mylapore", 13.0368, 80.2676, "Senthil Kumar"),
            new SalonSeed("Kalyani Bridal Studio", Kind.BRIDAL, "Chennai", "T. Nagar", "Usman Road, T. Nagar", 13.0418, 80.2341, "Kalyani Subramanian"),
            new SalonSeed("Adyar Skin & Glow", Kind.SKIN, "Chennai", "Adyar", "LB Road, Adyar", 13.0012, 80.2565, "Dr. Janani Krishnan"),
            new SalonSeed("Koregaon Park Salon", Kind.UNISEX, "Pune", "Koregaon Park", "North Main Road, Koregaon Park", 18.5362, 73.8940, "Ishaan Joshi"),
            new SalonSeed("Baner Barber House", Kind.BARBER, "Pune", "Baner", "Baner Road, near Balewadi Phata", 18.5590, 73.7868, "Omkar Deshmukh"),
            new SalonSeed("Sahyadri Spa", Kind.SPA, "Pune", "Kothrud", "Karve Road, Kothrud", 18.5074, 73.8077, "Gauri Kale"),
            new SalonSeed("Park Street Hair Co.", Kind.UNISEX, "Kolkata", "Park Street", "Park Street, near Allen Park", 22.5530, 88.3520, "Ananya Sen"),
            new SalonSeed("Salt Lake Grooming Lounge", Kind.BARBER, "Kolkata", "Salt Lake", "Sector V, Salt Lake", 22.5726, 88.4339, "Sourav Das"),
            new SalonSeed("Bou Bridal Studio", Kind.BRIDAL, "Kolkata", "Ballygunge", "Gariahat Road, Ballygunge", 22.5280, 88.3650, "Moumita Banerjee"),
            new SalonSeed("Pink City Salon & Spa", Kind.UNISEX, "Jaipur", "C-Scheme", "Prithviraj Road, C-Scheme", 26.9115, 75.8000, "Devika Rathore"),
            new SalonSeed("Rajwada Bridal Studio", Kind.BRIDAL, "Jaipur", "Malviya Nagar", "Gaurav Tower Road, Malviya Nagar", 26.8549, 75.8243, "Bhavna Shekhawat"),
            new SalonSeed("Jaipur Nail Atelier", Kind.NAILS, "Jaipur", "Vaishali Nagar", "Amrapali Marg, Vaishali Nagar", 26.9110, 75.7430, "Kritika Jain")
    );

    private static final Map<String, Double> CITY_PRICE_FACTOR = Map.of(
            "Mumbai", 1.15, "Bengaluru", 1.08, "Delhi", 1.05, "Gurugram", 1.1, "Hyderabad", 1.0,
            "Chennai", 0.98, "Pune", 0.97, "Noida", 0.95, "Kolkata", 0.92, "Jaipur", 0.88);

    // Verified Unsplash photos (hotlinked as Unsplash requires), grouped by subject.
    private static final List<String> INTERIOR = List.of(
            "1560066984-138dadb4c035", "1521590832167-7bcbfaa6381f", "1633681926022-84c23e8cb2d6",
            "1600948836101-f9ffda59d250", "1633681138600-295fcd688876", "1626383137804-ff908d2753a2",
            "1746723378067-83a345ff3160", "1637777277435-3c44f82fd0c9", "1781450090585-1a511b7066d9",
            "1763741141049-352dfafcc64f", "1536520002442-39764a41e987", "1695527081827-fdbc4e77be9b");
    private static final List<String> HAIR = List.of(
            "1562322140-8baeececf3df", "1580618672591-eb180b1a973f", "1522337360788-8b13dee7a37e",
            "1595476108010-b4d1f102b1b1", "1559599101-f09722fb4948", "1634449571010-02389ed0f9b0",
            "1629397685944-7073f5589754", "1695527081848-1e46c06e6458", "1527799820374-dcf8d9d4a388");
    private static final List<String> BARBER = List.of(
            "1585747860715-2ba37e788b70", "1773904215697-e6c21fc27ac2", "1790009419892-f6f3fd516fb2",
            "1790009419857-51fa0a2d9354", "1621645582931-d1d3e6564943", "1503951914875-452162b0f3f1",
            "1622286342621-4bd786c2447c", "1605497788044-5a32c7078486", "1541533848490-bc8115cd6522",
            "1647140655214-e4a2d914971f", "1657105052497-f996284ffff8", "1517832606299-7ae9b720a186",
            "1593702275687-f8b402bf1fb5", "1621605815971-fbc98d665033", "1493256338651-d82f7acb2b38");
    private static final List<String> SPA = List.of(
            "1544161515-4ab6ce6db874", "1600334089648-b0d9d3028eb2", "1540555700478-4be289fbecef",
            "1515377905703-c4788e51af15", "1519415510236-718bdfcd89c8", "1617897903246-719242758050",
            "1576426863848-c21f53c60b19");
    private static final List<String> SKIN = List.of(
            "1570172619644-dfd03ed5d881", "1616394584738-fc6e612e71b9", "1576426863848-c21f53c60b19",
            "1617897903246-719242758050", "1631729371254-42c2892f0e6e", "1589710751893-f9a6770ad71b");
    private static final List<String> MAKEUP = List.of(
            "1487412947147-5cebf100ffc2", "1596462502278-27bfdc403348", "1503236823255-94609f598e71",
            "1516975080664-ed2fc6a32937", "1589710751893-f9a6770ad71b");
    private static final List<String> BRIDAL = List.of(
            "1610173827043-9db50e0d8ef9", "1600685890506-593fdf55949b", "1610047614301-13c63f00c032",
            "1684868268327-7e5590bcfbd6", "1617633150878-7df1d12a9a57", "1684868265714-fd2300637c23",
            "1677691257363-eebd2abeafec", "1610030469983-98e550d6193c");
    private static final List<String> MEHENDI = List.of(
            "1505932794465-147d1f1b2c97", "1730003873829-09b4b16444c1", "1556536088-f010a312a8d3",
            "1730003727902-3643640a3d43", "1722172312997-068983715fd1", "1562508548-69377b81ab9e",
            "1525135927526-a01d9e5e9484");
    private static final List<String> NAILS = List.of(
            "1604654894610-df63bc536371", "1519014816548-bf5fe059798b", "1610992015732-2449b76344bc",
            "1457972729786-0411a3b2b626", "1632345031435-8727f6897d53", "1519415510236-718bdfcd89c8");

    private static final Map<Kind, List<ServiceSeed>> MENUS = Map.of(
            Kind.UNISEX, List.of(
                    new ServiceSeed("Hair", "Women's haircut & blow-dry", "Consultation, wash, precision cut and a smooth blow-dry finish.", 899, 60),
                    new ServiceSeed("Hair", "Men's haircut", "Wash, cut and style with a hot-towel neck finish.", 399, 30),
                    new ServiceSeed("Hair", "Kids' haircut", "Quick, patient cuts for under-12s.", 299, 25),
                    new ServiceSeed("Hair", "Blow-dry & styling", "Volume, waves or sleek — styled to last the day.", 699, 45),
                    new ServiceSeed("Hair", "Deep-conditioning hair spa", "Steam, mask and scalp massage for dry or frizzy hair.", 1299, 60),
                    new ServiceSeed("Colour", "Root touch-up", "Ammonia-free colour matched to your shade.", 1499, 60),
                    new ServiceSeed("Colour", "Global hair colour", "All-over colour with gloss finish. Price for shoulder length.", 3499, 120),
                    new ServiceSeed("Colour", "Balayage", "Hand-painted, lived-in highlights with toner.", 6499, 180),
                    new ServiceSeed("Colour", "Keratin smoothening", "Frizz control that lasts 3–4 months. Shoulder length.", 4999, 150),
                    new ServiceSeed("Skin", "Clean-up", "Cleanse, exfoliate, steam and extraction.", 799, 40),
                    new ServiceSeed("Skin", "Fruit facial", "Brightening facial with massage and mask.", 1199, 50),
                    new ServiceSeed("Threading & waxing", "Eyebrow threading", "Shaping to suit your face.", 60, 10),
                    new ServiceSeed("Threading & waxing", "Upper lip threading", "Quick and precise.", 40, 5),
                    new ServiceSeed("Threading & waxing", "Full arms waxing", "Rica liposoluble wax, gentle on skin.", 499, 30),
                    new ServiceSeed("Threading & waxing", "Full legs waxing", "Rica liposoluble wax, gentle on skin.", 699, 40)),
            Kind.BARBER, List.of(
                    new ServiceSeed("Haircuts", "Classic haircut", "Scissor or clipper cut, wash and style.", 299, 30),
                    new ServiceSeed("Haircuts", "Fade & style", "Skin, low or mid fade with a sharp line-up.", 449, 40),
                    new ServiceSeed("Haircuts", "Kids' cut", "For under-12s.", 249, 25),
                    new ServiceSeed("Beard", "Beard trim & shape", "Shape, line-up and beard oil.", 199, 20),
                    new ServiceSeed("Beard", "Royal shave", "Hot towel, straight razor and after-shave balm.", 349, 30),
                    new ServiceSeed("Beard", "Haircut + beard combo", "Our most-booked pairing.", 549, 50),
                    new ServiceSeed("Care", "Champi head massage", "Traditional oil champi to unwind.", 299, 20),
                    new ServiceSeed("Care", "Charcoal face clean-up", "Deep-cleanse for oily, city skin.", 599, 30),
                    new ServiceSeed("Care", "Men's hair colour", "Natural-looking colour or grey blending.", 699, 40)),
            Kind.SPA, List.of(
                    new ServiceSeed("Massages", "Swedish massage", "Long, flowing strokes to release everyday tension.", 2299, 60),
                    new ServiceSeed("Massages", "Balinese massage", "Acupressure and stretching with warm oil.", 2499, 60),
                    new ServiceSeed("Massages", "Deep tissue massage", "Firm pressure for knots and sore muscles.", 2799, 60),
                    new ServiceSeed("Massages", "Abhyanga (Ayurvedic oil)", "Warm herbal oil massage in the Kerala tradition.", 2999, 75),
                    new ServiceSeed("Massages", "Head, neck & shoulder", "Quick relief for desk-bound days.", 899, 30),
                    new ServiceSeed("Massages", "Foot reflexology", "Pressure-point therapy for tired feet.", 1199, 45),
                    new ServiceSeed("Body", "Body polish", "Exfoliating scrub and moisture wrap.", 2499, 60),
                    new ServiceSeed("Body", "Couple's massage", "Side-by-side Swedish massage for two.", 4999, 60)),
            Kind.BRIDAL, List.of(
                    new ServiceSeed("Bridal makeup", "HD bridal makeup", "Long-wear HD makeup, hairdo and dupatta setting.", 18999, 180),
                    new ServiceSeed("Bridal makeup", "Airbrush bridal makeup", "Lightweight airbrush finish that photographs beautifully.", 24999, 180),
                    new ServiceSeed("Bridal makeup", "Engagement / reception makeup", "Soft glam with hairstyle.", 8999, 120),
                    new ServiceSeed("Bridal makeup", "Bridal trial", "Full trial look, adjustable to the final booking.", 2499, 60),
                    new ServiceSeed("Party", "Party makeup", "Evening glam with lashes.", 3499, 75),
                    new ServiceSeed("Party", "Saree draping", "Nivi, Gujarati, Bengali or Maharashtrian styles.", 799, 30),
                    new ServiceSeed("Party", "Hairdo / bun styling", "Braids, buns and floral setting.", 1499, 45),
                    new ServiceSeed("Mehendi", "Bridal mehendi (hands & feet)", "Intricate full bridal design with natural henna.", 7999, 240),
                    new ServiceSeed("Mehendi", "Arabic mehendi", "Bold, flowing design for both hands.", 899, 45),
                    new ServiceSeed("Mehendi", "Guest mehendi (per hand)", "Quick designs for sangeet and mehendi guests.", 499, 30),
                    new ServiceSeed("Pre-bridal", "Pre-bridal package (3 sittings)", "Facials, body polish, mani-pedi and hair spa before the big day.", 9999, 180)),
            Kind.NAILS, List.of(
                    new ServiceSeed("Hands", "Classic manicure", "Shape, cuticle care, massage and polish.", 599, 40),
                    new ServiceSeed("Hands", "Gel polish", "Chip-free colour for up to three weeks.", 899, 45),
                    new ServiceSeed("Hands", "Gel extensions", "Natural-looking length with gel overlay.", 1999, 90),
                    new ServiceSeed("Hands", "Nail art (per set)", "From minimal lines to full designs.", 499, 30),
                    new ServiceSeed("Feet", "Classic pedicure", "Soak, scrub, massage and polish.", 799, 50),
                    new ServiceSeed("Feet", "Spa pedicure", "Extended scrub, mask and hot-towel wrap.", 1199, 60),
                    new ServiceSeed("Feet", "Gel polish (toes)", "Long-lasting colour for feet.", 699, 35)),
            Kind.SKIN, List.of(
                    new ServiceSeed("Facials", "Hydrating facial", "Deep hydration with lymphatic massage.", 2199, 60),
                    new ServiceSeed("Facials", "Vitamin C glow facial", "Brightening for dull, tired skin.", 2499, 60),
                    new ServiceSeed("Facials", "Hydra facial", "Cleanse, extract and infuse in one session.", 3499, 60),
                    new ServiceSeed("Treatments", "Chemical peel", "Gentle peel for texture and pigmentation.", 2999, 45),
                    new ServiceSeed("Treatments", "Dermaplaning", "Removes peach fuzz for a smooth base.", 1999, 40),
                    new ServiceSeed("Treatments", "Under-eye treatment", "Targets puffiness and dark circles.", 1499, 30),
                    new ServiceSeed("Threading", "Eyebrow threading", "Shaping to suit your face.", 60, 10)));

    private static final Map<Kind, List<String>> ABOUT = Map.of(
            Kind.UNISEX, List.of(
                    "A bright, easy-going unisex salon in %s known for precise cuts, lived-in colour and consultations that never feel rushed.",
                    "Neighbourhood favourite in %s for everyday haircuts, colour and hair spas. Stylists are trained in-house and every booking starts with a short consultation.",
                    "Modern salon in %s with a calm floor, good coffee and a team that listens. Known for blow-dries that actually last."),
            Kind.BARBER, List.of(
                    "Old-school barbershop in %s with modern fades. Hot towels, straight razors and a proper champi at the end.",
                    "Sharp cuts and clean beard work in %s. Walk-ins welcome when a chair is free; bookings get priority.",
                    "A no-fuss grooming lounge in %s — consistent fades, unhurried shaves and fair prices."),
            Kind.SPA, List.of(
                    "Quiet day spa in %s with private rooms, Ayurvedic oils and therapists trained in Kerala.",
                    "An urban retreat in %s for massages and body rituals. Showers, herbal tea and a no-phones lounge.",
                    "Calm, dimly lit spa in %s focused on deep tissue and traditional Indian therapies."),
            Kind.BRIDAL, List.of(
                    "Bridal and occasion makeup studio in %s. Trials, mehendi and pre-bridal packages under one roof.",
                    "Studio in %s for brides and their families — HD and airbrush makeup, draping, hair and mehendi.",
                    "Known across %s for soft, long-wear bridal looks that hold through pheras and photos."),
            Kind.NAILS, List.of(
                    "Clean, design-led nail bar in %s. Hospital-grade sterilisation and a big gel colour library.",
                    "Manicures, pedicures and nail art in %s — from minimal to statement sets.",
                    "A small nail studio in %s with a focus on long-lasting gels and healthy cuticles."),
            Kind.SKIN, List.of(
                    "Skin studio in %s run by certified aestheticians. Facials and peels tailored to Indian skin.",
                    "Results-focused facials and treatments in %s, with a short skin assessment before every session.",
                    "Clinical-grade skincare in a relaxed setting in %s. Consultations included with every treatment."));

    private static final Map<Kind, List<String>> REVIEW_TEXT = Map.of(
            Kind.UNISEX, List.of(
                    "Best haircut I've had in years. She actually listened to what I wanted and didn't rush.",
                    "Got a global colour done — even tone, no patchiness, and they explained aftercare properly.",
                    "Hair spa was so relaxing. My hair felt soft for a whole week.",
                    "Clean salon, on time, and the blow-dry lasted two days. Will be back.",
                    "Booked the keratin before a wedding — frizz is gone and it still looks natural.",
                    "Friendly staff and fair prices. Threading was quick and neat.",
                    "Took my son for a haircut, they were very patient with him.",
                    "Balayage turned out exactly like the reference photo. Worth every rupee."),
            Kind.BARBER, List.of(
                    "Cleanest fade in the area. Proper line-up and he didn't rush at all.",
                    "Royal shave with hot towel is a must. Felt like a new person after.",
                    "Consistent every single time. My go-to barber now.",
                    "Beard shape was spot on and the champi at the end was a bonus.",
                    "Booked on the app, walked in, zero waiting. That's how it should be.",
                    "Good vibe, good music and they know their fades.",
                    "Fair pricing for the quality. The combo is great value."),
            Kind.SPA, List.of(
                    "Deep tissue massage sorted out my back after weeks of desk work.",
                    "The Abhyanga was so calming. Therapist was skilled and professional.",
                    "Very clean rooms, soft music, and they asked about pressure preferences. Lovely.",
                    "Booked a couple's massage for our anniversary — perfect experience.",
                    "Foot reflexology after a long week was exactly what I needed.",
                    "Peaceful place, polite staff. The herbal tea afterwards was a nice touch."),
            Kind.BRIDAL, List.of(
                    "Did my bridal makeup and it lasted from the morning pheras to the reception. Looked so natural in photos!",
                    "The trial helped a lot — they adjusted the look until I loved it.",
                    "Mehendi colour came out deep and the design was stunning. Everyone asked who did it.",
                    "Booked party makeup for my sister's sangeet. Soft glam, exactly what I asked for.",
                    "Saree draping was perfect and stayed in place all evening.",
                    "Professional team, on time on the wedding day, and very calm under pressure.",
                    "Pre-bridal package was worth it — skin was glowing by the wedding week."),
            Kind.NAILS, List.of(
                    "Gel polish lasted three weeks without a single chip.",
                    "Nail art was so neat — they recreated my Pinterest design perfectly.",
                    "Very hygienic, tools opened in front of me. Pedicure was relaxing.",
                    "Extensions look natural and didn't damage my nails.",
                    "Lovely little studio and great colour options."),
            Kind.SKIN, List.of(
                    "Hydra facial made a visible difference to my skin texture.",
                    "They checked my skin type first and recommended the right facial. No upselling.",
                    "Chemical peel was gentle and my pigmentation is fading.",
                    "Clean, clinical but warm. The aesthetician explained everything.",
                    "Vitamin C facial before a function — skin looked fresh and bright."));

    /** Kind-neutral lines mixed into every salon's pool so no salon repeats a review. */
    private static final List<String> GENERIC_REVIEWS = List.of(
            "Booked through the app and they were ready on time. Smooth experience.",
            "Staff were polite and the place was spotless. Will definitely come back.",
            "Good value for the quality. Prices were exactly what the menu said.",
            "Second visit and just as good as the first. Consistent team.",
            "Easy to find, easy to book, and no waiting around.",
            "They took time to understand what I wanted. Happy with the result.",
            "Lovely ambience and very hygienic. Recommended to my friends already.");

    // Covers must show people or the space, not product close-ups.
    private static final List<String> SPA_COVERS = List.of(
            "1544161515-4ab6ce6db874", "1600334089648-b0d9d3028eb2", "1540555700478-4be289fbecef", "1519415510236-718bdfcd89c8");
    private static final List<String> SKIN_COVERS = List.of(
            "1570172619644-dfd03ed5d881", "1616394584738-fc6e612e71b9");

    private static final List<String> REVIEWERS = List.of(
            "Aditi Sharma", "Rohan Mehta", "Sneha Iyer", "Vikram Singh", "Priyanka Das", "Arjun Reddy",
            "Neha Gupta", "Karan Malhotra", "Ishita Banerjee", "Rahul Nair", "Ananya Joshi", "Siddharth Rao",
            "Pooja Verma", "Aman Khanna", "Meghna Pillai", "Varun Kapoor", "Tanvi Kulkarni", "Nikhil Jain",
            "Riya Chatterjee", "Abhishek Yadav", "Kavya Menon", "Harsh Agarwal", "Shreya Patil", "Manish Tiwari",
            "Divya Krishnan", "Yash Thakur", "Nandini Hegde", "Akash Pandey", "Simran Bhatia", "Gaurav Saxena",
            "Lavanya Subramanian", "Rajat Arora", "Mitali Ghosh", "Kunal Desai", "Sakshi Mishra", "Tarun Chauhan");

    // ---------------------------------------------------------------- run

    @Override
    @Transactional // photo refresh reads the lazy images collection of existing salons
    public void run(String... args) {
        if (!enabled) return;

        Random random = new Random(42);
        String unusablePassword = passwordEncoder.encode(UUID.randomUUID().toString());
        Role ownerRole = role(UserRole.SALON_OWNER);
        Role customerRole = role(UserRole.CUSTOMER);

        List<User> reviewers = new ArrayList<>();
        for (String name : REVIEWERS) {
            reviewers.add(user(name, "guest." + slug(name) + "@" + DOMAIN, UserRole.CUSTOMER, customerRole, unusablePassword));
        }

        int created = 0;
        Map<Kind, Integer> perKind = new java.util.EnumMap<>(Kind.class);
        for (int i = 0; i < SALONS.size(); i++) {
            SalonSeed seed = SALONS.get(i);
            // Photos rotate within a kind, so two bridal studios never share a cover.
            int ordinal = perKind.merge(seed.kind(), 1, Integer::sum) - 1;
            List<String> photos = images(seed.kind(), ordinal);
            String salonEmail = slug(seed.name()) + "@" + DOMAIN;
            var existing = salonRepository.findByEmailIgnoreCase(salonEmail);
            if (existing.isPresent()) {
                // Keep demo photos current when the curated set changes; nothing else is touched.
                Salon salon = existing.get();
                if (salon.getImages() == null || !photos.equals(new ArrayList<>(salon.getImages()))) {
                    salon.setImages(new ArrayList<>(photos));
                    salonRepository.save(salon);
                }
                continue;
            }

            User owner = user(seed.owner(), "owner." + slug(seed.name()) + "@" + DOMAIN,
                    UserRole.SALON_OWNER, ownerRole, unusablePassword);
            Salon salon = salonRepository.save(salon(seed, i, salonEmail, owner.getId(), photos, random));
            seedMenu(salon, seed, random);
            seedReviews(salon, seed, reviewers, random);
            salonStatsService.refresh(salon.getId());
            created++;
        }
        if (created > 0) {
            log.info("Demo marketplace: seeded {} salon(s) across {} cities", created,
                    SALONS.stream().map(SalonSeed::city).distinct().count());
        }
    }

    private Salon salon(SalonSeed seed, int index, String email, Long ownerId, List<String> photos, Random random) {
        Salon salon = new Salon();
        salon.setName(seed.name());
        salon.setCity(seed.city());
        // Streets usually already name the area ("Usman Road, T. Nagar"); don't repeat it.
        salon.setAddress(seed.street().contains(seed.area()) ? seed.street() : seed.street() + ", " + seed.area());
        salon.setLatitude(seed.lat());
        salon.setLongitude(seed.lng());
        salon.setEmail(email);
        salon.setPhoneNumber(String.format(Locale.ROOT, "+91 97%08d", 11_000_000 + index * 734_219 % 88_000_000));
        salon.setOwnerId(ownerId);
        salon.setDescription(String.format(pick(ABOUT.get(seed.kind()), random), seed.area()));
        LocalTime[] hours = hours(seed.kind(), random);
        salon.setOpenTime(hours[0]);
        salon.setCloseTime(hours[1]);
        salon.setImages(new ArrayList<>(photos));
        salon.setRatingAvg(0d);
        salon.setReviewCount(0);
        salon.setServiceCount(0);
        salon.setRankScore(4.0);
        return salon;
    }

    private void seedMenu(Salon salon, SalonSeed seed, Random random) {
        double factor = CITY_PRICE_FACTOR.getOrDefault(seed.city(), 1.0) * (0.88 + random.nextDouble() * 0.4);
        Map<String, Long> categoryIds = new LinkedHashMap<>();
        for (ServiceSeed s : MENUS.get(seed.kind())) {
            // Every salon carries most of the menu but not all of it, so menus differ.
            if (random.nextDouble() < 0.18) continue;
            Long categoryId = categoryIds.computeIfAbsent(s.category(), name -> {
                Category category = new Category();
                category.setName(name);
                category.setSalonId(salon.getId());
                return categoryRepository.save(category).getId();
            });
            ServiceOffering offering = new ServiceOffering();
            offering.setSalonId(salon.getId());
            offering.setCategoryId(categoryId);
            offering.setName(s.name());
            offering.setDescription(s.description());
            offering.setDuration(s.minutes());
            offering.setPrice((double) indianPrice(s.price() * factor));
            serviceOfferingRepository.save(offering);
        }
    }

    private void seedReviews(Salon salon, SalonSeed seed, List<User> reviewers, Random random) {
        List<String> texts = new ArrayList<>(REVIEW_TEXT.get(seed.kind()));
        texts.addAll(GENERIC_REVIEWS);
        java.util.Collections.shuffle(texts, random);
        int count = 3 + random.nextInt(9);
        List<User> pool = new ArrayList<>(reviewers);
        java.util.Collections.shuffle(pool, random);
        for (int i = 0; i < count && i < pool.size(); i++) {
            double roll = random.nextDouble();
            double rating = roll < 0.56 ? 5 : roll < 0.88 ? 4 : roll < 0.97 ? 3 : 2;
            Review review = new Review();
            review.setSalonId(salon.getId());
            review.setUserId(pool.get(i).getId());
            review.setRating(rating);
            review.setText(texts.get(i % texts.size()));
            Review saved = reviewRepository.save(review);
            // created_at is insert-only in the entity; backdate reviews so the feed looks lived-in.
            LocalDateTime when = LocalDateTime.now().minusDays(2 + random.nextInt(220)).minusMinutes(random.nextInt(600));
            jdbcTemplate.update("update reviews set created_at = ? where id = ?", Timestamp.valueOf(when), saved.getId());
        }
    }

    // ---------------------------------------------------------------- helpers

    private Role role(UserRole name) {
        return roleRepository.findByName(name).orElseGet(() -> roleRepository.save(new Role(null, name)));
    }

    private User user(String fullName, String email, UserRole roleName, Role role, String passwordHash) {
        return userRepository.findByEmailIgnoreCase(email).orElseGet(() -> {
            User user = new User();
            user.setFullName(fullName);
            user.setEmail(email);
            user.setUsername(email.substring(0, email.indexOf('@')));
            user.setRole(roleName);
            user.setPassword(passwordHash);
            user.setRoles(new HashSet<>(Set.of(role)));
            return userRepository.save(user);
        });
    }

    private static List<String> images(Kind kind, int index) {
        List<String> ids = new ArrayList<>();
        switch (kind) {
            case UNISEX -> {
                ids.add(at(INTERIOR, index));
                ids.add(at(HAIR, index));
                ids.add(at(HAIR, index + 3));
                ids.add(at(INTERIOR, index + 5));
                ids.add(at(SKIN, index));
            }
            case BARBER -> {
                ids.add(at(BARBER, index));
                ids.add(at(BARBER, index + 4));
                ids.add(at(BARBER, index + 8));
                ids.add(at(BARBER, index + 11));
                ids.add(at(INTERIOR, index + 2));
            }
            case SPA -> {
                ids.add(at(SPA_COVERS, index));
                ids.add(at(SPA, index));
                ids.add(at(SPA, index + 2));
                ids.add(at(SPA, index + 4));
                ids.add(at(INTERIOR, index + 7));
                ids.add(at(SKIN, index + 1));
            }
            case BRIDAL -> {
                ids.add(at(BRIDAL, index));
                ids.add(at(MEHENDI, index));
                ids.add(at(BRIDAL, index + 3));
                ids.add(at(MAKEUP, index));
                ids.add(at(MEHENDI, index + 3));
            }
            case NAILS -> {
                ids.add(at(NAILS, index));
                ids.add(at(NAILS, index + 2));
                ids.add(at(NAILS, index + 4));
                ids.add(at(INTERIOR, index + 4));
                ids.add(at(SPA, index + 3));
            }
            case SKIN -> {
                ids.add(at(SKIN_COVERS, index));
                ids.add(at(SKIN, index));
                ids.add(at(SKIN, index + 2));
                ids.add(at(INTERIOR, index + 9));
                ids.add(at(MAKEUP, index + 1));
                ids.add(at(SPA, index + 5));
            }
        }
        return ids.stream().distinct()
                .map(id -> "https://images.unsplash.com/photo-" + id + "?w=1200&q=80&auto=format&fit=crop")
                .toList();
    }

    private static LocalTime[] hours(Kind kind, Random random) {
        int[] base = switch (kind) {
            case BARBER -> new int[]{9 * 60, 21 * 60};
            case SPA -> new int[]{10 * 60, 22 * 60};
            case BRIDAL -> new int[]{9 * 60, 19 * 60};
            case NAILS -> new int[]{11 * 60, 21 * 60};
            case SKIN -> new int[]{10 * 60, 19 * 60 + 30};
            default -> new int[]{10 * 60, 20 * 60 + 30};
        };
        int shift = (random.nextInt(3) - 1) * 30;
        return new LocalTime[]{LocalTime.of(0, 0).plusMinutes(base[0] + shift), LocalTime.of(0, 0).plusMinutes(base[1] + shift)};
    }

    /** Rounds to the way Indian salons price: ₹40, ₹60, ₹299, ₹1,499, ₹18,999. */
    private static int indianPrice(double raw) {
        if (raw < 100) return (int) Math.max(30, Math.round(raw / 10.0) * 10);
        if (raw < 1000) return (int) (Math.round(raw / 50.0) * 50 - 1);
        return (int) (Math.round(raw / 100.0) * 100 - 1);
    }

    private static <T> T at(List<T> list, int index) {
        return list.get(Math.floorMod(index, list.size()));
    }

    private static <T> T pick(List<T> list, Random random) {
        return list.get(random.nextInt(list.size()));
    }

    private static String slug(String value) {
        return value.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", ".").replaceAll("^\\.|\\.$", "");
    }
}


