const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");

app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use("/static", express.static(__dirname + "/public"));
require("dotenv").config();
app.use(
  session({
    secret: process.env.SECRET,
    name: process.env.NAME,
    saveUninitialized: false,
  })
);

//database connections
//mongoose.connect("mongodb://localhost:27017/MasterConceptDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.connect(
  "mongodb+srv://naksh160201:" +
    process.env.DB_PASS +
    "@nakshatracluster.qrbdl.mongodb.net/MasterConceptDB?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

mongoose.set("useCreateIndex", true);

//user schema
const usersSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
});

//user marks schema
const marksSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  tests: { type: Array, default: [] },
  marks: { type: Array, default: [] },
  done: { type: Array, default: [] },
});

//roadmap schema
// const roadmapsSchema = new mongoose.Schema({
//     topic: { type: String, required: true },
//     //subtopic: { type: String },
//     tid: { type: String, required: true, unique: true },
// });
//content schema
const contentSchema = new mongoose.Schema({
  tid: { type: String, required: true, unique: true },
  topic: { type: String, required: true },
  intro: { type: String },
  notes: { type: String },
  videos: { type: Array, default: [] },
});

const User = new mongoose.model("User", usersSchema);
const Ele = new mongoose.model("Ele", contentSchema);
const Twe = new mongoose.model("Twe", contentSchema);
const Each = new mongoose.model("Each", marksSchema);

app.get("/11th", (req, res) => {
  Ele.find({}, { topic: 1, tid: 1, _id: 0 }, function (err, found) {
    if (!err && found) res.render("ele", { data: found });
    else res.send("Error occured");
  }).sort({ tid: 1 });
});
app.get("/12th", (req, res) => {
  Twe.find({}, { topic: 1, tid: 1, _id: 0 }, function (err, found) {
    if (!err && found) res.render("twe", { data: found });
    else res.send("Error occured");
  }).sort({ tid: 1 });
});
app.get("/ele/:xy", (req, res) => {
  // console.log(req.params.tidi)
  Ele.findOne({ tid: req.params.xy }, function (err, found) {
    if (!err && found) res.render("chp1", { data: found });
    else res.send("Error occured");
    // console.log(found);
    // console.log(req.params.tidi)
    //    res.send(found[0].tid)
  });
});
app.get("/twe/:xy", (req, res) => {
  // console.log(req.params.tidi)
  Twe.findOne({ tid: req.params.xy }, function (err, found) {
    if (!err && found) res.render("chp1", { data: found });
    else res.send("Error occured");
    // console.log(found);
    // console.log(req.params.tidi)
    //    res.send(found[0].tid)
  });
});

//nodemailer transporter
var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MS_U,
    pass: process.env.MS_P,
  },
});

//routes

app.get("/", (req, res) => {
  if (!req.session.loggedIn) {
    res.render("logins/index");
  } else {
    res.redirect("/my");
  }
});
// app.get('/signup', (req, res) => {
//     res.render('signup');
// });

app.post("/authenticate", (req, res) => {
  User.findOne({ email: req.body.username }, function (err, found) {
    if (err) {
      console.log(err);
      res.send("Error occured");
    } else {
      if (found) {
        if (found.password === req.body.password) {
          req.session.loggedIn = true;
          req.session.username = req.body.username;
          req.session.name = found.name;
          res.redirect("/my");
        } else {
          res.send("Oh ! you forgot your password ");
        }
      } else {
        res.send("Oh snap ! go get yourself registered ");
      }
    }
  });
});

app.get("/forgot", (req, res) => {
  res.render("forgot");
});

app.get("/my", (req, res) => {
  if (req.session.loggedIn) {
    var avg = 0;
    var nt = 0;
    var mx = 0;
    var mn = 0;
    var cc = 0;
    var tot = 0;
    User.findOne({ email: req.session.username }, function (err, found) {
      if (err) {
        console.log(err);
        res.send("Error occured");
      } else {
        Each.findOne({ email: req.session.username }, function (err, found1) {
          if (!err && found1) {
            const arr = found1.marks;
            console.log(arr);
            mn = Math.min(...arr);
            mx = Math.max(...arr);
            console.log(mn);
            console.log(mx);
            var total = 0;
            for (var i = 0; i < arr.length; i++) {
              total += arr[i] / arr.length;
            }
            avg = total;
            nt = found1.tests.length;
            cc = found1.done.length;
            Ele.count({}, function (err, result) {
              if (err) {
                console.log(err);
              } else {
                tot += result;
              }
            });
            Twe.count({}, function (err, result) {
              if (err) {
                console.log(err);
              } else {
                tot += result;
                if (tot != 0) cc = (cc / tot) * 100;
                if (mx === Infinity || mx === -Infinity) mx = "NA";
                if (mn === Infinity || mn === -Infinity) mn = "NA";
                res.render("dashboard", {
                  mx: mx,
                  cc: cc,
                  mn: mn,
                  avg: avg,
                  nt: nt,
                  name: req.session.name,
                  uname: req.session.username,
                });
              }
            });
          } else {
            res.render("dashboard", {
              mx: 0,
              cc: 0,
              mn: 0,
              avg: 0,
              nt: 0,
              name: req.session.name,
              uname: req.session.username,
            });
          }
        });
      }
    });
  } else {
    res.redirect("/");
  }
});
app.post("/removeTest/:idx", (req, res) => {
  Each.findOne({ email: req.session.username }, function (err, found1) {
    if (!err && found1) {
      found1.marks.splice(req.params.idx, 1);
      found1.tests.splice(req.params.idx, 1);
      found1.save(function (err) {
        if (!err) {
          console.log("saved success");
          res.redirect("/t");
        } else {
          res.send("try later ");
        }
      });

      //             var uns="marks."+req.params.idx;
      //             Each.update({},{$unset:{uns:1}});
      // Each.update({email: req.session.username},{$pull:{"marks":null}});
      // var uns1="tests."+req.params.idx;
      //             Each.update({},{$unset:{uns1:1}});
      // Each.update({email: req.session.username},{$pull:{"tests":null}});

      // const marksy=found1.marks;
      // const testsy=found1.tests;
      // res.render('tables',{marks:marksy,tets:testsy});
    } else {
      res.send("snap it");
    }
  });
});

app.post("/addTest", (req, res) => {
  Each.findOne({ email: req.session.username }, function (err, found1) {
    if (!err && found1) {
      var percentage = ((req.body.mo / req.body.mm) * 100).toFixed(2);
      found1.tests.push(req.body.tname);
      found1.marks.push(percentage);
      found1.save(function (err) {
        if (!err) {
          console.log("saved success");
          res.redirect("/t");
        } else {
          res.send("try later ");
        }
      });
    } else if (!err && !found1) {
      var percentage = ((req.body.mo / req.body.mm) * 100).toFixed(2);
      const rec = new Each({
        email: req.session.username,
        marks: [percentage],
        tests: [req.body.tname],
      });
      rec.save(function (err) {
        if (!err) {
          res.redirect("/t");
        } else {
          res.send("try later ");
        }
      });
    }
  });
});
app.get("/t", (req, res) => {
  Each.findOne({ email: req.session.username }, function (err, found1) {
    if (!err && found1) {
      const marksy = found1.marks;
      const testsy = found1.tests;

      res.render("tables", {
        marks: marksy,
        tets: testsy,
        name: req.session.name,
        uname: req.session.username,
      });
    } else {
      res.render("tables", {
        marks: [],
        tets: [],
        name: req.session.name,
        uname: req.session.username,
      });
    }
  });
  // var marksy=[10,10.5,5,50,8];
  //     var testsy=['a','b','c','d','e'];

  //         res.render('tables',{marks:marksy,tets:testsy});
});
app.post("/reset", (req, res) => {
  User.findOne({ email: req.body.username }, function (err, found) {
    if (err) {
      console.log(err);
      res.send("Error occured");
    } else {
      if (found) {
        found.resetPasswordToken = String(otpGenerator.generate(6));
        found.resetPasswordExpires = Date.now() + 300000; // 5 min in ms
        found.save(function (err) {
          if (!err) {
            console.log("saved success");
          } else {
            res.send("try later ");
          }
        });

        var mailOptions = {
          from: "masterconcepts.no.reply@gmail.com",
          to: found.email,
          subject: "Password reset for masterconcepts.com",
          text:
            "Someone requested to change the password for masterconcepts.com account with username: " +
            found.email +
            " .If it wasnt you then dont worry ,your password will remain unchanged. Dont share this OTP with anyone . This OTP will remain valid for 5 minutes OTP: " +
            found.resetPasswordToken,
        };

        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log(error);
          } else {
            req.session.forgotuname = found.email;
            console.log("Email sent: ");
            res.render("checkotp");
          }
        });
      } else {
        res.send("not registered");
      }
    }
  });
});

app.post("/checkotp", (req, res) => {
  User.findOne({ email: req.session.forgotuname }, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      if (found) {
        if (
          found.resetPasswordToken === req.body.otp &&
          found.resetPasswordExpires > Date.now()
        ) {
          found.password = req.body.passw;

          found.save(function (err) {
            if (!err) {
              console.log("saved success");

              var mailOptions = {
                from: "masterconcepts.no.reply@gmail.com",
                to: req.session.forgotuname,
                subject: "Password changed successfully",
                text: "Your password was changed successfully.",
              };

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  req.session.forgotuname = found.email;
                  console.log("Email sent: " + info.response);
                  res.render("checkotp");
                }
              });
              res.send("success");
            } else {
              res.send("wrong otp");
            }
          });
        } else {
          res.send("smthng");
        }
      } else {
        res.send("no such user");
      }
    }
  });
});

app.get("/logout", (req, res) => {
  //req.session.destroy((err)=>{})
  req.session.loggedIn = false;
  //res.send('Thank you! Visit again')
  res.redirect("/");
});
// app.get('/adder',(req, res)=>{
//     const ele = new Ele({
//         topic: "algebra",
//         subtopic:"operations",
//         tid: "2",
//     });
//     ele.save();

// });
app.get("/mydashboard", (req, res) => {
  Each.findOne({ email: req.session.username }, function (err, found) {
    if (err) {
      console.log(err);
    } else {
      var marksy = [10, 10.5, 5, 50, 8];
      var testsy = ["a", "b", "c", "d", "e"];

      res.render("dashboard", { marks: marksy, tets: testsy });
    }
  });
});
app.get("/roadmap", (req, res) => {
  Ele.find(function (err, found) {
    if (err) console.log(err);
    else {
      //findings.push(found);
      console.log(found);
      res.render("courses", { rd: found });
    }
  });
});

app.post("/SignUp", (req, res) => {
  User.findOne({ email: req.body.email }, function (err, found) {
    if (err) {
      console.log(err);
      res.send("Error occured");
    } else {
      if (!found) {
        if (req.body.psw === req.body.pswrepeat) {
          const user = new User({
            name: req.body.name,
            gender: req.body.gender,
            email: req.body.email,
            password: req.body.psw,
          });
          user.save(function (err) {
            if (!err) {
              var mailOptions = {
                from: "masterconcepts.no.reply@gmail.com",
                to: req.body.email,
                subject: "Successful registration with masterconcepts.com",
                text:
                  "Congrats! you are successfully registered with username " +
                  req.body.email,
              };

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  console.log(error);
                } else {
                  console.log("Email sent: " + info.response);
                }
              });
              const eachy = new Each({
                email: req.body.email,
              });
              eachy.save(function (err) {
                if (err) {
                  res.send("error occured");
                } else res.render("signup success");
              });
            } else {
              res.render("signup fail");
            }
          });
        } else {
          res.send("passwords mismatch");
        }
      } else {
        res.send("username taken");
      }
    }
  });
});

//server listening
app.listen(process.env.PORT || 3000, function () {
  console.log("Started");
});
