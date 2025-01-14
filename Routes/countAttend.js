const mongoose = require("mongoose")
const Scoreboard = require("../Schema/scoreboard")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const Performance = require("../Schema/performance")
const Ranking = require("../Schema/ranking")
const Scoring = require("../Schema/scores")
const User = require("../Schema/user")
const Exam = require("../Schema/events")

const SuperAdmin = require("../Schema/superadmin")
const jwt = require("jsonwebtoken")
const { section } = require("./edit")
const secret = process.env.secret || "SuperK3y";

async function profileID(token) {
    var tok = token.headers.authorization;
    var id;
    try {
        tok = tok.slice(7,tok.length)
        id = jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await SuperAdmin.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        return null;
    }
}

async function userprofileID(token) {
    var tok = token.headers.authorization;
    var id;
    try {
        tok = tok.slice(7,tok.length)
        id = jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await User.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        return null;
    }
}

exports.admin = async (req, res) => {
  const { examID } = req.params;
  var exam = await Exam.findOne({ _id: examID });
  if (!exam) {
      return res.json({ status: "Exam not found" });
  }

  var sections = exam?.sections;
  var department = exam?.department;

  var users = await User.aggregate([
      {
          $match: {
              department: { $in: department }
          }
      },
      {
          $addFields: {
              collegeInfo: {
                  $toObjectId: "$college",
              },
              departmentInfo: {
                  $toObjectId: "$department",
              },
          },
      },
      {
          $lookup: {
              from: "colleges",
              localField: "collegeInfo",
              foreignField: "_id",
              as: "collegeInfo",
          },
      },
      {
          $lookup: {
              from: "departments",
              localField: "departmentInfo",
              foreignField: "_id",
              as: "departmentInfo",
          },
      },
      {
          $unwind: "$departmentInfo",
      },
      {
          $unwind: "$collegeInfo",
      },
      {
          $project: {
              name: 1,
              _id: 1,
              username: 1,
              role: 1,
              rollno: 1,
              collegeID: "$college",
              departmentID: "$department",
              college: "$collegeInfo.college",
              department: "$departmentInfo.department",
              year: "$departmentInfo.year",
              semester: "$departmentInfo.semester",
              section: "$departmentInfo.section",
          },
      },
  ]);

  var student = new Array();
  var noa = 0;
  var nou = 0;

  for (let user of users) {
      let scores = await Scoring.find({ studentid: user?._id, sectionid: { $in: sections } });
      let totalPoints = 0;
      let totalMaxPoints = 0;
      let userSections = [];
      let sectionPercentages = [];

      // Track sections where the student didn't submit a score
      let skippedSections = new Set(sections.map(section => section.toString())); // Set of section IDs
      let attendedSections = new Set(); // Sections that the student attended

      if (scores.length > 0) {
          // Process each score submitted by the student
          for (let score of scores) {
              attendedSections.add(score.sectionid.toString()); // Mark section as attended
              totalPoints += score.points; // User's points in the section
              totalMaxPoints += score.overPoint; // Total points available in that section

              // Calculate percentage for this section
              let sectionPercentage = (score.points / score.overPoint) * 100;
              sectionPercentages.push(sectionPercentage);

              userSections.push({
                  sectionId: score.sectionid,
                  points: score.points,
                  overPoint: score.overPoint,
                  sectionPercentage: sectionPercentage.toFixed(2) + '%'
              });
          }
      }

      // Handle skipped sections
      sections.forEach(section => {
          if (!attendedSections.has(section.toString())) {
              // If section wasn't attended, consider it as 0%
              sectionPercentages.push(0); // Add 0% for skipped sections
              userSections.push({
                  sectionId: section,
                  points: 0,
                  overPoint: 0,
                  sectionPercentage: "0.00%"
              });
          }
      });

      // Calculate the overall percentage
      let overallPercentage = (sectionPercentages.reduce((acc, curr) => acc + curr, 0) / sections.length).toFixed(2);
      overallPercentage = overallPercentage + "%"; // Add percentage sign

      student.push({
          "_id": user._id,
          "name": user.name,
          "username": user.username,
          "role": user.role,
          "rollno": user.rollno,
          "collegeID": user.collegeID,
          "departmentID": user.departmentID,
          "college": user.college,
          "department": user.department,
          "year": user.year,
          "semester": user.semester,
          "section": user.section,
          status: "attended",
          score: scores,
          sections: userSections,
          overallPercentage: overallPercentage
      });
      noa++;
  }

  return res.json({ student: student, noOfAttend: noa, noOfUnattend: nou });
}


exports.superadmin = async (req, res) => {
  const { examID } = req.params;
  var exam = await Exam.findOne({ _id: examID });
  if (!exam) {
      return res.json({ status: "Exam not found" });
  }

  var sections = exam?.sections;
  var department = exam?.department;

  var users = await User.aggregate([
      {
          $match: {
              department: { $in: department }
          }
      },
      {
          $addFields: {
              collegeInfo: {
                  $toObjectId: "$college",
              },
              departmentInfo: {
                  $toObjectId: "$department",
              },
          },
      },
      {
          $lookup: {
              from: "colleges",
              localField: "collegeInfo",
              foreignField: "_id",
              as: "collegeInfo",
          },
      },
      {
          $lookup: {
              from: "departments",
              localField: "departmentInfo",
              foreignField: "_id",
              as: "departmentInfo",
          },
      },
      {
          $unwind: "$departmentInfo",
      },
      {
          $unwind: "$collegeInfo",
      },
      {
          $project: {
              name: 1,
              _id: 1,
              username: 1,
              role: 1,
              rollno: 1,
              collegeID: "$college",
              departmentID: "$department",
              college: "$collegeInfo.college",
              department: "$departmentInfo.department",
              year: "$departmentInfo.year",
              semester: "$departmentInfo.semester",
              section: "$departmentInfo.section",
          },
      },
  ]);

  var student = new Array();
  var noa = 0;
  var nou = 0;

  for (let user of users) {
      let scores = await Scoring.find({ studentid: user?._id, sectionid: { $in: sections } });
      let totalPoints = 0;
      let totalMaxPoints = 0;
      let userSections = [];
      let sectionPercentages = [];

      // Track sections where the student didn't submit a score
      let skippedSections = new Set(sections.map(section => section.toString())); // Set of section IDs
      let attendedSections = new Set(); // Sections that the student attended

      if (scores.length > 0) {
          // Process each score submitted by the student
          for (let score of scores) {
              attendedSections.add(score.sectionid.toString()); // Mark section as attended
              totalPoints += score.points; // User's points in the section
              totalMaxPoints += score.overPoint; // Total points available in that section

              // Calculate percentage for this section
              let sectionPercentage = (score.points / score.overPoint) * 100;
              sectionPercentages.push(sectionPercentage);

              userSections.push({
                  sectionId: score.sectionid,
                  points: score.points,
                  overPoint: score.overPoint,
                  sectionPercentage: sectionPercentage.toFixed(2) + '%'
              });
          }
      }

      // Handle skipped sections
      sections.forEach(section => {
          if (!attendedSections.has(section.toString())) {
              // If section wasn't attended, consider it as 0%
              sectionPercentages.push(0); // Add 0% for skipped sections
              userSections.push({
                  sectionId: section,
                  points: 0,
                  overPoint: 0,
                  sectionPercentage: "0.00%"
              });
          }
      });

      // Calculate the overall percentage
      let overallPercentage = (sectionPercentages.reduce((acc, curr) => acc + curr, 0) / sections.length).toFixed(2);
      overallPercentage = overallPercentage + "%"; // Add percentage sign

      student.push({
          "_id": user._id,
          "name": user.name,
          "username": user.username,
          "role": user.role,
          "rollno": user.rollno,
          "collegeID": user.collegeID,
          "departmentID": user.departmentID,
          "college": user.college,
          "department": user.department,
          "year": user.year,
          "semester": user.semester,
          "section": user.section,
          status: "attended",
          score: scores,
          sections: userSections,
          overallPercentage: overallPercentage
      });
      noa++;
  }

  return res.json({ student: student, noOfAttend: noa, noOfUnattend: nou });
}
