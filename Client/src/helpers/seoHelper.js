const categoryMap = {
  "fashion": {
    title: "Buy Fashion Apparel & Accessories Online",
    description: "Shop the latest fashion collection at JB Collections. Explore premium sarees, kurtis, lehangas, bags, earrings, kids fashion, and custom accessories.",
    keywords: "fashion, online clothing, women's clothing, sarees, kurtis, lehangas, accessories, bags, earrings, silver jewellery, kids fashion"
  },
  "grocery": {
    title: "Online Grocery Shopping - Staples, Snacks & Beverages",
    description: "Order fresh groceries, staples, snacks, beverages, and personal care products online. Safe and fast delivery to your doorstep.",
    keywords: "online grocery, buy groceries online, kitchen staples, snacks and drinks, household cleaning"
  },
  "beauty--personal-care": {
    title: "Beauty & Personal Care - Skin, Hair & Fragrance",
    description: "Shop premium beauty and personal care items. Explore face washes, sunscreens, shampoos, hair oils, and luxury fragrances.",
    keywords: "beauty products, skin care routine, hair care products, luxury perfumes, body spray"
  },
  "home": {
    title: "Home & Kitchen Essentials",
    description: "Transform your space with our Home and Kitchen collection. Shop kitchen storage containers, kitchen tools, and utility items.",
    keywords: "home essentials, kitchen items, kitchen storage containers, kitchen tools, home decor"
  },
  "food--healthcare": {
    title: "Food & Healthcare Products",
    description: "Discover delicious food items and healthcare essentials. Shop gourmet chocolates, tea stores, air fresheners, and household cleaners.",
    keywords: "food items, health products, chocolates online, air fresheners, toilet cleaners"
  },
  "toys--baby-care": {
    title: "Toys & Baby Care, Stationary & School Supplies",
    description: "Find school supplies, kids toys, and baby care essentials. Shop pens, notebooks, and learning materials.",
    keywords: "school supplies, stationery items, kids toys, baby care"
  },
  "gift-cards": {
    title: "E-Gift Cards for Every Occasion",
    description: "Choose from our selection of digital Gift Cards. Ideal for birthdays, anniversaries, corporate rewards, and festivals.",
    keywords: "gift cards, buy gift voucher, digital gift card, shopping voucher"
  }
};

const subcategoryMap = {
  "womens-clothing": {
    title: "Women's Clothing Collection - Sarees, Kurtis & Lehangas",
    description: "Discover elegant Women's Clothing at JB Collections. Shop premium sarees, custom design kurtis, lehangas, jackets, and cholis tailored for every occasion.",
    keywords: "womens clothing, sarees online, designer kurtis, lehanga choli, ladies jackets, genz fashion women"
  },
  "accessories": {
    title: "Fashion Accessories - Bags, Purses, Earrings & Jewellery",
    description: "Accessorize your look with our collection of hand bags, purses, earrings, and silver jewellery. High quality and stylish accessories for women.",
    keywords: "fashion accessories, hand bags, womens purses, earrings online, silver jewellery, custom bags"
  },
  "womens-essentials": {
    title: "Women's Essentials & GenZ Fashion",
    description: "Explore comfortable shapewear, camisoles, and trendy GenZ fashion essentials for women. Perfect fit and high-quality fabrics.",
    keywords: "womens essentials, shapewear online, ladies camisoles, genz girls fashion"
  },
  "kids-fashion": {
    title: "Kids Fashion - Trendy Kids Bottomwear & Innerwear",
    description: "Shop comfortable and stylish kids fashion. High-quality kids innerwear and bottomwear designed for active boys and girls.",
    keywords: "kids fashion, kids bottomwear, kids innerwear, children clothing"
  },
  "staples": {
    title: "Quality Grocery Staples - Rice, Atta, Oils & Spices",
    description: "Stock up on high-quality grocery staples. Shop premium rice, atta, flour, dry fruits, nuts, sugar, jaggery, masalas, spices, ghee, and oils.",
    keywords: "grocery staples, basmati rice, wheat flour atta, dry fruits online, kitchen masalas, organic ghee, cooking oils"
  },
  "household-care": {
    title: "Household Cleaning & Care Products",
    description: "Keep your home clean and fresh with our household care products. Shop effective floor cleaners and disinfectants.",
    keywords: "household care, floor cleaner, home cleaning products, disinfectants"
  },
  "snacks--beverages": {
    title: "Snacks & Beverages - Juices, Tea, Coffee & Biscuits",
    description: "Enjoy delicious snacks and beverages. Browse fresh juices, health drink mixes, crunchy chips, premium tea, coffee, and biscuits.",
    keywords: "snacks online, juices, health drink mix, potato chips, organic tea, coffee powder, biscuits online"
  },
  "personal--baby-care": {
    title: "Personal & Baby Care Products",
    description: "Take care of yourself and your baby with our personal care range. Shop oral care, baby bath products, deodorants, perfumes, hair care, and skin creams.",
    keywords: "personal care, baby care products, toothpaste oral care, baby body wash, deodorants, hair care shampoo, body lotions"
  },
  "skin-care": {
    title: "Skin Care Products - Face Wash, Sunscreen & Creams",
    description: "Achieve glowing skin with our dermatologist-approved skin care products. Shop gentle face wash, SPF sunscreen, and nourishing face creams.",
    keywords: "skin care, face wash online, sunscreen spf 50, face creams, moisturizer"
  },
  "hair-care": {
    title: "Hair Care Products - Nourishing Shampoos & Oils",
    description: "Strengthen your locks with our premium hair care products. Shop nourishing shampoos and herbal hair oils for all hair types.",
    keywords: "hair care, best shampoo, herbal hair oil, hair growth oil"
  },
  "fragrance-": {
    title: "Luxury Fragrances - Perfumes & Roll-ons",
    description: "Find your signature scent with our luxury fragrances. Long-lasting perfumes and convenient roll-ons for men and women.",
    keywords: "perfumes online, buy roll on, long lasting fragrance, body spray"
  },
  "kitchen-items": {
    title: "Kitchen Items - Storage & Tools",
    description: "Equip your kitchen with high-quality storage containers and utility tools. Durable, safe, and elegant kitchenware.",
    keywords: "kitchen storage, kitchen tools, kitchen containers, spatulas, knives"
  },
  "food": {
    title: "Gourmet Food - Chocolates & Tea Store",
    description: "Indulge in premium chocolates and select teas. Perfect for gifting or personal enjoyment.",
    keywords: "chocolates, premium tea, green tea, dark chocolate"
  },
  "household-supplies": {
    title: "Household Supplies - Fresheners & Toilet Cleaners",
    description: "Keep your household running smoothly with premium supplies. Browse air fresheners, toilet cleaners, and utility items.",
    keywords: "household supplies, air freshener spray, toilet cleaner liquid"
  },
  "stationary--school-supplies": {
    title: "Stationery & School Supplies - Pens & Notebooks",
    description: "Get ready for school or office with our premium stationery. High-quality pens, notebooks, and academic supplies.",
    keywords: "stationery, school supplies, gel pens, study notebooks, office stationery"
  }
};

const subsubcategoryMap = {
  "sarees": {
    title: "Sarees Online - Designer & Traditional Sarees",
    description: "Shop beautiful sarees online at JB Collections. Elegant, lightweight, and perfect for festivals, weddings, and daily wear.",
    keywords: "sarees online, designer sarees, silk sarees, cotton sarees, traditional sarees"
  },
  "kurti": {
    title: "Kurtis & Tunics - Elegant Designs",
    description: "Browse fashionable kurtis and tunics for women. Comfortable daily wear and festive designer kurtis.",
    keywords: "kurtis online, designer tunics, girls kurti, ladies tops"
  },
  "lehanga": {
    title: "Lehenga Choli Collection - Traditional Wear",
    description: "Look stunning in our designer Lehenga Cholis. Perfect for weddings, receptions, and festivals.",
    keywords: "lehenga choli, designer lehenga, bridal lehenga, ghagra choli"
  },
  "jackets": {
    title: "Women's Jackets & Outerwear",
    description: "Shop stylish women's jackets. Elevate your outfits with lightweight and cozy jackets.",
    keywords: "womens jackets, girls shrugs, winter wear ladies"
  },
  "choli": {
    title: "Designer Cholis & Blouses",
    description: "Find matching cholis and designer blouses for your lehangas and sarees.",
    keywords: "choli design, saree blouse, designer choli"
  },
  "t---shirt": {
    title: "Women's T-Shirts & Casual Tops",
    description: "Shop comfortable, high-quality women's t-shirts and casual tops. Perfect for everyday wear.",
    keywords: "womens t-shirt, casual tops, ladies tee"
  },
  "genz-fashion": {
    title: "Trendy GenZ Fashion Collection",
    description: "Explore the latest GenZ style clothing and streetwear. Vibrant, bold, and comfortable designs.",
    keywords: "genz fashion, streetwear online, aesthetic clothing, trendy outfits"
  },
  "bags-hand-bag": {
    title: "Handbags & Shoulder Bags for Women",
    description: "Carry your essentials in style with our premium handbags and shoulder bags. Trendy designs and spacious layouts.",
    keywords: "handbags online, shoulder bags, ladies handbags, side bags"
  },
  "purse": {
    title: "Women's Wallets & Purses",
    description: "Keep your cash and cards secure with stylish wallets and purses. Compact and elegant.",
    keywords: "ladies purse, womens wallet, clutch purse"
  },
  "earing": {
    title: "Earrings & Studs Online",
    description: "Shop beautiful earrings, studs, and jhumkas. Elevate your look for casual days or grand celebrations.",
    keywords: "earrings online, studs jhumkas, fashion jewellery earrings"
  },
  "silver-jwellery": {
    title: "Silver Jewellery Collection",
    description: "Explore pure and sterling silver jewellery. Timeless necklaces, rings, and bracelets.",
    keywords: "silver jewellery, sterling silver ring, silver necklace"
  },
  "shapwear": {
    title: "Body Shapewear & Bodysuits",
    description: "Get a smooth silhouette with our comfortable, breathable body shapewear.",
    keywords: "body shapewear, waist trainer, tummy control shapewear"
  },
  "camisoles": {
    title: "Women's Camisoles & Inner Slips",
    description: "Browse soft, stretchable camisoles and inner slips for day-long comfort.",
    keywords: "womens camisole, inner slip, cotton camisoles"
  },
  "kids-innerwear": {
    title: "Comfortable Kids Innerwear",
    description: "Keep your little ones comfortable with breathable cotton innerwear for kids.",
    keywords: "kids innerwear, children briefs, cotton vests kids"
  },
  "kids-bottomwear": {
    title: "Kids Bottomwear - Shorts, Pants & Pajamas",
    description: "Shop durable and soft kids bottomwear. Perfect for playtime and sleeping.",
    keywords: "kids bottomwear, children shorts, boys joggers, girls leggings"
  },
  "rice--rice-products": {
    title: "Rice & Rice Products - Premium Basmati",
    description: "Buy premium quality basmati rice, raw rice, and flattened rice (poha) online.",
    keywords: "basmati rice, raw rice, poha online, brown rice"
  },
  "atta--flour": {
    title: "Atta & Flours - Wheat, Ragi & Maida",
    description: "Shop healthy flour options including whole wheat atta, ragi, and multipurpose flour.",
    keywords: "wheat flour, whole wheat atta, ragi flour, organic flour"
  },
  "dry-fruits--nuts": {
    title: "Healthy Dry Fruits & Nuts online",
    description: "Boost your immunity with premium almonds, cashews, raisins, walnuts, and dates.",
    keywords: "dry fruits online, almonds cashews, healthy nuts, walnuts dates"
  },
  "sugar-jaggery-salt": {
    title: "Sugar, Jaggery & Salt - Cooking Essentials",
    description: "Stock up on daily essentials like refined sugar, organic jaggery, rock salt, and table salt.",
    keywords: "organic jaggery, rock salt, white sugar, cooking salt"
  },
  "masalas--spices": {
    title: "Spices & Cooking Masalas online",
    description: "Add rich flavor to your dishes with aromatic spices, turmeric, chili powder, and blended masalas.",
    keywords: "cooking masalas, spices online, turmeric powder, garam masala"
  },
  "ghee--oils": {
    title: "Pure Ghee & Healthy Cooking Oils",
    description: "Cook healthy meals with pure cow ghee, cold-pressed coconut oil, mustard oil, and sunflower oil.",
    keywords: "pure ghee, cold pressed oil, coconut oil, cooking oils"
  },
  "floor--other-cleaners": {
    title: "Floor Cleaners & Disinfectants",
    description: "Maintain a germ-free home with powerful floor cleaners and surface disinfectants.",
    keywords: "floor cleaner, surface disinfectant, floor wash liquid"
  },
  "juices": {
    title: "Fruit Juices & Refreshing Drinks",
    description: "Quench your thirst with fresh fruit juices, squashes, and instant energy drinks.",
    keywords: "fruit juices, mango juice, orange squash, energy drinks"
  },
  "health-drink-mix": {
    title: "Nutrition & Health Drink Mixes",
    description: "Shop healthy nutrition drink mixes for kids and adults. Boost daily energy and health.",
    keywords: "health drink mix, chocolate health drink, nutritional powder"
  },
  "chips": {
    title: "Potato Chips & Crispy Snacks",
    description: "Munch on your favorite potato chips, nachos, and traditional crispy Indian snacks.",
    keywords: "potato chips, crispy snacks, nachos online, tea time snacks"
  },
  "tea-stare": {
    title: "Premium Tea Store - Green & Black Tea",
    description: "Browse refreshing tea blends, organic green tea, masala chai, and premium loose tea leaves.",
    keywords: "tea store, green tea online, masala chai powder, black tea"
  },
  "coffee": {
    title: "Premium Coffee - Filter Coffee & Instant Coffee",
    description: "Start your morning with rich filter coffee and smooth instant coffee powders.",
    keywords: "filter coffee powder, instant coffee, roasted coffee beans"
  },
  "biscuits": {
    title: "Biscuits & Cookies Online",
    description: "Pair your tea with crunchy chocolate cookies, butter biscuits, and digestive crackers.",
    keywords: "biscuits online, chocolate cookies, butter biscuits, cookies pack"
  },
  "oral-care": {
    title: "Oral Care - Toothpastes & Toothbrushes",
    description: "Maintain dental hygiene with fluoride-free toothpaste, herbal toothpaste, and soft toothbrushes.",
    keywords: "herbal toothpaste, charcoal toothbrush, oral hygiene mouthwash"
  },
  "baby-both": {
    title: "Baby Bath & Body Wash",
    description: "Gently cleanse your baby's skin with tear-free baby washes, mild soaps, and baby shampoos.",
    keywords: "baby body wash, tear free baby shampoo, mild baby soap"
  },
  "deos--perfumes": {
    title: "Deodorants & Perfumes - Long Lasting",
    description: "Stay fresh all day with our selection of deodorants and long-lasting perfumes.",
    keywords: "body spray deodorants, perfumes online, men body spray"
  },
  "creams-lotions": {
    title: "Body Creams & Moisturizing Lotions",
    description: "Hydrate your skin with nourishing body creams and quick-absorbing moisturizers.",
    keywords: "body lotion, moisturizing cream, skin hydration"
  },
  "face-wash": {
    title: "Face Wash & Face Cleansers",
    description: "Cleanse impurities and excess oil with gentle foaming face washes for all skin types.",
    keywords: "face wash online, acne face wash, gentle face cleanser"
  },
  "sunscreen": {
    title: "Sunscreen SPF 50+ - Sun Protection",
    description: "Protect your skin from UV rays with lightweight, non-greasy sunscreens.",
    keywords: "sunscreen spf 50, matte sunscreen, uv blocker cream"
  },
  "face-creams": {
    title: "Face Creams & Moisturizers",
    description: "Discover night creams, daily moisturizers, and brightening face creams for glowing skin.",
    keywords: "glowing face cream, night cream moisturizer, skin brightening"
  },
  "shampoo": {
    title: "Shampoos & Hair Conditioners",
    description: "Combat hair fall and dandruff with top-quality shampoos and moisturizing conditioners.",
    keywords: "anti hair fall shampoo, anti dandruff shampoo, hair conditioner"
  },
  "hair-oil": {
    title: "Nourishing Hair Oils - Onion & Coconut",
    description: "Promote hair growth and shine with pure coconut oil, amla oil, and red onion hair oil.",
    keywords: "hair growth oil, amla hair oil, onion oil hair"
  },
  "perfumes": {
    title: "Premium Perfumes & Colognes",
    description: "Browse high-end perfumes and colognes with exquisite, long-lasting fragrances.",
    keywords: "premium perfumes, mens cologne, luxury scent"
  },
  "roll-on": {
    title: "Underarm Roll-ons & Deodorant Sticks",
    description: "Fight body odor naturally with refreshing and skin-friendly underarm roll-ons.",
    keywords: "underarm roll on, deodorant stick, natural roll on"
  },
  "kitchen-storage": {
    title: "Kitchen Storage & Airtight Containers",
    description: "Organize your kitchen with durable glass jars, airtight plastic containers, and spice racks.",
    keywords: "kitchen storage, glass jars, airtight containers, spice container"
  },
  "kitchen-tools": {
    title: "Kitchen Tools, Knives & Gadgets",
    description: "Make cooking easy with vegetable choppers, sharp knife sets, spatulas, and modern kitchen tools.",
    keywords: "kitchen tools, vegetable chopper, chef knife, kitchen spatula"
  },
  "chocolates": {
    title: "Chocolates & Sweet Confectioneries",
    description: "Indulge in milk chocolates, dark chocolates, and gourmet truffles perfect for gifting.",
    keywords: "milk chocolate, dark chocolate bar, chocolate truffles box"
  },
  "tea-store": {
    title: "Tea Blends - Green, Herbal & Assam Tea",
    description: "Shop rich Assam tea dust, healthy herbal teas, and soothing chamomile blends.",
    keywords: "assam tea dust, herbal teas, chamomile tea bags"
  },
  "house-hold": {
    title: "Household Utility Supplies",
    description: "Find general household utility items, kitchen tissues, garbage bags, and cleaning cloths.",
    keywords: "household supplies, garbage bags, kitchen tissue roll"
  },
  "air-freshners": {
    title: "Air Fresheners & Room Sprays",
    description: "Keep your home smelling delightful with automatic room sprays and gel air fresheners.",
    keywords: "air freshener spray, automatic room freshener, pocket freshener"
  },
  "toilet-cleaners": {
    title: "Toilet Cleaners & Bathroom Sanitizers",
    description: "Kill 99.9% of germs with powerful toilet bowl cleaner liquids and bathroom surface cleaners.",
    keywords: "toilet cleaner liquid, bathroom disinfectant, block toilet freshener"
  },
  "pens": {
    title: "Pens & Writing Stationery",
    description: "Buy smooth-writing gel pens, ballpoint pens, and premium writing pens.",
    keywords: "gel pens, ballpoint pen, fountain pen, school writing stationery"
  },
  "note-books": {
    title: "Notebooks, Diaries & Journals",
    description: "Write down your thoughts in premium notebooks, daily planners, and executive diaries.",
    keywords: "ruled notebook, personal diary, executive planner, bullet journal"
  }
};

export const getShopSEO = ({
  catParam,
  subCatParam,
  subSubCatParam,
  eventParam,
  comboParam,
  searchParam,
  activeLabel,
  currentCombo
}) => {
  // Try subsubcategory first
  if (subSubCatParam) {
    const key = String(subSubCatParam).toLowerCase();
    if (subsubcategoryMap[key]) {
      return {
        title: subsubcategoryMap[key].title,
        description: subsubcategoryMap[key].description,
        keywords: subsubcategoryMap[key].keywords
      };
    }
  }
  
  // Try subcategory next
  if (subCatParam) {
    const key = String(subCatParam).toLowerCase();
    if (subcategoryMap[key]) {
      return {
        title: subcategoryMap[key].title,
        description: subcategoryMap[key].description,
        keywords: subcategoryMap[key].keywords
      };
    }
  }
  
  // Try category next
  if (catParam) {
    const key = String(catParam).toLowerCase();
    if (categoryMap[key]) {
      return {
        title: categoryMap[key].title,
        description: categoryMap[key].description,
        keywords: categoryMap[key].keywords
      };
    }
  }
  
  /* COMMENTED OUT BY USER REQUEST
  // Combos
  if (comboParam) {
    const comboName = currentCombo ? (currentCombo.label || currentCombo.name) : "Combo Products";
    return {
      title: `${comboName} - Premium Product Combos`,
      description: `Shop our curated collection of ${comboName} at JB Collections. Discover customized combo packages for everyday utility, home, and health.`,
      keywords: `${comboName}, combo products, custom combo packages`
    };
  }

  // Events
  if (eventParam) {
    const eventName = activeLabel || "Special Occasion";
    return {
      title: `Products for ${eventName}`,
      description: `Shop premium products for ${eventName} at JB Collections. Find top quality items for all your seasonal and event needs.`,
      keywords: `products for ${eventName}, buy ${eventName} items`
    };
  }
  */

  // Search
  if (searchParam) {
    return {
      title: `Search results for "${searchParam}"`,
      description: `Browse products matching "${searchParam}" at JB Collections. High-quality items across groceries, fashion, beauty, and home.`,
      keywords: `search ${searchParam}, buy ${searchParam} online, shop ${searchParam}`
    };
  }

  // Fallback / default shop
  const label = activeLabel || "Shop Online - Groceries, Fashion, Home & Beauty";
  return {
    title: label,
    description: "Shop the best selection of groceries, fashion apparel, beauty care, home essentials, toys, baby care, and food products online at JB Collections. Fast home delivery.",
    keywords: "online shopping, buy groceries online, buy fashion apparel, cosmetics beauty care, home products online, toys baby care, food store, gift cards, JB Collections"
  };
};

export const getProductSEO = (product) => {
  if (!product) {
    return {
      title: "Product Page",
      description: "Product Page of JB Collections.",
      keywords: "online shopping, department store, groceries, fashion, beauty"
    };
  }

  const name = product.name || "Product";
  const catLabel = product.Category?.label || (Array.isArray(product.category) && product.category[0]) || "";
  const subCatLabel = product.SubCategory?.label || "";
  
  // Clean description: strip any html tags, take first 160 chars
  const rawDesc = product.shortDescription || product.description || product.fullDescription || "";
  const cleanDesc = rawDesc
    .replace(/<[^>]*>/g, "") // remove HTML tags
    .replace(/\s+/g, " ")     // normalize whitespace
    .trim();
    
  const description = cleanDesc.length > 10 
    ? (cleanDesc.substring(0, 155) + "...")
    : `Buy ${name} online at JB Collections. High-quality ${catLabel ? catLabel.toLowerCase() : 'product'} available at the best price. Fast home delivery.`;

  // Keywords
  const baseKeywords = [
    name,
    `buy ${name} online`,
    "online shopping",
    "JB Collections"
  ];
  if (catLabel) baseKeywords.push(catLabel);
  if (subCatLabel) baseKeywords.push(subCatLabel);
  
  const keywords = baseKeywords.join(", ");

  // Resolve image URL
  let image = undefined;
  if (Array.isArray(product.image) && product.image.length > 0) {
    const firstImg = product.image[0];
    if (firstImg.startsWith("http")) {
      image = firstImg;
    } else {
      image = `${process.env.REACT_APP_IMG_URL || ""}/uploads/${firstImg.replace(/^\/?(uploads\/)?/, "")}`;
    }
  }

  return {
    title: name,
    titleTemplate: "JB Collections",
    description,
    keywords,
    image
  };
};
