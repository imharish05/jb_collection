require("dotenv").config();
const {
  sequelize,
  Category,
  Event,
  Combo,
  HeroSlide,
  OfferBanner,
  MarqueeMessage,
  Blog,
  Product,
  User,
  Testimonial,
} = require("../models");

// ─── Helper: upsert a list into a model using a unique key ───────────────────
// Runs findOrCreate for each row so re-running the seed is always safe.
const upsertAll = async (Model, rows, uniqueKey) => {
  for (const row of rows) {
    await Model.upsert(row);
  }
};

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ MySQL DB connected");

    // Avoid sync({ alter: true }): on MySQL it can fail with SequelizeUnknownConstraintError
    // when altering tables with FKs (e.g. wishlist_items) if constraint names drift.
    await sequelize.sync({ alter: false });
    console.log("✅ Tables synced");

    // ── Nav Categories ───────────────────────────────────────────────────────
    // Unique key: label  (value can be null so it can't serve as the unique key)
    await upsertAll(
      Category,
      [
        { label: "All Products",         value: null,           image: "/assets/img/products/products-1.jpeg",  sortOrder: 0 },
        { label: "Gifts",                value: "gifts",        image: "/assets/img/products/products-2.jpeg",  sortOrder: 1 },
        { label: "Divine",               value: "divine",       image: "/assets/img/products/products-10.jpeg", sortOrder: 2 },
        { label: "School Return Gifts",  value: "return-gifts", image: "/assets/img/products/products-11.jpeg", sortOrder: 3 },
        { label: "Tambulam Bags",        value: "tambulam",     image: "/assets/img/products/products-12.jpeg", sortOrder: 4 },
        { label: "Toys",                 value: "toys",         image: "/assets/img/products/products-7.jpeg",  sortOrder: 5 },
        { label: "Customised Jewellery", value: "jewellery",    image: "/assets/img/products/products-14.jpeg", sortOrder: 6 },
        { label: "Crochet Gifts",        value: "crochet",      image: "/assets/img/products/products-3.jpeg",  sortOrder: 7 },
        { label: "Customised Bracelets", value: "bracelets",    image: "/assets/img/products/products-6.jpeg",  sortOrder: 8 },
      ],
      "label"
    );
    console.log("✅ Nav categories seeded");

    // ── Nav Events ───────────────────────────────────────────────────────────
    await upsertAll(
      Event,
      [
        { label: "Birthday",              value: "birthday",        sortOrder: 0  },
        { label: "Engagement",            value: "engagement",      sortOrder: 1  },
        { label: "Wedding",               value: "wedding",         sortOrder: 2  },
        { label: "Baby Shower",           value: "baby-shower",     sortOrder: 3  },
        { label: "Cradle Ceremony",       value: "cradle-ceremony", sortOrder: 4  },
        { label: "Ear Piercing Ceremony", value: "ear-piercing",    sortOrder: 5  },
        { label: "Upanayanam",            value: "upanayanam",      sortOrder: 6  },
        { label: "Baptism",               value: "baptism",         sortOrder: 7  },
        { label: "Navarathri / Golu",     value: "navarathri",      sortOrder: 8  },
        { label: "Varalakshmi Poojai",    value: "varalakshmi",     sortOrder: 9  },
        { label: "House Warming",         value: "house-warming",   sortOrder: 10 },
        { label: "Puberty",               value: "puberty",         sortOrder: 11 },
        { label: "Retirement",            value: "retirement",      sortOrder: 12 },
      ],
      "label"
    );
    console.log("✅ Nav events seeded");

    // ── Testimonials ─────────────────────────────────────────────────────────
    await upsertAll(
      Testimonial,
      [
        {
          id: "88e5d6cc-cf6e-473d-82d2-cc684f4f728c",
          name: "Priyal & Aarav",
          designation: "Parent of Aarav (6 yrs)",
          text: "Aarav loved his custom dinosaur school bag and matching personalized pencils! The engraving is beautiful and the quality is outstanding. It made starting 1st grade so much more exciting for him.",
          image: "uploads/testimonials/1780918029609.png",
          sortOrder: 0
        },
        {
          id: "f20c1537-8de4-4740-979f-0980ff63ff0d",
          name: "Meera Krishnan",
          designation: "Mother of two, Bangalore",
          text: "We ordered personalized notebooks and name stamps for my daughter's birthday party return gifts. All the kids were thrilled to see their own names on the notebooks! Excellent service and quick delivery.",
          image: "uploads/testimonials/1780918067114.png",
          sortOrder: 1
        },
        {
          id: "a9062eb5-2b02-47ab-a1db-449e3ccb8882",
          name: "Rajesh Sen",
          designation: "Father of Diya (8 yrs)",
          text: "The customized wooden pencil case with Diya's custom cartoon sketch is her new favorite possession. She keeps showing it to all her school friends. JB House of Fashion has the best personalized stationary collection for kids.",
          image: "uploads/testimonials/1781004680993.png",
          sortOrder: 2
        }
      ],
      "id"
    );
    console.log("✅ Testimonials seeded");

    const { seedCoupons } = require("../controllers/couponController");
    await seedCoupons();

  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
};

module.exports = seed;

if (require.main === module) {
  seed()
    .then(async () => {
      await sequelize.close();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await sequelize.close().catch(() => {});
      process.exit(1);
    });
}