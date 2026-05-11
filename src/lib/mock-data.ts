import { type DemoState } from "@/lib/types"

const now = new Date("2026-05-08T08:00:00.000Z")

function daysAgo(days: number) {
  const copy = new Date(now)
  copy.setDate(copy.getDate() - days)
  return copy.toISOString()
}

export function createInitialDemoState(): DemoState {
  return {
    users: [
      {
        id: "user-amara",
        phone: "+2348012345678",
        fullName: "Amara Okafor",
        profilePhotoUrl:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80",
        accountType: "buyer",
        createdAt: daysAgo(120)
      },
      {
        id: "user-zainab",
        phone: "+2348099991122",
        fullName: "Zainab Bello",
        profilePhotoUrl:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=300&q=80",
        accountType: "both",
        createdAt: daysAgo(150)
      },
      {
        id: "user-tosin",
        phone: "+2348077773344",
        fullName: "Tosin Adeyemi",
        profilePhotoUrl:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&q=80",
        accountType: "seller",
        createdAt: daysAgo(90)
      },
      {
        id: "user-ify",
        phone: "+2348122227788",
        fullName: "Ify Chukwu",
        profilePhotoUrl:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80",
        accountType: "seller",
        createdAt: daysAgo(80)
      }
    ],
    vendors: [
      {
        id: "vendor-zainab-luxe",
        userId: "user-zainab",
        storeName: "Zainab Luxe Beauty",
        storePhotoUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=1200&q=80",
        bio: "Premium cosmetics, soft glam essentials, and bridal-ready lashes.",
        category: "cosmetics",
        city: "Abuja",
        whatsappNumber: "2348099991122",
        isActive: true,
        totalSales: 214,
        rating: 4.8,
        createdAt: daysAgo(60)
      },
      {
        id: "vendor-tosin-time",
        userId: "user-tosin",
        storeName: "Tosin Timepieces",
        storePhotoUrl:
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1200&q=80",
        bio: "Luxury-inspired watches for everyday flex and gifting.",
        category: "watches",
        city: "Lagos",
        whatsappNumber: "2348077773344",
        isActive: true,
        totalSales: 143,
        rating: 4.6,
        createdAt: daysAgo(44)
      },
      {
        id: "vendor-ify-threads",
        userId: "user-ify",
        storeName: "Ify Threads",
        storePhotoUrl:
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=1200&q=80",
        bio: "Clean silhouettes, bright prints, and occasion outfits that travel well.",
        category: "fashion",
        city: "Port Harcourt",
        whatsappNumber: "2348122227788",
        isActive: true,
        totalSales: 328,
        rating: 4.9,
        createdAt: daysAgo(38)
      },
      {
        id: "vendor-gold-room",
        userId: "user-zainab",
        storeName: "The Gold Room",
        storePhotoUrl:
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=1200&q=80",
        bio: "Minimal jewellery, statement earrings, and layered shine.",
        category: "jewellery",
        city: "Enugu",
        whatsappNumber: "2348099991122",
        isActive: true,
        totalSales: 89,
        rating: 4.5,
        createdAt: daysAgo(26)
      },
      {
        id: "vendor-lace-loft",
        userId: "user-ify",
        storeName: "Lace Loft Wigs",
        storePhotoUrl:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=1200&q=80",
        bio: "HD lace wigs, revamp services, and beginner-friendly installs.",
        category: "wigs",
        city: "Benin City",
        whatsappNumber: "2348122227788",
        isActive: true,
        totalSales: 201,
        rating: 4.7,
        createdAt: daysAgo(20)
      }
    ],
    products: [
      {
        id: "prod-1",
        vendorId: "vendor-zainab-luxe",
        name: "Bridal Glow Palette",
        description: "Warm shimmer palette with soft mattes for all-day bridal glam.",
        price: 32000,
        photoUrl:
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=800&q=80",
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&q=80",
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(18)
      },
      {
        id: "prod-2",
        vendorId: "vendor-zainab-luxe",
        name: "Signature Lip Kit",
        description: "Longwear nude liner and velvet lipstick combo.",
        price: 14000,
        photoUrl:
          "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=800&q=80",
          "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(12)
      },
      {
        id: "prod-3",
        vendorId: "vendor-tosin-time",
        name: "Midnight Steel Watch",
        description: "Polished stainless wristwatch with clean black dial.",
        price: 68000,
        photoUrl:
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80",
          "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(16)
      },
      {
        id: "prod-4",
        vendorId: "vendor-tosin-time",
        name: "Rose Gold Couple Set",
        description: "Matching watch set with gift-ready box.",
        price: 92000,
        photoUrl:
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=800&q=80"
        ],
        inStock: false,
        createdAt: daysAgo(9)
      },
      {
        id: "prod-5",
        vendorId: "vendor-ify-threads",
        name: "Sunset Ankara Set",
        description: "Two-piece relaxed set cut in a bold Ankara print.",
        price: 45000,
        photoUrl:
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=800&q=80",
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(13)
      },
      {
        id: "prod-6",
        vendorId: "vendor-ify-threads",
        name: "Silk Occasion Dress",
        description: "Elegant midi dress designed for receptions and dinners.",
        price: 72000,
        photoUrl:
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=800&q=80",
          "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&q=80",
          "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(7)
      },
      {
        id: "prod-6b",
        vendorId: "vendor-ify-threads",
        name: "Mini Leather Bag",
        description: "Structured shoulder bag with gold hardware and easy day-to-night styling.",
        price: 38000,
        photoUrl:
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80",
          "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&q=80",
          "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(5)
      },
      {
        id: "prod-7",
        vendorId: "vendor-gold-room",
        name: "Layered Gold Chain",
        description: "Three-layer stainless piece with anti-tarnish finish.",
        price: 18000,
        photoUrl:
          "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=800&q=80",
          "https://images.unsplash.com/photo-1617038220319-276d3cfab638?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(11)
      },
      {
        id: "prod-8",
        vendorId: "vendor-lace-loft",
        name: "13x4 HD Closure Wig",
        description: "Soft 22-inch straight wig with secure adjustable band.",
        price: 155000,
        photoUrl:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80",
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(6)
      },
      {
        id: "prod-9",
        vendorId: "vendor-lace-loft",
        name: "Body Wave Unit",
        description: "Voluminous body wave unit with natural density.",
        price: 132000,
        photoUrl:
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
        photoUrls: [
          "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=80",
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&q=80"
        ],
        inStock: true,
        createdAt: daysAgo(4)
      }
    ],
    orders: [
      {
        id: "order-1",
        buyerId: "user-amara",
        vendorId: "vendor-ify-threads",
        items: [
          {
            productId: "prod-5",
            name: "Sunset Ankara Set",
            price: 45000,
            quantity: 1
          }
        ],
        totalAmount: 45000,
        status: "dispatched",
        paystackReference: "LOL-DEMO-001",
        deliveryAddress: "22 Admiralty Way, Lekki Phase 1, Lagos",
        createdAt: daysAgo(3)
      },
      {
        id: "order-2",
        buyerId: "user-amara",
        vendorId: "vendor-zainab-luxe",
        items: [
          {
            productId: "prod-1",
            name: "Bridal Glow Palette",
            price: 32000,
            quantity: 1
          },
          {
            productId: "prod-2",
            name: "Signature Lip Kit",
            price: 14000,
            quantity: 1
          }
        ],
        totalAmount: 46000,
        status: "delivered",
        paystackReference: "LOL-DEMO-002",
        deliveryAddress: "10 Sani Abacha Road, GRA Phase 2, Port Harcourt",
        createdAt: daysAgo(11)
      },
      {
        id: "order-3",
        buyerId: "user-zainab",
        vendorId: "vendor-tosin-time",
        items: [
          {
            productId: "prod-3",
            name: "Midnight Steel Watch",
            price: 68000,
            quantity: 1
          }
        ],
        totalAmount: 68000,
        status: "pending",
        paystackReference: "LOL-DEMO-003",
        deliveryAddress: "11 Aguiyi Ironsi Street, Maitama, Abuja",
        createdAt: daysAgo(1)
      }
    ],
    reviews: [
      {
        id: "review-1",
        orderId: "order-2",
        buyerId: "user-amara",
        vendorId: "vendor-zainab-luxe",
        rating: 5,
        comment: "Packaging was beautiful and the palette looked exactly like the photos.",
        createdAt: daysAgo(8)
      },
      {
        id: "review-2",
        orderId: "order-1",
        buyerId: "user-amara",
        vendorId: "vendor-ify-threads",
        rating: 5,
        comment: "Quick dispatch and the fit was perfect on arrival.",
        createdAt: daysAgo(2)
      }
    ]
  }
}
