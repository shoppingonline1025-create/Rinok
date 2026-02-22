// ============================================
// ДАННЫЕ - v7.6 - 2026-02-22
// ИЕРАРХИЯ: Марка → Модель → Версия
// ============================================
//
// МАРКИ В ИЕРАРХИЧЕСКОЙ СТРУКТУРЕ:
// ✅ Audi (18 моделей)
// ✅ BMW (17 моделей)  
// ✅ Mercedes (27 моделей)
// ✅ Honda (13 моделей)
//
// Остальные марки в старом формате (совместимость)
// ============================================

// РАСШИРЕННЫЙ справочник марок и моделей
const BRANDS_DATA = {
  car: {
    'Abarth': ['124 Spider', '500', '595', '595C', '695', '695C', 'Grande Punto'],
    'Acura': ['ILX', 'MDX', 'NSX', 'RDX', 'RLX', 'TLX', 'ZDX', 'Integra', 'Legend', 'RL', 'RSX', 'TSX'],
    'Alfa Romeo': ['4C', '147', '156', '159', '166', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV', 'MiTo', 'Spider', 'Stelvio', 'Tonale'],
    'Aston Martin': ['DB11', 'DB9', 'DBS', 'DBX', 'Rapide', 'V8 Vantage', 'V12 Vantage', 'Vanquish', 'Vantage'],
    
    // ═══ AUDI - Иерархическая структура ═══
    'Audi': {
      'A1': ['1.0', '1.2', '1.4', '1.6', '2.0'],
      'A3': ['1.2', '1.4', '1.6', '1.8', '2.0', '2.0 TDI', 'Sportback'],
      'A4': ['1.6', '1.8', '1.8T', '2.0', '2.0 TDI', '2.4', '2.5 TDI', '2.8', '3.0', '3.0 TDI', '3.2', 'Allroad'],
      'A5': ['1.8', '2.0', '2.0 TDI', '2.7 TDI', '3.0', '3.0 TDI', '3.2', 'Sportback'],
      'A6': ['1.8', '2.0', '2.0 TDI', '2.4', '2.5 TDI', '2.7', '2.7 TDI', '2.8', '3.0', '3.0 TDI', '3.2', '4.2', 'Allroad'],
      'A7': ['2.8', '3.0', '3.0 TDI', 'Sportback'],
      'A8': ['2.5 TDI', '2.8', '3.0', '3.0 TDI', '3.7', '4.0', '4.2', '4.2 TDI', '6.0', 'Long'],
      'Q2': ['1.0', '1.4', '2.0'],
      'Q3': ['1.4', '2.0', '2.0 TDI'],
      'Q5': ['2.0', '2.0 TDI', '3.0', '3.0 TDI', '3.2'],
      'Q7': ['3.0', '3.0 TDI', '3.6', '4.2', '4.2 TDI', '6.0 TDI'],
      'Q8': ['3.0', '3.0 TDI', '4.0'],
      'S-Line': ['S3', 'S4', 'S5', 'S6', 'S7', 'S8'],
      'RS-Line': ['RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8'],
      'TT': ['1.8', '2.0', '3.2', 'TTS', 'TT RS'],
      'R8': ['4.2', '5.2'],
      'e-tron': ['e-tron', 'e-tron GT', 'Q4 e-tron'],
      'Классика': ['80', '100', '200']
    },
    
    'Bentley': ['Arnage', 'Azure', 'Bentayga', 'Continental', 'Continental GT', 'Flying Spur', 'Mulsanne'],
    
    // ═══ BMW - Иерархическая структура Модель → Версии ═══
    'BMW': {
      '1 Series': ['114i', '116i', '116d', '118i', '118d', '120i', '120d', '123d', '125i', '125d', '128i', '130i', '135i', 'M135i'],
      '2 Series': ['214d', '216i', '216d', '218i', '218d', '220i', '220d', '225i', '225xe', '228i', '230i', 'M235i', 'M240i'],
      '3 Series': ['315', '316', '316i', '316d', '318', '318i', '318d', '318is', '320', '320i', '320d', '320si', '323', '323i', '324d', '325', '325i', '325d', '325xi', '328', '328i', '328d', '330', '330i', '330d', '330xi', '330e', '335', '335i', '335d', '340i', 'M340i'],
      '4 Series': ['418i', '418d', '420i', '420d', '425d', '428i', '430i', '430d', '435i', '440i', 'M440i'],
      '5 Series': ['518', '518i', '518d', '520', '520i', '520d', '523', '523i', '524', '524d', '525', '525i', '525d', '525xi', '528', '528i', '530', '530i', '530d', '530e', '535', '535i', '535d', '540', '540i', '540d', '545i', '550i', 'M550i'],
      '6 Series': ['630i', '630d', '635d', '640i', '640d', '645i', '650i', 'M6'],
      '7 Series': ['725d', '728i', '730', '730i', '730d', '735i', '735Li', '740i', '740d', '740Li', '745i', '750i', '750d', '750Li', '760i', '760Li', 'M760Li'],
      '8 Series': ['840i', '840d', '850i', '850ci', 'M850i'],
      'X1': ['16d', '18i', '18d', '20i', '20d', '23d', '25i', '25d', '28i'],
      'X2': ['16d', '18i', '18d', '20i', '20d', '25d'],
      'X3': ['2.0i', '2.0d', '2.5i', '2.5si', '3.0i', '3.0d', '3.0si', '3.0sd', '20i', '20d', '28i', '30i', '30d', '35i', '35d', 'M40i', 'M40d'],
      'X4': ['20i', '20d', '28i', '30i', '30d', '35i', 'M40i', 'M40d'],
      'X5': ['3.0i', '3.0d', '3.0si', '3.0sd', '4.4i', '4.6is', '4.8i', '4.8is', '25d', '30d', '35i', '35d', '40i', '40d', '45e', '48i', '50i', 'M50i', 'M50d'],
      'X6': ['30d', '35i', '35d', '40i', '40d', '50i', 'M50i', 'M50d'],
      'X7': ['30d', '40i', '40d', '50i', 'M50i', 'M50d'],
      'Z3': ['1.8', '1.9', '2.0', '2.2', '2.8', '3.0', 'M'],
      'Z4': ['2.0i', '2.2i', '2.5i', '2.5si', '3.0i', '3.0si', '20i', '30i', '35i', '35is', 'M40i'],
      'M': ['M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X3 M', 'X4 M', 'X5 M', 'X6 M'],
      'i (Electric)': ['i3', 'i4', 'i7', 'i8', 'iX', 'iX1', 'iX3']
    },
    
    'Bugatti': ['Chiron', 'Veyron'],
    'Buick': ['Enclave', 'Encore', 'Envision', 'LaCrosse', 'Park Avenue', 'Regal', 'Verano'],
    'BYD': ['Atto 3', 'Dolphin', 'Han', 'Qin', 'Seal', 'Song', 'Tang', 'Yuan Plus'],
    'Cadillac': ['ATS', 'CT4', 'CT5', 'CT6', 'CTS', 'DTS', 'Escalade', 'Lyriq', 'SRX', 'STS', 'XT4', 'XT5', 'XT6', 'XTS'],
    'Chery': ['Amulet', 'Arrizo 5', 'Arrizo 6', 'Arrizo 7', 'Bonus', 'Exeed LX', 'Exeed TXL', 'Fora', 'Tiggo 2', 'Tiggo 3', 'Tiggo 4', 'Tiggo 5', 'Tiggo 7', 'Tiggo 8'],
    'Chevrolet': ['Aveo', 'Blazer', 'Camaro', 'Captiva', 'Cobalt', 'Colorado', 'Corvette', 'Cruze', 'Epica', 'Equinox', 'Impala', 'Lacetti', 'Malibu', 'Niva', 'Orlando', 'Silverado', 'Sonic', 'Spark', 'Suburban', 'Tahoe', 'Tracker', 'Trailblazer', 'Traverse', 'Trax'],
    'Chrysler': ['200', '300', '300C', 'Pacifica', 'PT Cruiser', 'Sebring', 'Town & Country', 'Voyager'],
    'Citroen': ['Berlingo', 'C1', 'C2', 'C3', 'C3 Aircross', 'C3 Picasso', 'C4', 'C4 Aircross', 'C4 Cactus', 'C4 Picasso', 'C5', 'C5 Aircross', 'C5 X', 'C6', 'C8', 'DS3', 'DS4', 'DS5', 'Jumpy', 'SpaceTourer', 'Xsara', 'Xsara Picasso'],
    'Dacia': ['Dokker', 'Duster', 'Lodgy', 'Logan', 'Sandero', 'Spring'],
    'Daewoo': ['Espero', 'Gentra', 'Lacetti', 'Lanos', 'Leganza', 'Matiz', 'Nexia', 'Nubira', 'Sens', 'Tico'],
    'Daihatsu': ['Charade', 'Copen', 'Materia', 'Sirion', 'Terios', 'YRV'],
    'Dodge': ['Avenger', 'Caliber', 'Challenger', 'Charger', 'Dakota', 'Dart', 'Durango', 'Journey', 'Magnum', 'Nitro', 'RAM 1500', 'RAM 2500', 'Viper'],
    'Ferrari': ['296 GTB', '458', '488', '812', 'California', 'Enzo', 'F12', 'F430', 'F8', 'FF', 'GTC4Lusso', 'LaFerrari', 'Portofino', 'Roma', 'SF90'],
    'Fiat': ['124 Spider', '500', '500C', '500L', '500X', 'Albea', 'Bravo', 'Doblo', 'Ducato', 'Fiorino', 'Grande Punto', 'Linea', 'Panda', 'Punto', 'Qubo', 'Scudo', 'Sedici', 'Stilo', 'Tipo', 'Ulysse'],
    
    // ═══ FORD - Расширенные модели ═══
    'Ford': [
      'B-MAX', 'Bronco', 'C-MAX 1.6', 'C-MAX 1.8', 'C-MAX 2.0',
      'EcoSport 1.0', 'EcoSport 1.5', 'EcoSport 2.0',
      'Edge 2.0', 'Edge 2.7', 'Edge 3.5',
      'Escape', 'Excursion', 'Expedition', 'Explorer 2.3', 'Explorer 3.0', 'Explorer 3.5',
      'F-150', 'F-250', 'F-350',
      'Fiesta 1.0', 'Fiesta 1.1', 'Fiesta 1.25', 'Fiesta 1.3', 'Fiesta 1.4', 'Fiesta 1.5', 'Fiesta 1.6', 'Fiesta ST',
      'Flex',
      'Focus 1.0', 'Focus 1.4', 'Focus 1.5', 'Focus 1.6', 'Focus 1.8', 'Focus 2.0', 'Focus 2.3', 'Focus ST', 'Focus RS',
      'Fusion 1.4', 'Fusion 1.6', 'Fusion 2.0', 'Fusion 2.5', 'Fusion Hybrid',
      'Galaxy 1.6', 'Galaxy 1.8', 'Galaxy 2.0', 'Galaxy 2.3',
      'Ka', 'Ka+',
      'Kuga 1.5', 'Kuga 1.6', 'Kuga 2.0', 'Kuga 2.5',
      'Mondeo 1.6', 'Mondeo 1.8', 'Mondeo 2.0', 'Mondeo 2.2', 'Mondeo 2.3', 'Mondeo 2.5', 'Mondeo ST220',
      'Mustang 2.3', 'Mustang 3.7', 'Mustang 4.0', 'Mustang 4.6', 'Mustang 5.0', 'Mustang GT', 'Mustang Shelby',
      'Puma 1.0', 'Puma 1.5',
      'Ranger 2.0', 'Ranger 2.2', 'Ranger 2.5', 'Ranger 3.2',
      'S-MAX 1.6', 'S-MAX 1.8', 'S-MAX 2.0', 'S-MAX 2.2', 'S-MAX 2.3',
      'Taurus', 'Tourneo', 'Transit', 'Transit Connect', 'Transit Custom'
    ],
    
    'Geely': ['Atlas', 'Coolray', 'Emgrand', 'Emgrand X7', 'GC6', 'Geometry C', 'MK', 'Monjaro', 'Otaka', 'Tugella'],
    'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
    'GMC': ['Acadia', 'Canyon', 'Envoy', 'Jimmy', 'Safari', 'Savana', 'Sierra', 'Terrain', 'Yukon', 'Yukon XL'],
    'Great Wall': ['Deer', 'Haval H2', 'Haval H3', 'Haval H5', 'Haval H6', 'Haval H9', 'Hover', 'Pegasus', 'Peri', 'Poer', 'Safe', 'Sailor', 'Sing', 'Socool', 'Voleex C10', 'Voleex C30', 'Wingle'],
    'Haval': ['Dargo', 'F7', 'F7x', 'H2', 'H6', 'H9', 'Jolion', 'M6'],
    
    // ═══ HONDA - Иерархическая структура Модель → Версии ═══
    'Honda': {
      'Accord': ['1.8', '2.0', '2.2', '2.4', '3.0', '3.5', 'Hybrid', 'Type-R'],
      'Civic': ['1.3', '1.4', '1.5', '1.6', '1.8', '2.0', '2.2', 'Type-R', 'Hybrid'],
      'CR-V': ['1.5', '1.6', '2.0', '2.2', '2.4', 'Hybrid'],
      'HR-V': ['1.5', '1.6', '1.8'],
      'Jazz': ['1.2', '1.3', '1.4', '1.5', 'Hybrid'],
      'Prelude': ['2.0', '2.2', '2.3'],
      'City': ['City'],
      'CR-Z': ['CR-Z'],
      'Crosstour': ['Crosstour'],
      'e': ['e'],
      'Element': ['Element'],
      'Fit': ['Fit'],
      'FR-V': ['FR-V'],
      'Insight': ['Insight'],
      'Legend': ['Legend'],
      'Odyssey': ['Odyssey'],
      'Passport': ['Passport'],
      'Pilot': ['Pilot'],
      'Ridgeline': ['Ridgeline'],
      'S2000': ['S2000'],
      'Shuttle': ['Shuttle'],
      'Stream': ['Stream']
    },
    
    'Hummer': ['H1', 'H2', 'H3', 'EV'],
    
    // ═══ HYUNDAI - Расширенные модели ═══
    'Hyundai': [
      'Accent 1.3', 'Accent 1.4', 'Accent 1.5', 'Accent 1.6',
      'Atos', 'Avante', 'Azera', 'Bayon',
      'Creta 1.6', 'Creta 2.0',
      'Elantra 1.6', 'Elantra 1.8', 'Elantra 2.0',
      'Equus', 'Genesis', 'Genesis Coupe',
      'Getz 1.1', 'Getz 1.3', 'Getz 1.4', 'Getz 1.5', 'Getz 1.6',
      'Grand Santa Fe', 'Grand Starex', 'H-1',
      'i10 1.0', 'i10 1.1', 'i10 1.2',
      'i20 1.1', 'i20 1.2', 'i20 1.4', 'i20 1.6',
      'i30 1.4', 'i30 1.6', 'i30 2.0', 'i30 N',
      'i40 1.6', 'i40 1.7', 'i40 2.0',
      'Ioniq', 'Ioniq 5', 'Ioniq 6',
      'ix20', 'ix35 1.6', 'ix35 2.0', 'ix55',
      'Kona 1.0', 'Kona 1.6', 'Kona 2.0', 'Kona Electric', 'Kona N',
      'Matrix', 'Palisade',
      'Santa Fe 2.0', 'Santa Fe 2.2', 'Santa Fe 2.4', 'Santa Fe 2.7', 'Santa Fe 3.3',
      'Solaris 1.4', 'Solaris 1.6',
      'Sonata 2.0', 'Sonata 2.4', 'Sonata 2.7', 'Sonata 3.3', 'Sonata Hybrid',
      'Staria', 'Starex', 'Terracan', 'Trajet',
      'Tucson 1.6', 'Tucson 1.7', 'Tucson 2.0', 'Tucson 2.4', 'Tucson 2.7', 'Tucson Hybrid',
      'Veloster', 'Veloster N', 'Venue', 'Veracruz', 'Verna'
    ],
    
    'Infiniti': ['EX', 'FX', 'G', 'M', 'Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX56', 'QX60', 'QX70', 'QX80'],
    'Isuzu': ['D-Max', 'MU-X', 'Trooper', 'VehiCross'],
    'Jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'],
    'Jeep': ['Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Patriot', 'Renegade', 'Wrangler'],
    
    // ═══ KIA - Расширенные модели ═══
    'Kia': [
      'Carens 1.6', 'Carens 1.7', 'Carens 2.0',
      'Carnival', 
      'Ceed 1.0', 'Ceed 1.4', 'Ceed 1.6', 'Ceed 2.0', 'Ceed GT',
      'Cerato 1.6', 'Cerato 2.0',
      'Clarus', 'EV6',
      'K5 2.0', 'K5 2.5', 'K7', 'K8', 'K9',
      'Magentis', 'Mohave', 'Niro', 'Niro EV', 'Niro Hybrid',
      'Opirus', 'Optima 2.0', 'Optima 2.4',
      'Picanto 1.0', 'Picanto 1.1', 'Picanto 1.2',
      'Pride', 'Quoris',
      'Rio 1.1', 'Rio 1.2', 'Rio 1.25', 'Rio 1.3', 'Rio 1.4', 'Rio 1.5', 'Rio 1.6',
      'Sedona', 'Seltos 1.6', 'Seltos 2.0', 'Sephia', 'Shuma',
      'Sorento 2.2', 'Sorento 2.4', 'Sorento 2.5', 'Sorento 3.3', 'Sorento 3.5',
      'Soul 1.6', 'Soul 2.0', 'Soul EV',
      'Spectra', 
      'Sportage 1.6', 'Sportage 1.7', 'Sportage 2.0', 'Sportage 2.4', 'Sportage 2.7',
      'Stinger 2.0', 'Stinger 2.2', 'Stinger 3.3',
      'Stonic 1.0', 'Stonic 1.4', 'Stonic 1.6',
      'Venga'
    ],
    
    'Lada': ['110', '111', '112', '2101', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '21099', '2110', '2111', '2112', '2113', '2114', '2115', '4x4', 'Granta', 'Kalina', 'Largus', 'Niva', 'Priora', 'Samara', 'Vesta', 'XRAY'],
    'Lamborghini': ['Aventador', 'Countach', 'Diablo', 'Gallardo', 'Huracan', 'Murcielago', 'Revuelto', 'Urus'],
    'Lancia': ['Delta', 'Lybra', 'Musa', 'Phedra', 'Thema', 'Thesis', 'Voyager', 'Ypsilon', 'Zeta'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
    
    // ═══ LEXUS - Расширенные модели ═══
    'Lexus': [
      'CT 200h',
      'ES 250', 'ES 300', 'ES 300h', 'ES 330', 'ES 350',
      'GS 250', 'GS 300', 'GS 350', 'GS 430', 'GS 450h', 'GS 460', 'GS F',
      'GX 460', 'GX 470',
      'HS 250h',
      'IS 200', 'IS 220d', 'IS 250', 'IS 300', 'IS 300h', 'IS 350', 'IS F',
      'LC 500', 'LC 500h',
      'LFA',
      'LS 400', 'LS 430', 'LS 460', 'LS 500', 'LS 500h', 'LS 600h',
      'LX 450', 'LX 470', 'LX 570', 'LX 600',
      'NX 200t', 'NX 250', 'NX 300', 'NX 300h', 'NX 350', 'NX 350h', 'NX 450h+',
      'RC 200t', 'RC 300', 'RC 350', 'RC F',
      'RX 200t', 'RX 270', 'RX 300', 'RX 330', 'RX 350', 'RX 400h', 'RX 450h', 'RX 500h',
      'SC 300', 'SC 400', 'SC 430',
      'UX 200', 'UX 250h', 'UX 300e'
    ],
    
    'Lincoln': ['Aviator', 'Continental', 'Corsair', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Navigator', 'Nautilus', 'Town Car'],
    'Lotus': ['Elise', 'Emira', 'Evora', 'Exige'],
    'Maserati': ['Ghibli', 'GranCabrio', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'],
    'Maybach': ['57', '62', 'GLS', 'S-Class'],
    
    // ═══ MAZDA - Расширенные модели ═══
    'Mazda': [
      '2 1.3', '2 1.5',
      '3 1.4', '3 1.5', '3 1.6', '3 2.0', '3 2.3', '3 MPS',
      '5 1.8', '5 2.0',
      '6 1.8', '6 2.0', '6 2.2', '6 2.3', '6 2.5', '6 MPS',
      '323', '323F', '626',
      'Atenza', 'Axela',
      'BT-50',
      'CX-3 1.5', 'CX-3 2.0',
      'CX-30 1.8', 'CX-30 2.0', 'CX-30 e-Skyactiv',
      'CX-5 2.0', 'CX-5 2.2', 'CX-5 2.5',
      'CX-50',
      'CX-60 2.5', 'CX-60 3.3',
      'CX-7 2.3', 'CX-7 2.5',
      'CX-9 2.5', 'CX-9 3.7',
      'CX-90',
      'Demio', 'Familia', 'MPV',
      'MX-5 1.5', 'MX-5 1.6', 'MX-5 1.8', 'MX-5 2.0',
      'MX-30',
      'Premacy', 
      'RX-7', 'RX-8',
      'Tribute', 'Xedos'
    ],
    
    'McLaren': ['540C', '570GT', '570S', '600LT', '650S', '675LT', '720S', 'Artura', 'GT', 'P1'],
    
    // ═══ MERCEDES - Иерархическая структура ═══
    'Mercedes': {
      'A-Класс': ['140', '150', '160', '170', '180', '180d', '200', '200d', '220', '220d', '250', '250e', '35 AMG', '45 AMG'],
      'B-Класс': ['150', '160', '170', '180', '180d', '200', '200d', '220', '250', '250e'],
      'C-Класс': ['160', '180', '180d', '200', '200d', '220', '220d', '230', '240', '250', '250d', '270', '280', '300', '300d', '320', '350', '350e', '400', '43 AMG', '63 AMG'],
      'CL-Класс': ['500', '550', '600', '63 AMG', '65 AMG'],
      'CLA': ['180', '200', '220', '250', '35 AMG', '45 AMG'],
      'CLC': ['160', '180', '200', '220', '230', '350'],
      'CLK': ['200', '220', '230', '240', '270', '280', '320', '350', '430', '500', '55 AMG', '63 AMG'],
      'CLS': ['220', '250', '280', '300', '320', '350', '400', '450', '500', '53 AMG', '55 AMG', '63 AMG'],
      'E-Класс': ['200', '200d', '220', '220d', '230', '240', '250', '250d', '260', '270', '280', '290', '300', '300d', '320', '350', '350d', '350e', '400', '420', '430', '450', '500', '43 AMG', '53 AMG', '55 AMG', '63 AMG'],
      'EQ (Электро)': ['EQA 250', 'EQA 300', 'EQA 350', 'EQB 250', 'EQB 300', 'EQB 350', 'EQC 400', 'EQE 300', 'EQE 350', 'EQE 43 AMG', 'EQE 53 AMG', 'EQS 450', 'EQS 53 AMG', 'EQS 580'],
      'G-Класс': ['230', '270', '280', '290', '300', '320', '350', '350d', '400d', '500', '55 AMG', '63 AMG', '65 AMG'],
      'GL': ['320', '350', '400', '420', '450', '500', '550', '63 AMG'],
      'GLS': ['350d', '400d', '450', '500', '580', '600', '63 AMG'],
      'GLA': ['180', '200', '220', '250', '35 AMG', '45 AMG'],
      'GLB': ['180', '200', '220', '250', '35 AMG'],
      'GLC': ['180', '200', '220d', '250', '250d', '300', '300d', '300e', '350', '350e', '400d', '43 AMG', '63 AMG'],
      'GLE': ['250d', '300d', '350', '350d', '350e', '400d', '450', '500', '500e', '53 AMG', '63 AMG'],
      'GLK': ['200', '220', '250', '280', '300', '320', '350'],
      'ML': ['230', '250', '270', '280', '300', '320', '350', '400', '420', '430', '450', '500', '55 AMG', '63 AMG'],
      'R-Класс': ['280', '300', '320', '350', '500', '63 AMG'],
      'S-Класс': ['250', '280', '300', '320', '350', '350d', '400', '400d', '420', '430', '450', '500', '500e', '560', '580', '600', '63 AMG', '65 AMG', '680'],
      'SL': ['280', '300', '320', '350', '400', '450', '500', '55 AMG', '600', '63 AMG', '65 AMG'],
      'SLC': ['180', '200', '300', '43 AMG'],
      'SLK': ['200', '230', '250', '280', '300', '320', '350', '55 AMG'],
      'AMG GT': ['AMG GT', '43', '53', '63', 'GT C', 'GT R', 'GT S'],
      'Другие': ['SLR McLaren', 'SLS AMG'],
      'Коммерческие': ['Sprinter', 'V 220', 'V 250', 'V 300', 'Vaneo', 'Viano', 'Vito']
    },
    
    'MG': ['3', '5', '6', 'HS', 'Marvel R', 'MG3', 'MG5', 'MG6', 'ZR', 'ZS', 'ZT'],
    'Mini': ['Clubman', 'Countryman', 'Cooper', 'Cooper D', 'Cooper S', 'Cooper SD', 'John Cooper Works', 'One', 'One D', 'Paceman'],
    
    // ═══ MITSUBISHI - Расширенные модели ═══
    'Mitsubishi': [
      'ASX 1.6', 'ASX 1.8', 'ASX 2.0', 'ASX 2.2', 'ASX 2.4',
      'Carisma', 'Colt', 
      'Eclipse', 'Eclipse Cross 1.5', 'Eclipse Cross 2.2', 'Eclipse Cross 2.4',
      'Galant', 'Grandis', 'i-MiEV',
      'L200 2.4', 'L200 2.5', 'L200 3.2',
      'Lancer 1.3', 'Lancer 1.5', 'Lancer 1.6', 'Lancer 1.8', 'Lancer 2.0', 'Lancer Evolution', 'Lancer Ralliart',
      'Montero',
      'Outlander 2.0', 'Outlander 2.2', 'Outlander 2.4', 'Outlander 3.0', 'Outlander PHEV',
      'Pajero 2.5', 'Pajero 2.8', 'Pajero 3.0', 'Pajero 3.2', 'Pajero 3.5', 'Pajero 3.8',
      'Pajero Pinin', 'Pajero Sport 2.4', 'Pajero Sport 2.5', 'Pajero Sport 3.0',
      'Space Star'
    ],
    
    // ═══ NISSAN - Расширенные модели ═══
    'Nissan': [
      '350Z', '370Z',
      'Almera 1.4', 'Almera 1.5', 'Almera 1.6', 'Almera 1.8', 'Almera 2.0',
      'Altima', 'Ariya', 'Armada', 'Cube',
      'GT-R',
      'Juke 1.2', 'Juke 1.5', 'Juke 1.6',
      'Kicks', 'Leaf',
      'Maxima', 'Micra 1.0', 'Micra 1.2', 'Micra 1.4', 'Micra 1.5',
      'Murano 2.5', 'Murano 3.5',
      'Navara', 'Note 1.2', 'Note 1.4', 'Note 1.5', 'Note 1.6', 'NP300', 'NV200',
      'Pathfinder 2.5', 'Pathfinder 3.0', 'Pathfinder 3.5', 'Pathfinder 4.0',
      'Patrol 2.8', 'Patrol 3.0', 'Patrol 4.2', 'Patrol 4.8', 'Patrol 5.6',
      'Pixo', 'Primastar',
      'Primera 1.6', 'Primera 1.8', 'Primera 2.0', 'Primera 2.2',
      'Pulsar',
      'Qashqai 1.2', 'Qashqai 1.3', 'Qashqai 1.5', 'Qashqai 1.6', 'Qashqai 2.0', 'Qashqai+2',
      'Quest', 'Rogue', 'Sentra', 'Sunny',
      'Teana 2.0', 'Teana 2.5', 'Teana 3.5',
      'Terrano', 
      'Tiida 1.5', 'Tiida 1.6', 'Tiida 1.8',
      'Titan', 'Versa',
      'X-Trail 1.6', 'X-Trail 2.0', 'X-Trail 2.2', 'X-Trail 2.5',
      'Xterra'
    ],
    
    // ═══ OPEL - Расширенные модели ═══
    'Opel': [
      'Adam', 'Agila', 'Ampera', 'Ampera-e', 'Antara 2.0', 'Antara 2.2', 'Antara 2.4', 'Antara 3.0',
      'Astra 1.2', 'Astra 1.3', 'Astra 1.4', 'Astra 1.6', 'Astra 1.7', 'Astra 1.8', 'Astra 1.9', 'Astra 2.0', 'Astra 2.2', 'Astra OPC',
      'Combo', 
      'Corsa 1.0', 'Corsa 1.2', 'Corsa 1.3', 'Corsa 1.4', 'Corsa 1.6', 'Corsa 1.7', 'Corsa OPC', 'Corsa-e',
      'Crossland', 'Crossland X',
      'Frontera',
      'Grandland', 'Grandland X',
      'Insignia 1.4', 'Insignia 1.5', 'Insignia 1.6', 'Insignia 1.8', 'Insignia 2.0', 'Insignia 2.8', 'Insignia OPC',
      'Karl', 
      'Meriva 1.3', 'Meriva 1.4', 'Meriva 1.6', 'Meriva 1.7',
      'Mokka 1.4', 'Mokka 1.6', 'Mokka 1.7', 'Mokka-e',
      'Omega 2.0', 'Omega 2.2', 'Omega 2.5', 'Omega 2.6', 'Omega 3.0', 'Omega 3.2',
      'Signum', 'Tigra',
      'Vectra 1.6', 'Vectra 1.8', 'Vectra 1.9', 'Vectra 2.0', 'Vectra 2.2', 'Vectra 2.8', 'Vectra 3.0', 'Vectra 3.2',
      'Vivaro', 
      'Zafira 1.4', 'Zafira 1.6', 'Zafira 1.7', 'Zafira 1.8', 'Zafira 1.9', 'Zafira 2.0', 'Zafira 2.2', 'Zafira OPC', 'Zafira-e'
    ],
    
    // ═══ PEUGEOT - Расширенные модели ═══
    'Peugeot': [
      '107', '108',
      '206 1.1', '206 1.4', '206 1.6', '206 2.0',
      '207 1.4', '207 1.6',
      '208 1.0', '208 1.2', '208 1.4', '208 1.6', '208 e-208', '208 GTi',
      '2008 1.2', '2008 1.5', '2008 1.6', '2008 e-2008',
      '3008 1.2', '3008 1.5', '3008 1.6', '3008 2.0', '3008 Hybrid', '3008 Hybrid4',
      '301', 
      '307 1.4', '307 1.6', '307 2.0',
      '308 1.2', '308 1.5', '308 1.6', '308 2.0', '308 GTi',
      '4007', '4008',
      '406 1.8', '406 2.0', '406 2.2', '406 3.0',
      '407 1.6', '407 1.8', '407 2.0', '407 2.2', '407 2.7', '407 3.0',
      '408 1.6', '408 2.0',
      '5008 1.5', '5008 1.6', '5008 2.0', '5008 Hybrid',
      '508 1.5', '508 1.6', '508 2.0', '508 2.2', '508 Hybrid', '508 PSE',
      '607', '807',
      'Boxer', 'Expert', 'Partner', 'RCZ', 'Rifter', 'Traveller'
    ],
    
    'Porsche': ['718 Boxster', '718 Cayman', '911 Carrera', '911 Turbo', '911 GT3', '918 Spyder', '924', '928', '944', '968', 'Boxster', 'Carrera GT', 'Cayenne', 'Cayenne Coupe', 'Cayenne E-Hybrid', 'Cayenne GTS', 'Cayenne S', 'Cayenne Turbo', 'Cayman', 'Macan', 'Macan S', 'Macan GTS', 'Macan Turbo', 'Panamera', 'Panamera 4', 'Panamera S', 'Panamera GTS', 'Panamera Turbo', 'Panamera E-Hybrid', 'Taycan', 'Taycan 4S', 'Taycan Turbo', 'Taycan Turbo S'],
    'RAM': ['1500', '2500', '3500', 'ProMaster'],
    
    // ═══ RENAULT - Расширенные модели ═══
    'Renault': [
      'Arkana 1.3', 'Arkana 1.6',
      'Captur 0.9', 'Captur 1.2', 'Captur 1.3', 'Captur 1.5',
      'Clio 0.9', 'Clio 1.0', 'Clio 1.2', 'Clio 1.4', 'Clio 1.5', 'Clio 1.6', 'Clio RS',
      'Duster 1.3', 'Duster 1.5', 'Duster 1.6', 'Duster 2.0',
      'Espace', 'Fluence 1.5', 'Fluence 1.6', 'Fluence 2.0',
      'Grand Scenic',
      'Kadjar 1.2', 'Kadjar 1.3', 'Kadjar 1.5', 'Kadjar 1.6',
      'Kangoo', 'Kaptur 1.6', 'Kaptur 2.0',
      'Koleos 2.0', 'Koleos 2.5',
      'Laguna 1.6', 'Laguna 1.8', 'Laguna 1.9', 'Laguna 2.0', 'Laguna 2.2', 'Laguna 3.0',
      'Logan 1.2', 'Logan 1.4', 'Logan 1.5', 'Logan 1.6',
      'Master',
      'Megane 1.2', 'Megane 1.4', 'Megane 1.5', 'Megane 1.6', 'Megane 1.9', 'Megane 2.0', 'Megane RS',
      'Modus', 
      'Sandero 1.0', 'Sandero 1.2', 'Sandero 1.4', 'Sandero 1.5', 'Sandero 1.6', 'Sandero Stepway',
      'Scenic 1.2', 'Scenic 1.4', 'Scenic 1.5', 'Scenic 1.6', 'Scenic 1.9', 'Scenic 2.0',
      'Symbol', 'Talisman 1.5', 'Talisman 1.6', 'Talisman 1.8', 'Talisman 2.0',
      'Thalia', 'Trafic', 'Twingo', 'Vel Satis', 'Wind', 'Zoe'
    ],
    
    'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Silver Cloud', 'Silver Shadow', 'Silver Spur', 'Wraith'],
    'Saab': ['9-3', '9-4X', '9-5', '9-7X', '900', '9000'],
    'Seat': ['Alhambra', 'Altea', 'Arona', 'Arosa', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Leon Cupra', 'Mii', 'Tarraco', 'Toledo'],
    
    // ═══ SKODA - Расширенные модели ═══
    'Skoda': [
      'Citigo', 
      'Fabia 1.0', 'Fabia 1.2', 'Fabia 1.4', 'Fabia 1.6', 'Fabia 1.9', 'Fabia RS',
      'Favorit', 'Felicia',
      'Kamiq 1.0', 'Kamiq 1.5',
      'Karoq 1.0', 'Karoq 1.5', 'Karoq 1.6', 'Karoq 2.0',
      'Kodiaq 1.4', 'Kodiaq 1.5', 'Kodiaq 2.0', 'Kodiaq RS',
      'Octavia 1.2', 'Octavia 1.4', 'Octavia 1.5', 'Octavia 1.6', 'Octavia 1.8', 'Octavia 1.9', 'Octavia 2.0', 'Octavia RS', 'Octavia Scout',
      'Rapid 1.0', 'Rapid 1.2', 'Rapid 1.4', 'Rapid 1.6',
      'Roomster', 
      'Scala 1.0', 'Scala 1.5',
      'Superb 1.4', 'Superb 1.5', 'Superb 1.6', 'Superb 1.8', 'Superb 1.9', 'Superb 2.0', 'Superb 2.5', 'Superb 2.8', 'Superb 3.6',
      'Yeti 1.2', 'Yeti 1.4', 'Yeti 1.8', 'Yeti 2.0'
    ],
    
    'Smart': ['Crossblade', 'ForFour', 'ForTwo', 'Roadster'],
    'SsangYong': ['Actyon', 'Korando', 'Kyron', 'Musso', 'Rexton', 'Rodius', 'Tivoli', 'XLV'],
    'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Impreza WRX', 'Legacy', 'Levorg', 'Outback', 'SVX', 'Tribeca', 'WRX', 'WRX STI', 'XV'],
    'Suzuki': ['Alto', 'Baleno', 'Celerio', 'Ciaz', 'Ertiga', 'Grand Vitara', 'Ignis', 'Jimny', 'Kizashi', 'Liana', 'S-Cross', 'Samurai', 'Splash', 'Swift', 'SX4', 'SX4 S-Cross', 'Vitara', 'Wagon R', 'XL7'],
    'Tesla': ['Cybertruck', 'Model 3', 'Model 3 Standard', 'Model 3 Long Range', 'Model 3 Performance', 'Model S', 'Model S Long Range', 'Model S Plaid', 'Model X', 'Model X Long Range', 'Model X Plaid', 'Model Y', 'Model Y Long Range', 'Model Y Performance', 'Roadster'],
    
    // ═══ TOYOTA - Расширенные модели ═══
    'Toyota': [
      '4Runner', '86',
      'Alphard', 'Aqua',
      'Auris 1.2', 'Auris 1.33', 'Auris 1.4', 'Auris 1.6', 'Auris 1.8', 'Auris 2.0', 'Auris Hybrid',
      'Avalon', 
      'Avensis 1.6', 'Avensis 1.8', 'Avensis 2.0', 'Avensis 2.2', 'Avensis 2.4',
      'Aygo',
      'bZ4X',
      'C-HR 1.2', 'C-HR 1.8', 'C-HR 2.0', 'C-HR Hybrid',
      'Camry 2.0', 'Camry 2.2', 'Camry 2.4', 'Camry 2.5', 'Camry 3.0', 'Camry 3.5', 'Camry Hybrid',
      'Celica', 'Corolla', 'Corolla 1.33', 'Corolla 1.4', 'Corolla 1.6', 'Corolla 1.8', 'Corolla 2.0', 'Corolla Hybrid', 'Corolla Cross',
      'Corona', 'Crown',
      'FJ Cruiser', 'Fortuner',
      'GT86',
      'Highlander 2.7', 'Highlander 3.0', 'Highlander 3.3', 'Highlander 3.5', 'Highlander Hybrid',
      'Hilux 2.4', 'Hilux 2.5', 'Hilux 2.7', 'Hilux 2.8', 'Hilux 3.0',
      'iQ',
      'Land Cruiser 2.7', 'Land Cruiser 2.8', 'Land Cruiser 3.0', 'Land Cruiser 4.0', 'Land Cruiser 4.2', 'Land Cruiser 4.5', 'Land Cruiser 4.6', 'Land Cruiser 4.7', 'Land Cruiser 5.7',
      'Land Cruiser Prado 2.7', 'Land Cruiser Prado 2.8', 'Land Cruiser Prado 3.0', 'Land Cruiser Prado 4.0',
      'Mark II', 'Matrix', 'Mirai', 'MR2',
      'Previa', 
      'Prius', 'Prius 1.5', 'Prius 1.8', 'Prius PHV', 'Prius Prime', 'Prius+', 'Prius C', 'Prius V',
      'RAV4 2.0', 'RAV4 2.2', 'RAV4 2.4', 'RAV4 2.5', 'RAV4 Hybrid', 'RAV4 Prime', 'RAV4 PHV',
      'Sequoia', 'Sienna', 'Supra',
      'Tacoma', 'Tundra',
      'Urban Cruiser', 'Vellfire', 'Venza',
      'Verso 1.6', 'Verso 1.8', 'Verso 2.0', 'Verso 2.2',
      'Yaris 1.0', 'Yaris 1.3', 'Yaris 1.4', 'Yaris 1.5', 'Yaris Hybrid', 'Yaris Cross', 'Yaris Cross Hybrid', 'Yaris GR'
    ],
    
    'UAZ': ['Hunter', 'Patriot', 'Pickup', 'Profi'],
    
    // ═══ VOLKSWAGEN - Расширенные модели ═══
    'Volkswagen': [
      'Amarok 2.0', 'Amarok 3.0',
      'Arteon 1.5', 'Arteon 2.0',
      'Atlas', 'Beetle', 'Bora',
      'Caddy 1.2', 'Caddy 1.4', 'Caddy 1.6', 'Caddy 1.9', 'Caddy 2.0',
      'Caravelle', 'CC 1.8', 'CC 2.0', 'CC 3.6',
      'Crafter', 'Eos', 'Fox',
      'Golf 1.0', 'Golf 1.2', 'Golf 1.4', 'Golf 1.5', 'Golf 1.6', 'Golf 1.8', 'Golf 1.9', 'Golf 2.0', 'Golf 2.3', 'Golf 2.8', 'Golf GTI', 'Golf GTD', 'Golf GTE', 'Golf R', 'Golf R32', 'Golf Plus', 'Golf Sportsvan', 'Golf Variant',
      'ID.3', 'ID.4', 'ID.5', 'ID.Buzz',
      'Jetta 1.2', 'Jetta 1.4', 'Jetta 1.6', 'Jetta 1.8', 'Jetta 1.9', 'Jetta 2.0', 'Jetta 2.5',
      'Lupo', 'Multivan',
      'New Beetle', 'New Beetle 1.4', 'New Beetle 1.6', 'New Beetle 1.8', 'New Beetle 1.9', 'New Beetle 2.0', 'New Beetle 2.5',
      'Passat 1.4', 'Passat 1.6', 'Passat 1.8', 'Passat 1.9', 'Passat 2.0', 'Passat 2.5', 'Passat 2.8', 'Passat 3.2', 'Passat 3.6', 'Passat CC', 'Passat GTE', 'Passat Alltrack', 'Passat Variant',
      'Phaeton', 'Pointer',
      'Polo 1.0', 'Polo 1.2', 'Polo 1.4', 'Polo 1.5', 'Polo 1.6', 'Polo 1.8', 'Polo 1.9', 'Polo 2.0', 'Polo GTI', 'Polo R',
      'Scirocco 1.4', 'Scirocco 2.0', 'Scirocco R',
      'Sharan 1.4', 'Sharan 1.8', 'Sharan 1.9', 'Sharan 2.0', 'Sharan 2.8',
      'T-Cross 1.0', 'T-Cross 1.5',
      'T-Roc 1.0', 'T-Roc 1.5', 'T-Roc 2.0', 'T-Roc R',
      'Taos 1.4', 'Taos 1.5',
      'Tiguan 1.4', 'Tiguan 1.5', 'Tiguan 2.0', 'Tiguan Allspace', 'Tiguan R',
      'Touareg 2.5', 'Touareg 3.0', 'Touareg 3.2', 'Touareg 3.6', 'Touareg 4.2', 'Touareg 5.0', 'Touareg R',
      'Touran 1.2', 'Touran 1.4', 'Touran 1.6', 'Touran 1.8', 'Touran 1.9', 'Touran 2.0',
      'Transporter', 'up!', 'e-up!', 'Vento'
    ],
    
    // ═══ VOLVO - Расширенные модели ═══
    'Volvo': [
      '240', '740', '850', '940', '960',
      'C30 1.6', 'C30 1.8', 'C30 2.0', 'C30 2.4', 'C30 2.5',
      'C40',
      'C70',
      'S40 1.6', 'S40 1.8', 'S40 2.0', 'S40 2.4', 'S40 2.5',
      'S60 2.0', 'S60 2.4', 'S60 2.5', 'S60 3.0', 'S60 T5', 'S60 T6', 'S60 T8',
      'S70',
      'S80 2.0', 'S80 2.4', 'S80 2.5', 'S80 2.9', 'S80 3.0', 'S80 3.2', 'S80 4.4', 'S80 T5', 'S80 T6',
      'S90 2.0', 'S90 T5', 'S90 T6', 'S90 T8',
      'V40 1.6', 'V40 1.8', 'V40 2.0', 'V40 Cross Country',
      'V50 1.6', 'V50 1.8', 'V50 2.0', 'V50 2.4', 'V50 2.5',
      'V60 2.0', 'V60 2.4', 'V60 T5', 'V60 T6', 'V60 T8', 'V60 Cross Country',
      'V70 2.0', 'V70 2.3', 'V70 2.4', 'V70 2.5', 'V70 3.0', 'V70 3.2', 'V70 T5', 'V70 T6',
      'V90 2.0', 'V90 T5', 'V90 T6', 'V90 T8', 'V90 Cross Country',
      'XC40 1.5', 'XC40 2.0', 'XC40 T3', 'XC40 T4', 'XC40 T5', 'XC40 Recharge',
      'XC60 2.0', 'XC60 2.4', 'XC60 3.0', 'XC60 3.2', 'XC60 T5', 'XC60 T6', 'XC60 T8',
      'XC70 2.4', 'XC70 2.5', 'XC70 3.0', 'XC70 3.2',
      'XC90 2.0', 'XC90 2.4', 'XC90 2.5', 'XC90 2.9', 'XC90 3.2', 'XC90 4.4', 'XC90 T5', 'XC90 T6', 'XC90 T8'
    ]
  },
  
  truck: {
    'DAF': ['CF', 'LF', 'XD', 'XF', 'XG', 'XG+'],
    'Freightliner': ['Argosy', 'Business Class M2', 'Cascadia', 'Century Class', 'Classic', 'Columbia', 'Condor', 'Coronado', 'FLD'],
    'Hino': ['195', '258', '268', '300', '338', '500', '700'],
    'Hyundai': ['HD35', 'HD65', 'HD72', 'HD78', 'HD120', 'HD170', 'HD260', 'HD270', 'Mighty', 'Porter', 'Xcient'],
    'Isuzu': ['Elf', 'Forward', 'Giga', 'N-Series', 'NPR'],
    'Iveco': ['Daily', 'EuroCargo', 'EuroTech', 'EuroTrakker', 'S-Way', 'Stralis', 'Trakker'],
    'Kamaz': ['4308', '43118', '4326', '43253', '43255', '4326', '5320', '5490', '53205', '5350', '54115', '5460', '6350', '6460', '6520', '65115', '65201', '65207'],
    'Kenworth': ['T270', 'T370', 'T440', 'T470', 'T660', 'T680', 'T800', 'T880', 'W900'],
    'MAN': ['L2000', 'LE', 'TGA', 'TGE', 'TGL', 'TGM', 'TGS', 'TGX'],
    'Mack': ['Anthem', 'CHU', 'Granite', 'LEU', 'MRU', 'Pinnacle', 'TerraPro', 'Titan'],
    'MAZ': ['4370', '5336', '5337', '5340', '5440', '6303', '6312', '6430', '6501'],
    'Mercedes': ['Actros', 'Antos', 'Arocs', 'Atego', 'Atron', 'Axor', 'Econic', 'Sprinter', 'Unimog', 'Zetros'],
    'Peterbilt': ['220', '325', '330', '335', '348', '365', '367', '378', '379', '384', '386', '389', '520', '567', '579', '589'],
    'Renault': ['C', 'D', 'Kerax', 'K', 'Magnum', 'Master', 'Mascott', 'Midlum', 'Premium', 'T'],
    'Scania': ['G', 'P', 'R', 'S', 'Streamline'],
    'Volvo': ['FE', 'FL', 'FM', 'FMX', 'FH', 'FH16', 'VNL', 'VNR', 'VHD'],
    'Western Star': ['4700', '4800', '4900', '5700', '6900']
  },
  
  special: {
    'Bobcat': ['E10', 'E20', 'S70', 'S100', 'S130', 'S150', 'S160', 'S175', 'S185', 'S205', 'S220', 'S250', 'S300', 'S330', 'T76', 'T110', 'T140', 'T180', 'T190', 'T250'],
    'Case': ['580', '590', '621', '721', '821', '921', 'CX130', 'CX160', 'CX210', 'CX240', 'CX290', 'CX350'],
    'Caterpillar': ['303', '304', '305', '307', '308', '311', '312', '313', '315', '316', '317', '318', '319', '320', '321', '323', '324', '325', '326', '328', '329', '330', '336', '340', '345', '349', '365', '374', '385', '390'],
    'Doosan': ['DX55', 'DX80', 'DX140', 'DX180', 'DX225', 'DX255', 'DX300', 'DX340', 'DX380', 'DX420', 'DX480', 'DX530'],
    'Hitachi': ['ZX75', 'ZX85', 'ZX120', 'ZX130', 'ZX135', 'ZX160', 'ZX180', 'ZX200', 'ZX210', 'ZX225', 'ZX240', 'ZX250', 'ZX280', 'ZX330', 'ZX350', 'ZX370', 'ZX450', 'ZX490', 'ZX520', 'ZX670'],
    'Hyundai': ['R55', 'R60', 'R80', 'R110', 'R140', 'R150', 'R170', 'R180', 'R210', 'R220', 'R260', 'R290', 'R300', 'R330', 'R360', 'R380', 'R450', 'R480', 'R520'],
    'JCB': ['3CX', '4CX', '5CX', '8025', '8030', '8035', '8040', '8050', '8055', '8060', '8080', '8085', 'JS130', 'JS145', 'JS160', 'JS180', 'JS200', 'JS220', 'JS240', 'JS260', 'JS290', 'JS330', 'JS370', 'JS450'],
    'John Deere': ['27D', '35G', '50G', '60G', '75G', '85G', '135G', '160G', '200G', '210G', '250G', '310', '310L', '310SL', '315SL', '325SL', '410L', '710L'],
    'Komatsu': ['PC55', 'PC78', 'PC88', 'PC130', 'PC138', 'PC160', 'PC170', 'PC200', 'PC210', 'PC220', 'PC228', 'PC240', 'PC270', 'PC290', 'PC300', 'PC360', 'PC390', 'PC450', 'PC490', 'PC650', 'PC800', 'PC1250', 'PC2000'],
    'Kobelco': ['SK75', 'SK80', 'SK130', 'SK135', 'SK140', 'SK170', 'SK200', 'SK210', 'SK235', 'SK260', 'SK300', 'SK330', 'SK350', 'SK380', 'SK450', 'SK485', 'SK500', 'SK550'],
    'Liebherr': ['R900', 'R904', 'R906', 'R914', 'R920', 'R924', 'R926', 'R930', 'R934', 'R938', 'R944', 'R950', 'R954', 'R960', 'R964', 'R970', 'R974', 'R980', 'R984', 'R990', 'R996', 'R9100', 'R9150', 'R9200', 'R9250', 'R9300', 'R9350', 'R9400', 'R9800'],
    'New Holland': ['B90B', 'B95B', 'B110B', 'B115B', 'E135B', 'E145', 'E215', 'E245', 'E265', 'E305'],
    'Volvo': ['EC140', 'EC160', 'EC180', 'EC200', 'EC210', 'EC220', 'EC250', 'EC300', 'EC330', 'EC350', 'EC380', 'EC460', 'EC480', 'EC650', 'EC700', 'EC750', 'EC950', 'EC1200']
  },
  
  moto: {
    'Aprilia': ['Dorsoduro', 'Mana', 'RSV4', 'RSV Mille', 'Shiver', 'SL1000 Falco', 'SMV750 Dorsoduro', 'SR Motard', 'SRV850', 'Tuono'],
    'BMW': ['C 400', 'C 600', 'C 650', 'CE 04', 'F 650', 'F 700', 'F 750', 'F 800', 'F 850', 'F 900', 'G 310', 'HP2', 'HP4', 'K 1200', 'K 1300', 'K 1600', 'R 1100', 'R 1150', 'R 1200', 'R 1250', 'R nineT', 'R18', 'S 1000', 'S 1000 R', 'S 1000 RR', 'S 1000 XR'],
    'Ducati': ['1098', '1198', '1199', '1299', '748', '749', '848', '899', '916', '959', '996', '998', '999', 'Diavel', 'GT1000', 'Hypermotard', 'Monster', 'Monster 696', 'Monster 796', 'Monster 821', 'Monster 1200', 'Multistrada', 'Panigale V2', 'Panigale V4', 'Scrambler', 'SportClassic', 'Streetfighter', 'Supersport'],
    'Harley-Davidson': ['Breakout', 'Dyna', 'Electra Glide', 'Fat Bob', 'Fat Boy', 'Forty-Eight', 'Heritage', 'Iron 883', 'Iron 1200', 'Low Rider', 'Night Rod', 'Road Glide', 'Road King', 'Softail', 'Sportster', 'Street', 'Street Bob', 'Street Glide', 'Touring', 'V-Rod', 'Wide Glide'],
    'Honda': ['Africa Twin', 'CB125', 'CB300', 'CB400', 'CB500', 'CB650', 'CB1000', 'CBF600', 'CBF1000', 'CBR125', 'CBR250', 'CBR300', 'CBR500', 'CBR600', 'CBR650', 'CBR900', 'CBR1000', 'CRF250', 'CRF450', 'CRF1000', 'CTX700', 'Deauville', 'Forza', 'Gold Wing', 'Hornet', 'Lead', 'NC700', 'NC750', 'PCX', 'Rebel', 'Shadow', 'Silverwing', 'Transalp', 'Varadero', 'VFR800', 'VFR1200', 'VT750', 'VTR1000', 'X-ADV'],
    'Indian': ['Chief', 'Chief Dark Horse', 'Chieftain', 'FTR 1200', 'FTR Rally', 'Roadmaster', 'Scout', 'Scout Bobber', 'Scout Sixty', 'Springfield'],
    'Kawasaki': ['Eliminator', 'ER-6', 'KLR 650', 'Ninja 250', 'Ninja 300', 'Ninja 400', 'Ninja 650', 'Ninja 1000', 'Ninja H2', 'Versys 650', 'Versys 1000', 'Vulcan 650', 'Vulcan 900', 'Vulcan 1700', 'W800', 'Z125', 'Z250', 'Z400', 'Z650', 'Z750', 'Z800', 'Z900', 'Z1000', 'ZX-6R', 'ZX-10R', 'ZX-12R', 'ZX-14R', 'ZZR1400'],
    'KTM': ['125 Duke', '200 Duke', '250 Duke', '390 Duke', '690 Duke', '790 Duke', '890 Duke', '1290 Super Duke', 'Adventure 390', 'Adventure 790', 'Adventure 890', 'Adventure 1090', 'Adventure 1290', 'RC 125', 'RC 200', 'RC 390', 'RC 8'],
    'Moto Guzzi': ['Audace', 'Breva', 'California', 'Eldorado', 'Griso', 'MGX-21', 'Norge', 'Stelvio', 'V7', 'V9', 'V11', 'V85 TT'],
    'MV Agusta': ['Brutale 675', 'Brutale 800', 'Brutale 1000', 'Dragster', 'F3', 'F4', 'Rivale', 'Stradale', 'Turismo Veloce'],
    'Royal Enfield': ['Bullet', 'Classic 350', 'Classic 500', 'Continental GT 650', 'Himalayan', 'Interceptor 650', 'Meteor 350', 'Thunderbird'],
    'Suzuki': ['Address', 'Bandit 650', 'Bandit 1250', 'Boulevard C50', 'Boulevard C90', 'Boulevard M50', 'Boulevard M90', 'Burgman 125', 'Burgman 200', 'Burgman 400', 'Burgman 650', 'DR-Z400', 'DR650', 'GS500', 'GSF650', 'GSF1250', 'GSR600', 'GSR750', 'GSX-R600', 'GSX-R750', 'GSX-R1000', 'GSX-S750', 'GSX-S1000', 'Hayabusa', 'Intruder', 'Kingquad', 'SV650', 'SV1000', 'TU250', 'V-Strom 650', 'V-Strom 1000', 'V-Strom 1050'],
    'Triumph': ['Bonneville', 'Bonneville T100', 'Bonneville T120', 'Daytona 675', 'Rocket 3', 'Scrambler', 'Speed Triple', 'Speed Twin', 'Street Scrambler', 'Street Triple', 'Thruxton', 'Tiger 800', 'Tiger 850', 'Tiger 900', 'Tiger 1200', 'Trident 660'],
    'Yamaha': ['Bolt', 'FJR1300', 'FZ-07', 'FZ-09', 'FZ-10', 'FZ1', 'FZ6', 'FZ8', 'Fazer', 'MT-03', 'MT-07', 'MT-09', 'MT-10', 'MT-125', 'NMAX', 'R1', 'R1M', 'R3', 'R6', 'R7', 'SCR950', 'SR400', 'Star', 'Super Ténéré', 'T-Max', 'Tenere 700', 'Tracer 700', 'Tracer 900', 'TW200', 'V-Max', 'V-Star', 'Virago', 'WR250', 'XJ6', 'XJR1300', 'XSR700', 'XSR900', 'XT660', 'YBR125', 'YZF-R125', 'YZF-R15']
  },
  
  water: {
    'BRP': ['GTI 90', 'GTI 130', 'GTI SE 130', 'GTI SE 170', 'GTR 230', 'GTX 155', 'GTX 170', 'GTX Limited 300', 'GTX Pro 130', 'RXP-X 300', 'RXT 260', 'RXT 300', 'RXT-X 300', 'Sea-Doo Fish Pro', 'Sea-Doo GTI', 'Sea-Doo GTR', 'Sea-Doo GTX', 'Sea-Doo RXP', 'Sea-Doo RXT', 'Sea-Doo Spark', 'Sea-Doo Wake', 'Sea-Doo Wake Pro', 'Spark 60', 'Spark 90', 'Spark Trixx', 'Wake 155', 'Wake 170', 'Wake Pro 230'],
    'Honda': ['Aquatrax F-12', 'Aquatrax F-12X', 'Aquatrax F-15', 'Aquatrax F-15X', 'Aquatrax R-12', 'Aquatrax R-12X'],
    'Kawasaki': ['Jet Ski 550', 'Jet Ski 750', 'Jet Ski 800', 'Jet Ski Sport', 'Jet Ski STX', 'Jet Ski STX 160', 'Jet Ski SX-R', 'Jet Ski SX-R 1500', 'Jet Ski Ultra', 'Jet Ski Ultra 160', 'Jet Ski Ultra 250X', 'Jet Ski Ultra 300X', 'Jet Ski Ultra 310', 'Jet Ski Ultra LX', 'Ultra 160 LX', 'Ultra 250X', 'Ultra 260X', 'Ultra 300X', 'Ultra 310LX', 'Ultra 310R', 'Ultra 310X'],
    'Polaris': ['Genesis', 'MSX 110', 'MSX 140', 'MSX 150', 'SL 650', 'SL 700', 'SL 750', 'SL 780', 'SL 900', 'SLT 750', 'SLTX', 'Virage'],
    'Yamaha': ['EX', 'EX Deluxe', 'EX Sport', 'EXR', 'FX', 'FX Cruiser', 'FX Cruiser HO', 'FX Cruiser SVHO', 'FX HO', 'FX SVHO', 'FZR', 'FZS', 'GP1200', 'GP1300', 'GP800', 'GP1800', 'GP1800R', 'SuperJet', 'VX', 'VX Cruiser', 'VX Cruiser HO', 'VX Deluxe', 'VX Limited', 'VX Sport', 'VXR', 'VXS', 'WaveBlaster', 'WaveRunner', 'WaveRunner EX', 'WaveRunner VX']
  }
};

const categoryNames = {
  car: '🚗 Легковой',
  truck: '🚚 Грузовой',
  parts: '🔧 Комплектующие',
  special: '🚜 Спецтехника',
  moto: '🏍 Мототехника',
  water: '🚤 Водный'
};

// Типы запчастей и комплектующих
const PARTS_TYPES = [
    {type: 'Двигатель и навесное', desc: 'блок, головка, турбина, навесное'},
    {type: 'КПП и сцепление', desc: 'коробка передач, сцепление'},
    {type: 'Кузовные детали', desc: 'двери, крылья, бамперы, капоты'},
    {type: 'Оптика', desc: 'фары, фонари, повторители'},
    {type: 'Салон', desc: 'сиденья, панели, руль, обшивки'},
    {type: 'Подвеска и рулевое', desc: 'амортизаторы, рычаги, рейка'},
    {type: 'Тормозная система', desc: 'диски, колодки, суппорты'},
    {type: 'Электрика и датчики', desc: 'блоки управления, датчики, проводка'},
    {type: 'Шины и диски', desc: 'резина, литые/штампованные диски'},
    {type: 'Аудио и мультимедия', desc: 'магнитолы, динамики, камеры'},
    {type: 'Другое', desc: 'чехлы, коврики, аксессуары'}
];

// Состояние запчастей
const PARTS_CONDITIONS = [
    'Новое',
    'Б/У рабочее',
    'Восстановленное',
    'Требует ремонта'
];

// ═══ ВИДЫ ТОПЛИВА ═══
const FUEL_TYPES = [
    'Бензин',
    'Дизель',
    'Газ (метан)',
    'Газ (пропан)',
    'Бензин + газ',
    'Гибрид',
    'Гибрид + газ',
    'Электро',
    'Plug-in гибрид'
];

function randomDrive(brand, model, category) {
  if (category !== 'car') return null;
  
  // SUV и кроссоверы - чаще полный привод
  const suvModels = ['X5', 'X3', 'GLE', 'GLC', 'Q5', 'Q7', 'Tiguan', 'Touareg', 'CR-V', 'RAV4', 'Sportage', 'Tucson', 'Sorento', 'CX-5', 'Outlander', 'Pajero', 'Land Cruiser', 'Range Rover', 'Discovery', 'Cayenne', 'Macan'];
  const isSUV = suvModels.some(suv => model.includes(suv));
  
  const r = Math.random();
  if (isSUV) {
    return r < 0.7 ? 'Полный' : (r < 0.9 ? 'Передний' : 'Задний');
  }
  return r < 0.6 ? 'Передний' : (r < 0.85 ? 'Задний' : 'Полный');
}

// Функции для тестовых данных
const now = new Date();
const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

function randomDate(start, end) {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return d.toISOString();
}

function randomUser() {
  return 'test_user_' + Math.floor(Math.random() * 5 + 1);
}

// Тестовые данные
function initCarsData() {
  return [];
}
