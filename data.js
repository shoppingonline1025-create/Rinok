// ============================================
// ДАННЫЕ - v6.1 - 2026-02-10 20:00
// ============================================

console.log('=== DATA.JS v6.1 ЗАГРУЖЕН ===');

// РАСШИРЕННЫЙ справочник марок и моделей
const BRANDS_DATA = {
  car: {
    'Abarth': ['124 Spider', '500', '595', '595C', '695', '695C', 'Grande Punto'],
    'Acura': ['ILX', 'MDX', 'NSX', 'RDX', 'RLX', 'TLX', 'ZDX', 'Integra', 'Legend', 'RL', 'RSX', 'TSX'],
    'Alfa Romeo': ['4C', '147', '156', '159', '166', 'Brera', 'Giulia', 'Giulietta', 'GT', 'GTV', 'MiTo', 'Spider', 'Stelvio', 'Tonale'],
    'Aston Martin': ['DB11', 'DB9', 'DBS', 'DBX', 'Rapide', 'V8 Vantage', 'V12 Vantage', 'Vanquish', 'Vantage'],
    'Audi': ['100', '80', 'A1', 'A2', 'A3', 'A4', 'A4 Allroad', 'A5', 'A6', 'A6 Allroad', 'A7', 'A8', 'e-tron', 'e-tron GT', 'Q2', 'Q3', 'Q4 e-tron', 'Q5', 'Q7', 'Q8', 'R8', 'RS3', 'RS4', 'RS5', 'RS6', 'RS7', 'RS Q3', 'RS Q8', 'S3', 'S4', 'S5', 'S6', 'S7', 'S8', 'SQ5', 'SQ7', 'SQ8', 'TT', 'TTS'],
    'Bentley': ['Arnage', 'Azure', 'Bentayga', 'Continental', 'Continental GT', 'Flying Spur', 'Mulsanne'],
    'BMW': ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '6 Series', '7 Series', '8 Series', 'i3', 'i4', 'i7', 'i8', 'iX', 'iX3', 'M2', 'M3', 'M4', 'M5', 'M6', 'M8', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'Z3', 'Z4', 'Z8'],
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
    'Ford': ['B-MAX', 'Bronco', 'C-MAX', 'EcoSport', 'Edge', 'Escape', 'Excursion', 'Expedition', 'Explorer', 'F-150', 'F-250', 'F-350', 'Fiesta', 'Flex', 'Focus', 'Fusion', 'Galaxy', 'Ka', 'Kuga', 'Mondeo', 'Mustang', 'Puma', 'Ranger', 'S-MAX', 'Taurus', 'Tourneo', 'Transit'],
    'Geely': ['Atlas', 'Coolray', 'Emgrand', 'Emgrand X7', 'GC6', 'Geometry C', 'MK', 'Monjaro', 'Otaka', 'Tugella'],
    'Genesis': ['G70', 'G80', 'G90', 'GV60', 'GV70', 'GV80'],
    'GMC': ['Acadia', 'Canyon', 'Envoy', 'Jimmy', 'Safari', 'Savana', 'Sierra', 'Terrain', 'Yukon', 'Yukon XL'],
    'Great Wall': ['Deer', 'Haval H2', 'Haval H3', 'Haval H5', 'Haval H6', 'Haval H9', 'Hover', 'Pegasus', 'Peri', 'Poer', 'Safe', 'Sailor', 'Sing', 'Socool', 'Voleex C10', 'Voleex C30', 'Wingle'],
    'Haval': ['Dargo', 'F7', 'F7x', 'H2', 'H6', 'H9', 'Jolion', 'M6'],
    'Honda': ['Accord', 'Civic', 'City', 'CR-V', 'CR-Z', 'Crosstour', 'e', 'Element', 'Fit', 'FR-V', 'HR-V', 'Insight', 'Jazz', 'Legend', 'Odyssey', 'Passport', 'Pilot', 'Prelude', 'Ridgeline', 'S2000', 'Shuttle', 'Stream'],
    'Hummer': ['H1', 'H2', 'H3', 'EV'],
    'Hyundai': ['Accent', 'Atos', 'Avante', 'Azera', 'Bayon', 'Creta', 'Elantra', 'Equus', 'Getz', 'Grand Santa Fe', 'Grand Starex', 'Genesis', 'H-1', 'i10', 'i20', 'i30', 'i40', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'ix20', 'ix35', 'ix55', 'Kona', 'Matrix', 'Palisade', 'Santa Fe', 'Solaris', 'Sonata', 'Staria', 'Starex', 'Terracan', 'Trajet', 'Tucson', 'Veloster', 'Venue', 'Veracruz', 'Verna'],
    'Infiniti': ['EX', 'FX', 'G', 'M', 'Q30', 'Q50', 'Q60', 'Q70', 'QX30', 'QX50', 'QX55', 'QX56', 'QX60', 'QX70', 'QX80'],
    'Isuzu': ['D-Max', 'MU-X', 'Trooper', 'VehiCross'],
    'Jaguar': ['E-Pace', 'F-Pace', 'F-Type', 'I-Pace', 'S-Type', 'X-Type', 'XE', 'XF', 'XJ', 'XK'],
    'Jeep': ['Cherokee', 'Commander', 'Compass', 'Gladiator', 'Grand Cherokee', 'Liberty', 'Patriot', 'Renegade', 'Wrangler'],
    'Kia': ['Carens', 'Carnival', 'Ceed', 'Cerato', 'Clarus', 'EV6', 'K5', 'K7', 'K8', 'K9', 'Magentis', 'Mohave', 'Niro', 'Opirus', 'Optima', 'Picanto', 'Pride', 'Quoris', 'Rio', 'Sedona', 'Seltos', 'Sephia', 'Shuma', 'Sorento', 'Soul', 'Spectra', 'Sportage', 'Stinger', 'Stonic', 'Venga'],
    'Lada': ['110', '111', '112', '2101', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '21099', '2110', '2111', '2112', '2113', '2114', '2115', '4x4', 'Granta', 'Kalina', 'Largus', 'Niva', 'Priora', 'Samara', 'Vesta', 'XRAY'],
    'Lamborghini': ['Aventador', 'Countach', 'Diablo', 'Gallardo', 'Huracan', 'Murcielago', 'Revuelto', 'Urus'],
    'Lancia': ['Delta', 'Lybra', 'Musa', 'Phedra', 'Thema', 'Thesis', 'Voyager', 'Ypsilon', 'Zeta'],
    'Land Rover': ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport', 'Range Rover Velar'],
    'Lexus': ['CT', 'ES', 'GS', 'GX', 'HS', 'IS', 'LC', 'LFA', 'LS', 'LX', 'NX', 'RC', 'RX', 'SC', 'UX'],
    'Lincoln': ['Aviator', 'Continental', 'Corsair', 'MKC', 'MKS', 'MKT', 'MKX', 'MKZ', 'Navigator', 'Nautilus', 'Town Car'],
    'Lotus': ['Elise', 'Emira', 'Evora', 'Exige'],
    'Maserati': ['Ghibli', 'GranCabrio', 'GranTurismo', 'Grecale', 'Levante', 'MC20', 'Quattroporte'],
    'Maybach': ['57', '62', 'GLS', 'S-Class'],
    'Mazda': ['2', '3', '3 MPS', '5', '6', '6 MPS', '323', '626', 'Atenza', 'Axela', 'BT-50', 'CX-3', 'CX-30', 'CX-5', 'CX-50', 'CX-60', 'CX-7', 'CX-9', 'CX-90', 'Demio', 'Familia', 'MPV', 'MX-5', 'MX-30', 'Premacy', 'RX-7', 'RX-8', 'Tribute', 'Xedos'],
    'McLaren': ['540C', '570GT', '570S', '600LT', '650S', '675LT', '720S', 'Artura', 'GT', 'P1'],
    'Mercedes': ['A-Class', 'AMG GT', 'B-Class', 'C-Class', 'CL-Class', 'CLA', 'CLC', 'CLK', 'CLS', 'E-Class', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'G-Class', 'GL-Class', 'GLA', 'GLB', 'GLC', 'GLE', 'GLK', 'GLS', 'ML-Class', 'R-Class', 'S-Class', 'SL-Class', 'SLC', 'SLK', 'SLR', 'SLS', 'Sprinter', 'V-Class', 'Vaneo', 'Viano', 'Vito'],
    'MG': ['3', '5', '6', 'HS', 'Marvel R', 'MG3', 'MG5', 'MG6', 'ZR', 'ZS', 'ZT'],
    'Mini': ['Clubman', 'Countryman', 'Cooper', 'Cooper S', 'John Cooper Works', 'One', 'Paceman'],
    'Mitsubishi': ['ASX', 'Carisma', 'Colt', 'Eclipse', 'Eclipse Cross', 'Galant', 'Grandis', 'i-MiEV', 'L200', 'Lancer', 'Lancer Evolution', 'Montero', 'Outlander', 'Pajero', 'Pajero Pinin', 'Pajero Sport', 'Space Star'],
    'Nissan': ['350Z', '370Z', 'Almera', 'Altima', 'Ariya', 'Armada', 'Cube', 'GT-R', 'Juke', 'Kicks', 'Leaf', 'Maxima', 'Micra', 'Murano', 'Navara', 'Note', 'NP300', 'NV200', 'Pathfinder', 'Patrol', 'Pixo', 'Primastar', 'Primera', 'Pulsar', 'Qashqai', 'Qashqai+2', 'Quest', 'Rogue', 'Sentra', 'Sunny', 'Teana', 'Terrano', 'Tiida', 'Titan', 'Versa', 'X-Trail', 'Xterra'],
    'Opel': ['Adam', 'Agila', 'Ampera', 'Antara', 'Astra', 'Combo', 'Corsa', 'Crossland', 'Frontera', 'Grandland', 'Insignia', 'Karl', 'Meriva', 'Mokka', 'Omega', 'Signum', 'Tigra', 'Vectra', 'Vivaro', 'Zafira'],
    'Peugeot': ['107', '108', '206', '207', '208', '2008', '3008', '301', '307', '308', '4007', '4008', '406', '407', '408', '5008', '508', '607', '807', 'Boxer', 'Expert', 'Partner', 'RCZ', 'Rifter', 'Traveller'],
    'Porsche': ['718', '911', '918', '924', '928', '944', '968', 'Boxster', 'Carrera GT', 'Cayenne', 'Cayman', 'Macan', 'Panamera', 'Taycan'],
    'RAM': ['1500', '2500', '3500', 'ProMaster'],
    'Renault': ['Arkana', 'Captur', 'Clio', 'Duster', 'Espace', 'Fluence', 'Grand Scenic', 'Kadjar', 'Kangoo', 'Kaptur', 'Koleos', 'Laguna', 'Logan', 'Master', 'Megane', 'Modus', 'Sandero', 'Scenic', 'Symbol', 'Talisman', 'Thalia', 'Trafic', 'Twingo', 'Vel Satis', 'Wind'],
    'Rolls-Royce': ['Cullinan', 'Dawn', 'Ghost', 'Phantom', 'Silver Cloud', 'Silver Shadow', 'Silver Spur', 'Wraith'],
    'Saab': ['9-3', '9-4X', '9-5', '9-7X', '900', '9000'],
    'Seat': ['Alhambra', 'Altea', 'Arona', 'Arosa', 'Ateca', 'Cordoba', 'Exeo', 'Ibiza', 'Leon', 'Mii', 'Tarraco', 'Toledo'],
    'Skoda': ['Citigo', 'Fabia', 'Favorit', 'Felicia', 'Kamiq', 'Karoq', 'Kodiaq', 'Octavia', 'Rapid', 'Roomster', 'Scala', 'Superb', 'Yeti'],
    'Smart': ['Crossblade', 'ForFour', 'ForTwo', 'Roadster'],
    'SsangYong': ['Actyon', 'Korando', 'Kyron', 'Musso', 'Rexton', 'Rodius', 'Tivoli', 'XLV'],
    'Subaru': ['Ascent', 'BRZ', 'Crosstrek', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'SVX', 'Tribeca', 'WRX', 'WRX STI', 'XV'],
    'Suzuki': ['Alto', 'Baleno', 'Celerio', 'Ciaz', 'Ertiga', 'Grand Vitara', 'Ignis', 'Jimny', 'Kizashi', 'Liana', 'S-Cross', 'Samurai', 'Splash', 'Swift', 'SX4', 'Vitara', 'Wagon R', 'XL7'],
    'Tesla': ['Cybertruck', 'Model 3', 'Model S', 'Model X', 'Model Y', 'Roadster'],
    'Toyota': ['4Runner', '86', 'Alphard', 'Aqua', 'Auris', 'Avalon', 'Avensis', 'Aygo', 'bZ4X', 'C-HR', 'Camry', 'Celica', 'Corolla', 'Corona', 'Crown', 'FJ Cruiser', 'Fortuner', 'GT86', 'Highlander', 'Hilux', 'iQ', 'Land Cruiser', 'Land Cruiser Prado', 'Mark II', 'Matrix', 'Mirai', 'MR2', 'Previa', 'Prius', 'RAV4', 'Sequoia', 'Sienna', 'Supra', 'Tacoma', 'Tundra', 'Urban Cruiser', 'Vellfire', 'Venza', 'Verso', 'Yaris'],
    'UAZ': ['Hunter', 'Patriot', 'Pickup', 'Profi'],
    'Volkswagen': ['Amarok', 'Arteon', 'Atlas', 'Beetle', 'Bora', 'Caddy', 'Caravelle', 'CC', 'Crafter', 'Eos', 'Fox', 'Golf', 'Golf Plus', 'ID.3', 'ID.4', 'ID.5', 'Jetta', 'Lupo', 'Multivan', 'New Beetle', 'Passat', 'Passat CC', 'Phaeton', 'Pointer', 'Polo', 'Scirocco', 'Sharan', 'T-Cross', 'T-Roc', 'Taos', 'Tiguan', 'Touareg', 'Touran', 'Transporter', 'up!', 'Vento'],
    'Volvo': ['240', '740', '850', '940', '960', 'C30', 'C40', 'C70', 'S40', 'S60', 'S70', 'S80', 'S90', 'V40', 'V50', 'V60', 'V70', 'V90', 'XC40', 'XC60', 'XC70', 'XC90']
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
    'Harley': ['Breakout', 'Dyna', 'Electra Glide', 'Fat Bob', 'Fat Boy', 'Forty-Eight', 'Heritage', 'Iron 883', 'Iron 1200', 'Low Rider', 'Night Rod', 'Road Glide', 'Road King', 'Softail', 'Sportster', 'Street', 'Street Bob', 'Street Glide', 'Touring', 'V-Rod', 'Wide Glide'],
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
  special: '🚜 Спецтехника',
  moto: '🏍 Мототехника',
  water: '🚤 Водный'
};

// Функция для генерации рандомного привода на основе модели
function randomDrive(brand, model, category) {
  if (category !== 'car') return null;
  
  // SUV и кроссоверы - чаще полный привод
  const suvModels = ['X5', 'X3', 'GLE', 'GLC', 'Q5', 'Q7', 'Tiguan', 'Touareg', 'CR-V', 'RAV4', 'Sportage', 'Tucson', 'Sorento', 'CX-5', 'Outlander', 'Pajero', 'Land Cruiser', 'Range Rover', 'Discovery', 'Cayenne', 'Macan'];
  const isSUV = suvModels.some(suv => model.includes(suv));
  
  if (isSUV) {
    const rand = Math.random();
    if (rand < 0.7) return 'Полный';
    if (rand < 0.85) return 'Передний';
    return 'Задний';
  }
  
  // Спортивные модели - чаще задний или полный
  const sportModels = ['M3', 'M5', 'AMG', 'RS', 'S-Line', 'R-Line', 'GT'];
  const isSport = sportModels.some(sport => model.includes(sport));
  
  if (isSport) {
    const rand = Math.random();
    if (rand < 0.5) return 'Задний';
    if (rand < 0.8) return 'Полный';
    return 'Передний';
  }
  
  // Обычные авто - чаще передний
  const rand = Math.random();
  if (rand < 0.75) return 'Передний';
  if (rand < 0.90) return 'Полный';
  return 'Задний';
}

// Функция для рандомного выбора пользователя
function randomUser() {
  const users = ['user_1', 'user_2', 'user_3', 'user_4', 'user_5'];
  return users[Math.floor(Math.random() * users.length)];
}

// 98 объявлений с рандомными датами за 15 дней и полем drive
function initCarsData() {
  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  return [
    {id:1,category:'car',brand:'Toyota',model:'Camry',year:2020,price:25000,currency:'$',mileage:45000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Тирасполь',registration:'ПМР',description:'Отличное состояние',photos:['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:2,category:'car',brand:'BMW',model:'X5',year:2019,price:42000,currency:'$',mileage:62000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Полный привод',photos:['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:3,category:'car',brand:'Mercedes',model:'E-Class',year:2021,price:58000,currency:'€',mileage:28000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Задний',city:'Тирасполь',registration:'ПМР',description:'AMG пакет',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:4,category:'car',brand:'Hyundai',model:'Solaris',year:2022,price:13500,currency:'$',mileage:15000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Рыбница',registration:'ПМР',description:'Новый',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:5,category:'truck',brand:'Mercedes',model:'Actros',year:2018,price:75000,currency:'€',mileage:280000,engine:'12.8 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Грузовик',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:6,category:'moto',brand:'Harley',model:'Iron 883',year:2020,price:15000,currency:'$',mileage:8000,engine:'1.2 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Мотоцикл',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:7,category:'special',brand:'Caterpillar',model:'320',year:2017,price:95000,currency:'$',mileage:4500,engine:'4.4 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Рыбница',registration:'ПМР',description:'Экскаватор',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:8,category:'water',brand:'Yamaha',model:'VX',year:2021,price:18000,currency:'$',mileage:150,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Днестровск',registration:'ПМР',description:'Гидроцикл',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:9,category:'car',brand:'Audi',model:'A4',year:2020,price:35000,currency:'€',mileage:48000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Quattro',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:10,category:'car',brand:'Volkswagen',model:'Polo',year:2019,price:12000,currency:'$',mileage:65000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',drive:'Передний',city:'Бельцы',registration:'Молдова',description:'Надежный',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:11,category:'car',brand:'Kia',model:'Sportage',year:2021,price:28000,currency:'$',mileage:35000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Кроссовер',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:12,category:'car',brand:'Mazda',model:'CX-5',year:2020,price:26500,currency:'$',mileage:42000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Рыбница',registration:'ПМР',description:'Полный привод',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:13,category:'car',brand:'Honda',model:'Accord',year:2019,price:22000,currency:'$',mileage:58000,engine:'2.4 л',transmission:'Вариатор',fuel:'Бензин',drive:'Передний',city:'Тирасполь',registration:'ПМР',description:'Японская надежность',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:14,category:'car',brand:'Nissan',model:'Qashqai',year:2018,price:18500,currency:'€',mileage:72000,engine:'1.6 л',transmission:'Вариатор',fuel:'Бензин',drive:'Передний',city:'Григориополь',registration:'ПМР',description:'Семейный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:15,category:'car',brand:'Ford',model:'Focus',year:2017,price:11000,currency:'$',mileage:95000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',drive:'Передний',city:'Дубоссары',registration:'ПМР',description:'В хорошем состоянии',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:16,category:'car',brand:'Chevrolet',model:'Cruze',year:2016,price:9500,currency:'$',mileage:110000,engine:'1.8 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Каменка',registration:'ПМР',description:'Недорого',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:17,category:'car',brand:'Skoda',model:'Rapid',year:2020,price:14500,currency:'€',mileage:38000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Слободзея',registration:'ПМР',description:'Экономичный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:18,category:'car',brand:'Renault',model:'Logan',year:2018,price:8500,currency:'$',mileage:88000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',drive:'Передний',city:'Бендеры',registration:'Молдова',description:'Простой и надежный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:19,category:'car',brand:'Lada',model:'Vesta',year:2021,price:9800,currency:'$',mileage:22000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',drive:'Передний',city:'Кагул',registration:'Молдова',description:'Новая Лада',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:20,category:'car',brand:'Peugeot',model:'308',year:2019,price:15000,currency:'€',mileage:62000,engine:'1.6 л',transmission:'Автомат',fuel:'Дизель',drive:'Передний',city:'Тирасполь',registration:'ПМР',description:'Французский стиль',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:21,category:'car',brand:'Citroen',model:'C4',year:2018,price:13000,currency:'$',mileage:75000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Кишинёв',registration:'Молдова',description:'Комфортный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:22,category:'car',brand:'Opel',model:'Astra',year:2017,price:11500,currency:'€',mileage:92000,engine:'1.4 л',transmission:'Механика',fuel:'Бензин',drive:'Передний',city:'Рыбница',registration:'ПМР',description:'Немецкое качество',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:23,category:'car',brand:'Seat',model:'Leon',year:2019,price:16000,currency:'€',mileage:55000,engine:'1.5 л',transmission:'Робот',fuel:'Бензин',drive:'Передний',city:'Бельцы',registration:'Молдова',description:'TSI DSG',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:24,category:'car',brand:'Subaru',model:'Outback',year:2018,price:24000,currency:'$',mileage:68000,engine:'2.5 л',transmission:'Вариатор',fuel:'Бензин',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Симметричный полный привод',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:25,category:'car',brand:'Mitsubishi',model:'Outlander',year:2020,price:27000,currency:'$',mileage:38000,engine:'2.4 л',transmission:'Вариатор',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'PHEV',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:26,category:'car',brand:'Lexus',model:'RX',year:2019,price:52000,currency:'$',mileage:42000,engine:'3.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Премиум',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:27,category:'car',brand:'Infiniti',model:'QX50',year:2018,price:35000,currency:'$',mileage:58000,engine:'3.7 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Luxury',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:28,category:'car',brand:'Volvo',model:'XC60',year:2019,price:42000,currency:'€',mileage:45000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Бельцы',registration:'Молдова',description:'Безопасность прежде всего',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:29,category:'car',brand:'Land Rover',model:'Discovery',year:2018,price:48000,currency:'$',mileage:52000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Настоящий внедорожник',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:30,category:'car',brand:'Jeep',model:'Grand Cherokee',year:2019,price:45000,currency:'$',mileage:48000,engine:'3.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'4x4',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:31,category:'car',brand:'Porsche',model:'Cayenne',year:2017,price:55000,currency:'€',mileage:72000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Рыбница',registration:'ПМР',description:'Спортивное SUV',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:32,category:'truck',brand:'Scania',model:'R450',year:2019,price:85000,currency:'€',mileage:320000,engine:'13.0 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Тягач седельный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:33,category:'truck',brand:'Volvo',model:'FH16',year:2020,price:95000,currency:'€',mileage:250000,engine:'16.0 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Euro 6',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:34,category:'truck',brand:'MAN',model:'TGX',year:2018,price:78000,currency:'€',mileage:380000,engine:'12.4 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Бельцы',registration:'Молдова',description:'Надежный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:35,category:'truck',brand:'Kamaz',model:'65207',year:2021,price:62000,currency:'$',mileage:85000,engine:'11.7 л',transmission:'Механика',fuel:'Дизель',drive:null,city:'Рыбница',registration:'ПМР',description:'Самосвал',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:36,category:'special',brand:'Komatsu',model:'PC200',year:2019,price:92000,currency:'$',mileage:3200,engine:'6.7 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Экскаватор гусеничный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:37,category:'special',brand:'Liebherr',model:'R934',year:2020,price:105000,currency:'€',mileage:2800,engine:'5.7 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'18 тонн',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:38,category:'special',brand:'Hitachi',model:'ZX210',year:2018,price:88000,currency:'$',mileage:4200,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Бельцы',registration:'Молдова',description:'Экскаватор 21т',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:39,category:'car',brand:'Toyota',model:'RAV4',year:2021,price:33000,currency:'$',mileage:25000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Гибрид AWD',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:40,category:'car',brand:'BMW',model:'X3',year:2020,price:38000,currency:'€',mileage:42000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'xDrive',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:41,category:'car',brand:'Mercedes',model:'GLE',year:2020,price:62000,currency:'€',mileage:38000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'4Matic',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:42,category:'car',brand:'Audi',model:'Q5',year:2019,price:42000,currency:'€',mileage:55000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Бельцы',registration:'Молдова',description:'Quattro Premium',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:43,category:'car',brand:'Volkswagen',model:'Tiguan',year:2021,price:29000,currency:'$',mileage:32000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Рыбница',registration:'ПМР',description:'4Motion R-Line',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:44,category:'car',brand:'Hyundai',model:'Tucson',year:2020,price:24000,currency:'$',mileage:38000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Полная комплектация',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:45,category:'car',brand:'Kia',model:'Sorento',year:2019,price:28000,currency:'$',mileage:52000,engine:'2.2 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Кагул',registration:'Молдова',description:'7 мест 4WD',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:46,category:'car',brand:'Mazda',model:'6',year:2018,price:18000,currency:'$',mileage:68000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Григориополь',registration:'ПМР',description:'Седан бизнес класса',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:47,category:'car',brand:'Honda',model:'CR-V',year:2020,price:29000,currency:'$',mileage:42000,engine:'1.5 л',transmission:'Вариатор',fuel:'Бензин',drive:'Полный',city:'Днестровск',registration:'ПМР',description:'Турбо AWD',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:48,category:'car',brand:'Nissan',model:'X-Trail',year:2019,price:23000,currency:'$',mileage:58000,engine:'2.0 л',transmission:'Вариатор',fuel:'Бензин',drive:'Полный',city:'Слободзея',registration:'ПМР',description:'7 мест',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:49,category:'car',brand:'Ford',model:'Kuga',year:2020,price:26000,currency:'$',mileage:45000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Дубоссары',registration:'ПМР',description:'EcoBoost AWD',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:50,category:'car',brand:'Skoda',model:'Octavia',year:2021,price:22000,currency:'€',mileage:28000,engine:'1.5 л',transmission:'Робот',fuel:'Бензин',drive:'Передний',city:'Каменка',registration:'ПМР',description:'TSI DSG',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:51,category:'truck',brand:'DAF',model:'XF',year:2019,price:72000,currency:'€',mileage:380000,engine:'12.9 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Тягач седельный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:52,category:'truck',brand:'Iveco',model:'Stralis',year:2018,price:58000,currency:'€',mileage:420000,engine:'11.0 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Euro 6',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:53,category:'truck',brand:'Renault',model:'T',year:2020,price:68000,currency:'€',mileage:280000,engine:'11.0 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Рыбница',registration:'ПМР',description:'High Sleeper Cab',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:54,category:'truck',brand:'Mercedes',model:'Arocs',year:2019,price:78000,currency:'€',mileage:220000,engine:'10.7 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Бельцы',registration:'Молдова',description:'Самосвал 8x4',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:55,category:'moto',brand:'Ducati',model:'Monster 821',year:2020,price:16000,currency:'€',mileage:8500,engine:'0.8 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Naked bike',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:56,category:'moto',brand:'BMW',model:'R 1250 GS',year:2021,price:22000,currency:'€',mileage:12000,engine:'1.25 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Тирасполь',registration:'ПМР',description:'Adventure',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:57,category:'moto',brand:'Yamaha',model:'MT-09',year:2019,price:11000,currency:'$',mileage:18000,engine:'0.85 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Рыбница',registration:'ПМР',description:'Street fighter',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:58,category:'moto',brand:'Kawasaki',model:'Z900',year:2020,price:12500,currency:'$',mileage:14000,engine:'0.95 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Бендеры',registration:'Молдова',description:'Naked',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:59,category:'special',brand:'Volvo',model:'EC210',year:2019,price:88000,currency:'€',mileage:3800,engine:'5.7 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Гусеничный',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:60,category:'special',brand:'Hyundai',model:'R210',year:2020,price:82000,currency:'$',mileage:2900,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Экскаватор 21т',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:61,category:'special',brand:'Doosan',model:'DX225',year:2018,price:75000,currency:'$',mileage:4200,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Рыбница',registration:'ПМР',description:'22 тонны',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:62,category:'special',brand:'JCB',model:'4CX',year:2020,price:72000,currency:'€',mileage:2800,engine:'4.8 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Бельцы',registration:'Молдова',description:'Погрузчик-экскаватор',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:63,category:'water',brand:'Yamaha',model:'FX',year:2021,price:17000,currency:'$',mileage:60,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Днестровск',registration:'ПМР',description:'Cruiser HO',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:64,category:'water',brand:'BRP',model:'Sea-Doo RXT',year:2020,price:19000,currency:'$',mileage:85,engine:'1.6 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Тирасполь',registration:'ПМР',description:'Performance',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:65,category:'water',brand:'Kawasaki',model:'Jet Ski STX',year:2019,price:13500,currency:'$',mileage:140,engine:'1.5 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Rec',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:66,category:'water',brand:'Yamaha',model:'GP1800',year:2021,price:18500,currency:'$',mileage:45,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Днестровск',registration:'ПМР',description:'SVHO',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:67,category:'car',brand:'Tesla',model:'Model 3',year:2022,price:48000,currency:'$',mileage:12000,engine:'Электро',transmission:'Автомат',fuel:'Электро',drive:'Задний',city:'Кишинёв',registration:'Молдова',description:'Long Range',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:68,category:'car',brand:'Genesis',model:'GV80',year:2021,price:62000,currency:'$',mileage:18000,engine:'3.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Премиум SUV',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:69,category:'car',brand:'Alfa Romeo',model:'Giulia',year:2020,price:42000,currency:'€',mileage:32000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Задний',city:'Кишинёв',registration:'Молдова',description:'Итальянский стиль',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:70,category:'car',brand:'Maserati',model:'Ghibli',year:2019,price:58000,currency:'$',mileage:42000,engine:'3.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Задний',city:'Бельцы',registration:'Молдова',description:'Роскошный седан',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:71,category:'car',brand:'Jaguar',model:'XE',year:2019,price:35000,currency:'€',mileage:48000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Задний',city:'Тирасполь',registration:'ПМР',description:'Британский премиум',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:72,category:'car',brand:'Cadillac',model:'XT5',year:2020,price:52000,currency:'$',mileage:35000,engine:'3.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Американская роскошь',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:73,category:'car',brand:'Range Rover',model:'Sport',year:2019,price:72000,currency:'$',mileage:45000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'HSE Dynamic',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:74,category:'car',brand:'Jaguar',model:'F-Pace',year:2020,price:48000,currency:'$',mileage:38000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',drive:'Полный',city:'Рыбница',registration:'ПМР',description:'R-Sport',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:75,category:'car',brand:'Peugeot',model:'3008',year:2021,price:28000,currency:'€',mileage:25000,engine:'1.5 л',transmission:'Автомат',fuel:'Дизель',drive:'Передний',city:'Кишинёв',registration:'Молдова',description:'GT Line',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:76,category:'car',brand:'Citroen',model:'C5 Aircross',year:2020,price:24000,currency:'$',mileage:32000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',drive:'Передний',city:'Бельцы',registration:'Молдова',description:'Комфорт',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:77,category:'car',brand:'Seat',model:'Ateca',year:2019,price:22000,currency:'€',mileage:48000,engine:'1.5 л',transmission:'Робот',fuel:'Бензин',drive:'Передний',city:'Тирасполь',registration:'ПМР',description:'FR',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:78,category:'car',brand:'Haval',model:'Jolion',year:2022,price:25000,currency:'$',mileage:8000,engine:'1.5 л',transmission:'Робот',fuel:'Бензин',drive:'Передний',city:'Кишинёв',registration:'Молдова',description:'Новый, гарантия',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:79,category:'car',brand:'BYD',model:'Tang',year:2023,price:48000,currency:'$',mileage:5000,engine:'Hybrid',transmission:'Автомат',fuel:'Гибрид',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Plug-in hybrid, 7 мест',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:80,category:'car',brand:'Geely',model:'Monjaro',year:2023,price:32000,currency:'$',mileage:3000,engine:'2.0 л',transmission:'Робот',fuel:'Бензин',drive:'Полный',city:'Бельцы',registration:'Молдова',description:'Flagship',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:81,category:'car',brand:'Chery',model:'Tiggo 8',year:2021,price:22000,currency:'$',mileage:35000,engine:'1.6 л',transmission:'Робот',fuel:'Бензин',drive:'Полный',city:'Рыбница',registration:'ПМР',description:'7 мест',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:82,category:'car',brand:'Lincoln',model:'Navigator',year:2020,price:72000,currency:'$',mileage:42000,engine:'3.5 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'Black Label, люкс',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:83,category:'car',brand:'Cadillac',model:'Escalade',year:2021,price:88000,currency:'$',mileage:28000,engine:'6.2 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Тирасполь',registration:'ПМР',description:'Premium Luxury',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:84,category:'car',brand:'Mini',model:'Cooper S Countryman',year:2019,price:24000,currency:'€',mileage:38000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',drive:'Полный',city:'Кишинёв',registration:'Молдова',description:'ALL4',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:85,category:'truck',brand:'Kenworth',model:'T680',year:2019,price:95000,currency:'$',mileage:450000,engine:'15.0 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Американский тягач',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:86,category:'truck',brand:'Freightliner',model:'Cascadia',year:2020,price:105000,currency:'$',mileage:380000,engine:'14.8 л',transmission:'Автомат',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Sleeper cab',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:87,category:'truck',brand:'Hino',model:'500',year:2021,price:62000,currency:'$',mileage:120000,engine:'7.7 л',transmission:'Механика',fuel:'Дизель',drive:null,city:'Рыбница',registration:'ПМР',description:'Японское качество',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:88,category:'special',brand:'Bobcat',model:'S205',year:2020,price:42000,currency:'$',mileage:1200,engine:'2.4 л',transmission:'Гидростатика',fuel:'Дизель',drive:null,city:'Тирасполь',registration:'ПМР',description:'Минипогрузчик',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:89,category:'special',brand:'Case',model:'CX210',year:2019,price:115000,currency:'€',mileage:2800,engine:'6.7 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Кишинёв',registration:'Молдова',description:'Экскаватор 21т',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:90,category:'special',brand:'John Deere',model:'310',year:2021,price:98000,currency:'$',mileage:1500,engine:'4.5 л',transmission:'Гидравлика',fuel:'Дизель',drive:null,city:'Бельцы',registration:'Молдова',description:'Погрузчик-экскаватор',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:91,category:'moto',brand:'Triumph',model:'Street Triple RS',year:2021,price:14500,currency:'€',mileage:8500,engine:'0.76 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Naked',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:92,category:'moto',brand:'KTM',model:'1290 Super Duke R',year:2020,price:17000,currency:'€',mileage:12000,engine:'1.3 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Тирасполь',registration:'ПМР',description:'Beast mode',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:93,category:'moto',brand:'Aprilia',model:'RSV4',year:2021,price:18500,currency:'€',mileage:6500,engine:'1.1 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Бельцы',registration:'Молдова',description:'Factory',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:94,category:'moto',brand:'Indian',model:'Scout Bobber',year:2020,price:15500,currency:'$',mileage:9500,engine:'1.1 л',transmission:'Механика',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Cruiser',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:95,category:'water',brand:'Yamaha',model:'SuperJet',year:2022,price:11000,currency:'$',mileage:25,engine:'1.0 л',transmission:'Jet',fuel:'Бензин',drive:null,city:'Днестровск',registration:'ПМР',description:'Stand-up',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:96,category:'water',brand:'BRP',model:'Sea-Doo Spark Trixx',year:2021,price:8500,currency:'$',mileage:45,engine:'0.9 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Тирасполь',registration:'ПМР',description:'Fun',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:97,category:'water',brand:'Kawasaki',model:'Jet Ski SX-R',year:2020,price:12500,currency:'$',mileage:35,engine:'1.5 л',transmission:'Jet',fuel:'Бензин',drive:null,city:'Днестровск',registration:'ПМР',description:'Stand-up',photos:[],isTop:false,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()},
    {id:98,category:'water',brand:'Yamaha',model:'VX Cruiser HO',year:2023,price:16500,currency:'$',mileage:10,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',drive:null,city:'Кишинёв',registration:'Молдова',description:'Новый',photos:[],isTop:true,createdAt:randomDate(fifteenDaysAgo,now),userId:randomUser()}
  ];
}
