// ============================================
// КОНФИГУРАЦИЯ И ДАННЫЕ
// ============================================
// Здесь можно добавлять новые марки, модели и объявления

// Справочник марок и моделей (фиксированный)
const BRANDS_DATA = {
  car: {
    'Toyota': ['Camry', 'Corolla', 'RAV4', 'Land Cruiser', 'Highlander', 'Prius', 'Yaris', 'Auris'],
    'BMW': ['X5', 'X3', 'X1', '3 Series', '5 Series', '7 Series', 'X6', 'X7'],
    'Mercedes': ['E-Class', 'C-Class', 'S-Class', 'GLE', 'GLC', 'A-Class', 'CLS', 'G-Class'],
    'Audi': ['A4', 'A6', 'Q5', 'Q7', 'A3', 'Q3', 'A8', 'Q8'],
    'Volkswagen': ['Polo', 'Passat', 'Golf', 'Tiguan', 'Jetta', 'Touareg', 'T-Roc', 'Arteon'],
    'Hyundai': ['Solaris', 'Creta', 'Tucson', 'Santa Fe', 'Elantra', 'Accent', 'Kona', 'Palisade'],
    'Kia': ['Sportage', 'Rio', 'Ceed', 'Sorento', 'Optima', 'Picanto', 'Soul', 'Stinger'],
    'Mazda': ['CX-5', '3', '6', 'CX-9', 'CX-3', '2', 'MX-5'],
    'Honda': ['Accord', 'Civic', 'CR-V', 'HR-V', 'Fit', 'Pilot', 'Insight'],
    'Nissan': ['Qashqai', 'X-Trail', 'Juke', 'Murano', 'Pathfinder', 'Micra', 'Leaf'],
    'Ford': ['Focus', 'Mondeo', 'Kuga', 'Fiesta', 'Mustang', 'Explorer', 'EcoSport'],
    'Chevrolet': ['Cruze', 'Malibu', 'Tahoe', 'Suburban', 'Camaro', 'Equinox', 'Traverse'],
    'Skoda': ['Rapid', 'Octavia', 'Superb', 'Kodiaq', 'Karoq', 'Fabia', 'Scala'],
    'Renault': ['Logan', 'Sandero', 'Duster', 'Kaptur', 'Arkana', 'Megane', 'Clio'],
    'Lada': ['Vesta', 'Granta', 'Largus', 'XRAY', 'Niva', 'Kalina'],
    'Lexus': ['RX', 'NX', 'ES', 'LX', 'IS', 'GX', 'UX'],
    'Infiniti': ['QX60', 'QX50', 'QX80', 'Q50', 'Q60', 'QX30'],
    'Subaru': ['Outback', 'Forester', 'XV', 'Impreza', 'Legacy', 'WRX'],
    'Mitsubishi': ['Outlander', 'ASX', 'Pajero', 'Eclipse Cross', 'Lancer', 'L200'],
    'Jeep': ['Grand Cherokee', 'Wrangler', 'Compass', 'Renegade', 'Cherokee'],
    'Land Rover': ['Discovery', 'Range Rover', 'Defender', 'Evoque', 'Sport']
  },
  truck: {
    'Mercedes': ['Actros', 'Arocs', 'Atego', 'Axor'],
    'MAN': ['TGX', 'TGS', 'TGL', 'TGM'],
    'Volvo': ['FH', 'FH16', 'FM', 'FMX'],
    'Scania': ['R450', 'R500', 'G410', 'S500'],
    'Камаз': ['6520', '65115', '5490', '43118'],
    'DAF': ['XF', 'CF', 'LF'],
    'Iveco': ['Stralis', 'Trakker', 'Eurocargo'],
    'Renault': ['T', 'C', 'K']
  },
  special: {
    'Caterpillar': ['320D', '330D', '312D', '315D', '336D'],
    'JCB': ['3CX', '4CX', 'JS220', 'JS330'],
    'Komatsu': ['PC200', 'PC130', 'PC300', 'PC450'],
    'Hitachi': ['ZX210', 'ZX200', 'ZX330', 'ZX470'],
    'Volvo': ['EC210', 'EC300', 'EC480'],
    'Hyundai': ['R210', 'R300', 'R450'],
    'Doosan': ['DX225', 'DX300', 'DX420']
  },
  moto: {
    'Harley': ['Sportster', 'Street', 'Softail', 'Touring'],
    'Honda': ['CBR600', 'CBR1000', 'Africa Twin', 'CB500'],
    'Yamaha': ['R1', 'R6', 'MT-09', 'FZ-09'],
    'Kawasaki': ['Ninja', 'Z900', 'Versys', 'Vulcan'],
    'Suzuki': ['GSX-R', 'Hayabusa', 'V-Strom', 'Boulevard'],
    'Ducati': ['Monster', 'Panigale', 'Multistrada', 'Scrambler'],
    'BMW': ['R1250GS', 'S1000RR', 'F850GS', 'R nineT']
  },
  water: {
    'Yamaha': ['VX', 'FX', 'EX', 'GP1800'],
    'Sea-Doo': ['GTX', 'RXT', 'Spark', 'Wake'],
    'Kawasaki': ['Ultra', 'STX', 'SX-R'],
    'Honda': ['Aquatrax']
  }
};

const categoryNames = {
  car: '🚗 Легковой',
  truck: '🚚 Грузовой',
  special: '🚜 Спецтехника',
  moto: '🏍 Мототехника',
  water: '🚤 Водный'
};

// Данные объявлений (68 штук)
function initCarsData() {
  function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  return [
    {id:1,category:'car',brand:'Toyota',model:'Camry',year:2020,price:25000,currency:'$',mileage:45000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Отличное состояние',photos:['https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=400'],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:2,category:'car',brand:'BMW',model:'X5',year:2019,price:42000,currency:'$',mileage:62000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Полный привод',photos:['https://images.unsplash.com/photo-1555215695-3004980ad54e?w=400'],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:3,category:'car',brand:'Mercedes',model:'E-Class',year:2021,price:58000,currency:'€',mileage:28000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'AMG пакет',photos:[],isTop:true,createdAt:randomDate(threeDaysAgo,now)},
    {id:4,category:'car',brand:'Hyundai',model:'Solaris',year:2022,price:13500,currency:'$',mileage:15000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'Новый',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:5,category:'truck',brand:'Mercedes',model:'Actros',year:2018,price:75000,currency:'€',mileage:280000,engine:'12.8 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Грузовик',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:6,category:'moto',brand:'Harley',model:'Sportster',year:2020,price:15000,currency:'$',mileage:8000,engine:'1.2 л',transmission:'Механика',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Мотоцикл',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:7,category:'special',brand:'Caterpillar',model:'320D',year:2017,price:95000,currency:'$',mileage:4500,engine:'4.4 л',transmission:'Гидравлика',fuel:'Дизель',city:'Рыбница',registration:'ПМР',description:'Экскаватор',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:8,category:'water',brand:'Yamaha',model:'VX',year:2021,price:18000,currency:'$',mileage:150,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',city:'Днестровск',registration:'ПМР',description:'Гидроцикл',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:9,category:'car',brand:'Audi',model:'A4',year:2020,price:35000,currency:'€',mileage:48000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Quattro',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:10,category:'car',brand:'Volkswagen',model:'Polo',year:2019,price:12000,currency:'$',mileage:65000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',city:'Бельцы',registration:'Молдова',description:'Надежный',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:11,category:'car',brand:'Kia',model:'Sportage',year:2021,price:28000,currency:'$',mileage:35000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Кроссовер',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:12,category:'car',brand:'Mazda',model:'CX-5',year:2020,price:26500,currency:'$',mileage:42000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'Полный привод',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:13,category:'car',brand:'Honda',model:'Accord',year:2019,price:22000,currency:'$',mileage:58000,engine:'2.4 л',transmission:'Вариатор',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Японская надежность',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:14,category:'car',brand:'Nissan',model:'Qashqai',year:2018,price:18500,currency:'€',mileage:72000,engine:'1.6 л',transmission:'Вариатор',fuel:'Бензин',city:'Григориополь',registration:'ПМР',description:'Семейный',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:15,category:'car',brand:'Ford',model:'Focus',year:2017,price:11000,currency:'$',mileage:95000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',city:'Дубоссары',registration:'ПМР',description:'В хорошем состоянии',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:16,category:'car',brand:'Chevrolet',model:'Cruze',year:2016,price:9500,currency:'$',mileage:110000,engine:'1.8 л',transmission:'Автомат',fuel:'Бензин',city:'Каменка',registration:'ПМР',description:'Недорого',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:17,category:'car',brand:'Skoda',model:'Rapid',year:2020,price:14500,currency:'€',mileage:38000,engine:'1.6 л',transmission:'Автомат',fuel:'Бензин',city:'Слободзея',registration:'ПМР',description:'Экономичный',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:18,category:'car',brand:'Renault',model:'Logan',year:2018,price:8500,currency:'$',mileage:88000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',city:'Бендеры',registration:'Молдова',description:'Простой и надежный',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:19,category:'car',brand:'Lada',model:'Vesta',year:2021,price:9800,currency:'$',mileage:22000,engine:'1.6 л',transmission:'Механика',fuel:'Бензин',city:'Кагул',registration:'Молдова',description:'Новая Лада',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:20,category:'truck',brand:'MAN',model:'TGX',year:2019,price:68000,currency:'€',mileage:320000,engine:'12.4 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Тягач',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:21,category:'truck',brand:'Volvo',model:'FH16',year:2017,price:62000,currency:'€',mileage:450000,engine:'13.0 л',transmission:'Автомат',fuel:'Дизель',city:'Рыбница',registration:'ПМР',description:'Мощный тягач',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:22,category:'truck',brand:'Scania',model:'R450',year:2020,price:85000,currency:'€',mileage:220000,engine:'13.0 л',transmission:'Автомат',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Отличное состояние',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:23,category:'truck',brand:'Камаз',model:'6520',year:2018,price:35000,currency:'$',mileage:180000,engine:'11.8 л',transmission:'Механика',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Самосвал',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:24,category:'moto',brand:'Honda',model:'CBR600',year:2019,price:12000,currency:'$',mileage:12000,engine:'0.6 л',transmission:'Механика',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Спортбайк',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:25,category:'moto',brand:'Yamaha',model:'R1',year:2020,price:18000,currency:'$',mileage:8500,engine:'1.0 л',transmission:'Механика',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Супербайк',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:26,category:'moto',brand:'Kawasaki',model:'Ninja',year:2018,price:11500,currency:'$',mileage:15000,engine:'0.65 л',transmission:'Механика',fuel:'Бензин',city:'Бельцы',registration:'Молдова',description:'Зеленый монстр',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:27,category:'moto',brand:'Suzuki',model:'GSX-R',year:2017,price:9800,currency:'$',mileage:22000,engine:'0.6 л',transmission:'Механика',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'Надежный',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:28,category:'special',brand:'JCB',model:'3CX',year:2019,price:68000,currency:'$',mileage:3200,engine:'4.4 л',transmission:'Гидравлика',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Экскаватор-погрузчик',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:29,category:'special',brand:'Komatsu',model:'PC200',year:2018,price:85000,currency:'€',mileage:4800,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Гусеничный экскаватор',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:30,category:'special',brand:'Hitachi',model:'ZX210',year:2020,price:92000,currency:'$',mileage:2100,engine:'6.0 л',transmission:'Гидравлика',fuel:'Дизель',city:'Рыбница',registration:'ПМР',description:'Новый',photos:[],isTop:true,createdAt:randomDate(threeDaysAgo,now)},
    {id:31,category:'water',brand:'Sea-Doo',model:'GTX',year:2020,price:16000,currency:'$',mileage:80,engine:'1.6 л',transmission:'Авто',fuel:'Бензин',city:'Днестровск',registration:'ПМР',description:'Гидроцикл премиум',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:32,category:'water',brand:'Kawasaki',model:'Ultra',year:2019,price:14500,currency:'$',mileage:120,engine:'1.5 л',transmission:'Авто',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Мощный гидроцикл',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:33,category:'car',brand:'Lexus',model:'RX',year:2020,price:52000,currency:'$',mileage:38000,engine:'3.5 л',transmission:'Автомат',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Премиум кроссовер',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:34,category:'car',brand:'Infiniti',model:'QX60',year:2019,price:45000,currency:'$',mileage:52000,engine:'3.5 л',transmission:'Вариатор',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'7 мест',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:35,category:'car',brand:'Subaru',model:'Outback',year:2021,price:32000,currency:'$',mileage:28000,engine:'2.5 л',transmission:'Вариатор',fuel:'Бензин',city:'Бельцы',registration:'Молдова',description:'Полный привод',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:36,category:'car',brand:'Mitsubishi',model:'Outlander',year:2020,price:24000,currency:'$',mileage:45000,engine:'2.4 л',transmission:'Вариатор',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'Надежный кроссовер',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:37,category:'car',brand:'Jeep',model:'Grand Cherokee',year:2018,price:38000,currency:'$',mileage:68000,engine:'3.6 л',transmission:'Автомат',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Американский внедорожник',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:38,category:'car',brand:'Land Rover',model:'Discovery',year:2019,price:48000,currency:'€',mileage:55000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Премиум внедорожник',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:39,category:'car',brand:'Toyota',model:'RAV4',year:2021,price:33000,currency:'$',mileage:25000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Гибрид AWD',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:40,category:'car',brand:'BMW',model:'X3',year:2020,price:38000,currency:'€',mileage:42000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'xDrive',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:41,category:'car',brand:'Mercedes',model:'GLE',year:2020,price:62000,currency:'€',mileage:38000,engine:'3.0 л',transmission:'Автомат',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'4Matic',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:42,category:'car',brand:'Audi',model:'Q5',year:2019,price:42000,currency:'€',mileage:55000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Бельцы',registration:'Молдова',description:'Quattro Premium',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:43,category:'car',brand:'Volkswagen',model:'Tiguan',year:2021,price:29000,currency:'$',mileage:32000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'4Motion R-Line',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:44,category:'car',brand:'Hyundai',model:'Tucson',year:2020,price:24000,currency:'$',mileage:38000,engine:'2.0 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Полная комплектация',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:45,category:'car',brand:'Kia',model:'Sorento',year:2019,price:28000,currency:'$',mileage:52000,engine:'2.2 л',transmission:'Автомат',fuel:'Дизель',city:'Кагул',registration:'Молдова',description:'7 мест 4WD',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:46,category:'car',brand:'Mazda',model:'6',year:2018,price:18000,currency:'$',mileage:68000,engine:'2.5 л',transmission:'Автомат',fuel:'Бензин',city:'Григориополь',registration:'ПМР',description:'Седан бизнес класса',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:47,category:'car',brand:'Honda',model:'CR-V',year:2020,price:29000,currency:'$',mileage:42000,engine:'1.5 л',transmission:'Вариатор',fuel:'Бензин',city:'Днестровск',registration:'ПМР',description:'Турбо AWD',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:48,category:'car',brand:'Nissan',model:'X-Trail',year:2019,price:23000,currency:'$',mileage:58000,engine:'2.0 л',transmission:'Вариатор',fuel:'Бензин',city:'Слободзея',registration:'ПМР',description:'7 мест',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:49,category:'car',brand:'Ford',model:'Kuga',year:2020,price:26000,currency:'$',mileage:45000,engine:'2.0 л',transmission:'Автомат',fuel:'Бензин',city:'Дубоссары',registration:'ПМР',description:'EcoBoost AWD',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:50,category:'car',brand:'Skoda',model:'Octavia',year:2021,price:22000,currency:'€',mileage:28000,engine:'1.5 л',transmission:'Робот',fuel:'Бензин',city:'Каменка',registration:'ПМР',description:'TSI DSG',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:51,category:'truck',brand:'DAF',model:'XF',year:2019,price:72000,currency:'€',mileage:380000,engine:'12.9 л',transmission:'Автомат',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Тягач седельный',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:52,category:'truck',brand:'Iveco',model:'Stralis',year:2018,price:58000,currency:'€',mileage:420000,engine:'11.0 л',transmission:'Автомат',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Euro 6',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:53,category:'truck',brand:'Renault',model:'T',year:2020,price:68000,currency:'€',mileage:280000,engine:'11.0 л',transmission:'Автомат',fuel:'Дизель',city:'Рыбница',registration:'ПМР',description:'High Sleeper Cab',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:54,category:'truck',brand:'Mercedes',model:'Arocs',year:2019,price:78000,currency:'€',mileage:220000,engine:'10.7 л',transmission:'Автомат',fuel:'Дизель',city:'Бельцы',registration:'Молдова',description:'Самосвал 8x4',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:55,category:'moto',brand:'Ducati',model:'Monster',year:2020,price:16000,currency:'€',mileage:8500,engine:'0.8 л',transmission:'Механика',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Naked bike',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:56,category:'moto',brand:'BMW',model:'R1250GS',year:2021,price:22000,currency:'€',mileage:12000,engine:'1.25 л',transmission:'Механика',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Adventure',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:57,category:'moto',brand:'Yamaha',model:'MT-09',year:2019,price:11000,currency:'$',mileage:18000,engine:'0.85 л',transmission:'Механика',fuel:'Бензин',city:'Рыбница',registration:'ПМР',description:'Street fighter',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:58,category:'moto',brand:'Kawasaki',model:'Z900',year:2020,price:12500,currency:'$',mileage:14000,engine:'0.95 л',transmission:'Механика',fuel:'Бензин',city:'Бендеры',registration:'Молдова',description:'Naked',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:59,category:'special',brand:'Volvo',model:'EC210',year:2019,price:88000,currency:'€',mileage:3800,engine:'5.7 л',transmission:'Гидравлика',fuel:'Дизель',city:'Тирасполь',registration:'ПМР',description:'Гусеничный',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:60,category:'special',brand:'Hyundai',model:'R210',year:2020,price:82000,currency:'$',mileage:2900,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Экскаватор 21т',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:61,category:'special',brand:'Doosan',model:'DX225',year:2018,price:75000,currency:'$',mileage:4200,engine:'5.9 л',transmission:'Гидравлика',fuel:'Дизель',city:'Рыбница',registration:'ПМР',description:'22 тонны',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:62,category:'special',brand:'JCB',model:'4CX',year:2020,price:72000,currency:'€',mileage:2800,engine:'4.8 л',transmission:'Гидравлика',fuel:'Дизель',city:'Бельцы',registration:'Молдова',description:'Погрузчик-экскаватор',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:63,category:'water',brand:'Yamaha',model:'FX',year:2021,price:17000,currency:'$',mileage:60,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',city:'Днестровск',registration:'ПМР',description:'Cruiser HO',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:64,category:'water',brand:'Sea-Doo',model:'RXT',year:2020,price:19000,currency:'$',mileage:85,engine:'1.6 л',transmission:'Авто',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'Performance',photos:[],isTop:false,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:65,category:'water',brand:'Kawasaki',model:'STX',year:2019,price:13500,currency:'$',mileage:140,engine:'1.5 л',transmission:'Авто',fuel:'Бензин',city:'Кишинёв',registration:'Молдова',description:'Rec',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:66,category:'water',brand:'Yamaha',model:'GP1800',year:2021,price:18500,currency:'$',mileage:45,engine:'1.8 л',transmission:'Авто',fuel:'Бензин',city:'Днестровск',registration:'ПМР',description:'SVHO',photos:[],isTop:false,createdAt:randomDate(threeDaysAgo,now)},
    {id:67,category:'car',brand:'Toyota',model:'Land Cruiser',year:2019,price:68000,currency:'$',mileage:82000,engine:'4.5 л',transmission:'Автомат',fuel:'Дизель',city:'Кишинёв',registration:'Молдова',description:'Prado 150',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)},
    {id:68,category:'car',brand:'Lexus',model:'LX',year:2020,price:92000,currency:'$',mileage:48000,engine:'5.7 л',transmission:'Автомат',fuel:'Бензин',city:'Тирасполь',registration:'ПМР',description:'570 Full',photos:[],isTop:true,createdAt:randomDate(sevenDaysAgo,monthAgo)}
  ];
}
