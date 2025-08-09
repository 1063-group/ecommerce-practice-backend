// imports
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const dotenv = require("dotenv");
const { dbConnection } = require("./config/db");
const userRouter = require("./routes/user.routes");
// config
dotenv.config();

// settings
const app = express();

// Connection to Database
dbConnection()

// middlewares
app.use(morgan("dev"));
app.use(cors());
app.use(express.json());

// routes
// app.use(require("./routes/index"));
app.use("/api/v1/auth", userRouter);

// starting the server
app.listen(process.env.PORT, () => {
    console.log(`Server on port ${process.env.PORT}`);
});


// ecommerce - электронный коммерция - интернет магазин
// CRUD - create, read, update, delete