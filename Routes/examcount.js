const Scoreboard = require("../Schema/scoreboard")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const Performance = require("../Schema/performance")
const Ranking = require("../Schema/ranking")
const Scoring = require("../Schema/scores")
const User = require("../Schema/user")
const Exam = require("../Schema/events")
const Section = require("../Schema/sections")
const Timer = require("../Schema/examtimer.js");
const mongoose = require("mongoose");

const SuperAdmin = require("../Schema/superadmin")
const jwt = require("jsonwebtoken")
const { department } = require("./college")
const secret = process.env.secret || "SuperK3y";

exports.departmentStats = async (req, res) => {
    try {
        const { collegeId } = req.params;

        let stats = await User.aggregate([
            {
                $addFields: {
                    collegeID: {
                        $toObjectId: "$college",
                    },
                    departmentID: {
                        $toObjectId: "$department",
                    },
                },
            },
            {
                $match: {
                    collegeID: { $eq: new mongoose.Types.ObjectId(collegeId) }
                },
            },
            {
                $lookup: {
                    from: "colleges",
                    localField: "collegeID",
                    foreignField: "_id",
                    as: "college",
                },
            },
            {
                $lookup: {
                    from: "departments",
                    localField: "departmentID",
                    foreignField: "_id",
                    as: "department",
                },
            },
            {
                $unwind: "$college",
            },
            {
                $unwind: "$department",
            },
            {
                $lookup: {
                    from: "StudentScores",
                    localField: "_id",
                    foreignField: "studentid",
                    as: "record",
                },
            },
            {
                $unwind: {
                    path: "$record",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $unwind: {
                    path: "$record.exams",
                    preserveNullAndEmptyArrays: true,
                },
            },
            {
                $group: {
                    _id: {
                        departmentID: "$department._id",
                        departmentName: "$department.department",
                        collegeName: "$college.college",
                    },
                    studentCount: { $sum: 1 },
                    totalPoints: { $sum: "$record.exams.points" },
                    totalObtainPoints: { $sum: "$record.exams.obtainpoint" },
                },
            },
            {
                $project: {
                    departmentID: "$_id.departmentID",
                    departmentName: "$_id.departmentName",
                    collegeName: "$_id.collegeName",
                    studentCount: 1,
                    totalPoints: 1,
                    totalObtainPoints: 1,
                },
            },
        ]);

        return res.json({ stats: stats });
    } catch (err) {
        console.log("Error occurred:", err); // Log the error for debugging
        return res.status(500).json({ status: "Something went wrong", error: err.message });
    }
};


// exports.departmentcount = async (req, res) => {
//     try {
//         const examList = await Event.aggregate([
//             {
//                 $unwind: { 
//                     path: "$department",
//                     includeArrayIndex: "0",
//                     preserveNullAndEmptyArrays: true,
//                 },
//             },
//             {
//                 $addFields: {
//                     departmentID: {
//                         $toObjectId: "$department",
//                     },
//                 },
//             },
//             {
//                 $lookup: {
//                     from: "departments",
//                     localField: "departmentID",
//                     foreignField: "_id",
//                     as: "department",
//                 },
//             },
//             {
//                 $unwind: "$department",
//             },
//             {
//                 $lookup: {
//                     from: "colleges",
//                     localField: "college",
//                     foreignField: "_id",
//                     as: "college",
//                 },
//             },
//             {
//                 $unwind: "$college",
//             },
//             {
//                 $group: {
//                     _id: {
//                         department: "$department.department",
//                         college: "$college.college",
//                         year: "$department.year",
//                         semester: "$department.semester",
//                         section: "$department.section"
//                     },
//                     totalCount: { $sum: 1 },
//                     exams: {
//                         $push: {
//                             _id: "$_id",
//                             title: "$title",
//                             date: "$date",
//                             start: "$start",
//                             end: "$end",
//                             category: "$category",
//                             duration: "$duration",
//                             sections: "$sections",
//                             status: {
//                                 $cond: {
//                                     if: { $gt: ["$start", new Date()] },
//                                     then: "not started",
//                                     else: {
//                                         $cond: {
//                                             if: { $gt: ["$end", new Date()] },
//                                             then: "ongoing",
//                                             else: "ended",
//                                         },
//                                     },
//                                 },
//                             },
//                         },
//                     },
//                 },
//             },
//             {
//                 $project: {
//                     _id: 0,
//                     college: "$_id.college",
//                     department: "$_id.department",
//                     year: "$_id.year",
//                     semester: "$_id.semester",
//                     section: "$_id.section",
//                     totalCount: 1,
//                     exams: 1
//                 },
//             },
//         ]);

//         return res.json({ exams: examList });
//     } catch (er) {
//         console.log(er);
//         return res.json({ status: "Something went wrong" });
//     }
// };

