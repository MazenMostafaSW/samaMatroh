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
app.use('/api/v1/categories', CategoryRoute); 
app.use('/api/v1/subcategories', SubCategoryRoute);
app.use('/api/v1/brand', BrandRoute);
app.use('/api/v1/products', ProductRoute);
app.use('/api/v1/users', UserRoute);
app.use('/api/v1/auth', AuthRoute);
app.use('/api/v1/reviews', ReviewRoute);
app.use('/api/v1/wishlist', WishlistRoute);
app.use('/api/v1/address', AddressRoute);
app.use('/api/auth/phone', phoneOtpRoute);
app.use('/api/v1/coupon', CouponRoute);
app.use('/api/v1/cart', CartRoute);
app.use('/api/v1/orders', OrderRoute);
app.use('/api/v1/llm-search', llmSearchRoute);
app.use('/api/v1/contactUs', ContactUsRoute);
};

module.exports = mountRoutes;
