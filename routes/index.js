const ClientRoute = require("./clientRoute");
const BusSeatsRoute = require("./busSeatsRoute");
const RegimentsRoute = require("./regimentsRoute");
const ReservationsRoute = require("./reservationsRoute");
const UserRoute = require("./userRoute");
const AuthRoute = require("./authRoute");
const ApartmentsRoute = require("./apartmentsRoute");
const TransactionRoute = require("./transactionRoute");





// mount routes
const mountRoutes = (app) => {
app.use('/api/mazen/clients', ClientRoute); 
app.use('/api/mazen/busSeats', BusSeatsRoute);
app.use('/api/mazen/regiments', RegimentsRoute);
app.use('/api/mazen/reservation', ReservationsRoute);
app.use('/api/mazen/users', UserRoute);
app.use('/api/mazen/auth', AuthRoute);
app.use('/api/mazen/apartments', ApartmentsRoute);
app.use('/api/mazen/transactions', TransactionRoute);


app.get('/api/mazen/health-check', (req,res) => {res.status(200).json({ status: 'ok' });});
};

module.exports = mountRoutes;
