const bcrypt = require("bcrypt");
const SuperAdmin = require("../Schema/superadmin");
const College = require("../Schema/college");
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

exports.user = async (req, res) => {
  try {
    const { userID } = req.params;
    const userOld = await SuperAdmin.findOne({ _id: userID }, { password: 0 });
    if (userOld) {
      const college = await College.findOne({ _id: userOld.college });
      if (college) {
        return res.json({
          username: userOld.username,
          name: userOld.name,
          image: userOld.image,
          college: college.college,
          email: userOld.email,
        });
      } else {
        return res.json({ error: "College not found" });
      }
    } else {
      return res.json({ user: "Not found" });
    }
  } catch (error) {
    return res.json({ error: error.message });
  }
};

exports.personal = async (req, res) => {
  try {
    const { userID } = req.params;
    const userOld = await SuperAdmin.findOne({ _id: userID });
    if (!userOld) {
      return res.json({ user: "Not found" });
    } else {
      const { name, email, rollno, imageData } = req.body;
      const UpdateUser = {
        name: name || userOld.name,
        username: userOld.username,
        email: email || userOld.email,
        rollno: rollno || userOld.rollno,
        image: imageData || userOld.image
      };

      await SuperAdmin.findOneAndUpdate({ _id: userID }, UpdateUser, { new: true });
      return res.json({ status: "Updated" });
    }
  } catch (error) {
    return res.json({ status: "Error", error: error.message });
  }
};

exports.security = async (req, res) => {
  try {
    const { userID } = req.params;
    const userOld = await SuperAdmin.findOne({ _id: userID });
    if (!userOld) {
      return res.json({ user: "Not found" });
    } else {
      const { oldpassword, password } = req.body;
      if (await bcrypt.compare(oldpassword, userOld.password)) {
        const encPassword = await bcrypt.hash(password, 5);
        await SuperAdmin.findOneAndUpdate(
          { _id: userID },
          { $set: { password: encPassword } },
          { new: true }
        );
        return res.json({ status: "Updated" });
      } else {
        return res.json({ status: "Incorrect password" });
      }
    }
  } catch (error) {
    return res.json({ status: "Error", error: error.message });
  }
};
