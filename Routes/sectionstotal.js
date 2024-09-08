const mongoose = require('mongoose');
const Exam = require('../Schema/events'); // Assuming Exam is your model
const ScoreBoard = require('../Schema/scoreboard'); // Assuming ScoreBoard is your model
const User = require("../Schema/user");
const Scoring = require("../Schema/scores");

exports.sectionstotal = async (req, res) => {
    const { examID } = req.params;
    
    // Fetch the exam details
    var exam = await Exam.findOne({ _id: examID });
    if (!exam) {
        return res.json({ status: "Exam not found" });
    }

    var sections = exam?.sections;
    var department = exam?.department;

    // Fetch users based on department
    var users = await User.aggregate([
        { $match: { department: { $in: department } } },
        {
            $addFields: {
                collegeInfo: { $toObjectId: "$college" },
                departmentInfo: { $toObjectId: "$department" }
            },
        },
        {
            $lookup: {
                from: "colleges",
                localField: "collegeInfo",
                foreignField: "_id",
                as: "collegeInfo"
            },
        },
        {
            $lookup: {
                from: "departments",
                localField: "departmentInfo",
                foreignField: "_id",
                as: "departmentInfo"
            },
        },
        { $unwind: "$departmentInfo" },
        { $unwind: "$collegeInfo" },
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

    var student = [];
    var noa = 0;
    var nou = 0;

    // Store section scores for aggregation
    var sectionScores = {};

    for (let user of users) {
        let scores = await Scoring.find({ studentid: user?._id, sectionid: { $in: sections } });

        if (scores.length > 0) {
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
                score: scores
            });
            noa++;

            scores.forEach(score => {
                const sectionId = score.sectionid.toString();
                if (!sectionScores[sectionId]) {
                    sectionScores[sectionId] = {
                        sectionid: sectionId,
                        sectionname: score.category,
                        totalpoints: 0,
                        totaloverpoints: 0
                    };
                }
                sectionScores[sectionId].totalpoints += score.points;
                sectionScores[sectionId].totaloverpoints += score.overPoint;
            });
        } else {
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
                status: "unattend"
            });
            nou++;
        }
    }

    // Convert sectionScores to an array
    const aggregatedSectionScores = Object.values(sectionScores);

    return res.json({
        student: student,
        noOfAttend: noa,
        noOfUnattend: nou,
        sections: aggregatedSectionScores
    });
};
exports.sectotal = async (req, res) => {
    const { examID } = req.params;

    // Fetch the exam details
    const exam = await Exam.findOne({ _id: examID });
    if (!exam) {
        return res.json({ status: "Exam not found" });
    }

    const sections = exam.sections;

    // Initialize section scores
    let sectionScores = {};

    // Fetch scores for the given sections
    const scores = await Scoring.find({ sectionid: { $in: sections } });

    scores.forEach(score => {
        const sectionId = score.sectionid.toString();
        if (!sectionScores[sectionId]) {
            sectionScores[sectionId] = {
                sectionid: sectionId,
                sectionname: score.category,  // Assuming 'category' refers to section name
                totalpoints: 0,
                totaloverpoints: 0
            };
        }
        sectionScores[sectionId].totalpoints += score.points;
        sectionScores[sectionId].totaloverpoints += score.overPoint;
    });

    // Convert sectionScores to an array
    const aggregatedSectionScores = Object.values(sectionScores);

    // Return the aggregated section scores
    return res.json({
        sections: aggregatedSectionScores
    });
};
