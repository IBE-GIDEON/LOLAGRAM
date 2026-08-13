/**
 * UI translations for the app chrome — navigation, auth, cart, buttons, empty
 * states. Seller content (product names, descriptions, store bios) is never
 * translated: it stays in the words the seller wrote.
 *
 * Adding a language: add it to LANGUAGES and to DICTIONARIES. Any key you omit
 * falls back to English, so a partial translation degrades cleanly.
 */

export const LANGUAGES: Array<{
  code: string
  /** Name shown in the switcher, in that language. */
  label: string
  dir: "ltr" | "rtl"
}> = [
  { code: "en", label: "English", dir: "ltr" },
  { code: "fr", label: "Français", dir: "ltr" },
  { code: "es", label: "Español", dir: "ltr" },
  { code: "pt", label: "Português", dir: "ltr" },
  { code: "ar", label: "العربية", dir: "rtl" },
  { code: "sw", label: "Kiswahili", dir: "ltr" },
  { code: "hi", label: "हिन्दी", dir: "ltr" },
  { code: "zh", label: "中文", dir: "ltr" }
]

export const SUPPORTED_LANGUAGES = new Set(LANGUAGES.map((l) => l.code))

export function getLanguageDir(code: string) {
  return LANGUAGES.find((l) => l.code === code)?.dir ?? "ltr"
}

const en = {
  "nav.home": "Home",
  "nav.search": "Search",
  "nav.orders": "Orders",
  "nav.profile": "Profile",
  "nav.signIn": "Sign in",
  "nav.createAccount": "Create account",
  "nav.startSelling": "Start selling",
  "nav.myStore": "My store",
  "home.generalTab": "General",
  "home.vendorsTab": "Find Vendors",
  "home.searchProducts": "Search any product name or description",
  "home.searchVendors": "Search store name or category",
  "home.browseCopy": "Browse newly uploaded products from active vendors.",
  "home.vendorCopy": "Search across store names, categories, and cities.",
  "home.shopByStyle": "Shop by style",
  "home.seeAll": "See all",
  "product.addToCart": "Add to Cart",
  "product.outOfStock": "Out of Stock",
  "product.inStock": "In Stock",
  "product.share": "Share this product",
  "product.noPhoto": "No photo",
  "cart.title": "Your cart",
  "cart.placeOrder": "Place Order",
  "cart.placing": "Placing order...",
  "cart.oneVendor": "Orders in one cart stay with one vendor at a time.",
  "auth.welcomeBack": "Welcome back",
  "auth.welcomeBackSub": "Your cart, orders and saved stores are waiting.",
  "auth.createTitle": "Create your account",
  "auth.createSub": "Email and password. That is all — you can shop in seconds.",
  "auth.resetTitle": "Reset your password",
  "auth.resetSub": "We'll email you a link to set a new one.",
  "auth.email": "Email address",
  "auth.password": "Password",
  "auth.passwordHint": "At least 6 characters",
  "auth.yourPassword": "Your password",
  "auth.forgot": "Forgot password?",
  "auth.backToSignIn": "Back to sign in",
  "auth.keepBrowsing": "Keep browsing",
  "auth.sendReset": "Send reset link",
  "auth.creating": "Creating your account...",
  "auth.signingIn": "Signing you in...",
  "auth.sending": "Sending link...",
  "auth.noPhoneNeeded":
    "No phone number needed to join. We only ask for it when you place your first order or open a store.",
  "money.settlesInNaira": "Charged in naira ({amount})",
  "money.approxNote": "Converted for reference. You pay in Nigerian naira.",
  "settings.language": "Language",
  "settings.currency": "Currency",
  "settings.regionTitle": "Language & currency"
}

export type TranslationKey = keyof typeof en

const fr: Partial<Record<TranslationKey, string>> = {
  "nav.home": "Accueil",
  "nav.search": "Rechercher",
  "nav.orders": "Commandes",
  "nav.profile": "Profil",
  "nav.signIn": "Se connecter",
  "nav.createAccount": "Créer un compte",
  "nav.startSelling": "Vendre",
  "nav.myStore": "Ma boutique",
  "home.generalTab": "Général",
  "home.vendorsTab": "Trouver des boutiques",
  "home.searchProducts": "Rechercher un produit ou une description",
  "home.searchVendors": "Rechercher une boutique ou une catégorie",
  "home.browseCopy": "Découvrez les nouveaux produits des boutiques actives.",
  "home.vendorCopy": "Recherchez par nom de boutique, catégorie ou ville.",
  "home.shopByStyle": "Acheter par style",
  "home.seeAll": "Tout voir",
  "product.addToCart": "Ajouter au panier",
  "product.outOfStock": "Rupture de stock",
  "product.inStock": "En stock",
  "product.share": "Partager ce produit",
  "product.noPhoto": "Pas de photo",
  "cart.title": "Votre panier",
  "cart.placeOrder": "Commander",
  "cart.placing": "Commande en cours...",
  "cart.oneVendor": "Un panier ne contient qu'une seule boutique à la fois.",
  "auth.welcomeBack": "Bon retour",
  "auth.welcomeBackSub":
    "Votre panier, vos commandes et vos boutiques enregistrées vous attendent.",
  "auth.createTitle": "Créez votre compte",
  "auth.createSub":
    "E-mail et mot de passe. C'est tout — vous pouvez acheter en quelques secondes.",
  "auth.resetTitle": "Réinitialiser votre mot de passe",
  "auth.resetSub": "Nous vous enverrons un lien par e-mail.",
  "auth.email": "Adresse e-mail",
  "auth.password": "Mot de passe",
  "auth.passwordHint": "Au moins 6 caractères",
  "auth.yourPassword": "Votre mot de passe",
  "auth.forgot": "Mot de passe oublié ?",
  "auth.backToSignIn": "Retour à la connexion",
  "auth.keepBrowsing": "Continuer à naviguer",
  "auth.sendReset": "Envoyer le lien",
  "auth.creating": "Création de votre compte...",
  "auth.signingIn": "Connexion...",
  "auth.sending": "Envoi du lien...",
  "auth.noPhoneNeeded":
    "Aucun numéro de téléphone requis pour s'inscrire. Nous le demandons seulement à votre première commande ou à l'ouverture d'une boutique.",
  "money.settlesInNaira": "Débité en nairas ({amount})",
  "money.approxNote": "Converti à titre indicatif. Le paiement se fait en nairas.",
  "settings.language": "Langue",
  "settings.currency": "Devise",
  "settings.regionTitle": "Langue et devise"
}

const es: Partial<Record<TranslationKey, string>> = {
  "nav.home": "Inicio",
  "nav.search": "Buscar",
  "nav.orders": "Pedidos",
  "nav.profile": "Perfil",
  "nav.signIn": "Iniciar sesión",
  "nav.createAccount": "Crear cuenta",
  "nav.startSelling": "Vender",
  "nav.myStore": "Mi tienda",
  "home.generalTab": "General",
  "home.vendorsTab": "Buscar tiendas",
  "home.searchProducts": "Busca un producto o una descripción",
  "home.searchVendors": "Busca por tienda o categoría",
  "home.browseCopy": "Explora los productos más recientes de tiendas activas.",
  "home.vendorCopy": "Busca por nombre de tienda, categoría y ciudad.",
  "home.shopByStyle": "Compra por estilo",
  "home.seeAll": "Ver todo",
  "product.addToCart": "Añadir al carrito",
  "product.outOfStock": "Agotado",
  "product.inStock": "En stock",
  "product.share": "Compartir este producto",
  "product.noPhoto": "Sin foto",
  "cart.title": "Tu carrito",
  "cart.placeOrder": "Realizar pedido",
  "cart.placing": "Realizando pedido...",
  "cart.oneVendor": "Un carrito contiene una sola tienda a la vez.",
  "auth.welcomeBack": "Bienvenida de nuevo",
  "auth.welcomeBackSub":
    "Tu carrito, tus pedidos y tus tiendas guardadas te esperan.",
  "auth.createTitle": "Crea tu cuenta",
  "auth.createSub":
    "Correo y contraseña. Nada más: puedes comprar en segundos.",
  "auth.resetTitle": "Restablecer tu contraseña",
  "auth.resetSub": "Te enviaremos un enlace por correo.",
  "auth.email": "Correo electrónico",
  "auth.password": "Contraseña",
  "auth.passwordHint": "Al menos 6 caracteres",
  "auth.yourPassword": "Tu contraseña",
  "auth.forgot": "¿Olvidaste tu contraseña?",
  "auth.backToSignIn": "Volver a iniciar sesión",
  "auth.keepBrowsing": "Seguir explorando",
  "auth.sendReset": "Enviar enlace",
  "auth.creating": "Creando tu cuenta...",
  "auth.signingIn": "Iniciando sesión...",
  "auth.sending": "Enviando enlace...",
  "auth.noPhoneNeeded":
    "No necesitas teléfono para registrarte. Solo lo pedimos en tu primer pedido o al abrir una tienda.",
  "money.settlesInNaira": "Se cobra en nairas ({amount})",
  "money.approxNote": "Conversión de referencia. El pago se hace en nairas.",
  "settings.language": "Idioma",
  "settings.currency": "Moneda",
  "settings.regionTitle": "Idioma y moneda"
}

const pt: Partial<Record<TranslationKey, string>> = {
  "nav.home": "Início",
  "nav.search": "Pesquisar",
  "nav.orders": "Pedidos",
  "nav.profile": "Perfil",
  "nav.signIn": "Entrar",
  "nav.createAccount": "Criar conta",
  "nav.startSelling": "Vender",
  "nav.myStore": "Minha loja",
  "home.generalTab": "Geral",
  "home.vendorsTab": "Encontrar lojas",
  "home.searchProducts": "Pesquise um produto ou descrição",
  "home.searchVendors": "Pesquise por loja ou categoria",
  "home.browseCopy": "Veja os produtos mais recentes das lojas ativas.",
  "home.vendorCopy": "Pesquise por nome de loja, categoria e cidade.",
  "home.shopByStyle": "Comprar por estilo",
  "home.seeAll": "Ver tudo",
  "product.addToCart": "Adicionar ao carrinho",
  "product.outOfStock": "Esgotado",
  "product.inStock": "Em estoque",
  "product.share": "Compartilhar este produto",
  "product.noPhoto": "Sem foto",
  "cart.title": "Seu carrinho",
  "cart.placeOrder": "Fazer pedido",
  "cart.placing": "Enviando pedido...",
  "cart.oneVendor": "Um carrinho fica com uma loja por vez.",
  "auth.welcomeBack": "Bem-vinda de volta",
  "auth.welcomeBackSub":
    "Seu carrinho, seus pedidos e suas lojas salvas estão esperando.",
  "auth.createTitle": "Crie sua conta",
  "auth.createSub": "E-mail e senha. Só isso — você compra em segundos.",
  "auth.resetTitle": "Redefinir sua senha",
  "auth.resetSub": "Enviaremos um link por e-mail.",
  "auth.email": "Endereço de e-mail",
  "auth.password": "Senha",
  "auth.passwordHint": "Pelo menos 6 caracteres",
  "auth.yourPassword": "Sua senha",
  "auth.forgot": "Esqueceu a senha?",
  "auth.backToSignIn": "Voltar para entrar",
  "auth.keepBrowsing": "Continuar navegando",
  "auth.sendReset": "Enviar link",
  "auth.creating": "Criando sua conta...",
  "auth.signingIn": "Entrando...",
  "auth.sending": "Enviando link...",
  "auth.noPhoneNeeded":
    "Não precisa de telefone para entrar. Pedimos apenas no seu primeiro pedido ou ao abrir uma loja.",
  "money.settlesInNaira": "Cobrado em nairas ({amount})",
  "money.approxNote": "Convertido para referência. O pagamento é em nairas.",
  "settings.language": "Idioma",
  "settings.currency": "Moeda",
  "settings.regionTitle": "Idioma e moeda"
}

const ar: Partial<Record<TranslationKey, string>> = {
  "nav.home": "الرئيسية",
  "nav.search": "بحث",
  "nav.orders": "الطلبات",
  "nav.profile": "الملف الشخصي",
  "nav.signIn": "تسجيل الدخول",
  "nav.createAccount": "إنشاء حساب",
  "nav.startSelling": "ابدأ البيع",
  "nav.myStore": "متجري",
  "home.generalTab": "عام",
  "home.vendorsTab": "ابحث عن المتاجر",
  "home.searchProducts": "ابحث عن أي منتج أو وصف",
  "home.searchVendors": "ابحث باسم المتجر أو الفئة",
  "home.browseCopy": "تصفح أحدث المنتجات من المتاجر النشطة.",
  "home.vendorCopy": "ابحث في أسماء المتاجر والفئات والمدن.",
  "home.shopByStyle": "تسوق حسب الستايل",
  "home.seeAll": "عرض الكل",
  "product.addToCart": "أضف إلى السلة",
  "product.outOfStock": "غير متوفر",
  "product.inStock": "متوفر",
  "product.share": "شارك هذا المنتج",
  "product.noPhoto": "لا توجد صورة",
  "cart.title": "سلتك",
  "cart.placeOrder": "إتمام الطلب",
  "cart.placing": "جاري إرسال الطلب...",
  "cart.oneVendor": "تحتوي السلة على متجر واحد في المرة.",
  "auth.welcomeBack": "مرحبًا بعودتك",
  "auth.welcomeBackSub": "سلتك وطلباتك ومتاجرك المحفوظة في انتظارك.",
  "auth.createTitle": "أنشئ حسابك",
  "auth.createSub":
    "البريد الإلكتروني وكلمة المرور فقط — ويمكنك التسوق في ثوانٍ.",
  "auth.resetTitle": "إعادة تعيين كلمة المرور",
  "auth.resetSub": "سنرسل لك رابطًا بالبريد الإلكتروني.",
  "auth.email": "البريد الإلكتروني",
  "auth.password": "كلمة المرور",
  "auth.passwordHint": "6 أحرف على الأقل",
  "auth.yourPassword": "كلمة المرور الخاصة بك",
  "auth.forgot": "هل نسيت كلمة المرور؟",
  "auth.backToSignIn": "العودة إلى تسجيل الدخول",
  "auth.keepBrowsing": "متابعة التصفح",
  "auth.sendReset": "إرسال الرابط",
  "auth.creating": "جاري إنشاء حسابك...",
  "auth.signingIn": "جاري تسجيل الدخول...",
  "auth.sending": "جاري إرسال الرابط...",
  "auth.noPhoneNeeded":
    "لا حاجة لرقم هاتف للتسجيل. نطلبه فقط عند أول طلب أو عند فتح متجر.",
  "money.settlesInNaira": "الدفع بالنيرة ({amount})",
  "money.approxNote": "التحويل للاسترشاد فقط. الدفع يتم بالنيرة النيجيرية.",
  "settings.language": "اللغة",
  "settings.currency": "العملة",
  "settings.regionTitle": "اللغة والعملة"
}

const sw: Partial<Record<TranslationKey, string>> = {
  "nav.home": "Mwanzo",
  "nav.search": "Tafuta",
  "nav.orders": "Oda",
  "nav.profile": "Wasifu",
  "nav.signIn": "Ingia",
  "nav.createAccount": "Fungua akaunti",
  "nav.startSelling": "Anza kuuza",
  "nav.myStore": "Duka langu",
  "home.generalTab": "Kwa jumla",
  "home.vendorsTab": "Tafuta maduka",
  "home.searchProducts": "Tafuta bidhaa yoyote au maelezo",
  "home.searchVendors": "Tafuta jina la duka au kategoria",
  "home.browseCopy": "Vinjari bidhaa mpya kutoka maduka yanayofanya kazi.",
  "home.vendorCopy": "Tafuta kwa jina la duka, kategoria na jiji.",
  "home.shopByStyle": "Nunua kwa mtindo",
  "home.seeAll": "Ona zote",
  "product.addToCart": "Ongeza kwenye kikapu",
  "product.outOfStock": "Imeisha",
  "product.inStock": "Ipo",
  "product.share": "Shiriki bidhaa hii",
  "product.noPhoto": "Hakuna picha",
  "cart.title": "Kikapu chako",
  "cart.placeOrder": "Agiza",
  "cart.placing": "Inatuma oda...",
  "cart.oneVendor": "Kikapu kimoja hubeba duka moja kwa wakati.",
  "auth.welcomeBack": "Karibu tena",
  "auth.welcomeBackSub": "Kikapu, oda na maduka yako yaliyohifadhiwa yanakusubiri.",
  "auth.createTitle": "Fungua akaunti yako",
  "auth.createSub": "Barua pepe na nenosiri. Ni hivyo — unaweza kununua sasa.",
  "auth.resetTitle": "Weka nenosiri jipya",
  "auth.resetSub": "Tutakutumia kiungo kwa barua pepe.",
  "auth.email": "Barua pepe",
  "auth.password": "Nenosiri",
  "auth.passwordHint": "Herufi 6 au zaidi",
  "auth.yourPassword": "Nenosiri lako",
  "auth.forgot": "Umesahau nenosiri?",
  "auth.backToSignIn": "Rudi kuingia",
  "auth.keepBrowsing": "Endelea kuvinjari",
  "auth.sendReset": "Tuma kiungo",
  "auth.creating": "Inafungua akaunti yako...",
  "auth.signingIn": "Inakuingiza...",
  "auth.sending": "Inatuma kiungo...",
  "auth.noPhoneNeeded":
    "Hakuna namba ya simu inayohitajika kujiunga. Tunaiomba tu unapoagiza kwa mara ya kwanza au unapofungua duka.",
  "money.settlesInNaira": "Inatozwa kwa naira ({amount})",
  "money.approxNote": "Imebadilishwa kwa kumbukumbu. Malipo ni kwa naira.",
  "settings.language": "Lugha",
  "settings.currency": "Sarafu",
  "settings.regionTitle": "Lugha na sarafu"
}

const hi: Partial<Record<TranslationKey, string>> = {
  "nav.home": "होम",
  "nav.search": "खोजें",
  "nav.orders": "ऑर्डर",
  "nav.profile": "प्रोफ़ाइल",
  "nav.signIn": "साइन इन",
  "nav.createAccount": "खाता बनाएं",
  "nav.startSelling": "बेचना शुरू करें",
  "nav.myStore": "मेरी दुकान",
  "home.generalTab": "सामान्य",
  "home.vendorsTab": "दुकानें खोजें",
  "home.searchProducts": "कोई भी प्रोडक्ट या विवरण खोजें",
  "home.searchVendors": "दुकान का नाम या श्रेणी खोजें",
  "home.browseCopy": "सक्रिय दुकानों के नए प्रोडक्ट देखें।",
  "home.vendorCopy": "दुकान के नाम, श्रेणी और शहर से खोजें।",
  "home.shopByStyle": "स्टाइल से खरीदें",
  "home.seeAll": "सभी देखें",
  "product.addToCart": "कार्ट में डालें",
  "product.outOfStock": "स्टॉक में नहीं",
  "product.inStock": "स्टॉक में",
  "product.share": "यह प्रोडक्ट शेयर करें",
  "product.noPhoto": "कोई फ़ोटो नहीं",
  "cart.title": "आपका कार्ट",
  "cart.placeOrder": "ऑर्डर करें",
  "cart.placing": "ऑर्डर हो रहा है...",
  "cart.oneVendor": "एक कार्ट में एक समय पर एक ही दुकान रहती है।",
  "auth.welcomeBack": "वापस स्वागत है",
  "auth.welcomeBackSub": "आपका कार्ट, ऑर्डर और सेव की गई दुकानें इंतज़ार कर रही हैं।",
  "auth.createTitle": "अपना खाता बनाएं",
  "auth.createSub": "ईमेल और पासवर्ड, बस इतना ही — सेकंडों में खरीदारी करें।",
  "auth.resetTitle": "पासवर्ड रीसेट करें",
  "auth.resetSub": "हम आपको ईमेल पर एक लिंक भेजेंगे।",
  "auth.email": "ईमेल पता",
  "auth.password": "पासवर्ड",
  "auth.passwordHint": "कम से कम 6 अक्षर",
  "auth.yourPassword": "आपका पासवर्ड",
  "auth.forgot": "पासवर्ड भूल गए?",
  "auth.backToSignIn": "साइन इन पर वापस",
  "auth.keepBrowsing": "देखना जारी रखें",
  "auth.sendReset": "लिंक भेजें",
  "auth.creating": "आपका खाता बन रहा है...",
  "auth.signingIn": "साइन इन हो रहा है...",
  "auth.sending": "लिंक भेजा जा रहा है...",
  "auth.noPhoneNeeded":
    "जुड़ने के लिए फ़ोन नंबर ज़रूरी नहीं। हम इसे पहले ऑर्डर या दुकान खोलने पर ही मांगते हैं।",
  "money.settlesInNaira": "नाइरा में शुल्क ({amount})",
  "money.approxNote": "संदर्भ के लिए बदला गया। भुगतान नाइजीरियाई नाइरा में होता है।",
  "settings.language": "भाषा",
  "settings.currency": "मुद्रा",
  "settings.regionTitle": "भाषा और मुद्रा"
}

const zh: Partial<Record<TranslationKey, string>> = {
  "nav.home": "首页",
  "nav.search": "搜索",
  "nav.orders": "订单",
  "nav.profile": "我的",
  "nav.signIn": "登录",
  "nav.createAccount": "注册",
  "nav.startSelling": "开店",
  "nav.myStore": "我的店铺",
  "home.generalTab": "全部",
  "home.vendorsTab": "查找店铺",
  "home.searchProducts": "搜索商品名称或描述",
  "home.searchVendors": "搜索店铺名称或分类",
  "home.browseCopy": "浏览活跃店铺最新上架的商品。",
  "home.vendorCopy": "按店铺名称、分类和城市搜索。",
  "home.shopByStyle": "按风格选购",
  "home.seeAll": "查看全部",
  "product.addToCart": "加入购物车",
  "product.outOfStock": "已售罄",
  "product.inStock": "有货",
  "product.share": "分享此商品",
  "product.noPhoto": "暂无图片",
  "cart.title": "购物车",
  "cart.placeOrder": "提交订单",
  "cart.placing": "正在提交订单...",
  "cart.oneVendor": "一个购物车一次只能包含一家店铺。",
  "auth.welcomeBack": "欢迎回来",
  "auth.welcomeBackSub": "您的购物车、订单和收藏店铺都在等您。",
  "auth.createTitle": "创建账户",
  "auth.createSub": "只需邮箱和密码，几秒即可开始购物。",
  "auth.resetTitle": "重置密码",
  "auth.resetSub": "我们会通过邮件发送重置链接。",
  "auth.email": "邮箱地址",
  "auth.password": "密码",
  "auth.passwordHint": "至少 6 个字符",
  "auth.yourPassword": "您的密码",
  "auth.forgot": "忘记密码？",
  "auth.backToSignIn": "返回登录",
  "auth.keepBrowsing": "继续浏览",
  "auth.sendReset": "发送链接",
  "auth.creating": "正在创建账户...",
  "auth.signingIn": "正在登录...",
  "auth.sending": "正在发送链接...",
  "auth.noPhoneNeeded":
    "注册无需手机号。仅在您首次下单或开店时才需要填写。",
  "money.settlesInNaira": "以奈拉结算（{amount}）",
  "money.approxNote": "换算仅供参考，实际以尼日利亚奈拉支付。",
  "settings.language": "语言",
  "settings.currency": "货币",
  "settings.regionTitle": "语言与货币"
}

const DICTIONARIES: Record<string, Partial<Record<TranslationKey, string>>> = {
  en,
  fr,
  es,
  pt,
  ar,
  sw,
  hi,
  zh
}

/**
 * Looks up a key, falling back to English, then to the key itself so a missing
 * string is obvious in development instead of rendering as blank.
 * Supports {placeholder} substitution.
 */
export function translate(
  language: string,
  key: TranslationKey,
  values?: Record<string, string | number>
) {
  const dictionary = DICTIONARIES[language] ?? {}
  let text = dictionary[key] ?? en[key] ?? key

  if (values) {
    for (const [name, value] of Object.entries(values)) {
      text = text.replace(`{${name}}`, String(value))
    }
  }

  return text
}

/** Maps a browser language tag ("pt-BR", "zh-Hans-CN") to a dictionary. */
export function resolveLanguage(localeTag?: string) {
  const primary = localeTag?.split("-")[0]?.toLowerCase()
  return primary && SUPPORTED_LANGUAGES.has(primary) ? primary : "en"
}
