const CategoryRoute = require("./categoryRoute")
const SubCategoryRoute = require("./subCategoryRoute")
const BrandRoute = require("./brandRoute")
const ProductRoute = require("./productRoute")
const UserRoute = require("./userRoute")
const AuthRoute = require("./authRoute")
const ReviewRoute = require("./reviewRoute")
const WishlistRoute = require("./wishlistRoute");
const AddressRoute = require("./addressRoute");
const CouponRoute = require('./couponRoute');
const CartRoute = require('./cartRoute');
const OrderRoute = require('./orderRoute');
const llmSearchRoute = require('./llmSearchRoute');
const ContactUsRoute = require('./contactUsRoute');






// mount routes
const mountRoutes = (app) => {
app.use('/api/mazen/categories', CategoryRoute); 
app.use('/api/mazen/subcategories', SubCategoryRoute);
app.use('/api/mazen/brand', BrandRoute);
app.use('/api/mazen/products', ProductRoute);
app.use('/api/mazen/users', UserRoute);
app.use('/api/mazen/auth', AuthRoute);
app.use('/api/mazen/reviews', ReviewRoute);
app.use('/api/mazen/wishlist', WishlistRoute);
app.use('/api/mazen/address', AddressRoute);
app.use('/api/mazen/phone', phoneOtpRoute);
app.use('/api/mazen/coupon', CouponRoute);
app.use('/api/mazen/cart', CartRoute);
app.use('/api/mazen/orders', OrderRoute);
app.use('/api/mazen/llm-search', llmSearchRoute);
app.use('/api/mazen/contactUs', ContactUsRoute);
app.get('/api/mazen/health-check', (req,res) => {res.status(200).json({ status: 'ok' });});
};

module.exports = mountRoutes;
