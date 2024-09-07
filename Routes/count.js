const User = require("../Schema/user");
const mongoose = require('mongoose');

const SuperAdmin = require("../Schema/superadmin");
const Admin = require("../Schema/admin");
const Meet = require("../Schema/meeting");
const Student = require('../Schema/user');
const College = require("../Schema/college")
const Department = require("../Schema/department")
const jwt = require("jsonwebtoken")
const secret = process.env.secret || "SuperK3y"
const Exam = require("../Schema/events")
const Event = require("../Schema/events")
const Section = require("../Schema/sections")
const Performance = require("../Schema/performance")
const Rank = require("../Schema/ranking")
const ScoreBoard = require("../Schema/scoreboard")
const Scoring = require("../Schema/scores")
const { getGraphData } = require('../Routes/graphData')

async function profileID(token) {
    var tok = token.headers.authorization;
    tok = tok.substring(7);
    var id;
    try {
        id = await jwt.verify(tok, secret);
    }
    catch(err) {
        id = null;
    }
    const user = await User.findOne({_id:id.id});
    if(user) {
        return user;
    }
    else {
        const superadmin = await SuperAdmin.findOne({_id:id.id});
        if(superadmin) {
            return superadmin
        }
        else {
            const admin = await Admin.findOne({_id:id.id});
            if(admin) {
                return admin
            }
            else null;
        }
    }
}



exports.count = async (req, res) => {
    try {
        const result = {
            superadmin: 0,
            admin: 0,
            student: 0,
            exams: 0,
            monthlyExamCounts: {}
        };

        const studentCount = await User.countDocuments({ role: 'student' });
        result.student = studentCount;

        const superadminCount = await SuperAdmin.countDocuments({});
        result.superadmin = superadminCount;

        const adminCount = await Admin.countDocuments({});
        result.admin = adminCount;

        const examCount = await Event.countDocuments({});
        result.exams = examCount;

        const monthlyCounts = await Event.aggregate([
            {
                $project: {
                    month: { $month: "$start" },
                    year: { $year: "$start" }
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        monthlyCounts.forEach(({ _id, count }) => {
            const monthKey = `${_id.year}-${_id.month.toString().padStart(2, '0')}`;
            result.monthlyExamCounts[monthKey] = count;
        });

        return res.json(result);

    } catch (err) {
        console.error("Error fetching counts:", err);
        return res.status(500).json({ status: "Something went wrong", error: err.message });
    }
};
exports.supercount = async (req, res) => {
    try {
        const result = {
            examCount: 0,
            studentCount: 0,
            totalScore: 0,
            monthlyExamCounts: {},
        };

        // Fetch the user to get the college ID
        const user = await profileID(req);
        console.log("User:", user);

        // Ensure user.college is an ObjectId type
        const collegeId = new mongoose.Types.ObjectId(user.college);

        // Count the number of exams for the user's college
        const examCount = await Exam.countDocuments({ college: collegeId });
        result.examCount = examCount;
        console.log("Exam Count:", examCount);

        const studentCount = await User.countDocuments({ college: user.college, role: 'student' });
        result.studentCount = studentCount;
        console.log("Student Count:", studentCount);

        const totalScoreResult = await ScoreBoard.aggregate([
            { $match: { college: user.college } },
            { $group: { _id: null, totalScore: { $sum: "$scores" } } }
        ]);
        result.totalScore = totalScoreResult.length ? totalScoreResult[0].totalScore : 0;
        console.log("Total Score:", result.totalScore);

        // Calculate the monthly exam counts using the `start` field and filter by college
        const monthlyCounts = await Event.aggregate([
            {
                $match: {
                    college: collegeId, // Ensure matching college ID
                    start: { $gte: new Date('2020-01-01') } // Ensure dates are within a reasonable range
                }
            },
            {
                $project: {
                    month: { $month: "$start" },
                    year: { $year: "$start" }
                }
            },
            {
                $group: {
                    _id: { year: "$year", month: "$month" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);

        console.log("Raw Monthly Counts:", monthlyCounts);

        // Process the monthly exam counts
        monthlyCounts.forEach(({ _id, count }) => {
            if (_id && _id.year && _id.month) {
                const monthKey = `${_id.year}-${_id.month.toString().padStart(2, '0')}`;
                result.monthlyExamCounts[monthKey] = count;
            }
        });

        console.log("Result:", result);

        return res.json(result);

    } catch (err) {
        console.error("Error fetching data:", err);
        return res.status(500).json({ status: "Something went wrong", error: err.message });
    }
};


