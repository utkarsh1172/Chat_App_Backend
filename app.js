const express = require("express");
const app = express();
const mongoose = require("mongoose");
// app.use(express.json());
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const http = require("http");
const { Server } = require("socket.io");

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
const mongoUrl =
  "mongodb+srv://utkarsh1172:admin@cluster0.zpbhjep.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const JWT_SECRET =
  "hvdvay6ert72839289()aiyg8t87qt72393293883uhefiuh78ttq3ifi78272jdsds039[]]pou89ywe";
mongoose
  .connect(mongoUrl)
  .then(() => {
    console.log("Database Connected");
  })
  .catch((e) => {
    console.log(e);
  });
require("./UserDetails");
require("./Message")
const User = mongoose.model("UserCred");
const Message = mongoose.model("Message")

app.get("/", (req, res) => {
  res.send({ status: "Started" });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

let onlineUsers = {};     // userId => socket.id
let socketToUser = {};    // socket.id => userId

io.on("connection", (socket) => {
  console.log("✅ Connected:", socket.id);

  // User joins with userId
  socket.on("user_connected", (userId) => {
    if (!userId) return;
    onlineUsers[userId] = socket.id;
    socketToUser[socket.id] = userId;
    console.log(`👤 User ${userId} connected`);
  });

  // Send message and store in DB
  socket.on("send_message", async ({ senderId, receiverId, message }) => {
    try {
      const newMessage = new Message({
        senderId,
        receiverId,
        text: message,
        timestamp: new Date(),
      });
      await newMessage.save();

      const targetSocket = onlineUsers[receiverId];
      if (targetSocket) {
        io.to(targetSocket).emit("receive_message", {
          senderId,
          message,
          timestamp: newMessage.timestamp,
        });
      }

      console.log(`📩 Message sent from ${senderId} to ${receiverId}`);
    } catch (err) {
      console.error("❌ Error saving message:", err);
    }
  });

  socket.on("typing", ({ to }) => {
    const targetSocket = onlineUsers[to];
    if (targetSocket) {
      io.to(targetSocket).emit("user_typing");
    }
  });

  socket.on("disconnect", () => {
    const userId = socketToUser[socket.id];
    if (userId) {
      delete onlineUsers[userId];
      delete socketToUser[socket.id];
      console.log(`❌ User ${userId} disconnected`);
    } else {
      console.log(`❌ Socket ${socket.id} disconnected`);
    }
  });
});

app.post("/register", async (req, res) => {
  const { name, email, mobile, password, userType } = req.body;
  console.log(req.body);

  const oldUser = await User.findOne({ email: email });

  if (oldUser) {
    return res.send({ data: "User already exists!!" });
  }
  const encryptedPassword = await bcrypt.hash(password, 10);

  try {
    await User.create({
      name: name,
      email: email,
      mobile:mobile,
      password: encryptedPassword,
    });
    res.send({ status: "ok", data: "User Created" });
  } catch (error) {
    res.send({ status: "error", data: error });
  }
});

app.post("/login-user", async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  const oldUser = await User.findOne({ email: email });

  if (!oldUser) {
    return res.send({ data: "User doesn't exists!!" });
  }

  if (await bcrypt.compare(password, oldUser.password)) {
    const token = jwt.sign({ email: oldUser.email }, JWT_SECRET);
    console.log(token);
    if (res.status(201)) {
      return res.send({ status: "ok", data: token, user: {
    _id: oldUser._id,
    name: oldUser.name,
    email: oldUser.email,
    userType: oldUser.userType,
    mobile: oldUser.mobile
  }});
    } else {
      return res.send({ error: "error" });
    }
  }
});

app.post("/userdata", async (req, res) => {
  const { token } = req.body;
  try {
    const user = jwt.verify(token, JWT_SECRET);
    const useremail = user.email;

    User.findOne({ email: useremail }).then((data) => {
      return res.send({ status: "Ok", data: data });
    });
  } catch (error) {
    return res.send({ error: error });
  }
});
app.get("/get-all-user", async (req, res) => {
  try {
    const data = await User.find({});
    res.send({ status: "Ok", data: data });
  } catch (error) {
    return res.send({ error: error });
  }
});


app.listen(5001,  () => {
  console.log("Server running at 0.0.0.0:5001");
});