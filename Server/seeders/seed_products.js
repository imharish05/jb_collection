require("dotenv").config();
const { sequelize, Product, Variant, Category } = require("../models");
const { v4: uuidv4 } = require("uuid");

const sampleImages = [
  "uploads/products/1780915000249.png",
  "uploads/products/1780915000265.png",
  "uploads/products/1780915000286.png",
  "uploads/products/1780915000299.png",
  "uploads/products/1780915291948.png",
  "uploads/products/1781004234278.png",
  "uploads/products/1781004234368.png",
  "uploads/products/1781335548956.png",
  "uploads/products/1781335548973.png",
  "uploads/products/1781505909935.png",
  "uploads/products/1781600662634.png",
  "uploads/products/1781604386402.png",
  "uploads/products/1781604386455.png",
  "uploads/products/1781604386474.png",
  "uploads/products/1781628988110.png",
  "uploads/products/1781628988153.png",
  "uploads/products/1781636830524.png",
  "uploads/products/1781756604813.png",
  "uploads/products/1781776629848.png",
  "uploads/products/1781946968401.png",
  "uploads/products/1781957310598.png"
];

const productsData = [
  {
    name: "Thambulm bag",
    categorySlug: "tambulam-bags",
    customisable: true,
    price: 40.00,
    shortDescription: "Traditional thambulm return gift bags made of premium jute, synthetic, silk, or nylon fabric.",
    fullDescription: "Perfect for weddings, housewarmings, baby showers, and all traditional ceremonies. Available in a wide variety of materials and vibrant colors.",
    variants: [
      { name: "Material: Jute", price: 40, attributes: [{ key: "Material", value: "Jute" }] },
      { name: "Material: Synthetic", price: 35, attributes: [{ key: "Material", value: "Synthetic" }] },
      { name: "Material: Silk", price: 50, attributes: [{ key: "Material", value: "Silk" }] },
      { name: "Material: Nylon", price: 30, attributes: [{ key: "Material", value: "Nylon" }] },
      { name: "Material: Transparent Window", price: 45, attributes: [{ key: "Material", value: "Transparent Window" }] }
    ]
  },
  {
    name: "Saree bag",
    categorySlug: "tambulam-bags",
    customisable: false,
    price: 80.00,
    shortDescription: "Protective and elegant storage bags for premium sarees.",
    fullDescription: "Keep your wedding and designer sarees safe from dust and damage in these beautiful storage bags. Comes in traditional colors with clear windows.",
    variants: [
      { name: "Color: Red", price: 80, attributes: [{ key: "Color", value: "Red" }] },
      { name: "Color: Pink", price: 80, attributes: [{ key: "Color", value: "Pink" }] },
      { name: "Color: Blue", price: 80, attributes: [{ key: "Color", value: "Blue" }] },
      { name: "Color: Purple", price: 80, attributes: [{ key: "Color", value: "Purple" }] }
    ]
  },
  {
    name: "Tissue surukku pai",
    categorySlug: "tambulam-bags",
    customisable: true,
    price: 25.00,
    shortDescription: "Elegant tissue drawstring pouches (potli bags) for gifting.",
    fullDescription: "Available in plain or printed patterns in all traditional colors and sizes. Perfect for holding betel leaves, nuts, sweets, or jewelry.",
    variants: [
      { name: "Style: Plain · Color: Red", price: 25, attributes: [{ key: "Style", value: "Plain" }, { key: "Color", value: "Red" }] },
      { name: "Style: Plain · Color: Gold", price: 25, attributes: [{ key: "Style", value: "Plain" }, { key: "Color", value: "Gold" }] },
      { name: "Style: Printed · Color: Red", price: 30, attributes: [{ key: "Style", value: "Printed" }, { key: "Color", value: "Red" }] },
      { name: "Style: Printed · Color: Gold", price: 30, attributes: [{ key: "Style", value: "Printed" }, { key: "Color", value: "Gold" }] }
    ]
  },
  {
    name: "Brass miniature god idol",
    categorySlug: "divine",
    customisable: false,
    price: 150.00,
    shortDescription: "Highly detailed miniature brass idols for home pooja and traditional return gifts.",
    fullDescription: "Exquisite craftsmanship in pure brass. Choose from Ganesha, Murugan, Lakshmi, Vishnu, Elephant, Horse, Garudan, or Nandhi.",
    variants: [
      { name: "Design: Ganesha", price: 150, attributes: [{ key: "Design", value: "Ganesha" }] },
      { name: "Design: Murugan", price: 150, attributes: [{ key: "Design", value: "Murugan" }] },
      { name: "Design: Lakshmi", price: 150, attributes: [{ key: "Design", value: "Lakshmi" }] },
      { name: "Design: Vishnu", price: 150, attributes: [{ key: "Design", value: "Vishnu" }] },
      { name: "Design: Elephant", price: 120, attributes: [{ key: "Design", value: "Elephant" }] },
      { name: "Design: Horse", price: 120, attributes: [{ key: "Design", value: "Horse" }] },
      { name: "Design: Garudan", price: 150, attributes: [{ key: "Design", value: "Garudan" }] },
      { name: "Design: Nandhi", price: 150, attributes: [{ key: "Design", value: "Nandhi" }] }
    ]
  },
  {
    name: "Manjal Kumkum bottles",
    categorySlug: "divine",
    customisable: false,
    price: 15.00,
    shortDescription: "Elegant bottles for distributing auspicious Manjal and Kumkum.",
    fullDescription: "Perfect for traditional giveaways, these bottles are available in long and round shapes.",
    variants: [
      { name: "Shape: Long", price: 15, attributes: [{ key: "Shape", value: "Long" }] },
      { name: "Shape: Round", price: 15, attributes: [{ key: "Shape", value: "Round" }] }
    ]
  },
  {
    name: "Manjal Kumkum fridge magnet",
    categorySlug: "divine",
    customisable: false,
    price: 35.00,
    shortDescription: "Auspicious fridge magnets with Manjal and Kumkum holders.",
    fullDescription: "Features beautiful designs for all events like housewarmings, puberty, half saree ceremonies, and baby showers.",
    variants: [
      { name: "Design: Murugan", price: 35, attributes: [{ key: "Design", value: "Murugan" }] },
      { name: "Design: Vinayagar", price: 35, attributes: [{ key: "Design", value: "Vinayagar" }] },
      { name: "Design: Krishna", price: 35, attributes: [{ key: "Design", value: "Krishna" }] },
      { name: "Design: Lakshmi", price: 35, attributes: [{ key: "Design", value: "Lakshmi" }] },
      { name: "Design: Lotus", price: 35, attributes: [{ key: "Design", value: "Lotus" }] },
      { name: "Design: Cow", price: 35, attributes: [{ key: "Design", value: "Cow" }] },
      { name: "Design: Cow and calf", price: 35, attributes: [{ key: "Design", value: "Cow and calf" }] },
      { name: "Design: House warming", price: 35, attributes: [{ key: "Design", value: "House warming" }] },
      { name: "Design: Kolam", price: 35, attributes: [{ key: "Design", value: "Kolam" }] },
      { name: "Design: Puberty", price: 35, attributes: [{ key: "Design", value: "Puberty" }] },
      { name: "Design: Half saree girl", price: 35, attributes: [{ key: "Design", value: "Half saree girl" }] },
      { name: "Design: Pregnant lady", price: 35, attributes: [{ key: "Design", value: "Pregnant lady" }] }
    ]
  },
  {
    name: "Brass dabara sets",
    categorySlug: "divine",
    customisable: false,
    price: 299.00,
    shortDescription: "Authentic brass coffee dabara set for traditional South Indian filter coffee.",
    fullDescription: "Pure brass sets available in multiple finishes: plain, kolam engraved, etched, or hand-painted.",
    variants: [
      { name: "Style: Plain", price: 299, attributes: [{ key: "Style", value: "Plain" }] },
      { name: "Style: Kolam", price: 349, attributes: [{ key: "Style", value: "Kolam" }] },
      { name: "Style: Etched", price: 349, attributes: [{ key: "Style", value: "Etched" }] },
      { name: "Style: Painted", price: 399, attributes: [{ key: "Style", value: "Painted" }] }
    ]
  },
  {
    name: "Brass spice box",
    categorySlug: "divine",
    customisable: false,
    price: 999.00,
    shortDescription: "Traditional brass masala dabba/spice box.",
    fullDescription: "Premium pure brass spice box. Available in plain, floral etched, and hand-painted meenakari designs.",
    variants: [
      { name: "Style: Plain", price: 999, attributes: [{ key: "Style", value: "Plain" }] },
      { name: "Style: Floral Etched", price: 1199, attributes: [{ key: "Style", value: "Floral etched" }] },
      { name: "Style: Meenakari Painted", price: 1299, attributes: [{ key: "Style", value: "Meenakari painted" }] }
    ]
  },
  {
    name: "Steel spice box with brass coating",
    categorySlug: "divine",
    customisable: false,
    price: 699.00,
    shortDescription: "Stainless steel masala box with elegant brass coating.",
    fullDescription: "Combines the durability of stainless steel with the rich traditional look of brass plating.",
    variants: [
      { name: "Style: Plain", price: 699, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Brass bell (with and without velvet box)",
    categorySlug: "divine",
    customisable: false,
    price: 180.00,
    shortDescription: "Handcrafted pure brass pooja bell producing sweet resonance.",
    fullDescription: "Available as a standalone bell or packaged in an elegant velvet box for gifting.",
    variants: [
      { name: "Style: Without velvet box", price: 180, attributes: [{ key: "Style", value: "Without velvet box" }] },
      { name: "Style: With velvet box", price: 250, attributes: [{ key: "Style", value: "With velvet box" }] }
    ]
  },
  {
    name: "Pichwai jars and tin (air tight lid)",
    categorySlug: "gifts",
    customisable: false,
    price: 90.00,
    shortDescription: "Decorative dry fruit and spice tin jars with Pichwai artwork.",
    fullDescription: "Airtight metal tins decorated with beautiful Pichwai cow and floral paintings.",
    variants: [
      { name: "Shape: Round Jar", price: 90, attributes: [{ key: "Shape", value: "Round" }] },
      { name: "Shape: Square Tin", price: 110, attributes: [{ key: "Shape", value: "Square" }] }
    ]
  },
  {
    name: "Pichwai tray",
    categorySlug: "gifts",
    customisable: false,
    price: 250.00,
    shortDescription: "Elegant wooden tray decorated with Pichwai cow motifs.",
    fullDescription: "Durable and perfect for traditional hospitality or dry fruit presentation.",
    variants: [
      { name: "Size: Small", price: 250, attributes: [{ key: "Size", value: "Small" }] },
      { name: "Size: Medium", price: 350, attributes: [{ key: "Size", value: "Medium" }] },
      { name: "Size: Large", price: 450, attributes: [{ key: "Size", value: "Large" }] }
    ]
  },
  {
    name: "Pichwai basket (with handle)",
    categorySlug: "gifts",
    customisable: false,
    price: 180.00,
    shortDescription: "Handled packaging basket with Pichwai prints.",
    fullDescription: "Vibrant gift packing basket equipped with a strong handle, perfect for packing return gifts.",
    variants: [
      { name: "Size: Small", price: 180, attributes: [{ key: "Size", value: "Small" }] },
      { name: "Size: Medium", price: 240, attributes: [{ key: "Size", value: "Medium" }] }
    ]
  },
  {
    name: "Brass lamp",
    categorySlug: "divine",
    customisable: false,
    price: 350.00,
    shortDescription: "Auspicious traditional brass vilakku lamp.",
    fullDescription: "Perfect for daily pooja, housewarmings, and festive occasions. Solid pure brass build.",
    variants: [
      { name: "Size: Small", price: 350, attributes: [{ key: "Size", value: "Small" }] },
      { name: "Size: Medium", price: 550, attributes: [{ key: "Size", value: "Medium" }] },
      { name: "Size: Large", price: 850, attributes: [{ key: "Size", value: "Large" }] }
    ]
  },
  {
    name: "Water bottle",
    categorySlug: "gifts",
    customisable: true,
    price: 199.00,
    shortDescription: "Personalized eco-friendly water bottles in glass, steel or copper.",
    fullDescription: "Custom name or brand logo engraving is available. Choose from glass, premium copper, or stainless steel.",
    variants: [
      { name: "Material: Glass", price: 199, attributes: [{ key: "Material", value: "Glass" }] },
      { name: "Material: Glass (Cactus)", price: 220, attributes: [{ key: "Material", value: "Glass" }] },
      { name: "Material: Copper", price: 599, attributes: [{ key: "Material", value: "Copper" }] },
      { name: "Material: Steel", price: 399, attributes: [{ key: "Material", value: "Steel" }] }
    ]
  },
  {
    name: "Cane basket",
    categorySlug: "gifts",
    customisable: false,
    price: 120.00,
    shortDescription: "Hand-woven cane baskets for packing dry fruits, fruits or custom gifts.",
    fullDescription: "Natural organic cane baskets, highly durable and ideal for eco-friendly gift presentation.",
    variants: [
      { name: "Size: Small", price: 120, attributes: [{ key: "Size", value: "Small" }] },
      { name: "Size: Medium", price: 180, attributes: [{ key: "Size", value: "Medium" }] },
      { name: "Size: Large", price: 240, attributes: [{ key: "Size", value: "Large" }] }
    ]
  },
  {
    name: "Antique metal jar",
    categorySlug: "gifts",
    customisable: false,
    price: 290.00,
    shortDescription: "Premium metal jars with antique hand-hammered and stripped patterns.",
    fullDescription: "Perfect containers for sweets, dry fruits, or decorative accents. Available in silver, copper, and brass colors.",
    variants: [
      { name: "Color: Silver · Style: Hammered", price: 290, attributes: [{ key: "Color", value: "Silver" }, { key: "Style", value: "Hammered" }] },
      { name: "Color: Silver · Style: Stripped", price: 290, attributes: [{ key: "Color", value: "Silver" }, { key: "Style", value: "Stripped" }] },
      { name: "Color: Copper · Style: Hammered", price: 320, attributes: [{ key: "Color", value: "Copper" }, { key: "Style", value: "Hammered" }] },
      { name: "Color: Brass · Style: Hammered", price: 340, attributes: [{ key: "Color", value: "Brass" }, { key: "Style", value: "Hammered" }] }
    ]
  },
  {
    name: "Glass bangles",
    categorySlug: "gifts",
    customisable: false,
    price: 60.00,
    shortDescription: "Beautiful glass bangles for baby showers and standard ceremonies.",
    fullDescription: "Available in raindrop, plain, jari, and glitter designs. Sizes range from 2 inches to 2.8 inches in assorted colors.",
    variants: [
      { name: "Style: Rain drop · Size: 2.2 inches", price: 60, attributes: [{ key: "Style", value: "Rain drop" }, { key: "Size", value: "2.2 inches" }] },
      { name: "Style: Plain · Size: 2.4 inches", price: 40, attributes: [{ key: "Style", value: "Plain" }, { key: "Size", value: "2.4 inches" }] },
      { name: "Style: Jari · Size: 2.6 inches", price: 80, attributes: [{ key: "Style", value: "Jari" }, { key: "Size", value: "2.6 inches" }] },
      { name: "Style: Glitter · Size: 2.8 inches", price: 80, attributes: [{ key: "Style", value: "Glitter" }, { key: "Size", value: "2.8 inches" }] }
    ]
  },
  {
    name: "Brocade blouse bits",
    categorySlug: "gifts",
    customisable: false,
    price: 90.00,
    shortDescription: "Shining brocade fabric blouse bits in festive patterns.",
    fullDescription: "An auspicious addition to thambulam bags for traditional events. Assorted designs and colors.",
    variants: [
      { name: "Color: Assorted", price: 90, attributes: [{ key: "Color", value: "Assorted colors" }] }
    ]
  },
  {
    name: "Kalamkari blouse bits",
    categorySlug: "gifts",
    customisable: false,
    price: 80.00,
    shortDescription: "Pure cotton Kalamkari printed blouse bits.",
    fullDescription: "Traditional Indian hand-printed style blouse pieces, highly breathable and soft cotton fabric.",
    variants: [
      { name: "Color: Assorted", price: 80, attributes: [{ key: "Color", value: "Assorted colors" }] }
    ]
  },
  {
    name: "Silk cotton blouse bits",
    categorySlug: "gifts",
    customisable: false,
    price: 75.00,
    shortDescription: "Rich silk-cotton blended blouse pieces.",
    fullDescription: "Perfect for thambulam bag presentation. Delivered in assorted colors.",
    variants: [
      { name: "Color: Assorted", price: 75, attributes: [{ key: "Color", value: "Assorted colors" }] }
    ]
  },
  {
    name: "Brass Kumkuma chimizh",
    categorySlug: "divine",
    customisable: false,
    price: 45.00,
    shortDescription: "Decorative brass kumkum box (sindoor box).",
    fullDescription: "Pure brass box for storing holy vermillion or sandalwood powder. Available in plain, etched, and painted designs.",
    variants: [
      { name: "Style: Plain", price: 45, attributes: [{ key: "Style", value: "Plain" }] },
      { name: "Style: Etched", price: 55, attributes: [{ key: "Style", value: "Etched" }] },
      { name: "Style: Painted", price: 75, attributes: [{ key: "Style", value: "Painted" }] }
    ]
  },
  {
    name: "Customized key chains in brass",
    categorySlug: "gifts",
    customisable: true,
    price: 120.00,
    shortDescription: "Personalized brass key chains with engraved names or patterns.",
    fullDescription: "Finely engraved pure brass plates with dynamic name formatting. Perfect for gifts.",
    variants: [
      { name: "Style: Rectangle", price: 120, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Customized name pendants in brass",
    categorySlug: "gifts",
    customisable: true,
    price: 299.00,
    shortDescription: "Personalized name necklace pendant crafted in brass.",
    fullDescription: "Shiny gold-look brass pendants featuring customized name typography.",
    variants: [
      { name: "Style: Standard", price: 299, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Customized metal name engraved key chains",
    categorySlug: "gifts",
    customisable: true,
    price: 99.00,
    shortDescription: "Laser engraved metal name key chains.",
    fullDescription: "Heavy metal design with deep-engraved lettering. Highly durable and scratch resistant.",
    variants: [
      { name: "Style: Heavy metal", price: 99, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Customized earrings and pendant sets in brass",
    categorySlug: "gifts",
    customisable: true,
    price: 499.00,
    shortDescription: "Customized handcrafted jewelry set in pure brass.",
    fullDescription: "Includes custom name earrings and matching pendant in traditional brass work.",
    variants: [
      { name: "Style: Complete set", price: 499, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Brass tray / plates",
    categorySlug: "divine",
    customisable: false,
    price: 150.00,
    shortDescription: "Auspicious pure brass plates for pooja and gifting.",
    fullDescription: "Sturdy trays featuring plain, floral etched, or hand-painted patterns.",
    variants: [
      { name: "Style: Plain", price: 150, attributes: [{ key: "Style", value: "Plain" }] },
      { name: "Style: Floral Etched", price: 199, attributes: [{ key: "Style", value: "Floral etched" }] },
      { name: "Style: Painted", price: 250, attributes: [{ key: "Style", value: "Painted" }] }
    ]
  },
  {
    name: "Steel tiffin box",
    categorySlug: "gifts",
    customisable: false,
    price: 180.00,
    shortDescription: "Durable stainless steel lunch carriers.",
    fullDescription: "Classic multi-tier stainless steel tiffin boxes for daily office or school use.",
    variants: [
      { name: "Size: Small", price: 180, attributes: [{ key: "Size", value: "Small" }] },
      { name: "Size: Medium", price: 250, attributes: [{ key: "Size", value: "Medium" }] },
      { name: "Size: Large", price: 320, attributes: [{ key: "Size", value: "Large" }] }
    ]
  },
  {
    name: "Meenakari tiffin box",
    categorySlug: "gifts",
    customisable: false,
    price: 350.00,
    shortDescription: "Stainless steel tiffin box with traditional meenakari/brass plating.",
    fullDescription: "Beautiful meenakari peacock, Ganesha, rose, or mandala designs.",
    variants: [
      { name: "Design: Peacock", price: 350, attributes: [{ key: "Design", value: "Peacock" }] },
      { name: "Design: Ganesha", price: 350, attributes: [{ key: "Design", value: "Ganesha" }] },
      { name: "Design: Mandala", price: 350, attributes: [{ key: "Design", value: "Mandala" }] },
      { name: "Design: Rose", price: 350, attributes: [{ key: "Design", value: "Rose" }] }
    ]
  },
  {
    name: "Steel plates / tray",
    categorySlug: "gifts",
    customisable: true,
    price: 110.00,
    shortDescription: "Customized and name-engraved stainless steel serving plates.",
    fullDescription: "Available with Kolam, Chariot (Thear) Kolam, or Plain styles in round, oval, square, and floral shapes.",
    variants: [
      { name: "Design: Kolam · Shape: Round", price: 110, attributes: [{ key: "Design", value: "Kolam" }, { key: "Shape", value: "Round" }] },
      { name: "Design: Thear Kolam · Shape: Round", price: 130, attributes: [{ key: "Design", value: "Thear Kolam" }, { key: "Shape", value: "Round" }] },
      { name: "Design: Plain · Shape: Oval", price: 99, attributes: [{ key: "Design", value: "Plain" }, { key: "Shape", value: "Oval" }] }
    ]
  },
  {
    name: "Heart tin boxes",
    categorySlug: "gifts",
    customisable: false,
    price: 40.00,
    shortDescription: "Adorable heart-shaped tin boxes for storing small treats or accessories.",
    fullDescription: "Glossy finish tin boxes in colorful purple, pink, red, and blue colors.",
    variants: [
      { name: "Color: Purple", price: 40, attributes: [{ key: "Color", value: "Purple" }] },
      { name: "Color: Pink", price: 40, attributes: [{ key: "Color", value: "Pink" }] },
      { name: "Color: Red", price: 40, attributes: [{ key: "Color", value: "Red" }] },
      { name: "Color: Blue", price: 40, attributes: [{ key: "Color", value: "Blue" }] }
    ]
  },
  {
    name: "Men gift combo",
    categorySlug: "gifts",
    customisable: true,
    price: 499.00,
    shortDescription: "Complete customized corporate/gift set for men.",
    fullDescription: "Includes a matching purse, belt, pen, cufflinks, and brooch, all customized with the recipient's name.",
    variants: [
      { name: "Color: Brown", price: 499, attributes: [{ key: "Color", value: "Assorted colors" }] },
      { name: "Color: Black", price: 499, attributes: [{ key: "Color", value: "Assorted colors" }] }
    ]
  },
  // --- Stationary (school-return-gifts) ---
  {
    name: "Pencil",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 45.00,
    shortDescription: "Packs of eco seed or cartoon pencils for children.",
    fullDescription: "Packs of 12. Seed pencils are growable after use. Cartoon pencils feature prints kids love.",
    variants: [
      { name: "Pack Size: Seed pencil (12pcs)", price: 45, attributes: [{ key: "Pack Size", value: "Pack of 12" }] },
      { name: "Pack Size: Cartoon pencil (12pcs)", price: 50, attributes: [{ key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Pencil, scale, eraser in pouch set (boys / girls)",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 60.00,
    shortDescription: "Complete stationery utility pouch sets for school return gifts.",
    fullDescription: "Includes pencil, scale, and matching eraser inside a themed zipper pouch. Available for boys and girls.",
    variants: [
      { name: "Style: Boys Theme", price: 60, attributes: [{ key: "Style", value: "Plain" }] },
      { name: "Style: Girls Theme", price: 60, attributes: [{ key: "Style", value: "Plain" }] }
    ]
  },
  {
    name: "Name customized branded pen in pen case",
    categorySlug: "school-return-gifts",
    customisable: true,
    price: 150.00,
    shortDescription: "Personalized metallic ball/gel pen inside an elegant presentation case.",
    fullDescription: "Premium branding pen engraved with the child's or recipient's name in a beautiful wooden or plastic case.",
    variants: [
      { name: "Color: Classic Black", price: 150, attributes: [{ key: "Color", value: "Assorted colors" }] }
    ]
  },
  {
    name: "Pencil boxes",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 70.00,
    shortDescription: "Fun cartoon themed plastic and metal pencil boxes for children.",
    fullDescription: "Spacious layout with double compartments. Choose between Unicorn and Mickey themes.",
    variants: [
      { name: "Design: Unicorn", price: 70, attributes: [{ key: "Design", value: "Unicorn" }] },
      { name: "Design: Mickey", price: 70, attributes: [{ key: "Design", value: "Mickey" }] }
    ]
  },
  {
    name: "Pencil boxes with writing pad",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 120.00,
    shortDescription: "Innovative pencil box equipped with a clip-on writing pad.",
    fullDescription: "A great combo return gift for school students. Features Unicorn and Disney Princess themes.",
    variants: [
      { name: "Design: Unicorn", price: 120, attributes: [{ key: "Design", value: "Unicorn" }] },
      { name: "Design: Disney Princess", price: 120, attributes: [{ key: "Design", value: "Disney princess" }] }
    ]
  },
  {
    name: "Short notes diary",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 30.00,
    shortDescription: "Handy pocket-sized notebook diaries with colorful kids animations.",
    fullDescription: "Rule pages inside, perfect for short notes, sketching, and pocket memories. Assorted animal prints.",
    variants: [
      { name: "Design: Cute Animal Print", price: 30, attributes: [{ key: "Design", value: "Plain" }] }
    ]
  },
  {
    name: "Geometry boxes",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 95.00,
    shortDescription: "Complete geometry instrument box sets.",
    fullDescription: "Contains compass, divider, protractor, scales, pencil, and erasers. Mickey and Disney Princess designs.",
    variants: [
      { name: "Design: Mickey", price: 95, attributes: [{ key: "Design", value: "Mickey" }] },
      { name: "Design: Disney Princess", price: 95, attributes: [{ key: "Design", value: "Disney princess" }] }
    ]
  },
  {
    name: "Return gifts blue pen",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 120.00,
    shortDescription: "Bulk packs of blue ink writing pens for kids return gifts.",
    fullDescription: "High-quality smooth writing blue pens. Pack size options: 12 pieces or 25 pieces.",
    variants: [
      { name: "Pack Size: 12pcs", price: 120, attributes: [{ key: "Pack Size", value: "Pack of 12" }] },
      { name: "Pack Size: 25pcs", price: 220, attributes: [{ key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Return gifts red pen",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 120.00,
    shortDescription: "Bulk packs of red ink writing pens.",
    fullDescription: "Smooth red ink ballpoint/gel pens. Pack size options: 12 pieces or 25 pieces.",
    variants: [
      { name: "Pack Size: 12pcs", price: 120, attributes: [{ key: "Pack Size", value: "Pack of 12" }] },
      { name: "Pack Size: 25pcs", price: 220, attributes: [{ key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Return gifts pencil with eraser at back",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 65.00,
    shortDescription: "Bulk pack of graphite pencils with integrated eraser caps.",
    fullDescription: "Fun pencils with cute character erasers attached at the back. Pack of 12.",
    variants: [
      { name: "Pack Size: 12pcs", price: 65, attributes: [{ key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Return gifts Wooden fridge magnets assorted design",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 350.00,
    shortDescription: "Wholesale pack of wooden fridge magnets in assorted cute designs.",
    fullDescription: "Hand-painted organic wooden magnets. Pack of 25 assorted pieces.",
    variants: [
      { name: "Pack Size: 25pcs", price: 350, attributes: [{ key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Return gifts badges",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 150.00,
    shortDescription: "Pack of 25 pin-back badges with cute kids designs.",
    fullDescription: "Features high quality prints of smileys or assorted designs. Perfect return gifts.",
    variants: [
      { name: "Design: Smiley (25pcs)", price: 150, attributes: [{ key: "Design", value: "Smiley" }, { key: "Pack Size", value: "Pack of 25" }] },
      { name: "Design: Assorted (25pcs)", price: 150, attributes: [{ key: "Design", value: "Plain" }, { key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Return gifts pencil pouches",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 180.00,
    shortDescription: "Bulk packs of cute zippered pencil pouches.",
    fullDescription: "Water-resistant printed pouches with zip-lock slider. Pack of 12.",
    variants: [
      { name: "Pack Size: 12pcs", price: 180, attributes: [{ key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Pencil / pen topper cap",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 60.00,
    shortDescription: "Cute silicon cartoon pencil toppers.",
    fullDescription: "Packs of 12. Soft silicon caps featuring Unicorn, Mickey or assorted animal designs.",
    variants: [
      { name: "Design: Unicorn (12pcs)", price: 60, attributes: [{ key: "Design", value: "Unicorn" }, { key: "Pack Size", value: "Pack of 12" }] },
      { name: "Design: Mickey (12pcs)", price: 60, attributes: [{ key: "Design", value: "Mickey" }, { key: "Pack Size", value: "Pack of 12" }] },
      { name: "Design: Assorted (12pcs)", price: 60, attributes: [{ key: "Design", value: "Plain" }, { key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Pelican pen",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 140.00,
    shortDescription: "Classic Pelican style ink fountain pens for kids.",
    fullDescription: "Assorted vibrant colored body fountain pens. Pack of 12.",
    variants: [
      { name: "Pack Size: 12pcs", price: 140, attributes: [{ key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Mixed design erasers",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 99.00,
    shortDescription: "Pack of 25 mixed design 3D erasers.",
    fullDescription: "Non-dust eco-friendly erasers in funny 3D shapes (animals, food, vehicles). Pack of 25.",
    variants: [
      { name: "Pack Size: 25pcs", price: 99, attributes: [{ key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Expandable scales",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 80.00,
    shortDescription: "Fun foldable expandable plastic rules.",
    fullDescription: "Packs of 12 ruler scales that can expand from 15cm to 30cm.",
    variants: [
      { name: "Pack Size: 12pcs", price: 80, attributes: [{ key: "Pack Size", value: "Pack of 12" }] }
    ]
  },
  {
    name: "Goodie bags",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 199.00,
    shortDescription: "Beautiful theme printed goodie bags or coloring DIY sets.",
    fullDescription: "Ideal packaging for return gifts. Themes include Unicorn, Disney Princess, Mermaid, Krishna, Kuromi, or DIY coloring sets.",
    variants: [
      { name: "Design: Unicorn", price: 199, attributes: [{ key: "Design", value: "Unicorn" }] },
      { name: "Design: Disney Princess", price: 199, attributes: [{ key: "Design", value: "Disney princess" }] },
      { name: "Design: Mermaid", price: 199, attributes: [{ key: "Design", value: "Mermaid" }] },
      { name: "Design: Krishna", price: 199, attributes: [{ key: "Design", value: "Krishna" }] },
      { name: "Design: Kuromi", price: 199, attributes: [{ key: "Design", value: "Kuromi" }] },
      { name: "Design: DIY Coloring Bag", price: 150, attributes: [{ key: "Design", value: "DIY coloring" }] },
      { name: "Design: DIY Colouring Purse", price: 170, attributes: [{ key: "Design", value: "DIY coloring" }] }
    ]
  },
  {
    name: "Key chain",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 199.00,
    shortDescription: "Pack of 25 assorted cartoon kids themed key chains.",
    fullDescription: "Cute silicon and metal key chains featuring popular kids characters. Pack of 25.",
    variants: [
      { name: "Pack Size: Assorted (25pcs)", price: 199, attributes: [{ key: "Pack Size", value: "Pack of 25" }] }
    ]
  },
  {
    name: "Mechanical pencil",
    categorySlug: "school-return-gifts",
    customisable: false,
    price: 20.00,
    shortDescription: "High-grade mechanical pencil with lead sets.",
    fullDescription: "Perfect school stationery item for kids. Comes in sizes 0.5mm and 0.7mm.",
    variants: [
      { name: "Size: 0.5mm", price: 20, attributes: [{ key: "Size", value: "2.2 inches" }] },
      { name: "Size: 0.7mm", price: 20, attributes: [{ key: "Size", value: "2.4 inches" }] }
    ]
  }
];

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

async function seed() {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Fetch categories to get their UUIDs
    const categories = await Category.findAll();
    const categoryMap = {};
    categories.forEach(c => {
      categoryMap[c.value] = c.id;
    });

    // Special category values fallback checks
    const tambulamId = categoryMap["tambulam-bags"] || categoryMap["tambulam"] || categories.find(c => c.value.includes("tambulam"))?.id;
    const divineId = categoryMap["divine"];
    const giftsId = categoryMap["gifts"];
    const returnGiftsId = categoryMap["school-return-gifts"] || categoryMap["return-gifts"] || categories.find(c => c.value.includes("return"))?.id;

    console.log("Category UUID Mapping:", {
      "tambulam-bags": tambulamId,
      "divine": divineId,
      "gifts": giftsId,
      "school-return-gifts": returnGiftsId
    });

    // Clear existing products and variants first
    console.log("🧹 Clearing existing products & variants...");
    await Variant.destroy({ where: {} });
    await Product.destroy({ where: {} });
    console.log("🧹 Done cleaning");

    for (let index = 0; index < productsData.length; index++) {
      const p = productsData[index];
      let catId = giftsId; // default fallback
      if (p.categorySlug === "tambulam-bags") catId = tambulamId;
      else if (p.categorySlug === "divine") catId = divineId;
      else if (p.categorySlug === "school-return-gifts") catId = returnGiftsId;

      const slug = slugify(p.name);
      const productImg = [sampleImages[index % sampleImages.length]];
      const basePrice = p.variants[0].price;
      const totalStock = p.variants.length * 50;

      // Map variants array to product variation format
      const variations = p.variants.map((v, vIdx) => {
        return {
          variantName: v.name,
          attributes: v.attributes,
          mrp: String(v.price),
          salesPrice: String(v.price),
          stock: "50",
          unit: "Piece",
          colour: "",
          size: "",
          material: "",
          finish: "",
          weight: "",
          dimensions: "",
          engraving: "",
          printText: "",
          customLabel: "",
          subCategory: "",
          variantImageIndex: 0,
          status: "Active"
        };
      });

      // Create product
      const product = await Product.create({
        sku: `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
        name: p.name,
        slug: slug,
        price: basePrice,
        discount: 0,
        isNew: true,
        isCustomisable: p.customisable,
        category: catId ? [String(catId)] : [],
        tag: p.customisable ? ["kids", "stationary", "gifts", "customisable"] : ["kids", "stationary", "gifts"],
        variation: variations,
        image: productImg,
        shortDescription: p.shortDescription,
        fullDescription: p.fullDescription,
        stock: totalStock,
        categoryId: catId || null,
        isPartialCodAvailable: true,
        customisationFields: p.customisable ? { color: true, size: true, custom_details: true } : null
      });

      // Create variant rows
      for (let vIdx = 0; vIdx < p.variants.length; vIdx++) {
        const v = p.variants[vIdx];
        await Variant.create({
          productId: product.id,
          variantName: v.name,
          mrp: v.price,
          salesPrice: v.price,
          stock: 50,
          sku: `KMV-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
          attributes: v.attributes,
          status: "Active",
          image: productImg[0]
        });
      }

      console.log(`🎁 Seeded product (${index + 1}/52): ${p.name}`);
    }

    console.log("🎉 All 52 products seeded successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seed();
