const Scoreboard = require("../Schema/scoreboard");
const College = require("../Schema/college");
const Department = require("../Schema/department");
const Performance = require("../Schema/performance");
const Ranking = require("../Schema/ranking");
const Scoring = require("../Schema/scores");
const User = require("../Schema/user");
const Exam = require("../Schema/events");
const Section = require("../Schema/sections");
const SuperAdmin = require("../Schema/superadmin");
const Admin = require("../Schema/admin"); // Assuming you have an Admin schema
const jwt = require("jsonwebtoken");
const secret = process.env.secret || "SuperK3y";

async function profileID(req) {
    const token = req.headers.authorization;
    if (!token) {
        return null;
    }

    try {
        const tok = token.slice(7);
        const id = jwt.verify(tok, secret);
        let user = await SuperAdmin.findOne({ _id: id.id });
        if (!user) {
            user = await Admin.findOne({ _id: id.id });
        }
        return user || null;
    } catch (err) {
        console.error("Error verifying token:", err);
        return null;
    }
}

exports.topTenScores = async (req, res) => {
    try {
        const user = await profileID(req);

        if (!user || user.role !== 'admin') {
            return res.status(401).json({ status: "Unauthorized" });
        }

        const topTenStudents = await Performance.aggregate([
            {
                $group: {
                    _id: "$studentid",
                    totalObtainPoints: { $sum: "$obtainpoint" },
                    uniqueExamCount: { $addToSet: "$examid" }
                }
            },
            {
                $addFields: {
                    uniqueExamCount: { $size: "$uniqueExamCount" }
                }
            },
            {
                $sort: { totalObtainPoints: -1 }
            },
            {
                $limit: 10
            },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "student"
                }
            },
            {
                $unwind: "$student"
            },
            {
                $project: {
                    _id: 1,
                    totalObtainPoints: 1,
                    "student.name": 1,
                    "student.college": 1
                }
            }
        ]);

        res.json({ students: topTenStudents });
    } catch (err) {
        console.error("Error fetching top ten scores for admin:", err);
        res.status(500).json({ status: "Something went wrong" });
    }
};
