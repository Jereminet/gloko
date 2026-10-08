export interface CityInfo {
  name: string;
  coordinates: [number, number]; // [longitude, latitude]
  population?: string;
  isCapital?: boolean;
}

// Biggest cities per country indexed by 3-digit world-atlas numeric ID and 2-letter ISO code
export const BIGGEST_CITIES_BY_COUNTRY: Record<string, CityInfo[]> = {
  // France (250 / FR)
  "250": [
    { name: "Paris", coordinates: [2.3522, 48.8566], isCapital: true },
    { name: "Marseille", coordinates: [5.3698, 43.2965] },
    { name: "Lyon", coordinates: [4.8357, 45.7640] },
    { name: "Toulouse", coordinates: [1.4442, 43.6047] },
    { name: "Nice", coordinates: [7.2620, 43.7102] },
    { name: "Bordeaux", coordinates: [-0.5792, 44.8378] },
    { name: "Strasbourg", coordinates: [7.7521, 48.5734] },
  ],
  "FR": [
    { name: "Paris", coordinates: [2.3522, 48.8566], isCapital: true },
    { name: "Marseille", coordinates: [5.3698, 43.2965] },
    { name: "Lyon", coordinates: [4.8357, 45.7640] },
    { name: "Toulouse", coordinates: [1.4442, 43.6047] },
    { name: "Nice", coordinates: [7.2620, 43.7102] },
    { name: "Bordeaux", coordinates: [-0.5792, 44.8378] },
  ],

  // Germany (276 / DE)
  "276": [
    { name: "Berlin", coordinates: [13.4050, 52.5200], isCapital: true },
    { name: "Hamburg", coordinates: [9.9937, 53.5511] },
    { name: "Munich", coordinates: [11.5820, 48.1351] },
    { name: "Cologne", coordinates: [6.9603, 50.9375] },
    { name: "Frankfurt", coordinates: [8.6821, 50.1109] },
    { name: "Stuttgart", coordinates: [9.1829, 48.7758] },
    { name: "Düsseldorf", coordinates: [6.7735, 51.2277] },
  ],
  "DE": [
    { name: "Berlin", coordinates: [13.4050, 52.5200], isCapital: true },
    { name: "Hamburg", coordinates: [9.9937, 53.5511] },
    { name: "Munich", coordinates: [11.5820, 48.1351] },
    { name: "Cologne", coordinates: [6.9603, 50.9375] },
    { name: "Frankfurt", coordinates: [8.6821, 50.1109] },
  ],

  // Russia (643 / RU)
  "643": [
    { name: "Moscow", coordinates: [37.6173, 55.7558], isCapital: true },
    { name: "Saint Petersburg", coordinates: [30.3351, 59.9343] },
    { name: "Novosibirsk", coordinates: [82.9357, 55.0084] },
    { name: "Yekaterinburg", coordinates: [60.6122, 56.8389] },
    { name: "Kazan", coordinates: [49.1221, 55.7961] },
    { name: "Nizhny Novgorod", coordinates: [44.0020, 56.3269] },
    { name: "Vladivostok", coordinates: [131.8735, 43.1198] },
  ],
  "RU": [
    { name: "Moscow", coordinates: [37.6173, 55.7558], isCapital: true },
    { name: "Saint Petersburg", coordinates: [30.3351, 59.9343] },
    { name: "Novosibirsk", coordinates: [82.9357, 55.0084] },
    { name: "Yekaterinburg", coordinates: [60.6122, 56.8389] },
    { name: "Vladivostok", coordinates: [131.8735, 43.1198] },
  ],

  // United States (840 / US)
  "840": [
    { name: "Washington, D.C.", coordinates: [-77.0369, 38.9072], isCapital: true },
    { name: "New York", coordinates: [-74.0060, 40.7128] },
    { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
    { name: "Chicago", coordinates: [-87.6298, 41.8781] },
    { name: "Houston", coordinates: [-95.3698, 29.7604] },
    { name: "Miami", coordinates: [-80.1918, 25.7617] },
    { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
    { name: "Seattle", coordinates: [-122.3321, 47.6062] },
  ],
  "US": [
    { name: "Washington, D.C.", coordinates: [-77.0369, 38.9072], isCapital: true },
    { name: "New York", coordinates: [-74.0060, 40.7128] },
    { name: "Los Angeles", coordinates: [-118.2437, 34.0522] },
    { name: "Chicago", coordinates: [-87.6298, 41.8781] },
    { name: "Miami", coordinates: [-80.1918, 25.7617] },
    { name: "San Francisco", coordinates: [-122.4194, 37.7749] },
  ],

  // United Kingdom (826 / GB)
  "826": [
    { name: "London", coordinates: [-0.1278, 51.5074], isCapital: true },
    { name: "Birmingham", coordinates: [-1.8904, 52.4862] },
    { name: "Manchester", coordinates: [-2.2426, 53.4808] },
    { name: "Edinburgh", coordinates: [-3.1883, 55.9533] },
    { name: "Glasgow", coordinates: [-4.2518, 55.8642] },
    { name: "Belfast", coordinates: [-5.9301, 54.5973] },
  ],

  // Spain (724 / ES)
  "724": [
    { name: "Madrid", coordinates: [-3.7038, 40.4168], isCapital: true },
    { name: "Barcelona", coordinates: [2.1734, 41.3851] },
    { name: "Valencia", coordinates: [-0.3763, 39.4699] },
    { name: "Seville", coordinates: [-5.9845, 37.3891] },
    { name: "Zaragoza", coordinates: [-0.8891, 41.6488] },
    { name: "Málaga", coordinates: [-4.4214, 36.7213] },
    { name: "Bilbao", coordinates: [-2.9350, 43.2630] },
  ],

  // Italy (380 / IT)
  "380": [
    { name: "Rome", coordinates: [12.4964, 41.9028], isCapital: true },
    { name: "Milan", coordinates: [9.1900, 45.4642] },
    { name: "Naples", coordinates: [14.2681, 40.8518] },
    { name: "Turin", coordinates: [7.6869, 45.0703] },
    { name: "Florence", coordinates: [11.2558, 43.7696] },
    { name: "Venice", coordinates: [12.3155, 45.4408] },
    { name: "Palermo", coordinates: [13.3615, 38.1157] },
  ],

  // Japan (392 / JP)
  "392": [
    { name: "Tokyo", coordinates: [139.6917, 35.6895], isCapital: true },
    { name: "Yokohama", coordinates: [139.6380, 35.4437] },
    { name: "Osaka", coordinates: [135.5023, 34.6937] },
    { name: "Nagoya", coordinates: [136.9066, 35.1815] },
    { name: "Sapporo", coordinates: [141.3545, 43.0618] },
    { name: "Kyoto", coordinates: [135.7681, 35.0116] },
    { name: "Fukuoka", coordinates: [130.4017, 33.5904] },
  ],

  // China (156 / CN)
  "156": [
    { name: "Beijing", coordinates: [116.4074, 39.9042], isCapital: true },
    { name: "Shanghai", coordinates: [121.4737, 31.2304] },
    { name: "Guangzhou", coordinates: [113.2644, 23.1291] },
    { name: "Shenzhen", coordinates: [114.0579, 22.5431] },
    { name: "Chengdu", coordinates: [104.0668, 30.5728] },
    { name: "Wuhan", coordinates: [114.3055, 30.5928] },
    { name: "Xi'an", coordinates: [108.9398, 34.3416] },
  ],

  // India (356 / IN)
  "356": [
    { name: "New Delhi", coordinates: [77.2090, 28.6139], isCapital: true },
    { name: "Mumbai", coordinates: [72.8777, 19.0760] },
    { name: "Bengaluru", coordinates: [77.5946, 12.9716] },
    { name: "Kolkata", coordinates: [88.3639, 22.5726] },
    { name: "Chennai", coordinates: [80.2707, 13.0827] },
    { name: "Hyderabad", coordinates: [78.4867, 17.3850] },
  ],

  // Brazil (076 / BR)
  "076": [
    { name: "Brasília", coordinates: [-47.8825, -15.7942], isCapital: true },
    { name: "São Paulo", coordinates: [-46.6333, -23.5505] },
    { name: "Rio de Janeiro", coordinates: [-43.1729, -22.9068] },
    { name: "Salvador", coordinates: [-38.5108, -12.9777] },
    { name: "Fortaleza", coordinates: [-38.5433, -3.7172] },
    { name: "Belo Horizonte", coordinates: [-43.9378, -19.9208] },
    { name: "Manaus", coordinates: [-60.0217, -3.1190] },
  ],

  // Canada (124 / CA)
  "124": [
    { name: "Ottawa", coordinates: [-75.6972, 45.4215], isCapital: true },
    { name: "Toronto", coordinates: [-79.3832, 43.6532] },
    { name: "Montreal", coordinates: [-73.5673, 45.5017] },
    { name: "Vancouver", coordinates: [-123.1207, 49.2827] },
    { name: "Calgary", coordinates: [-114.0719, 51.0447] },
    { name: "Edmonton", coordinates: [-113.4909, 53.5444] },
    { name: "Quebec City", coordinates: [-71.2082, 46.8139] },
  ],

  // Australia (036 / AU)
  "036": [
    { name: "Canberra", coordinates: [149.1300, -35.2809], isCapital: true },
    { name: "Sydney", coordinates: [151.2093, -33.8688] },
    { name: "Melbourne", coordinates: [144.9631, -37.8136] },
    { name: "Brisbane", coordinates: [153.0251, -27.4698] },
    { name: "Perth", coordinates: [115.8605, -31.9505] },
    { name: "Adelaide", coordinates: [138.6007, -34.9285] },
  ],

  // Mexico (484 / MX)
  "484": [
    { name: "Mexico City", coordinates: [-99.1332, 19.4326], isCapital: true },
    { name: "Guadalajara", coordinates: [-103.3496, 20.6597] },
    { name: "Monterrey", coordinates: [-100.3161, 25.6866] },
    { name: "Puebla", coordinates: [-98.2063, 19.0414] },
    { name: "Tijuana", coordinates: [-117.0382, 32.5149] },
    { name: "Cancun", coordinates: [-86.8515, 21.1619] },
  ],

  // Argentina (032 / AR)
  "032": [
    { name: "Buenos Aires", coordinates: [-58.3816, -34.6037], isCapital: true },
    { name: "Córdoba", coordinates: [-64.1888, -31.4201] },
    { name: "Rosario", coordinates: [-60.6393, -32.9468] },
    { name: "Mendoza", coordinates: [-68.8458, -32.8895] },
    { name: "Bariloche", coordinates: [-71.3082, -41.1335] },
  ],

  // South Africa (710 / ZA)
  "710": [
    { name: "Pretoria", coordinates: [28.1950, -25.7479], isCapital: true },
    { name: "Johannesburg", coordinates: [28.0473, -26.2041] },
    { name: "Cape Town", coordinates: [18.4241, -33.9249] },
    { name: "Durban", coordinates: [31.0218, -29.8587] },
    { name: "Port Elizabeth", coordinates: [25.6022, -33.9608] },
  ],

  // Egypt (818 / EG)
  "818": [
    { name: "Cairo", coordinates: [31.2357, 30.0444], isCapital: true },
    { name: "Alexandria", coordinates: [29.9187, 31.2001] },
    { name: "Giza", coordinates: [31.1313, 29.9870] },
    { name: "Luxor", coordinates: [32.6396, 25.6872] },
    { name: "Aswan", coordinates: [32.8998, 24.0889] },
  ],

  // Turkey (792 / TR)
  "792": [
    { name: "Ankara", coordinates: [32.8597, 39.9334], isCapital: true },
    { name: "Istanbul", coordinates: [28.9784, 41.0082] },
    { name: "Izmir", coordinates: [27.1428, 38.4237] },
    { name: "Antalya", coordinates: [30.7133, 36.8969] },
    { name: "Bursa", coordinates: [29.0610, 40.1885] },
  ],

  // South Korea (410 / KR)
  "410": [
    { name: "Seoul", coordinates: [126.9780, 37.5665], isCapital: true },
    { name: "Busan", coordinates: [129.0756, 35.1796] },
    { name: "Incheon", coordinates: [126.7052, 37.4563] },
    { name: "Daegu", coordinates: [128.6014, 35.8714] },
    { name: "Daejeon", coordinates: [127.3845, 36.3504] },
    { name: "Jeju City", coordinates: [126.5312, 33.4996] },
  ],

  // Thailand (764 / TH)
  "764": [
    { name: "Bangkok", coordinates: [100.5018, 13.7563], isCapital: true },
    { name: "Chiang Mai", coordinates: [98.9853, 18.7883] },
    { name: "Phuket", coordinates: [98.3923, 7.8804] },
    { name: "Pattaya", coordinates: [100.8771, 12.9276] },
    { name: "Hat Yai", coordinates: [100.4747, 7.0087] },
  ],

  // Vietnam (704 / VN)
  "704": [
    { name: "Hanoi", coordinates: [105.8342, 21.0278], isCapital: true },
    { name: "Ho Chi Minh City", coordinates: [106.6297, 10.8231] },
    { name: "Da Nang", coordinates: [108.2022, 16.0544] },
    { name: "Hai Phong", coordinates: [106.6881, 20.8449] },
    { name: "Nha Trang", coordinates: [109.1967, 12.2388] },
  ],

  // Indonesia (360 / ID)
  "360": [
    { name: "Jakarta", coordinates: [106.8456, -6.2088], isCapital: true },
    { name: "Surabaya", coordinates: [112.7521, -7.2575] },
    { name: "Bandung", coordinates: [107.6191, -6.9175] },
    { name: "Medan", coordinates: [98.6722, 3.5952] },
    { name: "Denpasar (Bali)", coordinates: [115.2167, -8.6705] },
  ],

  // Netherlands (528 / NL)
  "528": [
    { name: "Amsterdam", coordinates: [4.9041, 52.3676], isCapital: true },
    { name: "Rotterdam", coordinates: [4.4777, 51.9244] },
    { name: "The Hague", coordinates: [4.3007, 52.0705] },
    { name: "Utrecht", coordinates: [5.1214, 52.0907] },
    { name: "Eindhoven", coordinates: [5.4697, 51.4416] },
  ],

  // Belgium (056 / BE)
  "056": [
    { name: "Brussels", coordinates: [4.3517, 50.8503], isCapital: true },
    { name: "Antwerp", coordinates: [4.4025, 51.2194] },
    { name: "Ghent", coordinates: [3.7174, 51.0543] },
    { name: "Bruges", coordinates: [3.2247, 51.2093] },
    { name: "Liège", coordinates: [5.5797, 50.6326] },
  ],

  // Switzerland (756 / CH)
  "756": [
    { name: "Bern", coordinates: [7.4474, 46.9480], isCapital: true },
    { name: "Zurich", coordinates: [8.5417, 47.3769] },
    { name: "Geneva", coordinates: [6.1432, 46.2044] },
    { name: "Basel", coordinates: [7.5886, 47.5596] },
    { name: "Lausanne", coordinates: [6.6323, 46.5197] },
  ],

  // Sweden (752 / SE)
  "752": [
    { name: "Stockholm", coordinates: [18.0686, 59.3293], isCapital: true },
    { name: "Gothenburg", coordinates: [11.9746, 57.7089] },
    { name: "Malmö", coordinates: [12.9996, 55.6050] },
    { name: "Uppsala", coordinates: [17.6389, 59.8586] },
  ],

  // Norway (578 / NO)
  "578": [
    { name: "Oslo", coordinates: [10.7522, 59.9139], isCapital: true },
    { name: "Bergen", coordinates: [5.3221, 60.3913] },
    { name: "Trondheim", coordinates: [10.3951, 63.4305] },
    { name: "Stavanger", coordinates: [5.7331, 58.9699] },
    { name: "Tromsø", coordinates: [18.9553, 69.6492] },
  ],

  // Denmark (208 / DK)
  "208": [
    { name: "Copenhagen", coordinates: [12.5683, 55.6761], isCapital: true },
    { name: "Aarhus", coordinates: [10.2039, 56.1629] },
    { name: "Odense", coordinates: [10.3883, 55.4038] },
    { name: "Aalborg", coordinates: [9.9217, 57.0488] },
  ],

  // Poland (616 / PL)
  "616": [
    { name: "Warsaw", coordinates: [21.0122, 52.2297], isCapital: true },
    { name: "Krakow", coordinates: [19.9450, 50.0647] },
    { name: "Wrocław", coordinates: [17.0385, 51.1079] },
    { name: "Gdańsk", coordinates: [18.6466, 54.3520] },
    { name: "Poznań", coordinates: [16.9252, 52.4064] },
  ],

  // Portugal (620 / PT)
  "620": [
    { name: "Lisbon", coordinates: [-9.1393, 38.7223], isCapital: true },
    { name: "Porto", coordinates: [-8.6291, 41.1579] },
    { name: "Coimbra", coordinates: [-8.4117, 40.2033] },
    { name: "Faro", coordinates: [-7.9304, 37.0194] },
    { name: "Braga", coordinates: [-8.4265, 41.5454] },
  ],

  // Greece (300 / GR)
  "300": [
    { name: "Athens", coordinates: [23.7275, 37.9838], isCapital: true },
    { name: "Thessaloniki", coordinates: [22.9444, 40.6401] },
    { name: "Patras", coordinates: [21.7346, 38.2466] },
    { name: "Heraklion", coordinates: [25.1442, 35.3387] },
  ],

  // Ireland (372 / IE)
  "372": [
    { name: "Dublin", coordinates: [-6.2603, 53.3498], isCapital: true },
    { name: "Cork", coordinates: [-8.4756, 51.8985] },
    { name: "Galway", coordinates: [-9.0568, 53.2707] },
    { name: "Limerick", coordinates: [-8.6267, 52.6638] },
  ],

  // Austria (040 / AT)
  "040": [
    { name: "Vienna", coordinates: [16.3738, 48.2082], isCapital: true },
    { name: "Graz", coordinates: [15.4395, 47.0707] },
    { name: "Linz", coordinates: [14.2858, 48.3069] },
    { name: "Salzburg", coordinates: [13.0550, 47.8095] },
    { name: "Innsbruck", coordinates: [11.4041, 47.2692] },
  ],

  // New Zealand (554 / NZ)
  "554": [
    { name: "Wellington", coordinates: [174.7762, -41.2865], isCapital: true },
    { name: "Auckland", coordinates: [174.7633, -36.8485] },
    { name: "Christchurch", coordinates: [172.6362, -43.5321] },
    { name: "Queenstown", coordinates: [168.6626, -45.0312] },
  ],

  // Saudi Arabia (682 / SA)
  "682": [
    { name: "Riyadh", coordinates: [46.6753, 24.7136], isCapital: true },
    { name: "Jeddah", coordinates: [39.1925, 21.4858] },
    { name: "Mecca", coordinates: [39.8579, 21.3891] },
    { name: "Medina", coordinates: [39.6122, 24.5247] },
    { name: "Dammam", coordinates: [50.1033, 26.4207] },
  ],

  // United Arab Emirates (784 / AE)
  "784": [
    { name: "Abu Dhabi", coordinates: [54.3773, 24.4539], isCapital: true },
    { name: "Dubai", coordinates: [55.2708, 25.2048] },
    { name: "Sharjah", coordinates: [55.4209, 25.3463] },
  ],

  // Morocco (504 / MA)
  "504": [
    { name: "Rabat", coordinates: [-6.8498, 34.0209], isCapital: true },
    { name: "Casablanca", coordinates: [-7.5898, 33.5731] },
    { name: "Marrakech", coordinates: [-7.9811, 31.6295] },
    { name: "Fes", coordinates: [-4.9998, 34.0181] },
    { name: "Tangier", coordinates: [-5.8340, 35.7595] },
  ],

  // Nigeria (566 / NG)
  "566": [
    { name: "Abuja", coordinates: [7.4951, 9.0579], isCapital: true },
    { name: "Lagos", coordinates: [3.3792, 6.5244] },
    { name: "Kano", coordinates: [8.5167, 12.0000] },
    { name: "Ibadan", coordinates: [3.9000, 7.3775] },
  ],

  // Kenya (404 / KE)
  "404": [
    { name: "Nairobi", coordinates: [36.8219, -1.2921], isCapital: true },
    { name: "Mombasa", coordinates: [39.6682, -4.0435] },
    { name: "Kisumu", coordinates: [34.7680, -0.0917] },
  ],

  // Colombia (170 / CO)
  "170": [
    { name: "Bogota", coordinates: [-74.0721, 4.7110], isCapital: true },
    { name: "Medellín", coordinates: [-75.5644, 6.2442] },
    { name: "Cali", coordinates: [-76.5320, 3.4516] },
    { name: "Cartagena", coordinates: [-75.5144, 10.3910] },
  ],

  // Chile (152 / CL)
  "152": [
    { name: "Santiago", coordinates: [-70.6693, -33.4489], isCapital: true },
    { name: "Valparaíso", coordinates: [-71.6127, -33.0472] },
    { name: "Concepción", coordinates: [-73.0498, -36.8270] },
  ],

  // Peru (604 / PE)
  "604": [
    { name: "Lima", coordinates: [-77.0428, -12.0464], isCapital: true },
    { name: "Cusco", coordinates: [-71.9675, -13.5319] },
    { name: "Arequipa", coordinates: [-71.5375, -16.4090] },
  ],

  // Singapore (702 / SG)
  "702": [
    { name: "Singapore", coordinates: [103.8198, 1.3521], isCapital: true },
  ],

  // Philippines (608 / PH)
  "608": [
    { name: "Manila", coordinates: [120.9842, 14.5995], isCapital: true },
    { name: "Quezon City", coordinates: [121.0509, 14.6760] },
    { name: "Cebu City", coordinates: [123.8854, 10.3157] },
    { name: "Davao City", coordinates: [125.6128, 7.1907] },
  ],

  // Malaysia (458 / MY)
  "458": [
    { name: "Kuala Lumpur", coordinates: [101.6869, 3.1390], isCapital: true },
    { name: "George Town (Penang)", coordinates: [100.3327, 5.4164] },
    { name: "Johor Bahru", coordinates: [103.7618, 1.4927] },
  ],

  // Ukraine (804 / UA)
  "804": [
    { name: "Kyiv", coordinates: [30.5234, 50.4501], isCapital: true },
    { name: "Kharkiv", coordinates: [36.2304, 49.9935] },
    { name: "Odesa", coordinates: [30.7233, 46.4825] },
    { name: "Lviv", coordinates: [24.0297, 49.8397] },
  ],

  // Czech Republic (203 / CZ)
  "203": [
    { name: "Prague", coordinates: [14.4378, 50.0755], isCapital: true },
    { name: "Brno", coordinates: [16.6068, 49.1951] },
    { name: "Ostrava", coordinates: [18.2820, 49.8209] },
  ],

  // Hungary (348 / HU)
  "348": [
    { name: "Budapest", coordinates: [19.0402, 47.4979], isCapital: true },
    { name: "Debrecen", coordinates: [21.6273, 47.5316] },
    { name: "Szeged", coordinates: [20.1414, 46.2530] },
  ],

  // Israel (376 / IL)
  "376": [
    { name: "Jerusalem", coordinates: [35.2137, 31.7683], isCapital: true },
    { name: "Tel Aviv", coordinates: [34.7818, 32.0853] },
    { name: "Haifa", coordinates: [34.9896, 32.7940] },
  ],

  // Finland (246 / FI)
  "246": [
    { name: "Helsinki", coordinates: [24.9384, 60.1699], isCapital: true },
    { name: "Espoo", coordinates: [24.6559, 60.2055] },
    { name: "Tampere", coordinates: [23.7610, 61.4978] },
    { name: "Turku", coordinates: [22.2687, 60.4518] },
  ],

  // Iceland (352 / IS)
  "352": [
    { name: "Reykjavík", coordinates: [-21.9426, 64.1466], isCapital: true },
    { name: "Akureyri", coordinates: [-18.0878, 65.6885] },
  ],

  // Croatia (191 / HR)
  "191": [
    { name: "Zagreb", coordinates: [15.9819, 45.8150], isCapital: true },
    { name: "Split", coordinates: [16.4402, 43.5081] },
    { name: "Dubrovnik", coordinates: [18.0944, 42.6507] },
  ],

  // Romania (642 / RO)
  "642": [
    { name: "Bucharest", coordinates: [26.1025, 44.4268], isCapital: true },
    { name: "Cluj-Napoca", coordinates: [23.5914, 46.7712] },
    { name: "Timișoara", coordinates: [21.2087, 45.7489] },
  ],

  // Algeria (012 / DZ)
  "012": [
    { name: "Algiers", coordinates: [3.0588, 36.7538], isCapital: true },
    { name: "Oran", coordinates: [-0.6417, 35.6987] },
    { name: "Constantine", coordinates: [6.6147, 36.3650] },
  ],

  // Pakistan (586 / PK)
  "586": [
    { name: "Islamabad", coordinates: [73.0479, 33.6844], isCapital: true },
    { name: "Karachi", coordinates: [67.0011, 24.8607] },
    { name: "Lahore", coordinates: [74.3587, 31.5204] },
  ],

  // Taiwan (158 / TW)
  "158": [
    { name: "Taipei", coordinates: [121.5654, 25.0330], isCapital: true },
    { name: "Kaohsiung", coordinates: [120.3120, 22.6273] },
    { name: "Taichung", coordinates: [120.6736, 24.1477] },
  ],

  // Ghana (288 / GH)
  "288": [
    { name: "Accra", coordinates: [-0.1870, 5.6037], isCapital: true },
    { name: "Kumasi", coordinates: [-1.6244, 6.6885] },
  ],

  // Tanzania (834 / TZ)
  "834": [
    { name: "Dar es Salaam", coordinates: [39.2083, -6.7924] },
    { name: "Dodoma", coordinates: [35.7516, -6.1630], isCapital: true },
    { name: "Zanzibar City", coordinates: [39.1994, -6.1659] },
  ],

  // Ecuador (218 / EC)
  "218": [
    { name: "Quito", coordinates: [-78.4678, -0.1807], isCapital: true },
    { name: "Guayaquil", coordinates: [-79.9224, -2.1894] },
  ],

  // Bolivia (068 / BO)
  "068": [
    { name: "La Paz", coordinates: [-68.1193, -16.4897], isCapital: true },
    { name: "Santa Cruz", coordinates: [-63.1806, -17.7833] },
  ],

  // Costa Rica (188 / CR)
  "188": [
    { name: "San José", coordinates: [-84.0907, 9.9281], isCapital: true },
  ],

  // Panama (591 / PA)
  "591": [
    { name: "Panama City", coordinates: [-79.5167, 8.9833], isCapital: true },
  ],

  // Cuba (192 / CU)
  "192": [
    { name: "Havana", coordinates: [-82.3666, 23.1136], isCapital: true },
  ],

  // Jordan (400 / JO)
  "400": [
    { name: "Amman", coordinates: [35.9284, 31.9454], isCapital: true },
  ],

  // Lebanon (422 / LB)
  "422": [
    { name: "Beirut", coordinates: [35.5018, 33.8938], isCapital: true },
  ],

  // Nepal (524 / NP)
  "524": [
    { name: "Kathmandu", coordinates: [85.3240, 27.7172], isCapital: true },
    { name: "Pokhara", coordinates: [83.9856, 28.2096] },
  ],
};

export function getBiggestCities(countryIdOrCode: string): CityInfo[] {
  if (!countryIdOrCode) return [];
  const paddedId = countryIdOrCode.padStart(3, '0');
  if (BIGGEST_CITIES_BY_COUNTRY[paddedId]) {
    return BIGGEST_CITIES_BY_COUNTRY[paddedId];
  }
  const upperCode = countryIdOrCode.toUpperCase();
  if (BIGGEST_CITIES_BY_COUNTRY[upperCode]) {
    return BIGGEST_CITIES_BY_COUNTRY[upperCode];
  }
  return [];
}
