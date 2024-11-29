const Scoreboard = require("../Schema/scoreboard")
const College = require("../Schema/college")
const Department = require("../Schema/department")
const Performance = require("../Schema/performance")
const Ranking = require("../Schema/ranking")
const Scoring = require("../Schema/scores")
const User = require("../Schema/user")
const Exam = require("../Schema/events")
const Section = require("../Schema/sections")
const SuperAdmin = require("../Schema/superadmin")
const jwt = require("jsonwebtoken")
const { department } = require("./college")
const secret = process.env.secret || "SuperK3y";

async function profileID(req) {
    const token = req.headers.authorization;
    if (!token) {
        return null;
    }

    try {
        const tok = token.slice(7);
        const decoded = jwt.verify(tok, secret);
        const user = await User.findOne({ _id: decoded.id });
        return user;
    } catch (err) {
        console.error("Error verifying token:", err);
        return null;
    }
}
exports.topTenScoresForstudent = async (req, res) => {
    try {
        const user = await profileID(req);
        
        if (!user || user.role !== 'student') {
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
                $sort: { 
                    totalObtainPoints: -1,
                    _id: 1 
                }
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
                $match: { 
                    "student.college": user.college 
                }
            },
            
            {
                $group: {
                    _id: "$totalObtainPoints",
                    students: { 
                        $push: {
                            student: {
                                _id: "$_id",
                                name: "$student.name",
                                college: "$student.college"
                            },
                            totalObtainPoints: "$totalObtainPoints"
                        }
                    }
                }
            },
            
            {
                $sort: { _id: -1 }
            },
            
            {
                $unwind: "$students"
            },
            
            {
                $replaceRoot: { 
                    newRoot: "$students" 
                }
            },
            
            {
                $limit: 10
            },

            {
                $project: {
                    _id: 1,
                    totalObtainPoints: 1,
                    student: 1
                }
            }
        ]);

        res.json({ students: topTenStudents });
    } catch (err) {
        console.error("Error fetching top ten scores for college:", err);
        res.status(500).json({ status: "Something went wrong" });
    }
};
