/**
 * Static browse catalogue for the home page. Each category maps to a free-text
 * query the search API matches against salon and service names.
 */
const photo = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=72&auto=format&fit=crop`;

export const CATEGORIES = [
  { key: 'haircut', q: 'haircut', image: photo('1595476108010-b4d1f102b1b1') },
  { key: 'colour', q: 'colour', image: photo('1492106087820-71f1a00d2b11') },
  { key: 'beard', q: 'beard', image: photo('1517832606299-7ae9b720a186') },
  { key: 'facial', q: 'facial', image: photo('1616394584738-fc6e612e71b9') },
  { key: 'bridal', q: 'bridal', image: photo('1610173827043-9db50e0d8ef9') },
  { key: 'mehendi', q: 'mehendi', image: photo('1730003727902-3643640a3d43') },
  { key: 'nails', q: 'manicure', image: photo('1604654894610-df63bc536371') },
  { key: 'massage', q: 'massage', image: photo('1544161515-4ab6ce6db874') },
];

export const POPULAR_SEARCHES = ['haircut', 'hair spa', 'bridal', 'beard', 'facial', 'manicure'];

export const CITY_IMAGES = {
  Delhi: photo('1587474260584-136574528ed5'),
  Mumbai: photo('1570168007204-dfb528c6958f'),
  Bengaluru: photo('1697130383976-38f28c444292'),
  Hyderabad: photo('1696941515998-d83f24967aca'),
  Chennai: photo('1582510003544-4d00b7f74220'),
  Pune: photo('1553064483-f10fe837615f'),
  Kolkata: photo('1558431382-27e303142255'),
  Jaipur: photo('1477587458883-47145ed94245'),
  Gurugram: photo('1589829973523-e4ddcbbd40e7'),
  Noida: photo('1688978022482-00702c9eb83c'),
};

export const BRIDAL_IMAGE = photo('1600685890506-593fdf55949b');
export const MEHENDI_IMAGE = photo('1505932794465-147d1f1b2c97');
